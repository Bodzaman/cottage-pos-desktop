/**
 * LEGACY FILE - For backward compatibility only
 * 
 * This file maintains compatibility with legacy voice ordering components
 * that are NOT part of the new ChatLargeModal voice flow.
 * 
 * New voice ordering flow uses:
 * - InlineTermsScreen (T&C modal)
 * - VoiceCallOverlay (call UI)
 * - chat-store (platform-agnostic state)
 * 
 * TODO (MYA-1164): Remove this file when legacy components are deprecated
 */

import { VoiceCallStatus } from './chat-store';

// Re-export VoiceCallStatus for backward compatibility
export { VoiceCallStatus };

// Legacy WebRTC client interface (stub)
export interface WebRTCVoiceClient {
  startCall: () => Promise<void>;
  endCall: () => void;
  getStatus: () => VoiceCallStatus;
}

// Legacy config interface
export interface VoiceSessionConfig {
  agentId: string;
  agentName: string;
  onStatusChange?: (status: VoiceCallStatus) => void;
  onTranscriptUpdate?: (transcript: string) => void;
  onError?: (error: string) => void;
}

/**
 * Legacy factory function - returns stub client
 * Real implementation removed as part of MYA-1176
 */
export function createWebRTCVoiceClient(config: VoiceSessionConfig): WebRTCVoiceClient {
  console.warn('[webrtcVoiceClient] DEPRECATED: This is a legacy stub. Use new ChatLargeModal voice flow.');
  
  return {
    startCall: async () => {
      console.error('[webrtcVoiceClient] Legacy WebRTC client is deprecated. No action taken.');
      throw new Error('Legacy WebRTC client is deprecated. Please use the new ChatLargeModal voice flow.');
    },
    endCall: () => {
      console.warn('[webrtcVoiceClient] Legacy endCall called - no action taken.');
    },
    getStatus: () => VoiceCallStatus.IDLE
  };
}

/**
 * Check if WebRTC is supported (always false for stub)
 */
export function isWebRTCSupported(): boolean {
  console.warn('[webrtcVoiceClient] DEPRECATED: Legacy function. Returns false.');
  return false;
}

// Legacy default export
export const webRTCVoiceClient = {
  createWebRTCVoiceClient,
  isWebRTCSupported,
  VoiceCallStatus
};
