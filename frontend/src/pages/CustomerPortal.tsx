

import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock, FaHeart, FaShoppingBag, FaEdit, FaSignOutAlt, FaUtensils } from "react-icons/fa";
import { AuthTheme } from "utils/authTheme";
import { UniversalHeader } from "components/UniversalHeader";
import { Footer } from "components/Footer";
import { PremiumBackground } from "components/PremiumBackground";
import { PortalSection } from "components/PortalSection";
import { PortalNavigation } from "components/PortalNavigation";
import { PortalBottomNav } from "components/PortalBottomNav";
import { AuthButton } from "components/AuthButton";
import { useSimpleAuth } from "utils/simple-auth-context";
import { useCartStore } from "utils/cartStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import brain from "brain";
import { ArrowLeft, LogOut, User, MapPin, History, Heart, Edit, Plus, Trash2, Mail, Phone, Flame, ShoppingBag, Clock, ShoppingCart, Bot, CheckCircle2, AlertCircle, Send, Loader2, Check, Navigation, Settings as SettingsIcon, Edit2, Save, X, XCircle, Calendar, Search, Filter, Package, RotateCcw, Upload, UtensilsCrossed, FolderPlus, FolderEdit, Share2, List, MoreVertical, LayoutDashboard } from "lucide-react";
import { ProfileImageUpload } from "components/ProfileImageUpload";
import { AddressModal } from "components/AddressModal";
import MiniMapPreview from "components/MiniMapPreview";
import { EnrichedFavoriteItem, EnrichedFavoritesResponse } from "types";
import { InlineEditField } from "components/InlineEditField";
import { calculateProfileCompletion, getCompletionColor, getCompletionMessage } from "utils/profileCompletion";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from 'date-fns';
import { subscribeToCustomerOrders, unsubscribeFromOrderTracking } from "utils/orderTrackingRealtime";
import { WelcomeTour } from "components/WelcomeTour";
import { OnboardingWizard } from "components/OnboardingWizard";
import { useOnboardingStore } from "utils/onboardingStore";
import { useGlobalKeyboardShortcuts } from "utils/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "components/KeyboardShortcutsHelp";
import { VisuallyHidden } from "components/VisuallyHidden";
import { useIsMobile } from "utils/useMediaQuery";
import { useOfflineSync } from "utils/useOfflineSync";
import { useRealtimeMenuStoreCompat } from "utils/realtimeMenuStoreCompat";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Types for customer portal
type CustomerSection = 'dashboard' | 'profile' | 'addresses' | 'orders' | 'favorites';

// Lazy load section components for better performance
const CustomerDashboard = lazy(() => import('components/CustomerDashboard'));
const ProfileSection = lazy(() => import('components/ProfileSection'));
const AddressesSection = lazy(() => import('components/AddressesSection'));
const OrdersSection = lazy(() => import('components/OrdersSection'));
const FavoritesSection = lazy(() => import('components/FavoritesSection'));

// Import skeleton loaders for Suspense fallbacks
import { ProfileSkeleton } from 'components/ProfileSkeleton';
import { AddressSkeleton } from 'components/AddressSkeleton';
import { OrderSkeleton } from 'components/OrderSkeleton';
import { FavoriteSkeleton } from 'components/FavoriteSkeleton';

// Simple spice level indicator component
const SpiceLevelIndicator = ({ level }: { level: number }) => {
  const spiceIcons = [];
  for (let i = 0; i < level && i < 5; i++) {
    spiceIcons.push(
      <Flame key={i} className="h-3 w-3 text-red-500 fill-current" />
    );
  }
  return <div className="flex">{spiceIcons}</div>;
};

export default function CustomerPortal() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    user, 
    profile, 
    addresses, 
    favorites, 
    favoriteLists,
    updateProfile, 
    addAddress, 
    updateAddress, 
    deleteAddress, 
    setDefaultAddress, 
    unsetDefaultAddress, 
    signOut, 
    removeFavorite, 
    createList,
    renameList,
    deleteList,
    addToList,
    removeFromList,
    refreshLists,
    isLoading,
    justSignedUp,
    setJustSignedUp
  } = useSimpleAuth();
  const { addItem, openCart } = useCartStore();
  const { shouldShowWizard, wizardDismissed } = useOnboardingStore();

  // Menu store for reorder functionality
  const { menuItems: storeMenuItems, initialize: initializeMenuStore } = useRealtimeMenuStoreCompat({ context: 'online' });
  
  // NEW: Offline sync hook
  const {
    isOnline,
    isSyncing,
    queueLength,
    cacheProfile,
    getCachedProfile,
    cacheOrders,
    getCachedOrders,
    cacheAddresses,
    getCachedAddresses,
    queueAction,
    clearCache
  } = useOfflineSync();
  
  // State for enriched favorites
  const [enrichedFavorites, setEnrichedFavorites] = useState<EnrichedFavoriteItem[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  
  // Additional state for CustomerPortal
  const [activeSection, setActiveSection] = useState<CustomerSection>('dashboard');
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);

  // Pagination state for order history
  const [ordersTotalCount, setOrdersTotalCount] = useState(0);
  const [ordersHasMore, setOrdersHasMore] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersOffset, setOrdersOffset] = useState(0);
  const ORDERS_PAGE_SIZE = 25;

  // NEW: Track if data is from cache
  const [isViewingCachedData, setIsViewingCachedData] = useState(false);
  
  // NEW: Filter and search state for order history
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isReordering, setIsReordering] = useState<string | null>(null);

  // NEW: Deterministic recommendations state
  const [recommendations, setRecommendations] = useState<any[] | null>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  
  // NEW: Email verification state
  const [emailVerified, setEmailVerified] = useState(false);
  const [checkingEmailVerification, setCheckingEmailVerification] = useState(false);
  const [sendingVerificationEmail, setSendingVerificationEmail] = useState(false);
  
  // NEW: Personalization settings state
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true);
  const [personalizationLoading, setPersonalizationLoading] = useState(false);
  
  // NEW: Favorite lists state
  const [selectedListId, setSelectedListId] = useState<string>('all'); // 'all' for all favorites
  const [createListModalOpen, setCreateListModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [renameListModalOpen, setRenameListModalOpen] = useState(false);
  const [listToRename, setListToRename] = useState<{ id: string; name: string } | null>(null);
  const [renameListName, setRenameListName] = useState('');
  const [deleteListModalOpen, setDeleteListModalOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [isRenamingList, setIsRenamingList] = useState(false);
  const [isDeletingList, setIsDeletingList] = useState(false);
  
  // NEW: Keyboard shortcuts state
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  
  // Mobile detection
  const isMobile = useIsMobile();

  // NEW: Load personalization settings
  useEffect(() => {
    const loadPersonalizationSettings = async () => {
      if (!profile?.id) return;
      
      setPersonalizationLoading(true);
      try {
        const response = await brain.get_personalization_settings({ customer_id: profile.id });
        const data = await response.json();
        setPersonalizationEnabled(data.personalization_enabled);
      } catch (error) {
        console.error('Failed to load personalization settings:', error);
        setPersonalizationEnabled(true); // Default to enabled
      } finally {
        setPersonalizationLoading(false);
      }
    };
    
    loadPersonalizationSettings();
  }, [profile?.id]);

  // NEW: Handle personalization toggle
  const handlePersonalizationToggle = async (enabled: boolean) => {
    if (!profile?.id) return;
    
    setPersonalizationLoading(true);
    try {
      const response = await brain.update_personalization_settings({
        customer_id: profile.id,
        personalization_enabled: enabled,
      });

      if (response.ok) {
        setPersonalizationEnabled(enabled);
        toast.success(
          enabled 
            ? 'Personalization enabled - AI chatbot will greet you by name and suggest your favorites' 
            : 'Personalization disabled - AI chatbot will use generic responses'
        );
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Failed to update personalization settings:', error);
      toast.error('Failed to update personalization settings');
    } finally {
      setPersonalizationLoading(false);
    }
  };
  
  // NEW: Check email verification status
  useEffect(() => {
    const checkEmailVerification = async () => {
      if (!profile?.id) return;
      
      setCheckingEmailVerification(true);
      try {
        const response = await brain.get_email_verification_status({ userId: profile.id });
        if (response.ok) {
          const data = await response.json();
          setEmailVerified(data.email_verified);
        }
      } catch (error) {
        console.error('Failed to check email verification:', error);
      } finally {
        setCheckingEmailVerification(false);
      }
    };
    
    checkEmailVerification();
  }, [profile?.id]);
  
  // NEW: Handle sending verification email
  const handleSendVerificationEmail = async () => {
    if (!profile?.id) return;
    
    setSendingVerificationEmail(true);
    try {
      const response = await brain.send_verification_email({ user_id: profile.id });
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Failed to send verification email:', error);
      toast.error('Failed to send verification email');
    } finally {
      setSendingVerificationEmail(false);
    }
  };

  // Toggle description expansion
  const toggleDescription = (favoriteId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(favoriteId)) {
        newSet.delete(favoriteId);
      } else {
        newSet.add(favoriteId);
      }
      return newSet;
    });
  };
  
  // Truncate description helper
  const truncateDescription = (description: string | null, favoriteId: string) => {
    if (!description) return null;
    
    const maxLength = 120;
    const isExpanded = expandedDescriptions.has(favoriteId);
    
    if (description.length <= maxLength) {
      return description;
    }
    
    if (isExpanded) {
      return (
        <span>
          {description}
          <button 
            onClick={() => toggleDescription(favoriteId)}
            className="ml-2 text-[#8B1538] hover:text-[#A91D47] text-sm font-medium transition-colors"
          >
            See Less
          </button>
        </span>
      );
    } else {
      return (
        <span>
          {description.substring(0, maxLength)}...
          <button 
            onClick={() => toggleDescription(favoriteId)}
            className="ml-2 text-[#8B1538] hover:text-[#A91D47] text-sm font-medium transition-colors"
          >
            See More
          </button>
        </span>
      );
    }
  };
  
  // Load enriched favorites
  const loadEnrichedFavorites = async () => {
    if (!profile?.id) return;

    setFavoritesLoading(true);
    setFavoritesError(null);
    try {
      const response = await brain.get_enriched_favorites({ customer_id: profile.id });

      const data: EnrichedFavoritesResponse = await response.json();

      if (data.success) {
        setEnrichedFavorites(data.favorites);
        setFavoritesError(null);
      } else {
        setFavoritesError('Unable to load your favorites. Please try again.');
      }
    } catch (error) {
      const isOffline = !navigator.onLine;
      setFavoritesError(
        isOffline
          ? 'You appear to be offline. Please check your connection.'
          : 'Something went wrong loading your favorites.'
      );
    } finally {
      setFavoritesLoading(false);
    }
  };
  
  // Load enriched favorites when favorites change
  useEffect(() => {
    // Always try to load enriched favorites if user is logged in
    // Don't depend on SimpleAuth favorites as they might not be synced
    if (profile?.id) {
      loadEnrichedFavorites();
    } else {
      setEnrichedFavorites([]);
    }
  }, [profile?.id]);  // Only depend on user.id, not favorites array
  
  // Get initial section from URL or state
  const getInitialSection = (): CustomerSection => {
    const hash = location.hash.replace('#', '') as CustomerSection;
    const validSections: CustomerSection[] = ['profile', 'addresses', 'orders', 'favorites'];
    return validSections.includes(hash) ? hash : 'profile';
  };
  
  // Handle profile image updates
  const handleImageUpdate = (imageUrl: string | null) => {
    // Update the profile in SimpleAuth context to persist the change
    updateProfile({ image_url: imageUrl }).then(({ error }) => {
      if (error) {
        console.error('Failed to update profile with new image URL:', error);
        toast.error('Failed to save image to profile');
      } else {
      }
    });
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login", { state: { returnUrl: "/customer-portal" } });
    }
  }, [user, isLoading, navigate]);

  // Update URL hash when section changes
  useEffect(() => {
    navigate(`/customer-portal#${activeSection}`, { replace: true });
  }, [activeSection, navigate]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;
      
      // Check if online
      if (isOnline) {
        // ONLINE: Fetch fresh data and cache it
        try {
          setIsViewingCachedData(false);

          // Load order history with pagination
          const ordersResponse = await brain.get_order_history({
            customerId: user.id,
            limit: ORDERS_PAGE_SIZE,
            offset: 0
          });
          const ordersData = await ordersResponse.json();
          const orders = ordersData?.orders || [];
          setOrderHistory(orders);
          setOrdersTotalCount(ordersData?.total_count || 0);
          setOrdersHasMore(ordersData?.has_more || false);
          setOrdersOffset(ORDERS_PAGE_SIZE);

          // Cache for offline use
          cacheOrders(orders);

          // Load deterministic recommendations
          setRecommendationsLoading(true);
          try {
            const recsResponse = await fetch(`/routes/customer-recommendations/customer/${user.id}`);
            if (recsResponse.ok) {
              const recsData = await recsResponse.json();
              if (recsData.success) {
                setRecommendations(recsData.recommended_for_you || []);
              }
            }
          } catch (recsError) {
            console.error('Error loading recommendations:', recsError);
          } finally {
            setRecommendationsLoading(false);
          }
        } catch (error) {
          console.error('Error loading user data:', error);

          // Fallback to cached data on error
          const cachedOrders = getCachedOrders();
          if (cachedOrders) {
            setOrderHistory(cachedOrders);
            setIsViewingCachedData(true);
          }
        }
      } else {
        // OFFLINE: Use cached data
        
        const cachedOrders = getCachedOrders();
        if (cachedOrders) {
          setOrderHistory(cachedOrders);
          setIsViewingCachedData(true);
        } else {
          toast.info('No offline data available. Connect to view your orders.');
        }
      }
    };
    
    loadUserData();
  }, [user, isOnline]);
  
  // Cache profile data when it loads/changes
  useEffect(() => {
    if (profile && isOnline) {
      cacheProfile(profile);
    }
  }, [profile, isOnline]);
  
  // Cache addresses when they load/change
  useEffect(() => {
    if (addresses && addresses.length > 0 && isOnline) {
      cacheAddresses(addresses);
    }
  }, [addresses, isOnline]);
  
  // Clear cache on logout
  useEffect(() => {
    if (!user) {
      clearCache();
    }
  }, [user]);

  // ✅ NEW: Real-time order status subscription for live updates
  useEffect(() => {
    if (!profile?.id || !isOnline) return;

    console.log('🔔 Setting up real-time order subscription for customer:', profile.id);

    const subscription = subscribeToCustomerOrders(
      profile.id,
      (updatedOrder) => {
        setOrderHistory((prevOrders) => {
          // Check if this is an existing order being updated
          const existingIndex = prevOrders.findIndex((o) => o.id === updatedOrder.id);

          if (existingIndex !== -1) {
            // Update existing order
            const newOrders = [...prevOrders];
            newOrders[existingIndex] = {
              ...newOrders[existingIndex],
              ...updatedOrder,
            };

            // Show toast notification for status changes
            const oldStatus = prevOrders[existingIndex].status;
            const newStatus = updatedOrder.status;
            if (oldStatus !== newStatus) {
              const orderNumber = updatedOrder.id?.slice(-8).toUpperCase() || 'Order';
              const statusMessages: Record<string, string> = {
                'CONFIRMED': `Order #${orderNumber} has been confirmed!`,
                'PREPARING': `Order #${orderNumber} is being prepared`,
                'READY': `Order #${orderNumber} is ready for pickup!`,
                'OUT_FOR_DELIVERY': `Order #${orderNumber} is out for delivery!`,
                'DELIVERED': `Order #${orderNumber} has been delivered`,
                'COLLECTED': `Order #${orderNumber} has been collected`,
                'CANCELLED': `Order #${orderNumber} has been cancelled`,
              };
              const message = statusMessages[newStatus] || `Order #${orderNumber} status updated to ${newStatus}`;
              toast.info(message, { duration: 5000 });
            }

            return newOrders;
          } else {
            // New order - add to the beginning of the list
            toast.success('New order placed!', { duration: 3000 });
            return [updatedOrder, ...prevOrders];
          }
        });
      },
      (error) => {
        console.error('❌ Real-time subscription error:', error);
      }
    );

    return () => {
      console.log('🔕 Cleaning up real-time order subscription');
      unsubscribeFromOrderTracking(subscription);
    };
  }, [profile?.id, isOnline]);

  // Calculate profile completion
  const profileCompletion = calculateProfileCompletion(profile, addresses);
  const completionColor = getCompletionColor(profileCompletion.percentage);
  const completionMessage = getCompletionMessage(profileCompletion);

  // Handler functions for other sections
  const handleSignOut = async () => {
    await signOut();
    navigate('/online-orders');
  };

  // NEW: Filtered orders logic
  const filteredOrders = useMemo(() => {
    if (!orderHistory) return [];
    
    return orderHistory.filter(order => {
      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }
      
      // Date range filter
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.created_at!);
        const now = new Date();
        const daysAgo = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dateFilter === 'last7' && daysAgo > 7) return false;
        if (dateFilter === 'last30' && daysAgo > 30) return false;
        if (dateFilter === 'last180' && daysAgo > 180) return false;
      }
      
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const orderNumber = order.id?.slice(-8).toUpperCase() || '';
        const deliveryAddress = order.delivery_address?.toLowerCase() || '';
        const itemNames = order.order_items?.map(item => item.menu_item_name.toLowerCase()).join(' ') || '';
        
        return (
          orderNumber.includes(query.toUpperCase()) ||
          deliveryAddress.includes(query) ||
          itemNames.includes(query)
        );
      }
      
      return true;
    });
  }, [orderHistory, statusFilter, dateFilter, searchQuery]);
  
  // NEW: Check if filters are active
  const hasActiveFilters = statusFilter !== 'all' || dateFilter !== 'all' || searchQuery.trim() !== '';
  
  // NEW: Clear all filters
  const clearFilters = () => {
    setStatusFilter('all');
    setDateFilter('all');
    setSearchQuery('');
  };
  
  // Load more orders (pagination)
  const handleLoadMoreOrders = async () => {
    if (!profile?.id || ordersLoading || !ordersHasMore) return;

    setOrdersLoading(true);
    try {
      const response = await brain.get_order_history({
        customerId: profile.id,
        limit: ORDERS_PAGE_SIZE,
        offset: ordersOffset
      });
      const data = await response.json();

      const newOrders = data?.orders || [];
      setOrderHistory(prev => [...prev, ...newOrders]);
      setOrdersHasMore(data?.has_more || false);
      setOrdersOffset(prev => prev + ORDERS_PAGE_SIZE);

      // Update cache with all loaded orders
      cacheOrders([...orderHistory, ...newOrders]);
    } catch (error) {
      console.error('Failed to load more orders:', error);
      toast.error('Failed to load more orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  // Refresh orders after cancellation
  const refreshOrderHistory = async () => {
    if (!profile?.id) return;

    try {
      const response = await brain.get_order_history({
        customerId: profile.id,
        limit: ORDERS_PAGE_SIZE,
        offset: 0
      });
      const data = await response.json();
      const orders = data?.orders || [];
      setOrderHistory(orders);
      setOrdersTotalCount(data?.total_count || 0);
      setOrdersHasMore(data?.has_more || false);
      setOrdersOffset(ORDERS_PAGE_SIZE);
      cacheOrders(orders);
    } catch (error) {
      console.error('Failed to refresh orders:', error);
    }
  };

  // Reorder handler - validates items against current menu before adding to cart
  const handleReorder = async (order: any) => {
    if (!order.order_items || order.order_items.length === 0) {
      toast.error('This order has no items to reorder');
      return;
    }

    setIsReordering(order.id);

    try {
      // Get current menu items from store
      let currentMenuItems = storeMenuItems;

      // If menu isn't loaded yet, try to initialize it
      if (!currentMenuItems || currentMenuItems.length === 0) {
        await initializeMenuStore();
        // After initialize, use storeMenuItems which will be updated by React Query
        currentMenuItems = storeMenuItems;
      }

      // Validate each item against the current menu
      const validItems: Array<{ orderItem: any; menuItem: any }> = [];
      const unavailableItems: string[] = [];

      for (const orderItem of order.order_items) {
        // Find the item in the current menu
        const menuItem = currentMenuItems.find(
          (m: any) => m.id === orderItem.menu_item_id
        );

        if (menuItem && menuItem.is_active) {
          validItems.push({ orderItem, menuItem });
        } else {
          unavailableItems.push(orderItem.menu_item_name);
        }
      }

      // Warn about unavailable items
      if (unavailableItems.length > 0) {
        toast.warning(
          `${unavailableItems.length} item${unavailableItems.length > 1 ? 's' : ''} no longer available`,
          {
            description: unavailableItems.slice(0, 3).join(', ') +
              (unavailableItems.length > 3 ? ` and ${unavailableItems.length - 3} more` : ''),
          }
        );
      }

      // Add valid items with current menu prices
      let addedCount = 0;
      for (const { orderItem, menuItem } of validItems) {
        try {
          const menuItemInput = {
            id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price || orderItem.price || 0,
            description: menuItem.description || '',
            imageUrl: menuItem.image_url || '/placeholder-food.jpg',
          };
          // Use order variant info or fallback to standard
          const variant = {
            id: orderItem.variant_id || `v-${menuItem.id}`,
            name: orderItem.variant_name || 'Standard',
            price: menuItem.price || orderItem.price || 0,
          };
          addItem(menuItemInput, variant, orderItem.quantity || 1);
          addedCount++;
        } catch (error) {
          console.error(`Error adding ${menuItem.name}:`, error);
        }
      }

      if (addedCount > 0) {
        toast.success(`Added ${addedCount} item${addedCount > 1 ? 's' : ''} to cart!`, {
          description: 'Navigate to the menu to review and checkout',
        });
      } else if (unavailableItems.length > 0) {
        toast.error('All items from this order are no longer available');
      } else {
        toast.error('Failed to add items to cart');
      }
    } catch (error) {
      console.error('Reorder error:', error);
      toast.error('Failed to reorder. Please try again.');
    } finally {
      setIsReordering(null);
    }
  };

  // Address modal handlers
  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressModalOpen(true);
  };
  
  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setAddressModalOpen(true);
  };
  
  // Handle address operations
  const handleSaveAddress = async (addressData: any) => {
    try {
      if (editingAddress) {
        // Update existing address
        const { error } = await updateAddress(editingAddress.id, addressData);
        if (error) {
          toast.error(error.message || 'Failed to update address');
        } else {
          toast.success('Address updated successfully!');
        }
      } else {
        // Add new address
        const { error } = await addAddress(addressData);
        if (error) {
          toast.error(error.message || 'Failed to add address');
        } else {
          toast.success('Address added successfully!');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const { error } = await deleteAddress(addressId);
      if (error) {
        toast.error(error.message || 'Failed to delete address');
      } else {
        toast.success('Address deleted successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      const { error } = await setDefaultAddress(addressId);
      if (error) {
        toast.error(error.message || 'Failed to set default address');
      } else {
        toast.success('Default address updated');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    }
  };

  const handleUnsetDefaultAddress = async () => {
    try {
      const { error } = await unsetDefaultAddress();
      if (error) {
        toast.error(error.message || 'Failed to unset default address');
      } else {
        toast.success('Default address removed');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    }
  };

  const handleAddToCart = (favorite: EnrichedFavoriteItem) => {
    try {
      const menuItem = {
        id: favorite.menu_item_id,
        name: favorite.display_name,
        price: favorite.display_price || 0,
        description: favorite.display_description || '',
        imageUrl: favorite.display_image_url || '/placeholder-food.jpg'
      };
      const variant = {
        id: favorite.variant_id || `v-${favorite.menu_item_id}`,
        name: favorite.variant_name || 'Standard',
        price: favorite.display_price || 0
      };

      addItem(menuItem, variant, 1);
      toast.success(`${favorite.display_name} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };
  
  const handleRemoveFavorite = async (favoriteId: string, itemName: string) => {
    try {
      await removeFavorite(favoriteId);
      toast.success(`${itemName} removed from favorites`);
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove favorite');
    }
  }
  
  // NEW: List management handlers
  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast.error('Please enter a list name');
      return;
    }
    
    setIsCreatingList(true);
    try {
      const { error, list } = await createList(newListName.trim());
      if (error) {
        toast.error('Failed to create list');
      } else {
        toast.success(`List "${newListName}" created!`);
        setCreateListModalOpen(false);
        setNewListName('');
        if (list) {
          setSelectedListId(list.id);
        }
      }
    } catch (error) {
      toast.error('An error occurred while creating the list');
    } finally {
      setIsCreatingList(false);
    }
  };
  
  const handleRenameList = async () => {
    if (!listToRename || !renameListName.trim()) {
      toast.error('Please enter a new name');
      return;
    }
    
    setIsRenamingList(true);
    try {
      const { error } = await renameList(listToRename.id, renameListName.trim());
      if (error) {
        toast.error('Failed to rename list');
      } else {
        toast.success(`List renamed to "${renameListName}"`);
        setRenameListModalOpen(false);
        setListToRename(null);
        setRenameListName('');
      }
    } catch (error) {
      toast.error('An error occurred while renaming the list');
    } finally {
      setIsRenamingList(false);
    }
  };
  
  const handleDeleteList = async () => {
    if (!listToDelete) return;
    
    setIsDeletingList(true);
    try {
      const { error } = await deleteList(listToDelete.id);
      if (error) {
        toast.error('Failed to delete list');
      } else {
        toast.success(`List "${listToDelete.name}" deleted`);
        setDeleteListModalOpen(false);
        setListToDelete(null);
        if (selectedListId === listToDelete.id) {
          setSelectedListId('all');
        }
      }
    } catch (error) {
      toast.error('An error occurred while deleting the list');
    } finally {
      setIsDeletingList(false);
    }
  };
  
  const handleToggleFavoriteInList = async (listId: string, favoriteId: string, isInList: boolean) => {
    try {
      if (isInList) {
        const { error } = await removeFromList(listId, favoriteId);
        if (error) {
          toast.error('Failed to remove from list');
        } else {
          toast.success('Removed from list');
        }
      } else {
        const { error } = await addToList(listId, favoriteId);
        if (error) {
          toast.error('Failed to add to list');
        } else {
          toast.success('Added to list');
        }
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  // Remove favorite from a list
  const handleToggleItemInList = async (listId: string, favoriteId: string, isInList: boolean) => {
    try {
      if (isInList) {
        const { error } = await removeFromList(listId, favoriteId);
        if (error) {
          toast.error('Failed to remove from list');
        } else {
          toast.success('Removed from list');
        }
      } else {
        const { error } = await addToList(listId, favoriteId);
        if (error) {
          toast.error('Failed to add to list');
        } else {
          toast.success('Added to list');
        }
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  // Format price
  const formatPrice = (price?: number): string => {
    if (!price) return 'Price unavailable';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  };

  // Render Profile Section - UPDATED WITH INLINE EDITING
  const renderProfileSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-[#EAECEF] text-2xl flex items-center gap-2">
              <User className="h-6 w-6 text-[#8B1538]" />
              Profile Information
            </CardTitle>
          </div>
          
          {/* NEW: Profile Completion Progress */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#B7BDC6]">{completionMessage}</span>
              <span className="text-sm font-medium" style={{ color: completionColor }}>
                {profileCompletion.percentage}%
              </span>
            </div>
            <Progress 
              value={profileCompletion.percentage} 
              className="h-2 bg-black/40"
              style={{
                ['--progress-background' as any]: completionColor
              }}
            />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Profile Image Upload */}
          <div className="flex justify-center">
            <ProfileImageUpload
              userId={user?.id || ''}
              currentImageUrl={profile?.image_url}
              googleProfileImage={profile?.google_profile_image}
              authProvider={profile?.auth_provider}
              onImageUpdate={async (imageUrl) => {
                await updateProfile({ image_url: imageUrl });
              }}
            />
          </div>

          {/* Inline Editable Fields */}
          <div className="space-y-4">
            <InlineEditField
              label="First Name"
              value={profile?.first_name || ''}
              onSave={async (value) => {
                const result = await updateProfile({ first_name: value });
                if (result.error) throw result.error;
              }}
              placeholder="Enter your first name"
              icon={<User className="h-4 w-4" />}
            />

            <InlineEditField
              label="Last Name"
              value={profile?.last_name || ''}
              onSave={async (value) => {
                const result = await updateProfile({ last_name: value });
                if (result.error) throw result.error;
              }}
              placeholder="Enter your last name"
              icon={<User className="h-4 w-4" />}
            />

            <InlineEditField
              label="Email"
              value={profile?.email || ''}
              onSave={async () => {}}
              type="email"
              icon={<Mail className="h-4 w-4" />}
              readonly={true}
              badge={
                checkingEmailVerification ? (
                  <Loader2 className="h-3 w-3 animate-spin text-[#8B92A0]" />
                ) : emailVerified ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Not Verified
                  </Badge>
                )
              }
            />
            
            {/* Email Verification Action */}
            {!emailVerified && !checkingEmailVerification && (
              <div className="pl-10">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSendVerificationEmail}
                  disabled={sendingVerificationEmail}
                  className="text-[#8B1538] hover:text-[#A91D47] hover:bg-[#8B1538]/10 h-8 text-xs"
                >
                  {sendingVerificationEmail ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-3 w-3 mr-1" />
                      Send verification email
                    </>
                  )}
                </Button>
              </div>
            )}

            <InlineEditField
              label="Phone"
              value={profile?.phone || ''}
              onSave={async (value) => {
                const result = await updateProfile({ phone: value });
                if (result.error) throw result.error;
              }}
              placeholder="Enter your phone number"
              type="tel"
              icon={<Phone className="h-4 w-4" />}
            />
          </div>

          {/* AI Personalization Settings */}
          <div className="border-t border-white/10 pt-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Bot className="h-5 w-5 text-[#8B1538] mt-1" />
                  <div>
                    <h3 className="text-[#EAECEF] font-medium">AI Personalization</h3>
                    <p className="text-sm text-[#8B92A0] mt-1">
                      Allow our AI chatbot to greet you by name and suggest your favorite dishes
                    </p>
                  </div>
                </div>
                <Switch
                  checked={personalizationEnabled}
                  onCheckedChange={handlePersonalizationToggle}
                  disabled={personalizationLoading}
                  className="data-[state=checked]:bg-[#8B1538]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Render spice level
  const renderSpiceLevel = (level?: number) => {
    if (!level) return null;
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: level }, (_, i) => (
          <Flame key={i} className="h-3 w-3 text-red-500 fill-current" />
        ))}
        <span className="text-xs text-gray-500">Spice Level {level}</span>
      </div>
    );
  };

  // Scroll to section handler
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActiveSection(sectionId as CustomerSection);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <PremiumBackground />
        <UniversalHeader context="AUTH_NAV" />
        <div className="min-h-[60dvh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#8B1538' }}></div>
            <p className="text-gray-400">Loading your account...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-32 md:pb-0 pt-20">
      {/* Premium Burgundy Background */}
      <PremiumBackground />

      {/* Universal Header */}
      <UniversalHeader context="AUTH_NAV" />

      {/* Desktop Tab Navigation */}
      <PortalNavigation
        activeSection={activeSection}
        onSectionChange={scrollToSection}
      />

      {/* Skip Link for Keyboard Navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:ring-2 focus:ring-offset-2 bg-[#8B1538] text-white"
      >
        Skip to main content
      </a>

      {/* Onboarding Wizard */}
      {shouldShowWizard() && !wizardDismissed && (
        <OnboardingWizard
          onNavigateToSection={(section) => {
            scrollToSection(section);
            setJustSignedUp(false);
          }}
        />
      )}

      {/* Full-page Sections */}
      <main id="main-content" role="main">
        {/* Dashboard Section */}
        {activeSection === 'dashboard' && (
          <PortalSection
            id="dashboard"
            title="Dashboard"
            subtitle="Your personalized overview"
            icon={<LayoutDashboard className="h-6 w-6 text-[#8B1538]" />}
            action={{
              label: 'Browse Menu',
              icon: <UtensilsCrossed className="h-4 w-4" />,
              onClick: () => navigate('/online-orders'),
            }}
          >
            <Suspense fallback={<ProfileSkeleton />}>
              <CustomerDashboard
                profile={profile}
                addresses={addresses}
                orderHistory={orderHistory}
                enrichedFavorites={enrichedFavorites}
                recommendations={recommendations}
                recommendationsLoading={recommendationsLoading}
                onReorder={handleReorder}
                onAddToCart={handleAddToCart}
                isReordering={isReordering}
                onNavigateToAddresses={() => scrollToSection('addresses')}
              />
            </Suspense>
          </PortalSection>
        )}

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <PortalSection
            id="profile"
            title="Profile"
            subtitle="Manage your account settings"
            icon={<User className="h-6 w-6 text-[#8B1538]" />}
          >
            <Suspense fallback={<ProfileSkeleton />}>
              <ProfileSection
                user={user}
                profile={profile}
                addresses={addresses}
                updateProfile={updateProfile}
                emailVerified={emailVerified}
                checkingEmailVerification={checkingEmailVerification}
                sendingVerificationEmail={sendingVerificationEmail}
                setSendingVerificationEmail={setSendingVerificationEmail}
                personalizationEnabled={personalizationEnabled}
                setPersonalizationEnabled={setPersonalizationEnabled}
                personalizationLoading={personalizationLoading}
                setPersonalizationLoading={setPersonalizationLoading}
              />
            </Suspense>
          </PortalSection>
        )}

        {/* Addresses Section */}
        {activeSection === 'addresses' && (
          <PortalSection
            id="addresses"
            title="My Addresses"
            subtitle="Manage your delivery locations"
            icon={<MapPin className="h-6 w-6 text-[#8B1538]" />}
            action={{
              label: 'Add Address',
              icon: <Plus className="h-4 w-4" />,
              onClick: () => {
                setEditingAddress(null);
                setAddressModalOpen(true);
              },
            }}
          >
            <Suspense fallback={<AddressSkeleton count={2} />}>
              <AddressesSection
                addresses={addresses}
                setDefaultAddress={setDefaultAddress}
                setEditingAddress={setEditingAddress}
                setAddressModalOpen={setAddressModalOpen}
                handleDeleteAddress={handleDeleteAddress}
              />
            </Suspense>
          </PortalSection>
        )}

        {/* Order History Section */}
        {activeSection === 'orders' && (
          <PortalSection
            id="orders"
            title="Order History"
            subtitle="View your past orders and details"
            icon={<History className="h-6 w-6 text-[#8B1538]" />}
            action={{
              label: 'Place Order',
              icon: <Plus className="h-4 w-4" />,
              onClick: () => navigate('/online-orders'),
            }}
          >
            <Suspense fallback={<OrderSkeleton count={3} />}>
              <OrdersSection
                orderHistory={orderHistory}
                isViewingCachedData={isViewingCachedData}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isReordering={isReordering}
                handleReorder={handleReorder}
                totalCount={ordersTotalCount}
                hasMore={ordersHasMore}
                isLoadingMore={ordersLoading}
                onLoadMore={handleLoadMoreOrders}
                customerId={profile?.id}
                onOrderCancelled={refreshOrderHistory}
              />
            </Suspense>
          </PortalSection>
        )}

        {/* Favorites Section */}
        {activeSection === 'favorites' && (
          <PortalSection
            id="favorites"
            title="My Favorites"
            subtitle="Quick access to your loved items"
            icon={<Heart className="h-6 w-6 text-[#8B1538]" />}
            action={{
              label: 'Browse Menu',
              icon: <UtensilsCrossed className="h-4 w-4" />,
              onClick: () => navigate('/online-orders'),
            }}
          >
            <Suspense fallback={<FavoriteSkeleton count={4} />}>
              <FavoritesSection
                enrichedFavorites={enrichedFavorites}
                favoriteLists={favoriteLists}
                selectedListId={selectedListId}
                setSelectedListId={setSelectedListId}
                setCreateListModalOpen={setCreateListModalOpen}
                setListToRename={setListToRename}
                setRenameListModalOpen={setRenameListModalOpen}
                setListToDelete={setListToDelete}
                setDeleteListModalOpen={setDeleteListModalOpen}
                handleToggleItemInList={handleToggleItemInList}
                handleAddToCart={handleAddToCart}
                handleRemoveFavorite={handleRemoveFavorite}
                loadError={favoritesError}
                onRetry={loadEnrichedFavorites}
                isLoading={favoritesLoading}
              />
            </Suspense>
          </PortalSection>
        )}
      </main>

      {/* Footer */}
      <Footer variant="minimal" />

      {/* Mobile Bottom Navigation */}
      <PortalBottomNav
        activeSection={activeSection}
        onSectionChange={scrollToSection}
      />
        
        {/* Create List Modal */}
        <Dialog open={createListModalOpen} onOpenChange={setCreateListModalOpen}>
          <DialogContent className="bg-[#17191D] border-white/10 text-[#EAECEF] max-w-[calc(100vw-2rem)] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New List</DialogTitle>
              <DialogDescription className="text-[#B7BDC6]">
                Give your list a name like "Date Night" or "Spicy Favorites"
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="List name..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                className="bg-black/20 border-white/10 text-[#EAECEF] placeholder:text-[#8B92A0]"
                autoFocus
                aria-label="Enter list name"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCreateListModalOpen(false);
                  setNewListName('');
                }}
                className="border-white/20 text-[#B7BDC6] hover:bg-white/10"
                aria-label="Cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateList}
                disabled={isCreatingList || !newListName.trim()}
                className="bg-[#8B1538] hover:bg-[#7A1230] text-white border-0"
                aria-label="Create list"
              >
                {isCreatingList ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
                ) : (
                  <><FolderPlus className="h-4 w-4 mr-2" />Create List</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Rename List Modal */}
        <Dialog open={renameListModalOpen} onOpenChange={setRenameListModalOpen}>
          <DialogContent className="bg-[#17191D] border-white/10 text-[#EAECEF] max-w-[calc(100vw-2rem)] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Rename List</DialogTitle>
              <DialogDescription className="text-[#B7BDC6]">
                Renaming "{listToRename?.name}"
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="New list name..."
                value={renameListName}
                onChange={(e) => setRenameListName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameList()}
                className="bg-black/20 border-white/10 text-[#EAECEF] placeholder:text-[#8B92A0]"
                autoFocus
                aria-label="Enter new list name"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRenameListModalOpen(false);
                  setListToRename(null);
                  setRenameListName('');
                }}
                className="border-white/20 text-[#B7BDC6] hover:bg-white/10"
                aria-label="Cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRenameList}
                disabled={isRenamingList || !renameListName.trim()}
                className="bg-[#8B1538] hover:bg-[#7A1230] text-white border-0"
                aria-label="Save changes"
              >
                {isRenamingList ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Renaming...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />Save Changes</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete List Modal */}
        <Dialog open={deleteListModalOpen} onOpenChange={setDeleteListModalOpen}>
          <DialogContent className="bg-[#17191D] border-white/10 text-[#EAECEF] max-w-[calc(100vw-2rem)] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Delete List?</DialogTitle>
              <DialogDescription className="text-[#B7BDC6]">
                Are you sure you want to delete "{listToDelete?.name}"? This won't remove the items from your favorites.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteListModalOpen(false);
                  setListToDelete(null);
                }}
                className="border-white/20 text-[#B7BDC6] hover:bg-white/10"
                aria-label="Cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteList}
                disabled={isDeletingList}
                className="bg-red-600 hover:bg-red-700 text-white border-0"
                aria-label="Delete list"
              >
                {isDeletingList ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete List'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AddressModal
          isOpen={addressModalOpen}
          onClose={() => {
            setAddressModalOpen(false);
            setEditingAddress(null);
          }}
          onSave={handleSaveAddress}
          onDelete={handleDeleteAddress}
          address={editingAddress}
        />
        
      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
        isAuthenticated={!!user}
      />
    </div>
  );
}
