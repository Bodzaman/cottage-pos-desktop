/**
 * VoiceConfigRegistry - Single source of truth for voice configuration
 *
 * Solves the recurring issue of voice settings being silently overwritten
 * by providing centralized validation and logging.
 *
 * IMPORTANT: All Gemini Live voice names are defined HERE and only here.
 * Do not hardcode voice names anywhere else in the codebase.
 */

// Valid Gemini Live API voice names (ONLY these work with Gemini Live)
export const GEMINI_LIVE_VOICES = {
  Puck: { id: 'Puck', label: 'Puck (British Male)', accent: 'British', gender: 'male' },
  Charon: { id: 'Charon', label: 'Charon (American Male)', accent: 'American', gender: 'male' },
  Kore: { id: 'Kore', label: 'Kore (American Female)', accent: 'American', gender: 'female' },
  Fenrir: { id: 'Fenrir', label: 'Fenrir (Deep Male)', accent: 'American', gender: 'male' },
  Aoede: { id: 'Aoede', label: 'Aoede (Warm Female)', accent: 'American', gender: 'female' },
  Zephyr: { id: 'Zephyr', label: 'Zephyr (Bright)', accent: 'American', gender: 'neutral' },
  Leda: { id: 'Leda', label: 'Leda (Gentle Female)', accent: 'American', gender: 'female' },
  Orus: { id: 'Orus', label: 'Orus (Authoritative Male)', accent: 'American', gender: 'male' },
} as const;

export type GeminiVoiceName = keyof typeof GEMINI_LIVE_VOICES;

export const DEFAULT_VOICE: GeminiVoiceName = 'Puck';

// Legacy TTS voice names that should NOT be used with Gemini Live
// These are Google Cloud Text-to-Speech model IDs, NOT Gemini Live voices
const LEGACY_TTS_VOICES = [
  'en-GB-Neural2-B',
  'en-GB-Neural2-A',
  'en-US-Neural2-A',
  'en-US-Neural2-B',
  'en-US-Wavenet',
  'en-GB-Wavenet',
];

/**
 * Validates and returns a valid Gemini Live voice name.
 * Logs warnings when invalid/legacy voices are detected.
 *
 * @param voiceName - The voice name from configuration
 * @returns A valid GeminiVoiceName
 */
export function validateVoiceName(voiceName: string | undefined | null): GeminiVoiceName {
  // Case 1: No voice provided
  if (!voiceName) {
    console.warn('[VoiceRegistry] No voice configured, using default:', DEFAULT_VOICE);
    return DEFAULT_VOICE;
  }

  // Case 2: Valid Gemini Live voice
  if (voiceName in GEMINI_LIVE_VOICES) {
    console.log('[VoiceRegistry] Using configured voice:', voiceName);
    return voiceName as GeminiVoiceName;
  }

  // Case 3: Legacy TTS voice (common migration issue)
  if (LEGACY_TTS_VOICES.some(v => voiceName.includes(v))) {
    console.warn(
      `[VoiceRegistry] Legacy TTS voice "${voiceName}" detected. ` +
      `This is NOT a Gemini Live voice. Using default: ${DEFAULT_VOICE}. ` +
      `Please update AIStaffManagementHub voice settings.`
    );
    return DEFAULT_VOICE;
  }

  // Case 4: Unknown voice
  console.warn(
    `[VoiceRegistry] Unknown voice "${voiceName}". ` +
    `Valid options: ${Object.keys(GEMINI_LIVE_VOICES).join(', ')}. ` +
    `Using default: ${DEFAULT_VOICE}`
  );
  return DEFAULT_VOICE;
}

/**
 * Gets all valid voice options for dropdowns.
 * Use this in AIStaffManagementHub to populate voice selector.
 */
export function getVoiceOptions() {
  return Object.values(GEMINI_LIVE_VOICES);
}

/**
 * Check if a voice name is valid Gemini Live voice.
 */
export function isValidVoice(voiceName: string): voiceName is GeminiVoiceName {
  return voiceName in GEMINI_LIVE_VOICES;
}

/**
 * Get voice info by name.
 */
export function getVoiceInfo(voiceName: GeminiVoiceName) {
  return GEMINI_LIVE_VOICES[voiceName];
}
