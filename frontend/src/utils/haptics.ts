/**
 * Haptics Utility
 *
 * Provides haptic feedback for touch interactions on supported devices.
 * Uses the Vibration API where available.
 *
 * @module haptics
 */

/**
 * Haptic feedback intensity levels
 */
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * Vibration patterns for different haptic types (in milliseconds)
 */
const hapticPatterns: Record<HapticType, number[]> = {
  light: [10],
  medium: [20],
  heavy: [30, 10, 30],
  success: [10, 50, 20],
  warning: [30, 50, 30],
  error: [50, 30, 50, 30, 50],
};

/**
 * Check if haptic feedback is supported on this device
 */
export function isHapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback on supported devices
 *
 * @param type - The type/intensity of haptic feedback
 *
 * @example
 * // Light tap feedback
 * triggerHaptic('light');
 *
 * // Button press feedback
 * <Button onTouchStart={() => triggerHaptic('light')} onClick={handleClick}>
 *
 * // Critical action feedback
 * const handleDelete = () => {
 *   triggerHaptic('heavy');
 *   performDelete();
 * };
 */
export function triggerHaptic(type: HapticType = 'medium'): void {
  if (!isHapticsSupported()) return;

  try {
    navigator.vibrate(hapticPatterns[type]);
  } catch (error) {
    // Silently fail - haptics are non-critical
    console.debug('Haptic feedback failed:', error);
  }
}

/**
 * Cancel any ongoing haptic feedback
 */
export function cancelHaptic(): void {
  if (!isHapticsSupported()) return;

  try {
    navigator.vibrate(0);
  } catch {
    // Silently fail
  }
}

/**
 * Create a touch event handler with haptic feedback
 *
 * @param type - The type of haptic feedback
 * @param callback - Optional callback to execute after haptic
 * @returns Touch event handler function
 *
 * @example
 * <Button onTouchStart={withHaptic('light')} onClick={handleClick}>
 */
export function withHaptic(
  type: HapticType = 'light',
  callback?: () => void
): () => void {
  return () => {
    triggerHaptic(type);
    callback?.();
  };
}

export default triggerHaptic;
