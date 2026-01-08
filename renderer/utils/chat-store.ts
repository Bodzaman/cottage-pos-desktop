import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from 'app';
import { API_PREFIX_PATH, API_PATH, API_URL } from '../constants';
import { useCartStore } from './cartStore';
import { useRealtimeMenuStore } from './realtimeMenuStore';
import { detectDishMentionsFast } from './dishMentionDetector';
import { MenuItem } from './menuTypes';
import { toast } from 'sonner';
import { validateChatMessage, cleanupCorruptedMessages } from './messageValidation';
import { supabase } from './supabaseClient';
import { getOrCreateSessionId } from './session-manager';

// NEW: Import structured streaming components
import { 
  StructuredStreamHandler, 
  parseStreamingEvent,
  createStructuredStreamRequest,
  type ProcessedMessage,
  type MessageContentPart
} from './structured-stream-handler';

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
const BUFFER_INTERVAL = 80; // Update every 80ms for smooth 12fps streaming

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
  
  if (typeof accumulatedContent !== 'string') {
    console.warn('⚠️ flushStreamBuffer: accumulatedContent was not string:', {
      type: typeof accumulatedContent,
      value: accumulatedContent
    });
  }
  
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
  metadata?: {
    userId?: string;
    sessionId?: string;
    messageType?: 'query' | 'order' | 'menu' | 'general' | 'cart_confirmation' | 'cart_summary';
    confidence?: number;
    modelUsed?: string;
    latencyMs?: number;
    cartItemName?: string;
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
  sendMessage: (message: string) => Promise<void>;
  
  // NEW: Structured response processing
  processStructuredElements: (elements: any[]) => Promise<MenuItem[]>;
  
  // User Context Actions
  setUserContext: (context: Partial<ChatState['userContext']>) => void;
  
  // Clear user context (called on logout)
  clearUserContext: () => void;
  
  // Session Management
  startNewSession: () => void;
  
  // Configuration
  updateConfig: (config: Partial<ChatState['config']>) => void;
  loadChatbotConfig: () => Promise<void>;
  
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
      
      userContext: {
        isAuthenticated: false,
        userId: undefined,
        userName: undefined,
        orderHistory: [],
        favorites: []
      },
      
      config: defaultConfig,
      
      // Chat UI Actions
      toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
      openChat: () => set({ isOpen: true }),
      closeChat: () => set({ isOpen: false }),
      
      // NEW: View Mode Actions
      setViewMode: (mode) => set({ viewMode: mode }),
      expandToLargeModal: () => set({ viewMode: 'expanded' }),
      minimizeToCompact: () => set({ viewMode: 'compact' }),
      
      // NEW: Voice Call Actions
      startVoiceCall: () => set({ isVoiceCallActive: true, voiceCallStatus: VoiceCallStatus.CONNECTING }),
      endVoiceCall: () => {
        set({ 
          isVoiceCallActive: false, 
          voiceCallStatus: VoiceCallStatus.IDLE,
          voiceCallId: null,
          liveTranscript: '',
          isAISpeaking: false
        });
      },
      setShowVoiceTCScreen: (show) => set({ showVoiceTCScreen: show }),
      updateVoiceStatus: (status) => set({ voiceCallStatus: status }),
      setVoiceCallId: (callId) => set({ voiceCallId: callId }),
      setLiveTranscript: (transcript) => set({ liveTranscript: transcript }),
      setIsAISpeaking: (speaking) => set({ isAISpeaking: speaking }),
      
      // Message Actions
      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          timestamp: new Date(),
          metadata: {
            ...message.metadata,
            sessionId: get().sessionId,
            userId: get().userContext.userId
          }
        };
        
        set((state) => {
          const newMessages = [...state.messages, newMessage];
          
          // Limit messages to maxMessages
          if (newMessages.length > state.config.maxMessages) {
            return {
              messages: newMessages.slice(-state.config.maxMessages)
            };
          }
          
          return { messages: newMessages };
        });
      },
      
      // NEW: Add message with automatic dish mention detection
      addMessageWithDetection: async (message, sender) => {
        const menuStore = useRealtimeMenuStore.getState();
        const { sessionId, userContext } = get();
        
        const detectedDishes = detectMenuItemsInMessage(message, menuStore.menuItems);
        const menuCards = detectedDishes.length > 0 ? detectedDishes : [];
        
        // ✅ VALIDATE: Ensure content is always string
        const validatedMessage = validateChatMessage({
          id: generateMessageId(),
          content: message,
          sender,
          timestamp: new Date(),
          menuCards,
          metadata: {
            sessionId,
            userId: userContext.userId,
            messageType: menuCards.length > 0 ? 'menu' : 'general'
          }
        }, 'addMessageWithDetection');
        
        set((state) => ({
          messages: [...state.messages, validatedMessage]
        }));
      },
      
      updateLastMessage: (content, metadata) => {
        set((state) => {
          const messages = [...state.messages];
          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            messages[messages.length - 1] = {
              ...lastMessage,
              content,
              metadata: { ...lastMessage.metadata, ...metadata }
            };
          }
          return { messages };
        });
      },
      
      clearMessages: () => set({ messages: [] }),
      setLoading: (loading) => set({ isLoading: loading }),
      setStreaming: (streaming) => set({ isStreaming: streaming }),
      
      // Send message to AI
      sendMessage: async (message: string) => {
        const { userContext, config, sessionId } = get();
        
        // ✅ NEW (MYA-1531): Get cart session_id from session manager
        const cartSessionId = getOrCreateSessionId();
        
        // ✅ OPTIMISTIC UI: Add user message IMMEDIATELY (0ms perceived wait)
        const userMessage: ChatMessage = {
          id: generateMessageId(),
          content: message,
          sender: 'user',
          timestamp: new Date(),
          metadata: {
            sessionId,
            userId: userContext.userId,
            messageType: 'general'
          }
        };
        
        set((state) => ({
          messages: [...state.messages, userMessage]
        }));
        
        // ✅ OPTIMISTIC UI: Show typing indicator immediately
        const typingMessageId = generateMessageId();
        const typingMessage: ChatMessage = {
          id: typingMessageId,
          content: '',
          sender: 'bot',
          timestamp: new Date(),
          isTyping: true, // This triggers the typing indicator UI
          metadata: {
            sessionId,
            userId: userContext.userId
          }
        };
        
        set((state) => ({
          messages: [...state.messages, typingMessage],
          isLoading: true
        }));
        
        try {
          // Build conversation history for context
          const conversationHistory = get().messages
            .filter(msg => !msg.isStreaming && !msg.isTyping) // ✅ Exclude typing indicators from history
            .slice(-6)
            .map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.content
            }));
          
          // ✅ PHASE 1 (MYA-1549): Fetch latest cart from Supabase BEFORE sending message
          // This ensures AI always has real-time cart knowledge, even if cart changed
          // during the conversation (e.g., user added item, then asks "what's in my cart?")
          const cartStore = useCartStore.getState();
          console.log('🔄 [PHASE 1] Refreshing cart from Supabase before AI message...');
          await cartStore.fetchCartFromSupabase();
          console.log('✅ [PHASE 1] Cart refreshed from Supabase - AI will have latest cart data');

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

          // ✅ DIAGNOSTIC: Log actual cart items to see what data we have
          console.log('🔍 [CART DEBUG] Raw cart items from store:', {
            itemCount: cartStore.items.length,
            items: cartStore.items.map(item => {
              const safeVariant = safeVariantExtract(item.variant);
              return {
                id: item.id,
                name: item.name,
                menuItemId: item.menuItemId,
                price: item.price,
                quantity: item.quantity,
                variant: safeVariant,
                notes: item.notes,
                hasName: !!item.name
              };
            })
          });

          // Map cart items to clean structure for AI (avoiding circular references)
          const cart_context = cartStore.items.map(item => ({
            id: item.id,
            name: item.name || 'Unknown Item', // ✅ Base item name for categorization
            price: item.price,
            quantity: item.quantity,
            variant_name: item.variant_name || null, // ✅ FIX: Use cart item's variant_name field (full display name)
            customizations: item.customizations || [], // ✅ PHASE 2: Include customizations for AI
            notes: item.notes || null
          }));

          // ✅ DIAGNOSTIC: Log the mapped cart_context
          console.log('🔍 [CART DEBUG] Mapped cart_context:', cart_context);
          
          // ✅ DIAGNOSTIC: Log request payload BEFORE sending
          const requestPayload = {
            message,
            conversation_history: conversationHistory,
            user_id: userContext.userId,
            session_id: cartSessionId, // ✅ CHANGED (MYA-1531): Use cart session_id instead of chat sessionId
            cart_context
          };
          console.log('🔍 [CHAT DEBUG] Sending chat request:', {
            url: `${API_URL}/structured-streaming/chat`,
            payload: requestPayload,
            payloadSize: safeStringify(requestPayload).length,
            timestamp: new Date().toISOString()
          });
          
          // 🚨 NEW DIAGNOSTIC (MYA-1552): Log userContext state in detail
          console.log('🔬 [USER_ID DIAGNOSTIC] userContext state:', {
            isAuthenticated: userContext.isAuthenticated,
            userId: userContext.userId,
            userIdType: typeof userContext.userId,
            userName: userContext.userName,
            fullUserContext: userContext
          });
          
          // Make structured streaming request
          const response = await fetch(`${API_URL}/structured-streaming/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: API_PREFIX_PATH !== API_PATH ? 'omit' : 'include',
            body: JSON.stringify(requestPayload) // ✅ FIX (MYA-1550): Use JSON.stringify, not safeStringify (which truncates at depth 3)
          });
          
          // ✅ DIAGNOSTIC: Log response status
          console.log('🔍 [CHAT DEBUG] Response received:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
          });
          
          if (!response.ok) {
            // ✅ DIAGNOSTIC: Try to get response body for debugging
            let errorBody = 'Could not read error body';
            try {
              errorBody = await response.text();
            } catch (e) {
              console.error('Failed to read error response body:', e);
            }
            console.error('❌ [CHAT DEBUG] HTTP error:', {
              status: response.status,
              statusText: response.statusText,
              body: errorBody
            });
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
          
          // Process streaming events
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.trim()) {
                try {
                  const cleanLine = line.replace(/^data: /, '').trim();
                  if (cleanLine && cleanLine !== '[DONE]') {
                    const event = JSON.parse(cleanLine);
                    
                    if (event.type === 'content' && event.text) {
                      // ✅ On first content chunk:
                      // - Replace typing indicator with actual bot message
                      // - Transition from loading → streaming
                      if (isFirstChunk) {
                        botMessageId = generateMessageId();
                        const botMessage: ChatMessage = {
                          id: botMessageId,
                          content: '',
                          sender: 'bot',
                          timestamp: new Date(),
                          isStreaming: true,
                          metadata: {
                            sessionId,
                            userId: userContext.userId
                          }
                        };
                        
                        // Replace typing indicator with streaming message
                        set((state) => ({
                          messages: state.messages.map(msg => 
                            msg.id === typingMessageId ? botMessage : msg
                          ),
                          isLoading: false,
                          isStreaming: true,
                          isTyping: false // NEW: Clear typing indicator when response starts
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
                          messages: state.messages.map(msg => 
                            msg.id === botMessageId 
                              ? { ...msg, content: fullContent }
                              : msg
                          )
                        }));
                        bufferTimer = null;
                      }, BUFFER_INTERVAL);
                    } else if (event.type === 'structured_data' && event.items) {
                      // ✅ NEW: Handle structured menu data with images from backend
                      console.log('📊 Received structured_data event:', {
                        itemCount: event.items?.length || 0,
                        sampleItem: event.items?.[0]
                      });
                      
                      // Flush text buffer immediately before adding structured data
                      accumulatedContent = flushStreamBuffer(botMessageId, accumulatedContent, set);
                      
                      // ✅ FIX: Map backend field names correctly (menu_item_id → id, category → category_id)
                      const structuredMenuCards: MenuItem[] = event.items.map((item: any) => ({
                        id: item.menu_item_id || item.id || '',  // Backend sends menu_item_id
                        name: item.name || '',
                        description: item.description || null,
                        image_url: item.image_url || null,
                        price: item.price || 0,
                        category_id: item.category_id || '',  // Generate placeholder if missing
                        variants: item.variants || [],
                        active: item.active !== undefined ? item.active : true,
                        dietary_tags: item.dietary_tags || null,
                        spice_indicators: item.spice_indicators ? String(item.spice_level) : null,  // Convert number to string if present
                        allergens: item.allergens || null,
                        display_order: 0,
                        featured: false
                      }));
                      
                      // Add to menuCards array
                      menuCards.push(...structuredMenuCards);
                      
                      console.log('✅ Added structured menu cards:', {
                        count: structuredMenuCards.length,
                        totalMenuCards: menuCards.length,
                        items: structuredMenuCards.map(c => c.name)
                      });
                      
                      // Update message with menu cards for rendering
                      set((state) => ({
                        messages: state.messages.map(msg => 
                          msg.id === botMessageId 
                            ? { ...msg, menuCards: [...menuCards] }
                            : msg
                        )
                      }));
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
                        active: true,
                        dietary_tags: event.dietary_tags || null,
                        display_order: 0
                      };
                      
                      menuCards.push(menuItem);
                      
                      // Update message with menu cards
                      set((state) => ({
                        messages: state.messages.map(msg => 
                          msg.id === botMessageId 
                            ? { ...msg, menuCards: [...menuCards] }
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
                            cartStore.updateItemQuantity(result.cart_item_id, result.new_quantity);
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
                        console.log('🔄 Cart refreshed from Supabase after AI operation:', operation);
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
                        messages: state.messages.map(msg => 
                          msg.id === botMessageId 
                            ? { ...msg, isStreaming: false }
                            : msg
                        ),
                        isStreaming: false
                      }));
                      break;
                    }
                  }
                } catch (parseError) {
                  console.warn('Error parsing streaming event:', parseError);
                }
              }
            }
          }
          
          console.log('✅ Structured streaming completed for message:', botMessageId);
          
        } catch (error) {
          console.error('❌ Streaming error:', error);
          
          // ✅ DIAGNOSTIC: Detailed error logging
          console.error('❌ [CHAT DEBUG] Full error details:', {
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            errorType: error?.constructor?.name,
            timestamp: new Date().toISOString()
          });
          
          // ✅ OPTIMISTIC UI ERROR HANDLING:
          // Remove typing indicator and show error message
          const errorMessageId = generateMessageId();
          const errorMessage: ChatMessage = {
            id: errorMessageId,
            content: 'Sorry, I encountered an error. Please try again.',
            sender: 'bot',
            timestamp: new Date(),
            isStreaming: false,
            metadata: { 
              sessionId,
              userId: userContext.userId,
              error: String(error)
            }
          };
          
          set((state) => ({
            messages: state.messages.map(msg => 
              msg.id === typingMessageId ? errorMessage : msg
            ),
            isLoading: false,
            isStreaming: false
          }));
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
              console.log('✅ Added structured menu card:', menuItem.name);
            } else {
              console.warn('⚠️ Menu item not found for structured element:', element.item_id);
            }
          }
        }
        
        return menuCards;
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
        console.log('🧹 [chat-store] Clearing user context on logout');
        
        // Reset to guest user state
        set((state) => ({
          userContext: {
            isAuthenticated: false,
            userId: undefined,
            userName: undefined,
            orderHistory: [],
            favorites: []
          },
          // Reset to default generic welcome message
          config: { ...state.config, welcomeMessage: defaultConfig.welcomeMessage }
        }));
        
        console.log('✅ [chat-store] User context cleared, welcome message reset to generic');
      },
      
      // Session Management
      startNewSession: () => {
        const newSessionId = generateSessionId();
        const { userContext, config } = get();
        
        // Create initial welcome message
        const welcomeMessage: ChatMessage = {
          id: `welcome_${newSessionId}`,
          content: config.welcomeMessage,
          sender: 'bot',
          timestamp: new Date(),
          metadata: {
            sessionId: newSessionId,
            userId: userContext.userId,
            messageType: 'general'
          }
        };
        
        set({
          sessionId: newSessionId,
          messages: [welcomeMessage],
          isLoading: false,
          isStreaming: false
        });
      },
      
      // Configuration
      updateConfig: (newConfig) => {
        set((state) => ({
          config: { ...state.config, ...newConfig }
        }));
      },
      
      // Load chatbot configuration from API
      loadChatbotConfig: async () => {
        try {
          const response = await apiClient.get_chat_config();
          const data = await response.json();
          
          if (data) {
            set((state) => ({
              config: {
                ...state.config,
                botName: data.name || state.config.botName,
                botAvatar: data.avatar_url || state.config.botAvatar
              }
            }));
            
            console.log('✅ Chat configuration loaded from unified_agent_config:', data);
          } else {
            console.log('ℹ️ No chat configuration found, using defaults');
          }
        } catch (error) {
          console.error('❌ Failed to load chat configuration:', error);
        }
      },
      
      // NEW: Load system prompt from primary agent config
      loadSystemPrompt: async () => {
        set({ isLoadingPrompt: true });
        try {
          const response = await apiClient.generate_system_prompt({ channel: 'chat' });
          const data = await response.json();
          
          set({
            systemPrompt: data.prompt,
            agentName: data.agent_name,
            agentNationality: data.nationality,
            isLoadingPrompt: false
          });
          
          console.log('✅ System prompt loaded from primary agent:', data.agent_name);
        } catch (error) {
          console.error('❌ Failed to load system prompt:', error);
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
      // ✅ CLEANUP: Fix any corrupted messages when loading from localStorage
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.messages)) {
          const cleanedMessages = cleanupCorruptedMessages(state.messages);
          if (cleanedMessages.length !== state.messages.length || 
              cleanedMessages.some((msg, i) => msg.content !== state.messages[i]?.content)) {
            state.messages = cleanedMessages;
            console.log('🧹 [chat-store] Cleaned up corrupted messages from localStorage');
          }
        }
        
        // ✅ NEW (MYA-1525): Validate userContext against actual auth state
        if (state && state.userContext?.userName) {
          // Check if user is actually authenticated
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session?.user) {
              // User is NOT authenticated but localStorage has userName - clear it
              console.log('⚠️ [chat-store] Found stale userName in localStorage without valid session');
              console.log('🧹 [chat-store] Clearing stale userContext');
              
              useChatStore.setState({
                userContext: {
                  isAuthenticated: false,
                  userId: undefined,
                  userName: undefined,
                  orderHistory: [],
                  favorites: []
                },
                config: { ...state.config, welcomeMessage: defaultConfig.welcomeMessage }
              });
              
              console.log('✅ [chat-store] Auth state validated and corrected');
            } else {
              console.log('✅ [chat-store] Auth state valid - userName matches session');
            }
          }).catch((error) => {
            console.error('❌ [chat-store] Failed to validate auth state:', error);
          });
        }
      },
      // ✅ MIGRATION: Validate all message content is string on hydration
      migrate: (persistedState: any, version: number) => {
        // If messages exist, validate and fix content
        if (persistedState?.messages && Array.isArray(persistedState.messages)) {
          persistedState.messages = persistedState.messages.map((msg: any) => {
            // Ensure content is always a string
            if (typeof msg.content !== 'string') {
              console.warn('⚠️ [ChatStore Migration] Fixed non-string content in persisted message:', {
                messageId: msg.id,
                contentType: typeof msg.content,
                sender: msg.sender
              });
              msg.content = String(msg.content || '');
            }
            return msg;
          });
        }
        return persistedState;
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
  clearUserContext: state.clearUserContext,
  startNewSession: state.startNewSession,
  updateConfig: state.updateConfig,
  loadChatbotConfig: state.loadChatbotConfig,
  loadSystemPrompt: state.loadSystemPrompt,
  // Voice call actions
  startVoiceCall: state.startVoiceCall,
  endVoiceCall: state.endVoiceCall,
  updateVoiceStatus: state.updateVoiceStatus,
  setVoiceCallId: state.setVoiceCallId,
  setShowVoiceTCScreen: state.setShowVoiceTCScreen,
  setLiveTranscript: state.setLiveTranscript,
  setIsAISpeaking: state.setIsAISpeaking
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
