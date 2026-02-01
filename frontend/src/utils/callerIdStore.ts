/**
 * Caller ID Store
 * Zustand store with Supabase Realtime subscription for incoming call display
 * Manages the caller ID panel that appears in the POS header
 */

import { create } from 'zustand';
import { supabase } from 'utils/supabaseClient';

// ============================================================================
// TYPES
// ============================================================================

export type CallStatus = 'incoming' | 'answered' | 'terminated' | 'missed';
export type CallerType = 'known' | 'unknown' | 'blocked';

export interface CallerIdEvent {
  id: string;
  call_id: string;
  phone_e164: string | null;
  phone_raw: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_reference: string | null;
  call_status: CallStatus;
  display_remote: string | null;
  created_at: string;
  answered_at: string | null;
  terminated_at: string | null;
  dismissed_by: string[];
  ttl_expires_at: string;
}

interface CallerIdState {
  // Data
  events: Record<string, CallerIdEvent>;
  isSubscribed: boolean;
  currentUserId: string | null;
  soundEnabled: boolean;

  // Subscription management
  _channel: ReturnType<typeof supabase.channel> | null;
  _ttlInterval: ReturnType<typeof setInterval> | null;

  // Computed selectors
  activeIncomingCall: () => CallerIdEvent | null;
  missedCalls: () => CallerIdEvent[];
  hasActiveCall: () => boolean;
  activeCallsCount: () => number;

  // Actions
  initialize: (userId: string) => void;
  cleanup: () => void;
  dismissEvent: (eventId: string) => Promise<void>;
  startOrderFromCall: (eventId: string) => Promise<{ customerId: string | null; phone: string }>;
  clearEvent: (eventId: string) => void;

  // Settings
  setSoundEnabled: (enabled: boolean) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Determine the caller type based on event data
 */
function getCallerType(event: CallerIdEvent): CallerType {
  if (!event.phone_raw || event.phone_raw.toLowerCase() === 'withheld') {
    return 'blocked';
  }
  if (event.customer_id) {
    return 'known';
  }
  return 'unknown';
}

/**
 * Check if an event is still active (not expired, not dismissed by current user)
 */
function isEventActive(event: CallerIdEvent, userId: string | null): boolean {
  // Check TTL
  if (new Date(event.ttl_expires_at) <= new Date()) {
    return false;
  }

  // Check if dismissed by current user
  if (userId && event.dismissed_by.includes(userId)) {
    return false;
  }

  // Only show incoming and missed calls
  return event.call_status === 'incoming' || event.call_status === 'missed';
}

/**
 * Format phone number for display (UK format)
 */
export function formatPhoneDisplay(event: CallerIdEvent): string {
  // If blocked/withheld
  if (!event.phone_raw || event.phone_raw.toLowerCase() === 'withheld') {
    return 'Unknown / Withheld';
  }

  // Use display_remote if different from phone (might have caller name)
  if (event.display_remote && event.display_remote !== event.phone_raw) {
    return event.display_remote;
  }

  // Format E.164 to UK national format
  const phone = event.phone_e164 || event.phone_raw;
  if (phone.startsWith('+44')) {
    // Convert +447700900123 to 07700 900123
    const national = '0' + phone.slice(3);
    if (national.length === 11) {
      return `${national.slice(0, 5)} ${national.slice(5, 8)} ${national.slice(8)}`;
    }
    return national;
  }

  return phone;
}

/**
 * Get display name for caller
 */
export function getCallerDisplayName(event: CallerIdEvent): string {
  const callerType = getCallerType(event);

  if (callerType === 'blocked') {
    return 'Unknown / Withheld';
  }

  if (callerType === 'known' && event.customer_name) {
    return event.customer_name;
  }

  return 'Unknown Caller';
}

// ============================================================================
// STORE
// ============================================================================

export const useCallerIdStore = create<CallerIdState>((set, get) => ({
  // Initial state
  events: {},
  isSubscribed: false,
  currentUserId: null,
  soundEnabled: true,
  _channel: null,
  _ttlInterval: null,

  // ==========================================================================
  // COMPUTED SELECTORS
  // ==========================================================================

  activeIncomingCall: () => {
    const { events, currentUserId } = get();
    const now = new Date();

    // Find the most recent active incoming call
    const activeEvents = Object.values(events)
      .filter(e => isEventActive(e, currentUserId))
      .filter(e => e.call_status === 'incoming')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return activeEvents[0] || null;
  },

  missedCalls: () => {
    const { events, currentUserId } = get();

    return Object.values(events)
      .filter(e => isEventActive(e, currentUserId))
      .filter(e => e.call_status === 'missed')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  hasActiveCall: () => {
    return get().activeIncomingCall() !== null;
  },

  activeCallsCount: () => {
    const { events, currentUserId } = get();
    return Object.values(events).filter(e => isEventActive(e, currentUserId)).length;
  },

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  initialize: (userId: string) => {
    const { _channel, _ttlInterval } = get();

    // Cleanup existing subscriptions
    if (_channel) {
      supabase.removeChannel(_channel);
    }
    if (_ttlInterval) {
      clearInterval(_ttlInterval);
    }

    set({ currentUserId: userId, isSubscribed: false });

    // Fetch existing active events
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('caller_id_events')
          .select('*')
          .in('call_status', ['incoming', 'missed'])
          .gt('ttl_expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('[CallerID] Failed to fetch events:', error);
          return;
        }

        if (data) {
          const eventsMap: Record<string, CallerIdEvent> = {};
          data.forEach(e => {
            eventsMap[e.id] = e as CallerIdEvent;
          });
          set({ events: eventsMap });
        }
      } catch (err) {
        console.error('[CallerID] Fetch error:', err);
      }
    };

    fetchEvents();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('callerid-events-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'caller_id_events'
        },
        (payload) => {
          const event = payload.new as CallerIdEvent;
          console.log('[CallerID] New event:', event.call_id, event.call_status);

          set(state => ({
            events: { ...state.events, [event.id]: event }
          }));

          // Play sound for new incoming calls
          if (event.call_status === 'incoming' && get().soundEnabled) {
            // Use existing sound notification system if available
            // For now, just log - can integrate with soundNotifications.ts later
            console.log('[CallerID] Would play incoming call sound');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'caller_id_events'
        },
        (payload) => {
          const event = payload.new as CallerIdEvent;
          console.log('[CallerID] Event updated:', event.call_id, event.call_status);

          set(state => ({
            events: { ...state.events, [event.id]: event }
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'caller_id_events'
        },
        (payload) => {
          const eventId = (payload.old as any).id;
          console.log('[CallerID] Event deleted:', eventId);

          set(state => {
            const newEvents = { ...state.events };
            delete newEvents[eventId];
            return { events: newEvents };
          });
        }
      )
      .subscribe((status) => {
        console.log('[CallerID] Subscription status:', status);
        set({ isSubscribed: status === 'SUBSCRIBED' });
      });

    // TTL cleanup interval - remove expired events every 30 seconds
    const ttlInterval = setInterval(() => {
      const now = new Date();
      set(state => {
        const filtered: Record<string, CallerIdEvent> = {};
        Object.entries(state.events).forEach(([id, event]) => {
          if (new Date(event.ttl_expires_at) > now) {
            filtered[id] = event;
          }
        });
        return { events: filtered };
      });
    }, 30_000);

    set({ _channel: channel, _ttlInterval: ttlInterval });
  },

  cleanup: () => {
    const { _channel, _ttlInterval } = get();

    if (_channel) {
      supabase.removeChannel(_channel);
    }
    if (_ttlInterval) {
      clearInterval(_ttlInterval);
    }

    set({
      events: {},
      isSubscribed: false,
      _channel: null,
      _ttlInterval: null
    });
  },

  dismissEvent: async (eventId: string) => {
    const { currentUserId, events } = get();
    if (!currentUserId || !events[eventId]) return;

    const event = events[eventId];
    const newDismissed = [...event.dismissed_by, currentUserId];

    // Optimistic update
    set(state => ({
      events: {
        ...state.events,
        [eventId]: { ...event, dismissed_by: newDismissed }
      }
    }));

    // Persist to database
    try {
      await supabase
        .from('caller_id_events')
        .update({ dismissed_by: newDismissed })
        .eq('id', eventId);
    } catch (err) {
      console.error('[CallerID] Failed to dismiss event:', err);
      // Revert on failure
      set(state => ({
        events: {
          ...state.events,
          [eventId]: event
        }
      }));
    }
  },

  startOrderFromCall: async (eventId: string) => {
    const event = get().events[eventId];
    if (!event) {
      return { customerId: null, phone: '' };
    }

    // Dismiss the event
    await get().dismissEvent(eventId);

    return {
      customerId: event.customer_id,
      phone: event.phone_e164 || event.phone_raw
    };
  },

  clearEvent: (eventId: string) => {
    set(state => {
      const newEvents = { ...state.events };
      delete newEvents[eventId];
      return { events: newEvents };
    });
  },

  // ==========================================================================
  // SETTINGS
  // ==========================================================================

  setSoundEnabled: (enabled: boolean) => {
    set({ soundEnabled: enabled });
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('callerIdSoundEnabled', String(enabled));
    }
  }
}));

// Load sound setting from localStorage on module init
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('callerIdSoundEnabled');
  if (saved !== null) {
    useCallerIdStore.setState({ soundEnabled: saved === 'true' });
  }
}
