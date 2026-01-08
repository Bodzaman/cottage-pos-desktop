import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSimpleAuth } from "../utils/simple-auth-context";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import { Cart } from "./Cart";
import { NotificationIndicator } from "./NotificationIndicator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PremiumTheme } from "../utils/premiumTheme";
import { useCartStore } from "../utils/cartStore";
import { useChatIsOpen } from "../utils/chat-store";
import { 
  getNavigationConfig, 
  getFilteredNavigationItems, 
  shouldShowCtaButton,
  NavigationContext 
} from "../utils/navigationConfig";

interface UniversalHeaderProps {
  context?: NavigationContext;
  overrideConfig?: boolean;
  showAuthButtons?: boolean;
  showCart?: boolean;
  transparent?: boolean;
  className?: string;
  onCartClick?: () => void; // NEW: Custom cart click handler
}

export function UniversalHeader({
  context,
  overrideConfig = false,
  showAuthButtons,
  showCart,
  transparent = false,
  className = '',
  onCartClick
}: UniversalHeaderProps) {
  const { user, signOut } = useSimpleAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = React.useState(false);
  
  // ✅ NEW: Get chat open state to hide cart when chat is active
  const isChatOpen = useChatIsOpen();
  
  // Get global cart action as default
  const openCart = useCartStore((state) => state.openCart);
  const cartClickHandler = onCartClick || openCart;

  // Get smart navigation config based on current route or provided context
  const navigationConfig = context && overrideConfig 
    ? { context, ...getNavigationConfig('/') } // Use provided context with default config
    : getNavigationConfig(location.pathname);

  // Override config properties if explicitly provided
  const finalConfig = {
    ...navigationConfig,
    showAuthButtons: showAuthButtons ?? navigationConfig.showAuthButtons,
    showCart: showCart ?? navigationConfig.showCart,
  };

  // Check if current route is active
  const isActive = (path: string) => location.pathname === path;

  // Handle scroll event to change navbar background
  React.useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Get filtered navigation items based on user authentication
  const filteredNavItems = getFilteredNavigationItems(finalConfig.navigationItems, user);

  // Enhanced glassmorphism background calculation
  const getHeaderBackground = () => {
    const isTransparent = transparent && !isScrolled;
    
    if (isTransparent) {
      return {
        background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.3) 70%, rgba(0, 0, 0, 0) 100%)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
      };
    }
    
    return {
      background: isScrolled 
        ? 'rgba(15, 15, 15, 0.85)' // More opaque when scrolled
        : 'rgba(26, 26, 26, 0.75)', // Semi-transparent
      backdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${PremiumTheme.colors.border.light}`,
      boxShadow: isScrolled ? PremiumTheme.shadows.elevation.lg : 'none'
    };
  };

  const headerStyles = getHeaderBackground();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${className}`}
      style={headerStyles}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo with glassmorphism enhancement */}
          {finalConfig.showLogo && (
            <Link 
              to="/" 
              className="text-2xl font-oldenglish font-bold tracking-wider py-1 transition-all duration-300 hover:scale-105"
              style={{
                fontSize: '2.4rem',
                fontWeight: '800',
                lineHeight: '1.1',
                letterSpacing: '0.02em',
                color: '#8B1538', // Updated to match Start Ordering button color
                textShadow: '0 3px 6px rgba(0, 0, 0, 0.4)', // Drop shadow only, glow removed to prevent orange effect
                marginBottom: '0.25rem'
              }}
            >
              Cottage Tandoori
            </Link>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="font-medium transition-all duration-300 relative group"
                style={{
                  color: isActive(item.path) 
                    ? PremiumTheme.colors.silver[500] 
                    : PremiumTheme.colors.text.secondary,
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.target.style.color = PremiumTheme.colors.burgundy[500];
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.target.style.color = PremiumTheme.colors.text.secondary;
                  }
                }}
              >
                {item.name}
                {/* Glassmorphism underline effect */}
                <div 
                  className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-300"
                  style={{ 
                    background: `linear-gradient(90deg, ${PremiumTheme.colors.burgundy[500]}, ${PremiumTheme.colors.silver[500]})`,
                    boxShadow: `0 0 8px ${PremiumTheme.colors.burgundy[500]}30`
                  }}
                />
              </Link>
            ))}
          </nav>

          {/* Action Buttons with glassmorphism */}
          <div className="hidden md:flex items-center space-x-3">
            {user && <NotificationIndicator />}
            
            {finalConfig.showCart && !isChatOpen && (
              <Cart 
                className="text-white hover:text-white/80" 
                onCartClick={cartClickHandler}
              />
            )}

            {/* Context-aware CTA button */}
            {shouldShowCtaButton(finalConfig.ctaButton, user) && (
              <Button
                onClick={() => navigate(finalConfig.ctaButton!.path)}
                className="font-light tracking-wide transition-all duration-300 backdrop-blur-sm border hover:scale-105"
                variant={finalConfig.ctaButton!.variant === 'primary' ? 'default' : 'outline'}
                style={{
                  ...(finalConfig.ctaButton!.variant === 'primary' ? {
                    background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[500]}, ${PremiumTheme.colors.burgundy[600]})`,
                    borderColor: PremiumTheme.colors.burgundy[500],
                    color: PremiumTheme.colors.text.primary,
                    boxShadow: PremiumTheme.shadows.glow.burgundy
                  } : {
                    color: PremiumTheme.colors.text.primary,
                    borderColor: PremiumTheme.colors.border.medium,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                  })
                }}
              >
                {finalConfig.ctaButton!.text}
              </Button>
            )}

            {finalConfig.showAuthButtons && (
              user ? (
                <Button
                  onClick={() => navigate("/customer-portal")}
                  className="font-light tracking-wide transition-all duration-300 backdrop-blur-sm border hover:scale-105"
                  variant="outline"
                  style={{
                    color: PremiumTheme.colors.text.primary,
                    borderColor: PremiumTheme.colors.border.medium,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  My Account
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => navigate("/login")}
                    className="font-light tracking-wide transition-all duration-300 backdrop-blur-sm border hover:scale-105"
                    variant="outline"
                    style={{
                      color: PremiumTheme.colors.text.primary,
                      borderColor: PremiumTheme.colors.border.medium,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => navigate("/sign-up")}
                    className="font-light tracking-wide transition-all duration-300 backdrop-blur-sm border hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[500]}, ${PremiumTheme.colors.burgundy[600]})`,
                      borderColor: PremiumTheme.colors.burgundy[500],
                      color: PremiumTheme.colors.text.primary,
                      boxShadow: PremiumTheme.shadows.glow.burgundy
                    }}
                  >
                    Create Account
                  </Button>
                </>
              )
            )}
          </div>

          {/* Enhanced Mobile Menu */}
          <div className="md:hidden flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="transition-all duration-300 backdrop-blur-sm border hover:scale-110"
                  style={{
                    color: PremiumTheme.colors.text.secondary,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <HiOutlineMenu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="backdrop-blur-md border"
                style={{
                  background: 'rgba(15, 15, 15, 0.95)',
                  borderColor: PremiumTheme.colors.border.light,
                  boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <span 
                      className="text-xl font-serif font-bold tracking-wider py-1"
                      style={{ 
                        color: PremiumTheme.colors.text.primary,
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)'
                      }}
                    >
                      Menu
                    </span>
                    <div className="flex items-center gap-2">
                      {user && <NotificationIndicator className="mr-1" />}
                      {finalConfig.showCart && !isChatOpen && <Cart insideMobileMenu={true} onCartClick={onCartClick} />}
                    </div>
                  </div>

                  <nav className="flex flex-col space-y-6 mb-8">
                    {filteredNavItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="text-lg font-medium transition-all duration-300 relative group"
                        style={{
                          color: isActive(item.path) 
                            ? PremiumTheme.colors.silver[500] 
                            : PremiumTheme.colors.text.secondary,
                          textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive(item.path)) {
                            e.target.style.color = PremiumTheme.colors.burgundy[500];
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive(item.path)) {
                            e.target.style.color = PremiumTheme.colors.text.secondary;
                          }
                        }}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>

                  {/* Smart Auth Display for Mobile: Always show account when authenticated */}
                  <div className="mt-auto space-y-4">
                    {user ? (
                      <>
                        <Button
                          onClick={() => navigate("/customer-portal")}
                          className="w-full font-light tracking-wide transition-all duration-300 backdrop-blur-sm border"
                          variant="outline"
                          style={{
                            color: PremiumTheme.colors.text.primary,
                            borderColor: PremiumTheme.colors.border.medium,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)'
                          }}
                        >
                          My Dashboard
                        </Button>
                        <Button
                          onClick={() => signOut()}
                          className="w-full font-light tracking-wide transition-all duration-300 backdrop-blur-sm border"
                          variant="outline"
                          style={{
                            color: PremiumTheme.colors.text.primary,
                            borderColor: PremiumTheme.colors.border.medium,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)'
                          }}
                        >
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      finalConfig.showAuthButtons && (
                        <>
                          <Button
                            onClick={() => navigate("/login")}
                            className="w-full font-light tracking-wide transition-all duration-300 backdrop-blur-sm border"
                            variant="outline"
                            style={{
                              color: PremiumTheme.colors.text.primary,
                              borderColor: PremiumTheme.colors.border.medium,
                              backgroundColor: 'rgba(255, 255, 255, 0.05)'
                            }}
                          >
                            Sign In
                          </Button>
                          <Button
                            onClick={() => navigate("/sign-up")}
                            className="w-full mt-2 font-light tracking-wide transition-all duration-300"
                            style={{
                              background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[500]}, ${PremiumTheme.colors.burgundy[600]})`,
                              borderColor: PremiumTheme.colors.burgundy[500],
                              color: PremiumTheme.colors.text.primary,
                              boxShadow: PremiumTheme.shadows.glow.burgundy
                            }}
                          >
                            Create Account
                          </Button>
                        </>
                      )
                    )}
                  </div>

                  {/* Context-aware CTA button for mobile */}
                  {shouldShowCtaButton(finalConfig.ctaButton, user) && (
                    <div className="mt-4">
                      <Button
                        onClick={() => navigate(finalConfig.ctaButton!.path)}
                        className="w-full font-light tracking-wide transition-all duration-300"
                        variant={finalConfig.ctaButton!.variant === 'primary' ? 'default' : 'outline'}
                        style={{
                          ...(finalConfig.ctaButton!.variant === 'primary' ? {
                            background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[500]}, ${PremiumTheme.colors.burgundy[600]})`,
                            borderColor: PremiumTheme.colors.burgundy[500],
                            color: PremiumTheme.colors.text.primary,
                            boxShadow: PremiumTheme.shadows.glow.burgundy
                          } : {
                            color: PremiumTheme.colors.text.primary,
                            borderColor: PremiumTheme.colors.border.medium,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)'
                          })
                        }}
                      >
                        {finalConfig.ctaButton!.text}
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
