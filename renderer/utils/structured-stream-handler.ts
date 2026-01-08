import { API_URL } from '../utils/environment';
import { ChatRequest } from 'types';
import { useRealtimeMenuStore } from './realtimeMenuStore';
import type { MenuItem } from './menuTypes';

// Types for the new structured streaming protocol
export interface ContentChunk {
  type: 'content';
  text: string;
}

export interface UIElement {
  type: 'ui_element';
  element: 'menu_card' | 'recommendation_set';
  itemId: string;
  position: 'inline' | 'after';
  index?: number;
  metadata?: {
    source: 'intelligent_detection' | 'explicit_marker';
    confidence: number;
    dish_name: string;
  };
}

export interface StreamComplete {
  type: 'complete';
}

export type StructuredStreamEvent = ContentChunk | UIElement | StreamComplete;

// Message content structure for structured rendering
export interface MessageContentPart {
  type: 'text' | 'menu_card';
  content?: string;
  itemId?: string;
  key: string;
}

export interface ProcessedMessage {
  messageId: string;
  parts: MessageContentPart[];
  processedContent: string;
  hasMenuCards: boolean;
  menuCards: MenuItem[];
}

/**
 * Structured Stream Handler
 * Processes real-time streaming events and builds structured message content
 */
export class StructuredStreamHandler {
  private contentParts: MessageContentPart[] = [];
  private menuCards: Set<string> = new Set();
  private keyIndex = 0;
  
  constructor(private messageId: string) {}
  
  /**
   * Process a streaming event and update message content
   */
  processEvent(event: StructuredStreamEvent): {
    shouldUpdate: boolean;
    parts: MessageContentPart[];
    menuCards: MenuItem[];
    isComplete: boolean;
  } {
    let shouldUpdate = false;
    let isComplete = false;
    
    switch (event.type) {
      case 'content':
        // Add text content immediately
        if (event.text) {
          this.contentParts.push({
            type: 'text',
            content: event.text,
            key: `text_${this.keyIndex++}`
          });
          shouldUpdate = true;
        }
        break;
        
      case 'ui_element':
        // Add UI element if it's a menu card and we haven't seen it before
        if (event.element === 'menu_card' && !this.menuCards.has(event.itemId)) {
          this.menuCards.add(event.itemId);
          
          // Insert menu card at appropriate position
          const insertIndex = event.index !== undefined ? event.index : this.contentParts.length;
          this.contentParts.splice(insertIndex, 0, {
            type: 'menu_card',
            itemId: event.itemId,
            key: `menu_card_${event.itemId}`
          });
          shouldUpdate = true;
        }
        break;
        
      case 'complete':
        isComplete = true;
        shouldUpdate = true;
        break;
    }
    
    // Get actual menu items for the cards
    const menuItems = this.getMenuItems(Array.from(this.menuCards));
    
    return {
      shouldUpdate,
      parts: [...this.contentParts],
      menuCards: menuItems,
      isComplete
    };
  }
  
  /**
   * Get the current processed message state
   */
  getCurrentState(): ProcessedMessage {
    const menuItems = this.getMenuItems(Array.from(this.menuCards));
    const processedContent = this.contentParts
      .filter(part => part.type === 'text')
      .map(part => part.content)
      .join('');
    
    return {
      messageId: this.messageId,
      parts: [...this.contentParts],
      processedContent,
      hasMenuCards: this.menuCards.size > 0,
      menuCards: menuItems
    };
  }
  
  /**
   * Reset handler for new message
   */
  reset(newMessageId: string) {
    this.messageId = newMessageId;
    this.contentParts = [];
    this.menuCards.clear();
    this.keyIndex = 0;
  }
  
  /**
   * Get menu items from the store by IDs
   */
  private getMenuItems(itemIds: string[]): MenuItem[] {
    const menuStore = useRealtimeMenuStore.getState();
    const items: MenuItem[] = [];
    
    for (const itemId of itemIds) {
      // Find menu item with flexible ID matching
      const menuItem = menuStore.menuItems.find(item => {
        return item.id === itemId || 
               item.id === itemId.replace(/^(auto_card_|card_)/, '') ||
               item.name.toLowerCase().replace(/\s+/g, '_') === itemId;
      });
      
      if (menuItem && menuItem.active) {
        items.push(menuItem);
      } else {
        console.warn('⚠️ Menu item not found for ID:', itemId);
      }
    }
    
    return items;
  }
}

/**
 * Parse streaming chunk as JSON event
 */
export function parseStreamingEvent(chunk: string): StructuredStreamEvent | null {
  try {
    // Remove 'data: ' prefix if present
    const cleanChunk = chunk.replace(/^data: /, '').trim();
    if (!cleanChunk || cleanChunk === '[DONE]') {
      return null;
    }
    
    const event = JSON.parse(cleanChunk) as StructuredStreamEvent;
    
    // Validate event structure
    if (!event.type || !['content', 'ui_element', 'complete'].includes(event.type)) {
      console.warn('Invalid event type:', event.type);
      return null;
    }
    
    return event;
  } catch (error) {
    console.warn('Failed to parse streaming event:', chunk, error);
    return null;
  }
}

/**
 * Create a structured streaming fetch request
 */
export async function createStructuredStreamRequest({
  message,
  conversationHistory = [],
  userId,
  enableStructuredParsing = true,
  includeMenuContext = true,
  includeCartContext = true
}: {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  userId?: string;
  enableStructuredParsing?: boolean;
  includeMenuContext?: boolean;
  includeCartContext?: boolean;
}): Promise<Response> {
  
  // Prepare request body matching ChatRequest structure
  const requestBody: ChatRequest = {
    message,
    conversation_history: conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    user_id: userId || null,
    session_id: `session_${Date.now()}`,
    model_preference: "auto",
    temperature: 0.7,
    max_tokens: 800,
    cart_context: [] // TODO: Add actual cart context when needed
  };
  
  console.log('🚀 Making structured streaming request to enhanced detection API');
  
  return fetch(`${API_URL}/structured-streaming/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/plain'
    },
    body: JSON.stringify(requestBody),
    credentials: 'include'
  });
}
