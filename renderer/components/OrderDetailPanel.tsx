
import React, { useState } from 'react';
import { format } from 'date-fns';
import { colors as designColors } from '../utils/designSystem';
import { globalColors } from '../utils/QSAIDesign';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, formatTime } from '../utils/formatters';
import { CompletedOrder } from '../utils/orderManagementService';
import { AlertTriangle, UserCheck, UserIcon, MessageSquare, Phone, Volume2, AlertCircle, Headphones, MicOff, CheckCircle, Copy, CreditCard, File, FileText, MapPin, ShoppingBag, Truck } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { extractItemName, extractVariantName, extractQuantity, formatOrderItemDisplay } from '../utils/orderDisplayUtils';

interface OrderDetailPanelProps {
  order: CompletedOrder | null;
  className?: string;
  onViewFullDetails?: () => void;
  onViewInAllOrders?: (orderId: string) => void;
}

/**
 * Center panel component that displays the details of a selected order.
 * Used in AI Orders and Online Orders sections of the POS system.
 */
export function OrderDetailPanel({
  order,
  className = '',
  onViewFullDetails,
  onViewInAllOrders
}: OrderDetailPanelProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  
  // Helper function to determine if order is from voice system
  const isVoiceOrder = order?.order_source === 'AI_VOICE';
  
  // Helper to get confidence level UI elements
  const getConfidenceIndicator = (confidence: number | undefined) => {
    if (confidence === undefined || confidence === null) return null;
    
    let color: string;
    let label: string;
    
    if (confidence >= 0.9) {
      color = '#10B981'; // Green
      label = 'High';
    } else if (confidence >= 0.7) {
      color = '#F59E0B'; // Amber
      label = 'Medium';
    } else {
      color = '#EF4444'; // Red
      label = 'Low';
    }
    
    return (
      <span 
        className="text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1"
        style={{ backgroundColor: `${color}20`, color: color }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        {label} confidence
      </span>
    );
  };
  if (!order) {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${className}`}>
        <div className="text-center space-y-4">
          <UserCheck className="h-16 w-16 mx-auto" style={{ 
            color: globalColors.purple.primary + '40',
            filter: `drop-shadow(0 0 8px ${globalColors.purple.primary}30)` 
          }} />
          <h3 className="text-lg font-medium" style={{ color: designColors.text.primary }}>
            Select an Order
          </h3>
          <p className="text-sm max-w-xs" style={{ color: designColors.text.secondary }}>
            Choose an order from the queue to view its details here.
          </p>
        </div>
      </div>
    );
  }

  {/* Voice Order Specific Elements */}
              {isVoiceOrder && order.transcript && (
                <Accordion type="single" collapsible className="mt-4">
                  <AccordionItem value="transcript" className="border-b-0">
                    <AccordionTrigger 
                      className="py-2 px-0 text-sm hover:no-underline"
                      style={{ color: globalColors.purple.light }}
                      onClick={() => setShowTranscript(!showTranscript)}
                    >
                      <div className="flex items-center gap-2">
                        <Headphones className="h-4 w-4" />
                        Call Transcript
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="h-32 rounded-md border p-2" style={{ 
                        borderColor: designColors.border.light,
                        backgroundColor: `${designColors.background.secondary}80` 
                      }}>
                        <div className="space-y-2 p-1 text-xs" style={{ color: designColors.text.secondary }}>
                          {typeof order.transcript === 'string' ? (
                            <p>{order.transcript}</p>
                          ) : (
                            Array.isArray(order.transcript) && (order.transcript || []).map((line, i) => (
                              <p key={i} className={line.speaker === 'system' ? 'italic' : ''}>
                                <strong>{line.speaker === 'system' ? 'AI:' : 'Customer:'}</strong> {line.text}
                              </p>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
  
  {/* Uncertainty indicators for voice orders */}
              {isVoiceOrder && order.order_confidence && (
                <div className="mt-4 space-y-2 rounded-md p-3" style={{ 
                  backgroundColor: `${designColors.background.secondary}60`,
                  borderLeft: `3px solid ${globalColors.purple.primary}`
                }}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium" style={{ color: designColors.text.primary }}>
                      Voice Recognition Confidence
                    </span>
                    {getConfidenceIndicator(order.order_confidence)}
                  </div>
                  
                  {order.uncertain_items && order.uncertain_items.length > 0 && (
                    <div className="mt-1">
                      <p className="text-xs mb-1" style={{ color: designColors.text.secondary }}>
                        Potential issues detected:
                      </p>
                      <ul className="text-xs space-y-1" style={{ color: designColors.text.secondary }}>
                        {(order.uncertain_items || []).map((item, idx) => (
                          <li key={idx} className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" style={{ color: '#F59E0B' }} />
                            <span>{item.item_name}: {item.issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

  // Get readable status label
  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case "NEW":
        return "New";
      case "APPROVED":
        return "Approved";
      case "PROCESSING":
        return "Processing";
      case "IN_PROGRESS":
        return "In Progress";
      case "READY":
        return "Ready";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };
  
  {/* Voice call quality indicator */}
      {isVoiceOrder && (
        <div className="flex items-center gap-1 my-3" style={{ color: designColors.text.secondary }}>
          <Headphones className="h-4 w-4" style={{ color: globalColors.purple.primary }} />
          <span className="text-xs">
            Voice Order {order.call_quality && (
              <span className="ml-1 text-xs">
                • {order.call_quality === 'good' ? 'Clear call' : 'Poor connection'}
              </span>
            )}
          </span>
        </div>
      )}
      
      {/* Voice recording player */}
      {isVoiceOrder && (
        <div className="mt-3">
          <button
            className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            onClick={() => setShowTranscript(!showTranscript)}
          >
            {showTranscript ? "Hide" : "Show"} Call Transcript
          </button>
          
          {showTranscript && (
            <div className="mt-2 p-2 rounded bg-gray-100 dark:bg-gray-800 text-xs">
              {order.call_transcript ? (
                <p className="whitespace-pre-wrap font-mono">{order.call_transcript}</p>
              ) : (
                <p className="italic text-gray-500">No transcript available for this call.</p>
              )}
              
              {order.voice_recording_url && (
                <div className="mt-2">
                  <p className="text-xs mb-1 font-medium">Voice Recording:</p>
                  <audio controls className="w-full h-8">
                    <source src={order.voice_recording_url} type="audio/mp3" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          )}
        </div>
      )}

  return (
    <div className={`h-full overflow-y-auto ${className}`}>
      {/* Order header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold" style={{ color: designColors.text.primary }}>
              Order {order.order_id}
            </h3>
            <p className="text-sm" style={{ color: designColors.text.secondary }}>
              {format(new Date(order.created_at || order.completed_at), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          
          <Badge 
            className="text-sm px-3 py-1"
            style={{ 
              backgroundColor: 
                order.status === "NEW" ? 'rgba(59, 130, 246, 0.7)' : 
                order.status === "APPROVED" ? 'rgba(16, 185, 129, 0.7)' : 
                order.status === "IN_PROGRESS" || order.status === "PROCESSING" ? 'rgba(245, 158, 11, 0.7)' : 
                order.status === "READY" ? 'rgba(139, 92, 246, 0.7)' : 
                order.status === "COMPLETED" ? 'rgba(16, 185, 129, 0.7)' : 
                'rgba(239, 68, 68, 0.7)',
              color: '#ffffff',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
            }}
          >
            {getOrderStatusLabel(order.status)}
          </Badge>
        </div>
        
        {order.customer && (
          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: `${designColors.background.secondary}50` }}>
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-full" style={{ backgroundColor: `${globalColors.purple.primary}30` }}>
                <UserIcon className="h-4 w-4" style={{ color: globalColors.purple.primary }} />
              </div>
              <div>
                <h4 className="font-medium text-sm" style={{ color: designColors.text.primary }}>
                  {order.customer.name || 'Customer'}
                </h4>
                {order.customer.phone && (
                  <div className="flex items-center text-xs gap-1 mt-1" style={{ color: designColors.text.secondary }}>
                    <Phone className="h-3 w-3" />
                    {order.customer.phone}
                  </div>
                )}
                {order.customer.email && (
                  <div className="text-xs mt-1" style={{ color: designColors.text.secondary }}>
                    {order.customer.email}
                  </div>
                )}
                {order.customer.address && (
                  <div className="text-xs mt-1" style={{ color: designColors.text.secondary }}>
                    {order.customer.address}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order items */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium" style={{ color: designColors.text.primary }}>Order Items</h4>
          <div className="flex space-x-2">
            {onViewInAllOrders && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewInAllOrders(order.order_id)}
                style={{ 
                  border: `1px solid ${globalColors.purple.primary}40`,
                  color: globalColors.purple.primary
                }}
              >
                View in All Orders
              </Button>
            )}
            {onViewFullDetails && (
              <Button
                size="sm"
                variant="outline"
                onClick={onViewFullDetails}
                style={{ 
                  border: `1px solid ${globalColors.purple.primary}40`,
                  color: globalColors.purple.primary
                }}
              >
                View Full Details
              </Button>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          {(order.items || []).map((item, index) => (
            <div 
              key={`${order.order_id}-item-${index}`} 
              className="py-3 border-b" 
              style={{ 
                borderBottomColor: designColors.border.light,
                color: designColors.text.primary
              }}
            >
              <div className="flex justify-between">
                <div className="flex-1">
                  <div className="font-medium" style={{ color: designColors.text.primary }}>
                    {extractQuantity(item)}x {extractItemName(item)}
                  </div>
                  {extractVariantName(item) && (
                    <div className="text-sm" style={{ color: designColors.text.secondary }}>
                      {extractVariantName(item)}
                    </div>
                  )}
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div className="text-sm mt-1" style={{ color: designColors.text.tertiary }}>
                      {item.modifiers.map((mod, i) => (
                        <div key={`${order.order_id}-item-${index}-mod-${i}`} className="ml-2 text-xs">
                          <span style={{ color: designColors.text.secondary }}>{mod.groupName}: </span>
                          {mod.options.map(opt => opt.name).join(", ")}
                        </div>
                      ))}
                    </div>
                  )}
                  {item.notes && (
                    <div className="text-xs italic mt-1" style={{ color: designColors.text.tertiary }}>
                      Note: {item.notes}
                    </div>
                  )}
                </div>
                <div style={{ color: designColors.text.primary, marginLeft: "1rem" }}>
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Order summary */}
      <div 
        className="rounded-lg p-4" 
        style={{ 
          backgroundColor: `${designColors.background.secondary}50`,
          color: designColors.text.primary
        }}
      >
        <h4 className="font-medium mb-4" style={{ color: designColors.text.primary }}>Order Summary</h4>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span style={{ color: designColors.text.secondary }}>Subtotal</span>
            <span style={{ color: designColors.text.primary }}>{formatCurrency(order.subtotal)}</span>
          </div>
          
          {/* Only show VAT breakdown if enabled in settings */}
          {(typeof window !== 'undefined' && window.posSettings?.vat?.show_breakdown !== false) && (
            <div className="flex justify-between">
              <span style={{ color: designColors.text.secondary }}>
                VAT ({typeof window !== 'undefined' && window.posSettings?.vat ? window.posSettings.vat.percentage : 20}%, included)
              </span>
              <span style={{ color: designColors.text.primary }}>{formatCurrency(order.tax)}</span>
            </div>
          )}
          
          {order.service_charge > 0 && (
            <div className="flex justify-between">
              <span style={{ color: designColors.text.secondary }}>Service Charge</span>
              <span style={{ color: designColors.text.primary }}>{formatCurrency(order.service_charge)}</span>
            </div>
          )}
          
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span style={{ color: designColors.text.secondary }}>Discount</span>
              <span style={{ color: designColors.status.error }}>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          
          {order.tip > 0 && (
            <div className="flex justify-between">
              <span style={{ color: designColors.text.secondary }}>Tip</span>
              <span style={{ color: designColors.text.primary }}>{formatCurrency(order.tip)}</span>
            </div>
          )}
          
          <Separator className="my-2" style={{ backgroundColor: designColors.border.light }} />
          
          <div className="flex justify-between font-medium">
            <span style={{ color: designColors.text.primary }}>Total</span>
            <span style={{ color: designColors.text.primary }}>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Special instructions or notes */}
      {order.notes && (
        <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 mt-0.5" style={{ color: 'rgba(245, 158, 11, 0.8)' }} />
            <div>
              <h4 className="font-medium text-sm" style={{ color: designColors.text.primary }}>Special Instructions</h4>
              <p className="text-sm mt-1" style={{ color: designColors.text.secondary }}>{order.notes}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
