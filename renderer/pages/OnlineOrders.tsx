import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams, useSearchParams as useSearchParamsHook, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { ShoppingCart, Filter, Grid, List, ArrowUp, Mic, Phone, MessageCircle, Plus, Minus, Search, Volume2, VolumeX, Shield, Users, MicOff, Home, Grid3X3, ChevronUp, X } from "lucide-react";
import { shallow } from 'zustand/shallow';
import { useCartStore } from 'utils/cartStore';
import { useSimpleAuth } from 'utils/simple-auth-context';
import { useVoiceAgentStore } from 'utils/voiceAgentStore';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MenuItem, Category, ItemVariant } from 'utils/menuTypes';
import { MenuGrid } from 'components/MenuGrid';
import { CompactMenuList } from 'components/CompactMenuList';
import { AuthModal } from 'components/AuthModal';
import { Badge } from '@/components/ui/badge';
import { UniversalHeader } from 'components/UniversalHeader';
import { CartSidebar } from 'components/CartSidebar';
import { NavigationConfig } from 'utils/navigationConfig';
import { PremiumTheme } from 'utils/premiumTheme';
import { CustomerVariantSelector } from 'components/CustomerVariantSelector';
import { CheckoutView } from 'components/CheckoutView';
import { Footer } from 'components/Footer';
import { usePageContext } from 'utils/pageContext';
import { FIXED_SECTIONS, filterItemsBySection, SECTION_UUID_MAP, findRootSection } from 'utils/sectionMapping';
import { FloatingCategoryDropdown } from 'components/FloatingCategoryDropdown';
import { CartRecoveryDialog } from 'components/CartRecoveryDialog';
import { useCartKeyboardShortcuts } from 'utils/keyboardShortcuts';
import { trackCartRecovered } from 'utils/cartAnalytics';
import { ItemRecommendations } from 'components/ItemRecommendations';
import { MenuSkeleton } from 'components/MenuSkeleton';
import { CategoryNavigationSkeleton } from 'components/CategoryNavigationSkeleton';
import { searchMenuItems, getSearchSuggestions, SearchResult } from 'utils/menuSearch';
import { trackSearch, trackSearchConversion } from 'utils/searchAnalytics';
import { Input } from '@/components/ui/input';
import { KeyboardShortcutsHelp } from 'components/KeyboardShortcutsHelp';
import { ErrorBoundary } from 'components/ErrorBoundary';
import { OnlineOrdersErrorFallback } from 'components/OnlineOrdersErrorFallback';
import { logError, createCartErrorContext } from 'utils/errorLogger';

// Add view mode type
type ViewMode = 'gallery' | 'compact';

export default function OnlineOrders() {
  // 🎯 PERFORMANCE: Mark page start immediately
  if (typeof performance !== 'undefined') {
    const marks = performance.getEntriesByName('page-start');
    if (marks.length === 0) {
      performance.mark('page-start');
      console.log('🏁 [Performance] Page start marked');
    }
  }
  
  const navigate = useNavigate();
  const location = useLocation();
  const pageContext = usePageContext();
  const [searchParams] = useSearchParams();
  const setSearchParams = useSearchParamsHook()[1];
  
  // **PHASE 1 FIX: Single data source eliminates race conditions**
  const { user, isAuthenticated, signOut, customerProfile } = useSimpleAuth();
  const { 
    items: cartItems, 
    totalItems: cartCount, 
    totalAmount: cartTotal, 
    addItem, 
    updateItemQuantity, 
    removeItem, 
    clearCart, 
    getCartAge, 
    isCartStale,
    isCartOpen,
    closeCart,
    openCart,
    currentOrderMode, // ✅ NEW: Use global order mode from cart store
    isChatCartOpen // ✅ NEW (MYA-1564): Track chat cart state for mutual exclusivity
  } = useCartStore();
  const { hasSelectedAgent, getSelectedAgentName, getSelectedAgentPassportImage, selectedAgent, masterSwitchEnabled } = useVoiceAgentStore();
  
  // **NEW: Cart recovery state**
  const [showCartRecovery, setShowCartRecovery] = useState(false);
  const [hasCheckedRecovery, setHasCheckedRecovery] = useState(false);
  
  // **NEW: Get cart metadata from store**
  const cartLastSavedAt = useCartStore(state => state.lastSavedAt);
  
  // **NEW: Error state for menu initialization**
  const [error, setError] = useState<string | null>(null);
  
  // **PERFORMANCE FIX (MYA-1277): Use selective subscriptions instead of full store destructuring**
  const menuItems = useRealtimeMenuStore(state => state.menuItems, shallow);
  const categories = useRealtimeMenuStore(state => state.categories, shallow);
  const itemVariants = useRealtimeMenuStore(state => state.itemVariants, shallow);
  const proteinTypes = useRealtimeMenuStore(state => state.proteinTypes, shallow);
  const isMenuLoading = useRealtimeMenuStore(state => state.isLoading);
  const menuError = useRealtimeMenuStore(state => state.error);
  const isConnected = useRealtimeMenuStore(state => state.isConnected);
  const initialize = useRealtimeMenuStore(state => state.initialize);

  // ✅ PERFORMANCE: Track when data is loaded
  useEffect(() => {
    if (!isMenuLoading && menuItems.length > 0 && typeof performance !== 'undefined') {
      performance.mark('data-loaded');
      
      // Measure from page start to data loaded
      const startMark = performance.getEntriesByName('page-start')[0];
      if (startMark) {
        const dataLoadTime = performance.now() - startMark.startTime;
        console.log(`⚡ [Performance] Data loaded in ${dataLoadTime.toFixed(2)}ms`);
      }
    }
  }, [isMenuLoading, menuItems]);

  // ✅ PERFORMANCE: Track first render
  useEffect(() => {
    if (!isMenuLoading && menuItems.length > 0 && typeof performance !== 'undefined') {
      performance.mark('first-render');
      
      // Count DOM nodes
      const domNodes = document.querySelectorAll('*').length;
      console.log(`📦 [Performance] DOM nodes: ${domNodes}`);
      
      // Measure from page start to first render
      const startMark = performance.getEntriesByName('page-start')[0];
      if (startMark) {
        const renderTime = performance.now() - startMark.startTime;
        console.log(`⚡ [Performance] First render in ${renderTime.toFixed(2)}ms`);
      }
    }
  }, [isMenuLoading, menuItems]);

  // **NEW: Initialize menu store on component mount**
  useEffect(() => {
    // Only initialize menu store if this page requires it
    if (pageContext.requiresMenuStore) {
      initialize()
        .then(() => {
          setError(null); // Clear any previous errors
          
          // 🎯 PERFORMANCE: Mark data loaded
          try {
            performance.mark('data-loaded');
            // Only measure if page-start mark exists
            const marks = performance.getEntriesByName('page-start');
            if (marks.length > 0) {
              performance.measure('data-load', 'page-start', 'data-loaded');
              const measure = performance.getEntriesByName('data-load')[0];
              console.log(`⚡ [Performance] Data loaded in ${measure.duration.toFixed(2)}ms`);
            }
          } catch (e) {
            console.warn('⚠️ Performance measurement failed:', e);
          }
        })
        .catch((error) => {
          console.error('❌ Failed to initialize menu store:', error);
          setError(error.message || 'Failed to load menu');
        });
    }
  }, [initialize, pageContext.requiresMenuStore]);
  
  // **NEW: Cart recovery logic - check for saved cart on mount**
  useEffect(() => {
    // Only check once on mount
    if (hasCheckedRecovery) return;
    
    // Wait a bit for cart store to hydrate from localStorage
    const checkTimer = setTimeout(() => {
      // Check if there's a saved cart with items
      if (cartItems.length > 0 && !hasCheckedRecovery) {
        console.log('🛒 Found saved cart with', cartItems.length, 'items');
        setShowCartRecovery(true);
        setHasCheckedRecovery(true);
      } else {
        setHasCheckedRecovery(true);
      }
    }, 500); // Small delay for hydration
    
    return () => clearTimeout(checkTimer);
  }, [cartItems.length, hasCheckedRecovery]);
  
  // **NEW: Cart recovery handlers**
  const handleRestoreCart = useCallback(() => {
    console.log('✅ User chose to restore cart');
    
    // Track analytics
    trackCartRecovered(cartItems.length, cartTotal);
    
    // Show toast
    toast.success(`Cart restored with ${cartItems.length} item${cartItems.length !== 1 ? 's' : ''}`, {
      duration: 3000,
    });
    
    // Close dialog and open cart sidebar using global state
    setShowCartRecovery(false);
    openCart();
  }, [cartItems.length, cartTotal, openCart]);
  
  const handleDiscardCart = useCallback(() => {
    console.log('🗑️ User chose to discard saved cart');
    
    // Clear cart
    clearCart();
    
    // Show toast
    toast.info('Started with a fresh cart', {
      duration: 2000,
    });
    
    // Close dialog
    setShowCartRecovery(false);
  }, [clearCart]);

  // **NEW: Retry handler for menu loading failures**
  const handleRetry = useCallback(() => {
    console.log('🔄 User requested menu reload');
    setError(null);
    initialize()
      .then(() => {
        console.log('✅ Menu reloaded successfully');
        toast.success('Menu loaded successfully', { duration: 2000 });
      })
      .catch((err) => {
        console.error('❌ Retry failed:', err);
        setError(err.message || 'Failed to load menu');
        toast.error('Failed to reload menu. Please try again.', { duration: 3000 });
      });
  }, [initialize]);

  // **UPDATED: View mode state with URL and localStorage persistence (no window.location/history)**
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const urlView = searchParams.get('view') as ViewMode | null;
    if (urlView === 'gallery' || urlView === 'compact') return urlView;
    const savedView = localStorage.getItem('onlineOrders-viewMode') as ViewMode;
    return (savedView === 'gallery' || savedView === 'compact') ? savedView : 'gallery';
  });

  // Keep view mode in sync when URL changes (e.g., back/forward)
  useEffect(() => {
    const urlView = searchParams.get('view') as ViewMode | null;
    if (urlView === 'gallery' || urlView === 'compact') {
      setViewMode(prev => prev !== urlView ? urlView : prev);
      localStorage.setItem('onlineOrders-viewMode', urlView);
    }
  }, [searchParams]);
  
  // **NEW: Active category for scrollspy**
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // **NEW: Hover state for category dropdown**
  const [hoveredSection, setHoveredSection] = useState<{
    sectionId: string;
    buttonRect: DOMRect;
  } | null>(null);
  const [hoverTimeoutId, setHoverTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  // **NEW: Refs for scroll functionality**
  const containerRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const headerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null); // NEW: Search input ref
  
  // **NEW: Refs for checkout focus management**
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const checkoutDialogRef = useRef<HTMLDivElement>(null);

  // **NEW: Debounce timer for IntersectionObserver updates**
  const scrollDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isScrolling = useRef(false);
  
  // **STICKY POSITIONING: Height measurement states**
  const [headerHeight, setHeaderHeight] = useState(80); // Start with reasonable default
  const [tabsHeight, setTabsHeight] = useState(69); // We know tabs are 69px from logs
  
  // **NEW: Mobile detection for responsive UI**
  const [isMobile, setIsMobile] = useState(false);

  // **NEW: Search state**
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // **NEW: Keyboard shortcuts help modal state**
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // **NEW: Debounced search handler**
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    
    // Clear existing timer
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    
    // Debounce search execution (300ms)
    searchDebounceTimer.current = setTimeout(() => {
      console.log(`🔍 Searching for: "${query}"`);
      
      if (!query.trim()) {
        // Empty query = show all items
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      
      // Execute search
      const results = searchMenuItems(menuItems, {
        query,
        categories,
        activeCategory: activeCategory === 'all' ? undefined : activeCategory,
        minScore: 30
      });
      
      setSearchResults(results);
      setIsSearching(false);
      
      // Track search analytics
      trackSearch(query, results.length, {
        activeCategory: activeCategory === 'all' ? undefined : activeCategory,
        userId: user?.id
      });
      
      console.log(`✅ Search complete: ${results.length} results for "${query}"`);
    }, 300);
  }, [menuItems, categories, activeCategory, user]);
  
  // **NEW: Clear search handler**
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // **NEW: Cmd/Ctrl+K keyboard shortcut for search focus**
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields (except for specific cases)
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      // Search shortcuts: Cmd/Ctrl+F to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        toast.info('Search focused - Type to find dishes', { duration: 1500 });
        return;
      }
      
      // Quick search with / (when not typing)
      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
        toast.info('Search focused - Type to find dishes', { duration: 1500 });
        return;
      }
      
      // Escape to clear search when focused on search input
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        handleClearSearch();
        toast.info('Search cleared', { duration: 1500 });
        return;
      }
      
      // Don't process navigation shortcuts when typing
      if (isTyping) return;
      
      // Section navigation shortcuts: 1-6 keys
      if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        e.preventDefault();
        const sectionIndex = parseInt(e.key, 10) - 1;
        if (sectionIndex < FIXED_SECTIONS.length) {
          const section = FIXED_SECTIONS[sectionIndex];
          const sectionKey = `section-${section.id}`;
          
          // Update active category
          setActiveCategory(sectionKey);
          
          // Update URL
          const newParams = new URLSearchParams(searchParams);
          newParams.set('category', sectionKey);
          setSearchParams(newParams);
          
          // Scroll to section
          const element = categoryRefs.current[sectionKey];
          if (element) {
            isScrolling.current = true;
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => {
              isScrolling.current = false;
            }, 1000);
          }
          
          toast.info(`Jumped to ${section.displayName}`, { duration: 1500 });
        }
        return;
      }
      
      // Show keyboard shortcuts help: ?
      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        setShowKeyboardHelp(true);
        return;
      }
      
      // Close help modal with Escape (when help is open)
      if (e.key === 'Escape' && showKeyboardHelp) {
        setShowKeyboardHelp(false);
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClearSearch, searchParams, setSearchParams, setActiveCategory, showKeyboardHelp]);

  // **NEW: Wire up cart keyboard shortcuts**
  useCartKeyboardShortcuts({
    onToggleCart: () => {
      if (isCartOpen) {
        closeCart();
        toast.info('Cart closed', { duration: 1500 });
      } else {
        openCart();
        toast.info('Cart opened - Cmd+Enter to checkout', { duration: 2000 });
      }
    },
    onCheckout: () => {
      if (cartItems.length > 0) {
        // Check if user is authenticated
        if (!isAuthenticated) {
          // Show auth modal for guest checkout
          toast.info('Please sign in to checkout', { duration: 2000 });
        } else {
          // Close cart and open checkout view
          closeCart();
          const newParams = new URLSearchParams(searchParams);
          newParams.set('checkout', 'true');
          setSearchParams(newParams);
          toast.success('Opening checkout...', { duration: 1500 });
        }
      } else {
        toast.error('Your cart is empty', { duration: 2000 });
      }
    },
    onCloseCart: () => {
      if (isCartOpen) {
        closeCart();
        toast.info('Cart closed', { duration: 1500 });
      }
    },
    isCartOpen,
    canCheckout: cartItems.length > 0
  });

  // **PHASE 5: Enhanced state for checkout modal**
  const [checkoutView, setCheckoutView] = useState<'menu' | 'checkout'>('menu');
  const [voiceOrderSource, setVoiceOrderSource] = useState<string | null>(null);

  // ✅ REMOVED: Local orderMode state - now using cartStore.currentOrderMode globally
  // const [orderMode, setOrderMode] = useState<'delivery' | 'collection'>('collection');

  // **Sync checkout overlay with URL param `checkout`**
  useEffect(() => {
    const checkoutParam = searchParams.get('checkout');
    const shouldCheckout = checkoutParam === '1' || checkoutParam === 'true';
    setCheckoutView(shouldCheckout ? 'checkout' : 'menu');
  }, [searchParams]);
  
  // ✅ NEW: Focus management for checkout overlay
  useEffect(() => {
    if (checkoutView === 'checkout') {
      // Save currently focused element
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      
      // Focus the dialog
      setTimeout(() => {
        checkoutDialogRef.current?.focus();
      }, 0);
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore focus and scroll
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [checkoutView]);
  
  // Voice agent integration states
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showVoiceInterface, setShowVoiceInterface] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [authContext, setAuthContext] = useState<'checkout' | 'favorites' | 'voice-ordering' | 'account'>('account');
  const [pendingCheckout, setPendingCheckout] = useState(false); // NEW: Track if checkout is pending after auth

  // Modal and dialog states
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedInitialVariant, setSelectedInitialVariant] = useState<ItemVariant | null>(null); // NEW: Track pre-selected variant
  const [isVariantSelectorOpen, setIsVariantSelectorOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // **UPDATED: Handle view mode changes with persistence (use searchParams)**
  const handleViewModeChange = useCallback((newMode: ViewMode) => {
    setViewMode(newMode);
    
    // Update URL (preserve other params)
    const newParams = new URLSearchParams(searchParams);
    newParams.set('view', newMode);
    setSearchParams(newParams);
    
    // Update localStorage
    localStorage.setItem('onlineOrders-viewMode', newMode);
  }, [searchParams, setSearchParams]);

  // **NEW: Memoized category filtering for dropdown**
  const hoveredSectionCategories = useMemo(() => {
    if (!hoveredSection) return [];

    // ✅ Safety check - ensure categories is an array
    if (!Array.isArray(categories)) {
      console.warn('⚠️ categories is not an array in hoveredSectionCategories:', categories);
      return [];
    }

    // ✅ UUID-Based Filtering (MYA-1379): Use real section UUIDs from database
    const sectionUUID = SECTION_UUID_MAP[hoveredSection.sectionId as keyof typeof SECTION_UUID_MAP];
    
    if (!sectionUUID) {
      console.warn(`⚠️ No UUID found for section: ${hoveredSection.sectionId}`);
      return [];
    }
    
    const childCategories = categories
      .filter(cat => cat.parent_category_id === sectionUUID)
      .sort((a, b) => {
        const ao = (a.display_order ?? 9999);
        const bo = (b.display_order ?? 9999);
        if (ao !== bo) return ao - bo;
        return (a.name || '').localeCompare(b.name || '');
      });

    return childCategories;
  }, [hoveredSection, categories]);
  
  // **NEW: Handle section hover**
  const handleSectionHover = useCallback((sectionId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    // Clear any pending timeout
    if (hoverTimeoutId) {
      clearTimeout(hoverTimeoutId);
      setHoverTimeoutId(null);
    }
    
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setHoveredSection({ sectionId, buttonRect });
  }, [hoverTimeoutId]);
  
  // **NEW: Handle section hover leave**
  const handleSectionHoverLeave = useCallback(() => {
    // Delay before hiding to allow mouse movement to dropdown
    const timeoutId = setTimeout(() => {
      setHoveredSection(null);
    }, 150);
    setHoverTimeoutId(timeoutId);
  }, []);
  
  // **NEW: Keep dropdown open when hovering over it**
  const handleDropdownMouseEnter = useCallback(() => {
    if (hoverTimeoutId) {
      clearTimeout(hoverTimeoutId);
      setHoverTimeoutId(null);
    }
  }, [hoverTimeoutId]);
  
  // **NEW: Handle category URL changes**
  useEffect(() => {
    console.log(`[${new Date().toISOString()}] 🔗 URL useEffect: Checking URL params, activeCategory='${activeCategory}'`);
    
    const urlCategory = searchParams.get('category');
    console.log(`[${new Date().toISOString()}] 🔗 URL useEffect: urlCategory='${urlCategory}', activeCategory='${activeCategory}'`);
    
    if (urlCategory && urlCategory !== activeCategory) {
      console.log(`[${new Date().toISOString()}] ⚡ URL useEffect: UPDATING activeCategory to '${urlCategory}'`);
      setActiveCategory(urlCategory);
      // Scroll to category if element exists
      isScrolling.current = true;
      setTimeout(() => {
        const element = categoryRefs.current[urlCategory];
        if (element) {
          console.log(`[${new Date().toISOString()}] 📜 URL useEffect: Scrolling to '${urlCategory}'`);
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // Clear scrolling flag after scroll completes
        setTimeout(() => {
          isScrolling.current = false;
          console.log(`[${new Date().toISOString()}] ✅ URL useEffect: Scroll complete, re-enabling IntersectionObserver`);
        }, 1000);
      }, 100);
    } else if (!urlCategory && activeCategory !== 'all') {
      // No URL category param means we should show 'all'
      console.log(`[${new Date().toISOString()}] ⚡ URL useEffect: No category param, setting to 'all'`);
      setActiveCategory('all');
    }
  }, [searchParams]); // ✅ Listen to searchParams (URL changes) NOT activeCategory (state changes)
  
  // **NEW: Intersection Observer for smart tab navigation**
  useEffect(() => {
    // Collect elements to observe
    const elements = Object.values(categoryRefs.current).filter((el): el is HTMLDivElement => !!el);
    if (elements.length === 0) {
      return;
    }

    // Create intersection observer with debounced callback
    const observer = new IntersectionObserver(
      (entries) => {
        // Clear existing debounce timer
        if (scrollDebounceTimer.current) {
          clearTimeout(scrollDebounceTimer.current);
        }
        
        // Debounce the update to avoid race conditions during scroll
        scrollDebounceTimer.current = setTimeout(() => {
          // Find the entry with the highest intersection ratio that's intersecting
          let mostVisible: Element | null = null;
          let highestRatio = 0;
          
          entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > highestRatio) {
              highestRatio = entry.intersectionRatio;
              mostVisible = entry.target;
            }
          });
          
          // Update active category based on most visible section
          if (mostVisible && !isScrolling.current) {
            const categoryId = mostVisible.getAttribute('data-category-id') || 'all';
            setActiveCategory(categoryId);
          }
          
          isScrolling.current = false;
        }, 150); // 150ms debounce
      },
      {
        // Account for sticky header and tabs
        rootMargin: `-${headerHeight + tabsHeight}px 0px -50% 0px`,
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
      }
    );
    
    // Observe all category sections
    elements.forEach(element => {
      observer.observe(element);
    });
    
    return () => {
      if (scrollDebounceTimer.current) {
        clearTimeout(scrollDebounceTimer.current);
      }
      observer.disconnect();
    };
  }, [headerHeight, tabsHeight, menuItems, categories, searchParams]);
  
  // **UPDATED: Handle category tab click**
  const handleCategoryTabClick = useCallback((categoryId: string) => {
    console.log(`[${new Date().toISOString()}] 🖱️ handleCategoryTabClick: categoryId='${categoryId}'`);
    
    // Set scrolling flag to prevent observer interference
    isScrolling.current = true;
    
    console.log(`[${new Date().toISOString()}] ⚡ handleCategoryTabClick: setActiveCategory('${categoryId}')`);  
    setActiveCategory(categoryId);
    
    // ✅ Update URL with push state to preserve history
    const newParams = new URLSearchParams(searchParams);
    if (categoryId === 'all') {
      console.log(`[${new Date().toISOString()}] 🔗 handleCategoryTabClick: Clearing URL params`);
      newParams.delete('category');
    } else {
      console.log(`[${new Date().toISOString()}] 🔗 handleCategoryTabClick: Setting URL param category='${categoryId}'`);
      newParams.set('category', categoryId);
    }
    setSearchParams(newParams);
    
    // Scroll to section
    const element = categoryRefs.current[categoryId];
    if (element) {
      const offset = headerHeight + tabsHeight;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY - offset;
      console.log(`[${new Date().toISOString()}] 📜 handleCategoryTabClick: Scrolling to position=${elementPosition} (offset=${offset})`);
      window.scrollTo({ top: elementPosition, behavior: 'smooth' });
    } else if (categoryId === 'all') {
      console.log(`[${new Date().toISOString()}] 📜 handleCategoryTabClick: Scrolling to top`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Clear scrolling flag after scroll animation completes
    setTimeout(() => {
      console.log(`[${new Date().toISOString()}] ✅ handleCategoryTabClick: Clearing isScrolling flag`);
      isScrolling.current = false;
    }, 1000);
  }, [headerHeight, tabsHeight, setSearchParams, searchParams]);
  
  // **UPDATED: Handle category click from dropdown**
  const handleDropdownCategoryClick = (categoryId: string) => {
    if (DEBUG_LOGGING) console.log(`[${new Date().toISOString()}] 🖱️ handleDropdownCategoryClick: categoryId='${categoryId}'`);
    
    // Set scrolling flag to prevent observer interference
    isScrolling.current = true;
    
    // Close dropdown after selection
    setHoveredSection(null);

    // Highlight immediately
    if (DEBUG_LOGGING) console.log(`[${new Date().toISOString()}] ⚡ handleDropdownCategoryClick: setActiveCategory('${categoryId}`);
    setActiveCategory(categoryId);

    // ✅ URL sync: push state (so back/forward restores selection)
    const newParams = new URLSearchParams(searchParams);
    if (categoryId === 'all') {
      if (DEBUG_LOGGING) console.log(`[${new Date().toISOString()}] 🔗 handleDropdownCategoryClick: Clearing URL params`);
      newParams.delete('category');
    } else {
      if (DEBUG_LOGGING) console.log(`[${new Date().toISOString()}] 🔗 handleDropdownCategoryClick: Setting URL param category='${categoryId}'`);
      newParams.set('category', categoryId);
    }
    setSearchParams(newParams); // push new history entry

    // ✅ FIX: Delay scroll calculation to wait for React re-render with filtered data
    setTimeout(() => {
      // Smooth scroll using measured offsets (no hardcoded values)
      const element = categoryRefs.current[categoryId];
      if (element) {
        const offset = headerHeight + tabsHeight;
        const elementPosition = element.getBoundingClientRect().top + window.scrollY - offset;
        if (DEBUG_LOGGING) console.log(`[${new Date().toISOString()}] 📜 handleDropdownCategoryClick: Scrolling to position=${elementPosition} (offset=${offset})`);
        window.scrollTo({ top: elementPosition, behavior: 'smooth' });
      }
      
      // Clear scrolling flag after scroll completes
      setTimeout(() => {
        if (DEBUG_LOGGING) console.log(`[${new Date().toISOString()}] ✅ handleDropdownCategoryClick: Clearing isScrolling flag`);
        isScrolling.current = false;
      }, 1000);
    }, 50); // 50ms delay allows React to re-render with filtered items
  };
  
  // **NEW: Back to top functionality**
  const handleBackToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveCategory('all');
  }, []);

  // Cart handlers
  const handleUpdateCartQuantity = useCallback((itemId: string, quantity: number) => {
    updateItemQuantity(itemId, quantity);
  }, [updateItemQuantity]);
  
  const handleRemoveCartItem = useCallback((itemId: string) => {
    removeItem(itemId);
  }, [removeItem]);
  
  const handleClearCart = useCallback(() => {
    clearCart();
  }, [clearCart]);
  
  // Checkout handler - UPDATED: No auth gate, support guest checkout
  const handleCheckout = () => {
    // ✅ Open checkout directly - no auth required (guest checkout enabled)
    setCheckoutView('checkout');
    const newParams = new URLSearchParams(searchParams);
    newParams.set('checkout', '1');
    setSearchParams(newParams);
  };
  
  // NEW: Handle sign-in from cart
  const handleSignInFromCart = () => {
    setAuthModalMode('login');
    setAuthContext('checkout');
    setPendingCheckout(true); // Mark that we want to resume checkout after auth
    setShowAuthModal(true);
  };
  
  // NEW: Listen for auth success to resume checkout
  useEffect(() => {
    if (user && pendingCheckout) {
      // User just authenticated and checkout was pending
      setPendingCheckout(false);
      handleCheckout(); // Auto-open checkout
      toast.success('Signed in successfully! Continuing to checkout...');
    }
  }, [user, pendingCheckout]);

  // ✅ NEW: Checkout overlay handlers
  const handleCheckoutClose = () => {
    setCheckoutView('menu');
    closeCart();
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('checkout');
    setSearchParams(newParams);
  };
  
  const handleCheckoutBack = () => {
    setCheckoutView('menu');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('checkout');
    setSearchParams(newParams);
  };
  
  // ✅ NEW: Voice checkout handler - transfer voice cart to main cart and open checkout
  const handleVoiceCheckout = async (voiceCartItems: any[]) => {
    try {
      console.log('🛒 Processing voice checkout with items:', voiceCartItems);
      
      // Transfer each voice cart item to main cart
      voiceCartItems.forEach(voiceItem => {
        // Find the corresponding menu item from our data
        const menuItem = menuItems.find(item => 
          item.id === voiceItem.menu_item_id || 
          item.name.toLowerCase() === voiceItem.menu_item_name?.toLowerCase()
        );
        
        if (menuItem) {
          // Create variant object for cart compatibility
          const variant = {
            id: voiceItem.variant_id || `single-${menuItem.id}`,
            name: voiceItem.variant_name || 'Standard',
            price: (voiceItem.unit_price || voiceItem.price || menuItem.price).toString(),
            price_delivery: (voiceItem.unit_price || voiceItem.price || menuItem.price).toString(),
            price_takeaway: (voiceItem.unit_price || voiceItem.price || menuItem.price).toString()
          };
          
          // Add to main cart using existing cart system
          addItem(menuItem, variant, voiceItem.quantity, voiceItem.special_instructions || 'Added via voice');
          
          console.log(`✅ Added ${menuItem.name} x${voiceItem.quantity} to cart via voice`);
        } else {
          console.warn(`⚠️ Menu item not found for voice item:`, voiceItem);
        }
      });
      
      // Close voice modal
      setShowVoiceModal(false);
      
      // Open checkout overlay directly
      setCheckoutView('checkout');
      
      toast.success('Voice order transferred to checkout', {
        description: `${voiceCartItems.length} items ready for payment`
      });
      
    } catch (error) {
      console.error('❌ Error processing voice checkout:', error);
      toast.error('Failed to process voice order', {
        description: 'Please try again or add items manually'
      });
    }
  };

  // ✅ NEW: Auto-open checkout if URL parameter is set
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('test-voice') === 'true') {
      setShowVoiceModal(true);
    }
  }, []);

  const handlePlaceOrder = async () => {
  };

  // **REMOVED: filteredItems useMemo - replaced by displayedItems (URL-driven state)**
  // **REMOVED: handleParentCategorySelect - replaced by handleCategoryTabClick**
  // **REMOVED: handleMenuCategorySelect - replaced by handleCategoryTabClick**
  
  // Handle menu item selection (triggers variant selector or direct add)
  const handleItemSelect = (item: MenuItem, variant?: ItemVariant) => {
    console.log('🎯 handleItemSelect called:', {
      itemName: item.name,
      variantId: variant?.id,
      hasVariants: itemVariants?.filter(v => v.menu_item_id === item.id).length || 0
    });
    
    setSelectedItem(item);
    setSelectedInitialVariant(variant || null); // NEW: Set pre-selected variant
    setIsVariantSelectorOpen(true);
  };
  
  // Handle adding to cart - UPDATED to support customizations
  const handleAddToCart = (item: MenuItem, variant: any, quantity: number, notes?: string, customizations?: any[]) => {
    // **CORRECT PRICING LOGIC FOR ONLINEORDERS**
    // OnlineOrders is for collection/delivery only - NOT dine-in
    let price = 0;
    
    if (variant && variant.id !== `single-${item.id}`) {
      // Multi-variant item with real variant data
      if (orderMode === "delivery") {
        price = variant.price_delivery || variant.price || 0;
      } else {
        // Collection mode - use base price (which is takeaway price)
        price = variant.price || 0;
      }
    } else {
      // Single item - use item pricing
      if (orderMode === "delivery") {
        price = item.price_delivery || item.price_takeaway || item.price || 0;
      } else {
        // Collection mode
        price = item.price_takeaway || item.price || 0;
      }
    }

    // Create variant object with correct price
    const variantWithPrice = variant ? {
      ...variant,
      price: price
    } : {
      id: `single-${item.id}`,
      name: 'Standard',
      price: price
    };

    // ✅ FIX #14: Pass parameters in correct order matching cartStore.addItem signature
    // Signature: addItem(item, variant, quantity, customizations, orderMode, notes)
    addItem(item, variantWithPrice, quantity, customizations || [], orderMode, notes || '');

    setIsVariantSelectorOpen(false);
    setSelectedItem(null);
    
    // **NEW: Add visual feedback and auto-open cart drawer**
    toast.success(`${item.name} added to cart`, {
      description: `Quantity: ${quantity}${variant?.name ? ` (${variant.name})` : ''}`,
      duration: 3000,
    });
    
    // Auto-open cart drawer after adding item
    setTimeout(() => {
      openCart();
    }, 500); // Small delay for better UX
  };
  
  // Handle menu item click - open variant selector or add to cart directly
  const handleItemClick = (item: MenuItem, variant?: ItemVariant) => {
    console.log('🔍 OnlineOrders: handleItemClick called with:', item.name, variant ? `variant: ${variant.name}` : 'no variant');
    setSelectedItem(item);
    setIsVariantSelectorOpen(true);
    console.log('🔍 OnlineOrders: Modal state set - selectedItem:', item.name, 'isOpen:', true);
  };

  // Cart management functions - remove duplicates and use useCartStore functions
  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
    } else {
      updateItemQuantity(itemId, quantity);
    }
  };
  
  const removeCartItem = (itemId: string) => {
    removeItem(itemId);
  };
  
  // Handle voice order updates
  const handleVoiceOrderUpdate = (items: any[]) => {
    // Add voice-ordered items to cart with special indicator
    const voiceItems = items.map(item => ({
      ...item,
      id: `voice-${Date.now()}-${Math.random()}`,
      addedByVoice: true
    }));
    
    // Use addItem from useCartStore for each voice item
    voiceItems.forEach(voiceItem => {
      addItem(voiceItem, voiceItem.variant, voiceItem.quantity, voiceItem.notes);
    });
  };

  // Calculate menu item counts for categories
  const menuItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Count all items
    counts.all = menuItems.length;
    
    // ✅ SAFETY CHECK: Ensure categories is defined and is an array before forEach
    if (categories && Array.isArray(categories)) {
      // Count by category - INCLUDING child categories for parent categories
      categories.forEach(category => {
        if (!category.parent_category_id) {
          // This is a parent category - count items in all child categories
          const childCategoryIds = categories
            .filter(cat => cat.parent_category_id === category.id && cat.active)
            .map(cat => cat.id);
          
          // Count items in this parent category and all its children
          counts[category.id] = menuItems.filter(
            item => item.category_id === category.id || childCategoryIds.includes(item.category_id)
          ).length;
        } else {
          // This is a child category - count items normally
          counts[category.id] = menuItems.filter(
            item => item.category_id === category.id
          ).length;
        }
      });
    }
    
    return counts;
  }, [menuItems, categories]);
  
  // Define filteredMenuItems for compatibility with existing code
  const filteredMenuItems = menuItems;
  
  // **FIX: Memoize onItemSelect functions to prevent infinite re-renders**
  const handleMenuItemSelect = useCallback((item: MenuItem, variant?: ItemVariant) => {
    setSelectedItem(item);
    setIsVariantSelectorOpen(true);
  }, []); // Empty dependencies - these functions don't depend on external state
  
  const handleCloseModal = useCallback(() => {
    setSelectedItem(null);
    setIsVariantSelectorOpen(false);
  }, []);
  
  // **NEW: Get parent categories for tabs (6 sections, exclude DESSERTS & COFFEE, NO COUNTS)**
  const parentCategoriesForTabs = useMemo(() => {
    // Use only 6 sections for OnlineOrders (exclude DESSERTS & COFFEE, no counts)
    // ✅ FIX: Explicitly sort by order property to ensure consistent display sequence
    return FIXED_SECTIONS
      .filter(s => s.id !== 'desserts-coffee')
      .sort((a, b) => a.order - b.order);
  }, []);

  // Filter items based on selected category using proper section mapping
  const displayedItems = useMemo(() => {
    // **NEW: If user is searching, show search results instead**
    if (searchQuery.trim() && searchResults.length >= 0) {
      return searchResults;
    }
    
    let selectedCategoryId = searchParams.get('category');
    
    // If no category or 'all' -> show all items
    if (!selectedCategoryId || selectedCategoryId === 'all') {
      return menuItems;
    }
    
    // ✅ FIX (MYA-1379): Strip 'section-' prefix if present (backward compatibility)
    // URL might have 'section-main-course' but we need 'main-course' for FIXED_SECTIONS lookup
    if (selectedCategoryId.startsWith('section-')) {
      selectedCategoryId = selectedCategoryId.replace('section-', '');
    }
    
    // Check if this is a section ID
    const isSection = FIXED_SECTIONS.some(s => s.id === selectedCategoryId);
    if (isSection) {
      return filterItemsBySection(menuItems, categories, selectedCategoryId as any);
    }

    // Otherwise, filter by exact category ID (child category)
    return menuItems.filter(item => item.category_id === selectedCategoryId);
  }, [menuItems, categories, searchParams, searchQuery, searchResults]);
  
  // **NEW: Transform displayedItems into hierarchical structure**
  const hierarchicalData = React.useMemo(() => {
    // Safety check: ensure we have valid data
    if (!Array.isArray(categories) || !Array.isArray(displayedItems)) {
      return [];
    }

    const selectedCategoryId = searchParams.get('category');

    // ✅ FIX (MYA-1380): Use displayedItems directly - it's already filtered!
    // No need to filter again, as displayedItems already contains the right items
    const sectionItems = displayedItems;

    // Group by section, then by category
    const sectionGroups = new Map<string, Map<string, MenuItem[]>>();

    sectionItems.forEach(item => {
      const category = categories.find(c => c.id === item.category_id);
      if (!category) return;

      // ✅ FIX (MYA-1380): Use findRootSection to traverse category tree properly
      const section = findRootSection(category.id, categories);
      if (!section) {
        console.warn(`Category ${category.name} (${category.id}) has no section mapping`);
        return;
      }

      if (!sectionGroups.has(section.id)) {
        sectionGroups.set(section.id, new Map());
      }

      const categoryMap = sectionGroups.get(section.id)!;
      if (!categoryMap.has(category.id)) {
        categoryMap.set(category.id, []);
      }

      categoryMap.get(category.id)!.push(item);
    });

    // Convert to array format
    const result: Array<{
      section: typeof FIXED_SECTIONS[number];
      categories: Array<{ category: Category; items: MenuItem[] }>;  
    }> = [];

    sectionGroups.forEach((categoryMap, sectionId) => {
      const section = FIXED_SECTIONS.find(s => s.id === sectionId);
      if (!section) return;

      const categoryGroups = Array.from(categoryMap.entries()).map(([catId, items]) => {
        const category = categories.find(c => c.id === catId);
        return category ? { category, items } : null;
      }).filter((g): g is { category: Category; items: MenuItem[] } => g !== null);

      if (categoryGroups.length > 0) {
        result.push({ section, categories: categoryGroups });
      }
    });

    // ✅ FIX: Sort sections by their order property for consistent display
    result.sort((a, b) => a.section.order - b.section.order);

    return result;
  }, [displayedItems, searchParams, categories]);
  
  // **NEW: Retry handler for menu loading errors**
  const handleRetryMenuLoad = useCallback(() => {
    setError(null);
    initialize().catch((err) => {
      setError(err.message || 'Failed to load menu');
    });
  }, [initialize]);

  return (
    <ErrorBoundary
      fallback={(error, errorInfo, resetError) => (
        <OnlineOrdersErrorFallback
          error={error}
          errorInfo={errorInfo}
          resetError={resetError}
        />
      )}
      errorContext={createCartErrorContext(
        cartCount,
        user?.id,
        user?.email
      )}
      onError={(error, errorInfo) => {
        // Log error with cart context
        logError(
          error,
          errorInfo,
          createCartErrorContext(cartCount, user?.id, user?.email)
        );
      }}
    >
      <div 
        className="min-h-screen"
        style={{
          background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[950]} 0%, ${PremiumTheme.colors.charcoal[900]} 50%, ${PremiumTheme.colors.dark[900]} 100%)`,
          color: PremiumTheme.colors.text.primary
        }}
      >
        {/* Universal Header with PUBLIC_NAV context for full navigation - Z-INDEX: 50 */}
        <div 
          ref={headerRef}
          className="sticky top-0 z-50"
        >
          <UniversalHeader 
            context="online-orders"
            overrideConfig={true}
            transparent={false}
            showAuthButtons={true}
            showCart={true}
            showThemeToggle={true}
            onCartClick={openCart}
          />
        </div>
        
        {/* **UPDATED: Sticky Category Tabs Bar - Z-INDEX: 40 (Above AI panel) */}
        <div 
          ref={tabsRef}
          className="sticky z-40 border-b"
          style={{
            top: `${headerHeight}px`, // ✅ FIX: Position below header when sticky
            background: 'rgba(0, 0, 0, 0.75) !important',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)', // Safari support
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
          }}
        >
          {isMenuLoading ? (
            <CategoryNavigationSkeleton />
          ) : (
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-3">
              {/* Category Tabs */}
              <div className="flex-1 overflow-x-auto">
                <div 
                  className="flex items-center space-x-2 min-w-max"
                  role="tablist"
                  aria-label="Menu categories"
                  onKeyDown={(e) => {
                    // Keyboard navigation for tabs
                    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                      e.preventDefault();
                      const allTabs = ['all', ...parentCategoriesForTabs.map(s => `section-${s.id}`)];
                      const currentIndex = allTabs.indexOf(activeCategory);
                      let nextIndex;
                      
                      if (e.key === 'ArrowRight') {
                        nextIndex = (currentIndex + 1) % allTabs.length;
                      } else {
                        nextIndex = (currentIndex - 1 + allTabs.length) % allTabs.length;
                      }
                      
                      handleCategoryTabClick(allTabs[nextIndex]);
                      // Focus the new tab
                      setTimeout(() => {
                        const tabButtons = e.currentTarget.querySelectorAll('[role="tab"]');
                        (tabButtons[nextIndex] as HTMLElement)?.focus();
                      }, 0);
                    }
                  }}
                >
                  {/* All Tab */}
                  <button
                    onClick={() => handleCategoryTabClick('all')}
                    role="tab"
                    aria-selected={activeCategory === 'all'}
                    aria-controls="menu-content"
                    tabIndex={activeCategory === 'all' ? 0 : -1}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      activeCategory === 'all'
                        ? 'text-white shadow-lg'
                        : 'hover:text-white'
                    }`}
                    style={{
                      backgroundColor: activeCategory === 'all' 
                        ? PremiumTheme.colors.burgundy[500] 
                        : 'transparent',
                      color: activeCategory === 'all' 
                        ? 'white' 
                        : PremiumTheme.colors.silver[300]
                    }}
                    onMouseEnter={(e) => {
                      if (activeCategory !== 'all') {
                        e.currentTarget.style.backgroundColor = PremiumTheme.colors.dark[700];
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeCategory !== 'all') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    All
                  </button>
                  
                  {/* 6 Fixed Section Tabs (excluding DESSERTS & COFFEE, no counts) */}
                  {parentCategoriesForTabs.map(section => (
                    <button
                      key={section.id}
                      onClick={() => handleCategoryTabClick(`section-${section.id}`)}
                      role="tab"
                      aria-selected={activeCategory === `section-${section.id}`}
                      aria-controls="menu-content"
                      tabIndex={activeCategory === `section-${section.id}` ? 0 : -1}
                      onMouseEnter={(e) => {
                        handleSectionHover(section.id, e);
                        if (activeCategory !== `section-${section.id}`) {
                          e.currentTarget.style.backgroundColor = PremiumTheme.colors.dark[700];
                        }
                      }}
                      onMouseLeave={(e) => {
                        handleSectionHoverLeave();
                        if (activeCategory !== `section-${section.id}`) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                        activeCategory === `section-${section.id}`
                          ? 'text-white shadow-lg'
                          : 'hover:text-white'
                      }`}
                      style={{
                        backgroundColor: activeCategory === `section-${section.id}` 
                          ? PremiumTheme.colors.burgundy[500] 
                          : 'transparent',
                        color: activeCategory === `section-${section.id}` 
                          ? 'white' 
                          : PremiumTheme.colors.silver[300]
                      }}
                    >
                      {section.displayName}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* View Toggle */}
              <div className="flex items-center space-x-2 ml-4">
                <div className="flex rounded-lg p-1" style={{ backgroundColor: PremiumTheme.colors.dark[800] }}>
                  <button
                    onClick={() => handleViewModeChange('gallery')}
                    className="p-2 rounded-md transition-all duration-200 shadow-lg"
                    style={{
                      backgroundColor: viewMode === 'gallery'
                        ? PremiumTheme.colors.burgundy[500]
                        : 'transparent',
                      color: viewMode === 'gallery'
                        ? 'white'
                        : PremiumTheme.colors.silver[400]
                    }}
                    onMouseEnter={(e) => {
                      if (viewMode !== 'gallery') {
                        e.currentTarget.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (viewMode !== 'gallery') {
                        e.currentTarget.style.color = PremiumTheme.colors.silver[400];
                      }
                    }}
                    title="Gallery View"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleViewModeChange('compact')}
                    className="p-2 rounded-md transition-all duration-200 shadow-lg"
                    style={{
                      backgroundColor: viewMode === 'compact'
                        ? PremiumTheme.colors.burgundy[500]
                        : 'transparent',
                      color: viewMode === 'compact'
                        ? 'white'
                        : PremiumTheme.colors.silver[400]
                    }}
                    onMouseEnter={(e) => {
                      if (viewMode !== 'compact') {
                        e.currentTarget.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (viewMode !== 'compact') {
                        e.currentTarget.style.color = PremiumTheme.colors.silver[400];
                      }
                    }}
                    title="Compact List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}
          
          {/* **NEW: Search Bar - Sticky below category tabs */}
          {!isMenuLoading && (
            <div className="border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
              <div className="container mx-auto px-4 py-3">
                <div className="relative max-w-2xl">
                  <Search 
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
                    style={{ color: PremiumTheme.colors.silver[400] }}
                  />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search menu (Cmd+K)..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 pr-24 h-11 border-0 focus-visible:ring-2"
                    style={{
                      background: PremiumTheme.colors.dark[800],
                      color: PremiumTheme.colors.text.primary,
                      borderColor: PremiumTheme.colors.border.medium
                    }}
                  />
                  
                  {/* Result count or clear button */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {searchQuery && (
                      <>
                        {isSearching ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" 
                              style={{ borderColor: PremiumTheme.colors.silver[400] }} 
                            />
                          </div>
                        ) : (
                          <Badge 
                            variant="secondary"
                            className="text-xs"
                            style={{
                              background: searchResults.length === 0 
                                ? PremiumTheme.colors.burgundy[500] 
                                : PremiumTheme.colors.dark[700],
                              color: 'white'
                            }}
                          >
                            {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
                          </Badge>
                        )}
                        <button
                          onClick={handleClearSearch}
                          className="p-1 rounded-full transition-colors"
                          style={{ color: PremiumTheme.colors.silver[400] }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = PremiumTheme.colors.silver[400];
                          }}
                          aria-label="Clear search"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* **FIXED: Main Content with Proper Top Margin - NO Z-INDEX CONFLICTS */}
        <div 
          className="container mx-auto px-4 pb-20"
          style={{
            marginTop: `${tabsHeight + 24}px` // Simplified - no AI panel offset needed
          }}
        >
          <div className="grid grid-cols-1 gap-8 relative">
            
            {/* Main Content Area - **MODIFIED to be full width** */}
            <main className="lg:col-span-4 overflow-y-auto pb-20">
              
              {/* REMOVE_AI: AI Recommendations widget retired */}
              
              {/* Section headers and menu grid follow */}
              
              {/* Menu Content - RESTRUCTURED with View Toggle */}
              {error ? (
                // **NEW: Error state with retry
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">😞</div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: PremiumTheme.colors.burgundy[400] }}>
                      Oops! Menu couldn't load
                    </h3>
                    <p className="text-gray-400 mb-6">
                      {error}
                    </p>
                    <button
                      onClick={handleRetry}
                      className="px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                      style={{
                        backgroundColor: PremiumTheme.colors.burgundy[500],
                        color: 'white',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[600];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[500];
                      }}
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : isMenuLoading ? (
                // **NEW: Loading skeletons
                <MenuSkeleton viewMode={viewMode} count={9} />
              ) : searchQuery.trim() && displayedItems.length === 0 ? (
                // **NEW: Empty state for zero search results**
                <div className="flex flex-col items-center justify-center py-20 px-6">
                  <div className="text-center max-w-md">
                    <div 
                      className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${PremiumTheme.colors.burgundy[500]}20` }}
                    >
                      <Search 
                        size={40} 
                        style={{ color: PremiumTheme.colors.burgundy[400] }}
                      />
                    </div>
                    <h3 
                      className="text-2xl font-semibold mb-3"
                      style={{ color: PremiumTheme.colors.burgundy[400] }}
                    >
                      No dishes found
                    </h3>
                    <p className="text-gray-400 mb-6">
                      We couldn't find any dishes matching <span className="font-semibold" style={{ color: PremiumTheme.colors.silver[300] }}>'{searchQuery}'</span>
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSearchResults([]);
                          if (searchInputRef.current) {
                            searchInputRef.current.value = '';
                          }
                        }}
                        className="px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                        style={{
                          backgroundColor: PremiumTheme.colors.burgundy[500],
                          color: 'white',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[600];
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[500];
                        }}
                      >
                        Clear Search
                      </button>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSearchResults([]);
                          setSearchParams({ category: 'all' });
                          if (searchInputRef.current) {
                            searchInputRef.current.value = '';
                          }
                        }}
                        className="px-6 py-3 rounded-lg font-semibold border-2 transition-all duration-200"
                        style={{
                          borderColor: PremiumTheme.colors.burgundy[500],
                          color: PremiumTheme.colors.burgundy[400],
                          backgroundColor: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = `${PremiumTheme.colors.burgundy[500]}10`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        Browse All Items
                      </button>
                    </div>
                  </div>
                </div>
              ) : hierarchicalData.length > 0 ? (
                <div className="space-y-12">
                  {hierarchicalData.map((sectionGroup, sectionIndex) => {
                    return (
                    <div 
                      key={sectionGroup.section.id}
                      ref={el => {
                        if (el) {
                          categoryRefs.current[`section-${sectionGroup.section.id}`] = el;
                        }
                      }}
                      data-category-id={`section-${sectionGroup.section.id}`}
                      className={sectionIndex === 0 ? '' : 'mt-12'}
                    >
                      {/* Section Heading */}
                      <div className="text-center mb-8">
                        <h2 
                          className="text-3xl font-bold uppercase mb-2"
                          style={{
                            color: PremiumTheme.colors.burgundy[400],
                            letterSpacing: '0.1em'
                          }}
                        >
                          {sectionGroup.section.displayName}
                        </h2>
                        <div 
                          className="w-24 h-1 mx-auto rounded-full"
                          style={{
                            background: `linear-gradient(90deg, transparent, ${PremiumTheme.colors.burgundy[500]}, transparent)`
                          }}
                        />
                      </div>
                      
                      {/* Categories within this section */}
                      <div className="space-y-10">
                        {sectionGroup.categories.map((catGroup, catIndex) => {
                          return (
                          <div 
                            key={catGroup.category.id}
                            ref={el => {
                              if (el) {
                                categoryRefs.current[catGroup.category.id] = el;
                              }
                            }}
                            data-category-id={catGroup.category.id}
                            className={catIndex === 0 ? 'mt-6' : 'mt-8'}
                          >
                            {/* Category Sub-heading */}
                            <div className="mb-6">
                              <h3 
                                className="text-xl font-semibold pb-2 border-b inline-block"
                                style={{
                                  color: PremiumTheme.colors.silver[300],
                                  borderColor: `${PremiumTheme.colors.burgundy[500]}40`
                                }}
                              >
                                {catGroup.category.name}
                              </h3>
                            </div>
                            
                            {/* Menu Items */}
                            {viewMode === 'gallery' ? (
                              <MenuGrid
                                menuItems={catGroup.items}
                                onItemSelect={handleMenuItemSelect}
                                mode={currentOrderMode} // ✅ FIXED: Use cartStore mode
                                isLoading={false}
                                itemVariants={itemVariants}
                                proteinTypes={proteinTypes}
                                galleryCompact={true}
                              />
                            ) : (
                              <CompactMenuList
                                menuItems={catGroup.items}
                                onItemSelect={handleMenuItemSelect}
                                mode={currentOrderMode} // ✅ FIXED: Use cartStore mode
                                itemVariants={itemVariants}
                                proteinTypes={proteinTypes}
                              />
                            )}
                          </div>
                          );
                        })}
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : displayedItems.length > 0 ? (
                <div className="mb-12">
                  {/* Conditional rendering based on view mode */}
                  {viewMode === 'gallery' ? (
                    <MenuGrid
                      menuItems={displayedItems}
                      onItemSelect={handleMenuItemSelect}
                      mode={currentOrderMode} // ✅ FIXED: Use cartStore mode
                      isLoading={false}
                      itemVariants={itemVariants}
                      proteinTypes={proteinTypes}
                      galleryCompact={true}
                    />
                  ) : (
                    <CompactMenuList
                      menuItems={displayedItems}
                      onItemSelect={handleMenuItemSelect}
                      mode={currentOrderMode} // ✅ FIXED: Use cartStore mode
                      itemVariants={itemVariants}
                      proteinTypes={proteinTypes}
                    />
                  )}
                </div>
              ) : (
                // **NEW: Improved empty state with context-aware messaging
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">🍽️</div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: PremiumTheme.colors.burgundy[400] }}>
                      No dishes found
                    </h3>
                    <p className="text-gray-400 mb-4">
                      {searchParams.get('category') && searchParams.get('category') !== 'all'
                        ? 'No items in this category at the moment.'
                        : 'Our menu is currently being updated.'}
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        setSearchParams({ category: 'all' });
                        if (searchInputRef.current) {
                          searchInputRef.current.value = '';
                        }
                      }}
                      className="text-sm px-4 py-2 rounded-lg transition-all duration-200"
                      style={{
                        color: PremiumTheme.colors.burgundy[500],
                        border: `1px solid ${PremiumTheme.colors.burgundy[500]}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[500];
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = PremiumTheme.colors.burgundy[500];
                      }}
                    >
                      View All Dishes
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>

        {/* **FIXED: Floating Back to Top Button - Z-INDEX: 20 */}
        <button
          onClick={handleBackToTop}
          className="fixed bottom-6 right-6 z-20 bg-[#8B1538] hover:bg-[#7A1230] text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          title="Back to Top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>

        {/* Cart Recovery Dialog */}
        <CartRecoveryDialog
          isOpen={showCartRecovery}
          onRestore={handleRestoreCart}
          onDiscard={handleDiscardCart}
          menuItems={menuItems} 
          cartPreview={{
            itemsCount: cartItems.length,
            totalValue: cartTotal,
            items: cartItems,
            savedDate: cartLastSavedAt || new Date().toISOString(),
            isStale: isCartStale(),
            hasPriceChanges: cartItems.some(item => item.priceChanged)
          }}
        />

        {/* Checkout Modal Overlay */}
        {checkoutView === 'checkout' && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-dialog-title"
            ref={checkoutDialogRef}
            tabIndex={-1}
          >
            {/* Hidden title for screen readers */}
            <h2 id="checkout-dialog-title" className="sr-only">Checkout</h2>
            <CheckoutView
              onNavigateToMenu={handleCheckoutClose}
              onNavigateToAuth={() => setShowAuthModal(true)}
              className="bg-gray-900 rounded-xl border border-gray-700 shadow-2xl"
            />
          </div>
        )}
        
        {/* Auth Modal - Sign In / Sign Up */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode={authModalMode}
          onModeChange={setAuthModalMode}
          context={authContext}
          redirectTo="/online-orders"
        />
        
        {/* ✅ NEW: Customer Cart Sidebar - Scoped to OnlineOrders page only */}
        {/* ✅ MYA-1564: Only render when chat cart is NOT open (DOM-level mutual exclusivity) */}
        {!isChatCartOpen && (
          <CartSidebar
            isOpen={isCartOpen}
            onClose={closeCart}
            isAuthenticated={isAuthenticated}
            menuItems={menuItems}
            onCheckout={() => {
              closeCart();
              setCheckoutView('checkout');
            }}
            onSignIn={() => {
              closeCart();
              setShowAuthModal(true);
              setAuthModalMode('login');
              setAuthContext('checkout');
            }}
          />
        )}
        
        {/* Footer - Customer variant for online ordering experience */}
        <Footer variant="customer" />
      </div>
    </ErrorBoundary>
  );
}
