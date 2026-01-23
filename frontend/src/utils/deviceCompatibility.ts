/**
 * Device Compatibility Detection - Voice Feature Support
 *
 * Detects device capabilities for voice calling features:
 * - Browser type and version
 * - Platform (iOS, Android, Desktop)
 * - Audio capture support (getUserMedia)
 * - AudioContext support
 * - WebSocket support
 * - HTTPS requirement check
 *
 * @module deviceCompatibility
 */

// ==============================================================================
// TYPES
// ==============================================================================

export type Platform = 'ios' | 'android' | 'macos' | 'windows' | 'linux' | 'other';
export type Browser = 'safari' | 'chrome' | 'firefox' | 'edge' | 'opera' | 'samsung' | 'other';
export type VoiceSupport = 'full' | 'gateway_only' | 'limited' | 'none';

export interface DeviceCapabilities {
  /** Platform type */
  platform: Platform;

  /** Browser type */
  browser: Browser;

  /** Browser version (major) */
  browserVersion: number;

  /** Whether getUserMedia is available */
  supportsGetUserMedia: boolean;

  /** Whether AudioContext is available */
  supportsAudioContext: boolean;

  /** Whether WebSocket is available */
  supportsWebSocket: boolean;

  /** Whether running over HTTPS (required for getUserMedia) */
  isHttps: boolean;

  /** Whether this is a mobile device */
  isMobile: boolean;

  /** Whether this is iOS Safari (has specific requirements) */
  isIOSSafari: boolean;

  /** Whether AudioContext requires user gesture to start */
  requiresUserGesture: boolean;

  /** Overall voice support level */
  voiceSupport: VoiceSupport;

  /** Whether direct Gemini connection is supported */
  supportsDirectConnection: boolean;

  /** Whether gateway connection is recommended */
  gatewayRecommended: boolean;

  /** List of warnings/issues detected */
  warnings: string[];

  /** List of missing features */
  missingFeatures: string[];
}

export interface VoiceCompatibilityResult {
  /** Whether voice features can be used */
  compatible: boolean;

  /** Device capabilities */
  capabilities: DeviceCapabilities;

  /** Human-readable summary */
  summary: string;

  /** Recommended connection mode */
  recommendedMode: 'direct' | 'gateway' | 'none';

  /** User-facing message about compatibility */
  userMessage: string;
}

// ==============================================================================
// DETECTION FUNCTIONS
// ==============================================================================

/**
 * Detect platform from user agent
 */
function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) {
    return 'ios';
  }
  if (/android/.test(ua)) {
    return 'android';
  }
  if (/macintosh|mac os x/.test(ua)) {
    return 'macos';
  }
  if (/windows/.test(ua)) {
    return 'windows';
  }
  if (/linux/.test(ua)) {
    return 'linux';
  }
  return 'other';
}

/**
 * Detect browser from user agent
 */
function detectBrowser(): { browser: Browser; version: number } {
  const ua = navigator.userAgent;

  // Check for Samsung Internet
  if (/samsungbrowser/i.test(ua)) {
    const match = ua.match(/samsungbrowser\/(\d+)/i);
    return { browser: 'samsung', version: match ? parseInt(match[1]) : 0 };
  }

  // Check for Opera
  if (/opr\/|opera/i.test(ua)) {
    const match = ua.match(/(?:opr|opera)\/(\d+)/i);
    return { browser: 'opera', version: match ? parseInt(match[1]) : 0 };
  }

  // Check for Edge
  if (/edg/i.test(ua)) {
    const match = ua.match(/edg\/(\d+)/i);
    return { browser: 'edge', version: match ? parseInt(match[1]) : 0 };
  }

  // Check for Chrome (must be after Edge)
  if (/chrome/i.test(ua) && !/chromium/i.test(ua)) {
    const match = ua.match(/chrome\/(\d+)/i);
    return { browser: 'chrome', version: match ? parseInt(match[1]) : 0 };
  }

  // Check for Firefox
  if (/firefox/i.test(ua)) {
    const match = ua.match(/firefox\/(\d+)/i);
    return { browser: 'firefox', version: match ? parseInt(match[1]) : 0 };
  }

  // Check for Safari (must be after Chrome)
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    const match = ua.match(/version\/(\d+)/i);
    return { browser: 'safari', version: match ? parseInt(match[1]) : 0 };
  }

  return { browser: 'other', version: 0 };
}

/**
 * Check if running on mobile device
 */
function isMobileDevice(): boolean {
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    navigator.userAgent.toLowerCase()
  );
}

/**
 * Check if HTTPS
 */
function isSecureContext(): boolean {
  return window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
}

/**
 * Check getUserMedia support
 */
function hasGetUserMedia(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Check AudioContext support
 */
function hasAudioContext(): boolean {
  return !!(window.AudioContext || (window as any).webkitAudioContext);
}

/**
 * Check WebSocket support
 */
function hasWebSocket(): boolean {
  return 'WebSocket' in window;
}

// ==============================================================================
// MAIN DETECTION FUNCTION
// ==============================================================================

/**
 * Detect all device capabilities for voice features.
 *
 * @returns DeviceCapabilities object with all detected information
 */
export function detectCapabilities(): DeviceCapabilities {
  const platform = detectPlatform();
  const { browser, version: browserVersion } = detectBrowser();
  const isMobile = isMobileDevice();
  const isHttps = isSecureContext();

  const supportsGetUserMedia = hasGetUserMedia();
  const supportsAudioContext = hasAudioContext();
  const supportsWebSocket = hasWebSocket();

  const isIOSSafari = platform === 'ios' && browser === 'safari';

  // iOS Safari requires user gesture for AudioContext
  // Chrome on mobile also has autoplay policy
  const requiresUserGesture = isIOSSafari || (isMobile && browser === 'chrome');

  const warnings: string[] = [];
  const missingFeatures: string[] = [];

  // Check for issues
  if (!isHttps) {
    warnings.push('Not running over HTTPS - microphone access may be blocked');
    missingFeatures.push('secure_context');
  }

  if (!supportsGetUserMedia) {
    warnings.push('getUserMedia not supported - microphone access unavailable');
    missingFeatures.push('get_user_media');
  }

  if (!supportsAudioContext) {
    warnings.push('AudioContext not supported - audio processing unavailable');
    missingFeatures.push('audio_context');
  }

  if (!supportsWebSocket) {
    warnings.push('WebSocket not supported - real-time communication unavailable');
    missingFeatures.push('websocket');
  }

  // Browser-specific warnings
  if (browser === 'safari' && browserVersion < 14) {
    warnings.push('Safari version 14+ recommended for best voice experience');
  }

  if (browser === 'firefox' && platform === 'ios') {
    warnings.push('Firefox on iOS uses Safari engine - some features may be limited');
  }

  // Determine voice support level
  let voiceSupport: VoiceSupport = 'none';
  let supportsDirectConnection = false;
  let gatewayRecommended = false;

  if (supportsGetUserMedia && supportsAudioContext && supportsWebSocket && isHttps) {
    if (isIOSSafari) {
      // iOS Safari: Gateway recommended for better reliability
      voiceSupport = 'gateway_only';
      supportsDirectConnection = true; // Can work, but gateway is better
      gatewayRecommended = true;
    } else if (isMobile) {
      // Android/other mobile: Both work, gateway recommended
      voiceSupport = 'full';
      supportsDirectConnection = true;
      gatewayRecommended = true;
    } else {
      // Desktop: Full support
      voiceSupport = 'full';
      supportsDirectConnection = true;
      gatewayRecommended = false;
    }
  } else if (supportsWebSocket && isHttps) {
    // WebSocket only - might work with text-only
    voiceSupport = 'limited';
    supportsDirectConnection = false;
    gatewayRecommended = true;
  }

  return {
    platform,
    browser,
    browserVersion,
    supportsGetUserMedia,
    supportsAudioContext,
    supportsWebSocket,
    isHttps,
    isMobile,
    isIOSSafari,
    requiresUserGesture,
    voiceSupport,
    supportsDirectConnection,
    gatewayRecommended,
    warnings,
    missingFeatures
  };
}

/**
 * Check voice compatibility and get recommendation.
 *
 * @returns VoiceCompatibilityResult with compatibility info and recommendations
 */
export function checkVoiceCompatibility(): VoiceCompatibilityResult {
  const capabilities = detectCapabilities();

  const compatible = capabilities.voiceSupport !== 'none';

  // Determine recommended mode
  let recommendedMode: 'direct' | 'gateway' | 'none' = 'none';
  if (compatible) {
    recommendedMode = capabilities.gatewayRecommended ? 'gateway' : 'direct';
  }

  // Generate summary
  let summary = '';
  if (capabilities.voiceSupport === 'full') {
    summary = `Full voice support on ${capabilities.browser} (${capabilities.platform})`;
  } else if (capabilities.voiceSupport === 'gateway_only') {
    summary = `Voice support via gateway on ${capabilities.browser} (${capabilities.platform})`;
  } else if (capabilities.voiceSupport === 'limited') {
    summary = `Limited voice support - some features may not work`;
  } else {
    summary = `Voice not supported - ${capabilities.warnings.join(', ')}`;
  }

  // Generate user message
  let userMessage = '';
  if (compatible) {
    if (capabilities.requiresUserGesture) {
      userMessage = 'Tap the microphone button to start voice ordering.';
    } else {
      userMessage = 'Click the microphone button to start voice ordering.';
    }
  } else {
    if (!capabilities.isHttps) {
      userMessage = 'Voice ordering requires a secure connection (HTTPS).';
    } else if (!capabilities.supportsGetUserMedia) {
      userMessage = 'Your browser does not support microphone access. Please try Chrome or Safari.';
    } else {
      userMessage = 'Voice ordering is not available on your device.';
    }
  }

  return {
    compatible,
    capabilities,
    summary,
    recommendedMode,
    userMessage
  };
}

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

/**
 * Check if voice gateway should be used based on device capabilities.
 */
export function shouldUseGateway(): boolean {
  const capabilities = detectCapabilities();
  return capabilities.gatewayRecommended;
}

/**
 * Get a simple boolean for whether voice is supported.
 */
export function isVoiceSupported(): boolean {
  const result = checkVoiceCompatibility();
  return result.compatible;
}

/**
 * Get platform name for analytics/logging.
 */
export function getPlatformName(): string {
  const capabilities = detectCapabilities();
  return `${capabilities.browser}/${capabilities.browserVersion} on ${capabilities.platform}`;
}

/**
 * Check if user gesture is required to start audio.
 */
export function requiresUserGestureForAudio(): boolean {
  const capabilities = detectCapabilities();
  return capabilities.requiresUserGesture;
}

// ==============================================================================
// MINIMUM VERSION CHECKS
// ==============================================================================

const MIN_BROWSER_VERSIONS: Record<Browser, number> = {
  safari: 14,
  chrome: 80,
  firefox: 75,
  edge: 80,
  opera: 67,
  samsung: 12,
  other: 0
};

/**
 * Check if browser meets minimum version requirements.
 */
export function meetsMinimumVersion(): boolean {
  const { browser, browserVersion } = detectBrowser();
  const minVersion = MIN_BROWSER_VERSIONS[browser];
  return browserVersion >= minVersion;
}

/**
 * Get minimum version message if browser is outdated.
 */
export function getMinimumVersionMessage(): string | null {
  const { browser, browserVersion } = detectBrowser();
  const minVersion = MIN_BROWSER_VERSIONS[browser];

  if (browserVersion < minVersion) {
    const browserName = browser.charAt(0).toUpperCase() + browser.slice(1);
    return `Please update ${browserName} to version ${minVersion} or higher for the best voice experience.`;
  }

  return null;
}

export default {
  detectCapabilities,
  checkVoiceCompatibility,
  shouldUseGateway,
  isVoiceSupported,
  getPlatformName,
  requiresUserGestureForAudio,
  meetsMinimumVersion,
  getMinimumVersionMessage
};
