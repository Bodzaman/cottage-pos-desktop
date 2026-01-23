import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import brain from 'brain';
import { API_PREFIX_PATH, API_PATH, API_URL } from '../constants';
import { useCartStore } from './cartStore';
import { useRealtimeMenuStore } from './realtimeMenuStore';
import { detectDishMentionsFast } from './dishMentionDetector';
import { MenuItem } from './menuTypes';
import { toast } from 'sonner';
import { validateChatMessage, cleanupCorruptedMessages } from './messageValidation';
import { supabase } from './supabaseClient';
import { getOrCreateSessionId } from './session-manager';
import { useAgentConfigStore } from './agentConfigStore';

// NEW: Import structured streaming components
import {
  StructuredStreamHandler,
  parseStreamingEvent,
  createStructuredStreamRequest,
  type ProcessedMessage,
  type MessageContentPart
} from './structured-stream-handler';

// NEW: Import unified structured event types
import {
  type StructuredEvent,
  type MenuRef,
  type SuggestedAction,
  type CartProposal,
  type CartProposalItem,
  isTextDeltaEvent,
  isMenuRefsEvent,
  isSuggestedActionsEvent,
  isCartProposalEvent,
  isMetadataEvent,
  isCompleteEvent,
  isErrorEvent,
} from '../types/structured-events';

// ✅ Platform-agnostic VoiceCallStatus enum
export enum VoiceCallStatus {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  FAILED = 'failed'
}

// Utility function to generate unique message IDs
const generateMessageId = (): string => {
  return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// ✅ STREAMING BUFFER: Batch updates to prevent per-character re-renders
let streamBuffer = '';
let bufferTimer: NodeJS.Timeout | null = null;
const BUFFER_INTERVAL = 30; // Update every 30ms for near real-time ~33fps streaming

// Helper function to flush the streaming buffer
const flushStreamBuffer = (messageId: string, accumulatedContent: string, set: any) => {
  // Clear any pending timer
  if (bufferTimer) {
    clearTimeout(bufferTimer);
    bufferTimer = null;
  }
  
  // ✅ VALIDATE: Ensure accumulated content is always a string
  const validatedContent = typeof accumulatedContent === 'string' 
    ? accumulatedContent 
    : String(accumulatedContent || '');
  
  // Always update the message with validated content
  set((state: any) => ({
    messages: state.messages.map((msg: ChatMessage) =>
      msg.id === messageId
        ? { ...msg, content: validatedContent }
        : msg
    )
  }));

  return validatedContent;
};

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isTyping?: boolean;
  isStreaming?: boolean;
  // NEW: Support structured content parts
  structuredParts?: MessageContentPart[];
  menuCards?: MenuItem[];
  // NEW: Structured event protocol fields
  /** Menu item references for rendering cards (from model structured output) */
  menuRefs?: MenuRef[];
  /** Suggested quick-reply actions */
  suggestedActions?: SuggestedAction[];
  metadata?: {
    userId?: string;
    sessionId?: string;
    messageType?: 'query' | 'order' | 'menu' | 'general' | 'cart_confirmation' | 'cart_summary';
    confidence?: number;
    modelUsed?: string;
    latencyMs?: number;
    cartItemName?: string;
    // NEW: Structured event metadata
    intent?: string;
    toolsUsed?: string[];
  };
}

interface ChatState {
  // Chat UI State
  isOpen: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  isTyping: boolean; // NEW: Global typing indicator state
  
  // NEW: View Mode State for expandable modal
  viewMode: 'compact' | 'expanded';
  
  // NEW: System Prompt State (Primary Agent Integration)
  systemPrompt: string;
  agentName: string;
  agentNationality: string;
  isLoadingPrompt: boolean;
  
  // NEW: Voice Call State (Platform-Agnostic)
  isVoiceCallActive: boolean;
  voiceCallStatus: VoiceCallStatus;
  voiceCallId: string | null;
  showVoiceTCScreen: boolean;
  liveTranscript: string;
  isAISpeaking: boolean;
  
  // Messages
  messages: ChatMessage[];
  sessionId: string;
  
  // NEW: Structured streaming state
  streamHandler: StructuredStreamHandler | null;

  // NEW: Pending cart proposal requiring user confirmation
  pendingCartProposal: CartProposal | null;
  isCartConfirmOpen: boolean;

  // User Context (for personalization)
  userContext: {
    isAuthenticated: boolean;
    userId?: string;
    userName?: string;
    orderHistory?: any[];
    favorites?: any[];
  };
  
  // Configuration
  config: {
    welcomeMessage: string;
    maxMessages: number;
    enableVoice: boolean;
    enablePersonalization: boolean;
    modelPreference: 'auto' | 'openai' | 'gemini';
    temperature: number;
    botName: string;
    botAvatar?: string;
  };
  
  // Actions
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  
  // NEW: View Mode Actions
  setViewMode: (mode: 'compact' | 'expanded') => void;
  expandToLargeModal: () => void;
  minimizeToCompact: () => void;
  
  // NEW: Voice Call Actions
  startVoiceCall: () => void;
  endVoiceCall: () => void;
  updateVoiceStatus: (status: VoiceCallStatus) => void;
  setVoiceCallId: (callId: string | null) => void;
  setShowVoiceTCScreen: (show: boolean) => void;
  setLiveTranscript: (transcript: string) => void;
  setIsAISpeaking: (speaking: boolean) => void;
  
  // Message Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  addMessageWithDetection: (message: Omit<ChatMessage, 'id' | 'timestamp' | 'menuCards'>) => void;
  updateLastMessage: (content: string, metadata?: Partial<ChatMessage['metadata']>) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  
  // Streaming Chat API
  abortController: AbortController | null;
  sendMessage: (message: string) => Promise<void>;
  stopGeneration: () => void;
  
  // NEW: Structured response processing
  processStructuredElements: (elements: any[]) => Promise<MenuItem[]>;

  // NEW: Cart proposal actions
  setPendingCartProposal: (proposal: CartProposal | null) => void;
  openCartConfirmDialog: () => void;
  closeCartConfirmDialog: () => void;
  confirmCartProposal: (items: CartProposalItem[]) => Promise<void>;
  cancelCartProposal: () => void;

  // NEW: Handle structured events
  handleStructuredEvent: (event: StructuredEvent, messageId: string) => void;

  // User Context Actions
  setUserContext: (context: Partial<ChatState['userContext']>) => void;
  
  // Clear user context (called on logout)
  clearUserContext: () => void;
  
  // Session Management
  startNewSession: () => void;
  
  // Configuration
  updateConfig: (config: Partial<ChatState['config']>) => void;

  // NEW: Load system prompt from primary agent
  loadSystemPrompt: () => Promise<void>;
}

const generateSessionId = () => {
  return `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const defaultConfig = {
  welcomeMessage: 'Hi there! 👋 I\'m the Cottage Tandoori AI assistant. I can help you with menu questions, dietary requirements, opening hours, and placing orders. How can I assist you today?',
  maxMessages: 100,
  enableVoice: false,
  enablePersonalization: true,
  modelPreference: 'auto' as const,
  temperature: 0.7,
  botName: 'Cottage Tandoori Assistant',
  botAvatar: undefined
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial State
      isOpen: false,
      isLoading: false,
      isStreaming: false,
      isTyping: false,
      viewMode: 'compact',
      
      // NEW: System Prompt Initial State
      systemPrompt: '',
      agentName: 'Uncle Raj',
      agentNationality: 'british-indian',
      isLoadingPrompt: false,
      
      // NEW: Voice Call Initial State
      isVoiceCallActive: false,
      voiceCallStatus: VoiceCallStatus.IDLE,
      voiceCallId: null,
      showVoiceTCScreen: false,
      liveTranscript: '',
      isAISpeaking: false,
      
      messages: [],
      sessionId: generateSessionId(),

      streamHandler: null,

      // Abort controller for stop generation
      abortController: null,

      // NEW: Cart proposal state
      pendingCartProposal: null,
      isCartConfirmOpen: false,

      userContext: {
        isAuthenticated: false,
        userId: undefined,
        userName: undefined,
        orderHistory: [],
        favorites: []
      },

      config: defaultConfig,

      // Actions
      toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
      openChat: () => set({ isOpen: true }),
      closeChat: () => set({ isOpen: false }),

      // NEW: View Mode Actions
      setViewMode: (mode) => set({ viewMode: mode }),
      expandToLargeModal: () => set({ viewMode: 'expanded' }),
      minimizeToCompact: () => set({ viewMode: 'compact' }),

      // NEW: Voice Call Actions
      startVoiceCall: () => set({
        isVoiceCallActive: true,
        voiceCallStatus: VoiceCallStatus.CONNECTING
      }),
      endVoiceCall: () => set({
        isVoiceCallActive: false,
        voiceCallStatus: VoiceCallStatus.IDLE,
        voiceCallId: null,
        liveTranscript: '',
        isAISpeaking: false
      }),
      updateVoiceStatus: (status) => set({ voiceCallStatus: status }),
      setVoiceCallId: (callId) => set({ voiceCallId: callId }),
      setShowVoiceTCScreen: (show) => set({ showVoiceTCScreen: show }),
      setLiveTranscript: (transcript) => set({ liveTranscript: transcript }),
      setIsAISpeaking: (speaking) => set({ isAISpeaking: speaking }),

      // Message Actions
      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: generateMessageId(),
          timestamp: new Date()
        };

        set((state) => ({
          messages: [...state.messages, newMessage].slice(-state.config.maxMessages)
        }));
      },

      // Phase 7 Fix: Implement addMessageWithDetection for dish mention detection
      addMessageWithDetection: (message) => {
        // Detect dish mentions in the message content
        const detected = detectDishMentionsFast(message.content);

        // Create enriched message with menu cards if dishes were detected
        const enrichedMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
          ...message,
          menuCards: detected.length > 0 ? detected : undefined
        };

        // Use addMessage to add the enriched message
        get().addMessage(enrichedMessage);
      },

      clearMessages: () => set({ messages: [] }),
      setLoading: (loading) => set({ isLoading: loading }),
      setStreaming: (streaming) => set({ isStreaming: streaming }),

      // Streaming message sending
      sendMessage: async (message: string) => {
        const { sessionId, userContext } = get();

        // Add user message immediately
        const userMessage: ChatMessage = {
          id: generateMessageId(),
          content: message,
          sender: 'user',
          timestamp: new Date(),
          metadata: {
            userId: userContext.userId,
            sessionId,
            messageType: 'query'
          }
        };

        set((state) => ({
          messages: [...state.messages, userMessage],
          isLoading: true,
          isTyping: true
        }));
      
        
        // ✅ OPTIMISTIC UI: Show typing indicator immediately
        const typingMessageId = generateMessageId();
        const typingMessage: ChatMessage = {
          id: typingMessageId,
          content: '',
          sender: 'bot',
          timestamp: new Date(),
          isTyping: true
        };

        set((state) => ({
          messages: [...state.messages, typingMessage]
        }));

        try {
          // Build conversation history for context
          const conversationHistory = get().messages
            .filter(msg => !msg.isStreaming && !msg.isTyping)
            .slice(-6)
            .map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.content
            }));
          // ✅ PHASE 1 (MYA-1549): Fetch latest cart from Supabase BEFORE sending message
          // This ensures AI always has real-time cart knowledge, even if cart changed
          // during the conversation (e.g., user added item, then asks "what's in my cart?")
          const cartStore = useCartStore.getState();
          await cartStore.fetchCartFromSupabase();

          // 🛡️ SAFE VARIANT EXTRACTION: Avoid touching circular React/DOM objects
          const safeVariantExtract = (variant: any) => {
            if (!variant || typeof variant !== 'object') return null;
            
            // Only extract primitive string/number properties, never touch objects/functions
            const id = typeof variant.id === 'string' || typeof variant.id === 'number' ? variant.id : null;
            const name = typeof variant.name === 'string' ? variant.name : null;
            const variantName = typeof variant.variant_name === 'string' ? variant.variant_name : null;
            
            return {
              id,
              name: name || variantName || null
            };
          };

          // 🛡️ SAFE JSON STRINGIFY: Prevent circular reference errors in logging
          const safeStringify = (obj: any, maxDepth: number = 3) => {
            const seen = new WeakSet();
            
            const replacer = (key: string, value: any, depth: number = 0): any => {
              // Depth limit to prevent infinite recursion
              if (depth > maxDepth) return '[Max Depth Reached]';
              
              if (value === null || value === undefined) return value;
              
              // Handle primitive types
              if (typeof value !== 'object') return value;
              
              // Detect circular references
              if (seen.has(value)) return '[Circular Reference]';
              
              // Detect React/DOM objects by constructor name
              const constructorName = value.constructor?.name || '';
              if (constructorName.includes('Element') || 
                  constructorName.includes('Fiber') || 
                  constructorName.includes('HTML') || 
                  constructorName.includes('SVG')) {
                return '[React/DOM Object]';
              }
              
              seen.add(value);
              
              // Handle arrays
              if (Array.isArray(value)) {
                return value.map((item, index) => replacer(String(index), item, depth + 1));
              }
              
              // Handle objects
              const result: any = {};
              for (const k in value) {
                if (value.hasOwnProperty(k)) {
                  result[k] = replacer(k, value[k], depth + 1);
                }
              }
              return result;
            };
            
            try {
              return JSON.stringify(obj, (key, value) => replacer(key, value));
            } catch (e) {
              return `[Serialization Error: ${e instanceof Error ? e.message : 'Unknown'}]`;
            }
          };

          // Map cart items to clean structure for AI (avoiding circular references)
          const cart_context = cartStore.items.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            variant: safeVariantExtract(item.variant),
            customizations: item.customizations || [],
            notes: item.notes || null
          }));

          // Create AbortController for stop generation capability
          const abortController = new AbortController();
          set({ abortController });

          // Make streaming chat request (Phase 8: Using correct Phase 6 compliant endpoint)
          // NOTE: Backend uses /routes prefix for all API endpoints (see backend/main.py)
          const response = await fetch(`${API_URL}/routes/streaming-chat/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: abortController.signal,
            body: JSON.stringify({
              message,
              conversation_history: conversationHistory,
              user_id: userContext.userId,
              session_id: sessionId,
              cart_context,
              // Phase 8: Removed enable_structured_parsing (not used by /streaming-chat/chat)
            }),
          });
          
          if (!response.ok) {
            // ✅ DIAGNOSTIC: Try to get response body for debugging
            let errorBody = 'Could not read error body';
            try {
              errorBody = await response.text();
            } catch (e) {
              console.error('Failed to read error response body:', e);
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorBody}`);
          }
          
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body reader available');
          }
          
          const decoder = new TextDecoder();
          let accumulatedContent = '';
          let menuCards: MenuItem[] = [];
          let isFirstChunk = true;
          let botMessageId = ''; // Will be set when we replace typing indicator
          
          // Process streaming events with line buffering
          // (large JSON payloads like structured_data can span multiple chunks)
          let lineBuffer = '';
          let streamComplete = false;

          while (true) {
            const { done, value } = await reader.read();
            if (done || streamComplete) break;

            const chunk = decoder.decode(value, { stream: true });
            lineBuffer += chunk;

            // Split into complete lines, keep last (possibly incomplete) line in buffer
            const lines = lineBuffer.split('\n');
            lineBuffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim()) {
                try {
                  const cleanLine = line.replace(/^data: /, '').trim();
                  if (cleanLine && cleanLine !== '[DONE]') {
                    const event = JSON.parse(cleanLine);
                    
                    if (event.type === 'content' && event.text) {
                      // ✅ On first content chunk:
                      // - Transition typing indicator into streaming message (same DOM element)
                      // - This prevents abrupt swap and enables smooth crossfade
                      if (isFirstChunk) {
                        botMessageId = typingMessageId; // Reuse same message ID for smooth transition

                        set((state) => ({
                          messages: state.messages.map(msg =>
                            msg.id === typingMessageId
                              ? { ...msg, isTyping: false, isStreaming: true, content: '' }
                              : msg
                          ),
                          isLoading: false,
                          isStreaming: true,
                          isTyping: false
                        }));

                        isFirstChunk = false;
                      }
                      
                      accumulatedContent += event.text;
                      
                      // ✅ FIX: Clear existing timer and restart with latest content
                      if (bufferTimer) {
                        clearTimeout(bufferTimer);
                      }
                      
                      bufferTimer = setTimeout(() => {
                        const fullContent = accumulatedContent;
                        set((state) => ({
                          messages: state.messages.map((msg) =>
                            msg.id === botMessageId
                              ? { ...msg, content: fullContent }
                              : msg
                          )
                        }));
                        bufferTimer = null;
                      }, BUFFER_INTERVAL);
                    } else if (event.type === 'text' && (event.text || event.content)) {
                      // Handle 'text' event from /streaming-chat/chat endpoint
                      // Backend sends { type: "text", content: "..." } so handle both properties
                      const textContent = event.text || event.content;
                      if (isFirstChunk) {
                        botMessageId = typingMessageId; // Reuse same message ID for smooth transition

                        set((state) => ({
                          messages: state.messages.map(msg =>
                            msg.id === typingMessageId
                              ? { ...msg, isTyping: false, isStreaming: true, content: '' }
                              : msg
                          ),
                          isLoading: false,
                          isStreaming: true,
                          isTyping: false
                        }));

                        isFirstChunk = false;
                      }

                      accumulatedContent += textContent;

                      // Throttled update for smooth streaming
                      if (bufferTimer) {
                        clearTimeout(bufferTimer);
                      }

                      bufferTimer = setTimeout(() => {
                        const fullContent = accumulatedContent;
                        set((state) => ({
                          messages: state.messages.map((msg) =>
                            msg.id === botMessageId
                              ? { ...msg, content: fullContent }
                              : msg
                          )
                        }));
                        bufferTimer = null;
                      }, BUFFER_INTERVAL);
                    } else if (event.type === 'structured_data' && event.items) {
                      // Handle structured menu data with images from backend
                      console.log(`[chat-store] Received structured_data: ${event.items.length} items`,
                        event.items.map((i: any) => i.name));

                      // Flush text buffer immediately before adding structured data
                      accumulatedContent = flushStreamBuffer(botMessageId, accumulatedContent, set);
                      
                      // ✅ FIX: Map backend field names correctly (menu_item_id → id, category → category_id)
                      const structuredMenuCards: MenuItem[] = event.items.map((item: any) => ({
                        id: item.menu_item_id || item.id,
                        name: item.name,
                        description: item.description || null,
                        image_url: item.image_url || null,
                        spice_indicators: item.spice_indicators || null,
                        category_id: item.category || item.category_id,
                        variants: item.variants || [],
                        price: item.price || 0,
                        featured: false,
                        dietary_tags: null,
                        display_order: 0,
                        active: true,
                        kitchen_display_name: null,
                        item_code: null
                      }));

                      // Add to menuCards array
                      menuCards.push(...structuredMenuCards);

                      // Update message with menu cards for rendering
                      set((state) => ({
                        messages: state.messages.map((msg) =>
                          msg.id === botMessageId
                            ? { ...msg, menuCards: [...(msg.menuCards || []), ...structuredMenuCards] }
                            : msg
                        )
                      }));
                      console.log(`[chat-store] menuCards updated: ${structuredMenuCards.length} cards for message ${botMessageId}`);
                    } else if (event.type === 'ui_element' && event.element === 'menu_card') {
                      // Flush buffer immediately before adding menu card
                      accumulatedContent = flushStreamBuffer(botMessageId, accumulatedContent, set);
                      
                      // ✅ FIX: Create MenuItem with correct properties
                      const menuItem: MenuItem = {
                        id: event.item_id || '',
                        name: event.item_name || '',
                        description: event.description || null,
                        image_url: event.image_url || null,
                        spice_indicators: event.spice_indicators || null,
                        category_id: event.category_id || '',
                        variants: event.variants || [],
                        price: event.price || 0,
                        featured: false,
                        dietary_tags: null,
                        display_order: 0,
                        active: true,
                        kitchen_display_name: null,
                        item_code: null
                      };

                      menuCards.push(menuItem);

                      set((state) => ({
                        messages: state.messages.map((msg) =>
                          msg.id === botMessageId
                            ? { ...msg, menuCards: [...(msg.menuCards || []), menuItem] }
                            : msg
                        )
                      }));
                    } else if (event.type === 'cart_operation') {
                      // ✅ FIX: Handle cart operations with correct API
                      const { operation, result } = event;
                      const cartStore = useCartStore.getState();
                      
                      switch (operation) {
                        case 'add_to_cart':
                          if (!result.requires_clarification && result.item) {
                            // ✅ FIXED: Use enriched item data directly from backend
                            // Backend now returns COMPLETE MenuItem structure
                            const menuItem: MenuItem = {
                              id: result.item.id,
                              name: result.item.name,
                              description: result.item.description || null,
                              image_url: result.item.image_url || null,
                              spice_indicators: null,
                              category_id: result.item.category_id || '',  // ✅ Now provided by backend
                              featured: false,
                              dietary_tags: null,
                              display_order: 0,
                              active: result.item.is_active !== undefined ? result.item.is_active : true,
                              // Core pricing data from backend
                              price: result.item.price || 0,
                              variants: [],
                              // Additional fields from backend
                              kitchen_display_name: result.item.kitchen_display_name || null,
                              item_code: null
                            };
                            
                            // ✅ Use variant data from enriched backend response
                            const variant = result.item.variant || null;
                            
                            // ✅ Add to cart with all required parameters
                            cartStore.addItem(
                              menuItem,                         // Complete MenuItem object
                              variant,                          // variant object (with id, name, price)
                              result.quantity || 1,             // quantity
                              result.item.customizations || [],      // customizations array
                              result.item.orderMode || cartStore.currentOrderMode,        // orderMode from backend or store
                              result.item.notes || undefined   // notes (optional)
                            );
                            
                            toast.success(result.message || 'Added to cart');
                            // ❌ REMOVED: cartStore.openCart() - Use industry-standard non-intrusive UX
                            // Cart badge updates automatically, user clicks trolley icon when ready
                          }
                          break;
                          
                        case 'remove_from_cart':
                          if (result.cart_item_id) {
                            cartStore.removeItem(result.cart_item_id);
                            toast.success(result.message || 'Removed from cart');
                          }
                          break;
                          
                        case 'update_quantity':
                          if (result.cart_item_id && result.new_quantity !== undefined) {
                            cartStore.updateQuantity?.(result.cart_item_id, result.new_quantity);
                            toast.success(result.message || 'Quantity updated');
                          }
                          break;
                          
                        case 'clear_cart':
                          cartStore.clearCart();
                          toast.success(result.message || 'Cart cleared');
                          break;
                          
                        case 'get_cart_summary':
                          // AI just reads cart, no action needed
                          break;
                      }
                      
                      // ✅ NEW (MYA-1547): Refresh cart from Supabase after any AI cart operation
                      // This ensures cart drawer reflects the latest state from database
                      if (operation !== 'get_cart_summary') {
                        await cartStore.fetchCartFromSupabase();
                      }
                    } else if (event.type === 'menu_refs') {
                      // Phase 7: Handle menu_refs structured event
                      // These are menu item references from model structured output
                      if (botMessageId && event.items && Array.isArray(event.items)) {
                        get().handleStructuredEvent(event as any, botMessageId);
                      }
                    } else if (event.type === 'suggested_actions') {
                      // Phase 7: Handle suggested_actions structured event
                      // These are quick-reply action chips
                      if (botMessageId && event.actions && Array.isArray(event.actions)) {
                        get().handleStructuredEvent(event as any, botMessageId);
                      }
                    } else if (event.type === 'cart_proposal') {
                      // Phase 7: Handle cart_proposal structured event
                      // This requires user confirmation before modifying cart
                      if (event.proposal) {
                        get().handleStructuredEvent(event as any, botMessageId);
                      }
                    } else if (event.type === 'metadata') {
                      // Phase 7: Handle metadata structured event
                      // Store intent, confidence, and tools used for analytics
                      if (botMessageId) {
                        get().handleStructuredEvent(event as any, botMessageId);
                      }
                    } else if (event.type === 'complete') {
                      // Flush buffer immediately on completion
                      if (botMessageId) {
                        accumulatedContent = flushStreamBuffer(botMessageId, accumulatedContent, set);
                      }
                      
                      // ❌ REMOVED: Dangerous sync-on-complete that overwrites frontend cart
                      // The backend cart (Supabase session_cart) is empty because frontend
                      // cart lives in localStorage. Syncing on every completion was clearing
                      // the cart when AI just READS it (e.g., "what's in my cart?").
                      //
                      // Cart modifications (add/remove/update/clear) already emit cart_operation
                      // events that update the frontend cart immediately during streaming.
                      // No need to sync again on completion.
                      
                      // Streaming complete
                      set((state) => ({
                        messages: state.messages.map((msg) =>
                          msg.id === botMessageId
                            ? { ...msg, isStreaming: false }
                            : msg
                        ),
                        isStreaming: false,
                        isLoading: false,
                        isTyping: false,
                        abortController: null
                      }));
                      streamComplete = true;
                      break;
                    }
                  }
                } catch (parseError) {
                  console.error('[chat-store] Failed to parse stream event:', line, parseError);
                }
              }
            }
          }
          

        } catch (error: any) {
          // If aborted by user (stop generation), just finalize the current message
          if (error?.name === 'AbortError') {
            set((state) => ({
              messages: state.messages
                .filter(msg => msg.id !== typingMessageId)
                .map(msg => msg.id === botMessageId ? { ...msg, isStreaming: false } : msg),
              isLoading: false,
              isStreaming: false,
              isTyping: false,
              abortController: null
            }));
            return;
          }

          console.error('[chat-store] Failed to send message:', error);

          // ✅ OPTIMISTIC UI ERROR HANDLING:
          // Remove typing indicator and show error message
          const errorMessageId = generateMessageId();
          const errorMessage: ChatMessage = {
            id: errorMessageId,
            content: 'Sorry, I encountered an error. Please try again.',
            sender: 'bot',
            timestamp: new Date()
          };

          set((state) => ({
            messages: state.messages.filter(msg => msg.id !== typingMessageId).concat(errorMessage),
            isLoading: false,
            isStreaming: false,
            isTyping: false,
            abortController: null
          }));
        }
      },

      // Stop generation: abort streaming and keep current content
      stopGeneration: () => {
        const { abortController } = get();
        if (abortController) {
          abortController.abort();
        }
      },
      
      // NEW: Process structured elements into menu cards
      processStructuredElements: async (elements: any[]) => {
        const menuStore = useRealtimeMenuStore.getState();
        const menuCards: MenuItem[] = [];

        for (const element of elements) {
          if (element.type === 'menu_card' && element.item_id) {
            // Find the menu item by ID
            const menuItem = menuStore.menuItems.find(item =>
              item.id === element.item_id ||
              item.name.toLowerCase().replace(/\s+/g, '_') === element.item_id
            );

            if (menuItem && menuItem.active) {
              menuCards.push(menuItem);
            }
          }
        }

        return menuCards;
      },

      // NEW: Cart proposal actions
      setPendingCartProposal: (proposal: CartProposal | null) => {
        set({ pendingCartProposal: proposal });
      },

      openCartConfirmDialog: () => {
        set({ isCartConfirmOpen: true });
      },

      closeCartConfirmDialog: () => {
        set({ isCartConfirmOpen: false });
      },

      confirmCartProposal: async (items: CartProposalItem[]) => {
        const cartStore = useCartStore.getState();
        const menuStore = useRealtimeMenuStore.getState();
        const { pendingCartProposal } = get();

        if (!pendingCartProposal) return;

        try {
          for (const item of items) {
            // Find the full menu item from the store
            const menuItem = menuStore.menuItems.find(mi => mi.id === item.menu_item_id);

            if (menuItem) {
              // Find variant if specified
              const variant = item.variant_id
                ? menuItem.variants?.find(v => v.id === item.variant_id)
                : null;

              // Add to cart
              cartStore.addItem(
                menuItem,
                variant || null,
                item.quantity,
                item.customizations || [],
                cartStore.currentOrderMode,
                item.notes
              );
            }
          }

          // Sync cart after adding items
          await cartStore.fetchCartFromSupabase();

          toast.success('Items added to cart');
        } catch (error) {
          console.error('[chat-store] Failed to confirm cart proposal:', error);
          toast.error('Failed to add items to cart');
        }

        // Clear the proposal
        set({
          pendingCartProposal: null,
          isCartConfirmOpen: false
        });
      },

      cancelCartProposal: () => {
        set({
          pendingCartProposal: null,
          isCartConfirmOpen: false
        });
      },

      // NEW: Handle unified structured events
      handleStructuredEvent: (event: StructuredEvent, messageId: string) => {
        if (isTextDeltaEvent(event)) {
          // Text deltas are handled in the streaming loop
          return;
        }

        if (isMenuRefsEvent(event)) {
          // Add menu refs to the message for card rendering
          set((state) => ({
            messages: state.messages.map((msg) =>
              msg.id === messageId
                ? { ...msg, menuRefs: [...(msg.menuRefs || []), ...event.items] }
                : msg
            )
          }));
          return;
        }

        if (isSuggestedActionsEvent(event)) {
          // Add suggested actions to the message
          set((state) => ({
            messages: state.messages.map((msg) =>
              msg.id === messageId
                ? { ...msg, suggestedActions: event.actions }
                : msg
            )
          }));
          return;
        }

        if (isCartProposalEvent(event)) {
          // Set pending cart proposal and open confirmation dialog
          set({
            pendingCartProposal: event.proposal,
            isCartConfirmOpen: true
          });
          return;
        }

        if (isMetadataEvent(event)) {
          // Store metadata on the message
          set((state) => ({
            messages: state.messages.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    metadata: {
                      ...msg.metadata,
                      intent: event.intent,
                      confidence: event.confidence,
                      toolsUsed: event.toolsUsed
                    }
                  }
                : msg
            )
          }));
          return;
        }

        if (isErrorEvent(event)) {
          console.error('[chat-store] Structured event error:', event.code, event.message);
          if (!event.recoverable) {
            toast.error(event.message || 'An error occurred');
          }
          return;
        }

        // isCompleteEvent is handled in the streaming loop
      },

      // User Context Actions
      setUserContext: (context) => {
        set((state) => ({
          userContext: { ...state.userContext, ...context }
        }));

        // Update welcome message if user context changes
        const { userContext, config } = get();
        if (context.userName && userContext.isAuthenticated) {
          const personalizedWelcome = `Hi ${context.userName}! 👋 Welcome back to Cottage Tandoori. I can help you with menu questions, your favorites, order history, and placing new orders. How can I assist you today?`;

          set((state) => ({
            config: { ...state.config, welcomeMessage: personalizedWelcome }
          }));
        }
      },

      // Clear user context (called on logout)
      clearUserContext: () => {
        set((state) => ({
          userContext: {
            isAuthenticated: false,
            userId: undefined,
            userName: undefined,
            orderHistory: [],
            favorites: []
          },
          config: { ...state.config, welcomeMessage: defaultConfig.welcomeMessage }
        }));
      },

      // Session Management
      startNewSession: () => {
        const newSessionId = generateSessionId();
        const { config } = get();

        const welcomeMessage: ChatMessage = {
          id: `welcome_${newSessionId}`,
          content: config.welcomeMessage,
          sender: 'bot',
          timestamp: new Date()
        };

        set({
          sessionId: newSessionId,
          messages: [welcomeMessage],
          isLoading: false,
          isStreaming: false,
          isTyping: false
        });
      },

      // Configuration
      updateConfig: (config) => {
        set((state) => ({
          config: { ...state.config, ...config }
        }));
      },

      // Phase 6: Load system prompt from agentConfigStore (unified source)
      // Note: The actual system prompt is built on the backend using build_complete_prompt()
      // This function now just loads agent identity for UI display
      loadSystemPrompt: async () => {
        set({ isLoadingPrompt: true });
        try {
          // Fetch config from unified store
          await useAgentConfigStore.getState().fetchConfig();
          const agentConfig = useAgentConfigStore.getState().config;

          if (agentConfig) {
            const chatConfig = agentConfig.channel_settings?.chat;

            set((state) => ({
              // The systemPrompt is built on backend, but we cache it here for reference
              systemPrompt: chatConfig?.system_prompt || '',
              agentName: agentConfig.agent_name || 'Uncle Raj',
              agentNationality: agentConfig.personality_settings?.nationality || '',
              isLoadingPrompt: false,
              // Phase 6 Fix: Also update config.botAvatar and botName for ChatTriggerButton widget
              config: {
                ...state.config,
                botName: agentConfig.agent_name || state.config.botName,
                botAvatar: agentConfig.agent_avatar_url || state.config.botAvatar,
              }
            }));
          } else {
            console.warn('[chat-store] No agent config found, using defaults');
            set({ isLoadingPrompt: false });
          }
        } catch (error) {
          console.error('[chat-store] Failed to load system prompt:', error);
          set({ isLoadingPrompt: false });
        }
      }
    }),
    {
      name: 'cottage-chat-storage',
      version: 1,
      partialize: (state) => ({
        userContext: state.userContext,
        config: state.config
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.messages)) {
          const cleanedMessages = cleanupCorruptedMessages(state.messages);
          if (cleanedMessages.length !== state.messages.length ||
              cleanedMessages.some((msg, i) => msg.content !== state.messages[i]?.content)) {
            state.messages = cleanedMessages;
          }
        }

        // Validate userContext against actual auth state
        if (state && state.userContext?.userName) {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session?.user) {
              // User is NOT authenticated but localStorage has userName - clear it
              useChatStore.getState().clearUserContext();
            }
          }).catch((error) => {
            console.error('[chat-store] Failed to validate auth state:', error);
          });
        }
      }
    }
  )
);

// Selector hooks for optimized re-renders
export const useChatIsOpen = () => useChatStore((state) => state.isOpen);
export const useChatMessages = () => useChatStore((state) => state.messages);
export const useChatIsLoading = () => useChatStore((state) => state.isLoading);
export const useChatIsStreaming = () => useChatStore((state) => state.isStreaming);
export const useChatConfig = () => useChatStore((state) => state.config);
export const useIsTyping = () => useChatStore((state) => state.isTyping);

// NEW: Voice call selector hooks
export const useVoiceCallActive = () => useChatStore((state) => state.isVoiceCallActive);
export const useVoiceCallStatus = () => useChatStore((state) => state.voiceCallStatus);
export const useVoiceCallId = () => useChatStore((state) => state.voiceCallId);
export const useShowVoiceTCScreen = () => useChatStore((state) => state.showVoiceTCScreen);
export const useLiveTranscript = () => useChatStore((state) => state.liveTranscript);
export const useIsAISpeaking = () => useChatStore((state) => state.isAISpeaking);

// NEW: Cart proposal selector hooks
export const usePendingCartProposal = () => useChatStore((state) => state.pendingCartProposal);
export const useIsCartConfirmOpen = () => useChatStore((state) => state.isCartConfirmOpen);

// NEW: Cart proposal actions hook
export const useCartProposalActions = () => useChatStore((state) => ({
  setPendingCartProposal: state.setPendingCartProposal,
  openCartConfirmDialog: state.openCartConfirmDialog,
  closeCartConfirmDialog: state.closeCartConfirmDialog,
  confirmCartProposal: state.confirmCartProposal,
  cancelCartProposal: state.cancelCartProposal,
}));

// Actions hook
export const useChatActions = () => useChatStore((state) => ({
  toggleChat: state.toggleChat,
  openChat: state.openChat,
  closeChat: state.closeChat,
  addMessage: state.addMessage,
  addMessageWithDetection: state.addMessageWithDetection,
  updateLastMessage: state.updateLastMessage,
  clearMessages: state.clearMessages,
  sendMessage: state.sendMessage,
  setLoading: state.setLoading,
  setStreaming: state.setStreaming,
  setUserContext: state.setUserContext,
  startNewSession: state.startNewSession,
  startVoiceCall: state.startVoiceCall,
  endVoiceCall: state.endVoiceCall,
  setVoiceCallId: state.setVoiceCallId,
  updateVoiceStatus: state.updateVoiceStatus,
  setShowVoiceTCScreen: state.setShowVoiceTCScreen,
  // Stop generation
  stopGeneration: state.stopGeneration,
  // NEW: Cart proposal actions
  confirmCartProposal: state.confirmCartProposal,
  cancelCartProposal: state.cancelCartProposal,
  handleStructuredEvent: state.handleStructuredEvent,
}));

// Helper functions
export const getChatStats = () => {
  const state = useChatStore.getState();
  return {
    totalMessages: state.messages.length,
    userMessages: state.messages.filter(m => m.sender === 'user').length,
    botMessages: state.messages.filter(m => m.sender === 'bot').length,
    sessionId: state.sessionId,
    isAuthenticated: state.userContext.isAuthenticated,
    isStreaming: state.isStreaming
  };
};
