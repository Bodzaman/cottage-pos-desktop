/**
 * OnlineOrdersErrorFallback Component
 * 
 * Premium-themed error fallback UI for OnlineOrders page
 * Preserves cart state and provides recovery options
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, ShoppingCart, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PremiumTheme } from 'utils/premiumTheme';
import { useCartStore } from 'utils/cartStore';
import { toast } from 'sonner';
import type { ErrorInfo } from 'react';

interface OnlineOrdersErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  resetError: () => void;
}

/**
 * Premium error fallback UI for OnlineOrders
 * Matches the dark theme aesthetic and preserves cart data
 */
export function OnlineOrdersErrorFallback({
  error,
  errorInfo,
  resetError,
}: OnlineOrdersErrorFallbackProps) {
  const navigate = useNavigate();
  const { items: cartItems, totalItems, openCart } = useCartStore();
  const [showDetails, setShowDetails] = useState(false);

  const handleTryAgain = () => {
    toast.info('Reloading page...', { duration: 1500 });
    resetError();
  };

  const handleGoToCart = () => {
    if (totalItems > 0) {
      toast.success(`Opening cart with ${totalItems} item${totalItems !== 1 ? 's' : ''}`, {
        duration: 2000,
      });
      resetError();
      // Small delay to let error boundary reset
      setTimeout(() => {
        openCart();
      }, 100);
    } else {
      toast.error('Your cart is empty', { duration: 2000 });
    }
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent('Error on Online Orders Page');
    const body = encodeURIComponent(
      `Hi,\n\nI encountered an error on the Online Orders page:\n\nError: ${error.message}\n\nPlease assist.\n\nThank you.`
    );
    window.location.href = `mailto:support@cottagetandoori.co.uk?subject=${subject}&body=${body}`;
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[950]} 0%, ${PremiumTheme.colors.charcoal[900]} 50%, ${PremiumTheme.colors.dark[900]} 100%)`,
      }}
    >
      <div
        className="max-w-2xl w-full rounded-xl shadow-2xl p-8 border"
        style={{
          background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[900]} 0%, ${PremiumTheme.colors.dark[850]} 100%)`,
          borderColor: PremiumTheme.colors.burgundy[700],
          boxShadow: `0 0 40px rgba(139, 0, 0, 0.3)`,
        }}
      >
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[900]} 0%, ${PremiumTheme.colors.burgundy[800]} 100%)`,
              boxShadow: `0 0 30px ${PremiumTheme.colors.burgundy[700]}50`,
            }}
          >
            <AlertTriangle
              className="w-10 h-10"
              style={{ color: PremiumTheme.colors.burgundy[400] }}
            />
          </div>
        </div>

        {/* Error Title */}
        <h1
          className="text-3xl font-bold text-center mb-4"
          style={{ color: PremiumTheme.colors.text.primary }}
        >
          Oops! Something Went Wrong
        </h1>

        {/* Error Message */}
        <p
          className="text-center mb-6 text-lg"
          style={{ color: PremiumTheme.colors.text.secondary }}
        >
          We encountered an unexpected error while loading the menu. Don't worry — your cart is safe!
        </p>

        {/* Cart Status Badge */}
        {totalItems > 0 && (
          <div
            className="flex items-center justify-center gap-2 mb-6 px-4 py-2 rounded-full mx-auto w-fit"
            style={{
              background: `${PremiumTheme.colors.burgundy[900]}40`,
              border: `1px solid ${PremiumTheme.colors.burgundy[700]}`,
            }}
          >
            <ShoppingCart
              className="w-5 h-5"
              style={{ color: PremiumTheme.colors.burgundy[400] }}
            />
            <span style={{ color: PremiumTheme.colors.text.primary }}>
              {totalItems} item{totalItems !== 1 ? 's' : ''} saved in your cart
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Try Again Button */}
          <Button
            onClick={handleTryAgain}
            className="w-full h-12 font-semibold transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[700]} 0%, ${PremiumTheme.colors.burgundy[600]} 100%)`,
              color: PremiumTheme.colors.text.primary,
              border: 'none',
            }}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </Button>

          {/* Go to Cart Button */}
          <Button
            onClick={handleGoToCart}
            disabled={totalItems === 0}
            className="w-full h-12 font-semibold transition-all duration-300"
            style={{
              background:
                totalItems > 0
                  ? `${PremiumTheme.colors.silver[600]}30`
                  : `${PremiumTheme.colors.dark[800]}`,
              color:
                totalItems > 0
                  ? PremiumTheme.colors.text.primary
                  : PremiumTheme.colors.text.muted,
              border: `1px solid ${totalItems > 0 ? PremiumTheme.colors.silver[700] : PremiumTheme.colors.border.medium}`,
            }}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            View Cart {totalItems > 0 && `(${totalItems})`}
          </Button>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Contact Support */}
          <Button
            onClick={handleContactSupport}
            variant="outline"
            className="w-full h-12 font-medium"
            style={{
              background: 'transparent',
              color: PremiumTheme.colors.text.secondary,
              borderColor: PremiumTheme.colors.border.medium,
            }}
          >
            <Mail className="w-5 h-5 mr-2" />
            Contact Support
          </Button>

          {/* Go Home */}
          <Button
            onClick={handleGoHome}
            variant="outline"
            className="w-full h-12 font-medium"
            style={{
              background: 'transparent',
              color: PremiumTheme.colors.text.secondary,
              borderColor: PremiumTheme.colors.border.medium,
            }}
          >
            Go to Home
          </Button>
        </div>

        {/* Error Details (Collapsible) */}
        <div
          className="rounded-lg border p-4"
          style={{
            background: `${PremiumTheme.colors.dark[950]}80`,
            borderColor: PremiumTheme.colors.border.medium,
          }}
        >
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-left"
            style={{ color: PremiumTheme.colors.text.secondary }}
          >
            <span className="text-sm font-medium">Technical Details</span>
            {showDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showDetails && (
            <div className="mt-4 space-y-2">
              <div>
                <p
                  className="text-xs font-semibold mb-1"
                  style={{ color: PremiumTheme.colors.text.muted }}
                >
                  Error Message:
                </p>
                <pre
                  className="text-xs p-3 rounded overflow-auto max-h-32"
                  style={{
                    background: PremiumTheme.colors.dark[900],
                    color: PremiumTheme.colors.burgundy[400],
                  }}
                >
                  {error.message}
                </pre>
              </div>

              {error.stack && (
                <div>
                  <p
                    className="text-xs font-semibold mb-1"
                    style={{ color: PremiumTheme.colors.text.muted }}
                  >
                    Stack Trace:
                  </p>
                  <pre
                    className="text-xs p-3 rounded overflow-auto max-h-32"
                    style={{
                      background: PremiumTheme.colors.dark[900],
                      color: PremiumTheme.colors.text.muted,
                    }}
                  >
                    {error.stack}
                  </pre>
                </div>
              )}

              {errorInfo?.componentStack && (
                <div>
                  <p
                    className="text-xs font-semibold mb-1"
                    style={{ color: PremiumTheme.colors.text.muted }}
                  >
                    Component Stack:
                  </p>
                  <pre
                    className="text-xs p-3 rounded overflow-auto max-h-32"
                    style={{
                      background: PremiumTheme.colors.dark[900],
                      color: PremiumTheme.colors.text.muted,
                    }}
                  >
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Helpful Note */}
        <p
          className="text-center text-sm mt-6"
          style={{ color: PremiumTheme.colors.text.muted }}
        >
          If this problem persists, please contact our support team.
        </p>
      </div>
    </div>
  );
}
