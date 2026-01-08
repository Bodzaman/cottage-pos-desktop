/**
 * Simple Event Bus for component communication
 * Used primarily for menu publish system to notify dashboard of changes
 */
class SimpleEventBus {
  private events: { [key: string]: Function[] } = {};

  /**
   * Subscribe to an event
   * @param event Event name to listen for
   * @param callback Function to call when event is emitted
   */
  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  /**
   * Unsubscribe from an event
   * @param event Event name to stop listening for
   * @param callback Function to remove from listeners
   */
  off(event: string, callback: Function) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  /**
   * Emit an event to all listeners
   * @param event Event name to emit
   * @param data Optional data to pass to listeners
   */
  emit(event: string, data?: any) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for '${event}':`, error);
      }
    });
  }

  /**
   * Remove all listeners for an event or all events
   * @param event Optional event name to clear, if not provided clears all
   */
  clear(event?: string) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }

  /**
   * Get list of events that have listeners
   */
  getEvents(): string[] {
    return Object.keys(this.events);
  }

  /**
   * Get number of listeners for an event
   */
  getListenerCount(event: string): number {
    return this.events[event]?.length || 0;
  }
}

// Export a singleton instance
export const eventBus = new SimpleEventBus();

// Export the class for testing or custom instances
export { SimpleEventBus };

// Define event names as constants to avoid typos
export const EVENTS = {
  MENU_PUBLISHED: 'menu-published',
  MENU_CHANGES_MADE: 'menu-changes-made',
  MENU_CHANGES_SAVED: 'menu-changes-saved',
  MENU_STATUS_UPDATE: 'menu-status-update',
  // Voice agent status events
  MENU_CHANGED: 'menu-changed',
  CORPUS_SYNCED: 'corpus-synced',
  VOICE_AGENT_STATUS_REFRESH: 'voice-agent-status-refresh',
  VOICE_AGENT_STATUS_CHANGED: 'voice-agent-status-changed',
  MENU_ITEM_CREATED: 'menu-item-created',
  MENU_ITEM_UPDATED: 'menu-item-updated',
  MENU_ITEM_DELETED: 'menu-item-deleted'
} as const;

export type EventType = typeof EVENTS[keyof typeof EVENTS];

// Event data interfaces for better type safety
export interface EventData {
  timestamp: string;
  source?: string;
  [key: string]: any;
}

export interface MenuChangeEventData extends EventData {
  action: 'created' | 'updated' | 'deleted' | 'published';
  itemId?: string;
}

export interface VoiceAgentEventData extends EventData {
  status?: 'connected' | 'disconnected' | 'checking';
  success?: boolean;
}

// Helper functions for emitting common events
export const emitMenuChangeEvent = (action: MenuChangeEventData['action'], itemId?: string, source?: string) => {
  const eventData: MenuChangeEventData = {
    timestamp: new Date().toISOString(),
    action,
    source: source || 'unknown',
    ...(itemId && { itemId })
  };
  
  eventBus.emit(EVENTS.MENU_CHANGED, eventData);
  console.log('🔄 Menu change event emitted:', eventData);
};

// Helper function to emit corpus sync events
export const emitCorpusSyncEvent = (success: boolean, source?: string) => {
  const eventData: VoiceAgentEventData = {
    timestamp: new Date().toISOString(),
    success,
    source: source || 'unknown'
  };
  
  eventBus.emit(EVENTS.CORPUS_SYNCED, eventData);
  console.log('🔄 Corpus sync event emitted:', eventData);
};

// Helper function to emit voice agent status refresh
export const emitVoiceAgentRefresh = (source?: string) => {
  const eventData: EventData = {
    timestamp: new Date().toISOString(),
    source: source || 'unknown'
  };
  
  eventBus.emit(EVENTS.VOICE_AGENT_STATUS_REFRESH, eventData);
  console.log('🔄 Voice agent status refresh event emitted:', eventData);
};
