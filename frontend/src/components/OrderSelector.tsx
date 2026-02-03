import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe, Utensils, ShoppingBag, Calendar } from "lucide-react";
import { QSAITheme } from "../utils/QSAIDesign";
import { motion, AnimatePresence } from "framer-motion";
import { POSViewMode } from "../utils/posUIStore";
import { useTranslation } from "react-i18next";

export interface OrderSelectorProps {
  currentViewMode: POSViewMode;
  onViewModeChange: (mode: POSViewMode) => void;
  onlineOrdersCount?: number;
}

export function OrderSelector({ currentViewMode, onViewModeChange, onlineOrdersCount = 0 }: OrderSelectorProps) {
  const { t } = useTranslation('pos');
  const unifiedGradient = `linear-gradient(135deg, #5B21B6 30%, #7C3AED 100%)`;
  const purpleGlow = `rgba(146, 119, 255, 0.4)`;
  const [rippleButton, setRippleButton] = useState<string | null>(null);

  const handleButtonPress = (viewMode: string) => {
    setRippleButton(viewMode);
    setTimeout(() => setRippleButton(null), 300);
  };

  return (
    <div className="w-full px-0 py-4 relative overflow-hidden border-t-2 border-b"
      style={{
        background: `linear-gradient(145deg, ${QSAITheme.background.secondary} 0%, ${QSAITheme.background.tertiary} 100%)`,
        backdropFilter: "blur(12px)",
        borderTopColor: 'rgba(124, 93, 250, 0.25)',
        borderBottomColor: 'rgba(124, 93, 250, 0.15)',
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(124, 93, 250, 0.05)",
        position: 'relative',
        zIndex: 2
      }}>
      <div className="relative z-10 grid grid-cols-4 gap-4 py-0 px-4 w-full justify-items-center">
        <OrderTypeButton
          icon={<Utensils className="h-4 w-4 flex-shrink-0" />}
          label={t('orderTypes.dineIn')}
          orderType="DINE_IN"
          isActive={currentViewMode === "DINE_IN"}
          onClick={() => {
            handleButtonPress("DINE_IN");
            onViewModeChange("DINE_IN");
          }}
          unifiedGradient={unifiedGradient}
          purpleGlow={purpleGlow}
          isRippling={rippleButton === "DINE_IN"}
        />
        <OrderTypeButton
          icon={<ShoppingBag className="h-4 w-4 flex-shrink-0" />}
          label={t('orderTypes.takeAway')}
          orderType="TAKE_AWAY"
          isActive={currentViewMode === "TAKE_AWAY"}
          onClick={() => {
            handleButtonPress("TAKE_AWAY");
            onViewModeChange("TAKE_AWAY");
          }}
          unifiedGradient={unifiedGradient}
          purpleGlow={purpleGlow}
          isRippling={rippleButton === "TAKE_AWAY"}
        />
        <OrderTypeButton
          icon={<Globe className="h-4 w-4 flex-shrink-0" />}
          label={t('orderTypes.online')}
          orderType="ONLINE"
          isActive={currentViewMode === "ONLINE"}
          onClick={() => {
            handleButtonPress("ONLINE");
            onViewModeChange("ONLINE");
          }}
          unifiedGradient={unifiedGradient}
          purpleGlow={purpleGlow}
          isRippling={rippleButton === "ONLINE"}
          notificationCount={onlineOrdersCount}
        />
        <OrderTypeButton
          icon={<Calendar className="h-4 w-4 flex-shrink-0" />}
          label={t('orderTypes.reservations')}
          orderType="RESERVATIONS"
          isActive={currentViewMode === "RESERVATIONS"}
          onClick={() => {
            handleButtonPress("RESERVATIONS");
            onViewModeChange("RESERVATIONS");
          }}
          unifiedGradient={unifiedGradient}
          purpleGlow={purpleGlow}
          isRippling={rippleButton === "RESERVATIONS"}
        />
      </div>

      {/* Decorative pattern background */}
      <div className="absolute inset-0 pointer-events-none opacity-3">
        <div className="absolute inset-0">
          <div className="grid grid-cols-12 h-full w-full">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="border border-white/5 h-full"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type OrderTypeButtonProps = {
  icon: React.ReactNode;
  label: string;
  orderType: string;
  onClick: () => void;
  isActive?: boolean;
  unifiedGradient: string;
  purpleGlow: string;
  isRippling?: boolean;
  notificationCount?: number;
};

function OrderTypeButton({
  icon,
  label,
  orderType,
  onClick,
  isActive = false,
  unifiedGradient,
  purpleGlow,
  isRippling = false,
  notificationCount = 0
}: OrderTypeButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative group"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Button
        variant="ghost"
        className={`border flex items-center justify-center gap-2 transition-all duration-300 ease-in-out relative
        ${isActive ? 'shadow-lg font-medium' : 'font-normal hover:shadow-md'}
        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50`}
        style={{
          background: isActive
            ? unifiedGradient
            : isHovered
              ? `linear-gradient(145deg, rgba(28, 28, 28, 0.95) 0%, rgba(35, 35, 35, 0.95) 100%)`
              : `linear-gradient(145deg, rgba(18, 18, 18, 0.9) 0%, rgba(26, 26, 26, 0.9) 100%)`,
          borderColor: isActive
            ? `rgba(146, 119, 255, 0.6)`
            : isHovered
              ? 'rgba(146, 119, 255, 0.3)'
              : 'rgba(255, 255, 255, 0.03)',
          color: isActive ? 'white' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          boxShadow: isActive
            ? `0 6px 16px rgba(0, 0, 0, 0.3), 0 0 12px ${purpleGlow}`
            : isHovered
              ? `0 6px 12px rgba(0, 0, 0, 0.25), 0 0 8px rgba(146, 119, 255, 0.2)`
              : '0 4px 8px rgba(0, 0, 0, 0.2)',
          transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
          borderRadius: '12px',
          padding: '0.75rem 1rem',
          position: 'relative',
          width: '200px',
          height: '56px',
          overflow: 'hidden'
        }}
        onClick={onClick}
        aria-label={`Switch to ${label} mode`}
        aria-pressed={isActive}
      >
        {/* Shimmer overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
            animation: 'pos-button-shimmer 2s infinite',
            borderRadius: '12px',
          }}
        />

        {/* Notification Badge */}
        {notificationCount > 0 && (
          <motion.div
            className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full flex items-center justify-center text-xs"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              background: unifiedGradient,
              boxShadow: `0 2px 6px ${purpleGlow}, 0 0 12px ${purpleGlow}`,
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              fontWeight: 'bold',
              padding: '0 4px',
              minWidth: '20px'
            }}>
            {notificationCount}
          </motion.div>
        )}

        {/* Hover Micro-Animation */}
        {isHovered && !isActive && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              background: `radial-gradient(circle at center, rgba(146, 119, 255, 0.1) 0%, transparent 70%)`,
              border: '1px solid rgba(146, 119, 255, 0.2)'
            }}
          />
        )}

        {/* Hover Ring */}
        {isHovered && !isActive && (
          <motion.div
            className="absolute inset-0.5 rounded-lg pointer-events-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.4, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              border: '1px solid rgba(146, 119, 255, 0.3)',
              background: 'transparent'
            }}
          />
        )}

        {/* Double-Ring Active State */}
        {isActive && (
          <>
            <div
              className="absolute inset-1 rounded-lg pointer-events-none"
              style={{
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'transparent'
              }}
            />
            <div
              className="absolute -inset-0.5 rounded-xl pointer-events-none"
              style={{
                background: unifiedGradient,
                padding: '2px',
                zIndex: -1
              }}
            >
              <div
                className="w-full h-full rounded-lg"
                style={{ background: unifiedGradient }}
              />
            </div>
          </>
        )}

        {/* Ripple Animation */}
        <AnimatePresence>
          {isRippling && (
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: 1.4, opacity: 0 }}
              exit={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                background: `radial-gradient(circle, ${purpleGlow} 0%, transparent 70%)`,
                zIndex: 5
              }}
            />
          )}
        </AnimatePresence>

        {/* Geometric Pattern for Active */}
        {isActive && (
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.2'%3E%3Cpath d='M10 0l6.18 9h-12.36l6.18-9zm0 20l-6.18-9h12.36l-6.18 9z'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '20px 20px'
            }}
          />
        )}

        {/* Icon */}
        <motion.span
          className="relative z-10 flex-shrink-0"
          animate={{
            scale: isActive ? 1.05 : isHovered ? 1.02 : 1,
            filter: isActive
              ? 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.3))'
              : isHovered
                ? 'drop-shadow(0 0 3px rgba(146, 119, 255, 0.4))'
                : 'drop-shadow(0 0 0px rgba(146, 119, 255, 0))'
          }}
          transition={{ duration: 0.2 }}
          style={{
            color: isActive ? 'white' : isHovered ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.8)',
          }}
        >
          {icon}
        </motion.span>

        {/* Label */}
        <motion.span
          className="relative z-10 text-xs sm:text-sm font-semibold truncate"
          animate={{
            letterSpacing: isActive ? '0.025em' : isHovered ? '0.015em' : '0.01em'
          }}
          transition={{ duration: 0.2 }}
          style={{
            color: 'white',
            fontWeight: isActive ? '600' : '500',
            textShadow: isActive
              ? '0 0 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.6)'
              : '0 0 2px rgba(0, 0, 0, 0.5)',
            minWidth: 0,
            lineHeight: '1.2'
          }}
        >
          {label}
        </motion.span>

        {/* Active Indicator Dot */}
        {isActive && (
          <motion.div
            className="absolute -bottom-3.5 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              background: unifiedGradient,
              boxShadow: `0 0 8px rgba(146, 119, 255, 0.8), 0 0 12px ${purpleGlow}`
            }}
          />
        )}
      </Button>
    </motion.div>
  );
}
