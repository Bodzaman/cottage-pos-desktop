import React, { useState } from 'react';
import { User, Mail, Phone, CheckCircle2, AlertCircle, Send, Loader2, Bot, Leaf, Bell, Shield } from 'lucide-react';
import { toast } from 'sonner';
import brain from 'brain';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { InlineEditField } from 'components/InlineEditField';
import { DietaryPreferencesSelector } from 'components/DietaryPreferencesSelector';
import { NotificationPreferences } from 'components/NotificationPreferences';
import { AccountSecuritySection } from 'components/AccountSecuritySection';
import { ProfileIdentityCard } from 'components/profile/ProfileIdentityCard';
import { SettingsModule } from 'components/profile/SettingsModule';
import { calculateProfileCompletion, getCompletionColor, getCompletionMessage } from 'utils/profileCompletion';
import type { CustomerProfile, CustomerAddress } from 'types';

interface NotificationSettings {
  email_order_updates: boolean;
  sms_order_updates: boolean;
  marketing_emails: boolean;
  special_offers: boolean;
}

interface Props {
  user: any;
  profile: CustomerProfile | null;
  addresses: CustomerAddress[] | null;
  updateProfile: (data: Partial<CustomerProfile>) => Promise<any>;
  emailVerified: boolean;
  checkingEmailVerification: boolean;
  sendingVerificationEmail: boolean;
  setSendingVerificationEmail: (value: boolean) => void;
  personalizationEnabled: boolean;
  setPersonalizationEnabled: (value: boolean) => void;
  personalizationLoading: boolean;
  setPersonalizationLoading: (value: boolean) => void;
  // New props for Phase 5
  dietaryPreferences?: string[];
  notificationPreferences?: NotificationSettings;
  onDietaryPreferencesChange?: (preferences: string[]) => void;
  onNotificationPreferencesChange?: (key: keyof NotificationSettings, value: boolean) => void;
  onPasswordChange?: (currentPassword: string, newPassword: string) => Promise<{ error: any }>;
  onAccountDeletion?: () => Promise<void>;
}

export default function ProfileSection({
  user,
  profile,
  addresses,
  updateProfile,
  emailVerified,
  checkingEmailVerification,
  sendingVerificationEmail,
  setSendingVerificationEmail,
  personalizationEnabled,
  setPersonalizationEnabled,
  personalizationLoading,
  setPersonalizationLoading,
  dietaryPreferences = [],
  notificationPreferences = {
    email_order_updates: true,
    sms_order_updates: false,
    marketing_emails: false,
    special_offers: false
  },
  onDietaryPreferencesChange,
  onNotificationPreferencesChange,
  onPasswordChange,
  onAccountDeletion,
}: Props) {
  // Local state for preferences (used when no callbacks provided)
  const [localDietaryPrefs, setLocalDietaryPrefs] = useState<string[]>(dietaryPreferences);
  const [localNotificationPrefs, setLocalNotificationPrefs] = useState<NotificationSettings>(notificationPreferences);
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Handle dietary preferences change
  const handleDietaryChange = async (prefs: string[]) => {
    if (onDietaryPreferencesChange) {
      onDietaryPreferencesChange(prefs);
    } else {
      setLocalDietaryPrefs(prefs);
      // Auto-save to profile
      setSavingPreferences(true);
      try {
        await updateProfile({ dietary_preferences: prefs } as any);
        toast.success('Dietary preferences saved');
      } catch (error) {
        toast.error('Failed to save preferences');
      } finally {
        setSavingPreferences(false);
      }
    }
  };

  // Handle notification preferences change
  const handleNotificationChange = async (key: keyof NotificationSettings, value: boolean) => {
    if (onNotificationPreferencesChange) {
      onNotificationPreferencesChange(key, value);
    } else {
      const newPrefs = { ...localNotificationPrefs, [key]: value };
      setLocalNotificationPrefs(newPrefs);
      // Auto-save to profile
      setSavingPreferences(true);
      try {
        await updateProfile({ notification_preferences: newPrefs } as any);
        toast.success('Notification preferences saved');
      } catch (error) {
        toast.error('Failed to save preferences');
      } finally {
        setSavingPreferences(false);
      }
    }
  };

  // Default password change handler
  const handlePasswordChange = async (currentPassword: string, newPassword: string): Promise<{ error: any }> => {
    if (onPasswordChange) {
      return onPasswordChange(currentPassword, newPassword);
    }
    // Default implementation would call Supabase auth
    return { error: { message: 'Password change not configured' } };
  };

  // Default account deletion handler
  const handleAccountDeletion = async () => {
    if (onAccountDeletion) {
      return onAccountDeletion();
    }
    toast.error('Account deletion not configured');
  };
  const profileCompletion = calculateProfileCompletion(profile, addresses);
  const completionColor = getCompletionColor(profileCompletion.percentage);
  const completionMessage = getCompletionMessage(profileCompletion);

  const handleSendVerificationEmail = async () => {
    if (!profile?.id) return;
    
    setSendingVerificationEmail(true);
    try {
      const response = await brain.send_verification_email({ user_id: profile.id });
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Failed to send verification email:', error);
      toast.error('Failed to send verification email');
    } finally {
      setSendingVerificationEmail(false);
    }
  };

  const handlePersonalizationToggle = async (enabled: boolean) => {
    if (!profile?.id) return;
    
    setPersonalizationLoading(true);
    try {
      const response = await brain.update_personalization_settings({
        customer_id: profile.id,
        personalization_enabled: enabled
      });

      if (response.ok) {
        setPersonalizationEnabled(enabled);
        toast.success(
          enabled 
            ? 'Personalization enabled - AI chatbot will greet you by name and suggest your favorites' 
            : 'Personalization disabled - AI chatbot will use generic responses'
        );
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      toast.error('Failed to update personalization settings');
    } finally {
      setPersonalizationLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6">
      {/* Left Column - Identity Card (sticky on desktop) */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <ProfileIdentityCard
          user={user}
          profile={profile}
          completionPercentage={profileCompletion.percentage}
          completionColor={completionColor}
          completionMessage={completionMessage}
          onImageUpdate={async (imageUrl) => {
            await updateProfile({ image_url: imageUrl });
          }}
        />
      </div>

      {/* Right Column - Settings Modules */}
      <div className="space-y-4">
        {/* Profile Info Module */}
        <SettingsModule
          title="Personal Information"
          icon={User}
          description="Your basic account details"
        >
          <div className="space-y-4">
            <InlineEditField
              label="First Name"
              value={profile?.first_name || ''}
              onSave={async (value) => {
                const result = await updateProfile({ first_name: value });
                if (result.error) throw result.error;
              }}
              placeholder="Enter your first name"
              icon={<User className="h-4 w-4" />}
            />

            <InlineEditField
              label="Last Name"
              value={profile?.last_name || ''}
              onSave={async (value) => {
                const result = await updateProfile({ last_name: value });
                if (result.error) throw result.error;
              }}
              placeholder="Enter your last name"
              icon={<User className="h-4 w-4" />}
            />

            <InlineEditField
              label="Email"
              value={profile?.email || ''}
              onSave={async () => {}}
              type="email"
              icon={<Mail className="h-4 w-4" />}
              readonly={true}
              badge={
                checkingEmailVerification ? (
                  <Loader2 className="h-3 w-3 animate-spin text-[#8B92A0]" />
                ) : emailVerified ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Not Verified
                  </Badge>
                )
              }
            />

            {/* Email Verification Action */}
            {!emailVerified && !checkingEmailVerification && (
              <div className="pl-0 md:pl-8">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSendVerificationEmail}
                  disabled={sendingVerificationEmail}
                  className="text-[#8B1538] hover:text-[#A91D47] hover:bg-[#8B1538]/10 h-8 text-xs"
                >
                  {sendingVerificationEmail ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-3 w-3 mr-1" />
                      Send verification email
                    </>
                  )}
                </Button>
              </div>
            )}

            <InlineEditField
              label="Phone"
              value={profile?.phone || ''}
              onSave={async (value) => {
                const result = await updateProfile({ phone: value });
                if (result.error) throw result.error;
              }}
              placeholder="Enter your phone number"
              type="tel"
              icon={<Phone className="h-4 w-4" />}
            />

            {/* AI Personalization Toggle */}
            <div className="flex items-center justify-between py-2 px-0 md:px-8">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-[#8B1538]" />
                <div>
                  <p className="text-sm text-white">AI Personalization</p>
                  <p className="text-xs text-gray-500">Personalized greetings & suggestions</p>
                </div>
              </div>
              <Switch
                checked={personalizationEnabled}
                onCheckedChange={handlePersonalizationToggle}
                disabled={personalizationLoading}
                className="data-[state=checked]:bg-[#8B1538]"
              />
            </div>
          </div>
        </SettingsModule>

        {/* Dietary Preferences Module */}
        <SettingsModule
          title="Dietary Preferences"
          icon={Leaf}
          description="Help us recommend suitable dishes"
        >
          <DietaryPreferencesSelector
            selectedPreferences={onDietaryPreferencesChange ? dietaryPreferences : localDietaryPrefs}
            onChange={handleDietaryChange}
            disabled={savingPreferences}
          />
        </SettingsModule>

        {/* Notification Preferences Module */}
        <SettingsModule
          title="Notifications"
          icon={Bell}
          description="Choose how you'd like to hear from us"
        >
          <NotificationPreferences
            preferences={onNotificationPreferencesChange ? notificationPreferences : localNotificationPrefs}
            onChange={handleNotificationChange}
            disabled={savingPreferences}
          />
        </SettingsModule>

        {/* Security Module */}
        <SettingsModule
          title="Security"
          icon={Shield}
          description="Manage your password and account"
        >
          <AccountSecuritySection
            user={user}
            onPasswordChange={handlePasswordChange}
            onAccountDeletion={handleAccountDeletion}
          />
        </SettingsModule>
      </div>
    </div>
  );
}
