import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, TrendingUp, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PremiumTheme } from '../utils/premiumTheme';
import { MenuItem, CartItem } from 'types';
import { trackItemAdded } from '../utils/cartAnalytics';

interface ItemRecommendationsProps {
  cartItems: CartItem[];
  menuItems: MenuItem[];
  onAddItem: (item: MenuItem) => void;
  orderMode: 'delivery' | 'collection';
  className?: string;
}

// Helper function to format currency
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(price);
};

// Deterministic pairing rules for Indian cuisine
const CATEGORY_PAIRINGS: Record<string, string[]> = {
  // Main dishes pair with rice, naan, sides
  'curry': ['rice', 'naan', 'side', 'accompaniment'],
  'biryani': ['raita', 'side', 'starter'],
  'tandoori': ['naan', 'rice', 'salad'],
  // Starters pair with mains
  'starter': ['curry', 'main', 'biryani'],
  'appetizer': ['curry', 'main', 'biryani'],
  // Rice pairs with curry
  'rice': ['curry', 'main'],
  // Bread pairs with curry
  'naan': ['curry', 'main'],
  'bread': ['curry', 'main'],
};

// Category keywords for matching
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'curry': ['curry', 'masala', 'korma', 'madras', 'vindaloo', 'balti', 'jalfrezi', 'dhansak', 'pathia', 'rogan', 'dopiaza'],
  'rice': ['rice', 'pilau', 'biryani', 'pulao'],
  'naan': ['naan', 'roti', 'chapati', 'paratha', 'puri', 'bread'],
  'starter': ['starter', 'samosa', 'pakora', 'bhaji', 'tikka', 'kebab', 'appetizer'],
  'side': ['side', 'raita', 'chutney', 'pickle', 'salad', 'accompaniment'],
  'tandoori': ['tandoori', 'tikka', 'kebab'],
  'biryani': ['biryani'],
};

function categorizeItem(item: MenuItem): string {
  const nameLower = (item.name || '').toLowerCase();
  const categoryLower = (item.category_name || item.categoryName || '').toLowerCase();
  const combined = `${nameLower} ${categoryLower}`;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => combined.includes(keyword))) {
      return category;
    }
  }
  return 'other';
}

function getRecommendationReason(cartCategory: string, recCategory: string): string {
  const reasons: Record<string, Record<string, string>> = {
    'curry': {
      'rice': 'Perfect with your curry',
      'naan': 'Great for scooping',
      'side': 'Complements your meal',
    },
    'biryani': {
      'raita': 'Cool & refreshing pairing',
      'starter': 'Start your feast right',
    },
    'starter': {
      'curry': 'Complete your meal',
      'biryani': 'A hearty main course',
    },
    'rice': {
      'curry': 'Add a flavorful curry',
    },
    'naan': {
      'curry': 'Add a delicious curry',
    },
  };

  return reasons[cartCategory]?.[recCategory] || 'Recommended for you';
}

export function ItemRecommendations({
  cartItems,
  menuItems,
  onAddItem,
  orderMode,
  className = ''
}: ItemRecommendationsProps) {
  // Deterministic recommendations based on cart contents
  const recommendations = useMemo(() => {
    if (cartItems.length === 0 || !menuItems || menuItems.length === 0) {
      return [];
    }

    // Categorize cart items
    const cartCategories = new Set<string>();
    const cartItemIds = new Set(cartItems.map(item => item.id));

    cartItems.forEach(item => {
      const category = categorizeItem(item as unknown as MenuItem);
      cartCategories.add(category);
    });

    // Find recommended categories based on what's in cart
    const recommendedCategories = new Set<string>();
    cartCategories.forEach(cartCat => {
      const pairings = CATEGORY_PAIRINGS[cartCat] || [];
      pairings.forEach(p => recommendedCategories.add(p));
    });

    // Don't recommend categories already in cart
    cartCategories.forEach(c => recommendedCategories.delete(c));

    // Score and filter menu items
    const scoredItems: Array<{
      item: MenuItem;
      score: number;
      reason: string;
      recCategory: string;
    }> = [];

    menuItems.forEach(menuItem => {
      // Skip items already in cart
      if (cartItemIds.has(menuItem.id)) return;
      // Skip unavailable items
      if (!menuItem.is_available) return;

      const itemCategory = categorizeItem(menuItem);

      // Check if this category is recommended
      let isRecommended = false;
      let matchedCartCategory = '';

      for (const cartCat of Array.from(cartCategories)) {
        const pairings = CATEGORY_PAIRINGS[cartCat] || [];
        if (pairings.some(p => itemCategory.includes(p) || p.includes(itemCategory))) {
          isRecommended = true;
          matchedCartCategory = cartCat;
          break;
        }
      }

      if (isRecommended) {
        // Score based on various factors
        let score = 50; // Base score for being a pairing match

        // Boost popular items (if we had data, we'd use it)
        // For now, boost items with images (usually featured items)
        if (menuItem.image_url) score += 10;

        // Boost items in similar price range
        const avgCartPrice = cartItems.reduce((sum, i) => sum + i.price, 0) / cartItems.length;
        if (Math.abs((menuItem.price || 0) - avgCartPrice) < 5) {
          score += 5;
        }

        const reason = getRecommendationReason(matchedCartCategory, itemCategory);

        scoredItems.push({
          item: menuItem,
          score,
          reason,
          recCategory: itemCategory
        });
      }
    });

    // Sort by score and return top 3
    scoredItems.sort((a, b) => b.score - a.score);
    return scoredItems.slice(0, 3);
  }, [cartItems, menuItems]);

  // Don't show if no recommendations
  if (recommendations.length === 0) return null;

  return (
    <div className={`${className}`}>
      <div
        className="flex items-center gap-2 mb-3 pb-2 border-b"
        style={{ borderColor: PremiumTheme.colors.border.medium }}
      >
        <TrendingUp className="h-4 w-4" style={{ color: PremiumTheme.colors.gold[500] }} />
        <h3
          className="text-sm font-semibold"
          style={{ color: PremiumTheme.colors.text.primary }}
        >
          Complete your order
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
          Smart pairing
        </Badge>
      </div>

      <AnimatePresence mode="popLayout">
        <div className="space-y-2">
          {recommendations.map((rec, index) => {
            return (
              <motion.div
                key={rec.item.id}
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
                    {rec.item.name}
                  </p>

                  {/* Deterministic reasoning */}
                  <p
                    className="text-xs mt-1 leading-relaxed"
                    style={{ color: PremiumTheme.colors.silver[400] }}
                  >
                    {rec.reason}
                  </p>

                  <p
                    className="text-xs font-semibold mt-1.5"
                    style={{ color: PremiumTheme.colors.text.muted }}
                  >
                    {formatPrice(rec.item.price || 0)}
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    onAddItem(rec.item);
                    trackItemAdded(
                      rec.item.id,
                      rec.item.name,
                      rec.item.price || 0,
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
