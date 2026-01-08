import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Loader2, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { GeminiVoiceClient, GeminiVoiceState } from "utils/geminiVoiceClient";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QSAITheme, styles as qsaiStyles } from "utils/QSAIDesign";

// Reusable voice testing component - extracted from GeminiVoiceLab
// Allows testing voice AI configuration with live cart display and function call monitoring

const stateLabel: Record<GeminiVoiceState, string> = {
  idle: "Idle",
  "requesting-token": "Preparing token...",
  connecting: "Connecting...",
  connected: "Connected",
  listening: "Listening...",
  stopping: "Stopping...",
  closed: "Closed",
  error: "Error",
};

interface CartItem {
  name: string;
  quantity: number;
  notes?: string;
}

interface FunctionCallLog {
  timestamp: string;
  name: string;
  args: any;
}

interface Props {
  systemPrompt?: string; // Optional override for testing unsaved prompts
  firstResponse?: string; // Optional override
  voiceModel?: string; // Optional override (e.g., "Puck", "Charon")
  onCartUpdate?: (items: CartItem[]) => void; // Callback when cart changes
}

export default function VoiceTester({
  systemPrompt,
  firstResponse,
  voiceModel = "Puck",
  onCartUpdate,
}: Props) {
  const [state, setState] = useState<GeminiVoiceState>("idle");
  const [assistantText, setAssistantText] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [functionCalls, setFunctionCalls] = useState<FunctionCallLog[]>([]);
  const clientRef = useRef<GeminiVoiceClient | null>(null);

  useEffect(() => {
    // Initialize a fresh client when component mounts or props change
    clientRef.current = new GeminiVoiceClient({
      voiceName: voiceModel,
      systemPrompt: systemPrompt,
      firstResponse: firstResponse,
      onStateChange: setState,
      onServerText: (t) => setAssistantText((prev) => prev + t),
      onError: (e) => toast.error(e),
      onCartUpdate: (action, item) => {
        if (action === 'add') {
          setCart((prev) => {
            const existing = prev.find((i) => i.name.toLowerCase() === item.name.toLowerCase());
            if (existing) {
              const updated = prev.map((i) =>
                i.name.toLowerCase() === item.name.toLowerCase()
                  ? { ...i, quantity: i.quantity + (item.quantity || 1), notes: item.notes || i.notes }
                  : i
              );
              onCartUpdate?.(updated);
              return updated;
            }
            const updated = [...prev, { name: item.name, quantity: item.quantity || 1, notes: item.notes }];
            onCartUpdate?.(updated);
            return updated;
          });
          toast.success(`Added ${item.quantity || 1}x ${item.name}`);
        } else if (action === 'remove') {
          setCart((prev) => {
            const updated = prev.filter((i) => i.name.toLowerCase() !== item.name.toLowerCase());
            onCartUpdate?.(updated);
            return updated;
          });
          toast.info(`Removed ${item.name}`);
        }
      },
      onFunctionCall: (name, args) => {
        setFunctionCalls((prev) => [
          { timestamp: new Date().toLocaleTimeString(), name, args },
          ...prev.slice(0, 9), // Keep last 10
        ]);
      },
    });

    return () => {
      clientRef.current?.stop();
      clientRef.current = null;
    };
  }, [voiceModel, onCartUpdate]);

  const isBusy = state === "requesting-token" || state === "connecting" || state === "stopping";
  const isListening = state === "listening";

  const handleStart = async () => {
    try {
      setAssistantText("");
      await clientRef.current?.start();
      toast.message("Voice session started — speak naturally.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to start voice session");
    }
  };

  const handleStop = async () => {
    await clientRef.current?.stop();
  };

  const clearCart = () => {
    setCart([]);
    onCartUpdate?.([]);
    toast.info("Cart cleared");
  };

  const updateQuantity = (itemName: string, delta: number) => {
    setCart((prev) => {
      const updated = prev
        .map((item) => {
          if (item.name === itemName) {
            const newQty = item.quantity + delta;
            return newQty <= 0 ? null : { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
      onCartUpdate?.(updated);
      return updated;
    });
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Controls + Assistant + Function Calls */}
      <div className="space-y-6">
        {/* Controls Card */}
        <Card 
          className="border-0"
          style={{
            background: QSAITheme.background.tertiary,
            border: `1px solid ${QSAITheme.border.medium}`,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          }}
        >
          <CardHeader>
            <CardTitle style={{ color: QSAITheme.text.primary }}>Voice Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {!isListening ? (
                <Button 
                  onClick={handleStart} 
                  disabled={isBusy} 
                  className="min-w-[120px] border-0"
                  style={{
                    background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
                    color: '#FFFFFF',
                    boxShadow: `0 0 15px ${QSAITheme.purple.glow}`,
                  }}
                >
                  {isBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mic className="h-4 w-4 mr-2" />}
                  Start Call
                </Button>
              ) : (
                <Button 
                  onClick={handleStop} 
                  className="min-w-[120px] border-0"
                  style={{
                    background: 'linear-gradient(135deg, #991B1B 0%, #DC2626 100%)',
                    color: '#FFFFFF',
                  }}
                >
                  <MicOff className="h-4 w-4 mr-2" /> Hang Up
                </Button>
              )}
              <div className="text-sm" style={{ color: QSAITheme.text.muted }}>
                Status: <span className="font-medium" style={{ color: QSAITheme.text.primary }}>{stateLabel[state]}</span>
              </div>
            </div>
            <div className="mt-3 text-xs" style={{ color: QSAITheme.text.muted }}>
              💡 Try: "I'd like two chicken tikka please" or "Does the lamb tikka have any allergens?"
            </div>
          </CardContent>
        </Card>

        {/* Assistant Response Card */}
        <Card 
          className="border-0"
          style={{
            background: QSAITheme.background.tertiary,
            border: `1px solid ${QSAITheme.border.medium}`,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          }}
        >
          <CardHeader>
            <CardTitle style={{ color: QSAITheme.text.primary }}>Assistant Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="whitespace-pre-wrap text-sm leading-6 min-h-[160px] p-3 rounded-md"
              style={{
                background: QSAITheme.background.panel,
                border: `1px solid ${QSAITheme.border.light}`,
                color: QSAITheme.text.secondary,
              }}
            >
              {assistantText || "I'm ready. Tap Start Call and speak your order or ask about the menu."}
            </div>
          </CardContent>
        </Card>

        {/* Function Call Log Card */}
        <Card 
          className="border-0"
          style={{
            background: QSAITheme.background.tertiary,
            border: `1px solid ${QSAITheme.border.medium}`,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          }}
        >
          <CardHeader>
            <CardTitle style={{ color: QSAITheme.text.primary }}>Function Call Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {functionCalls.length === 0 ? (
                <div className="text-sm text-center py-4" style={{ color: QSAITheme.text.muted }}>
                  No function calls yet
                </div>
              ) : (
                functionCalls.map((call, idx) => (
                  <div 
                    key={idx} 
                    className="text-xs p-2 rounded"
                    style={{
                      background: QSAITheme.background.panel,
                      border: `1px solid ${QSAITheme.border.light}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className="text-xs border-0"
                        style={{
                          background: QSAITheme.background.highlight,
                          color: QSAITheme.text.muted,
                        }}
                      >
                        {call.timestamp}
                      </Badge>
                      <span className="font-mono font-semibold" style={{ color: QSAITheme.purple.light }}>
                        {call.name}
                      </span>
                    </div>
                    <pre className="mt-1 overflow-x-auto" style={{ color: QSAITheme.text.muted }}>
                      {JSON.stringify(call.args, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Live Cart */}
      <div>
        <Card 
          className="border-0 sticky top-6"
          style={{
            background: QSAITheme.background.tertiary,
            border: `1px solid ${QSAITheme.border.accent}`,
            boxShadow: `0 4px 12px ${QSAITheme.purple.glow}`,
          }}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2" style={{ color: QSAITheme.text.primary }}>
                <ShoppingCart className="h-5 w-5" style={{ color: QSAITheme.purple.primary }} />
                Live Cart
                {totalItems > 0 && (
                  <Badge 
                    className="border-0"
                    style={{
                      background: QSAITheme.purple.primary,
                      color: '#FFFFFF',
                    }}
                  >
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </Badge>
                )}
              </CardTitle>
              {cart.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearCart}
                  style={{ color: QSAITheme.text.muted }}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-12" style={{ color: QSAITheme.text.muted }}>
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs mt-1">Voice order items to see them appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 rounded-lg"
                    style={{
                      background: QSAITheme.background.panel,
                      border: `1px solid ${QSAITheme.border.light}`,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium" style={{ color: QSAITheme.text.primary }}>
                          {item.name}
                        </div>
                        {item.notes && (
                          <div className="text-xs mt-1 italic" style={{ color: QSAITheme.text.muted }}>
                            "{item.notes}"
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 border-0"
                          style={{
                            background: QSAITheme.background.highlight,
                            color: QSAITheme.text.primary,
                          }}
                          onClick={() => updateQuantity(item.name, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-semibold min-w-[24px] text-center" style={{ color: QSAITheme.text.primary }}>
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 border-0"
                          style={{
                            background: QSAITheme.background.highlight,
                            color: QSAITheme.text.primary,
                          }}
                          onClick={() => updateQuantity(item.name, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Separator style={{ background: QSAITheme.border.medium }} className="my-4" />
                <div 
                  className="text-sm text-center"
                  style={{ color: QSAITheme.purple.light }}
                >
                  ✅ Voice ordering working! These items were added by AI.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
