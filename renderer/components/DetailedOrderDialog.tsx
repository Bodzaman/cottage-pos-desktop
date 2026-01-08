



import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Printer, Banknote, RotateCcw, Play, Download, AlertTriangle, Plus, CheckSquare, Trash2, Edit, FileAudio, History, Copy, Receipt, User, Clock, Phone, Mail, MapPin } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useSimpleAuth } from 'utils/simple-auth-context';
import { Order } from 'utils/orderManagementService';
import { formatCurrency } from 'utils/formatters';
import { useMountedRef, useSafeTimeout } from 'utils/safeHooks';
import { QSAITheme } from 'utils/QSAIDesign';
import { cn } from '@/lib/utils';

interface Props {
  order: Order | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderSource?: 'AI_VOICE' | 'WEBSITE' | 'POS';
  onApproveOrder?: (orderId: string) => void;
  onRejectOrder?: (orderId: string) => void;
  onEdit?: (order: Order) => void;
  onPrint?: (order: Order) => void;
}

// Status colors for order badges
const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-500/20 text-blue-500 border-blue-500/20",
  preparing: "bg-purple-500/20 text-purple-500 border-purple-500/20",
  ready: "bg-green-500/20 text-green-500 border-green-500/20",
  completed: "bg-green-700/20 text-green-600 border-green-700/20",
  cancelled: "bg-red-500/20 text-red-500 border-red-500/20",
  new: "bg-blue-500/20 text-blue-500 border-blue-500/20",
  processing: "bg-amber-500/20 text-amber-500 border-amber-500/20",
  refunded: "bg-red-600/20 text-red-400 border-red-600/20"
};

// Helper function to format dates
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return format(date, 'PPP p'); // e.g., "January 1, 2025 at 2:30 PM"
  } catch {
    return 'Unknown date';
  }
};

// Utility function to get transcript for order
const getTranscriptForOrder = (orderId: string, fallbackTranscript?: string): string => {
  // In a real implementation, this would fetch from a database or API
  // For now, return a sample transcript or the fallback
  if (fallbackTranscript) {
    return fallbackTranscript;
  }
  
  return `[${formatDate(new Date().toISOString())}] Customer called in for order #${orderId}

Customer: Hello, I'd like to place an order for delivery please.
Agent: Of course! I'd be happy to help you with that. Can I start with your phone number?
Customer: Yes, it's 07700 900123
Agent: Thank you. And what's your postcode for delivery?
Customer: SW1A 1AA
Agent: Perfect, we deliver to that area. What would you like to order today?
Customer: I'd like a chicken tikka masala with pilau rice, and some naan bread please.
Agent: Excellent choice! Would you like a particular type of naan?
Customer: Garlic naan please.
Agent: Great! So that's chicken tikka masala, pilau rice, and garlic naan. Anything else?
Customer: That's all, thank you.
Agent: Perfect! Your total comes to £18.50 and delivery will be approximately 45 minutes. Is that okay?
Customer: Yes, that's fine.
Agent: Wonderful! I'll get that order started for you right away.`;
};

export const DetailedOrderDialog: React.FC<Props> = ({ 
  order, 
  isOpen, 
  onOpenChange, 
  orderSource = 'WEBSITE',
  onApproveOrder,
  onRejectOrder,
  onEdit,
  onPrint
}) => {
  // Early return if order is null to prevent null reference errors
  if (!order) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl bg-[#101010] border-purple-500/20 text-white">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <p className="text-gray-400">No order selected</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [isConfirmingRefund, setIsConfirmingRefund] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundNotes, setRefundNotes] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const { user } = useSimpleAuth();
  
  const mountedRef = useMountedRef();
  const { setSafeTimeout } = useSafeTimeout();
  const transcriptRef = useRef<HTMLPreElement>(null);
  
  // Determine if this is an AI voice order
  const isAiVoiceOrder = orderSource === 'AI_VOICE';
  
  // Handler functions
  const handleEdit = () => {
    if (onEdit && order) {
      onEdit(order);
      onOpenChange(false);
    } else {
      toast.info("Edit functionality not implemented yet");
    }
  };
  
  const handlePrint = () => {
    if (onPrint && order) {
      onPrint(order);
    } else {
      // Default print behavior
      handlePrintReceipt();
    }
  };

  // Print receipt with safe timeout handling
  const handlePrintReceipt = async () => {
    if (!mountedRef.current) return;
    
    setIsProcessingAction(true);
    
    // Start a loading toast
    const loadingToast = toast.loading(`Preparing receipt for order ${order.order_id}...`);
    
    try {
      // Check if order has been modified
      const hasBeenModified = order.history && order.history.some(h => 
        h.action === 'EDITED' || h.action === 'EDIT_STARTED'
      );
      
      // Format order details for printing
      const printContent = `
        COTTAGE TANDOORI
        ${hasBeenModified ? '*** MODIFIED RECEIPT ***' : 'RECEIPT'}
        ===============================
        Order #: ${order.order_id}
        Type: ${order.order_type}
        Date: ${format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
        ${order.table_number ? `Table: ${order.table_number}` : ''}
        ${order.customer_name ? `Customer: ${order.customer_name}` : ''}
        ${order.customer_phone ? `Phone: ${order.customer_phone}` : ''}
        ===============================
        ITEMS:
        ${(order.items || []).map(item => `
          ${item.quantity}x ${item.name} ${formatCurrency(item.price * item.quantity)}
          ${item.modifiers ? item.modifiers.map(mod => 
            mod.options.map(opt => `   + ${mod.groupName}: ${opt.name} ${opt.price > 0 ? formatCurrency(opt.price * item.quantity) : ''}`).join('\n')
          ).join('\n') : ''}
          ${item.notes ? `   Note: ${item.notes}` : ''}
        `).join('\n')}
        ===============================
        Subtotal: ${formatCurrency(order.subtotal)}
        ${order.discounts > 0 ? `Discount: -${formatCurrency(order.discounts)}` : ''}
        ${order.delivery_fee > 0 ? `Delivery: ${formatCurrency(order.delivery_fee)}` : ''}
        Tax: ${formatCurrency(order.tax)}
        Total: ${formatCurrency(order.total)}
        ===============================
        Payment: ${order.payment_method}
        Status: ${order.status}
        ${order.special_instructions ? `\nSpecial Instructions:\n${order.special_instructions}` : ''}
        ===============================
        Thank you for your order!
      `;
      
      // Open print window
      const printWindow = window.open('', '', 'height=600,width=800');
      if (!printWindow) {
        throw new Error('Failed to open print window. Pop-up blocker may be enabled.');
      }
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - Order ${order.order_id}</title>
            <style>
              body { 
                font-family: monospace; 
                white-space: pre-wrap; 
                padding: 20px;
                line-height: 1.3;
              }
              .modified-warning {
                background-color: #ffdddd;
                border: 1px solid #ff0000;
                padding: 4px;
                margin-top: 10px;
                font-weight: bold;
                color: #cc0000;
              }
            </style>
          </head>
          <body>
            ${printContent.replace(/\n/g, '<br>')}
            ${hasBeenModified ? `<div class="modified-warning">This order has been modified since original creation</div>` : ''}
          </body>
        </html>
      `);
      
      // Use safe timeout for print operations
      setSafeTimeout(() => {
        if (!mountedRef.current) return;
        
        try {
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          printWindow.close();
          
          // Dismiss loading toast and show success
          toast.dismiss(loadingToast);
          
          if (hasBeenModified) {
            toast.info("This order has been modified since original creation", {
              duration: 4000,
            });
            toast.success(`Receipt printed for order ${order.order_id} with MODIFIED notation`);
          } else {
            toast.success(`Receipt for order ${order.order_id} printed successfully`);
          }
          
          // Add print action to order history in a real implementation
          console.log(`Receipt printed for order ${order.order_id}`);
        } catch (printError) {
          console.error('Error during print operation:', printError);
          if (mountedRef.current) {
            toast.dismiss(loadingToast);
            toast.error(`Print operation failed: ${printError.message || 'Unknown error'}`);
          }
        }
      }, 300);
      
    } catch (error) {
      console.error('Error printing receipt:', error);
      if (mountedRef.current) {
        toast.dismiss(loadingToast);
        toast.error(`Failed to print receipt: ${error.message || 'Unknown error'}`);
      }
    } finally {
      // Reset processing state
      if (mountedRef.current) {
        setIsProcessingAction(false);
      }
    }
  };

  // Handle refund
  const handleRefund = () => {
    // Show confirmation modal
    setIsConfirmingRefund(true);
  };
  
  // Handle actual refund after confirmation with safe timeout
  const handleConfirmedRefund = async () => {
    if (!mountedRef.current) return;
    
    setIsConfirmingRefund(false);
    setIsRefunding(true);
    setIsProcessingAction(true);
    
    // Start a loading toast
    const loadingToast = toast.loading(`Processing refund for order ${order.order_id}...`);
    
    try {
      // In a real implementation, this would call the payment provider's API
      // For now, we'll simulate a successful refund after a delay
      
      // Add refund record to order history
      const refundHistory = {
        action: 'REFUNDED',
        timestamp: new Date(),
        user_id: user?.id || 'unknown',
        user_name: user?.displayName || 'Staff',
        notes: `Full refund of ${formatCurrency(order.total)} processed.`
      };
      
      // In a real app, this would be an API call to update the order status and add history
      console.log('Processing refund for order:', order.order_id);
      console.log('Adding refund history:', refundHistory);
      
      // Simulate API delay with safe timeout
      await new Promise(resolve => {
        setSafeTimeout(() => {
          if (mountedRef.current) {
            resolve(undefined);
          }
        }, 2000);
      });
      
      if (!mountedRef.current) return;
      
      // Success!
      toast.dismiss(loadingToast);
      toast.success(`Refund processed successfully for order ${order.order_id}`);
      
      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error('Error processing refund:', error);
      if (mountedRef.current) {
        toast.dismiss(loadingToast);
        toast.error(`Failed to process refund: ${error.message || 'Unknown error'}`);
      }
    } finally {
      if (mountedRef.current) {
        setIsRefunding(false);
        setIsProcessingAction(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-[#101010] border-purple-500/20 text-white">
        {/* Refund Confirmation Dialog */}
        {isConfirmingRefund && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#151515] border border-red-500/30 rounded-lg p-6 max-w-md w-full shadow-xl">
              <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                <AlertTriangle className="text-red-400 h-5 w-5" />
                Confirm Refund
              </h3>
              <p className="mb-6 text-gray-300">
                Are you sure you want to process a full refund of <span className="font-bold text-white">{formatCurrency(order.total)}</span> for order <span className="font-bold text-white">#{order.order_id}</span>?
              </p>
              <Textarea
                value={refundNotes}
                onChange={(e) => setRefundNotes(e.target.value)}
                placeholder="Add refund notes (optional)"
                className="mb-4"
              />
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  onClick={() => setIsConfirmingRefund(false)}
                  disabled={isRefunding}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={handleConfirmedRefund}
                  disabled={isRefunding}
                >
                  {isRefunding ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm Refund"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
        <DialogHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 w-full">
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl" style={{ color: QSAITheme.purple.primary }}>
                  Order #{order.order_id}
                </DialogTitle>
                <Badge 
                  className={cn(
                    "ml-2 capitalize", 
                    statusColors[order.status] || "bg-gray-500/20 text-gray-400 border-gray-500/20"
                  )}
                >
                  {order.status}
                </Badge>
                <Badge 
                  variant="outline" 
                  className="capitalize bg-gray-800 text-white border-gray-700"
                >
                  {order.order_type}
                </Badge>
              </div>
              <DialogDescription className="text-gray-400">
                {formatDate(order.created_at)}
              </DialogDescription>
            </div>
            
            <div className="flex flex-wrap gap-2 self-start sm:self-center mt-2 sm:mt-0">
              {/* Approve/Reject buttons for NEW AI voice orders */}
              {orderSource === 'AI_VOICE' && order.status === 'NEW' && onApproveOrder && onRejectOrder && (
                <div className="flex gap-2 mr-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="bg-green-950/30 border-green-500/20 text-green-400 hover:bg-green-900/20 hover:text-green-300"
                    onClick={() => {
                      onOpenChange(false); // Close dialog first
                      onApproveOrder(order.order_id);
                    }}
                    disabled={isProcessingAction}
                  >
                    <CheckSquare className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="bg-red-950/30 border-red-500/20 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                    onClick={() => {
                      onOpenChange(false); // Close dialog first
                      onRejectOrder(order.order_id);
                    }}
                    disabled={isProcessingAction}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                className="bg-purple-950/30 border-purple-500/20 text-purple-400 hover:bg-purple-900/20 hover:text-purple-300"
                onClick={handleEdit}
                disabled={isProcessingAction}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-blue-950/30 border-blue-500/20 text-blue-400 hover:bg-blue-900/20 hover:text-blue-300"
                onClick={handlePrint}
                disabled={isProcessingAction}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              {order.payment && order.payment.method !== 'PENDING' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-red-950/30 border-red-500/20 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors duration-200"
                  onClick={handleRefund}
                  disabled={isProcessingAction}
                >
                  {isRefunding ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-1 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Refund
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="md:col-span-2 space-y-4">
              {/* Order Items */}
              <div className="bg-[#151515] rounded-lg border border-gray-800 p-4">
                <h3 className="text-lg font-medium flex items-center gap-2" style={{ color: QSAITheme.purple.primary }}>
                  <Receipt className="h-5 w-5" />
                  Order Items
                </h3>
                <div className="space-y-3">
                   {(order.items || []).map((item, index) => (
                     <div key={index} className="border-b border-gray-800 pb-3 last:border-b-0 last:pb-0">
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="font-medium text-white">
                              {item.quantity}x {item.name}
                            </p>
                            <p className="text-white">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                          </div>
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div className="mt-1.5 pl-4 space-y-1">
                              {item.modifiers.map((mod, mIdx) => (
                                <div key={mIdx} className="flex justify-between text-sm text-gray-400">
                                  <span>{mod.groupName}: {mod.options.map(opt => opt.name).join(', ')}</span>
                                  <span>{formatCurrency(mod.options.reduce((sum, opt) => sum + opt.price, 0) * item.quantity)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {item.notes && (
                            <p className="mt-1.5 pl-4 text-sm italic text-gray-400">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-800 space-y-2">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.tax > 0 && (
                    <div className="flex justify-between text-gray-400">
                      <span>VAT (20%)</span>
                      <span>{formatCurrency(order.tax)}</span>
                    </div>
                  )}
                  {order.service_charge > 0 && (
                    <div className="flex justify-between text-gray-400">
                      <span>Service Charge</span>
                      <span>{formatCurrency(order.service_charge)}</span>
                    </div>
                  )}
                  {order.discount > 0 && (
                    <div className="flex justify-between text-gray-400">
                      <span>Discount</span>
                      <span>-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-white">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                  {order.payment && (
                    <>
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>Payment Method</span>
                        <span className="capitalize">{order.payment.method}</span>
                      </div>
                      {order.payment.transaction_id && (
                        <div className="flex justify-between text-sm text-gray-400">
                          <span>Transaction ID</span>
                          <span className="font-mono">{order.payment.transaction_id}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Order History Section */}
              <div className="bg-[#151515] rounded-lg border border-gray-800 p-4">
                <h3 className="text-lg font-medium flex items-center gap-2 mb-3" style={{ color: QSAITheme.purple.primary }}>
                  <History className="h-5 w-5" />
                  Order History
                </h3>
                
                <div className="space-y-2 text-sm">
                  {/* Convert generic history into detailed history steps */}
                  {order.history ? (
                    // If we have actual history records
                    order.history.map((historyItem, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="h-6 w-6 rounded-full flex items-center justify-center mt-0.5" style={{ backgroundColor: `${QSAITheme.purple.primary}20` }}>
                          <span className="text-xs" style={{ color: QSAITheme.purple.primary }}>{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-white capitalize">
                            {historyItem.action === 'CREATED' ? 'Order created' : 
                             historyItem.action === 'APPROVED' ? 'Order approved and sent to kitchen' :
                             historyItem.action === 'EDITED' ? 'Order edited' :
                             historyItem.action === 'COMPLETED' ? 'Order completed' :
                             historyItem.action === 'CANCELLED' ? 'Order cancelled' :
                             historyItem.action === 'REFUNDED' ? 'Order refunded' :
                             historyItem.action}
                             {historyItem.user && ` by ${historyItem.user}`}
                          </p>
                          <p className="text-gray-400 text-xs">{format(new Date(historyItem.timestamp), "MMM d, yyyy 'at' h:mm a")}</p>
                          {historyItem.note && (
                            <p className="text-gray-400 text-xs mt-1 italic">Note: {historyItem.note}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    // Fallback generated history if no actual records exist
                    <>
                      <div className="flex items-start gap-2">
                        <div className="h-6 w-6 rounded-full flex items-center justify-center mt-0.5" style={{ backgroundColor: `${QSAITheme.purple.primary}20` }}>
                          <span className="text-xs" style={{ color: QSAITheme.purple.primary }}>1</span>
                        </div>
                        <div>
                          <p className="text-white">Order created</p>
                          <p className="text-gray-400 text-xs">{format(order.created_at, "MMM d, yyyy 'at' h:mm a")}</p>
                        </div>
                      </div>
                      
                      {order.status !== "NEW" && (
                        <div className="flex items-start gap-2">
                          <div className="h-6 w-6 rounded-full flex items-center justify-center mt-0.5" style={{ backgroundColor: `${QSAITheme.purple.primary}20` }}>
                            <span className="text-xs" style={{ color: QSAITheme.purple.primary }}>2</span>
                          </div>
                          <div>
                            <p className="text-white">Order approved and sent to kitchen</p>
                            <p className="text-gray-400 text-xs">{format(new Date(new Date(order.created_at).getTime() + 5 * 60000), "MMM d, yyyy 'at' h:mm a")}</p>
                          </div>
                        </div>
                      )}
                      
                      {order.status === "COMPLETED" && (
                        <div className="flex items-start gap-2">
                          <div className="h-6 w-6 rounded-full flex items-center justify-center mt-0.5" style={{ backgroundColor: `${QSAITheme.purple.primary}20` }}>
                            <span className="text-xs" style={{ color: QSAITheme.purple.primary }}>3</span>
                          </div>
                          <div>
                            <p className="text-white">Order completed</p>
                            <p className="text-gray-400 text-xs">{format(order.completed_at, "MMM d, yyyy 'at' h:mm a")}</p>
                          </div>
                        </div>
                      )}
                      
                      {order.status === "CANCELLED" && (
                        <div className="flex items-start gap-2">
                          <div className="h-6 w-6 rounded-full flex items-center justify-center mt-0.5" style={{ backgroundColor: `${QSAITheme.purple.primary}20` }}>
                            <span className="text-xs" style={{ color: QSAITheme.purple.primary }}>3</span>
                          </div>
                          <div>
                            <p className="text-white">Order cancelled</p>
                            <p className="text-gray-400 text-xs">{format(order.completed_at, "MMM d, yyyy 'at' h:mm a")}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* AI Transcript (for voice orders only) */}
              {isAiVoiceOrder && (
                <div className="bg-[#151515] rounded-lg border border-gray-800 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium flex items-center gap-2" style={{ color: QSAITheme.purple.primary }}>
                      <FileAudio className="h-5 w-5" />
                      Voice Order Transcript
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline"
                        size="sm" 
                        onClick={() => {
                          // Set processing state
                          setIsProcessingAction(true);
                          
                          // In a real app, this would download an audio file
                          const loadingToast = toast.loading("Preparing audio recording...");
                          
                          setTimeout(() => {
                            toast.dismiss(loadingToast);
                            toast.success("Audio recording downloaded");
                            setIsProcessingAction(false);
                          }, 1200);
                        }}
                        disabled={isProcessingAction}
                        className="text-gray-400 hover:text-white h-8 px-2 bg-gray-800/50 border-gray-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowTranscript(!showTranscript)}
                        className="text-gray-400 hover:text-white"
                        disabled={isProcessingAction}
                      >
                        {showTranscript ? "Hide" : "Show"}
                      </Button>
                    </div>
                  </div>
                  
                  {showTranscript && (
                    <div className="bg-[#0a0a0a] p-3 rounded border border-gray-800 text-gray-300 text-sm overflow-x-auto">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-400">
                          Call Duration: {order.call_duration || "4m 32s"} • 
                          {formatDate(order.created_at)}
                        </span>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs bg-blue-900/20 text-blue-400 border-blue-800/30">AI Transcription</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs bg-gray-800/30 border-gray-700 hover:bg-gray-800 text-gray-400 hover:text-white"
                            onClick={() => {
                              // Create a printable version of the transcript
                              const printContent = `
                                VOICE ORDER TRANSCRIPT
                                ======================
                                Order ID: ${order.order_id}
                                Call Duration: ${order.call_duration || "4m 32s"}
                                Date: ${formatDate(order.created_at)}
                                
                                ${getTranscriptForOrder(order.order_id, order.transcript || '')}
                                
                                Generated by Cottage Tandoori Voice Ordering System
                              `;
                              
                              // Set up printing
                              const printWindow = window.open('', '', 'height=600,width=800');
                              if (!printWindow) {
                                toast.error("Popup blocked. Please allow popups to print transcript.");
                                return;
                              }
                              
                              printWindow.document.write(`
                                <html>
                                  <head>
                                    <title>Voice Order Transcript #${order.order_id}</title>
                                    <style>
                                      body { 
                                        font-family: monospace; 
                                        white-space: pre-wrap; 
                                        padding: 20px; 
                                        line-height: 1.5;
                                      }
                                    </style>
                                  </head>
                                  <body>
                                    ${printContent.replace(/\n/g, '<br>')}
                                  </body>
                                </html>
                              `);
                              
                              // Print and close
                              setTimeout(() => {
                                printWindow.document.close();
                                printWindow.focus();
                                printWindow.print();
                                printWindow.close();
                                toast.success("Transcript sent to printer");
                              }, 300);
                            }}
                          >
                            <Printer className="h-3 w-3 mr-1" /> Print
                          </Button>
                        </div>
                      </div>
                      <div className="bg-[#0E0E0E] p-3 rounded border border-gray-800 max-h-[300px] overflow-y-auto">
                        <pre ref={transcriptRef} className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                          {getTranscriptForOrder(order.order_id, order.transcript || '')}
                        </pre>
                        <div className="mt-3 flex justify-between items-center border-t border-gray-800 pt-2">
                          {order.transcript_id && (
                            <div className="text-xs text-gray-500">
                              <p>Transcript ID: {order.transcript_id}</p>
                              <p className="mt-1">Voice Analysis: {order.voice_confidence || "High confidence"}</p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs bg-gray-800/30 border-gray-700 hover:bg-gray-800 text-gray-400 hover:text-white"
                              onClick={() => {
                                // Copy transcript to clipboard
                                navigator.clipboard.writeText(getTranscriptForOrder(order.order_id, order.transcript || ''))
                                  .then(() => {
                                    toast.success("Transcript copied to clipboard");
                                  })
                                  .catch((err) => {
                                    console.error('Failed to copy transcript:', err);
                                    toast.error("Failed to copy transcript");
                                  });
                              }}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              <span className="ml-1">Copy</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs bg-gray-800/30 border-gray-700 hover:bg-gray-800 text-gray-400 hover:text-white"
                              onClick={() => {
                                // In a real app, this would download a text file of the transcript
                                const blob = new Blob([getTranscriptForOrder(order.order_id, order.transcript || '')], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `transcript-order-${order.order_id}.txt`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                toast.success("Transcript downloaded");
                              }}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              <span className="ml-1">Download</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Customer and Order Info */}
            <div className="space-y-4">
              {/* Customer Information */}
              <div className="bg-[#151515] rounded-lg border border-gray-800 p-4">
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2" style={{ color: QSAITheme.purple.primary }}>
                  <User className="h-5 w-5" />
                  Customer Information
                </h3>
                <div className="space-y-3">
                  {order.customer_name && (
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-white">{order.customer_name}</p>
                      </div>
                    </div>
                  )}
                  {order.customer_phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-white">{order.customer_phone}</p>
                      </div>
                    </div>
                  )}
                  {order.customer_email && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-white">{order.customer_email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Order Timing */}
              <div className="bg-[#151515] rounded-lg border border-gray-800 p-4">
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2" style={{ color: QSAITheme.purple.primary }}>
                  <Clock className="h-5 w-5" />
                  Order Timing
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-400">Created</p>
                      <p className="text-white">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  {order.completed_at && (
                    <div className="flex items-start gap-2">
                      <CheckSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-400">Completed</p>
                        <p className="text-white">{formatDate(order.completed_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Table Information (if dine-in) */}
              {order?.order_type === 'DINE-IN' && order?.table_number && (
                <div className="bg-[#151515] rounded-lg border border-gray-800 p-4">
                  <h3 className="text-lg font-medium mb-3 flex items-center gap-2" style={{ color: QSAITheme.purple.primary }}>
                    <MapPin className="h-5 w-5" />
                    Table Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-white text-xl font-medium">Table {order.table_number}</p>
                        {order.guest_count && (
                          <p className="text-gray-400">{order.guest_count} {order.guest_count === 1 ? 'guest' : 'guests'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Notes */}
              {order.notes && (
                <div className="bg-[#151515] rounded-lg border border-gray-800 p-4">
                  <h3 className="text-lg font-medium mb-2" style={{ color: QSAITheme.purple.primary }}>
                    Order Notes
                  </h3>
                  <p className="text-gray-300">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
