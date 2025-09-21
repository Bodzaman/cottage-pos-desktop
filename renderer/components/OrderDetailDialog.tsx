import { useState, useEffect } from "react";
import { useSimpleAuth } from "../utils/simple-auth-context";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Clock, MapPin, Phone, Receipt, Printer, Edit, RefreshCcw, User, CheckSquare, Trash2, FileAudio, History, ChevronDown, Calendar } from "lucide-react";
import { toast } from "sonner";
import { cn } from "utils/cn";
import { getOrderAuditTrail, AuditEntry, createRefundAudit, createCancelAudit, createCompletionAudit } from "../utils/orderAuditTrail";

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: {
    name: string;
    price: number;
  }[];
  notes?: string;
}

export interface OrderAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  notes?: string;
}

export interface OrderData {
  id: string;
  orderNumber: string;
  source: "ai-voice" | "online" | "pos";
  status: "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
  type: "delivery" | "pickup" | "dine-in";
  items: OrderItem[];
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  address?: OrderAddress;
  payment: {
    method: "card" | "cash" | "pending";
    status: "paid" | "pending" | "failed";
    amount: number;
    reference?: string;
  };
  timestamps: {
    created: string;
    updated?: string;
    scheduled?: string;
  };
  transcript?: string; // For AI voice orders
}

interface OrderDetailDialogProps {
  order: OrderData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (order: OrderData) => void;
  onPrint: (order: OrderData) => void;
  onRefund: (order: OrderData) => void;
  onDelete?: (order: OrderData) => void;
  onComplete?: (order: OrderData) => void;
  orderSource: "ai-voice" | "online" | "pos";
}

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-500/20 text-blue-500 border-blue-500/20",
  preparing: "bg-purple-500/20 text-purple-500 border-purple-500/20",
  ready: "bg-green-500/20 text-green-500 border-green-500/20",
  completed: "bg-green-700/20 text-green-600 border-green-700/20",
  cancelled: "bg-red-500/20 text-red-500 border-red-500/20",
};

export function OrderDetailDialog({
  order,
  open,
  onOpenChange,
  onEdit,
  onPrint,
  onRefund,
  onDelete,
  onComplete,
  orderSource
}: OrderDetailDialogProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  
  // Fetch audit trail when order changes
  useEffect(() => {
    if (order) {
      const trail = getOrderAuditTrail(order.id);
      if (trail) {
        setAuditEntries(trail.entries);
      } else {
        setAuditEntries([]);
      }
    }
  }, [order]);

  if (!order) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const handleEdit = () => {
    // Store original order before edit for audit comparison
    localStorage.setItem('originalOrderBeforeEdit', JSON.stringify(order));
    onEdit(order);
    onOpenChange(false);
    // Audit trail will be created in the component that handles the edit
  };

  const handlePrint = () => {
    onPrint(order);
    toast.success("Printing order receipt");
  };

  const handleRefund = () => {
    // Show confirmation dialog before refund
    if (confirm(`Are you sure you want to refund this order: #${order.orderNumber}?`)) {
      // Create audit entry for refund
      const { user } = useSimpleAuth();
      if (user) {
        const refundAmount = order.payment.amount; // Full refund by default
        createRefundAudit(
          order.id,
          user.id,
          user.name || user.email || 'Staff',
          order.source,
          refundAmount,
          'Customer requested refund'
        );
      }
      
      onRefund(order);
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm(`Are you sure you want to delete this order: #${order.orderNumber}?`)) {
      // Create audit entry for cancellation
      const { user } = useSimpleAuth();
      if (user) {
        createCancelAudit(
          order.id,
          user.id,
          user.name || user.email || 'Staff',
          order.source,
          'Order cancelled by staff'
        );
      }
      
      onDelete(order);
      onOpenChange(false);
    }
  };

  const handleComplete = () => {
    if (onComplete && confirm(`Mark order #${order.orderNumber} as completed?`)) {
      // Create audit entry for completion
      const { user } = useSimpleAuth();
      if (user) {
        createCompletionAudit(
          order.id,
          user.id,
          user.name || user.email || 'Staff',
          order.source
        );
      }
      
      onComplete(order);
      onOpenChange(false);
    }
  };

  // Calculate subtotal, delivery fee, and total
  const subtotal = order.items.reduce((sum, item) => {
    const modifiersTotal = item.modifiers ? item.modifiers.reduce((mSum, mod) => mSum + mod.price, 0) : 0;
    return sum + (item.price + modifiersTotal) * item.quantity;
  }, 0);
  
  const deliveryFee = order.type === "delivery" ? 2.50 : 0;
  const total = subtotal + deliveryFee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-[#101010] border-purple-500/20 text-white">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 w-full">
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl text-purple-400">
                  Order #{order.orderNumber}
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
                  {order.type}
                </Badge>
              </div>
              <DialogDescription className="text-gray-400">
                {format(new Date(order.timestamps.created), "PPP 'at' p")}
                {order.timestamps.scheduled && (
                  <span className="ml-2">
                    • Scheduled for {format(new Date(order.timestamps.scheduled), "p")}
                  </span>
                )}
              </DialogDescription>
            </div>
            
            <div className="flex flex-wrap gap-2 self-start sm:self-center mt-2 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                className="bg-purple-950/30 border-purple-500/20 text-purple-400 hover:bg-purple-900/20 hover:text-purple-300"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-blue-950/30 border-blue-500/20 text-blue-400 hover:bg-blue-900/20 hover:text-blue-300"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              {order.payment.status === "paid" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-red-950/30 border-red-500/20 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                  onClick={handleRefund}
                >
                  <RefreshCcw className="h-4 w-4 mr-1" />
                  Refund
                </Button>
              )}
              {onComplete && order.status !== "completed" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-green-950/30 border-green-500/20 text-green-400 hover:bg-green-900/20 hover:text-green-300"
                  onClick={handleComplete}
                >
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Complete
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-red-950/30 border-red-500/20 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
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
                <h3 className="text-lg font-medium text-purple-400 mb-3 flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Order Items
                </h3>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
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
                                  <span>{mod.name}</span>
                                  <span>{formatCurrency(mod.price)}</span>
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
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {order.type === "delivery" && (
                    <div className="flex justify-between text-gray-400">
                      <span>Delivery Fee</span>
                      <span>{formatCurrency(deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-white">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Payment Method</span>
                    <span className="capitalize">{order.payment.method}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Payment Status</span>
                    <span className={cn(
                      "capitalize", 
                      order.payment.status === "paid" ? "text-green-400" : 
                      order.payment.status === "pending" ? "text-yellow-400" : "text-red-400"
                    )}>{order.payment.status}</span>
                  </div>
                  {order.payment.reference && (
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Payment Reference</span>
                      <span className="font-mono">{order.payment.reference}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* AI Transcript (for voice orders only) */}
              {order.source === "ai-voice" && order.transcript && (
                <div className="bg-[#151515] rounded-lg border border-gray-800 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-purple-400 flex items-center gap-2">
                      <FileAudio className="h-5 w-5" />
                      Voice Order Transcript
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowTranscript(!showTranscript)}
                      className="text-gray-400 hover:text-white"
                    >
                      {showTranscript ? "Hide" : "Show"}
                    </Button>
                  </div>
                  
                  {showTranscript && (
                    <div className="bg-[#0a0a0a] p-3 rounded border border-gray-800 text-gray-300 text-sm overflow-x-auto">
                      <pre className="whitespace-pre-wrap font-mono text-xs">{order.transcript}</pre>
                    </div>
                  )}
                </div>
              )}
              
              {/* Order Audit Trail */}
              <div className="bg-[#151515] rounded-lg border border-gray-800 p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-purple-400 flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Order Audit Trail
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAuditTrail(!showAuditTrail)}
                    className="text-gray-400 hover:text-white"
                  >
                    {showAuditTrail ? "Hide" : "Show"}
                  </Button>
                </div>
                
                {showAuditTrail && (
                  <div className="bg-[#0a0a0a] p-3 rounded border border-gray-800 text-gray-300 text-sm">
                    {auditEntries.length > 0 ? (
                      <div className="space-y-3">
                        {auditEntries.map((entry, index) => (
                          <div key={index} className="border-b border-gray-800 pb-3 last:border-b-0 last:pb-0">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs text-purple-400">
                                {new Date(entry.timestamp).toLocaleString()}
                              </span>
                              <Badge 
                                className={cn(
                                  "capitalize", 
                                  entry.action === "created" ? "bg-blue-500/20 text-blue-500 border-blue-500/20" :
                                  entry.action === "edited" ? "bg-purple-500/20 text-purple-500 border-purple-500/20" :
                                  entry.action === "status_changed" ? "bg-amber-500/20 text-amber-500 border-amber-500/20" :
                                  entry.action === "cancelled" ? "bg-red-500/20 text-red-500 border-red-500/20" :
                                  entry.action === "refunded" ? "bg-red-500/20 text-red-500 border-red-500/20" :
                                  "bg-green-500/20 text-green-500 border-green-500/20"
                                )}
                              >
                                {entry.action.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex gap-2 text-xs text-gray-400 mb-1">
                              <span>By: {entry.userName}</span>
                            </div>
                            {entry.notes && (
                              <div className="text-xs text-gray-300 mb-2">{entry.notes}</div>
                            )}
                            {entry.changes && entry.changes.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs text-gray-400 mb-1">Changes:</div>
                                <div className="pl-2 space-y-1">
                                  {entry.changes.map((change, idx) => (
                                    <div key={idx} className="text-xs">
                                      <span className="text-purple-400">{change.field}:</span>{' '}
                                      {typeof change.oldValue === 'object' && typeof change.newValue === 'object' ? (
                                        <span className="text-gray-300">Changed object values</span>
                                      ) : (
                                        <span className="text-gray-300">
                                          {JSON.stringify(change.oldValue)} → {JSON.stringify(change.newValue)}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-2">
                        No audit history available for this order
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Customer and Delivery Info */}
            <div className="space-y-4">
              <div className="bg-[#151515] rounded-lg border border-gray-800 p-4">
                <h3 className="text-lg font-medium text-purple-400 mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-white">{order.customer.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-white">{order.customer.phone}</p>
                    </div>
                  </div>
                  {order.customer.email && (
                    <div className="flex items-start gap-2">
                      <div className="h-4 w-4 text-gray-400 mt-0.5 flex items-center justify-center">
                        @
                      </div>
                      <div className="flex-1">
                        <p className="text-white">{order.customer.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Order timing */}
              <div className="bg-[#151515] rounded-lg border border-gray-800 p-4">
                <h3 className="text-lg font-medium text-purple-400 mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Order Timing
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-400">Created</p>
                      <p className="text-white">{format(new Date(order.timestamps.created), "PPP 'at' p")}</p>
                    </div>
                  </div>
                  {order.timestamps.updated && (
                    <div className="flex items-start gap-2">
                      <RefreshCcw className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-400">Last Updated</p>
                        <p className="text-white">{format(new Date(order.timestamps.updated), "PPP 'at' p")}</p>
                      </div>
                    </div>
                  )}
                  {order.timestamps.scheduled && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-400">Scheduled For</p>
                        <p className="text-white">{format(new Date(order.timestamps.scheduled), "PPP 'at' p")}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Delivery Address (if delivery order) */}
              {order.type === "delivery" && order.address && (
                <div className="bg-[#151515] rounded-lg border border-gray-800 p-4">
                  <h3 className="text-lg font-medium text-purple-400 mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Address
                  </h3>
                  <div className="space-y-1">
                    <p className="text-white">{order.address.addressLine1}</p>
                    {order.address.addressLine2 && <p className="text-white">{order.address.addressLine2}</p>}
                    <p className="text-white">{order.address.city}, {order.address.postcode}</p>
                    {order.address.notes && (
                      <p className="mt-2 text-sm italic text-gray-400">Notes: {order.address.notes}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Pickup Information (if pickup order) */}
              {order.type === "pickup" && (
                <div className="bg-[#151515] rounded-lg border border-gray-800 p-4">
                  <h3 className="text-lg font-medium text-purple-400 mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Pickup Information
                  </h3>
                  <div className="space-y-1">
                    <p className="text-white">Cottage Tandoori</p>
                    <p className="text-white">25 High Street</p>
                    <p className="text-white">Anytown, AN1 1AB</p>
                    {order.timestamps.scheduled && (
                      <div className="mt-2 p-2 bg-purple-900/20 rounded border border-purple-500/20">
                        <p className="text-sm font-medium text-purple-400">Pickup Time:</p>
                        <p className="text-white">{format(new Date(order.timestamps.scheduled), "p 'on' EEEE, d MMMM")}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
