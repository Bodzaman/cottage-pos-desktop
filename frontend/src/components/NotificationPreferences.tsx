import React from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Megaphone, Gift, Bell } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { PremiumTheme } from 'utils/CustomerDesignSystem';

// Notification options
const NOTIFICATION_OPTIONS = [
  {
    id: 'email_order_updates',
    label: 'Email Order Updates',
    description: 'Receive order confirmations and status updates via email',
    icon: Mail,
    category: 'orders'
  },
  {
    id: 'sms_order_updates',
    label: 'SMS Order Updates',
    description: 'Get text messages when your order status changes',
    icon: MessageSquare,
    category: 'orders'
  },
  {
    id: 'marketing_emails',
    label: 'Marketing Emails',
    description: 'News about new menu items and restaurant updates',
    icon: Megaphone,
    category: 'marketing'
  },
  {
    id: 'special_offers',
    label: 'Special Offers',
    description: 'Exclusive discounts and promotional offers',
    icon: Gift,
    category: 'marketing'
  }
];

interface NotificationSettings {
  email_order_updates: boolean;
  sms_order_updates: boolean;
  marketing_emails: boolean;
  special_offers: boolean;
}

interface Props {
  preferences: NotificationSettings;
  onChange: (key: keyof NotificationSettings, value: boolean) => void;
  disabled?: boolean;
}

export function NotificationPreferences({ preferences, onChange, disabled = false }: Props) {
  // Group notifications by category
  const orderNotifications = NOTIFICATION_OPTIONS.filter(o => o.category === 'orders');
  const marketingNotifications = NOTIFICATION_OPTIONS.filter(o => o.category === 'marketing');

  const renderToggle = (option: typeof NOTIFICATION_OPTIONS[0]) => {
    const Icon = option.icon;
    const isEnabled = preferences[option.id as keyof NotificationSettings] ?? false;

    return (
      <motion.div
        key={option.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-200 ${
          disabled ? 'opacity-50' : ''
        }`}
        style={{
          background: isEnabled ? 'rgba(139, 21, 56, 0.1)' : 'rgba(255, 255, 255, 0.03)',
          border: `1px solid ${isEnabled ? 'rgba(139, 21, 56, 0.3)' : PremiumTheme.colors.border.light}`
        }}
      >
        {/* Icon */}
        <div
          className="p-2 rounded-lg flex-shrink-0"
          style={{
            background: isEnabled ? 'rgba(139, 21, 56, 0.2)' : 'rgba(255, 255, 255, 0.05)'
          }}
        >
          <Icon
            className="h-5 w-5"
            style={{ color: isEnabled ? '#8B1538' : '#8B92A0' }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={`text-sm font-medium ${isEnabled ? 'text-[#EAECEF]' : 'text-[#B7BDC6]'}`}>
                {option.label}
              </p>
              <p className="text-xs text-[#8B92A0] mt-0.5">
                {option.description}
              </p>
            </div>

            {/* Switch */}
            <Switch
              checked={isEnabled}
              onCheckedChange={(checked) => onChange(option.id as keyof NotificationSettings, checked)}
              disabled={disabled}
              className="data-[state=checked]:bg-[#8B1538]"
            />
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ background: `${PremiumTheme.colors.burgundy[500]}20` }}
        >
          <Bell className="h-5 w-5 text-[#8B1538]" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-[#EAECEF]">Notification Preferences</h4>
          <p className="text-xs text-[#8B92A0]">
            Choose how you'd like to hear from us
          </p>
        </div>
      </div>

      {/* Order Notifications */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-[#8B92A0] uppercase tracking-wider">
          Order Updates
        </p>
        <div className="space-y-2">
          {orderNotifications.map(renderToggle)}
        </div>
      </div>

      {/* Marketing Notifications */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-[#8B92A0] uppercase tracking-wider">
          Marketing & Offers
        </p>
        <div className="space-y-2">
          {marketingNotifications.map(renderToggle)}
        </div>
      </div>

      <p className="text-xs text-[#8B92A0]">
        You can change these preferences at any time. We'll never spam you!
      </p>
    </div>
  );
}
