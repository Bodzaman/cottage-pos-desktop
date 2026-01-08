import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, LogOut, Utensils, Image, Bot, Cog } from 'lucide-react';
import { colors, gridBackgroundStyle } from '../utils/designSystem';
import { globalColors, styles } from '../utils/QSAIDesign';
import { useSimpleAuth } from '../utils/simple-auth-context';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { Category, MenuItem } from '../utils/menuTypes';

// Import admin components directly
import AdminPortalMedia from '../components/AdminPortalMedia';
import RestaurantSettingsManager from '../components/RestaurantSettingsManager';
import AIStaffManagementHub from '../pages/AIStaffManagementHub';
import AdminPortalMenuContent from '../components/AdminPortalMenuContent';

interface AdminModalWrapperProps {
  onClose: () => void;
  onLogout?: () => void;
}

// Define the tab types
type TabType = "menu" | "media" | "ai-management" | "settings";

// Types for menu data
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

const AdminModalWrapper: React.FC<AdminModalWrapperProps> = ({ onClose, onLogout }) => {
  const { user, hasPermission } = useSimpleAuth();
  
  // State management for active tab
  const [activeTab, setActiveTab] = useState<TabType>("menu");
  
  // Menu data state for hub-first layout
  const realtimeMenuStore = useRealtimeMenuStore();
  const [menuData, setMenuData] = useState<MenuPreviewData | null>(null);
  const [menuStatus, setMenuStatus] = useState<MenuStatusData>({
    isConnected: false,
    lastSync: new Date().toISOString(),
    itemCount: 0,
    syncStatus: 'connected'
  });
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  // Handle tab change (without URL navigation)
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex">
      <div 
        className="flex h-full w-full relative"
        style={{ 
          backgroundColor: colors.background.primary, 
          color: colors.text.primary,
          background: `linear-gradient(135deg, ${colors.background.dark} 0%, ${colors.background.primary} 100%)` 
        }}
      >
        {/* Modal Header with Controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
          {onLogout && (
            <Button 
              onClick={onLogout}
              variant="outline" 
              size="sm"
              className="bg-transparent text-amber-400 border-amber-500 hover:bg-amber-900/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          )}
          <Button 
            onClick={onClose}
            size="sm"
            className="bg-opacity-30 border transition-all duration-200 hover:bg-opacity-40 font-medium" 
            style={{
              background: "rgba(124, 93, 250, 0.3)",
              border: "1px solid rgba(124, 93, 250, 0.4)",
              color: colors.text.primary,
              boxShadow: "0 2px 8px rgba(124, 93, 250, 0.2)"
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Return to POS
          </Button>
        </div>
        
        {/* Admin Content */}
        <div className="w-full h-full overflow-hidden">
          <div className="min-h-screen h-full overflow-y-auto" style={{ backgroundColor: colors.background.primary, color: colors.text.primary, ...gridBackgroundStyle }}>
            <div className="max-w-7xl mx-auto p-6 pt-16"> {/* Added pt-16 to account for header controls */}
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-4xl font-bold mb-2" style={styles.purpleGradientText}>
                      Admin Portal
                    </h1>
                    <p className="text-lg" style={{ color: colors.text.secondary }}>
                      Unified restaurant management platform
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Unified Tab Interface */}
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8" style={styles.glassCard}>
                  <TabsTrigger 
                    value="menu" 
                    className="flex items-center gap-2 data-[state=active]:bg-purple-500/20"
                  >
                    <Utensils className="h-4 w-4" />
                    Menu
                  </TabsTrigger>
                  <TabsTrigger 
                    value="media" 
                    className="flex items-center gap-2 data-[state=active]:bg-purple-500/20"
                  >
                    <Image className="h-4 w-4" />
                    Media
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ai-management" 
                    className="flex items-center gap-2 data-[state=active]:bg-purple-500/20"
                  >
                    <Bot className="h-4 w-4" />
                    AI Staff
                  </TabsTrigger>
                  <TabsTrigger 
                    value="settings" 
                    className="flex items-center gap-2 data-[state=active]:bg-purple-500/20"
                  >
                    <Cog className="h-4 w-4" />
                    Settings
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="menu" className="space-y-6">
                  <AdminPortalMenuContent />
                </TabsContent>
                
                <TabsContent value="media" className="space-y-6">
                  <AdminPortalMedia />
                </TabsContent>
                
                <TabsContent value="ai-management" className="space-y-6">
                  <AIStaffManagementHub />
                </TabsContent>
                
                <TabsContent value="settings" className="space-y-6">
                  <RestaurantSettingsManager />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminModalWrapper;
