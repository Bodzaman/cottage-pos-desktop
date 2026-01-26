import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Key, Link2, Trash2, Loader2, CheckCircle2, AlertTriangle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PremiumTheme } from 'utils/CustomerDesignSystem';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Props {
  user: any;
  onPasswordChange: (currentPassword: string, newPassword: string) => Promise<{ error: any }>;
  onAccountDeletion: () => Promise<void>;
}

export function AccountSecuritySection({ user, onPasswordChange, onAccountDeletion }: Props) {
  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Account deletion state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Determine login method
  const loginMethod = user?.app_metadata?.provider || 'email';
  const isOAuthUser = loginMethod !== 'email';

  const handlePasswordChange = async () => {
    setPasswordError(null);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);

    try {
      const { error } = await onPasswordChange(currentPassword, newPassword);

      if (error) {
        setPasswordError(error.message || 'Failed to change password');
      } else {
        toast.success('Password changed successfully!');
        setIsChangingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'An unexpected error occurred');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setDeleteLoading(true);

    try {
      await onAccountDeletion();
      // User will be logged out and redirected by the parent component
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ background: `${PremiumTheme.colors.burgundy[500]}20` }}
        >
          <Shield className="h-5 w-5 text-[#8B1538]" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-[#EAECEF]">Account Security</h4>
          <p className="text-xs text-[#8B92A0]">
            Manage your password and account settings
          </p>
        </div>
      </div>

      {/* Connected Accounts */}
      <div
        className="p-4 rounded-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: `1px solid ${PremiumTheme.colors.border.light}`
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Link2 className="h-4 w-4 text-[#8B92A0]" />
          <span className="text-sm font-medium text-[#EAECEF]">Login Method</span>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ background: 'rgba(255, 255, 255, 0.05)' }}
          >
            {isOAuthUser ? (
              <img
                src={`https://authjs.dev/img/providers/${loginMethod}.svg`}
                alt={loginMethod}
                className="h-5 w-5"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Mail className="h-5 w-5 text-[#8B92A0]" />
            )}
          </div>
          <div>
            <p className="text-sm text-[#EAECEF] capitalize">
              {isOAuthUser ? `${loginMethod} Account` : 'Email & Password'}
            </p>
            <p className="text-xs text-[#8B92A0]">{user?.email}</p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-green-400 text-xs">
            <CheckCircle2 className="h-3 w-3" />
            Connected
          </div>
        </div>
      </div>

      {/* Password Change (only for email users) */}
      {!isOAuthUser && (
        <div
          className="p-4 rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${PremiumTheme.colors.border.light}`
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Key className="h-4 w-4 text-[#8B92A0]" />
              <span className="text-sm font-medium text-[#EAECEF]">Password</span>
            </div>
            {!isChangingPassword && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChangingPassword(true)}
                className="border-white/20 text-[#B7BDC6] hover:bg-white/10 hover:text-[#EAECEF]"
              >
                Change Password
              </Button>
            )}
          </div>

          {isChangingPassword ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-2"
            >
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-[#B7BDC6]">
                  Current Password
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-[#EAECEF]"
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-[#B7BDC6]">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-[#EAECEF]"
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-[#B7BDC6]">
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-[#EAECEF]"
                  placeholder="Re-enter new password"
                />
              </div>

              {passwordError && (
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {passwordError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError(null);
                  }}
                  className="border-white/20 text-[#B7BDC6] hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePasswordChange}
                  disabled={passwordLoading}
                  className="bg-[#8B1538] hover:bg-[#7A1230] text-white"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </div>
            </motion.div>
          ) : (
            <p className="text-xs text-[#8B92A0]">
              Last changed: Never (or we don't track this)
            </p>
          )}
        </div>
      )}

      {/* Account Deletion */}
      <div
        className="p-4 rounded-xl"
        style={{
          background: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trash2 className="h-4 w-4 text-red-400" />
            <div>
              <span className="text-sm font-medium text-[#EAECEF]">Delete Account</span>
              <p className="text-xs text-[#8B92A0]">
                Permanently delete your account and all data
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            Delete Account
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent
          className="border"
          style={{
            background: 'rgba(23, 25, 29, 0.98)',
            borderColor: 'rgba(239, 68, 68, 0.3)'
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-[#EAECEF] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="text-[#B7BDC6]">
              This action cannot be undone. This will permanently delete your account
              and remove all your data including:
            </DialogDescription>
          </DialogHeader>

          <ul className="text-sm text-[#8B92A0] list-disc list-inside space-y-1 my-4">
            <li>Your profile information</li>
            <li>Saved addresses</li>
            <li>Order history</li>
            <li>Favorites and preferences</li>
          </ul>

          <div className="space-y-2">
            <Label className="text-[#B7BDC6]">
              Type <span className="text-red-400 font-mono">DELETE</span> to confirm
            </Label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="bg-white/5 border-red-500/30 text-[#EAECEF] font-mono"
            />
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteConfirmText('');
              }}
              className="border-white/20 text-[#B7BDC6] hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAccountDeletion}
              disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete My Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
