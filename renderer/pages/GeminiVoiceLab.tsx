import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Loader2, ShoppingCart, Trash2, Plus, Minus, Copy, RefreshCw, ChevronDown, ChevronUp, Check, ShieldAlert, ShieldCheck, Power } from "lucide-react";
import { toast } from "sonner";
import { GeminiVoiceClient, GeminiVoiceState } from "utils/geminiVoiceClient";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QSAITheme, styles as qsaiStyles, effects } from "utils/QSAIDesign";
import { useCartStore } from "utils/cartStore";
import { useSimpleAuth } from "utils/simple-auth-context";
import { apiClient } from 'app';
import { AddItemRequest, RemoveItemRequest, UpdateQuantityRequest } from "types";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useVoiceAgentStore } from "utils/voiceAgentStore";

// Dedicated lab page to build and test the Gemini Live API voice ordering flow safely.
// No props. Router will mount this page at /gemini-voice-lab automatically.

const stateLabel: Record<GeminiVoiceState, string> = {
  idle: "Idle",
  "requesting-token": "Preparing token...",
  connecting: "Connecting...",
  connected: "Connected",
  listening: "Listening...",
  stopping: "Stopping...",
  closed: "Closed",
  error: "Error",
};

interface LabCartItem {
  name: string;
  quantity: number;
  notes?: string;
}

interface FunctionCallLog {
  timestamp: string;
  name: string;
  args: any;
}

// Voice model options for Gemini Live API
const GEMINI_VOICE_OPTIONS = [
  { value: 'Puck', label: 'Puck', description: 'Friendly and conversational (default)' },
  { value: 'Charon', label: 'Charon', description: 'Deep and authoritative' },
  { value: 'Kore', label: 'Kore', description: 'Neutral and professional' },
  { value: 'Fenrir', label: 'Fenrir', description: 'Excitable and energetic' },
  { value: 'Aoede', label: 'Aoede', description: 'Breezy and light' },
  { value: 'Zephyr', label: 'Zephyr', description: 'Bright and cheerful' },
  { value: 'Leda', label: 'Leda', description: 'Youthful and fresh' },
  { value: 'Orus', label: 'Orus', description: 'Firm and steady' },
];

export default function GeminiVoiceLab() {
  const navigate = useNavigate();
  const { user } = useSimpleAuth(); // Get authenticated user
  const [state, setState] = useState<GeminiVoiceState>("idle");
  const [assistantText, setAssistantText] = useState("");
  
  // ✅ NEW: System prompt state (Phase 2)
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(true);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  
  // ✅ NEW: Voice configuration state (Phase 7)
  const [voiceModel, setVoiceModel] = useState<string>('Puck');
  const [firstResponse, setFirstResponse] = useState<string>('Hello! Welcome to Cottage Tandoori. How can I help you today?');
  
  // ✅ Use real cart store instead of local state
  const cartItems = useCartStore((state) => state.items);
  const cartTotalItems = useCartStore((state) => state.totalItems);
  const clearRealCart = useCartStore((state) => state.clearCart);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const [functionCalls, setFunctionCalls] = useState<FunctionCallLog[]>([]);
  const clientRef = useRef<GeminiVoiceClient | null>(null);

  // Voice availability control state
  const masterSwitchEnabled = useVoiceAgentStore((state) => state.masterSwitchEnabled);
  const setMasterSwitchEnabled = useVoiceAgentStore((state) => state.setMasterSwitchEnabled);
  const underMaintenance = useVoiceAgentStore((state) => state.underMaintenance);
  const setUnderMaintenance = useVoiceAgentStore((state) => state.setUnderMaintenance);
  const [isLoadingVoiceSettings, setIsLoadingVoiceSettings] = useState(true);
  const [isUpdatingVoiceSettings, setIsUpdatingVoiceSettings] = useState(false);

  const fetchVoiceSettings = async () => {
    try {
      setIsLoadingVoiceSettings(true);
      const response = await apiClient.get_ai_voice_settings();
      const data = await response.json();
      if (data?.success && data?.settings) {
        setMasterSwitchEnabled(Boolean(data.settings.enabled));
        setUnderMaintenance(Boolean(data.settings.under_maintenance));
      } else {
        throw new Error(data?.error || "Failed to load AI voice settings");
      }
    } catch (error: any) {
      console.error("❌ [GeminiVoiceLab] Failed to fetch voice settings", error);
      toast.error(error?.message || "Unable to load voice controls");
    } finally {
      setIsLoadingVoiceSettings(false);
    }
  };

  const updateVoiceSettings = async (updates: Partial<{ enabled: boolean; under_maintenance: boolean }>, successMessage?: string) => {
    try {
      setIsUpdatingVoiceSettings(true);
      const response = await apiClient.update_ai_voice_settings(updates);
      const data = await response.json();

      if (data?.success && data?.settings) {
        setMasterSwitchEnabled(Boolean(data.settings.enabled));
        setUnderMaintenance(Boolean(data.settings.under_maintenance));
        toast.success(successMessage || "Voice settings updated");
      } else {
        throw new Error(data?.error || data?.message || "Failed to update AI voice settings");
      }
    } catch (error: any) {
      console.error("❌ [GeminiVoiceLab] Failed to update voice settings", error);
      toast.error(error?.message || "Voice settings update failed");
    } finally {
      setIsUpdatingVoiceSettings(false);
    }
  };

  useEffect(() => {
    fetchVoiceSettings();
  }, []);

  // Load voice configuration from localStorage on mount
  useEffect(() => {
    const storedVoiceModel = localStorage.getItem('geminiVoiceLab_voiceModel');
    const storedFirstResponse = localStorage.getItem('geminiVoiceLab_firstResponse');
    
    if (storedVoiceModel) {
      setVoiceModel(storedVoiceModel);
    }
    if (storedFirstResponse) {
      setFirstResponse(storedFirstResponse);
    }
  }, []);

  // Save voice configuration to localStorage on change
  useEffect(() => {
    localStorage.setItem('geminiVoiceLab_voiceModel', voiceModel);
  }, [voiceModel]);

  useEffect(() => {
    localStorage.setItem('geminiVoiceLab_firstResponse', firstResponse);
  }, [firstResponse]);

  // ✅ NEW: Fetch production system prompt on mount (Phase 2)
  useEffect(() => {
    const loadSystemPrompt = async () => {
      try {
        setIsLoadingPrompt(true);
        setPromptError(null);
        
        console.log('📄 [GeminiVoiceLab] Fetching voice system prompt...');
        const response = await apiClient.generate_system_prompt({ channel: 'voice' });
        const data = await response.json();
        
        if (data?.complete_prompt) {
          setSystemPrompt(data.complete_prompt);
          console.log('✅ [GeminiVoiceLab] System prompt loaded:', {
            length: data.complete_prompt.length,
            preview: data.complete_prompt.substring(0, 100) + '...'
          });
        } else {
          throw new Error('No complete_prompt in response');
        }
      } catch (error: any) {
        console.error('❌ [GeminiVoiceLab] Failed to load system prompt:', error);
        setPromptError(error.message || 'Failed to load system prompt');
        toast.error('Failed to load AI prompt - using fallback');
      } finally {
        setIsLoadingPrompt(false);
      }
    };
    
    loadSystemPrompt();
  }, []);

  // 🔍 DEBUG: Log user auth state on mount
  useEffect(() => {
    console.log('🔐 [GeminiVoiceLab] User auth state:', { 
      isAuthenticated: !!user, 
      userId: user?.id,
      userEmail: user?.email 
    });
  }, [user]);

  // Helper to add item to cart via brain client
  const addItemToCart = async (itemName: string, quantity = 1, notes?: string) => {
    try {
      console.log('🛒 [addItemToCart] Adding item:', { itemName, quantity, notes, userId: user?.id });
      
      // ✅ FIX: Enforce EITHER/OR constraint - send ONLY user_id OR session_id, never both
      const payload: AddItemRequest = {
        item_name: itemName,
        quantity,
        notes,
        user_id: user?.id || undefined,
        session_id: user?.id ? undefined : (useCartStore.getState().sessionId || undefined),
        order_mode: 'collection'
      };
      
      const response = await apiClient.add_item_to_cart(payload);
      const data = await response.json();
      
      console.log('🛒 [addItemToCart] Response:', data);
      if (data.success) {
        toast.success(`${itemName} added to cart`);
        return data;
      } else {
        toast.error(data.message || 'Failed to add item');
        return null;
      }
    } catch (error) {
      console.error('🛒 [addItemToCart] Error:', error);
      toast.error('Failed to add item to cart');
      return null;
    }
  };

  // Helper to update cart quantity via brain client
  const updateCartQuantity = async (cartItemId: string, quantity: number) => {
    try {
      console.log('🛒 [updateCartQuantity] Updating:', { cartItemId, quantity, userId: user?.id });

      // ✅ FIX: Enforce EITHER/OR constraint
      const payload: UpdateQuantityRequest = {
        cart_item_id: cartItemId,
        new_quantity: quantity,
        session_id: user?.id ? undefined : (useCartStore.getState().sessionId || undefined),
      };
      
      const response = await apiClient.update_item_quantity(payload);
      const data = await response.json();
      
      console.log('🛒 [updateCartQuantity] Response:', data);
      if (data.success) {
        toast.success('Cart updated');
        return data;
      } else {
        toast.error(data.message || 'Failed to update cart');
        return null;
      }
    } catch (error) {
      console.error('🛒 [updateCartQuantity] Error:', error);
      toast.error('Failed to update cart quantity');
      return null;
    }
  };

  // Helper to remove item from cart by name
  const removeFromCart = async (itemName: string) => {
    try {
      console.log('🛒 [removeFromCart] Removing item:', { itemName, userId: user?.id });
      
      // ✅ FIX: Enforce EITHER/OR constraint
      const payload: RemoveItemRequest = {
        item_name: itemName,
        session_id: user?.id ? undefined : (useCartStore.getState().sessionId || undefined),
      };
      
      const response = await apiClient.remove_item_from_cart(payload);
      const data = await response.json();
      
      console.log('🛒 [removeFromCart] Response:', data);
      if (data.success) {
        toast.success('Item removed from cart');
        return data;
      } else {
        toast.error(data.message || 'Failed to remove item');
        return null;
      }
    } catch (error) {
      console.error('🛒 [removeFromCart] Error:', error);
      toast.error('Failed to remove item from cart');
      return null;
    }
  };

  // Helper to get current cart via brain client
  const getCart = async () => {
    try {
      console.log('🛒 [getCart] Fetching cart for user:', user?.id);
      
      const payload = {
        user_id: user?.id || null,
        session_id: useCartStore.getState().sessionId || null,
      };
      
      const response = await apiClient.get_cart(payload);
      const data = await response.json();
      
      console.log('🛒 [getCart] Response:', data);
      return data;
    } catch (error) {
      console.error('🛒 [getCart] Error:', error);
      return null;
    }
  };

  // Helper to update cart item customizations
  const updateCustomizations = async (cartItemId: string, customizations: any) => {
    try {
      console.log('🛒 [updateCustomizations] Updating:', { cartItemId, customizations });
      
      const response = await apiClient.update_cart_customizations({
        cart_item_id: cartItemId,
        customizations,
        session_id: user?.id ? undefined : (useCartStore.getState().sessionId || undefined),
      });
      const data = await response.json();
      
      console.log('🛒 [updateCustomizations] Response:', data);
      if (data.success) {
        toast.success('Customizations updated');
        return data;
      } else {
        toast.error(data.message || 'Failed to update customizations');
        return null;
      }
    } catch (error) {
      console.error('🛒 [updateCustomizations] Error:', error);
      toast.error('Failed to update customizations');
      return null;
    }
  };

  // Helper to clear entire cart
  const clearCart = async () => {
    try {
      console.log('🛒 [clearCart] Clearing cart for user:', user?.id);
      
      const response = await apiClient.clear_cart({
        user_id: user?.id || undefined,
        session_id: user?.id ? undefined : (useCartStore.getState().sessionId || undefined),
      });
      const data = await response.json();
      
      console.log('🛒 [clearCart] Response:', data);
      if (data.success) {
        toast.success('Cart cleared');
        return data;
      } else {
        toast.error(data.message || 'Failed to clear cart');
        return null;
      }
    } catch (error) {
      console.error('🛒 [clearCart] Error:', error);
      toast.error('Failed to clear cart');
      return null;
    }
  };

  useEffect(() => {
    // Initialize a fresh client when visiting the lab page
    clientRef.current = new GeminiVoiceClient({
      voiceName: voiceModel, // ✅ Use selected voice model (Phase 7)
      systemPrompt: systemPrompt || undefined, // ✅ NEW: Pass production prompt
      firstResponse: firstResponse || undefined, // ✅ Use custom greeting (Phase 7)
      onStateChange: setState,
      onServerText: (t) => setAssistantText((prev) => prev + t),
      onError: (e) => toast.error(e),
      onCartUpdate: (action, item) => {
        // ✅ Only show toasts here, state is handled by cartStore internally in the client
        if (action === 'add') {
          toast.success(`Added ${item.quantity || 1}x ${item.name}`);
        } else if (action === 'remove') {
          toast.info(`Removed ${item.name}`);
        }
      },
      onFunctionCall: (name, args) => {
        setFunctionCalls((prev) => [
          { timestamp: new Date().toLocaleTimeString(), name, args },
          ...prev.slice(0, 9), // Keep last 10
        ]);
      },
      // ✅ Inject user-aware cart operations
      cartOperations: {
        addItem: async (itemName: string, quantity: number, notes?: string) => {
          const result = await addItemToCart(itemName, quantity, notes);
          if (result?.success) {
            return { success: true, message: result.message || `Added ${quantity}x ${itemName}` };
          }
          return { success: false, message: result?.message || 'Failed to add item' };
        },
        removeItem: async (itemName: string) => {
          try {
            // 1. Fetch current cart
            const cartData = await getCart();
            
            if (!cartData?.success || !cartData?.items || cartData.items.length === 0) {
              return { 
                success: false, 
                message: 'Your cart is empty' 
              };
            }
            
            // 2. Find item by fuzzy name match (case-insensitive)
            const matchedItem = cartData.items.find((item: any) => 
              item.name.toLowerCase().includes(itemName.toLowerCase())
            );
            
            if (!matchedItem) {
              return { 
                success: false, 
                message: `Could not find "${itemName}" in your cart` 
              };
            }
            
            // 3. Remove using existing helper (expects item_id)
            const result = await removeFromCart(matchedItem.item_id || matchedItem.id);
            
            if (result?.success) {
              return { 
                success: true, 
                message: `Removed ${matchedItem.name} from cart` 
              };
            }
            
            return { 
              success: false, 
              message: result?.message || 'Failed to remove item' 
            };
          } catch (error: any) {
            console.error('🛒 [removeItem] Error:', error);
            return { 
              success: false, 
              message: 'Failed to remove item from cart' 
            };
          }
        },
        getCart: async () => {
          const result = await getCart();
          if (result?.success) {
            return { success: true, items: result.items || [] };
          }
          return { success: false, items: [] };
        },
        updateQuantity: async (cartItemId: string, quantity: number) => {
          const result = await updateCartQuantity(cartItemId, quantity);
          if (result?.success) {
            return { success: true, message: result.message || 'Quantity updated' };
          }
          return { success: false, message: result?.message || 'Failed to update quantity' };
        },
        updateCustomizations: async (cartItemId: string, customizations: any) => {
          const result = await updateCustomizations(cartItemId, customizations);
          if (result?.success) {
            return { success: true, message: result.message || 'Customizations updated' };
          }
          return { success: false, message: result?.message || 'Failed to update customizations' };
        },
        clearCart: async () => {
          const result = await clearCart();
          if (result?.success) {
            return { success: true, message: result.message || 'Cart cleared' };
          }
          return { success: false, message: result?.message || 'Failed to clear cart' };
        }
      }
    });

    return () => {
      clientRef.current?.stop();
      clientRef.current = null;
    };
  }, []);

  const isBusy = state === "requesting-token" || state === "connecting" || state === "stopping";
  const isListening = state === "listening";

  const handleStart = async () => {
    try {
      setAssistantText("");
      await clientRef.current?.start();
      toast.message("Voice session started — speak naturally.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to start voice session");
    }
  };

  const handleStop = async () => {
    await clientRef.current?.stop();
  };

  const handleClearCart = () => {
    clearRealCart();
    toast.info("Cart cleared");
  };

  const handleUpdateQuantity = (itemId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      removeItem(itemId);
    } else {
      updateItemQuantity(itemId, newQty);
    }
  };

  // ✅ NEW: System prompt helper functions (Phase 3)
  const handleCopyPrompt = async () => {
    if (!systemPrompt) return;
    try {
      await navigator.clipboard.writeText(systemPrompt);
      setIsCopying(true);
      toast.success('System prompt copied to clipboard');
      setTimeout(() => setIsCopying(false), 2000);
    } catch (error) {
      toast.error('Failed to copy prompt');
    }
  };

  const handleRefreshPrompt = async () => {
    setIsLoadingPrompt(true);
    setPromptError(null);
    try {
      console.log('🔄 [GeminiVoiceLab] Refreshing system prompt...');
      const response = await apiClient.generate_system_prompt({ channel: 'voice' });
      const data = await response.json();
      if (data?.complete_prompt) {
        setSystemPrompt(data.complete_prompt);
        toast.success('System prompt refreshed');
        console.log('✅ [GeminiVoiceLab] Prompt refreshed:', data.complete_prompt.length, 'chars');
      }
    } catch (error: any) {
      setPromptError(error.message || 'Failed to refresh');
      toast.error('Failed to refresh prompt');
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  const countFunctions = (prompt: string): number => {
    // Count function declarations in prompt
    const matches = prompt.match(/"name":\s*"[^"]+"/g);
    return matches ? matches.length : 0;
  };

  const statusMeta = React.useMemo(() => {
    if (!masterSwitchEnabled) {
      return {
        color: '#991B1B',
        accent: '#F87171',
        label: 'DISABLED - Hidden from customers',
        icon: <Power className="h-4 w-4" />,
        description: 'Voice experiences fully concealed across chat and customer touchpoints.'
      };
    }

    if (underMaintenance) {
      return {
        color: '#92400E',
        accent: '#FBBF24',
        label: 'ENABLED - Under Maintenance',
        icon: <ShieldAlert className="h-4 w-4" />,
        description: 'Button stays visible but customers see a maintenance notice when tapping call.'
      };
    }

    return {
      color: '#166534',
      accent: '#34D399',
      label: 'LIVE - Fully Operational',
      icon: <ShieldCheck className="h-4 w-4" />,
      description: 'Voice assistant is live with full call flow available to authenticated guests.'
    };
  }, [masterSwitchEnabled, underMaintenance]);

  return (
    <main 
      className="min-h-screen p-6"
      style={{
        background: QSAITheme.background.primary, // Deep black #121212
        color: QSAITheme.text.primary,
      }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 
            className="text-2xl font-bold"
            style={qsaiStyles.purpleGradientText}
          >
            Gemini Voice Lab
          </h1>
          <p className="mt-1 text-sm" style={{ color: QSAITheme.text.muted }}>
            Test the direct browser → Gemini Live API voice flow safely here before integrating into OnlineOrders.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Controls + Assistant */}
          <div className="space-y-6">
            {/* AI Voice Master Control */}
            <Card
              className="border-0"
              style={{
                background: QSAITheme.background.tertiary,
                border: `1px solid ${QSAITheme.border.medium}`,
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.35)'
              }}
            >
              <CardHeader className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <CardTitle style={{ color: QSAITheme.text.primary }}>AI Voice System Control</CardTitle>
                  <Badge
                    style={{
                      backgroundColor: statusMeta.accent,
                      color: '#0F172A'
                    }}
                  >
                    {statusMeta.label}
                  </Badge>
                </div>
                <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
                  Master controls to safely expose or hide Gemini voice calling across the customer experience.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div
                  className="p-4 rounded-xl border"
                  style={{
                    borderColor: QSAITheme.border.accent,
                    background: 'rgba(91, 33, 182, 0.05)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: QSAITheme.text.primary }}>🎙️ Master Toggle</p>
                      <p className="text-xs mt-1" style={{ color: QSAITheme.text.muted }}>
                        Turn OFF to completely hide voice features from customers.
                      </p>
                    </div>
                    <Switch
                      checked={masterSwitchEnabled}
                      disabled={isLoadingVoiceSettings || isUpdatingVoiceSettings}
                      onCheckedChange={(checked) => updateVoiceSettings({ enabled: checked }, checked ? 'Voice master toggle enabled' : 'Voice master toggle disabled')}
                    />
                  </div>
                  {isLoadingVoiceSettings && (
                    <p className="text-xs mt-3" style={{ color: QSAITheme.text.muted }}>
                      Loading current status...
                    </p>
                  )}
                </div>

                {masterSwitchEnabled && (
                  <div
                    className="p-4 rounded-xl border"
                    style={{
                      borderColor: QSAITheme.border.medium,
                      background: 'rgba(251, 191, 36, 0.08)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: QSAITheme.text.primary }}>⚙️ Maintenance Mode</p>
                        <p className="text-xs mt-1" style={{ color: QSAITheme.text.muted }}>
                          When ON, customers see the maintenance modal instead of live calls.
                        </p>
                      </div>
                      <Switch
                        checked={underMaintenance}
                        disabled={isUpdatingVoiceSettings}
                        onCheckedChange={(checked) => updateVoiceSettings({ under_maintenance: checked }, checked ? 'Maintenance mode enabled' : 'Maintenance mode disabled')}
                      />
                    </div>
                  </div>
                )}

                <div
                  className="p-4 rounded-xl flex items-start gap-3"
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: `1px solid ${statusMeta.color}`,
                    color: statusMeta.accent
                  }}
                >
                  <div className="mt-1" style={{ color: statusMeta.accent }}>
                    {statusMeta.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: statusMeta.accent }}>{statusMeta.label}</p>
                    <p className="text-xs mt-1" style={{ color: QSAITheme.text.muted }}>{statusMeta.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border-0"
              style={{
                background: QSAITheme.background.tertiary,
                border: `1px solid ${QSAITheme.border.medium}`,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
              }}
            >
              <CardHeader>
                <CardTitle style={{ color: QSAITheme.text.primary }}>Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {!isListening ? (
                    <Button 
                      onClick={handleStart} 
                      disabled={isBusy} 
                      className="min-w-[120px] border-0"
                      style={{
                        background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
                        color: '#FFFFFF',
                        boxShadow: `0 0 15px ${QSAITheme.purple.glow}`,
                      }}
                    >
                      {isBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mic className="h-4 w-4 mr-2" />}
                      Start
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleStop} 
                      className="min-w-[120px] border-0"
                      style={{
                        background: 'linear-gradient(135deg, #991B1B 0%, #DC2626 100%)',
                        color: '#FFFFFF',
                      }}
                    >
                      <MicOff className="h-4 w-4 mr-2" /> Stop
                    </Button>
                  )}
                  <div className="text-sm" style={{ color: QSAITheme.text.muted }}>
                    Status: <span className="font-medium" style={{ color: QSAITheme.text.primary }}>{stateLabel[state]}</span>
                  </div>
                </div>
                <div className="mt-3 text-xs" style={{ color: QSAITheme.text.muted }}>
                  💡 Try: "I'd like two chicken tikka please" or "Does the lamb tikka have any allergens?"
                </div>
              </CardContent>
            </Card>

            {/* Voice Configuration Card */}
            <Card style={{ ...qsaiStyles.frostedGlassStyle, borderColor: QSAITheme.border.medium }}>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold" style={{ color: QSAITheme.text.primary }}>
                    🎙️ Voice Configuration
                  </h2>
                  <Badge style={{ backgroundColor: QSAITheme.purple.primary, color: 'white' }}>
                    Playground
                  </Badge>
                </div>

                {/* Voice Model Selector */}
                <div className="space-y-2">
                  <Label htmlFor="voice-model" className="text-sm" style={{ color: QSAITheme.text.primary }}>
                    Voice Model
                  </Label>
                  <Select
                    value={voiceModel}
                    onValueChange={(value) => setVoiceModel(value)}
                    disabled={state !== 'idle'}
                  >
                    <SelectTrigger
                      id="voice-model"
                      className="transition-all duration-200"
                      style={{
                        backgroundColor: QSAITheme.background.tertiary,
                        borderColor: QSAITheme.border.medium,
                        color: QSAITheme.text.primary
                      }}
                    >
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        backgroundColor: QSAITheme.background.secondary,
                        borderColor: QSAITheme.border.medium,
                      }}
                    >
                      {GEMINI_VOICE_OPTIONS.map((voice) => (
                        <SelectItem
                          key={voice.value}
                          value={voice.value}
                          style={{
                            color: QSAITheme.text.primary,
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{voice.label}</span>
                            <span className="text-xs" style={{ color: QSAITheme.text.muted }}>
                              {voice.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs" style={{ color: QSAITheme.text.muted }}>
                    Choose from Gemini Live API voice personalities
                  </p>
                </div>

                {/* First Response / Greeting */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="first-response" className="text-sm" style={{ color: QSAITheme.text.primary }}>
                      First Response / Greeting
                    </Label>
                    <span className="text-xs" style={{ color: QSAITheme.text.muted }}>
                      {firstResponse.length} / 500
                    </span>
                  </div>
                  <Input
                    id="first-response"
                    value={firstResponse}
                    onChange={(e) => setFirstResponse(e.target.value)}
                    placeholder="Hello! Welcome to Cottage Tandoori..."
                    maxLength={500}
                    disabled={state !== 'idle'}
                    className="transition-all duration-200"
                    style={{
                      backgroundColor: QSAITheme.background.tertiary,
                      borderColor: QSAITheme.border.medium,
                      color: QSAITheme.text.primary
                    }}
                  />
                  <p className="text-xs" style={{ color: QSAITheme.text.muted }}>
                    The AI's initial greeting when you connect
                  </p>
                </div>

                {state !== 'idle' && (
                  <div className="pt-2 border-t" style={{ borderColor: QSAITheme.border.medium }}>
                    <p className="text-xs" style={{ color: QSAITheme.text.muted }}>
                      ℹ️ Disconnect to change voice settings
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* ✅ NEW: System Prompt Card (Phase 3) */}
            <Card 
              className="border-0"
              style={{
                background: QSAITheme.background.tertiary,
                border: `1px solid ${QSAITheme.border.medium}`,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
              }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle style={{ color: QSAITheme.text.primary }}>System Prompt</CardTitle>
                  <div className="flex items-center gap-2">
                    {isLoadingPrompt ? (
                      <Loader2 className="h-4 w-4 animate-spin" style={{ color: QSAITheme.text.muted }} />
                    ) : systemPrompt ? (
                      <>
                        <Badge variant="outline" style={{ borderColor: QSAITheme.purple.light, color: QSAITheme.purple.light }}>
                          {systemPrompt.length.toLocaleString()} chars
                        </Badge>
                        <Badge variant="outline" style={{ borderColor: QSAITheme.purple.light, color: QSAITheme.purple.light }}>
                          {countFunctions(systemPrompt)} functions
                        </Badge>
                      </>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyPrompt}
                      disabled={!systemPrompt || isLoadingPrompt}
                      className="h-8 w-8"
                      style={{ color: QSAITheme.text.muted }}
                    >
                      {isCopying ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRefreshPrompt}
                      disabled={isLoadingPrompt}
                      className="h-8 w-8"
                      style={{ color: QSAITheme.text.muted }}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingPrompt ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                      disabled={!systemPrompt}
                      className="h-8 w-8"
                      style={{ color: QSAITheme.text.muted }}
                    >
                      {isPromptExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingPrompt ? (
                  <div className="text-center py-8" style={{ color: QSAITheme.text.muted }}>
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                    <p className="text-sm">Loading production voice prompt...</p>
                  </div>
                ) : promptError ? (
                  <div className="text-center py-8" style={{ color: '#DC2626' }}>
                    <p className="text-sm">⚠️ {promptError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshPrompt}
                      className="mt-3"
                      style={{ borderColor: QSAITheme.border.medium, color: QSAITheme.text.primary }}
                    >
                      <RefreshCw className="h-3 w-3 mr-2" /> Retry
                    </Button>
                  </div>
                ) : systemPrompt ? (
                  <>
                    <div className="text-xs mb-2" style={{ color: QSAITheme.text.muted }}>
                      ✅ Using production voice system prompt with full CORE rules and 12-function integration
                    </div>
                    {isPromptExpanded && (
                      <div 
                        className="whitespace-pre-wrap text-xs leading-5 max-h-[400px] overflow-y-auto p-3 rounded-md font-mono"
                        style={{
                          background: QSAITheme.background.panel,
                          border: `1px solid ${QSAITheme.border.light}`,
                          color: QSAITheme.text.secondary,
                        }}
                      >
                        {systemPrompt}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8" style={{ color: QSAITheme.text.muted }}>
                    <p className="text-sm">No prompt loaded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card 
              className="border-0"
              style={{
                background: QSAITheme.background.tertiary,
                border: `1px solid ${QSAITheme.border.medium}`,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
              }}
            >
              <CardHeader>
                <CardTitle style={{ color: QSAITheme.text.primary }}>Assistant Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="whitespace-pre-wrap text-sm leading-6 min-h-[160px] p-3 rounded-md"
                  style={{
                    background: QSAITheme.background.panel,
                    border: `1px solid ${QSAITheme.border.light}`,
                    color: QSAITheme.text.secondary,
                  }}
                >
                  {assistantText || "I'm ready. Tap Start and speak your order or ask about the menu."}
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border-0"
              style={{
                background: QSAITheme.background.tertiary,
                border: `1px solid ${QSAITheme.border.medium}`,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
              }}
            >
              <CardHeader>
                <CardTitle style={{ color: QSAITheme.text.primary }}>Function Call Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {functionCalls.length === 0 ? (
                    <div className="text-sm text-center py-4" style={{ color: QSAITheme.text.muted }}>
                      No function calls yet
                    </div>
                  ) : (
                    functionCalls.map((call, idx) => (
                      <div 
                        key={idx} 
                        className="text-xs p-2 rounded"
                        style={{
                          background: QSAITheme.background.panel,
                          border: `1px solid ${QSAITheme.border.light}`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className="text-xs border-0"
                            style={{
                              background: QSAITheme.background.highlight,
                              color: QSAITheme.text.muted,
                            }}
                          >
                            {call.timestamp}
                          </Badge>
                          <span className="font-mono font-semibold" style={{ color: QSAITheme.purple.light }}>
                            {call.name}
                          </span>
                        </div>
                        <pre className="mt-1 overflow-x-auto" style={{ color: QSAITheme.text.muted }}>
                          {JSON.stringify(call.args, null, 2)}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Lab Cart */}
          <div>
            <Card 
              className="border-0 sticky top-6"
              style={{
                background: QSAITheme.background.tertiary,
                border: `1px solid ${QSAITheme.border.accent}`,
                boxShadow: `0 4px 12px ${QSAITheme.purple.glow}`,
              }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2" style={{ color: QSAITheme.text.primary }}>
                    <ShoppingCart className="h-5 w-5" style={{ color: QSAITheme.purple.primary }} />
                    Real Cart
                    {cartTotalItems > 0 && (
                      <Badge 
                        className="border-0"
                        style={{
                          background: QSAITheme.purple.primary,
                          color: '#FFFFFF',
                        }}
                      >
                        {cartTotalItems} {cartTotalItems === 1 ? 'item' : 'items'}
                      </Badge>
                    )}
                  </CardTitle>
                  {cartItems.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleClearCart}
                      style={{ color: QSAITheme.text.muted }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {cartItems.length === 0 ? (
                  <div className="text-center py-12" style={{ color: QSAITheme.text.muted }}>
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Cart is empty</p>
                    <p className="text-xs mt-1">Voice order items to see them appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((item, idx) => {
                      // ✅ PHASE 4: Use production cart display pattern (CartContent.tsx line 357)
                      // Priority: variant_name from cart table → variant object → item.name → fallback
                      const displayName = item.variant_name || item.variant?.variant_name || item.name || 'Menu item';
                      
                      return (
                        <div 
                          key={item.id} 
                          className="p-3 rounded-lg"
                          style={{
                            background: QSAITheme.background.panel,
                            border: `1px solid ${QSAITheme.border.light}`,
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium" style={{ color: QSAITheme.text.primary }}>
                                {displayName}
                              </div>
                              {item.notes && (
                                <div className="text-xs mt-1 italic" style={{ color: QSAITheme.text.muted }}>
                                  "{item.notes}"
                                </div>
                              )}
                              {item.variant && item.variant.name !== 'Standard' && (
                                <div className="text-xs mt-1 text-purple-400">
                                  {item.variant.name}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 border-0"
                                style={{
                                  background: QSAITheme.background.highlight,
                                  color: QSAITheme.text.primary,
                                }}
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="font-semibold min-w-[24px] text-center" style={{ color: QSAITheme.text.primary }}>
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 border-0"
                                style={{
                                  background: QSAITheme.background.highlight,
                                  color: QSAITheme.text.primary,
                                }}
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <Separator style={{ background: QSAITheme.border.medium }} className="my-4" />
                    <div 
                      className="text-sm text-center"
                      style={{ color: QSAITheme.purple.light }}
                    >
                      ✅ Connected to Global Cart Store
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
