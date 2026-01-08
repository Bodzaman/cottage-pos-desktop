/**
 * Utility functions for the app
 */

/**
 * Convert a hex color code to an RGB value
 * @param hex - The hex color code to convert
 * @returns The RGB components as a string in the format "r, g, b"
 */
export function hexToRgb(hex: string): string {
  // Remove the # if present
  const cleanHex = hex.startsWith('#') ? hex.substring(1) : hex;
  
  // Parse the hex values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  // Return as a comma-separated string
  return `${r}, ${g}, ${b}`;
}