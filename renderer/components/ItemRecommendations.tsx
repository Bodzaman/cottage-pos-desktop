import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, TrendingUp, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PremiumTheme } from '../utils/premiumTheme';
import { MenuItem } from 'utils/menuTypes';
import { CartItem } from 'types';
import { trackItemAdded } from '../utils/cartAnalytics';
import { apiClient } from 'app';
import { useSimpleAuth } from 'utils/simple-auth-context';

interface ItemRecommendationsProps {
  cartItems: CartItem[];
  menuItems: MenuItem[];
  onAddItem: (item: MenuItem) => void;
  orderMode: 'delivery' | 'collection';
  className?: string;
}

// AI-powered recommendation item with reasoning
interface AIRecommendation {
  item_id: string;
  item_name: string;
  price: number;
  category?: string | null;
  reason: string;  // AI-generated explanation
  confidence: number;
  pairing_type: string;
}

// Helper function to format currency
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(price);
};

export function ItemRecommendations({
  cartItems,
  menuItems,
  onAddItem,
  orderMode,
  className = ''
}: ItemRecommendationsProps) {
  // Get current user for personalization
  const { user } = useSimpleAuth();
  
  // State for AI recommendations
  const [aiRecommendations, setAiRecommendations] = React.useState<AIRecommendation[]>([]);
  const [isLoadingAI, setIsLoadingAI] = React.useState(false);
  const [aiError, setAiError] = React.useState(false);
  const [isPersonalized, setIsPersonalized] = React.useState(false);
  
  // State for delivery config from database
  const [deliveryConfig, setDeliveryConfig] = React.useState<{
    fee: number;
    min_order: number;
    free_over: number;
  } | null>(null);
  
  // Fetch delivery config on mount
  React.useEffect(() => {
    const fetchDeliveryConfig = async () => {
      try {
        const response = await apiClient.get_delivery_config();
        const data = await response.json();
        setDeliveryConfig({
          fee: data.fee || 3.0,
          min_order: data.min_order || 25.0,
          free_over: data.free_over || 30.0
        });
      } catch (error) {
        console.error('Failed to fetch delivery config:', error);
        // Fallback to defaults
        setDeliveryConfig({
          fee: 3.0,
          min_order: 25.0,
          free_over: 30.0
        });
      }
    };
    
    fetchDeliveryConfig();
  }, []);
  
  const cartTotal = useMemo(() => {
    // 🔍 OBSERVATION: Log first item's customizations to identify data type issue
    if (cartItems.length > 0) {
      const firstItem = cartItems[0];
      console.log('🔍 [OBSERVE - ItemRecommendations] First cart item raw data:', {
        itemName: firstItem.name || 'unknown',
        customizationsType: typeof firstItem.customizations,
        customizationsValue: firstItem.customizations,
        isArray: Array.isArray(firstItem.customizations),
        rawJSON: JSON.stringify(firstItem.customizations)
      });
    }
    
    return cartItems.reduce((total, item) => {
      // Defensive: Ensure customizations is always an array (handle object/array mismatch)
      const customizationsArray = Array.isArray(item.customizations) ? item.customizations : [];
      const customizationsTotal = customizationsArray.reduce((sum, c) => sum + c.price, 0);
      return total + (item.price + customizationsTotal) * item.quantity;
    }, 0);
  }, [cartItems]);
  
  // NEW: Fetch AI recommendations when cart changes
  React.useEffect(() => {
    const fetchAIRecommendations = async () => {
      // Only fetch if we have cart items
      if (cartItems.length === 0) {
        setAiRecommendations([]);
        return;
      }
      
      setIsLoadingAI(true);
      setAiError(false);
      
      try {
        // Build request payload
        const requestPayload = {
          cart_items: cartItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            category: item.category || null
          })),
          customer_id: user?.id || null,
          order_mode: orderMode,
          limit: 3
        };
        
        // Call AI recommendations endpoint
        const response = await apiClient.get_cart_suggestions(requestPayload);
        const data = await response.json();
        
        if (data.success && data.recommendations) {
          setAiRecommendations(data.recommendations);
          setIsPersonalized(data.personalized || false);
          
          // Log cache performance
          if (data.cached) {
            console.log('✅ [AI Recommendations] Served from cache');
          } else {
            console.log(`🧠 [AI Recommendations] Generated ${data.recommendations.length} suggestions in ${data.processing_time_ms.toFixed(0)}ms`);
          }
        } else {
          console.warn('⚠️ [AI Recommendations] No recommendations returned');
          setAiRecommendations([]);
        }
      } catch (error) {
        console.error('❌ [AI Recommendations] Failed to fetch:', error);
        setAiError(true);
        setAiRecommendations([]);
      } finally {
        setIsLoadingAI(false);
      }
    };
    
    // Debounce to avoid too many API calls
    const timeoutId = setTimeout(fetchAIRecommendations, 500);
    
    return () => clearTimeout(timeoutId);
  }, [cartItems, orderMode, user?.id]);
  
  // Convert AI recommendations to MenuItem format for display
  const recommendedMenuItems = useMemo(() => {
    return aiRecommendations.map(aiRec => {
      // Find full menu item by ID
      const menuItem = menuItems.find(m => m.id === aiRec.item_id);
      
      if (menuItem) {
        return {
          ...menuItem,
          aiReason: aiRec.reason,  // Attach AI reasoning
          aiConfidence: aiRec.confidence,
          aiPairingType: aiRec.pairing_type
        };
      }
      
      // Fallback if menu item not found
      return {
        id: aiRec.item_id,
        name: aiRec.item_name,
        price: aiRec.price,
        category: aiRec.category || '',
        description: aiRec.reason,
        is_available: true,
        aiReason: aiRec.reason,
        aiConfidence: aiRec.confidence,
        aiPairingType: aiRec.pairing_type
      } as MenuItem & { aiReason?: string; aiConfidence?: number; aiPairingType?: string };
    });
  }, [aiRecommendations, menuItems]);
  
  // Don't show if loading, error, or no recommendations
  if (isLoadingAI) {
    return (
      <div className={`${className} flex items-center justify-center py-4`}>
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: PremiumTheme.colors.silver[400] }} />
        <span className="ml-2 text-sm" style={{ color: PremiumTheme.colors.text.muted }}>
          Finding perfect pairings...
        </span>
      </div>
    );
  }
  
  // Show friendly fallback when AI is unavailable or returns no recommendations
  if (aiError) {
    return (
      <div className={`${className}`}>
        <div 
          className="flex items-center gap-2 p-3 rounded-lg border"
          style={{
            backgroundColor: PremiumTheme.colors.dark[800] + '80',
            borderColor: PremiumTheme.colors.border.light
          }}
        >
          <Sparkles className="h-4 w-4" style={{ color: PremiumTheme.colors.text.muted }} />
          <p 
            className="text-xs"
            style={{ color: PremiumTheme.colors.text.muted }}
          >
            AI recommendations temporarily unavailable. Browse our menu to discover more dishes!
          </p>
        </div>
      </div>
    );
  }
  
  // Don't show anything if no recommendations (but no error)
  if (recommendedMenuItems.length === 0) return null;
  
  return (
    <div className={`${className}`}>
      <div 
        className="flex items-center gap-2 mb-3 pb-2 border-b"
        style={{ borderColor: PremiumTheme.colors.border.medium }}
      >
        <Wand2 className="h-4 w-4" style={{ color: PremiumTheme.colors.gold[500] }} />
        <h3 
          className="text-sm font-semibold"
          style={{ color: PremiumTheme.colors.text.primary }}
        >
          {isPersonalized ? 'Recommended for you' : 'You might also like'}
        </h3>
        <Badge 
          variant="secondary"
          className="ml-auto text-xs"
          style={{
            backgroundColor: PremiumTheme.colors.silver[500] + '20',
            color: PremiumTheme.colors.silver[400],
            border: `1px solid ${PremiumTheme.colors.silver[500]}40`
          }}
        >
          <Sparkles className="h-3 w-3 mr-1" />
          AI powered
        </Badge>
      </div>
      
      <AnimatePresence mode="popLayout">
        <div className="space-y-2">
          {recommendedMenuItems.map((item, index) => {
            const extendedItem = item as MenuItem & { aiReason?: string };
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start justify-between p-3 rounded-lg border transition-all hover:border-opacity-80"
                style={{
                  backgroundColor: PremiumTheme.colors.dark[800],
                  borderColor: PremiumTheme.colors.border.light
                }}
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p 
                    className="text-sm font-medium"
                    style={{ color: PremiumTheme.colors.text.primary }}
                  >
                    {item.name}
                  </p>
                  
                  {/* AI-generated reasoning */}
                  {extendedItem.aiReason && (
                    <p 
                      className="text-xs mt-1 leading-relaxed"
                      style={{ color: PremiumTheme.colors.silver[400] }}
                    >
                      💡 {extendedItem.aiReason}
                    </p>
                  )}
                  
                  <p 
                    className="text-xs font-semibold mt-1.5"
                    style={{ color: PremiumTheme.colors.text.muted }}
                  >
                    {formatPrice(item.price || 0)}
                  </p>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => {
                    onAddItem(item);
                    // Track as recommendation source
                    trackItemAdded(
                      item.id,
                      item.name,
                      item.price || 0,
                      orderMode,
                      'recommendation'
                    );
                  }}
                  className="shrink-0 h-8 px-3 mt-0.5"
                  style={{
                    background: `linear-gradient(135deg, ${PremiumTheme.colors.silver[500]} 0%, ${PremiumTheme.colors.silver[600]} 100%)`,
                    color: PremiumTheme.colors.dark[900],
                    border: 'none'
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>
    </div>
  );
}
