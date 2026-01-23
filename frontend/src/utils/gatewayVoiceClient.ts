/**
 * Gateway Voice Client - WebSocket-based Voice AI through Backend Proxy
 *
 * This client connects to our backend WebSocket gateway instead of directly
 * to Google Gemini Live API. This architecture enables:
 *
 * 1. iOS Safari compatibility (handles AudioContext/getUserMedia constraints)
 * 2. Session management (budgets, usage tracking, audit transcripts)
 * 3. Unified structured events (menu_refs, cart_proposals, suggested_actions)
 * 4. Function calling executed server-side via SessionManager
 * 5. Better error recovery and reconnection handling
 *
 * Protocol v1: JSON messages with base64 audio
 * Future v2: Binary audio frames + JSON control (compatible upgrade)
 *
 * @module gatewayVoiceClient
 */

import brain from 'brain';
import type { StructuredEvent, MenuRefsEvent, CartProposalEvent, SuggestedActionsEvent } from '../types/structured-events';

// ==============================================================================
// TYPES
// ==============================================================================

export type GatewayVoiceState =
  | 'idle'
  | 'initializing'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'processing'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export interface GatewayVoiceClientOptions {
  /** Callback for state changes */
  onStateChange?: (state: GatewayVoiceState) => void;

  /** Callback for text responses from AI */
  onTextDelta?: (text: string) => void;

  /** Callback for complete text response */
  onTextComplete?: (fullText: string) => void;

  /** Callback for menu item references (for rendering cards) */
  onMenuRefs?: (items: MenuRefsEvent['items']) => void;

  /** Callback for cart modification proposals */
  onCartProposal?: (proposal: CartProposalEvent['proposal']) => void;

  /** Callback for suggested action chips */
  onSuggestedActions?: (actions: SuggestedActionsEvent['actions']) => void;

  /** Callback for errors */
  onError?: (error: { code: string; message: string; recoverable: boolean }) => void;

  /** Callback for session metrics updates */
  onMetricsUpdate?: (metrics: SessionMetrics) => void;

  /** User ID for personalization (optional) */
  userId?: string;

  /** Order mode for pricing */
  orderMode?: 'delivery' | 'collection' | 'dine-in';
}

export interface SessionMetrics {
  sessionId: string;
  durationSeconds: number;
  tokensUsed: number;
  audioSecondsIn: number;
  audioSecondsOut: number;
  functionCalls: number;
  budgetRemaining: {
    tokens: number;
    audioSeconds: number;
  };
}

interface CreateSessionResponse {
  success: boolean;
  session_id: string;
  token: string;
  expires_at: string;
  budget: {
    tokens_remaining: number;
    audio_seconds_remaining: number;
  };
  error?: string;
}

// ==============================================================================
// GATEWAY VOICE CLIENT
// ==============================================================================

export class GatewayVoiceClient {
  private options: GatewayVoiceClientOptions;
  private state: GatewayVoiceState = 'idle';
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private token: string | null = null;

  // Audio capture
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;

  // Audio playback
  private outputAudioContext: AudioContext | null = null;
  private nextPlaybackTime: number = 0;
  private isPlaying: boolean = false;

  // State tracking
  private textBuffer: string = '';
  private metricsInterval: number | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private shouldSendAudio: boolean = true;

  constructor(options: GatewayVoiceClientOptions = {}) {
    this.options = options;
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  get currentState(): GatewayVoiceState {
    return this.state;
  }

  get isConnected(): boolean {
    return this.state === 'connected' || this.state === 'listening' || this.state === 'speaking' || this.state === 'processing';
  }

  /**
   * Start a voice session.
   * Must be called in response to a user gesture on iOS Safari.
   */
  async start(): Promise<void> {
    if (this.isConnected) {
      console.warn('GatewayVoiceClient: Already connected');
      return;
    }

    try {
      this.setState('initializing');

      // 1) Create session via REST endpoint
      const session = await this.createSession();
      if (!session.success || !session.token) {
        throw new Error(session.error || 'Failed to create voice session');
      }

      this.sessionId = session.session_id;
      this.token = session.token;

      // 2) Initialize audio capture (must be in user gesture handler on iOS)
      await this.initializeAudioCapture();

      // 3) Connect WebSocket
      this.setState('connecting');
      await this.connectWebSocket();

      // 4) Start sending audio
      this.startAudioStreaming();

      // 5) Start metrics polling
      this.startMetricsPolling();

      this.setState('listening');

    } catch (error: any) {
      console.error('GatewayVoiceClient: Start failed:', error);
      this.options.onError?.({
        code: 'start_failed',
        message: error.message || 'Failed to start voice session',
        recoverable: true
      });
      this.setState('error');
      await this.stop();
    }
  }

  /**
   * Stop the voice session and cleanup resources.
   */
  async stop(): Promise<void> {
    try {
      // Stop metrics polling
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
        this.metricsInterval = null;
      }

      // Send end control message
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendControlMessage('end');
      }

      // Close WebSocket
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      // Stop audio capture
      this.teardownAudioCapture();

      // Stop audio playback
      if (this.outputAudioContext) {
        await this.outputAudioContext.close();
        this.outputAudioContext = null;
      }

      this.sessionId = null;
      this.token = null;
      this.textBuffer = '';
      this.reconnectAttempts = 0;

      this.setState('disconnected');

    } catch (error) {
      console.warn('GatewayVoiceClient: Error during stop:', error);
      this.setState('disconnected');
    }
  }

  /**
   * Mute microphone input.
   */
  mute(): void {
    this.shouldSendAudio = false;
    this.sendControlMessage('mute');
  }

  /**
   * Unmute microphone input.
   */
  unmute(): void {
    this.shouldSendAudio = true;
    this.sendControlMessage('unmute');
  }

  /**
   * Send a text message (for hybrid voice+text mode).
   */
  sendTextMessage(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('GatewayVoiceClient: Cannot send text - not connected');
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'text',
      data: text,
      timestamp: Date.now()
    }));
  }

  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================

  private async createSession(): Promise<CreateSessionResponse> {
    try {
      // Call our backend to create session
      const response = await fetch('/routes/voice-gateway/session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.options.userId || null,
          order_mode: this.options.orderMode || 'collection'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error: any) {
      return {
        success: false,
        session_id: '',
        token: '',
        expires_at: '',
        budget: { tokens_remaining: 0, audio_seconds_remaining: 0 },
        error: error.message
      };
    }
  }

  private startMetricsPolling(): void {
    if (!this.sessionId) return;

    this.metricsInterval = window.setInterval(async () => {
      try {
        const response = await fetch(`/routes/voice-gateway/session/${this.sessionId}/status`);
        if (response.ok) {
          const status = await response.json();
          this.options.onMetricsUpdate?.({
            sessionId: status.session_id,
            durationSeconds: status.duration_seconds,
            tokensUsed: status.tokens_used,
            audioSecondsIn: status.audio_seconds_in,
            audioSecondsOut: status.audio_seconds_out,
            functionCalls: status.function_calls,
            budgetRemaining: status.budget_remaining
          });
        }
      } catch {
        // Ignore metrics fetch errors
      }
    }, 5000) as unknown as number; // Poll every 5 seconds
  }

  // ==========================================================================
  // WEBSOCKET HANDLING
  // ==========================================================================

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.sessionId || !this.token) {
        reject(new Error('No session credentials'));
        return;
      }

      // Construct WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/routes/voice-gateway/ws/voice/${this.sessionId}?token=${encodeURIComponent(this.token)}`;

      this.ws = new WebSocket(wsUrl);

      const timeout = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          this.ws.close();
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        this.handleWebSocketMessage(event.data);
      };

      this.ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error('GatewayVoiceClient: WebSocket error:', error);
        reject(new Error('WebSocket connection failed'));
      };

      this.ws.onclose = (event) => {
        clearTimeout(timeout);
        this.handleWebSocketClose(event);
      };
    });
  }

  private handleWebSocketMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      const msgType = message.type;

      switch (msgType) {
        case 'state':
          this.handleStateMessage(message);
          break;

        case 'text_delta':
          this.handleTextDelta(message);
          break;

        case 'audio':
          this.handleAudioMessage(message);
          break;

        case 'menu_refs':
          this.options.onMenuRefs?.(message.items);
          break;

        case 'suggested_actions':
          this.options.onSuggestedActions?.(message.actions);
          break;

        case 'cart_proposal':
          this.options.onCartProposal?.(message.proposal);
          break;

        case 'error':
          this.handleErrorMessage(message);
          break;

        case 'pong':
          // Keepalive response - ignore
          break;

        default:
          console.log('GatewayVoiceClient: Unknown message type:', msgType);
      }

    } catch (error) {
      console.error('GatewayVoiceClient: Failed to parse message:', error);
    }
  }

  private handleStateMessage(message: { status: string }): void {
    const statusMap: Record<string, GatewayVoiceState> = {
      'connecting': 'connecting',
      'listening': 'listening',
      'speaking': 'speaking',
      'processing': 'processing',
      'disconnected': 'disconnected'
    };

    const newState = statusMap[message.status];
    if (newState) {
      this.setState(newState);

      // Update shouldSendAudio based on state
      if (newState === 'speaking' || newState === 'processing') {
        this.shouldSendAudio = false;
      } else if (newState === 'listening') {
        this.shouldSendAudio = true;
      }
    }
  }

  private handleTextDelta(message: { text: string }): void {
    this.textBuffer += message.text;
    this.options.onTextDelta?.(message.text);
  }

  private handleAudioMessage(message: { data: string; sequence: number }): void {
    const pcm = this.base64ToPCM16(message.data);
    this.playAudioChunk(pcm);
  }

  private handleErrorMessage(message: { code: string; message: string; recoverable: boolean }): void {
    this.options.onError?.(message);

    if (!message.recoverable) {
      this.setState('error');
      this.stop();
    }
  }

  private handleWebSocketClose(event: CloseEvent): void {
    console.log('GatewayVoiceClient: WebSocket closed:', event.code, event.reason);

    // Don't reconnect if we intentionally closed
    if (this.state === 'disconnected' || this.state === 'error') {
      return;
    }

    // Attempt reconnection
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.setState('reconnecting');

      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`GatewayVoiceClient: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(async () => {
        try {
          await this.connectWebSocket();
          this.setState('listening');
        } catch {
          this.handleWebSocketClose(event);
        }
      }, delay);
    } else {
      this.options.onError?.({
        code: 'max_reconnects',
        message: 'Maximum reconnection attempts reached',
        recoverable: false
      });
      this.setState('error');
    }
  }

  private sendControlMessage(action: 'mute' | 'unmute' | 'end' | 'ping'): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'control', action }));
    }
  }

  // ==========================================================================
  // AUDIO CAPTURE
  // ==========================================================================

  private async initializeAudioCapture(): Promise<void> {
    // Create AudioContext (must be in user gesture handler on iOS)
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass({ sampleRate: 16000 });

    // iOS Safari requires resume() after user gesture
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Request microphone access
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 16000
      }
    });

    // Create audio processing pipeline
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.scriptNode = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.sourceNode.connect(this.scriptNode);
    this.scriptNode.connect(this.audioContext.destination);
  }

  private startAudioStreaming(): void {
    if (!this.scriptNode) return;

    this.scriptNode.onaudioprocess = (event) => {
      if (!this.shouldSendAudio || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      const input = event.inputBuffer.getChannelData(0);
      const pcm16 = this.floatTo16BitPCM(input);
      const base64 = this.pcm16ToBase64(pcm16);

      this.ws.send(JSON.stringify({
        type: 'audio',
        data: base64,
        timestamp: Date.now()
      }));
    };
  }

  private teardownAudioCapture(): void {
    if (this.scriptNode) {
      this.scriptNode.disconnect();
      this.scriptNode.onaudioprocess = null;
      this.scriptNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  // ==========================================================================
  // AUDIO PLAYBACK
  // ==========================================================================

  private playAudioChunk(pcm16: Int16Array): void {
    // Initialize output context on first chunk
    if (!this.outputAudioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.outputAudioContext = new AudioContextClass({ sampleRate: 24000 });
      this.nextPlaybackTime = this.outputAudioContext.currentTime;
    }

    // Convert Int16 -> Float32
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768;
    }

    // Create buffer and schedule playback
    const audioBuffer = this.outputAudioContext.createBuffer(1, float32.length, 24000);
    audioBuffer.copyToChannel(float32, 0);

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputAudioContext.destination);

    // Schedule at next available time
    const now = this.outputAudioContext.currentTime;
    const startTime = Math.max(now, this.nextPlaybackTime);
    source.start(startTime);

    // Update next playback time
    const chunkDuration = float32.length / 24000;
    this.nextPlaybackTime = startTime + chunkDuration;

    if (!this.isPlaying) {
      this.isPlaying = true;
      this.setState('speaking');
    }

    source.onended = () => {
      if (this.outputAudioContext && this.outputAudioContext.currentTime >= this.nextPlaybackTime - 0.01) {
        this.isPlaying = false;
        if (this.state === 'speaking') {
          this.setState('listening');
        }
      }
    };
  }

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  private setState(newState: GatewayVoiceState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.options.onStateChange?.(newState);
    }
  }

  // ==========================================================================
  // AUDIO UTILITIES
  // ==========================================================================

  private floatTo16BitPCM(input: Float32Array): Int16Array {
    const out = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  }

  private pcm16ToBase64(pcm: Int16Array): string {
    const bytes = new Uint8Array(pcm.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToPCM16(b64: string): Int16Array {
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Int16Array(bytes.buffer);
  }
}

// ==============================================================================
// FACTORY FUNCTION
// ==============================================================================

/**
 * Create a new Gateway Voice Client instance.
 *
 * @param options - Configuration options
 * @returns GatewayVoiceClient instance
 *
 * @example
 * ```typescript
 * const client = createGatewayVoiceClient({
 *   onStateChange: (state) => console.log('State:', state),
 *   onTextDelta: (text) => console.log('AI:', text),
 *   onMenuRefs: (items) => showMenuCards(items),
 *   onCartProposal: (proposal) => showConfirmation(proposal),
 *   userId: currentUser?.id,
 *   orderMode: 'collection'
 * });
 *
 * // Start on user gesture
 * button.onclick = () => client.start();
 * ```
 */
export function createGatewayVoiceClient(options: GatewayVoiceClientOptions = {}): GatewayVoiceClient {
  return new GatewayVoiceClient(options);
}

export default GatewayVoiceClient;
