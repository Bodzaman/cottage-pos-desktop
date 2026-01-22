


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Clock, ChefHat, CheckCircle, CheckSquare, Bell, AlertTriangle, ArrowUpRight, Settings, Utensils, Package, Truck, RotateCw, X, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TableOrder, TableOrderItem, TableStatus } from "../utils/tableTypes";
import { toast } from "sonner";
import { kitchenService, KitchenOrder, KitchenOrderStatus } from "../utils/kitchenService";
import { colors, cardStyle } from "../utils/designSystem";
import { POSViewProps } from "./POSViewContainer";
import { SafeDate } from "../utils";

// Item status colors for visual indication
const getStatusColor = (status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED') => {
  switch (status) {
    case 'NEW': return 'bg-amber-500 text-black';
    case 'PREPARING': return 'bg-orange-500 text-white';
    case 'READY': return 'bg-green-500 text-white';
    case 'SERVED': return 'bg-blue-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

// Order type icons
const getOrderTypeIcon = (orderType: string) => {
  switch (orderType) {
    case 'DINE-IN': return <Utensils className="h-5 w-5" />;
    case 'COLLECTION': return <Package className="h-5 w-5" />;
    case 'DELIVERY': return <Truck className="h-5 w-5" />;
    case 'WAITING': return <Clock className="h-5 w-5" />;
    default: return <Utensils className="h-5 w-5" />;
  }
};

// Animation variants for smooth transitions
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

// Pulse animation for urgent items
const pulseAnimation = {
  initial: { opacity: 0.7 },
  animate: { 
    opacity: 1,
    transition: { 
      repeat: Infinity, 
      repeatType: "reverse", 
      duration: 1.2 
    }
  }
};

export function KitchenView({ onBack }: POSViewProps) {
  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING'>('ALL');
  const [statusFilter, setStatusFilter] = useState<KitchenOrderStatus | 'ALL'>('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [serverLastUpdated, setServerLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  
  // Init with loading state and fetch data
  useEffect(() => {
    // Initial data load
    fetchKitchenOrders();
    
    // Use subscription for updates instead of polling
    const handleRefreshKitchen = () => {
      fetchKitchenOrders();
      // Update the server timestamp
      setServerLastUpdated(new Date());
    };
    
    // Listen for refresh events
    document.addEventListener('refresh-kitchen', handleRefreshKitchen);
    
    // Subscribe to kitchen service for real-time updates
    const unsubscribe = kitchenService.subscribe(orders => {
      setKitchenOrders(orders);
      setServerLastUpdated(new Date());
      setLoading(false);
    });
    
    // Get fullscreen status from local storage
    const savedFullscreen = localStorage.getItem('kds-fullscreen');
    if (savedFullscreen) {
      setIsFullscreen(savedFullscreen === 'true');
    }
    
    return () => {
      document.removeEventListener('refresh-kitchen', handleRefreshKitchen);
      unsubscribe();
    };
  }, []);
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    const newState = !isFullscreen;
    setIsFullscreen(newState);
    localStorage.setItem('kds-fullscreen', newState.toString());
  };
  
  // Load kitchen orders
  const fetchKitchenOrders = async () => {
    try {
      setLoading(true);
      
      // Get orders from kitchen service
      kitchenService.syncWithPOS();
      setLoading(false);
      
    } catch (error) {
      console.error('Error fetching kitchen orders:', error);
      toast.error('Failed to load kitchen orders');
      setLoading(false);
    }
  };
  
  // Mark order as delayed (update status)
  const markOrderDelayed = (orderId: string) => {
    const success = kitchenService.updateOrderStatus(orderId, 'DELAYED');
    
    if (success) {
      toast.warning(`Order marked as delayed - kitchen alerted`);
      // Refresh orders from the service (should happen via subscription)
    } else {
      toast.error('Failed to mark order as delayed');
    }
  };
  
  // Function to handle marking order as completed
  const markOrderCompleted = (orderId: string) => {
    const success = kitchenService.updateOrderStatus(orderId, 'COMPLETED');
    
    if (success) {
      toast.success(`Order completed and removed from active queue`);
      // Refresh orders from the service (though this should happen via subscription)
    } else {
      toast.error('Failed to complete order');
    }
  };
  
  // Filter orders based on filters
  const filteredOrders = kitchenOrders
    .filter(order => {
      // Filter by order type
      if (activeFilter !== 'ALL' && order.orderType !== activeFilter) {
        return false;
      }
      
      // Filter by status
      if (statusFilter !== 'ALL' && order.status !== statusFilter) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by urgency first
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      
      // Then by waiting time (longest waiting first)
      return b.waitingTime - a.waitingTime;
    });
  
  // Get priority color based on waiting time and order type
  const getPriorityBorderColor = (order: KitchenOrder): string => {
    const colorName = kitchenService.getWaitingTimeColor(order.waitingTime, order.orderType);
    
    switch (colorName) {
      case 'red': return 'border-red-500';
      case 'orange': return 'border-orange-500';
      case 'amber': return 'border-amber-500';
      case 'yellow': return 'border-yellow-500';
      case 'green': return 'border-green-500';
      default: return 'border-gray-500';
    }
  };
  
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* KDS Content Header */}
      <header className="p-4 shadow-lg sticky top-0 z-10 border-b"
              style={{ 
                background: colors.background.secondary,
                borderBottomColor: colors.border.light
              }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center">
            <div className="relative mr-2">
              <ChefHat className="h-8 w-8" style={{ color: colors.brand.purple }} />
              <div 
                className="absolute -inset-1 blur-sm rounded-full -z-10"
                style={{ backgroundColor: `${colors.brand.purple}20` }}
              ></div>
            </div>
            <h1 className="text-2xl font-bold">Kitchen</h1>
            <span className="ml-3 text-sm" style={{ color: colors.text.secondary }}>
              Updated: <SafeDate date={serverLastUpdated} format="time" />
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            {/* Status filter */}
            <Tabs defaultValue="ALL" className="w-auto">
              <TabsList style={{ backgroundColor: colors.background.tertiary }}>
                <TabsTrigger 
                  value="ALL" 
                  onClick={() => setStatusFilter('ALL')}
                  style={{ 
                    backgroundColor: statusFilter === 'ALL' ? colors.background.highlight : 'transparent'
                  }}
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="PREPARING" 
                  onClick={() => setStatusFilter('PREPARING')}
                  style={{ 
                    backgroundColor: statusFilter === 'PREPARING' ? `${colors.brand.blue}40` : 'transparent' 
                  }}
                >
                  Preparing
                </TabsTrigger>
                <TabsTrigger 
                  value="DELAYED" 
                  onClick={() => setStatusFilter('DELAYED')}
                  style={{ 
                    backgroundColor: statusFilter === 'DELAYED' ? `${colors.status.warning}40` : 'transparent' 
                  }}
                >
                  Delayed
                </TabsTrigger>
                <TabsTrigger 
                  value="READY" 
                  onClick={() => setStatusFilter('READY')}
                  style={{ 
                    backgroundColor: statusFilter === 'READY' ? `${colors.status.success}40` : 'transparent' 
                  }}
                >
                  Ready
                </TabsTrigger>
                <TabsTrigger 
                  value="COMPLETED" 
                  onClick={() => setStatusFilter('COMPLETED')}
                  style={{ 
                    backgroundColor: statusFilter === 'COMPLETED' ? colors.background.highlight : 'transparent' 
                  }}
                >
                  Completed
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Action buttons */}
            <div className="flex gap-2 ml-auto">
              <Button 
                variant="outline" 
                size="sm"
                style={{ 
                  backgroundColor: colors.background.tertiary,
                  color: colors.text.primary,
                  borderColor: colors.border.light
                }} 
                onClick={fetchKitchenOrders}
                disabled={loading}
              >
                <RotateCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                style={{ 
                  backgroundColor: colors.background.tertiary,
                  color: colors.text.primary,
                  borderColor: colors.border.light
                }}
                onClick={toggleFullscreen}
              >
                {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Order type filter tabs */}
      <div className="px-4 py-2 sticky top-[76px] md:top-[68px] z-10 shadow-lg border-t border-b border-opacity-20"
           style={{ 
             backgroundColor: colors.background.secondary,
             borderColor: colors.border.light
           }}>
        <Tabs defaultValue="ALL" className="w-full">
          <TabsList 
            className="w-full h-auto flex justify-start overflow-x-auto p-1 hide-scrollbar"
            style={{ backgroundColor: colors.background.tertiary }}
          >
            <TabsTrigger 
              value="ALL" 
              onClick={() => setActiveFilter('ALL')}
              className="flex-shrink-0"
              style={{ 
                backgroundColor: activeFilter === 'ALL' ? colors.background.highlight : 'transparent' 
              }}
            >
              All Orders
            </TabsTrigger>
            <TabsTrigger 
              value="DINE-IN" 
              onClick={() => setActiveFilter('DINE-IN')}
              className="flex-shrink-0"
              style={{ 
                backgroundColor: activeFilter === 'DINE-IN' ? `${colors.brand.purple}40` : 'transparent' 
              }}
            >
              <Utensils className="h-4 w-4 mr-1" />
              Dine-In
            </TabsTrigger>
            <TabsTrigger 
              value="COLLECTION" 
              onClick={() => setActiveFilter('COLLECTION')}
              className="flex-shrink-0"
              style={{ 
                backgroundColor: activeFilter === 'COLLECTION' ? `${colors.brand.purple}40` : 'transparent' 
              }}
            >
              <Package className="h-4 w-4 mr-1" />
              Collection
            </TabsTrigger>
            <TabsTrigger 
              value="DELIVERY" 
              onClick={() => setActiveFilter('DELIVERY')}
              className="flex-shrink-0"
              style={{ 
                backgroundColor: activeFilter === 'DELIVERY' ? `${colors.brand.purple}40` : 'transparent' 
              }}
            >
              <Truck className="h-4 w-4 mr-1" />
              Delivery
            </TabsTrigger>
            <TabsTrigger 
              value="WAITING" 
              onClick={() => setActiveFilter('WAITING')}
              className="flex-shrink-0"
              style={{ 
                backgroundColor: activeFilter === 'WAITING' ? `${colors.status.error}40` : 'transparent' 
              }}
            >
              <Clock className="h-4 w-4 mr-1" />
              Waiting
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
        
      {/* Main content with orders - optimized for touch on tablets */}
      <main className="flex-1 p-2 md:p-4 overflow-auto touch-manipulation">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <ChefHat 
                className="h-12 w-12 animate-pulse" 
                style={{ color: `${colors.text.tertiary}` }} 
              />
              <p 
                className="mt-4" 
                style={{ color: colors.text.secondary }}
              >
                Loading orders...
              </p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 py-20">
            <div className="flex flex-col items-center">
              <ChefHat 
                className="h-16 w-16 mb-4 opacity-30" 
                style={{ color: colors.text.tertiary }} 
              />
              <h2 className="text-xl font-medium mb-2">No Active Orders</h2>
              <p 
                className="text-center max-w-md" 
                style={{ color: colors.text.secondary }}
              >
                When orders are sent to the kitchen, they will appear here.
              </p>
            </div>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {filteredOrders.map((order) => (
                <motion.div
                  key={order.orderId}
                  variants={itemVariants}
                  exit="exit"
                  layout
                  className={`rounded-lg overflow-hidden ${getPriorityBorderColor(order)} border-2 shadow-md`}
                  style={{ ...cardStyle }}
                >
                  {/* Order header with status */}
                  <div 
                    className="p-3 flex justify-between items-center"
                    style={{ backgroundColor: getOrderStatusBackground(order.status) }}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-md bg-black/30">
                        {getOrderTypeIcon(order.orderType)}
                      </div>
                      <div>
                        <span className="font-medium text-lg">
                          {order.orderType === 'DINE-IN' ? `Table ${order.tableNumber}` : order.orderType}
                        </span>
                        {order.customerName && (
                          <span className="ml-2 text-sm opacity-80">{order.customerName}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Priority indicator */}
                      <div className="flex items-center px-2 py-1 rounded text-sm font-bold bg-black/30">
                        <Timer className="h-4 w-4 mr-1" />
                        {order.timeDisplay}
                      </div>
                      
                      {/* Urgent badge if needed */}
                      {order.isUrgent && (
                        <Badge variant="destructive" className="animate-pulse text-sm px-2">
                          URGENT
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Order items */}
                  <div className="p-3 space-y-3"
                       style={{ backgroundColor: colors.background.tertiary }}>
                    {order.items.map((item) => (
                      <div 
                        key={item.id} 
                        className={`p-3 rounded border touch-manipulation relative ${item.isNewItem ? 'animate-pulse' : ''}`}
                        style={{
                          borderColor: item.isNewItem ? colors.status.warning : colors.border.light,
                          backgroundColor: item.isNewItem ? `${colors.status.warning}10` : 
                                         item.itemStatus === 'READY' ? `${colors.status.success}10` :
                                         item.itemStatus === 'PREPARING' ? `${colors.brand.blue}10` :
                                         order.status === 'DELAYED' ? `${colors.status.error}10` : 'transparent',
                          boxShadow: item.isNewItem ? `0 4px 12px ${colors.status.warning}20` : 'none'
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className="font-medium">{item.quantity}x</span>
                                <span className="ml-2">{item.name}</span>
                                <div className="flex items-center ml-2 gap-1">
                                  {item.isNewItem && (
                                    <Badge 
                                      className="text-xs font-bold animate-pulse mr-1"
                                      style={{
                                        backgroundColor: colors.status.warning,
                                        color: colors.text.primary
                                      }}
                                    >
                                      NEW ITEM
                                    </Badge>
                                  )}
                                  {order.orderType === 'WAITING' && (
                                    <Badge 
                                      className="text-xs font-bold"
                                      style={{
                                        backgroundColor: colors.status.error,
                                        color: colors.text.primary
                                      }}
                                    >
                                      URGENT
                                    </Badge>
                                  )}
                                </div>
                            </div>
                            
                            {item.variantName && (
                              <div 
                              className="text-sm ml-6"
                              style={{ color: colors.text.secondary }}
                            >
                              {item.variantName}
                            </div>
                            )}
                            
                            {item.notes && (
                              <div 
                              className="text-sm ml-6 mt-1 border-l-2 pl-2 italic"
                              style={{ 
                                color: colors.text.secondary,
                                borderColor: colors.border.light
                              }}
                            >
                              {item.notes}
                            </div>
                            )}
                          </div>
                          
                          <Badge className={getItemStatusBadgeClass(item.itemStatus)}>
                            {item.itemStatus}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    
                    {/* Order notes */}
                    {order.notes && (
                      <div 
                        className="p-2 rounded border-l-2"
                        style={{ 
                          borderColor: colors.brand.purple,
                          backgroundColor: `${colors.background.highlight}80`
                        }}
                      >
                        <div 
                          className="text-xs font-semibold mb-1"
                          style={{ color: colors.brand.purple }}
                        >
                          NOTES:
                        </div>
                        <div className="text-sm">{order.notes}</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Order actions - touch optimized for kitchen tablets */}
                  <div 
                    className="p-3 pt-0 grid grid-cols-2 gap-2 mt-1"
                    style={{ backgroundColor: colors.background.tertiary }}
                  >
                    {order.status !== 'PREPARING' && (
                      <Button 
                        variant="outline"
                        size="default"
                        className="py-6 md:py-7 text-base touch-manipulation active:scale-95 transition-transform"
                        style={{
                          backgroundColor: `${colors.brand.blue}20`,
                          borderColor: colors.brand.blue,
                          color: colors.text.primary
                        }}
                        onClick={() => kitchenService.updateOrderStatus(order.orderId, 'PREPARING')}
                      >
                        <ChefHat className="h-5 w-5 mr-2" />
                        Preparing
                      </Button>
                    )}
                    
                    {order.status !== 'DELAYED' && (
                      <Button 
                        variant="outline"
                        size="default"
                        className="py-6 md:py-7 text-base touch-manipulation active:scale-95 transition-transform"
                        style={{
                          backgroundColor: `${colors.status.warning}20`,
                          borderColor: colors.status.warning,
                          color: colors.text.primary
                        }}
                        onClick={() => markOrderDelayed(order.orderId)}
                      >
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Delayed
                      </Button>
                    )}
                    
                    {order.status !== 'READY' && order.status !== 'COMPLETED' && (
                      <Button 
                        variant="outline"
                        size="default"
                        className="py-6 md:py-7 text-base touch-manipulation active:scale-95 transition-transform"
                        style={{
                          backgroundColor: `${colors.status.success}20`,
                          borderColor: colors.status.success,
                          color: colors.text.primary
                        }}
                        onClick={() => kitchenService.updateOrderStatus(order.orderId, 'READY')}
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Ready
                      </Button>
                    )}
                    
                    {order.status === 'READY' && (
                      <Button 
                        variant="outline"
                        size="default"
                        className="py-6 md:py-7 text-base touch-manipulation active:scale-95 transition-transform col-span-2"
                        style={{
                          backgroundColor: `${colors.text.tertiary}20`,
                          borderColor: colors.text.tertiary,
                          color: colors.text.primary
                        }}
                        onClick={() => markOrderCompleted(order.orderId)}
                      >
                        <CheckSquare className="h-5 w-5 mr-2" />
                        Complete & Remove
                      </Button>
                    )}
                    
                    {order.status === 'COMPLETED' && (
                      <Button 
                        variant="outline"
                        size="default"
                        disabled
                        className="text-base col-span-2 py-3"
                        style={{
                          backgroundColor: `${colors.text.tertiary}20`,
                          borderColor: colors.text.disabled,
                          color: colors.text.disabled
                        }}
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Completed
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
      
      {/* Footer with order counts and legend */}
      <footer 
        className="p-3 border-t sticky bottom-0 z-10 border-opacity-20"
        style={{ 
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.light
        }}
      >
        <div className="flex justify-between items-center">
          <div className="text-sm">
            <span>{filteredOrders.length}</span> order{filteredOrders.length !== 1 ? 's' : ''} displayed
            {filteredOrders.length !== kitchenOrders.length && (
              <span style={{ color: colors.text.secondary }}> (filtered from {kitchenOrders.length})</span>
            )}
          </div>
          
          {/* Status legend */}
          <div className="flex gap-3 flex-wrap justify-end">
            <div className="flex gap-1 items-center">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: colors.brand.blue }}
              ></div>
              <span className="text-xs">Preparing</span>
            </div>
            <div className="flex gap-1 items-center">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: colors.status.warning }}
              ></div>
              <span className="text-xs">Delayed</span>
            </div>
            <div className="flex gap-1 items-center">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: colors.status.success }}
              ></div>
              <span className="text-xs">Ready</span>
            </div>
            <div className="flex gap-1 items-center">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: colors.text.tertiary }}
              ></div>
              <span className="text-xs">Completed</span>
            </div>
          </div>
        </div>
      </footer>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

// Helper functions for styling
function getOrderStatusBackground(status: KitchenOrderStatus): string {
  switch (status) {
    case 'PREPARING': return colors.brand.blue;
    case 'DELAYED': return colors.status.warning; // Will need animate-pulse class separately
    case 'READY': return colors.status.success;
    case 'COMPLETED': return colors.text.tertiary;
    default: return colors.background.highlight;
  }
}

const getItemStatusBadgeClass = (status: string): string => {
  const baseClasses = 'text-xs font-bold';
  
  // These are now style attributes instead of classes
  switch (status) {
    case 'NEW': return baseClasses;
    case 'PREPARING': return baseClasses;
    case 'READY': return baseClasses;
    case 'SERVED': return baseClasses;
    default: return baseClasses;
  }
}
