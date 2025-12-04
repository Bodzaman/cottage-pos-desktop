import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, User, Phone, MapPin, CreditCard, Mail } from 'lucide-react';
import ThermalReceiptDisplay from './ThermalReceiptDisplay';

interface CustomerProfile {
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  customerEmail?: string;
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerProfile;
  orderData: any;
  orderType: string;
  isLoadingOrder: boolean;
  onReorder: () => void;
}

/**
 * OrderDetailsModal - Enhanced receipt preview with customer profile header and reorder footer
 * 
 * Modal Layout:
 * ╔══════════════════════════════════════════════╗
 * ║ 👤 Customer Profile Header (Fixed)          ║
 * ║ CT001 | Bod Zaman | 07342640000             ║
 * ║ 📍 17 Sopers Cottages, Pulborough           ║
 * ╠══════════════════════════════════════════════╣
 * ║                                              ║
 * ║   [Scrollable Receipt Preview Area]         ║
 * ║   (ThermalReceiptDisplay Component)         ║
 * ║                                              ║
 * ╠══════════════════════════════════════════════╣
 * ║ 🔄 Reorder Button (Fixed Footer)            ║
 * ╚══════════════════════════════════════════════╝
 * 
 * Features:
 * - Fixed customer profile header (purple accents)
 * - Scrollable receipt body for long orders
 * - Fixed footer with prominent Reorder CTA
 * - Closes modal and triggers cascading close on reorder
 * - QSAI frosted glass theme
 */
export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  customer,
  orderData,
  orderType,
  isLoadingOrder,
  onReorder,
}) => {
  /**
   * Handle reorder click:
   * 1. Close this modal
   * 2. Trigger parent's reorder handler (which also closes Order History modal)
   * 3. Load order into main UI
   */
  const handleReorderClick = () => {
    onClose(); // Close OrderDetailsModal first
    onReorder(); // Trigger parent reorder (closes Order History + loads order)
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="
          max-w-4xl 
          h-[90vh]
          bg-gradient-to-br from-zinc-900/98 to-zinc-800/98
          backdrop-blur-md
          border border-purple-500/30
          shadow-2xl shadow-purple-500/20
          text-white
          p-0
          overflow-hidden
          flex flex-col
        "
      >
        {/* Purple gradient accent border */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-purple-600/10 to-purple-500/10 rounded-lg pointer-events-none" />
        
        {/* HEADER: Customer Profile (Fixed) */}
        <DialogHeader className="relative border-b border-zinc-700/50 px-6 py-4 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-white mb-3">
            Order Details
          </DialogTitle>
          <DialogDescription className="sr-only">
            View detailed order information with customer profile and receipt
          </DialogDescription>
          
          {/* Customer Profile Card */}
          <div className="
            bg-gradient-to-br from-purple-900/30 to-purple-800/20
            border border-purple-500/30
            rounded-lg p-4
            space-y-2.5
          ">
            {/* Row 1: ID, Name, Phone */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Customer ID */}
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-purple-400" />
                <span className="font-mono font-bold text-purple-300 text-sm">
                  {customer.customerId}
                </span>
              </div>
              
              <span className="text-purple-500/50">|</span>
              
              {/* Customer Name */}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-purple-400" />
                <span className="font-semibold text-white text-base">
                  {customer.customerName}
                </span>
              </div>
              
              <span className="text-purple-500/50">|</span>
              
              {/* Phone */}
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-purple-400" />
                <span className="font-mono text-gray-300 text-sm">
                  {customer.customerPhone}
                </span>
              </div>
              
              {/* Email (if available) */}
              {customer.customerEmail && (
                <>
                  <span className="text-purple-500/50">|</span>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-purple-400" />
                    <span className="text-gray-300 text-sm">
                      {customer.customerEmail}
                    </span>
                  </div>
                </>
              )}
            </div>
            
            {/* Row 2: Address */}
            {customer.deliveryAddress && (
              <div className="flex items-start gap-2 mt-2">
                <MapPin className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm">
                  {customer.deliveryAddress}
                </span>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* BODY: Scrollable Receipt Preview */}
        <div className="
          relative 
          flex-1 
          overflow-y-auto 
          px-6 
          py-6
          flex
          justify-center
          items-start
        ">
          {isLoadingOrder ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-400">Loading receipt...</p>
            </div>
          ) : orderData ? (
            <ThermalReceiptDisplay
              orderMode={orderType as any}
              orderData={orderData}
              paperWidth={80}
              showZoomControls={true}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No receipt data available</p>
            </div>
          )}
        </div>

        {/* FOOTER: Reorder Button (Fixed) */}
        <DialogFooter className="
          relative 
          border-t border-zinc-700/50 
          px-6 
          py-4 
          flex-shrink-0
          bg-zinc-900/50
        ">
          <div className="flex items-center justify-between w-full">
            {/* Optional: Close/Back button */}
            <Button
              variant="outline"
              onClick={onClose}
              className="
                border-zinc-600/50 
                text-gray-300 
                hover:bg-zinc-700/50
                hover:text-white
                hover:border-purple-500/30
              "
            >
              Back to Orders
            </Button>
            
            {/* Primary Reorder CTA */}
            <Button
              onClick={handleReorderClick}
              className="
                px-6 py-2.5
                text-base font-bold
                flex items-center gap-2
              "
              style={{
                background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)',
                color: '#FFFFFF',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                boxShadow: '0 4px 12px rgba(91, 33, 182, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(91, 33, 182, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(91, 33, 182, 0.3)';
              }}
            >
              <RefreshCw className="h-5 w-5" />
              Reorder
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
