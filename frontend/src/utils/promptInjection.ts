/**
 * Prompt Placeholder Injection Utility
 *
 * Handles dynamic value injection into AI prompts at runtime.
 * Used by both Voice (frontend) and Chat (backend) channels.
 *
 * Supported placeholders:
 * - {agent_name}: The AI agent's name (e.g., "Uncle Raj")
 * - {restaurant_name}: The restaurant's name (e.g., "Cottage Tandoori")
 * - {traits}: Comma-separated personality traits (e.g., "friendly, warm, and patient")
 */

export interface PlaceholderOptions {
  agentName?: string;
  restaurantName?: string;
  traits?: string[];
  customPlaceholders?: Record<string, string>;
}

/**
 * Format a list of traits as natural language.
 *
 * Examples:
 * - ["friendly"] → "friendly"
 * - ["friendly", "warm"] → "friendly and warm"
 * - ["friendly", "warm", "patient"] → "friendly, warm, and patient"
 */
export function formatTraitsAsText(traits: string[]): string {
  if (!traits || traits.length === 0) return '';

  if (traits.length === 1) {
    return traits[0];
  }

  if (traits.length === 2) {
    return `${traits[0]} and ${traits[1]}`;
  }

  // Oxford comma style: "a, b, and c"
  return traits.slice(0, -1).join(', ') + ', and ' + traits[traits.length - 1];
}

/**
 * Inject dynamic values into prompt placeholders.
 *
 * @param prompt - The prompt template with {placeholders}
 * @param options - Values to inject
 * @returns Prompt with all placeholders replaced
 *
 * @example
 * ```typescript
 * const template = "You are {agent_name}, a {traits} AI assistant for {restaurant_name}.";
 * const result = injectPlaceholders(template, {
 *   agentName: "Uncle Raj",
 *   restaurantName: "Cottage Tandoori",
 *   traits: ["friendly", "warm", "patient"]
 * });
 * // Returns: "You are Uncle Raj, a friendly, warm, and patient AI assistant for Cottage Tandoori."
 * ```
 */
export function injectPlaceholders(
  prompt: string,
  options: PlaceholderOptions
): string {
  if (!prompt) return prompt;

  let result = prompt;

  const {
    agentName = 'AI Assistant',
    restaurantName = 'our restaurant',
    traits = [],
    customPlaceholders = {},
  } = options;

  // Format traits as natural language
  const traitsStr = formatTraitsAsText(traits);

  // Core placeholders
  const replacements: Record<string, string> = {
    '{agent_name}': agentName,
    '{restaurant_name}': restaurantName,
    '{traits}': traitsStr,
  };

  // Add custom placeholders
  for (const [key, value] of Object.entries(customPlaceholders)) {
    const placeholder = key.startsWith('{') ? key : `{${key}}`;
    replacements[placeholder] = value;
  }

  // Apply replacements
  for (const [placeholder, value] of Object.entries(replacements)) {
    if (value) {
      result = result.split(placeholder).join(value);
    }
  }

  return result;
}

/**
 * Inject placeholders into a greeting message.
 *
 * Convenience function for first response / greeting injection.
 */
export function injectGreetingPlaceholders(
  greeting: string,
  agentName: string,
  restaurantName: string
): string {
  return injectPlaceholders(greeting, {
    agentName,
    restaurantName,
  });
}

export default {
  injectPlaceholders,
  injectGreetingPlaceholders,
  formatTraitsAsText,
};
