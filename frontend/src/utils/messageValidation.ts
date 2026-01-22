/**
 * Message Validation Utility
 * 
 * Ensures ChatMessage.content is ALWAYS a string at creation time.
 * This prevents "content.replace is not a function" errors by enforcing
 * type contracts at the source, not in components.
 * 
 * Task: MYA-1521 - Fix Root Cause: ChatMessage.content Type Violation
 */

import type { ChatMessage } from './chat-store';
import type { MenuItem } from './menuTypes';

/**
 * Validates and sanitizes a ChatMessage to ensure content is always a string.
 * 
 * This function:
 * - Ensures content is ALWAYS a string (converts if needed)
 * - Logs warnings if content was non-string (helps identify regressions)
 * - Preserves all other message properties
 * - Handles edge cases (undefined, null, objects, arrays)
 * 
 * @param msg - The message to validate
 * @param source - Where the message was created (for logging)
 * @returns A validated ChatMessage with guaranteed string content
 */
export function validateChatMessage(
  msg: Partial<ChatMessage> & { content: any },
  source: string = 'unknown'
): ChatMessage {
  // Check if content is already a valid string
  if (typeof msg.content === 'string') {
    return msg as ChatMessage;
  }

  // ⚠️ TYPE VIOLATION DETECTED - Log it for debugging
  console.warn(
    '⚠️ [MESSAGE VALIDATION] Content is not a string:',
    {
      source,
      actualType: typeof msg.content,
      value: msg.content,
      messageId: msg.id,
      sender: msg.sender,
      timestamp: new Date().toISOString()
    }
  );

  // Convert content to string based on type
  let sanitizedContent: string;

  if (msg.content === null || msg.content === undefined) {
    sanitizedContent = '';
  } else if (Array.isArray(msg.content)) {
    // If it's an array, it might be structured parts - extract text
    sanitizedContent = msg.content
      .map((item: any) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && item.content) return item.content;
        return '';
      })
      .filter(Boolean)
      .join(' ');
  } else if (typeof msg.content === 'object') {
    // If it's an object, try to extract text content
    if ('text' in msg.content) {
      sanitizedContent = String(msg.content.text);
    } else if ('content' in msg.content) {
      sanitizedContent = String(msg.content.content);
    } else {
      // Last resort: stringify the object
      sanitizedContent = '';
      console.error('❌ [MESSAGE VALIDATION] Cannot extract text from object:', msg.content);
    }
  } else {
    // For any other type, convert to string
    sanitizedContent = String(msg.content);
  }

  // Return validated message with guaranteed string content
  return {
    ...msg,
    content: sanitizedContent
  } as ChatMessage;
}

/**
 * Validates message content is a string (lightweight guard for components).
 * Use this in components that process message.content with string methods.
 * 
 * @param content - The content to validate
 * @param fallback - Fallback value if content is not a string
 * @returns The content if it's a string, otherwise the fallback
 */
export function ensureStringContent(content: any, fallback: string = ''): string {
  if (typeof content !== 'string') {
    console.warn('⚠️ [COMPONENT GUARD] Non-string content detected:', {
      actualType: typeof content,
      value: content
    });
    return fallback;
  }
  return content;
}

/**
 * Cleans up corrupted messages from localStorage.
 * Call this on app initialization to remove any messages with non-string content.
 * 
 * @param messages - Array of messages to clean
 * @returns Cleaned messages with validated content
 */
export function cleanupCorruptedMessages(messages: any[]): ChatMessage[] {
  if (!Array.isArray(messages)) {
    console.warn('⚠️ [CLEANUP] Messages is not an array:', messages);
    return [];
  }

  let corruptedCount = 0;
  const cleaned = messages.map((msg, index) => {
    if (typeof msg.content !== 'string') {
      corruptedCount++;
      return validateChatMessage(msg, `cleanup-index-${index}`);
    }
    return msg;
  });

  if (corruptedCount > 0) {
    console.warn(
      `🧹 [CLEANUP] Fixed ${corruptedCount} corrupted message(s) from localStorage`
    );
  }

  return cleaned;
}

/**
 * Type guard to check if a message is valid.
 * 
 * @param msg - The message to check
 * @returns True if message has valid structure
 */
export function isValidChatMessage(msg: any): msg is ChatMessage {
  return (
    msg &&
    typeof msg === 'object' &&
    typeof msg.id === 'string' &&
    typeof msg.content === 'string' &&
    (msg.sender === 'user' || msg.sender === 'bot') &&
    msg.timestamp instanceof Date
  );
}

/**
 * Validates an array of menu cards.
 * Ensures menuCards is always an array, never undefined or null.
 * 
 * @param menuCards - The menu cards to validate
 * @returns Validated array of menu items
 */
export function validateMenuCards(menuCards: any): MenuItem[] {
  if (!menuCards) return [];
  if (!Array.isArray(menuCards)) {
    console.warn('⚠️ [VALIDATION] menuCards is not an array:', menuCards);
    return [];
  }
  return menuCards;
}
