


import { WS_API_URL } from 'app';

interface WebSocketConfig {
  endpoint: string;
  params?: Record<string, string>;
  onOpen?: () => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

interface WebSocketManagerState {
  connecting: boolean;
  connected: boolean;
  error: string | null;
  reconnectAttempt: number;
}

/**
 * Centralized WebSocket Manager with robust error handling and reconnection logic
 * Standardizes WebSocket URL construction and provides automatic reconnection
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private state: WebSocketManagerState;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private destroyed = false;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      ...config
    };
    
    this.state = {
      connecting: false,
      connected: false,
      error: null,
      reconnectAttempt: 0
    };
  }

  /**
   * Connect to WebSocket with standardized URL construction
   */
  async connect(): Promise<void> {
    if (this.destroyed) {
      throw new Error('WebSocket manager has been destroyed');
    }

    if (this.state.connecting || this.state.connected) {
      console.log('🔗 WebSocket already connecting or connected');
      return;
    }

    this.state.connecting = true;
    this.state.error = null;

    try {
      // Construct standardized WebSocket URL using WS_API_URL
      const url = this.buildWebSocketUrl();
      console.log('🔗 Connecting to WebSocket:', url);

      // Create WebSocket with credentials included for authentication
      // Note: WebSocket doesn't support custom headers, but some implementations
      // may use the 'credentials' option or require authentication via URL params
      const wsOptions: any = {};
      
      // For development environment, we may need to handle authentication differently
      // This ensures cookies/credentials are sent with the WebSocket handshake
      this.ws = new WebSocket(url);
      this.setupEventListeners();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.handleError(new Error('Connection timeout'));
          reject(new Error('WebSocket connection timeout'));
        }, 10000); // 10 second timeout

        const onOpen = () => {
          clearTimeout(timeout);
          this.state.connecting = false;
          this.state.connected = true;
          this.state.reconnectAttempt = 0;
          console.log('✅ WebSocket connected successfully');
          
          // Start health check pings
          this.startHealthCheck();
          
          this.config.onOpen?.();
          resolve();
        };

        const onError = (error: Event) => {
          clearTimeout(timeout);
          this.handleError(error);
          reject(error);
        };

        if (this.ws) {
          this.ws.addEventListener('open', onOpen, { once: true });
          this.ws.addEventListener('error', onError, { once: true });
        }
      });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Build standardized WebSocket URL using environment constants
   */
  private buildWebSocketUrl(): string {
    console.log('🔍 WS_API_URL from constants:', WS_API_URL);
    
    // Convert WS_API_URL to WebSocket protocol
    // First, remove /routes suffix from WS_API_URL for development testing
    // In production, we may need the /routes prefix for WebSocket routing
    let wsBaseUrl = WS_API_URL;
    console.log('🔍 Original WS_API_URL:', wsBaseUrl);
    
    // Convert HTTP/HTTPS to WSS protocol for WebSocket connections
    // This is critical - WebSocket connections MUST use ws:// or wss:// protocol
    if (wsBaseUrl.startsWith('https://')) {
      wsBaseUrl = wsBaseUrl.replace('https://', 'wss://');
      console.log('🔍 Converted HTTPS to WSS:', wsBaseUrl);
    } else if (wsBaseUrl.startsWith('http://')) {
      wsBaseUrl = wsBaseUrl.replace('http://', 'ws://');
      console.log('🔍 Converted HTTP to WS:', wsBaseUrl);
    } else if (wsBaseUrl.startsWith('wss://') || wsBaseUrl.startsWith('ws://')) {
      console.log('🔍 WebSocket protocol already correct:', wsBaseUrl);
    } else {
      console.warn('⚠️ Unexpected WebSocket URL format:', wsBaseUrl);
    }
    
    let url = `${wsBaseUrl}${this.config.endpoint}`;
    console.log('🔍 After adding endpoint:', url);
    
    // Add query parameters if provided
    const params = new URLSearchParams();
    
    // Add existing custom parameters
    if (this.config.params && Object.keys(this.config.params).length > 0) {
      Object.entries(this.config.params).forEach(([key, value]) => {
        params.append(key, value);
      });
    }
    
    // ✅ ADD ULTRAVOX AUTHENTICATION TOKEN
    // Since WebSocket doesn't support Authorization headers, pass token as query param
    // This matches the bearer token pattern expected by the backend
    params.append('token', 'qsai-voice-auth-2025');
    
    // Add credentials parameter to enable authentication
    // This tells the backend to use same-origin credentials for authentication
    params.append('credentials', 'include');
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    console.log('🔍 Final WebSocket URL with auth token:', url);
    
    // Validate that the final URL has correct WebSocket protocol
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
      console.error('❌ WebSocket URL does not use WebSocket protocol:', url);
      throw new Error(`Invalid WebSocket URL protocol. Expected ws:// or wss://, got: ${url}`);
    }
    
    return url;
  }

  /**
   * Setup WebSocket event listeners with error handling
   */
  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      // Handled in connect() promise
    };

    this.ws.onmessage = (event) => {
      try {
        // Handle pong responses for health checks
        const data = JSON.parse(event.data);
        if (data.type === 'PONG') {
          console.log('🏓 WebSocket health check pong received');
          return;
        }
        
        this.config.onMessage?.(event);
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.handleError(error);
      this.config.onError?.(error);
    };

    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket closed:', event.code, event.reason);
      this.state.connected = false;
      this.state.connecting = false;
      this.stopHealthCheck();
      
      // Attempt reconnection if not manually closed and not destroyed
      if (!this.destroyed && event.code !== 1000 && event.code !== 1001) {
        this.attemptReconnection();
      }
      
      this.config.onClose?.(event);
    };
  }

  /**
   * Handle WebSocket errors with proper logging
   */
  private handleError(error: any): void {
    this.state.connecting = false;
    this.state.error = error.message || 'WebSocket connection failed';
    console.error('❌ WebSocket manager error:', error);
  }

  /**
   * Attempt reconnection with exponential backoff
   */
  private attemptReconnection(): void {
    if (this.destroyed || this.state.reconnectAttempt >= (this.config.reconnectAttempts || 5)) {
      console.log('❌ Max reconnection attempts reached or manager destroyed');
      return;
    }

    this.state.reconnectAttempt++;
    const delay = Math.min(
      (this.config.reconnectDelay || 1000) * Math.pow(2, this.state.reconnectAttempt - 1),
      30000 // Max 30 seconds
    );

    console.log(`🔄 Attempting reconnection ${this.state.reconnectAttempt}/${this.config.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      if (!this.destroyed) {
        this.connect().catch(error => {
          console.error('❌ Reconnection failed:', error);
        });
      }
    }, delay);
  }

  /**
   * Start health check pings to keep connection alive
   */
  private startHealthCheck(): void {
    this.stopHealthCheck(); // Clear any existing timer
    
    this.pingTimer = setInterval(() => {
      if (this.state.connected && this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'PING', timestamp: new Date().toISOString() });
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop health check pings
   */
  private stopHealthCheck(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /**
   * Send message through WebSocket with error handling
   */
  send(message: any): boolean {
    if (!this.state.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ Cannot send message: WebSocket not connected');
      return false;
    }

    try {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      this.ws.send(data);
      return true;
    } catch (error) {
      console.error('❌ Error sending WebSocket message:', error);
      return false;
    }
  }

  /**
   * Close WebSocket connection gracefully
   */
  close(): void {
    this.destroyed = true;
    this.stopHealthCheck();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client closing connection');
      this.ws = null;
    }

    this.state = {
      connecting: false,
      connected: false,
      error: null,
      reconnectAttempt: 0
    };
  }

  /**
   * Get current connection state
   */
  getState(): WebSocketManagerState {
    return { ...this.state };
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.state.connected && this.ws?.readyState === WebSocket.OPEN;
  }
}

/**
 * Factory function to create standardized voice cart WebSocket connections
 */
export function createVoiceCartWebSocket(sessionId: string, customerId?: string): WebSocketManager {
  const params: Record<string, string> = {};
  if (customerId) {
    params.customer_id = customerId;
  }

  return new WebSocketManager({
    endpoint: `/voice-realtime-sync/ws/${sessionId}`,
    params,
    onOpen: () => {
      console.log('🎤 Voice cart WebSocket connected');
    },
    onError: (error) => {
      console.error('❌ Voice cart WebSocket error:', error);
    },
    onClose: (event) => {
      console.log('🔌 Voice cart WebSocket closed:', event.code, event.reason);
    }
  });
}

/**
 * Utility function to create any voice-related WebSocket connection
 */
export function createVoiceWebSocket(
  endpoint: string, 
  config: Partial<WebSocketConfig> = {}
): WebSocketManager {
  return new WebSocketManager({
    endpoint,
    ...config
  });
}
