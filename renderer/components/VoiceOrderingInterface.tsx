import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Clock, ShoppingCart, Sparkles, CheckCircle2, X, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiClient } from 'app';
import { VoiceSessionRequest } from 'types';
import { toast } from 'sonner';

interface VoiceOrderingInterfaceProps {
  user: any;
  selectedAgent: any;
  onVoiceCartUpdate?: (cart: any) => void;
}

interface VoiceSession {
  session_id: string;
  cart_items: any[];
  total_amount: number;
  customer_name: string;
  call_id?: string; // Add call_id for hangUp functionality
}

interface PostVoiceDecision {
  type: 'proceed' | 'edit' | 'cancel';
  cart: any;
}

export default function VoiceOrderingInterface({ user, selectedAgent, onVoiceCartUpdate }: VoiceOrderingInterfaceProps) {
  const navigate = useNavigate();
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceSession, setVoiceSession] = useState<VoiceSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [showPostVoiceModal, setShowPostVoiceModal] = useState(false);
  const [finalCart, setFinalCart] = useState<any>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isVoiceActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          
          // Time management prompts
          if (newTime === 255) { // 4:15 remaining
            console.log("⏰ 4:15 remaining - AI should prompt: 'I can help you finalize this order quickly'");
          } else if (newTime === 240) { // 4:00 remaining - TRIGGER HANGUP WARNING
            console.log("⏰ 4:00 remaining - Triggering hangUp warning via Ultravox");
            triggerHangUpWarning();
          } else if (newTime === 60) { // 1:00 remaining
            console.log("⏰ 1:00 remaining - AI should prompt: 'Let me get your order completed in the next minute'");
          } else if (newTime === 30) { // 0:30 remaining
            console.log("⏰ 0:30 remaining - AI should prompt: 'I'll help you proceed to checkout now'");
          } else if (newTime === 0) {
            // Time up - end session gracefully
            handleVoiceSessionEnd();
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVoiceActive, timeRemaining]);

  // Function to trigger hangUp warning at 4:00 mark
  const triggerHangUpWarning = async () => {
    if (!voiceSession?.call_id) {
      console.warn("⚠️ No call_id available for hangUp warning");
      return;
    }

    try {
      console.log("🔔 Triggering 4-minute hangUp warning for call:", voiceSession.call_id);
      
      const response = await apiClient.trigger_hangup_warning({
        call_id: voiceSession.call_id,
        reason: "Just to let you know, you have one minute left to complete your order"
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log("✅ HangUp warning triggered successfully - Ash will speak the warning");
        toast.info("Time reminder: 1 minute remaining", {
          description: "Ash will notify you about the time limit"
        });
      } else {
        console.error("❌ Failed to trigger hangUp warning:", result.message);
      }
    } catch (error) {
      console.error("❌ Error triggering hangUp warning:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining > 180) return 'text-green-600'; // > 3 minutes
    if (timeRemaining > 60) return 'text-amber-600';  // > 1 minute
    return 'text-red-600'; // < 1 minute
  };

  const getProgressColor = () => {
    const percentage = (timeRemaining / 300) * 100;
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 20) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const startVoiceOrdering = async () => {
    try {
      console.log("🎤 Starting authenticated voice ordering session...");
      
      const sessionRequest: VoiceSessionRequest = {
        user_id: user.id,
        customer_name: user.user_metadata?.full_name || user.email.split('@')[0],
        customer_email: user.email,
        customer_phone: user.user_metadata?.phone || '',
        agent_id: selectedAgent?.id || null  // Fixed: Use agent_id instead of ultravox_agent_id
      };

      const response = await apiClient.create_authenticated_voice_cart_session(sessionRequest);
      const data = await response.json();

      if (data.success) {
        setVoiceSession({
          session_id: data.session_id,
          call_id: data.call_id,
          cart_items: [],
          total_amount: 0,
          customer_name: data.customer_name
        });
        
        setIsVoiceActive(true);
        setTimeRemaining(300); // Reset to 5 minutes
        setSessionStartTime(new Date());
        
        console.log("✅ Voice session started successfully", data);
        toast.success(`Voice session started with ${selectedAgent?.name || 'AI Assistant'}`);
        
        // If we have an Ultravox session URL, we could integrate with Ultravox Web SDK here
        if (data.ultravox_session_url) {
          console.log("🔗 Ultravox session URL:", data.ultravox_session_url);
        }
      } else {
        console.error("❌ Failed to start voice session:", data);
        toast.error('Failed to start voice session. Please try again.');
      }
    } catch (error) {
      console.error("❌ Voice session error:", error);
      toast.error('Unable to start voice session. Please check your connection.');
    }
  };

  const handleVoiceSessionEnd = () => {
    console.log("🏁 Voice session ended");
    
    // Get final cart state
    if (voiceSession) {
      // In a real implementation, we'd fetch the current cart state
      setFinalCart({
        items: voiceSession.cart_items,
        total: voiceSession.total_amount,
        session_id: voiceSession.session_id
      });
    }
    
    setIsVoiceActive(false);
    setShowPostVoiceModal(true);
  };

  const clearVoiceCartSession = async (sessionId: string) => {
    try {
      console.log(`🗑️ Clearing voice cart session: ${sessionId}`);
      const response = await apiClient.clear_cart_session({ sessionId });
      const data = await response.json();
      
      if (data.success) {
        console.log("✅ Voice cart session cleared successfully");
      } else {
        console.warn("⚠️ Failed to clear voice cart session:", data.message);
      }
    } catch (error) {
      console.error("❌ Error clearing voice cart session:", error);
    }
  };

  const handlePostVoiceDecision = async (decision: PostVoiceDecision['type']) => {
    console.log("📝 Post-voice decision:", decision);
    setIsProcessing(true);
    
    try {
      switch (decision) {
        case 'proceed':
          // Proceed to Stripe checkout using existing OnlineMenu flow
          console.log("💳 Proceeding to Stripe checkout...");
          
          if (finalCart && finalCart.items.length > 0) {
            // Transform voice cart items to match OnlineMenu cart format
            const checkoutItems = finalCart.items.map((item: any) => ({
              id: `voice-${item.menu_item_id}-${Date.now()}`,
              menuItemId: item.menu_item_id,
              name: item.menu_item_name,
              description: item.description || '',
              price: item.unit_price,
              quantity: item.quantity,
              notes: item.special_instructions || ''
            }));
            
            // Navigate to checkout with voice cart items
            navigate('/checkout', { 
              state: { 
                cartItems: checkoutItems, 
                orderMode: 'delivery', // Default to delivery
                source: 'voice'
              } 
            });
            
            toast.success('Proceeding to checkout with your voice order!');
          } else {
            toast.error('No items in cart to checkout');
          }
          break;
          
        case 'edit':
          // Transfer items to OnlineOrders cart for editing
          console.log("✏️ Opening cart for editing...");
          
          if (onVoiceCartUpdate && finalCart && finalCart.items.length > 0) {
            // Transform voice cart items to OnlineOrders format
            const editableItems = finalCart.items.map((item: any) => ({
              id: `voice-edit-${item.menu_item_id}-${Date.now()}`,
              menuItemId: item.menu_item_id,
              name: item.menu_item_name,
              description: item.description || '',
              price: item.unit_price,
              quantity: item.quantity,
              notes: item.special_instructions || '',
              addedByVoice: true // Special flag for voice-added items
            }));
            
            onVoiceCartUpdate(editableItems);
            toast.success(`${editableItems.length} items transferred to your cart for editing`);
          } else {
            toast.info('No items to transfer to cart');
          }
          break;
          
        case 'cancel':
          // Clear cart and return to menu
          console.log("🗑️ Cancelling voice order...");
          
          if (finalCart?.session_id) {
            await clearVoiceCartSession(finalCart.session_id);
          }
          
          toast.success('Voice order cancelled successfully');
          break;
      }
    } catch (error) {
      console.error(`❌ Error handling decision '${decision}':`, error);
      toast.error('Failed to process your selection. Please try again.');
    } finally {
      setIsProcessing(false);
      setShowPostVoiceModal(false);
      setVoiceSession(null);
      setFinalCart(null);
      setTimeRemaining(300);
    }
  };

  return (
    <>
      {/* Voice Ordering Card */}
      <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-red-50">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-rose-700">
            <Mic className="h-5 w-5" />
            Quick Voice Ordering
          </CardTitle>
          <CardDescription className="text-rose-600">
            {isVoiceActive ? (
              <span className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                  LIVE
                </Badge>
                Speaking with {selectedAgent?.name || 'AI Assistant'}
              </span>
            ) : (
              "Ready to order? Have a question? Need a quick answer?"
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!isVoiceActive ? (
            <>
              {/* Agent Profile */}
              {selectedAgent && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-rose-200">
                  {selectedAgent.avatar_url ? (
                    <img 
                      src={selectedAgent.avatar_url} 
                      alt={selectedAgent.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-rose-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-800">{selectedAgent.name}</p>
                    <p className="text-sm text-gray-600">{selectedAgent.description}</p>
                  </div>
                </div>
              )}
              
              {/* Service Info */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-rose-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Get help in under 5 minutes</span>
                </div>
                
                <Button 
                  onClick={startVoiceOrdering}
                  className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-medium py-3"
                  size="lg"
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Start Voice Order
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Active Voice Session */}
              <div className="text-center space-y-4">
                {/* Timer and Progress */}
                <div className="space-y-3">
                  <div className={`text-2xl font-bold ${getTimeColor()}`}>
                    {formatTime(timeRemaining)}
                  </div>
                  <Progress 
                    value={(timeRemaining / 300) * 100} 
                    className="h-2"
                  />
                  <p className="text-sm text-gray-600">
                    Quick Order Service - Maximum 5 minutes
                  </p>
                </div>
                
                {/* Active Status */}
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Speaking with {selectedAgent?.name || 'AI Assistant'}</span>
                </div>
                
                {/* Voice Controls */}
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={handleVoiceSessionEnd}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <MicOff className="h-4 w-4 mr-2" />
                    End Session
                  </Button>
                </div>
                
                {/* Cart Preview (if items added) */}
                {voiceSession && voiceSession.cart_items.length > 0 && (
                  <div className="p-3 bg-white rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <ShoppingCart className="h-4 w-4" />
                      <span className="font-medium">{voiceSession.cart_items.length} items added</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Total: £{voiceSession.total_amount.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Post-Voice Decision Modal */}
      <Dialog open={showPostVoiceModal} onOpenChange={setShowPostVoiceModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Voice Order Complete</DialogTitle>
            <DialogDescription className="text-center">
              What would you like to do with your order?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Order Summary */}
            {finalCart && finalCart.items.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Order Summary</h4>
                <p className="text-sm text-gray-600">
                  {finalCart.items.length} items • Total: £{finalCart.total.toFixed(2)}
                </p>
              </div>
            )}
            
            {/* Decision Buttons */}
            <div className="space-y-2">
              <Button 
                onClick={() => handlePostVoiceDecision('proceed')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Checkout
                  </>
                )}
              </Button>
              
              <Button 
                onClick={() => handlePostVoiceDecision('edit')}
                variant="outline"
                className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                size="lg"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Cart
                  </>
                )}
              </Button>
              
              <Button 
                onClick={() => handlePostVoiceDecision('cancel')}
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                size="lg"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel Order
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
