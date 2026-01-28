// Unified microphone capture + simple VAD utility
// - Provides a reusable mic pipeline for both WebRTC (Ultravox/LiveKit) and Gemini Live
// - Default behavior: capture only (no VAD) to preserve existing UX
// - When enabled, VAD emits speechStart/speechEnd based on an energy threshold
//
// iOS Safari Compatibility (Critical):
// - iOS Safari does NOT resample mic input to match AudioContext sample rate
// - We MUST create AudioContext at native rate and manually resample to target rate
// - This is why desktop works but mobile fails without proper handling

export type SpeechEvent = "speechStart" | "speechEnd";

export interface VADConfig {
  energyThreshold?: number; // 0..1 (RMS), default 0.01 - used as fallback if calibration fails
  minSpeechMs?: number;     // debounce for start, default 120ms
  minSilenceMs?: number;    // debounce for end, default 300ms
  autoCalibrate?: boolean;  // auto-calibrate threshold from ambient noise (default true)
  calibrationMs?: number;   // calibration period in ms (default 500)
  calibrationMultiplier?: number; // threshold = noiseFloor * multiplier (default 2.0)
}

export interface MicOptions {
  sampleRate?: number;      // e.g. 16000 for Gemini, 24000 for Ultravox (target output rate)
  bufferSize?: 256 | 512 | 1024 | 2048 | 4096 | 8192 | 16384; // ScriptProcessor buffer size
  channelCount?: number;    // default 1
  enableVAD?: boolean;      // default false
  vad?: VADConfig;          // optional VAD tuning
  constraints?: MediaTrackConstraints; // extra getUserMedia constraints
  // Pre-warmed resources (created in user gesture context for iOS compatibility)
  existingAudioContext?: AudioContext;
  existingMediaStream?: MediaStream;
}

export interface MicPipelineController {
  audioContext: AudioContext | null;
  mediaStream: MediaStream | null;
  sourceNode: MediaStreamAudioSourceNode | null;
  scriptNode: ScriptProcessorNode | null;
  // Subscribe to raw audio frames (Float32 mono) - already resampled to target rate
  onAudioFrame: (cb: (frame: Float32Array) => void) => void;
  // Subscribe to VAD events (speechStart/speechEnd)
  onSpeechEvent: (cb: (ev: SpeechEvent) => void) => void;
  // Stop and cleanup
  stop: () => void;
  // Promise that resolves when pipeline is ready (AudioContext running, mic connected)
  ready: Promise<void>;
  // Actual sample rate of the AudioContext (may differ from requested on iOS)
  actualSampleRate: number;
  // Target sample rate for output frames (resampled)
  targetSampleRate: number;
}

/**
 * Detect if running on iOS Safari (requires special audio handling)
 */
function isIOSSafari(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/chrome/.test(ua) && !/crios/.test(ua) && !/fxios/.test(ua);
  // On iOS, all browsers use WebKit, so we check for iOS regardless of browser
  return isIOS;
}

/**
 * Detect if running on any mobile device
 */
function isMobileDevice(): boolean {
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    navigator.userAgent.toLowerCase()
  );
}

/**
 * Linear interpolation resampler
 * Converts audio from sourceSampleRate to targetSampleRate
 */
function resampleAudio(
  input: Float32Array,
  sourceSampleRate: number,
  targetSampleRate: number
): Float32Array {
  if (sourceSampleRate === targetSampleRate) {
    return input;
  }

  const ratio = sourceSampleRate / targetSampleRate;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, input.length - 1);
    const fraction = srcIndex - srcIndexFloor;

    // Linear interpolation between samples
    output[i] = input[srcIndexFloor] * (1 - fraction) + input[srcIndexCeil] * fraction;
  }

  return output;
}

export function createMicPipeline(options: MicOptions = {}): MicPipelineController {
  const {
    sampleRate: targetSampleRate = 16000,
    bufferSize = 4096,
    channelCount = 1,
    enableVAD = false,
    vad = {},
    constraints = {},
    existingAudioContext,
    existingMediaStream,
  } = options;

  // Internal state
  let audioContext: AudioContext | null = null;
  let mediaStream: MediaStream | null = null;
  let sourceNode: MediaStreamAudioSourceNode | null = null;
  let scriptNode: ScriptProcessorNode | null = null;
  let frameCallbacks: Array<(f: Float32Array) => void> = [];
  let speechCallbacks: Array<(e: SpeechEvent) => void> = [];
  let actualSampleRate = targetSampleRate; // Will be updated after AudioContext creation

  // VAD internals
  const fallbackThreshold = vad.energyThreshold ?? 0.01; // RMS fallback if calibration fails
  const minSpeechMs = vad.minSpeechMs ?? 120;
  const minSilenceMs = vad.minSilenceMs ?? 300;
  const autoCalibrate = vad.autoCalibrate ?? true; // Enable auto-calibration by default
  const calibrationMs = vad.calibrationMs ?? 500; // 500ms calibration period
  const calibrationMultiplier = vad.calibrationMultiplier ?? 2.0; // threshold = noiseFloor * 2.0
  const minThreshold = 0.005; // Minimum threshold floor to prevent false positives
  const maxNoiseFloor = 0.05; // If ambient is too high (user talking), use fallback

  let speaking = false;
  let msAbove = 0;
  let msBelow = 0;

  // Calibration state
  let isCalibrated = !autoCalibrate; // If auto-calibrate disabled, start as calibrated
  let calibrationElapsedMs = 0;
  let calibrationSumRMS = 0;
  let calibrationSampleCount = 0;
  let adaptiveThreshold = fallbackThreshold; // Will be updated after calibration

  // Visibility change handler for iOS background/lock screen recovery
  let visibilityHandler: (() => void) | null = null;

  const init = async () => {
    // CRITICAL: iOS Safari does NOT resample mic input to match AudioContext sample rate
    // On mobile devices, we must create AudioContext at native rate and manually resample
    const isMobile = isMobileDevice();
    const isIOS = isIOSSafari();

    // Reuse pre-warmed AudioContext if provided (created in user gesture context for iOS)
    if (existingAudioContext) {
      audioContext = existingAudioContext;
      console.log(`[audioPipeline] Reusing pre-warmed AudioContext (state: ${audioContext.state}, rate: ${audioContext.sampleRate}Hz)`);
    } else {
      // On iOS/mobile: don't specify sample rate, let browser use native (typically 48000)
      // On desktop: can request specific sample rate (browsers handle resampling)
      const contextOptions: AudioContextOptions = isMobile ? {} : { sampleRate: targetSampleRate };
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)(contextOptions);
      console.log(`[audioPipeline] Created new AudioContext`);
    }

    actualSampleRate = audioContext.sampleRate;

    console.log(`[audioPipeline] Platform: ${isIOS ? 'iOS' : isMobile ? 'Mobile' : 'Desktop'}`);
    console.log(`[audioPipeline] AudioContext at ${actualSampleRate}Hz (target: ${targetSampleRate}Hz)`);

    if (actualSampleRate !== targetSampleRate) {
      console.log(`[audioPipeline] Will resample from ${actualSampleRate}Hz to ${targetSampleRate}Hz`);
    }

    // iOS Safari requires explicit resume in user gesture context
    if (audioContext.state === 'suspended') {
      console.log('[audioPipeline] AudioContext suspended, resuming...');
      await audioContext.resume();
    }

    // Verify AudioContext is running
    if (audioContext.state !== 'running') {
      console.warn(`[audioPipeline] AudioContext state: ${audioContext.state}, attempting resume...`);
      await audioContext.resume();
    }

    console.log(`[audioPipeline] AudioContext state after resume: ${audioContext.state}`);

    // Reuse pre-warmed MediaStream if provided, otherwise acquire mic
    if (existingMediaStream) {
      mediaStream = existingMediaStream;
      console.log(`[audioPipeline] Reusing pre-warmed MediaStream (active: ${mediaStream.active}, tracks: ${mediaStream.getAudioTracks().length})`);
    } else {
      // Get mic - don't specify sampleRate constraint as iOS ignores it
      // The browser will capture at its native rate
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
    }

    // Log actual track settings for debugging
    const audioTrack = mediaStream.getAudioTracks()[0];
    if (audioTrack) {
      const settings = audioTrack.getSettings();
      console.log(`[audioPipeline] MediaStream track settings:`, {
        sampleRate: settings.sampleRate,
        channelCount: settings.channelCount,
        echoCancellation: settings.echoCancellation,
        noiseSuppression: settings.noiseSuppression,
        autoGainControl: settings.autoGainControl,
      });
    }

    // Source and processor
    sourceNode = audioContext.createMediaStreamSource(mediaStream);
    scriptNode = audioContext.createScriptProcessor(bufferSize, channelCount, channelCount);

    // Setup visibility change handler for iOS background/lock screen
    visibilityHandler = async () => {
      if (document.visibilityState === 'visible' && audioContext?.state === 'suspended') {
        try {
          await audioContext.resume();
          console.log('[audioPipeline] AudioContext resumed after visibility change');
        } catch (e) {
          console.error('[audioPipeline] Failed to resume AudioContext:', e);
        }
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    scriptNode.onaudioprocess = (e: AudioProcessingEvent) => {
      const input = e.inputBuffer.getChannelData(0);

      // Resample if necessary (iOS Safari captures at 48kHz, Gemini needs 16kHz)
      const needsResample = actualSampleRate !== targetSampleRate;
      const resampledFrame = needsResample
        ? resampleAudio(input, actualSampleRate, targetSampleRate)
        : input;

      // Emit resampled frame to subscribers
      if (frameCallbacks.length) {
        // Copy to avoid mutation by downstream
        const frame = new Float32Array(resampledFrame.length);
        frame.set(resampledFrame);
        for (const cb of frameCallbacks) cb(frame);
      }

      if (enableVAD) {
        // Calculate RMS for this frame (use original input for VAD, not resampled)
        let sumSq = 0;
        for (let i = 0; i < input.length; i++) {
          const s = input[i];
          sumSq += s * s;
        }
        const rms = Math.sqrt(sumSq / input.length);
        // Use actual sample rate for timing calculations
        const frameMs = (input.length / actualSampleRate) * 1000;

        // Calibration phase: collect ambient noise samples
        if (!isCalibrated) {
          calibrationElapsedMs += frameMs;
          calibrationSumRMS += rms;
          calibrationSampleCount++;

          // Calibration complete
          if (calibrationElapsedMs >= calibrationMs) {
            const noiseFloor = calibrationSumRMS / calibrationSampleCount;

            // If ambient noise is too high (user talking during calibration), use fallback
            if (noiseFloor > maxNoiseFloor) {
              adaptiveThreshold = fallbackThreshold;
              console.log(`[VAD] Calibration: ambient too high (${noiseFloor.toFixed(4)}), using fallback ${fallbackThreshold}`);
            } else {
              // Set threshold = noiseFloor * multiplier, with minimum floor
              adaptiveThreshold = Math.max(noiseFloor * calibrationMultiplier, minThreshold);
              console.log(`[VAD] Calibrated: noise=${noiseFloor.toFixed(4)}, threshold=${adaptiveThreshold.toFixed(4)}`);
            }

            isCalibrated = true;
          }
          return; // Don't do VAD detection during calibration
        }

        // VAD detection using adaptive threshold
        if (rms >= adaptiveThreshold) {
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

  // Create ready promise that resolves when init completes
  // Callers should await this before expecting audio frames
  const readyPromise = init().catch((e) => {
    console.error("MicPipeline init failed:", e);
    throw e; // Re-throw so callers can handle
  });

  const stop = () => {
    // Remove visibility change handler
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }
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
    get actualSampleRate() { return actualSampleRate; },
    get targetSampleRate() { return targetSampleRate; },
    onAudioFrame: (cb) => { frameCallbacks.push(cb); },
    onSpeechEvent: (cb) => { speechCallbacks.push(cb); },
    stop,
    ready: readyPromise,
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
