import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { BellRing, CheckCircle, RefreshCw, XCircle, User } from 'lucide-react';
import brain from 'brain';

interface CustomerPreferencesProps {
  phone_number: string;
  onPreferencesUpdated?: () => void;
}

interface NotificationPreferences {
  order_confirmation: boolean;
  payment_receipt: boolean;
  order_status_updates: boolean;
  delivery_tracking: boolean;
  marketing: boolean;
  opt_out_all: boolean;
}

export function CustomerPreferencesPanel({ phone_number, onPreferencesUpdated }: CustomerPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    order_confirmation: true,
    payment_receipt: true,
    order_status_updates: true,
    delivery_tracking: true,
    marketing: false,
    opt_out_all: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayPhone, setDisplayPhone] = useState('');

  // Format phone number for display
  const formatPhoneForDisplay = (phone: string) => {
    if (!phone) return '';
    
    // For UK numbers (+44xxxxxxxxxx), format as +44 xxxx xxxxxx
    if (phone.startsWith('+44') && phone.length >= 12) {
      return `${phone.substring(0, 3)} ${phone.substring(3, 7)} ${phone.substring(7)}`;
    }
    return phone;
  };

  // Load preferences for this phone number
  const loadPreferences = async () => {
    if (!phone_number) return;
    
    try {
      setIsLoading(true);
      const response = await brain.get_customer_preferences({ phone_number });
      const data = await response.json();
      
      if (data.success && data.preferences) {
        setPreferences(data.preferences);
        setDisplayPhone(formatPhoneForDisplay(data.phone_number));
      } else {
        console.error("Failed to load preferences:", data.message);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save preferences
  const savePreferences = async () => {
    if (!phone_number) return;
    
    try {
      setIsSaving(true);
      const response = await brain.update_customer_preferences(
        { phone_number },
        preferences
      );
      const data = await response.json();
      
      if (data.success) {
        toast.success("Notification preferences updated");
        if (onPreferencesUpdated) {
          onPreferencesUpdated();
        }
      } else {
        toast.error(`Failed to update preferences: ${data.message}`);
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Error updating notification preferences");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle preference toggle
  const handleToggle = (key: keyof NotificationPreferences) => {
    // If turning on opt_out_all, disable all other preferences
    if (key === 'opt_out_all' && !preferences.opt_out_all) {
      setPreferences({
        order_confirmation: false,
        payment_receipt: false,
        order_status_updates: false,
        delivery_tracking: false,
        marketing: false,
        opt_out_all: true
      });
    } 
    // If turning off opt_out_all, enable default preferences
    else if (key === 'opt_out_all' && preferences.opt_out_all) {
      setPreferences({
        order_confirmation: true,
        payment_receipt: true,
        order_status_updates: true,
        delivery_tracking: true,
        marketing: false,
        opt_out_all: false
      });
    } 
    // Regular toggle for other preferences
    else {
      setPreferences(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    }
  };

  // Load preferences on component mount or phone number change
  useEffect(() => {
    if (phone_number) {
      loadPreferences();
    }
  }, [phone_number]);

  if (!phone_number) {
    return (
      <div className="p-4 bg-gray-800 rounded-md border border-gray-700 text-center">
        <User className="h-6 w-6 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-400">Please enter a phone number to manage preferences</p>
      </div>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-purple-400" />
            <h3 className="text-white font-medium">Notification Preferences</h3>
          </div>
          <Badge className="bg-purple-900/30 text-purple-200 border-purple-700">
            {displayPhone || formatPhoneForDisplay(phone_number)}
          </Badge>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-4">
            <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Opt-out all switch */}
            <div className="flex items-center justify-between p-3 rounded-md border border-gray-700 bg-gray-900">
              <div>
                <Label htmlFor="opt-out-all" className="text-white font-medium">
                  Opt-out of all notifications
                </Label>
                <p className="text-sm text-gray-400">
                  Disable all customer notifications
                </p>
              </div>
              <Switch
                id="opt-out-all"
                checked={preferences.opt_out_all}
                onCheckedChange={() => handleToggle('opt_out_all')}
              />
            </div>
            
            {/* Individual preferences */}
            <div className={`space-y-2 ${preferences.opt_out_all ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between p-2 rounded-md border border-gray-700">
                <Label htmlFor="order-confirmation" className="text-white">
                  Order Confirmations
                </Label>
                <Switch
                  id="order-confirmation"
                  checked={preferences.order_confirmation}
                  onCheckedChange={() => handleToggle('order_confirmation')}
                  disabled={preferences.opt_out_all}
                />
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-md border border-gray-700">
                <Label htmlFor="payment-receipt" className="text-white">
                  Payment Receipts
                </Label>
                <Switch
                  id="payment-receipt"
                  checked={preferences.payment_receipt}
                  onCheckedChange={() => handleToggle('payment_receipt')}
                  disabled={preferences.opt_out_all}
                />
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-md border border-gray-700">
                <Label htmlFor="order-status-updates" className="text-white">
                  Order Status Updates
                </Label>
                <Switch
                  id="order-status-updates"
                  checked={preferences.order_status_updates}
                  onCheckedChange={() => handleToggle('order_status_updates')}
                  disabled={preferences.opt_out_all}
                />
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-md border border-gray-700">
                <Label htmlFor="delivery-tracking" className="text-white">
                  Delivery Tracking
                </Label>
                <Switch
                  id="delivery-tracking"
                  checked={preferences.delivery_tracking}
                  onCheckedChange={() => handleToggle('delivery_tracking')}
                  disabled={preferences.opt_out_all}
                />
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-md border border-gray-700">
                <Label htmlFor="marketing" className="text-white">
                  Marketing Messages
                </Label>
                <Switch
                  id="marketing"
                  checked={preferences.marketing}
                  onCheckedChange={() => handleToggle('marketing')}
                  disabled={preferences.opt_out_all}
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button
                onClick={savePreferences}
                disabled={isSaving}
                className="bg-purple-900 hover:bg-purple-800"
              >
                {isSaving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : preferences.opt_out_all ? (
                  <XCircle className="h-4 w-4 mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Save Preferences
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
