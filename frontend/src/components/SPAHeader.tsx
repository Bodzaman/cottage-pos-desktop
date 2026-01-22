


import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  User, 
  UserPlus, 
  ShoppingCart, 
  LogIn,
  Mic,
  MicOff
} from 'lucide-react';
import { PremiumTheme } from '../utils/premiumTheme';
import { cn } from '../utils/cn';
import { useSimpleAuth } from '../utils/simple-auth-context';
import { useCartStore } from '../utils/cartStore';
import { useVoiceAgentStore } from '../utils/voiceAgentStore';

type SPAView = 'menu' | 'portal' | 'checkout';

interface SPAHeaderProps {
  currentView: SPAView;
  setCurrentView: (view: SPAView) => void;
  onOpenCart: () => void;
}

/**
 * SPAHeader - Persistent header for OnlineOrders SPA
 * 
 * Provides navigation between SPA views
 * Shows cart, auth status, and voice agent controls
 * Links to standalone auth pages for unauthenticated users
 * Matches OnlineOrders premium styling
 */
export default function SPAHeader({ 
  currentView, 
  setCurrentView, 
  onOpenCart
}: SPAHeaderProps) {
  const navigate = useNavigate();
  
  // Auth integration
  const { user, isAuthenticated } = useSimpleAuth();
  
  // Cart integration
  const { items } = useCartStore();
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
  
  // Voice agent integration
  const { hasSelectedAgent, masterSwitchEnabled } = useVoiceAgentStore();
  const voiceAgentAvailable = hasSelectedAgent() && masterSwitchEnabled;
  
  return (
    <header 
      className="border-b border-gray-800 px-4 py-4"
      style={{ background: PremiumTheme.colors.background.secondary }}
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo & Navigation */}
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <button
              onClick={() => setCurrentView('menu')}
              className="flex items-center space-x-3 group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-burgundy-500 to-burgundy-700 flex items-center justify-center">
                <Menu className="w-5 h-5 text-white" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-white font-serif group-hover:text-silver-400 transition-colors">
                  Cottage Tandoori
                </h1>
                <p className="text-xs text-gray-400">Online Orders</p>
              </div>
            </button>
            
            {/* Navigation Pills - Only for authenticated users */}
            {isAuthenticated && (
              <nav className="hidden lg:flex items-center space-x-2">
                <Button
                  onClick={() => setCurrentView('menu')}
                  variant={currentView === 'menu' ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    "text-sm",
                    currentView === 'menu' 
                      ? "bg-burgundy-500 text-white" 
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  Menu
                </Button>
                
                <Button
                  onClick={() => setCurrentView('portal')}
                  variant={currentView === 'portal' ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    "text-sm",
                    currentView === 'portal' 
                      ? "bg-burgundy-500 text-white" 
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  My Account
                </Button>
              </nav>
            )}
          </div>
          
          {/* Right Side - Actions */}
          <div className="flex items-center space-x-3">
            {/* Voice Agent Toggle (if available and authenticated) */}
            {voiceAgentAvailable && isAuthenticated && (
              <Button
                onClick={() => {/* Voice agent logic */}}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white border-gray-600"
              >
                <Mic className="w-4 h-4" />
                <span className="ml-2 hidden sm:inline">Voice Order</span>
              </Button>
            )}
            
            {/* Cart Button */}
            {isAuthenticated && (
              <Button
                onClick={onOpenCart}
                variant="outline"
                size="sm"
                className="relative border-silver-500 text-silver-500 hover:bg-silver-500 hover:text-black"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="ml-2 hidden sm:inline">Cart</span>
                {cartItemCount > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-burgundy-500 text-white text-xs"
                  >
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            )}
            
            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <span className="text-gray-300 text-sm hidden md:inline">
                  Hello, {user?.user_metadata?.first_name || 'Customer'}
                </span>
                <Button
                  onClick={() => setCurrentView('portal')}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <User className="w-4 h-4" />
                  <span className="ml-2 hidden sm:inline">Account</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => navigate('/login')}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="ml-2 hidden sm:inline">Sign In</span>
                </Button>
                <Button
                  onClick={() => navigate('/sign-up')}
                  variant="outline"
                  size="sm"
                  className="border-burgundy-500 text-burgundy-500 hover:bg-burgundy-500 hover:text-white"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="ml-2 hidden sm:inline">Sign Up</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
