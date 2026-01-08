import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, CheckCircle2, AlertCircle, Send, Loader2, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { ProfileImageUpload } from 'components/ProfileImageUpload';
import { InlineEditField } from 'components/InlineEditField';
import { calculateProfileCompletion, getCompletionColor, getCompletionMessage } from 'utils/profileCompletion';
import type { CustomerProfile, CustomerAddress } from 'types';

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
}: Props) {
  const profileCompletion = calculateProfileCompletion(profile, addresses);
  const completionColor = getCompletionColor(profileCompletion.percentage);
  const completionMessage = getCompletionMessage(profileCompletion);

  const handleSendVerificationEmail = async () => {
    if (!profile?.id) return;
    
    setSendingVerificationEmail(true);
    try {
      const response = await apiClient.send_verification_email({ user_id: profile.id });
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
      const response = await apiClient.update_personalization_settings({
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-black/20 backdrop-blur-sm border-white/10">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-[#EAECEF] text-2xl flex items-center gap-2">
              <User className="h-6 w-6 text-[#8B1538]" />
              Profile Information
            </CardTitle>
          </div>
          
          {/* Profile Completion Progress */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#B7BDC6]">{completionMessage}</span>
              <span className="text-sm font-medium" style={{ color: completionColor }}>
                {profileCompletion.percentage}%
              </span>
            </div>
            <Progress 
              value={profileCompletion.percentage} 
              className="h-2 bg-black/40"
              style={{
                ['--progress-background' as any]: completionColor
              }}
            />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Profile Image Upload */}
          <div className="flex justify-center">
            <ProfileImageUpload
              userId={user?.id || ''}
              currentImageUrl={profile?.image_url}
              googleProfileImage={profile?.google_profile_image}
              authProvider={profile?.auth_provider}
              onImageUpdate={async (imageUrl) => {
                await updateProfile({ image_url: imageUrl });
              }}
            />
          </div>

          {/* Inline Editable Fields */}
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
              <div className="pl-10">
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
          </div>

          {/* AI Personalization Settings */}
          <div className="border-t border-white/10 pt-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Bot className="h-5 w-5 text-[#8B1538] mt-1" />
                  <div>
                    <h3 className="text-[#EAECEF] font-medium">AI Personalization</h3>
                    <p className="text-sm text-[#8B92A0] mt-1">
                      Allow our AI chatbot to greet you by name and suggest your favorite dishes
                    </p>
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
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
