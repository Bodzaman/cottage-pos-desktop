import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, X, Bot, Send, Loader2, Phone, PhoneOff, Mic, MicOff, User, Copy, Trash2, RotateCcw, ShoppingCart, Check } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { PremiumTheme } from '../utils/premiumTheme';
import { useSimpleAuth } from '../utils/simple-auth-context';
import { MessageActions } from './MessageActions';
import { DynamicUserAvatar } from './DynamicUserAvatar';
import { QuickReplyChips } from './QuickReplyChips';
import { ThinkingMessageSkeleton } from './ThinkingMessageSkeleton';
import { CartBadge } from './CartBadge';
import { CartDrawer } from './CartDrawer';
import { CartHintTooltip } from './CartHintTooltip';
import { CartContent } from './CartContent';
import { VoiceCallOverlay } from 'components/VoiceCallOverlay';
import { CallSummaryMessage } from 'components/CallSummaryMessage';
import InlineTermsScreen from 'components/InlineTermsScreen';
import { WelcomeScreen, useWelcomeScreen } from 'components/WelcomeScreen';
import { VoiceSignupPrompt } from './VoiceSignupPrompt';
import { VoiceMaintenanceModal } from './VoiceMaintenanceModal';
import { InlineMenuCard } from 'components/InlineMenuCard';
import { toast } from 'sonner';
import { useAgentConfig } from '../utils/useAgentConfig';
import { apiClient } from 'app';
import { 
  useChatMessages,
  useChatIsLoading,
  useChatIsStreaming,
  useChatConfig,
  useChatActions,
  useVoiceCallActive,
  useVoiceCallStatus,
  VoiceCallStatus,
  useChatStore,
  useIsAISpeaking
} from '../utils/chat-store';
import { useCartStore } from '../utils/cartStore';
import { usePageContext } from '../utils/pageContext';
import { detectDishMentionsFast } from '../utils/dishMentionDetector';
import type { ChatMessage } from '../utils/chat-store';
import type { CartItem } from '../utils/cartStore';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { useVoiceAgentStore } from '../utils/voiceAgentStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { GeminiVoiceClient, GeminiVoiceState } from 'utils/geminiVoiceClient';

// Process markdown content to replace menu card markers with actual cards
const processInlineMenuCards = (content: string, orderMode: string) => {
  // ✅ DEFENSIVE: Ensure content is string (should never trigger if source is fixed)
  if (typeof content !== 'string') {
    console.warn('⚠️ [ChatLargeModal] processInlineMenuCards: content is not string (should be fixed at source)', {
      type: typeof content,
      value: content
    });
    return { parts: [{ type: 'text' as const, content: '', key: 'fallback-0' }], cleanedContent: '' };
  }

  const menuCardPattern = /\{\{MENU_CARD:([a-zA-Z0-9_-]+)\}\}/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;
  let cleanedContent = content; // Track content with markers removed
  
  while ((match = menuCardPattern.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const textContent = content.substring(lastIndex, match.index);
      if (textContent.trim()) {
        parts.push({
          type: 'text',
          content: textContent,
          key: `text_${keyIndex++}`
        });
      }
    }
    
    // Add menu card
    const menuItemId = match[1];
    parts.push({
      type: 'menu_card',
      itemId: menuItemId,
      key: `menu_card_${menuItemId}`
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    const remainingText = content.substring(lastIndex);
    if (remainingText.trim()) {
      parts.push({
        type: 'text',
        content: remainingText,
        key: `text_${keyIndex++}`
      });
    }
  }
  
  // If no matches, add the whole content as text
  if (parts.length === 0) {
    parts.push({
      type: 'text',
      content: content,
      key: 'text_0'
    });
  }
  
  // Clean content by removing all markers
  cleanedContent = content.replace(menuCardPattern, '').trim();
  
  return { parts, cleanedContent };
};

// NEW: Render structured content parts directly
const renderStructuredContent = (message: ChatMessage, orderMode: string) => {
  // Use structuredParts if available (new protocol)
  if (message.structuredParts && message.structuredParts.length > 0) {
    // Combine consecutive text parts to avoid vertical rendering
    const combinedParts: Array<{type: 'text', content: string} | {type: 'menu_card', itemId: string, key: string}> = [];
    let currentTextContent = '';
    
    for (const part of message.structuredParts) {
      if (part.type === 'text') {
        // Accumulate text content
        currentTextContent += part.content || '';
      } else if (part.type === 'menu_card') {
        // If we have accumulated text, add it as a combined text part
        if (currentTextContent.trim()) {
          combinedParts.push({ type: 'text', content: currentTextContent });
          currentTextContent = '';
        }
        // Add the menu card
        combinedParts.push({ type: 'menu_card', itemId: part.itemId!, key: part.key });
      }
    }
    
    // Add any remaining text content
    if (currentTextContent.trim()) {
      combinedParts.push({ type: 'text', content: currentTextContent });
    }
    
    return (
      <>
        {combinedParts.map((part, index) => {
          if (part.type === 'text') {
            return (
              <ReactMarkdown 
                key={`combined_text_${index}`}
                className="prose prose-invert prose-orange max-w-none text-white leading-relaxed inline"
                components={{
                  p: ({ children }) => <span className="inline">{children}</span>,
                  strong: ({ children }) => <strong className="text-orange-300 font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="text-orange-200">{children}</em>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  li: ({ children }) => <li className="text-gray-300">{children}</li>,
                  h1: ({ children }) => <h1 className="text-xl font-bold text-orange-300 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-semibold text-orange-300 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-medium text-orange-300 mb-1">{children}</h3>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-orange-500 pl-4 italic text-orange-200 my-2">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {part.content}
              </ReactMarkdown>
            );
          } else if (part.type === 'menu_card' && part.itemId) {
            return (
              <span key={part.key} className="inline-flex mx-1 my-1 align-top">
                <InlineMenuCard 
                  itemId={part.itemId}
                  orderMode={orderMode}
                  animationDelay={index * 150} // ✅ Stagger: 0ms, 150ms, 300ms, etc.
                />
              </span>
            );
          }
          return null;
        })}
      </>
    );
  }

  // Fallback to legacy marker processing for old messages
  const { parts } = processInlineMenuCards(message.content, orderMode);
  return (
    <>
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {part.type === 'text' ? (
            <span className="prose prose-invert prose-orange max-w-none text-white leading-relaxed inline">
              <ReactMarkdown 
                components={{
                  p: ({ children }) => <span className="inline">{children}</span>,
                  strong: ({ children }) => <strong className="text-orange-300 font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="text-orange-200">{children}</em>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  li: ({ children }) => <li className="text-gray-300">{children}</li>,
                  h1: ({ children }) => <h1 className="text-xl font-bold text-orange-300 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-semibold text-orange-300 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-medium text-orange-300 mb-1">{children}</h3>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-orange-500 pl-4 italic text-orange-200 my-2">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {part.content}
              </ReactMarkdown>
            </span>
          ) : (
            <span className="inline-flex mx-1 my-1 align-top">
              <InlineMenuCard 
                itemId={part.itemId!}
                orderMode={orderMode}
                animationDelay={index * 150} // ✅ Stagger: 0ms, 150ms, 300ms, etc.
              />
            </span>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

// Process inline menu cards for enhanced message content
const renderMessageContent = ({ message, orderMode }: { message: ChatMessage, orderMode: string }) => {
  // NEW: Handle structured streaming format with menuCards array
  if (message.menuCards && message.menuCards.length > 0) {
    // Render content with menu cards below
    return (
      <>
        {/* Main message content */}
        <ReactMarkdown 
          className="prose prose-invert prose-orange max-w-none text-white leading-relaxed"
          components={{
            p: ({ children }) => <p className="mb-2">{children}</p>,
            strong: ({ children }) => <strong className="text-orange-300 font-semibold">{children}</strong>,
            em: ({ children }) => <em className="text-orange-200">{children}</em>,
            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
            li: ({ children }) => <li className="text-gray-300">{children}</li>,
            h1: ({ children }) => <h1 className="text-xl font-bold text-orange-300 mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-semibold text-orange-300 mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-medium text-orange-300 mb-1">{children}</h3>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-orange-500 pl-4 italic text-orange-200 my-2">
                {children}
              </blockquote>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
        
        {/* Render menu cards */}
        <div className="mt-3 space-y-2">
          {message.menuCards.map((menuItem, index) => (
            <InlineMenuCard 
              key={`${message.id}-menu-${menuItem.id}-${index}`}
              itemId={menuItem.id}
              orderMode={orderMode}
              animationDelay={index * 150} // ✅ Stagger: 0ms, 150ms, 300ms, etc.
            />
          ))}
        </div>
      </>
    );
  }
  
  // Legacy: Process old format with {{MENU_CARD:id}} markers
  if (message.structuredParts && message.structuredParts.length > 0) {
    // Handle old structured parts format
    let currentTextContent = '';
    const combinedParts: Array<{type: 'text', content: string} | {type: 'menu_card', itemId: string, key: string}> = [];
    
    for (const part of message.structuredParts) {
      if (part.type === 'text') {
        currentTextContent += part.content;
      } else if (part.type === 'menu_card') {
        // Add accumulated text before menu card
        if (currentTextContent.trim()) {
          combinedParts.push({ type: 'text', content: currentTextContent });
          currentTextContent = '';
        }
        
        // Add menu card
        combinedParts.push({ 
          type: 'menu_card', 
          itemId: part.itemId!, 
          key: part.key || `menu_${Date.now()}` 
        });
      }
    }
    
    // Add any remaining text content
    if (currentTextContent.trim()) {
      combinedParts.push({ type: 'text', content: currentTextContent });
    }
    
    return (
      <>
        {combinedParts.map((part, index) => {
          if (part.type === 'text') {
            return (
              <ReactMarkdown 
                key={`combined_text_${index}`}
                className="prose prose-invert prose-orange max-w-none text-white leading-relaxed inline"
                components={{
                  p: ({ children }) => <span className="inline">{children}</span>,
                  strong: ({ children }) => <strong className="text-orange-300 font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="text-orange-200">{children}</em>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  li: ({ children }) => <li className="text-gray-300">{children}</li>,
                  h1: ({ children }) => <h1 className="text-xl font-bold text-orange-300 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-semibold text-orange-300 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-medium text-orange-300 mb-1">{children}</h3>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-orange-500 pl-4 italic text-orange-200 my-2">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {part.content}
              </ReactMarkdown>
            );
          } else if (part.type === 'menu_card' && part.itemId) {
            return (
              <span key={part.key} className="inline-flex mx-1 my-1 align-top">
                <InlineMenuCard 
                  itemId={part.itemId}
                  orderMode={orderMode}
                  animationDelay={index * 150} // ✅ Stagger: 0ms, 150ms, 300ms, etc.
                />
              </span>
            );
          }
          return null;
        })}
      </>
    );
  }

  // Fallback to legacy marker processing for old messages
  const { parts } = processInlineMenuCards(message.content, orderMode);
  return (
    <>
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {part.type === 'text' ? (
            <ReactMarkdown 
              className="prose prose-invert prose-orange max-w-none text-white leading-relaxed inline"
              components={{
                p: ({ children }) => <span className="inline">{children}</span>,
                strong: ({ children }) => <strong className="text-orange-300 font-semibold">{children}</strong>,
                em: ({ children }) => <em className="text-orange-200">{children}</em>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                li: ({ children }) => <li className="text-gray-300">{children}</li>,
                h1: ({ children }) => <h1 className="text-xl font-bold text-orange-300 mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-semibold text-orange-300 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-medium text-orange-300 mb-1">{children}</h3>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-orange-500 pl-4 italic text-orange-200 my-2">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {part.content}
            </ReactMarkdown>
          ) : (
            <span className="inline-flex mx-1 my-1 align-top">
              <InlineMenuCard 
                itemId={part.itemId!}
                orderMode={orderMode}
                animationDelay={index * 150} // ✅ Stagger: 0ms, 150ms, 300ms, etc.
              />
            </span>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

interface ChatLargeModalProps {
  onStartVoiceOrder?: () => void;
}

interface WebAssistantConfig {
  botName: string;
  botAvatar?: string;
  welcomeMessage: string;
  supportedFeatures: string[];
}

export function ChatLargeModal({ onStartVoiceOrder }: ChatLargeModalProps) {
  const { user, isAuthenticated, profile } = useSimpleAuth();
  const { orderMode } = useCartStore();
  const pageContext = usePageContext();
  const location = useLocation();
  
  // ✅ NEW: Get dynamic agent config for branding
  const { restaurantName, agentName, agentRole, agentAvatar, isLoading: isLoadingAgentConfig } = useAgentConfig();
  
  // ✅ NEW: Get isOpen and closeChat from store directly (self-contained)
  const isOpen = useChatStore((state) => state.isOpen);
  const closeChat = useChatStore((state) => state.closeChat);
  const openChat = useChatStore((state) => state.openChat);
  
  // ✅ NEW: Welcome screen state (first-time users)
  const shouldShowWelcome = useWelcomeScreen();
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  
  // Use zustand store for global state
  const messages = useChatMessages();
  const isLoading = useChatIsLoading();
  const isStreaming = useChatIsStreaming();
  const config = useChatConfig();
  
  // 🚀 NEW: Route-based chat visibility - Auto-close on excluded routes
  React.useEffect(() => {
    const excludedRoutes = [
      // Auth pages
      '/sign-up',
      '/login',
      '/forgot-password',
      // Checkout flow
      '/checkout-payment',
      // Admin/Staff pages
      '/pos-login',
      '/pos-desktop',
      '/admin',
      '/kds-v2',
      // Staff management
      '/ai-staff-management-hub',
      '/printer-management',
      '/voice-staff-control-center',
      // Internal tools
      '/reconciliation',
      '/all-orders',
      '/thermal-receipt-designer-v2',
      '/update-kds',
      '/update-pos-desktop',
      '/pos-settings',
      '/chatbot-configuration',
      '/ai-voice-agent-settings',
      '/media-library',
      '/health-monitor',
      '/gemini-voice-lab'
    ];
    
    if (excludedRoutes.includes(location.pathname)) {
      console.log('🚫 Route-based visibility: Closing chat on excluded route:', location.pathname);
      closeChat();
    }
  }, [location.pathname, closeChat]);
  
  // 🚀 NEW: Auto-open chat after signup completion
  React.useEffect(() => {
    const shouldAutoOpen = sessionStorage.getItem('auto_open_chat_after_signup');
    
    if (shouldAutoOpen === 'true' && location.pathname === '/') {
      console.log('✅ Auto-opening chat after signup completion');
      sessionStorage.removeItem('auto_open_chat_after_signup');
      openChat();
    }
  }, [location.pathname, openChat]);
  
  // ✅ FIXED: Show welcome screen on first chat open (based only on sessionStorage check)
  React.useEffect(() => {
    console.log('🎯 ChatLargeModal: WelcomeScreen check - isOpen=', isOpen, 'shouldShowWelcome=', shouldShowWelcome, 'isWelcomeOpen=', isWelcomeOpen);
    if (isOpen && shouldShowWelcome) {
      console.log('✅ ChatLargeModal: OPENING WelcomeScreen');
      setIsWelcomeOpen(true);
    }
  }, [isOpen, shouldShowWelcome]);
  
  // Track if we've loaded the prompt for this modal session
  const hasLoadedPromptRef = React.useRef(false);
  
  // Initialize system prompt when modal opens (only once per session)
  React.useEffect(() => {
    if (isOpen && !hasLoadedPromptRef.current) {
      hasLoadedPromptRef.current = true;
      const loadSystemPrompt = useChatStore.getState().loadSystemPrompt;
      loadSystemPrompt();
    }
    
    // Reset flag when modal closes
    if (!isOpen) {
      hasLoadedPromptRef.current = false;
    }
  }, [isOpen]); // Only depend on isOpen
  
  // Streaming cache to prevent flickering during processing
  const streamingCache = React.useRef<Record<string, any>>({});
  
  // Process inline menu cards for all messages
  const processedParts = React.useMemo(() => {
    return messages.map(message => {
      if (message.sender === 'bot') {
        
        // Check cache first during streaming to prevent flickering
        const cacheKey = `${message.id}-${message.isStreaming}`;
        if (message.isStreaming && streamingCache.current[cacheKey]) {
          return streamingCache.current[cacheKey];
        }
        
        if (!message.isStreaming) {
          // Full processing when not streaming
          const { parts, cleanedContent } = processInlineMenuCards(message.content, orderMode);
          const result = {
            messageId: message.id,
            parts,
            processedContent: cleanedContent,
            hasMenuCards: parts.some(part => part.type === 'menu_card')
          };
          
          // Clear any streaming cache for this message
          delete streamingCache.current[`${message.id}-true`];
          return result;
          
        } else {
          // During streaming: PROGRESSIVE DISPLAY - process complete markers but clean partial ones
          const content = message.content;
          const { parts, cleanedContent } = processInlineMenuCards(content, orderMode);
          
          // Clean any partial markers from the processed content
          const finalCleanedContent = cleanedContent
            .replace(/\{\{MENU_CARD:[a-zA-Z0-9_-]*$/g, '') // Partial markers at end
            .replace(/\{\{[^}]*$/g, '') // Any incomplete {{ patterns
            .replace(/[A-Z_]*:[a-zA-Z0-9_-]*$/g, ''); // Dangling patterns
            
          const result = {
            messageId: message.id,
            parts: parts.map(part => {
              if (part.type === 'menu_card') {
                return {
                  ...part,
                  key: `${part.key}_streaming` // Different key during streaming
                };
              }
              return part;
            }),
            processedContent: finalCleanedContent,
            hasMenuCards: parts.some(part => part.type === 'menu_card')
          };
          
          // Cache the result during streaming
          streamingCache.current[cacheKey] = result;
          return result;
        }
      }
      return {
        messageId: message.id,
        parts: [],
        processedContent: message.content,
        hasMenuCards: false
      };
    });
  }, [messages, orderMode]);

  const {
    addMessage,
    updateLastMessage,
    clearMessages,
    setLoading,
    setStreaming,
    sendMessage,
    setUserContext,
    startNewSession,
    loadChatbotConfig
  } = useChatActions();
  
  // NEW: Get voice actions
  const { startVoiceCall, endVoiceCall, setVoiceCallId, updateVoiceStatus, setShowVoiceTCScreen } = useChatActions();
  
  // NEW: Get voice state
  const isVoiceCallActive = useVoiceCallActive();
  const voiceCallStatus = useVoiceCallStatus();
  const isAISpeaking = useIsAISpeaking(); // NEW: Reactive hook for AI speaking state
  
  // NEW: Add voice T&C screen selector
  const showVoiceTCScreen = useChatStore((state) => state.showVoiceTCScreen);

  // NEW: Track items added during call for summary
  const [callStartCartCount, setCallStartCartCount] = useState(0);
  const [itemsAddedDuringCall, setItemsAddedDuringCall] = useState<CartItem[]>([]);

  // NEW: Get voice agent profile for avatar
  const { agentProfile } = useVoiceAgentStore();

  // NEW: Voice terms accepted handler - Initialize Gemini voice client
  const handleVoiceTermsAccepted = async () => {
    // Close T&C modal
    setShowVoiceTCScreen(false);
    
    // Snapshot cart count when call starts
    const currentItems = useCartStore.getState().items;
    setCallStartCartCount(currentItems.length);
    setItemsAddedDuringCall([]);
    
    try {
      // Initialize Gemini voice client with event handlers
      geminiClientRef.current = new GeminiVoiceClient({
        voiceName: 'Puck',
        
        // State change handler - update voice status in chat-store
        onStateChange: (state: GeminiVoiceState) => {
          // Map Gemini states to VoiceCallStatus
          if (state === 'connecting') {
            updateVoiceStatus(VoiceCallStatus.CONNECTING);
          } else if (state === 'connected' || state === 'listening') {
            updateVoiceStatus(VoiceCallStatus.CONNECTED);
          } else if (state === 'error' || state === 'closed') {
            updateVoiceStatus(VoiceCallStatus.DISCONNECTED);
          }
          
          // Update AI speaking state (when Gemini is processing/responding)
          const isSpeaking = state === 'listening' || state === 'connected';
          useChatStore.getState().setIsAISpeaking(isSpeaking);
        },
        
        // Transcript handler - update live transcript in chat-store
        onServerText: (text: string) => {
          useChatStore.getState().setLiveTranscript(text);
        },
        
        // Error handler
        onError: (error: string) => {
          console.error('❌ Gemini voice error:', error);
          toast.error(`Voice call error: ${error}`);
          updateVoiceStatus(VoiceCallStatus.FAILED);
        },
        
        // Cart update handler - triggered by backend validation in geminiVoiceClient
        onCartUpdate: (action: 'add' | 'remove', item: any) => {
          // Cart operations are handled via backend validation in geminiVoiceClient
        },
        
        // Function call handler - for debugging/monitoring
        onFunctionCall: (name: string, args: any) => {
          // Function calls logged in geminiVoiceClient
        }
      });
      
      // Start the session
      await geminiClientRef.current.start();
      
      // Get real call ID (session ID from Gemini)
      const callId = geminiClientRef.current.currentState;
      setVoiceCallId(callId || 'gemini-' + Date.now());
      startVoiceCall();
      
    } catch (error: any) {
      console.error('❌ Failed to initialize Gemini client:', error);
      toast.error('Failed to start voice call');
      updateVoiceStatus(VoiceCallStatus.FAILED);
      setShowVoiceTCScreen(false);
    }
  };
  
  // NEW: Voice terms cancelled handler
  const handleVoiceTermsCancelled = () => {
    setShowVoiceTCScreen(false);
  };

  // NEW: Handle end voice call with cart integration
  const handleEndVoiceCall = () => {
    // Cleanup Gemini client first
    if (geminiClientRef.current) {
      geminiClientRef.current.stop();
      geminiClientRef.current = null;
    }
    
    const currentItems = useCartStore.getState().items;
    
    // Calculate items added during call
    const newItems = currentItems.slice(callStartCartCount);
    
    // Calculate total for new items
    const callTotal = newItems.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      // Add variant prices if any
      const variantsTotal = item.selectedVariants?.reduce((vSum, v) => vSum + (v.price || 0), 0) || 0;
      return sum + itemTotal + variantsTotal;
    }, 0);
    
    // Add call summary message to chat
    if (newItems.length > 0) {
      addMessage({
        content: `✅ Voice call ended. ${newItems.length} item${newItems.length > 1 ? 's' : ''} added to your cart!`,
        sender: 'bot',
        metadata: {
          messageType: 'call_summary',
          callDuration,
          itemsAdded: newItems,
          total: callTotal
        }
      });
      
      // Auto-open chat cart drawer to show items added
      openChatCart();
    } else {
      addMessage({
        content: `Voice call ended (${Math.floor(callDuration / 60)}:${String(callDuration % 60).padStart(2, '0')}). Feel free to browse our menu!`,
        sender: 'bot',
        metadata: { messageType: 'general' }
      });
    }
    
    // End voice call state
    endVoiceCall();
    
    // Reset call tracking
    setCallStartCartCount(0);
    setItemsAddedDuringCall([]);
  };

  // Voice button click handler
  const handleVoiceButtonClick = () => {
    if (onStartVoiceOrder) {
      onStartVoiceOrder();
    } else {
      setShowVoiceTCScreen(true);
    }
  };

  // Phone button click handler - Opens voice for logged in, signup prompt for guests
  const handlePhoneClick = () => {
    // Scenario A: Master toggle OFF - should never reach here (button hidden)
    if (!voiceSettings?.enabled) {
      return;
    }
    
    // Scenario B: Maintenance mode ON - show maintenance modal
    if (voiceSettings.under_maintenance) {
      setShowVoiceMaintenanceModal(true);
      return;
    }
    
    // Scenario C: Normal operation - existing flow
    if (isAuthenticated) {
      setShowVoiceTCScreen(true); // Existing voice T&C modal
    } else {
      setShowVoiceSignupPrompt(true); // New signup prompt for guests
    }
  };

  // Local state
  const [inputValue, setInputValue] = useState('');
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [callDuration, setCallDuration] = useState(0); // NEW: Track call duration
  const callTimerRef = useRef<NodeJS.Timeout | null>(null); // NEW: Timer ref
  const geminiClientRef = useRef<GeminiVoiceClient | null>(null); // NEW: Gemini voice client instance
  
  // NEW: Cart hint tooltip state
  const [showCartHint, setShowCartHint] = useState(false);
  
  // NEW: Smart scroll state
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // NEW (Phase 4C): Voice signup prompt state for guest users
  const [showVoiceSignupPrompt, setShowVoiceSignupPrompt] = useState(false);
  
  // NEW (MYA-1581): Voice settings state for maintenance mode control
  const [voiceSettings, setVoiceSettings] = useState<{
    enabled: boolean;
    under_maintenance: boolean;
  } | null>(null);
  
  // NEW (MYA-1581): Voice maintenance modal state
  const [showVoiceMaintenanceModal, setShowVoiceMaintenanceModal] = useState(false);
  
  // NEW: Get global cart actions
  const openChatCart = useCartStore((state) => state.openChatCart);
  const isChatCartOpen = useCartStore((state) => state.isChatCartOpen);
  const closeCartDrawer = useCartStore((state) => state.closeChatCart);
  
  // Handle badge click - open chat cart drawer
  const handleCartBadgeClick = () => {
    openChatCart();
  };
  
  // Check if we should show the hint (first time only)
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('cart_hint_seen');
    if (!hasSeenHint) {
      // Will show hint when first cart operation happens
      const unsubscribe = useCartStore.subscribe(
        (state) => state.totalItems,
        (totalItems, prevTotalItems) => {
          if (totalItems > prevTotalItems && totalItems === 1 && !hasSeenHint) {
            // First item added to cart
            setShowCartHint(true);
          }
        }
      );
      
      return () => unsubscribe();
    }
  }, []);
  
  // NEW (MYA-1581): Fetch voice settings on mount
  useEffect(() => {
    const fetchVoiceSettings = async () => {
      try {
        const response = await apiClient.get_ai_voice_settings();
        const data = await response.json();
        if (data.success && data.settings) {
          setVoiceSettings({
            enabled: data.settings.enabled,
            under_maintenance: data.settings.under_maintenance
          });
        }
      } catch (error) {
        console.error('Failed to fetch voice settings:', error);
      }
    };
    fetchVoiceSettings();
  }, []);
  
  // Handler to dismiss cart hint
  const handleDismissCartHint = () => {
    setShowCartHint(false);
    localStorage.setItem('cart_hint_seen', 'true');
  };

  // Auto-scroll to bottom when new messages arrive (only if near bottom)
  useEffect(() => {
    if (isNearBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isNearBottom]);
  
  // NEW: Handle scroll position tracking
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    
    // Calculate distance from bottom
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // User is near bottom if within 100px
    const nearBottom = distanceFromBottom < 100;
    setIsNearBottom(nearBottom);
    
    // Show scroll button if scrolled up more than 200px
    setShowScrollButton(distanceFromBottom > 200);
  };
  
  // NEW: Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set height to scrollHeight, capped at max-height (200px)
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
    
    // Auto-scroll to cursor position (keeps active line visible)
    textarea.scrollTop = textarea.scrollHeight;
  }, [inputValue]);
  
  // Load chatbot configuration on component mount
  useEffect(() => {
    loadChatbotConfig().catch(console.error);
  }, [loadChatbotConfig]);
  
  // Use the config from the store instead of hardcoded defaults
  const webAssistantConfig: WebAssistantConfig = {
    botName: config.botName || 'Cottage Tandoori AI',
    botAvatar: config.botAvatar,
    welcomeMessage: config.welcomeMessage || 'Hi there! 👋 How can I help you today?',
    supportedFeatures: ['Menu Information', 'Order Assistance', 'Dietary Requirements', 'Opening Hours']
  };
  
  // Enhanced user context with authentication and page context
  useEffect(() => {
    const enhancedContext = {
      isAuthenticated,
      userId: user?.id,
      userName: profile?.display_name || user?.email?.split('@')[0],
      currentPage: pageContext.pageName,
      orderMode,
      timestamp: new Date().toISOString()
    };
    
    setUserContext(enhancedContext);
  }, [isAuthenticated, user, profile, pageContext.pageName, orderMode, setUserContext]);
  
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const messageText = inputValue.trim();
    setInputValue('');
    
    try {
      await sendMessage(messageText);
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        metadata: { messageType: 'general' }
      });
    }
  };
  
  // ✅ NEW: Handle top pill clicks (ChatGPT pattern)
  const handlePillClick = (pillLabel: string) => {
    // Voice Orders opens the voice modal
    if (pillLabel === 'Voice Orders') {
      setShowVoiceTCScreen(true);
      return;
    }
    
    // Map pill labels to AI messages
    const pillMessages: Record<string, string> = {
      'Menu Info': 'Tell me about your menu',
      'Dietary Help': 'What dietary options do you have?',
      'Opening Hours': 'What are your opening hours?'
    };
    
    const messageText = pillMessages[pillLabel];
    if (messageText) {
      sendMessage(messageText).catch(error => {
        console.error('Error sending pill message:', error);
        toast.error('Failed to send message');
      });
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    // Shift+Enter allows new line (default textarea behavior)
  };
  
  // NEW: Message action handlers
  const handleCopyMessage = async (messageContent: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopiedMessageId(messageId);
      toast.success('Message copied to clipboard');
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy message');
    }
  };
  
  const handleDeleteMessage = (messageId: string) => {
    // Get the delete action from store
    const deleteMessage = useChatStore.getState().deleteMessage;
    deleteMessage(messageId);
    toast.success('Message deleted');
  };
  
  const handleRegenerateMessage = async () => {
    if (isLoading || !lastUserMessage) return;
    
    try {
      // Remove last bot message
      const messages = useChatStore.getState().messages;
      const lastBotIndex = messages.length - 1;
      if (lastBotIndex >= 0 && messages[lastBotIndex].sender === 'bot') {
        const deleteMessage = useChatStore.getState().deleteMessage;
        deleteMessage(messages[lastBotIndex].id);
      }
      
      // Resend last user message
      await sendMessage(lastUserMessage);
      toast.success('Regenerating response...');
    } catch (error) {
      toast.error('Failed to regenerate response');
    }
  };
  
  const handleClose = () => {
    closeChat();
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      <AnimatePresence>
        {/* Chat Panel - No backdrop, positioned directly */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className={cn(
            "fixed inset-0 z-[40] flex items-center justify-center p-4",
            "pointer-events-none" // Allow clicks through to background
          )}
        >
          {/* Main Chat Modal */}
          <div
            className={cn(
              "bg-card rounded-2xl shadow-2xl flex flex-col overflow-hidden",
              "w-full max-w-4xl mx-auto",
              "h-[80vh]",
              "pointer-events-auto", // Enable clicks on the chat panel itself
              // Mobile: Full screen
              "md:h-[80vh] md:max-w-4xl md:rounded-2xl",
              "sm:h-screen sm:max-h-screen sm:max-w-full sm:rounded-none",
              // Tablet: Slightly smaller
              "lg:h-[80vh] lg:max-w-4xl",
              "md:h-[85vh] md:max-w-2xl"
            )}
            style={{ 
              borderColor: PremiumTheme.colors.border.medium,
              backgroundColor: PremiumTheme.colors.background.card
            }}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-4 border-b"
              style={{ 
                backgroundColor: PremiumTheme.colors.background.secondary,
                borderColor: PremiumTheme.colors.border.primary
              }}
            >
              <div className="flex items-center gap-3">
                {/* Simple circular avatar in header */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 flex items-center justify-center flex-shrink-0 ring-2 ring-orange-500/20">
                  {isLoadingAgentConfig ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : agentAvatar ? (
                    <img 
                      src={agentAvatar} 
                      alt={agentName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>
                {/* Agent name and role */}
                <div className="flex flex-col">
                  <span 
                    className="font-semibold text-sm"
                    style={{ color: PremiumTheme.colors.text.primary }}
                  >
                    {isLoadingAgentConfig ? (
                      <span className="inline-block w-24 h-4 rounded animate-pulse" 
                        style={{ backgroundColor: PremiumTheme.colors.background.tertiary }}
                      />
                    ) : agentName}
                  </span>
                  <span 
                    className="text-xs"
                    style={{ color: PremiumTheme.colors.text.muted }}
                  >
                    {isLoadingAgentConfig ? (
                      <span className="inline-block w-16 h-3 rounded animate-pulse" 
                        style={{ backgroundColor: PremiumTheme.colors.background.tertiary }}
                      />
                    ) : agentRole}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Cart Badge - shows item count, cart summary on demand */}
                <div className="relative">
                  <CartBadge onClick={handleCartBadgeClick} />
                  
                  {/* First-time hint tooltip */}
                  <CartHintTooltip 
                    isVisible={showCartHint} 
                    onDismiss={handleDismissCartHint}
                  />
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className={cn(
                    "hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 hover:scale-105",
                    "h-10 px-3",
                    "sm:h-9 sm:w-9 sm:p-0" // Icon only on mobile
                  )}
                  style={{ color: PremiumTheme.colors.text.muted }}
                  title="Close chat"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            {/* Modal Content - Flex container for chat + cart drawer */}
            <div className="flex-1 overflow-hidden flex">
              {/* Chat Area - Takes 65% when drawer open, 100% when closed */}
              <div 
                className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
                style={{ 
                  width: isChatCartOpen ? '65%' : '100%',
                  maxWidth: isChatCartOpen ? '65%' : '100%'
                }}
              >
                {/* Messages Container */}
                <div 
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto relative"
                  style={{ backgroundColor: PremiumTheme.colors.background.primary }}
                >
                  {/* Normal chat messages view */}
                  <div className={cn(
                    "max-w-4xl mx-auto transition-opacity duration-300",
                    isVoiceCallActive && "opacity-30 pointer-events-none" // Dim and disable interaction during call
                  )}>
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
                        {/* Large Circular Avatar */}
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", duration: 0.6, bounce: 0.4 }}
                          className="relative"
                        >
                          <div className={cn(
                            "mx-auto rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 flex items-center justify-center shadow-2xl ring-4 ring-orange-500/20",
                            "w-20 h-20",
                            "sm:w-16 sm:h-16" // Smaller on mobile
                          )}>
                            {isLoadingAgentConfig ? (
                              <Loader2 className={cn("text-white animate-spin", "w-10 h-10", "sm:w-8 sm:h-8")} />
                            ) : agentAvatar ? (
                              <img 
                                src={agentAvatar} 
                                alt={agentName}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <Bot className={cn("text-white", "w-10 h-10", "sm:w-8 sm:h-8")} />
                            )}
                          </div>
                          {/* Pulse rings */}
                          <span className={cn(
                            "absolute top-0 left-0 rounded-full bg-orange-500/20 animate-ping",
                            "w-20 h-20",
                            "sm:w-16 sm:h-16"
                          )}></span>
                        </motion.div>
                        
                        {/* Welcome Text - Old English Typography + POSDesktop Gradient */}
                        <div className="space-y-3">
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-center"
                          >
                            {/* Line 1: Welcome to (white) */}
                            <div className="text-xl text-white font-normal mb-1">
                              Welcome to
                            </div>
                            
                            {/* Line 2: Restaurant Name (Old English + Gradient) */}
                            <div 
                              className="font-oldenglish font-bold text-4xl md:text-5xl"
                              style={{
                                fontWeight: '800',
                                lineHeight: '1.1',
                                letterSpacing: '0.02em',
                                backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #B91C1C 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                textShadow: '0 0 20px rgba(185, 28, 28, 0.4)'
                              }}
                            >
                              {isLoadingAgentConfig ? (
                                <span className="inline-block w-48 h-8 rounded animate-pulse" 
                                  style={{ backgroundColor: PremiumTheme.colors.background.tertiary }}
                                />
                              ) : (
                                restaurantName
                              )}
                            </div>
                          </motion.div>
                          <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className={cn(
                              "max-w-md mx-auto",
                              "text-base",
                              "sm:text-sm" // Smaller on mobile
                            )}
                            style={{ color: PremiumTheme.colors.text.muted }}
                          >
                            {isLoadingAgentConfig ? (
                              <span className="inline-block w-64 h-5 rounded animate-pulse" 
                                style={{ backgroundColor: PremiumTheme.colors.background.tertiary }}
                              />
                            ) : (
                              `I'm ${agentName}, your ${agentRole}. Ask me about our menu, place an order, or get personalized recommendations!`
                            )}
                          </motion.p>
                        </div>
                        
                        {/* Feature Pills */}
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                          className={cn(
                            "flex flex-wrap gap-2 justify-center max-w-lg",
                            "sm:gap-1.5 sm:px-4" // Tighter spacing on mobile
                          )}
                        >
                          {['Menu Info', 'Voice Orders', 'Dietary Help', 'Opening Hours'].map((feature, idx) => (
                            <motion.button
                              key={feature}
                              onClick={() => handlePillClick(feature)}
                              disabled={isLoading}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.4 + idx * 0.1, type: "spring", bounce: 0.5 }}
                              className={cn(
                                "rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 text-orange-300 font-medium backdrop-blur-sm",
                                "px-4 py-2 text-sm",
                                "sm:px-3 sm:py-1.5 sm:text-xs", // Smaller on mobile
                                "cursor-pointer hover:from-orange-500/20 hover:to-red-500/20 hover:border-orange-500/30 hover:scale-105 transition-all duration-200",
                                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                              )}
                            >
                              {feature}
                            </motion.button>
                          ))}
                        </motion.div>
                        
                        {/* Quick Reply Chips */}
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.8, duration: 0.5 }}
                          className="w-full"
                        >
                          <QuickReplyChips 
                            onReplySelect={(message) => {
                              sendMessage(message).catch(error => {
                                console.error('Error sending quick reply:', error);
                                toast.error('Failed to send message');
                              });
                            }}
                            disabled={isLoading}
                          />
                        </motion.div>
                      </div>
                    ) : (
                      <div className="space-y-4 p-6">
                        {messages
                          // Filter out empty bot messages in thinking state (shown by ThinkingMessageSkeleton instead)
                          .filter(msg => {
                            if (msg.sender === 'bot' && !msg.content && (msg.isTyping || msg.isStreaming)) {
                              return false; // Don't render empty typing or streaming bot messages
                            }
                            return true;
                          })
                          .map((message, index) => {
                            const isUser = message.sender === 'user';
                            const isFirstMessage = index === 0;
                            
                            // NEW: Check if this is a call summary message
                            const isCallSummary = message.metadata?.messageType === 'call_summary';
                            
                            // NEW: Render CallSummaryMessage for call summaries
                            if (isCallSummary) {
                              return (
                                <motion.div
                                  key={message.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: index * 0.05 }}
                                  className="mt-4"
                                >
                                  <CallSummaryMessage
                                    callDuration={message.metadata.callDuration || 0}
                                    itemsAdded={message.metadata.itemsAdded || []}
                                    total={message.metadata.total || 0}
                                  />
                                </motion.div>
                              );
                            }
                            
                            // NEW: Check if this is a consecutive message from the same sender
                            const previousMessage = index > 0 ? messages[index - 1] : null;
                            const isConsecutive = previousMessage && previousMessage.sender === message.sender;
                            const showAvatar = isFirstMessage || !isConsecutive;
                            
                            // NEW: Format timestamp
                            const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
                            
                            return (
                              <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className={cn(
                                  "flex gap-3 group relative",
                                  isUser ? "justify-end" : "justify-start",
                                  isConsecutive ? "mt-1" : "mt-4" // Reduced spacing for consecutive messages
                                )}
                              >
                                {/* Bot Avatar - Only show for first message in chain */}
                                {!isUser && showAvatar && (
                                  <div className="flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
                                      {config?.botAvatar ? (
                                        <img 
                                          src={config.botAvatar} 
                                          alt={config.botName || "Uncle Raj"} 
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        "UR"
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Spacer for consecutive bot messages without avatar */}
                                {!isUser && !showAvatar && (
                                  <div className="w-8" /> // Empty spacer to maintain alignment
                                )}
                                
                                {/* Message Bubble */}
                                <div className={cn(
                                  "flex flex-col max-w-[90%] relative",
                                  "md:max-w-[90%]",
                                  "sm:max-w-[90%]",
                                  isUser 
                                    ? "rounded-br-md"
                                    : "rounded-bl-md"
                                )}>                                  
                                  {/* Quick Action Buttons - Appear on hover */}
                                  <div className={cn(
                                    "absolute -top-8 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10",
                                    "sm:gap-0.5", // Tighter on mobile
                                    isUser ? "right-0" : "left-0"
                                  )}>
                                    {/* Copy button - for all messages */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCopyMessage(message.content, message.id)}
                                      className={cn(
                                        "bg-background/95 backdrop-blur-sm border border-border/50 hover:bg-background hover:border-orange-500/50 transition-all",
                                        "h-7 px-2",
                                        "sm:h-8 sm:min-w-[44px]" // Larger touch target on mobile
                                      )}
                                      title="Copy message"
                                    >
                                      {copiedMessageId === message.id ? (
                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </Button>
                                    
                                    {/* Delete button - only for user messages */}
                                    {isUser && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteMessage(message.id)}
                                        className={cn(
                                          "bg-background/95 backdrop-blur-sm border border-border/50 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-all",
                                          "h-7 px-2",
                                          "sm:h-8 sm:min-w-[44px]" // Larger touch target on mobile
                                        )}
                                        title="Delete message"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    )}
                                    
                                    {/* Regenerate button - only for bot messages and last message */}
                                    {!isUser && index === messages.length - 1 && !message.isStreaming && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRegenerateMessage}
                                        disabled={isLoading}
                                        className={cn(
                                          "bg-background/95 backdrop-blur-sm border border-border/50 hover:bg-orange-500/10 hover:border-orange-500/50 hover:text-orange-400 transition-all duration-200 hover:scale-110 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                                          "h-7 px-2",
                                          "sm:h-8 sm:min-w-[44px]" // Larger touch target on mobile
                                        )}
                                        title="Regenerate response"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                  
                                  {/* Message Content with hover effects */}
                                  <motion.div 
                                    whileHover={{ scale: 1.005, y: -1 }}
                                    transition={{ duration: 0.2 }}
                                    className={cn(
                                      "rounded-2xl backdrop-blur-sm relative",
                                      "px-5 py-3 shadow-sm",
                                      "sm:px-4 sm:py-2.5",
                                      "transition-all duration-200 hover:shadow-md",
                                      isUser 
                                        ? "bg-[#2F2F2F] text-white border-l-[3px] border-l-[#8B1538] border border-[rgba(255,255,255,0.1)] rounded-br-md"
                                        : "bg-[#1A1A1A] text-secondary-foreground border-l-[3px] border-l-[#F97316] border border-[rgba(255,255,255,0.05)] rounded-bl-md"
                                    )}
                                  >
                                    {/* Timestamp - appears on hover */}
                                    {timestamp && (
                                      <div className="absolute bottom-1 right-6 text-xs opacity-0 group-hover:opacity-60 transition-opacity duration-200 pointer-events-none">
                                        {timestamp}
                                      </div>
                                    )}
                                    
                                    {/* Render message content with inline menu cards */}
                                    <div className="prose prose-sm max-w-none dark:prose-invert">
                                      {isUser ? (
                                        <div className="text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                                          <ReactMarkdown 
                                            components={{
                                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                              ul: ({ children }) => <ul className="mb-2 last:mb-0 pl-4">{children}</ul>,
                                              ol: ({ children }) => <ol className="mb-2 last:mb-0 pl-4">{children}</ol>,
                                              li: ({ children }) => <li className="mb-1">{children}</li>,
                                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                            }}
                                          >
                                            {message.content}
                                          </ReactMarkdown>
                                        </div>
                                      ) : (
                                        // NEW: Use structured content rendering
                                        renderStructuredContent(message, orderMode)
                                      )}
                                    </div>
                                    
                                    {/* Action buttons on hover */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-2">
                                      <MessageActions 
                                        messageContent={message.content}
                                        messageId={message.id}
                                        sender={message.sender}
                                      />
                                    </div>
                                  </motion.div>
                                </div>
                                
                                {/* User Avatar - Only show for first message in chain */}
                                {isUser && showAvatar && (
                                  <div className="flex-shrink-0">
                                    <DynamicUserAvatar 
                                      size="w-8 h-8"
                                      textSize="text-xs"
                                    />
                                  </div>
                                )}
                                
                                {/* Spacer for consecutive user messages without avatar */}
                                {isUser && !showAvatar && (
                                  <div className="w-8" /> // Empty spacer to maintain alignment
                                )}
                              </motion.div>
                            );
                          })}
                        
                        {/* NEW: Show thinking state when loading and not streaming yet */}
                        {isLoading && !isStreaming && (
                          <div className="flex gap-3 mt-4">
                            <ThinkingMessageSkeleton 
                              botAvatar={config.botAvatar} 
                              botName={config.botName}
                            />
                          </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                  
                  {/* NEW: Voice Call Overlay - renders over entire modal during active call */}
                  {isVoiceCallActive && (
                    <VoiceCallOverlay
                      agentName={config.botName || 'Uncle Raj'}
                      agentAvatar={config.botAvatar}
                      isAISpeaking={isAISpeaking}
                      onHangUp={handleEndVoiceCall}
                    />
                  )}
                  
                  {/* Scroll to Bottom Button - Inside messages container */}
                  <AnimatePresence>
                    {showScrollButton && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-6 right-6 z-20"
                      >
                        <Button
                          onClick={scrollToBottom}
                          size="sm"
                          className={cn(
                            "rounded-full shadow-md backdrop-blur-sm",
                            "border transition-all duration-200",
                            "h-10 w-10 p-0",
                            "sm:h-11 sm:w-11", // Larger touch target on mobile (44px+)
                            "hover:scale-105 hover:shadow-lg"
                          )}
                          style={{
                            backgroundColor: 'rgba(47, 47, 47, 0.8)',
                            borderColor: 'rgba(255, 255, 255, 0.1)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#8B1538';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          }}
                          title="Scroll to bottom"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 hover:text-white transition-colors">
                            <path d="M12 5v14M19 12l-7 7-7-7"/>
                          </svg>
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Input Area */}
                <div 
                  className="flex-shrink-0 border-t"
                  style={{ 
                    borderColor: PremiumTheme.colors.border.medium,
                    backgroundColor: PremiumTheme.colors.background.secondary
                  }}
                >
                  {/* Constrained container */}
                  <div className="max-w-4xl mx-auto px-4 py-3">
                    
                    {/* Single ChatGPT-style pill container */}
                    <div 
                      className={cn(
                        "flex items-center gap-3 px-4 py-2 rounded-full",
                        "transition-all duration-200",
                        "focus-within:ring-2 focus-within:ring-orange-500/30"
                      )}
                      style={{
                        backgroundColor: '#2F2F2F',
                        border: `1px solid ${PremiumTheme.colors.border.medium}`
                      }}
                    >
                      {/* Textarea - LEFT/CENTER (grows) */}
                      <Textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                          isVoiceCallActive 
                            ? "Voice call in progress..." 
                            : "Ask about our menu, dietary options, or place an order..."
                        }
                        disabled={isLoading || isVoiceCallActive}
                        className={cn(
                          "flex-1 min-w-0 resize-none bg-transparent border-0",
                          "focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                          "min-h-[24px] max-h-[120px] p-0",
                          "placeholder:text-muted-foreground",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                        style={{
                          color: PremiumTheme.colors.text.primary
                        }}
                        rows={1}
                      />
                      
                      {/* Green Call Button - RIGHT (inside pill) - Only show if voice enabled */}
                      {voiceSettings?.enabled && (
                        <button
                          onClick={handlePhoneClick}
                          disabled={isVoiceCallActive || isLoading}
                          className={cn(
                            "flex-shrink-0 flex items-center gap-2",
                            "text-green-500 hover:text-green-400",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "transition-all duration-200",
                            "group"
                          )}
                          title={isAuthenticated ? "Start voice call with Uncle Raj" : "Sign up to use voice ordering"}
                          aria-label={isAuthenticated ? "Start voice call" : "Sign up for voice calls"}
                        >
                          <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="text-sm font-medium hidden sm:inline">
                            Call Uncle Raj
                          </span>
                        </button>
                      )}
                      
                      {/* Burgundy Send Button - FAR RIGHT (inside pill) */}
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading || isVoiceCallActive}
                        className={cn(
                          "flex-shrink-0 h-9 w-9 rounded-full",
                          "flex items-center justify-center",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110"
                        )}
                        style={{ 
                          background: inputValue.trim() && !isLoading && !isVoiceCallActive
                            ? `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[700]} 0%, ${PremiumTheme.colors.burgundy[800]} 100%)`
                            : PremiumTheme.colors.background.tertiary
                        }}
                        title="Send message"
                        aria-label="Send message"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                        ) : (
                          <Send className="w-5 h-5 text-white" />
                        )}
                      </button>
                      
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Cart Drawer - Slides in from right (35% width) */}
              <CartDrawer />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Voice ordering T&C screen modal overlay */}
      {showVoiceTCScreen && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ 
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <InlineTermsScreen
            onAcceptTerms={handleVoiceTermsAccepted}
            onCancel={handleVoiceTermsCancelled}
          />
        </div>
      )}
      
      {/* Welcome Screen - First-time users */}
      <WelcomeScreen
        isOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
      />
      
      {/* Voice Signup Prompt Modal - Guest users clicking phone icon */}
      <VoiceSignupPrompt 
        isOpen={showVoiceSignupPrompt}
        onClose={() => setShowVoiceSignupPrompt(false)}
      />
      
      {/* Voice Maintenance Modal - Shown when maintenance mode is ON */}
      <VoiceMaintenanceModal 
        isOpen={showVoiceMaintenanceModal}
        onClose={() => setShowVoiceMaintenanceModal(false)}
      />
    </>
  );
}
