import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChefHat, Clock, Package, Utensils, Truck, AlertTriangle, CheckCircle, RotateCw, Maximize, Minimize, X, Globe, Maximize2, Minimize2, Volume2, VolumeX, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useUnifiedKitchenStore } from 'utils/unifiedKitchenStore';
import { UnifiedKitchenOrder, KitchenOrderStatus } from 'utils/kitchenTypes';
import { ManagementHeader } from 'components/ManagementHeader';
import { useSimpleAuth } from 'utils/simple-auth-context';
import { QSAITheme, styles, indianPatterns } from 'utils/QSAIDesign';
import { KitchenOrderCard } from 'components/KitchenOrderCard';
import { KDSLockScreen } from 'components/KDSLockScreen';
import { useKDSAuth, initializeKDSSchema, checkKDSSetup } from 'utils/kdsAuth';
import cn from 'classnames';

export default function KDS_V2() {
  const { user } = useSimpleAuth();
  const { isLocked, lock, unlock, updateActivity, checkAutoLock } = useKDSAuth();
  
  // Show lock screen if locked - do this BEFORE calling any other hooks
  if (isLocked) {
    return <KDSLockScreen onUnlock={unlock} />;
  }
  
  // All hooks must be called AFTER the lock check to maintain consistent hook order
  return <KDS_V2_Content />;
}

// Separate component for the main KDS content
function KDS_V2_Content() {
  const { user } = useSimpleAuth();
  const { isLocked, lock, unlock, updateActivity, checkAutoLock } = useKDSAuth();
  const { 
    orders, 
    isLoading, 
    error, 
    loadOrders, 
    updateOrderStatus, 
    initializeRealtimeSubscription, 
    cleanupSubscription 
  } = useUnifiedKitchenStore();
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [time, setTime] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState<UnifiedKitchenOrder['orderType'] | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<KitchenOrderStatus | 'ALL'>('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize KDS schema and check setup on mount
  useEffect(() => {
    const setupKDS = async () => {
      const status = await checkKDSSetup();
      if (!status.schemaReady) {
        console.log('Initializing KDS schema...');
        await initializeKDSSchema();
      }
    };
    setupKDS();
  }, []);

  // Track user activity to prevent auto-lock
  useEffect(() => {
    const handleActivity = () => {
      if (!isLocked) {
        updateActivity();
      }
    };

    // Track mouse movement and clicks
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('keypress', handleActivity);

    // Check for auto-lock every minute
    const autoLockInterval = setInterval(() => {
      const didLock = checkAutoLock();
      if (didLock) {
        toast.info('Kitchen Display locked due to inactivity');
      }
    }, 60000); // Check every minute

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      clearInterval(autoLockInterval);
    };
  }, [isLocked, updateActivity, checkAutoLock]);

  // Auto-enter fullscreen from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('fullscreen') === 'true') {
      setIsFullscreen(true);
      // Request browser fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => {
          console.log('Fullscreen request failed:', err);
        });
      }
    }
  }, []);

  // Initialize audio element for new order alerts
  useEffect(() => {
    audioRef.current = new Audio();
    // Simple beep sound data URL
    audioRef.current.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGmi77eeeTRAMUKfj8LZjHAY4ktfy0HsuBSh+zPLaizsKG2S86+qnVhELTKXh8cFuIwUsgs/y24k2CBlou+3onk0QDFCn4/C2YxwGOJLX8tB7LgUofszy2os7ChtkvevrqFYRC0yl4fHBbiMFLILP8tyJNggaaLvt6J5NEAxQp+PwtmMcBjiS1/LQey4FKH7M8tqLOwobZL3r66hWEQtMpeHxwW4jBSyCz/LciTYIGmi77eieTRAMUKfj8LZjHAY4ktfy0HsuBSh+zPLaizsKG2S96+uoVhELTKXh8cFuIwUsgs/y3Ik2CBpou+3onk0QDFCn4/C2YxwGOJLX8tB7LgUofszy2os7ChtkvevrqFYRC0yl4fHBbiMFLILP8tyJNggaaLvt6J5NEAxQp+PwtmMcBjiS1/LQey4FKH7M8tqLOwobZL3r66hWEQ==';
    audioRef.current.volume = 0.3; // Set volume to 30%

    // Get fullscreen status from localStorage
    const savedFullscreen = localStorage.getItem('kds-fullscreen');
    if (savedFullscreen) {
      setIsFullscreen(savedFullscreen === 'true');
    }

    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  // Persist audio preference in localStorage
  useEffect(() => {
    const savedAudioPref = localStorage.getItem('kds-audio-enabled');
    if (savedAudioPref !== null) {
      setAudioEnabled(savedAudioPref === 'true');
    }
  }, []);

  // Save audio preference when it changes
  const toggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    localStorage.setItem('kds-audio-enabled', String(newState));
  };

  // Play sound when new order arrives
  const playNewOrderSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => {
        console.log('Audio playback prevented by browser:', e);
      });
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    const newState = !isFullscreen;
    setIsFullscreen(newState);
    localStorage.setItem('kds-fullscreen', newState.toString());
  };

  // Handle lock button with Ctrl+Shift+L shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        lock();
        toast.info('Kitchen Display locked');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [lock]);

  // Get order source badge
  const getOrderSourceBadge = (source: 'POS' | 'ONLINE' | undefined) => {
    const sourceType = source || 'POS';
    const isPOS = sourceType === 'POS';
    
    return (
      <Badge 
        variant={isPOS ? "secondary" : "default"}
        className={cn(
          "text-xs font-semibold",
          isPOS ? "bg-slate-700 text-slate-200" : "bg-blue-600 text-white"
        )}
      >
        {isPOS ? '🏪 POS' : '🌐 ONLINE'}
      </Badge>
    );
  };

  // Check if item is newly arrived (< 30 seconds)
  const isItemNew = (item: any): boolean => {
    if (!item.createdAt) return false;
    const now = new Date().getTime();
    const createdTime = new Date(item.createdAt).getTime();
    return (now - createdTime) < 30 * 1000; // 30 seconds
  };

  // Clock update
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Load orders and start real-time listening
  useEffect(() => {
    if (!user) return;
    loadOrders();
    initializeRealtimeSubscription();
    return () => cleanupSubscription();
  }, [user, loadOrders, initializeRealtimeSubscription, cleanupSubscription]);

  // Detect new orders and play sound
  useEffect(() => {
    if (orders.length > lastOrderCount && lastOrderCount > 0 && audioEnabled) {
      playNewOrderSound();
    }
    setLastOrderCount(orders.length);
  }, [orders.length, audioEnabled]);

  // Loading state
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: QSAITheme.background.primary }}>
        <div className="text-center">
          <div className="text-lg" style={{ color: QSAITheme.text.primary }}>Please log in to access Kitchen Display</div>
        </div>
      </div>
    );
  }

  if (isLoading && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: QSAITheme.background.primary }}>
        <div className="text-center">
          <div className="text-lg" style={{ color: QSAITheme.text.primary }}>Loading kitchen display...</div>
        </div>
      </div>
    );
  }

  // Group orders by status
  const pendingOrders = orders.filter(o => o.status === "PENDING");
  const preparingOrders = orders.filter(o => o.status === "PREPARING");
  const readyOrders = orders.filter(o => o.status === "READY");
  const delayedOrders = orders.filter(o => o.status === "DELAYED");

  return (
    <div 
      className={`min-h-screen overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
      style={{
        ...styles.gridBackground,
        backgroundImage: indianPatterns.rangoli,
        position: 'relative'
      }}
    >
      {/* ManagementHeader */}
      {!isFullscreen && <ManagementHeader title="Kitchen" />}
      
      {/* Header with Controls - Match POSDesktop CategorySidebar style */}
      <div 
        className="relative"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.95) 100%)',
          boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '0px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.03)'
        }}
      >
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Title Section - Match CategorySidebar gradient text */}
            <div>
              <h1 
                className="text-4xl font-bold"
                style={{
                  backgroundImage: `linear-gradient(135deg, white 30%, ${QSAITheme.purple.light} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 0 10px rgba(124, 93, 250, 0.2)'
                }}
              >
                Kitchen Display
              </h1>
              <p className="text-slate-400 mt-1 text-sm font-medium">Real-time unified order feed</p>
            </div>

            {/* Control Buttons - Match POSDesktop button styling */}
            <div className="flex items-center gap-3">
              {/* Lock Button */}
              <Button
                onClick={() => {
                  lock();
                  toast.info('Kitchen Display locked');
                }}
                variant="ghost"
                size="sm"
                className="transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444'
                }}
              >
                <Lock className="w-5 h-5" />
              </Button>

              {/* Sound Toggle */}
              <Button
                onClick={toggleAudio}
                variant={audioEnabled ? "default" : "secondary"}
                size="lg"
                className={audioEnabled 
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg shadow-purple-500/30 transition-all duration-300"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-all duration-300"
                }
              >
                {audioEnabled ? (
                  <>
                    <Volume2 className="h-5 w-5 mr-2" />
                    Sound ON
                  </>
                ) : (
                  <>
                    <VolumeX className="h-5 w-5 mr-2" />
                    Sound OFF
                  </>
                )}
              </Button>

              {/* Fullscreen Toggle */}
              <Button
                onClick={toggleFullscreen}
                variant="secondary"
                size="lg"
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all duration-300"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-5 w-5 mr-2" />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-5 w-5 mr-2" />
                    Fullscreen
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Vignette overlay */}
      <div style={styles.vignette} />

      {/* Main container */}
      <div className="relative z-10 p-6 space-y-6">
        {/* Status Lanes */}
        <div className="grid grid-cols-4 gap-6">
          {/* PENDING Lane */}
          <StatusLane
            title="📥 Pending"
            count={pendingOrders.length}
            orders={pendingOrders}
            color={QSAITheme.status.warning}
            onStatusUpdate={updateOrderStatus}
          />

          {/* PREPARING Lane */}
          <StatusLane
            title="🔥 Preparing"
            count={preparingOrders.length}
            orders={preparingOrders}
            color={QSAITheme.purple.primary}
            onStatusUpdate={updateOrderStatus}
          />

          {/* READY Lane */}
          <StatusLane
            title="✅ Ready"
            count={readyOrders.length}
            orders={readyOrders}
            color={QSAITheme.status.success}
            onStatusUpdate={updateOrderStatus}
          />

          {/* DELAYED Lane */}
          <StatusLane
            title="⚠️ Delayed"
            count={delayedOrders.length}
            orders={delayedOrders}
            color={QSAITheme.status.error}
            onStatusUpdate={updateOrderStatus}
          />
        </div>
      </div>
    </div>
  );
}

// Status Lane Component
interface StatusLaneProps {
  title: string;
  count: number;
  orders: any[];
  color: string;
  onStatusUpdate: (orderId: string, status: any) => void;
}

function StatusLane({ title, count, orders, color, onStatusUpdate }: StatusLaneProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="flex flex-col h-full"
    >
      {/* Lane Header - Match CategorySidebar style */}
      <div
        className="p-4 rounded-t-lg"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.95) 100%)',
          borderBottom: `3px solid ${color}`,
          boxShadow: `0 0 15px ${color}40, 0 8px 20px -4px rgba(0, 0, 0, 0.4)`,
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0
        }}
      >
        <div className="flex items-center justify-between">
          <h2 
            className="text-xl font-bold"
            style={{
              color: '#FFFFFF'
            }}
          >
            {title}
          </h2>
          <div 
            className="px-3 py-1 rounded-full text-sm font-semibold"
            style={{
              background: `${color}30`,
              color: color,
              border: `1px solid ${color}50`
            }}
          >
            {count}
          </div>
        </div>
      </div>

      {/* Lane Content - Scrollable */}
      <div 
        className="flex-1 p-3 space-y-3 overflow-y-auto"
        style={{
          background: QSAITheme.background.tertiary,
          borderLeft: `1px solid ${QSAITheme.border.light}`,
          borderRight: `1px solid ${QSAITheme.border.light}`,
          borderBottom: `1px solid ${QSAITheme.border.light}`,
          borderBottomLeftRadius: '0.5rem',
          borderBottomRightRadius: '0.5rem',
          maxHeight: 'calc(100vh - 300px)'
        }}
      >
        <AnimatePresence mode="popLayout">
          {orders.map((order, idx) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -100 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              layout
            >
              <KitchenOrderCard order={order} onStatusUpdate={onStatusUpdate} />
            </motion.div>
          ))}
        </AnimatePresence>

        {orders.length === 0 && (
          <div className="text-center py-12" style={{ color: QSAITheme.text.muted }}>
            <div className="text-4xl mb-2">✨</div>
            <div className="text-sm">No orders in this status</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
