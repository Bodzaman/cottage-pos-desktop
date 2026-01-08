import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, 
  Utensils, 
  ChefHat, 
  Phone, 
  Globe, 
  Calendar, 
  BarChart3, 
  Settings, 
  User, 
  LogOut,
  Grid3X3,
  Users,
  Coffee,
  Package,
  Truck,
  Clock,
  Wifi,
  RefreshCw,
  Cog
} from 'lucide-react';
import { useSimpleAuth } from '../utils/simple-auth-context';
import { useNavigate } from 'react-router-dom';
import { QSAITheme, styles, effects } from '../utils/QSAIDesign';
import { POSViewType } from './POSViewContainer';
import type { OrderType } from '../utils/masterTypes';

interface POSSidebarProps {
  activeView: POSViewType;
  onViewChange: (view: POSViewType) => void;
  orderType: OrderType;
  onOrderTypeChange: (type: OrderType) => void;
  selectedTableNumber: number | null;
  onTableSelect: (tableNumber: number | null) => void;
  onlineOrdersCount?: number;
  className?: string;
  // Add props for real table data
  tables?: Array<{
    tableNumber: number;
    status: 'AVAILABLE' | 'SEATED' | 'ORDERED' | 'BILL_REQUESTED' | 'PAYMENT_PROCESSING' | 'PAYMENT_COMPLETE';
    capacity: number;
    guestCount?: number;
  }>;
}

interface TableData {
  number: number;
  status: 'available' | 'occupied' | 'reserved';
  guestCount?: number;
  orderValue?: number;
}

export function POSSidebar({
  activeView,
  onViewChange,
  orderType,
  onOrderTypeChange,
  selectedTableNumber,
  onTableSelect,
  onlineOrdersCount = 0,
  className = '',
  tables = []
}: POSSidebarProps) {
  const { user, signOut } = useSimpleAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Convert database tables to sidebar format
  const sidebarTables: TableData[] = tables.slice(0, 25).map(table => ({
    number: table.tableNumber,
    status: table.status === 'AVAILABLE' ? 'available' : 
            table.status === 'SEATED' || table.status === 'ORDERED' ? 'occupied' : 'reserved',
    guestCount: table.guestCount || 1
  }));

  // Navigation items with icons and badges
  const navigationItems = [
    {
      id: 'pos' as POSViewType,
      label: 'POS',
      icon: Store,
      isActive: activeView === 'pos',
      badge: undefined
    },
    {
      id: 'kitchen' as POSViewType,
      label: 'Kitchen',
      icon: ChefHat,
      isActive: activeView === 'kitchen',
      badge: undefined // TODO: Add kitchen orders count
    },
    {
      id: 'online-orders' as POSViewType,
      label: 'Online Orders',
      icon: Globe,
      isActive: activeView === 'online-orders',
      badge: onlineOrdersCount > 0 ? onlineOrdersCount.toString() : undefined
    },
    {
      id: 'reservations' as POSViewType,
      label: 'Reservations',
      icon: Calendar,
      isActive: activeView === 'reservations',
      badge: undefined
    },
    {
      id: 'reconciliation' as POSViewType,
      label: 'All Orders',
      icon: BarChart3,
      isActive: activeView === 'reconciliation',
      badge: undefined
    },
    {
      id: 'admin' as POSViewType,
      label: 'Admin',
      icon: Settings,
      isActive: activeView === 'admin',
      badge: undefined
    }
  ];

  // Order type options with refined styling
  const orderTypeOptions = [
    { id: 'DINE-IN' as OrderType, label: 'Dine-In', icon: Utensils, color: '#7C5DFA' },
    { id: 'COLLECTION' as OrderType, label: 'Collection', icon: Package, color: '#0EBAB1' },
    { id: 'DELIVERY' as OrderType, label: 'Delivery', icon: Truck, color: '#F59E0B' },
    { id: 'WAITING' as OrderType, label: 'Waiting', icon: Clock, color: '#EF4444' }
  ];

  const handleNavigationClick = (viewId: POSViewType) => {
    onViewChange(viewId);
  };

  const handleOrderTypeChange = (newOrderType: OrderType) => {
    onOrderTypeChange(newOrderType);
  };

  const getTableStatusColor = (status: TableData['status']) => {
    switch (status) {
      case 'available': return '#10B981'; // Green
      case 'occupied': return '#EF4444'; // Red
      case 'reserved': return '#F59E0B'; // Amber
      default: return '#6B7280'; // Gray
    }
  };

  const getTableStatusLabel = (status: TableData['status']) => {
    switch (status) {
      case 'available': return 'Available';
      case 'occupied': return 'Occupied';
      case 'reserved': return 'Reserved';
      default: return 'Unknown';
    }
  };

  return (
    <div 
      className={`h-full flex flex-col transition-all duration-300 ease-in-out ${className}`}
      style={{
        width: isCollapsed ? '80px' : '280px',
        background: QSAITheme.background.panel,
        borderRight: `1px solid ${QSAITheme.border.light}`,
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.15)'
      }}
    >
      {/* Header with branding */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.dark} 100%)`,
                  boxShadow: `0 4px 8px ${QSAITheme.purple.glow}`
                }}
              >
                <Store className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 
                  className="text-lg font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, white 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Cottage Tandoori
                </h1>
                <p className="text-xs text-gray-400">POS System</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              <RefreshCw className="h-4 w-4" />
            </motion.div>
          </Button>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 p-3">
        {!isCollapsed && <h2 className="text-sm font-medium text-gray-400 mb-3 px-2">Navigation</h2>}
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start h-10 px-3 transition-all duration-200 ${item.isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                style={{
                  background: item.isActive 
                    ? `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.dark} 100%)`
                    : 'transparent',
                  boxShadow: item.isActive ? `0 4px 8px ${QSAITheme.purple.glow}` : 'none'
                }}
                onClick={() => handleNavigationClick(item.id)}
              >
                <IconComponent className="h-4 w-4" />
                {!isCollapsed && (
                  <>
                    <span className="ml-3 flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <Badge 
                        className="ml-2 h-5 px-2 text-xs font-medium"
                        style={{
                          background: item.isActive ? 'rgba(255, 255, 255, 0.2)' : QSAITheme.purple.primary,
                          color: 'white'
                        }}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            );
          })}
        </div>

        {/* Order Type Selector */}
        {!isCollapsed && activeView === 'pos' && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-400 mb-3 px-2">Order Type</h2>
            <div className="space-y-1">
              {orderTypeOptions.map((option) => {
                const IconComponent = option.icon;
                const isActive = orderType === option.id;
                return (
                  <Button
                    key={option.id}
                    variant="ghost"
                    className={`w-full justify-start h-9 px-3 transition-all duration-200 ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                    style={{
                      background: isActive 
                        ? `linear-gradient(135deg, ${option.color} 0%, ${option.color}CC 100%)`
                        : 'transparent',
                      boxShadow: isActive ? `0 2px 6px ${option.color}40` : 'none'
                    }}
                    onClick={() => handleOrderTypeChange(option.id)}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="ml-3">{option.label}</span>
                    {isActive && orderType === 'DINE-IN' && selectedTableNumber && (
                      <Badge className="ml-auto h-5 px-2 text-xs" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
                        T{selectedTableNumber}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Table Selection (only for DINE-IN orders) */}
        {!isCollapsed && activeView === 'pos' && orderType === 'DINE-IN' && (
          <div className="mt-6">
            <ScrollArea className="h-64">
              <div className="grid grid-cols-4 gap-2 px-1">
                {sidebarTables.map((table) => {
                  const isSelected = selectedTableNumber === table.number;
                  const statusColor = getTableStatusColor(table.status);
                  return (
                    <motion.button
                      key={table.number}
                      className={`relative h-12 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${isSelected ? 'ring-2 ring-purple-400' : ''}`}
                      style={{
                        backgroundColor: isSelected ? QSAITheme.purple.primary : 'rgba(30, 30, 30, 0.8)',
                        borderColor: statusColor,
                        color: isSelected ? 'white' : statusColor
                      }}
                      onClick={() => onTableSelect(isSelected ? null : table.number)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="text-xs font-medium">{table.number}</div>
                      {table.status === 'occupied' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* User Profile Section */}
      <div className="p-3 border-t border-white/10">
        {!isCollapsed && (
          <div className="flex items-center space-x-3 mb-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.dark} 100%)` }}
            >
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-400">Staff Member</p>
            </div>
          </div>
        )}
        <div className={`${isCollapsed ? 'flex flex-col space-y-1' : 'flex space-x-2'}`}>
          <Button
            variant="ghost"
            size={isCollapsed ? 'icon' : 'sm'}
            className="text-gray-400 hover:text-white"
            onClick={() => navigate('/customer-portal')}
          >
            <Cog className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Settings</span>}
          </Button>
          <Button
            variant="ghost"
            size={isCollapsed ? 'icon' : 'sm'}
            className="text-gray-400 hover:text-red-300"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}
