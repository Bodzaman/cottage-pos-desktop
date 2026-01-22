/**
 * Generate a simple device fingerprint for device trust functionality.
 * Combines multiple browser characteristics to create a semi-stable identifier.
 * 
 * Note: This is NOT cryptographically secure, but sufficient for "Remember this device" functionality.
 */
export function getDeviceFingerprint(): string {
  const components: string[] = [];

  // 1. User agent
  components.push(navigator.userAgent);

  // 2. Screen resolution
  components.push(`${screen.width}x${screen.height}`);

  // 3. Color depth
  components.push(String(screen.colorDepth));

  // 4. Timezone offset
  components.push(String(new Date().getTimezoneOffset()));

  // 5. Language
  components.push(navigator.language);

  // 6. Platform
  components.push(navigator.platform);

  // 7. Hardware concurrency (CPU cores)
  if (navigator.hardwareConcurrency) {
    components.push(String(navigator.hardwareConcurrency));
  }

  // 8. Device memory (if available)
  if ('deviceMemory' in navigator) {
    components.push(String((navigator as any).deviceMemory));
  }

  // Combine all components into a single string
  const fingerprint = components.join('|');

  // Return the fingerprint (backend will hash it)
  return fingerprint;
}
