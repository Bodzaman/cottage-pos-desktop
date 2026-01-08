import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock, FaHeart, FaShoppingBag, FaEdit, FaSignOutAlt, FaUtensils } from "react-icons/fa";
import { AuthLayout } from "components/AuthLayout";
import { AuthTheme } from "utils/authTheme";
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
import { apiClient } from 'app';
import { ArrowLeft, LogOut, User, MapPin, History, Heart, Edit, Plus, Trash2, Mail, Phone, Flame, ShoppingBag, Clock, ShoppingCart, Bot, CheckCircle2, AlertCircle, Send, Loader2, Check, Navigation, Settings as SettingsIcon, Edit2, Save, X, XCircle, Calendar, Search, Filter, Package, RotateCcw, Upload, UtensilsCrossed, FolderPlus, FolderEdit, Share2, List, MoreVertical } from "lucide-react";
import { ProfileImageUpload } from "components/ProfileImageUpload";
import { AddressModal } from "components/AddressModal";
import MiniMapPreview from "components/MiniMapPreview";
import { EnrichedFavoriteItem, EnrichedFavoritesResponse } from "types";
import { InlineEditField } from "components/InlineEditField";
import { calculateProfileCompletion, getCompletionColor, getCompletionMessage } from "utils/profileCompletion";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from 'date-fns';
import { WelcomeTour } from "components/WelcomeTour";
import { OnboardingWizard } from "components/OnboardingWizard";
import { useOnboardingStore } from "utils/onboardingStore";
import { useGlobalKeyboardShortcuts } from "utils/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "components/KeyboardShortcutsHelp";
import { VisuallyHidden } from "components/VisuallyHidden";
import { useIsMobile } from "utils/useMediaQuery";
import { useOfflineSync } from "utils/useOfflineSync";
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
type CustomerSection = 'profile' | 'addresses' | 'orders' | 'favorites';

// Lazy load section components for better performance
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
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  
  // Additional state for CustomerPortal
  const [activeSection, setActiveSection] = useState<CustomerSection>('profile');
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  
  // NEW: Track if data is from cache
  const [isViewingCachedData, setIsViewingCachedData] = useState(false);
  
  // NEW: Filter and search state for order history
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');  
  const [isReordering, setIsReordering] = useState<string | null>(null);
  
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
        const response = await apiClient.get_personalization_settings({ customer_id: profile.id });
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
      const response = await apiClient.update_personalization_settings({
        customer_id: profile.id,
        personalization_enabled: enabled
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
        const response = await apiClient.get_email_verification_status({ userId: profile.id });
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
      const response = await apiClient.send_verification_email({ user_id: profile.id });
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
    try {
      console.log('🔄 Calling apiClient.get_enriched_favorites with customer_id:', profile.id);
      const response = await apiClient.get_enriched_favorites({ customer_id: profile.id });
      console.log('📡 API Response Status:', response.status);
      
      const data: EnrichedFavoritesResponse = await response.json();
      console.log('📦 API Response Data:', data);
      
      if (data.success) {
        console.log('✅ Setting enriched favorites:', data.favorites.length, 'items');
        setEnrichedFavorites(data.favorites);
      } else {
        console.log('❌ API returned success=false:', data.message);
        toast.error('Failed to load favorites');
      }
    } catch (error) {
      console.error('❌ Error loading enriched favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setFavoritesLoading(false);
    }
  };
  
  // Load enriched favorites when favorites change
  useEffect(() => {
    console.log('🔍 Favorites effect triggered:', { 
      favoritesLength: favorites.length, 
      userId: profile?.id,
      favorites: favorites 
    });
    
    // Always try to load enriched favorites if user is logged in
    // Don't depend on SimpleAuth favorites as they might not be synced
    if (profile?.id) {
      console.log('📡 Loading enriched favorites for user:', profile.id);
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
        console.log('✅ Profile image URL successfully saved to database');
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
          
          // Load order history
          const ordersResponse = await apiClient.get_order_history({ customerId: user.id });
          const ordersData = await ordersResponse.json();
          const orders = ordersData?.orders || [];
          setOrderHistory(orders);
          
          // Cache for offline use
          cacheOrders(orders);
          console.log('📦 Cached orders for offline viewing');
        } catch (error) {
          console.error('Error loading user data:', error);
          
          // Fallback to cached data on error
          const cachedOrders = getCachedOrders();
          if (cachedOrders) {
            console.log('📱 Using cached orders after error');
            setOrderHistory(cachedOrders);
            setIsViewingCachedData(true);
          }
        }
      } else {
        // OFFLINE: Use cached data
        console.log('📡 Offline - loading cached data');
        
        const cachedOrders = getCachedOrders();
        if (cachedOrders) {
          console.log(`📱 Loaded ${cachedOrders.length} orders from cache`);
          setOrderHistory(cachedOrders);
          setIsViewingCachedData(true);
        } else {
          console.log('⚠️ No cached orders available');
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
      console.log('📦 Cached profile for offline viewing');
    }
  }, [profile, isOnline]);
  
  // Cache addresses when they load/change
  useEffect(() => {
    if (addresses && addresses.length > 0 && isOnline) {
      cacheAddresses(addresses);
      console.log('📦 Cached addresses for offline viewing');
    }
  }, [addresses, isOnline]);
  
  // Clear cache on logout
  useEffect(() => {
    if (!user) {
      clearCache();
      console.log('🗑️ Cleared offline cache on logout');
    }
  }, [user]);

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
  
  // NEW: Reorder handler
  const handleReorder = async (order: any) => {
    if (!order.order_items || order.order_items.length === 0) {
      toast.error('This order has no items to reorder');
      return;
    }
    
    setIsReordering(order.id);
    
    try {
      let addedCount = 0;
      const warnings: string[] = [];
      
      // Add each item from the order to the cart
      for (const item of order.order_items) {
        try {
          addItem({
            id: item.menu_item_id || `item-${Date.now()}-${addedCount}`,
            name: item.menu_item_name,
            price: item.price,
            quantity: item.quantity,
            variant: item.variant_name || undefined,
            customizations: item.customizations || []
          });
          addedCount++;
        } catch (error) {
          warnings.push(`Could not add ${item.menu_item_name}`);
        }
      }
      
      if (addedCount > 0) {
        toast.success(`Added ${addedCount} item${addedCount > 1 ? 's' : ''} to cart!`, {
          description: 'Navigate to the menu to review and checkout',
          action: {
            label: 'View Cart',
            onClick: () => openCart()
          }
        });
        
        if (warnings.length > 0) {
          setTimeout(() => {
            toast.warning(`Some items couldn't be added`, {
              description: warnings.join(', ')
            });
          }, 500);
        }
      } else {
        toast.error('Failed to add items to cart');
      }
    } catch (error) {
      console.error('Reorder error:', error);
      toast.error('Failed to reorder');
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
      const cartItem = {
        id: favorite.menu_item_id,
        name: favorite.display_name,
        price: favorite.display_price || 0,
        image: favorite.display_image_url || '/placeholder-food.jpg',
        description: favorite.display_description || '',
        spiceLevel: favorite.display_spice_level,
        dietary: favorite.dietary_info || [],
        variantId: favorite.variant_id || null,
        variantName: favorite.variant_name || null
      };
      
      addItem(cartItem, 1);
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

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: AuthTheme.colors.primary }}></div>
            <p style={{ color: AuthTheme.colors.textSecondary }}>Loading your account...</p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Skip Link for Keyboard Navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:ring-2 focus:ring-offset-2"
        style={{
          backgroundColor: AuthTheme.colors.primary,
          color: '#FFFFFF',
          ringColor: AuthTheme.colors.primary
        }}
      >
        Skip to main content
      </a>

      {/* Onboarding Wizard */}
      {shouldShowWizard() && !wizardDismissed && (
        <OnboardingWizard
          onNavigateToSection={(section) => {
            setActiveSection(section as CustomerSection);
            setJustSignedUp(false); // Clear flag after wizard interaction
          }}
        />
      )}

      {/* Page Header */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <motion.div 
          className="text-center mb-8"
          initial="hidden"
          animate="visible"
          variants={AuthTheme.animations.containerFade}
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex-1"></div>
            <h1 className="flex-1 text-3xl font-semibold tracking-tight" style={{ color: AuthTheme.colors.textPrimary }}>
              My Account
            </h1>
            <div className="flex-1 flex justify-end">
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-white/5 transition-colors"
                aria-label="Sign out of your account"
              >
                <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                Sign Out
              </Button>
            </div>
          </div>
          <p style={{ color: AuthTheme.colors.textSecondary }}>
            Welcome back, {profile?.first_name || 'Guest'}! Manage your profile, addresses, and order history.
          </p>
        </motion.div>

        {/* Navigation Tabs - Responsive */}
        <nav 
          className="flex justify-center mb-8"
          aria-label="Account sections"
          role="navigation"
        >
          {isMobile ? (
            /* Mobile: Dropdown Selector */
            <div className="w-full max-w-md px-4">
              <label htmlFor="section-select" className="sr-only">
                Choose account section
              </label>
              <select
                id="section-select"
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value as CustomerSection)}
                className="w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-offset-2 appearance-none bg-no-repeat bg-right pr-10"
                style={{
                  background: `${AuthTheme.colors.cardBg} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23B7BDC6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 0.75rem center/1.5em 1.5em`,
                  borderColor: AuthTheme.colors.border,
                  color: AuthTheme.colors.textPrimary,
                  ringColor: AuthTheme.colors.primary,
                  minHeight: '44px' // Accessibility: touch target
                }}
                aria-label="Select account section to view"
              >
                <option value="profile">👤 Profile</option>
                <option value="addresses">📍 Addresses</option>
                <option value="orders">📜 Order History</option>
                <option value="favorites">❤️ Favorites</option>
              </select>
            </div>
          ) : (
            /* Desktop: Horizontal Tabs */
            <div 
              className="rounded-2xl border backdrop-blur-xl p-2 shadow-2xl relative overflow-hidden"
              style={{ 
                background: AuthTheme.colors.cardBg,
                borderColor: AuthTheme.colors.border
              }}
              role="tablist"
              aria-label="Account navigation"
            >
              <div 
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ background: AuthTheme.gradients.border }}
                aria-hidden="true"
              />
              <div className="relative z-10 flex gap-2">
                {[
                  { id: 'profile', label: 'Profile', icon: User, tourAttr: 'tour-profile', ariaLabel: 'View and edit your profile information' },
                  { id: 'addresses', label: 'Addresses', icon: MapPin, tourAttr: 'tour-addresses', ariaLabel: 'Manage your delivery addresses' },
                  { id: 'orders', label: 'Order History', icon: History, tourAttr: 'tour-orders', ariaLabel: 'View your past orders' },
                  { id: 'favorites', label: 'Favorites', icon: Heart, tourAttr: 'tour-favorites', ariaLabel: 'Browse your favorite menu items' },
                ].map(({ id, label, icon: Icon, tourAttr, ariaLabel }) => (
                  <button
                    key={id}
                    data-tour={tourAttr}
                    onClick={() => setActiveSection(id as CustomerSection)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{
                      background: activeSection === id ? AuthTheme.colors.primary : 'transparent',
                      color: activeSection === id ? '#FFFFFF' : AuthTheme.colors.textSecondary,
                      boxShadow: activeSection === id ? AuthTheme.shadows.glow : 'none',
                      ringColor: AuthTheme.colors.primary
                    }}
                    role="tab"
                    aria-selected={activeSection === id}
                    aria-controls={`${id}-section`}
                    aria-label={ariaLabel}
                    tabIndex={activeSection === id ? 0 : -1}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {label}
                    <VisuallyHidden>
                      {activeSection === id ? '(Current section)' : ''}
                    </VisuallyHidden>
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Active Section Content with Glassmorphism */}
        <main
          id="main-content"
          className="rounded-2xl border backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden max-w-4xl mx-auto"
          style={{
            background: AuthTheme.colors.cardBg,
            borderColor: AuthTheme.colors.border
          }}
          role="main"
          aria-label="Account content"
        >
          {/* Border glow effect */}
          <div 
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: AuthTheme.gradients.border }}
            aria-hidden="true"
          />
          
          {/* Section Content */}
          <div className="relative z-10">
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <section id="profile-section" role="tabpanel" aria-labelledby="profile-tab">
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
              </section>
            )}

            {/* Addresses Section */}
            {activeSection === 'addresses' && (
              <section id="addresses-section" role="tabpanel" aria-labelledby="addresses-tab">
                <Suspense fallback={<AddressSkeleton count={2} />}>
                  <AddressesSection
                    addresses={addresses}
                    setEditingAddress={setEditingAddress}
                    setAddressModalOpen={setAddressModalOpen}
                  />
                </Suspense>
              </section>
            )}

            {/* Order History Section */}
            {activeSection === 'orders' && (
              <section id="orders-section" role="tabpanel" aria-labelledby="orders-tab">
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
                  />
                </Suspense>
              </section>
            )}

            {/* Favorites Section */}
            {activeSection === 'favorites' && (
              <section id="favorites-section" role="tabpanel" aria-labelledby="favorites-tab">
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
                  />
                </Suspense>
              </section>
            )}
          </div>
        </main>
        
        {/* Create List Modal */}
        <Dialog open={createListModalOpen} onOpenChange={setCreateListModalOpen}>
          <DialogContent className="bg-[#17191D] border-white/10 text-[#EAECEF]">
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
          <DialogContent className="bg-[#17191D] border-white/10 text-[#EAECEF]">
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
          <DialogContent className="bg-[#17191D] border-white/10 text-[#EAECEF]">
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
    </AuthLayout>
  );
}
