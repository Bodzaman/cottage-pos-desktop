import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Globe, 
  Monitor, 
  Bot, 
  Edit3, 
  Clock, 
  Wifi, 
  WifiOff,
  ChefHat,
  Smartphone,
  Users,
  Package,
  Hash,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  globalColors as colors,
  styles,
  effects,
} from "utils/QSAIDesign";
import POSSystemCard from "./POSSystemCard";
import VoiceAgentCard from "./VoiceAgentCard";
import OnlineOrdersCard from "./OnlineOrdersCard";

// Define TypeScript interfaces for our data structures
interface MenuItem {
  id: string;
  name: string;
  description: string;
  category_id: string;
  price: number;
  active: boolean;
  featured: boolean;
  spice_indicators: string[];
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  display_order: number;
  parent_category_id: string | null;
  created_at: string;
  updated_at: string;
}

interface MenuPreviewData {
  categories: Category[];
  menuItems: MenuItem[];
  lastUpdated: string;
  totalItems: number;
  activeItems: number;
}

interface MenuStatusData {
  isConnected: boolean;
  lastSync: string;
  itemCount: number;
  syncStatus: 'connected' | 'syncing' | 'error';
}

// Main Multi-Channel Menu Dashboard Component
const MultiChannelMenuDashboard: React.FC = () => {
  const navigate = useNavigate();
  const realtimeMenuStore = useRealtimeMenuStore();
  const [menuData, setMenuData] = useState<MenuPreviewData | null>(null);
  const [menuStatus, setMenuStatus] = useState<MenuStatusData>({
    isConnected: false,
    lastSync: new Date().toISOString(),
    itemCount: 0,
    syncStatus: 'connected'
  });
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to get minimum price for an item
  const getItemMinPrice = (itemId: string): string | null => {
    const variants = realtimeMenuStore.itemVariants.filter(v => v.menu_item_id === itemId && v.active);
    if (variants.length === 0) return null; // No fallback - return null when no data
    const minPrice = Math.min(...variants.map(v => v.price));
    return minPrice.toFixed(2);
  };

  // Helper function to get formatted price display
  const getPriceDisplay = (itemId: string): string => {
    const variants = realtimeMenuStore.itemVariants.filter(v => v.menu_item_id === itemId && v.active);
    if (variants.length === 0) return null; // No fallback - return null when no data
    if (variants.length === 1) return `£${variants[0].price.toFixed(2)}`;
    
    const prices = variants.map(v => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      return `£${minPrice.toFixed(2)}`;
    }
    
    return `From £${minPrice.toFixed(2)}`;
  };

  // Initialize and load menu data
  useEffect(() => {
    loadMenuData();
  }, []);

  // Subscribe to real-time menu store changes
  useEffect(() => {
    if (realtimeMenuStore.categories.length > 0 || realtimeMenuStore.menuItems.length > 0) {
      updateMenuDataFromStore();
    }
  }, [realtimeMenuStore.categories, realtimeMenuStore.menuItems, realtimeMenuStore.isConnected]);

  const loadMenuData = async () => {
    try {
      setIsLoading(true);
      
      // Initialize the real-time store if not already done
      if (!realtimeMenuStore.isConnected && realtimeMenuStore.categories.length === 0) {
        await realtimeMenuStore.initialize();
      }
      
      // Update with current store data
      updateMenuDataFromStore();
      
    } catch (error) {
      console.error('Error loading menu data:', error);
      toast.error('Failed to load menu data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateMenuDataFromStore = () => {
    const { categories, menuItems, isConnected, lastUpdate } = realtimeMenuStore;
    
    const activeItems = menuItems.filter(item => item.active);
    
    setMenuData({
      categories,
      menuItems: activeItems,
      lastUpdated: new Date(lastUpdate || Date.now()).toISOString(),
      totalItems: menuItems.length,
      activeItems: activeItems.length
    });
    
    setMenuStatus({
      isConnected,
      lastSync: new Date(lastUpdate || Date.now()).toISOString(),
      itemCount: activeItems.length,
      syncStatus: isConnected ? 'connected' : 'error'
    });
  };

  const handleEditMenu = () => {
    navigate('/admin-menu');
  };

  const formatLastUpdate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Three-Card Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Online Orders Preview */}
        <OnlineOrdersCard 
          menuData={menuData}
          isLoading={isLoading}
          formatLastUpdate={formatLastUpdate}
        />
        
        {/* Card 2: POS System Preview */}
        <POSSystemCard 
          menuData={menuData}
          menuStatus={menuStatus}
          isLoading={isLoading}
        />
        
        {/* Card 3: AI Voice Hub */}
        <VoiceAgentCard />
      </div>
    </div>
  );
};

export default MultiChannelMenuDashboard;
