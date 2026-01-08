import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { GeminiVoiceClient, GeminiVoiceState } from "utils/geminiVoiceClient";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const stateLabel: Record<GeminiVoiceState, string> = {
  idle: "Idle",
  "requesting-token": "Preparing...",
  connecting: "Connecting...",
  connected: "Connected",
  listening: "Listening...",
  stopping: "Stopping...",
  closed: "Closed",
  error: "Error",
};

export default function GeminiVoiceOrderingModal({ isOpen, onClose }: Props) {
  const [state, setState] = useState<GeminiVoiceState>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const clientRef = useRef<GeminiVoiceClient | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTranscript("");
    setState("idle");
    clientRef.current = new GeminiVoiceClient({
      voiceName: "Puck",
      onStateChange: setState,
      onServerText: (t) => setTranscript((prev) => prev + t),
      onError: (e) => toast.error(e),
    });
    return () => {
      clientRef.current?.stop();
      clientRef.current = null;
    };
  }, [isOpen]);

  const isBusy = state === "requesting-token" || state === "connecting" || state === "stopping";
  const isListening = state === "listening";

  const handleStart = async () => {
    try {
      await clientRef.current?.start();
      toast.message("Voice session started — speak naturally.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to start voice session");
    }
  };

  const handleStop = async () => {
    await clientRef.current?.stop();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-background text-foreground border-border p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h3 className="font-semibold">Voice Ordering (Gemini Live – Beta)</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-lg border border-border p-4 bg-card">
            <div className="text-sm text-muted-foreground mb-2">Status</div>
            <div className="text-base font-medium">{stateLabel[state]}</div>
          </div>

          <div className="rounded-lg border border-border p-4 bg-card min-h-[140px]">
            <div className="text-sm text-muted-foreground mb-2">Assistant</div>
            <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-6">
              {transcript || "I\'m ready to help you order. Tap Start, then speak."}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isListening ? (
              <Button onClick={handleStart} disabled={isBusy} className="flex-1">
                {isBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mic className="h-4 w-4 mr-2" />}
                Start
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleStop} className="flex-1">
                <MicOff className="h-4 w-4 mr-2" /> Stop
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Tips: Allow microphone access. Speak clearly. You\'ll hear the assistant reply with voice.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
