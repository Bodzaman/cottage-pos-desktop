// Unified microphone capture + simple VAD utility
// - Provides a reusable mic pipeline for both WebRTC (Ultravox/LiveKit) and Gemini Live
// - Default behavior: capture only (no VAD) to preserve existing UX
// - When enabled, VAD emits speechStart/speechEnd based on an energy threshold

export type SpeechEvent = "speechStart" | "speechEnd";

export interface VADConfig {
  energyThreshold?: number; // 0..1 (RMS), default 0.01
  minSpeechMs?: number;     // debounce for start, default 120ms
  minSilenceMs?: number;    // debounce for end, default 300ms
}

export interface MicOptions {
  sampleRate?: number;      // e.g. 16000 for Gemini, 24000 for Ultravox
  bufferSize?: 256 | 512 | 1024 | 2048 | 4096 | 8192 | 16384; // ScriptProcessor buffer size
  channelCount?: number;    // default 1
  enableVAD?: boolean;      // default false
  vad?: VADConfig;          // optional VAD tuning
  constraints?: MediaTrackConstraints; // extra getUserMedia constraints
}

export interface MicPipelineController {
  audioContext: AudioContext | null;
  mediaStream: MediaStream | null;
  sourceNode: MediaStreamAudioSourceNode | null;
  scriptNode: ScriptProcessorNode | null;
  // Subscribe to raw audio frames (Float32 mono)
  onAudioFrame: (cb: (frame: Float32Array) => void) => void;
  // Subscribe to VAD events (speechStart/speechEnd)
  onSpeechEvent: (cb: (ev: SpeechEvent) => void) => void;
  // Stop and cleanup
  stop: () => void;
}

export function createMicPipeline(options: MicOptions = {}): MicPipelineController {
  const {
    sampleRate = 16000,
    bufferSize = 4096,
    channelCount = 1,
    enableVAD = false,
    vad = {},
    constraints = {}
  } = options;

  // Internal state
  let audioContext: AudioContext | null = null;
  let mediaStream: MediaStream | null = null;
  let sourceNode: MediaStreamAudioSourceNode | null = null;
  let scriptNode: ScriptProcessorNode | null = null;
  let frameCallbacks: Array<(f: Float32Array) => void> = [];
  let speechCallbacks: Array<(e: SpeechEvent) => void> = [];

  // VAD internals
  const energyThreshold = vad.energyThreshold ?? 0.01; // RMS
  const minSpeechMs = vad.minSpeechMs ?? 120;
  const minSilenceMs = vad.minSilenceMs ?? 300;
  let speaking = false;
  let msAbove = 0;
  let msBelow = 0;

  const init = async () => {
    // Create AudioContext at requested sample rate
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate,
    });

    // Get mic
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...constraints,
      },
      video: false,
    });

    // Source and processor
    sourceNode = audioContext.createMediaStreamSource(mediaStream);
    scriptNode = audioContext.createScriptProcessor(bufferSize, channelCount, channelCount);

    scriptNode.onaudioprocess = (e: AudioProcessingEvent) => {
      const input = e.inputBuffer.getChannelData(0);

      // Emit raw frame to subscribers
      if (frameCallbacks.length) {
        // Copy to avoid mutation by downstream
        const frame = new Float32Array(input.length);
        frame.set(input);
        for (const cb of frameCallbacks) cb(frame);
      }

      if (enableVAD) {
        // Simple RMS-based VAD
        let sumSq = 0;
        for (let i = 0; i < input.length; i++) {
          const s = input[i];
          sumSq += s * s;
        }
        const rms = Math.sqrt(sumSq / input.length);
        const frameMs = (input.length / sampleRate) * 1000;

        if (rms >= energyThreshold) {
          msAbove += frameMs;
          msBelow = 0;
          if (!speaking && msAbove >= minSpeechMs) {
            speaking = true;
            for (const cb of speechCallbacks) cb("speechStart");
          }
        } else {
          msBelow += frameMs;
          msAbove = 0;
          if (speaking && msBelow >= minSilenceMs) {
            speaking = false;
            for (const cb of speechCallbacks) cb("speechEnd");
          }
        }
      }
    };

    // Wire graph
    sourceNode.connect(scriptNode);
    // Connect to destination at very low gain to keep context alive without audible output
    scriptNode.connect(audioContext.destination);
  };

  // Kick off init immediately for convenience
  // Note: callers should await first onAudioFrame callback or check audioContext state if needed
  init().catch((e) => {
    console.error("MicPipeline init failed:", e);
  });

  const stop = () => {
    try { scriptNode?.disconnect(); } catch {}
    try { sourceNode?.disconnect(); } catch {}
    try { mediaStream?.getTracks().forEach(t => t.stop()); } catch {}
    try { audioContext?.close(); } catch {}
    scriptNode = null;
    sourceNode = null;
    mediaStream = null;
    audioContext = null;
    frameCallbacks = [];
    speechCallbacks = [];
  };

  return {
    get audioContext() { return audioContext; },
    get mediaStream() { return mediaStream; },
    get sourceNode() { return sourceNode; },
    get scriptNode() { return scriptNode; },
    onAudioFrame: (cb) => { frameCallbacks.push(cb); },
    onSpeechEvent: (cb) => { speechCallbacks.push(cb); },
    stop,
  } as MicPipelineController;
}

// Convenience helper to just acquire a MediaStream with recommended defaults
export async function getUserMediaStream(sampleRate = 24000, extra?: MediaTrackConstraints): Promise<MediaStream> {
  await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => { /* prompt permission */ });
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate,
      channelCount: 1,
      ...(extra || {}),
    },
    video: false,
  });
}
