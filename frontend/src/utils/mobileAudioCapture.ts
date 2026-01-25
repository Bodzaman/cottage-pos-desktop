/**
 * Mobile Audio Capture - iOS Safari and Android Chrome Compatible
 *
 * Handles the specific requirements for audio capture on mobile devices:
 *
 * iOS Safari Requirements:
 * - AudioContext must be created/resumed in response to user gesture
 * - getUserMedia must be called in user gesture handler
 * - Handles visibility changes (tab switch, lock screen)
 * - No PWA mode required - works in regular Safari
 *
 * Android Chrome:
 * - Similar to iOS but more lenient
 * - AutoPlay policy still requires user gesture for AudioContext
 *
 * Desktop:
 * - Standard Web Audio API usage
 *
 * @module mobileAudioCapture
 */

export interface MobileAudioCaptureOptions {
  /** Target sample rate for output (default: 16000 for Gemini) */
  sampleRate?: number;

  /** Buffer size for processing (default: 4096) */
  bufferSize?: number;

  /** Number of audio channels (default: 1 for mono) */
  channelCount?: number;

  /** Enable echo cancellation (default: true) */
  echoCancellation?: boolean;

  /** Enable noise suppression (default: true) */
  noiseSuppression?: boolean;

  /** Enable automatic gain control (default: true) */
  autoGainControl?: boolean;

  /** Callback for audio frames (PCM data) */
  onAudioFrame?: (data: Float32Array) => void;

  /** Callback for state changes */
  onStateChange?: (state: AudioCaptureState) => void;

  /** Callback for errors */
  onError?: (error: AudioCaptureError) => void;
}

export type AudioCaptureState =
  | 'idle'
  | 'requesting_permission'
  | 'initializing'
  | 'active'
  | 'paused'
  | 'suspended'
  | 'stopped'
  | 'error';

export interface AudioCaptureError {
  code: 'permission_denied' | 'not_supported' | 'initialization_failed' | 'capture_failed';
  message: string;
  originalError?: Error;
}

export interface AudioCaptureMetrics {
  sampleRate: number;
  bufferSize: number;
  totalFrames: number;
  droppedFrames: number;
  averageLatency: number;
}

/**
 * MobileAudioCapture - Cross-device compatible audio capture
 *
 * Usage:
 * ```typescript
 * const capture = new MobileAudioCapture({
 *   sampleRate: 16000,
 *   onAudioFrame: (data) => sendToServer(data),
 *   onStateChange: (state) => updateUI(state)
 * });
 *
 * // MUST be called in user gesture handler (click, tap)
 * button.onclick = async () => {
 *   await capture.initialize();
 *   capture.start();
 * };
 * ```
 */
export class MobileAudioCapture {
  private options: Required<MobileAudioCaptureOptions>;
  private state: AudioCaptureState = 'idle';

  // Web Audio API components
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;

  // Metrics tracking
  private totalFrames: number = 0;
  private droppedFrames: number = 0;
  private latencySamples: number[] = [];
  private isPaused: boolean = false;

  // Visibility handling
  private visibilityHandler: (() => void) | null = null;

  constructor(options: MobileAudioCaptureOptions = {}) {
    this.options = {
      sampleRate: options.sampleRate ?? 16000,
      bufferSize: options.bufferSize ?? 4096,
      channelCount: options.channelCount ?? 1,
      echoCancellation: options.echoCancellation ?? true,
      noiseSuppression: options.noiseSuppression ?? true,
      autoGainControl: options.autoGainControl ?? true,
      onAudioFrame: options.onAudioFrame ?? (() => {}),
      onStateChange: options.onStateChange ?? (() => {}),
      onError: options.onError ?? (() => {})
    };
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  get currentState(): AudioCaptureState {
    return this.state;
  }

  get isActive(): boolean {
    return this.state === 'active';
  }

  get metrics(): AudioCaptureMetrics {
    const avgLatency = this.latencySamples.length > 0
      ? this.latencySamples.reduce((a, b) => a + b, 0) / this.latencySamples.length
      : 0;

    return {
      sampleRate: this.options.sampleRate,
      bufferSize: this.options.bufferSize,
      totalFrames: this.totalFrames,
      droppedFrames: this.droppedFrames,
      averageLatency: avgLatency
    };
  }

  /**
   * Initialize audio capture.
   * MUST be called in response to a user gesture on iOS Safari.
   *
   * @throws AudioCaptureError if initialization fails
   */
  async initialize(): Promise<void> {
    if (this.state !== 'idle' && this.state !== 'stopped' && this.state !== 'error') {
      console.warn('MobileAudioCapture: Already initialized');
      return;
    }

    try {
      this.setState('requesting_permission');

      // Check for browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw this.createError('not_supported', 'getUserMedia is not supported in this browser');
      }

      // Create AudioContext (must be in user gesture handler on iOS)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw this.createError('not_supported', 'Web Audio API is not supported in this browser');
      }

      this.setState('initializing');

      // Create AudioContext with target sample rate
      this.audioContext = new AudioContextClass({
        sampleRate: this.options.sampleRate
      });

      // iOS Safari requires explicit resume after user gesture
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: this.options.echoCancellation,
          noiseSuppression: this.options.noiseSuppression,
          autoGainControl: this.options.autoGainControl,
          channelCount: this.options.channelCount,
          sampleRate: this.options.sampleRate
        }
      });

      // Create audio processing pipeline
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.scriptNode = this.audioContext.createScriptProcessor(
        this.options.bufferSize,
        this.options.channelCount,
        this.options.channelCount
      );

      // Setup visibility change handler for iOS
      this.setupVisibilityHandling();

      this.setState('paused'); // Initialized but not yet streaming

    } catch (error: any) {
      const captureError = this.handleInitializationError(error);
      this.options.onError(captureError);
      this.setState('error');
      throw captureError;
    }
  }

  /**
   * Start audio capture.
   * initialize() must be called first.
   */
  start(): void {
    if (!this.audioContext || !this.sourceNode || !this.scriptNode) {
      console.error('MobileAudioCapture: Not initialized. Call initialize() first.');
      return;
    }

    if (this.state === 'active') {
      return; // Already active
    }

    this.isPaused = false;

    // Connect audio nodes
    this.sourceNode.connect(this.scriptNode);
    this.scriptNode.connect(this.audioContext.destination);

    // Setup audio processing callback
    this.scriptNode.onaudioprocess = (event) => {
      if (this.isPaused) return;

      const startTime = performance.now();
      const input = event.inputBuffer.getChannelData(0);

      this.totalFrames++;
      this.options.onAudioFrame(input);

      // Track latency
      const latency = performance.now() - startTime;
      this.latencySamples.push(latency);
      if (this.latencySamples.length > 100) {
        this.latencySamples.shift();
      }
    };

    this.setState('active');
  }

  /**
   * Pause audio capture without releasing resources.
   */
  pause(): void {
    if (this.state !== 'active') return;

    this.isPaused = true;
    this.setState('paused');
  }

  /**
   * Resume audio capture after pause.
   */
  resume(): void {
    if (this.state !== 'paused' && this.state !== 'suspended') return;

    // Resume AudioContext if suspended (iOS background/lock screen)
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume().then(() => {
        this.isPaused = false;
        this.setState('active');
      });
    } else {
      this.isPaused = false;
      this.setState('active');
    }
  }

  /**
   * Stop audio capture and release all resources.
   */
  stop(): void {
    // Remove visibility handler
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }

    // Disconnect and cleanup audio nodes
    if (this.scriptNode) {
      this.scriptNode.disconnect();
      this.scriptNode.onaudioprocess = null;
      this.scriptNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    // Stop all media tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Close AudioContext
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Reset metrics
    this.totalFrames = 0;
    this.droppedFrames = 0;
    this.latencySamples = [];
    this.isPaused = false;

    this.setState('stopped');
  }

  // ==========================================================================
  // VISIBILITY HANDLING (iOS Safari background/lock screen)
  // ==========================================================================

  private setupVisibilityHandling(): void {
    this.visibilityHandler = async () => {
      if (document.visibilityState === 'visible') {
        // Tab/app became visible - resume if we were active
        if (this.audioContext?.state === 'suspended' && this.state === 'suspended') {
          try {
            await this.audioContext.resume();
            this.setState('active');
          } catch (error) {
            // AudioContext resume failed - requires user gesture on mobile
            // This can happen if the user switched tabs during a voice call
            this.options.onError({
              code: 'capture_failed',
              message: 'Microphone paused. Tap to resume.',
              originalError: error as Error
            });
            this.setState('error');
          }
        }
      } else {
        // Tab/app became hidden - mark as suspended
        if (this.state === 'active') {
          this.setState('suspended');
        }
      }
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  private handleInitializationError(error: any): AudioCaptureError {
    // Check for permission denied
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return this.createError(
        'permission_denied',
        'Microphone permission was denied. Please allow microphone access and try again.',
        error
      );
    }

    // Check for not supported
    if (error.name === 'NotSupportedError' || error.name === 'NotFoundError') {
      return this.createError(
        'not_supported',
        'No microphone found or audio capture is not supported on this device.',
        error
      );
    }

    // Generic initialization error
    return this.createError(
      'initialization_failed',
      error.message || 'Failed to initialize audio capture',
      error
    );
  }

  private createError(
    code: AudioCaptureError['code'],
    message: string,
    originalError?: Error
  ): AudioCaptureError {
    return { code, message, originalError };
  }

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  private setState(newState: AudioCaptureState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.options.onStateChange(newState);
    }
  }
}

// ==============================================================================
// FACTORY FUNCTIONS
// ==============================================================================

/**
 * Create a new MobileAudioCapture instance.
 */
export function createMobileAudioCapture(options: MobileAudioCaptureOptions = {}): MobileAudioCapture {
  return new MobileAudioCapture(options);
}

/**
 * Check if audio capture is supported on this device/browser.
 */
export function isAudioCaptureSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    (window.AudioContext || (window as any).webkitAudioContext)
  );
}

/**
 * Request microphone permission without starting capture.
 * Useful for pre-flight permission check.
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Immediately stop the stream - we just wanted to check permission
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch {
    return false;
  }
}

export default MobileAudioCapture;
