import React, { useState, useEffect } from 'react';
import { supabase } from 'utils/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, UserPlus, Loader2, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface StaffUser {
  id: string;
  username: string;
  full_name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function StaffManagement() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({ username: '', password: '', fullName: '' });
  const [editForm, setEditForm] = useState({ username: '', fullName: '', active: true });
  const [resetPasswordForm, setResetPasswordForm] = useState({ newPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Password visibility states
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Load staff list on mount
  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('pos_staff_list');
      
      if (error) {
        console.error('Failed to load staff:', error);
        toast.error('Failed to load staff list');
        return;
      }

      setStaff(data || []);
    } catch (err) {
      console.error('Error loading staff:', err);
      toast.error('An error occurred while loading staff');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (createForm.username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    
    if (createForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (createForm.fullName.length < 2) {
      toast.error('Full name must be at least 2 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('pos_staff_create', {
        p_username: createForm.username.trim(),
        p_password: createForm.password,
        p_full_name: createForm.fullName.trim()
      });

      if (error) {
        console.error('Failed to create staff:', error);
        
        // Check for common errors
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          toast.error('Username already exists');
        } else {
          toast.error(error.message || 'Failed to create staff account');
        }
        return;
      }

      toast.success(`Staff account created for ${createForm.username}`);
      setCreateForm({ username: '', password: '', fullName: '' });
      setIsCreateDialogOpen(false);
      await loadStaff();
    } catch (err) {
      console.error('Error creating staff:', err);
      toast.error('An error occurred while creating staff');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStaff) return;
    
    if (editForm.username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    
    if (editForm.fullName.length < 2) {
      toast.error('Full name must be at least 2 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('pos_staff_update', {
        p_user_id: selectedStaff.id,
        p_username: editForm.username.trim(),
        p_full_name: editForm.fullName.trim(),
        p_active: editForm.active
      });

      if (error) {
        console.error('Failed to update staff:', error);
        
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          toast.error('Username already exists');
        } else {
          toast.error(error.message || 'Failed to update staff account');
        }
        return;
      }

      toast.success('Staff account updated');
      setIsEditDialogOpen(false);
      setSelectedStaff(null);
      await loadStaff();
    } catch (err) {
      console.error('Error updating staff:', err);
      toast.error('An error occurred while updating staff');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStaff) return;
    
    if (resetPasswordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('pos_staff_reset_password', {
        p_user_id: selectedStaff.id,
        p_new_password: resetPasswordForm.newPassword
      });

      if (error) {
        console.error('Failed to reset password:', error);
        toast.error(error.message || 'Failed to reset password');
        return;
      }

      toast.success(`Password reset for ${selectedStaff.username}`);
      setResetPasswordForm({ newPassword: '' });
      setIsResetPasswordDialogOpen(false);
      setSelectedStaff(null);
    } catch (err) {
      console.error('Error resetting password:', err);
      toast.error('An error occurred while resetting password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (user: StaffUser) => {
    try {
      const { error } = await supabase.rpc('pos_staff_update', {
        p_user_id: user.id,
        p_username: user.username,
        p_full_name: user.full_name,
        p_active: !user.active
      });

      if (error) {
        console.error('Failed to toggle staff status:', error);
        toast.error('Failed to update staff status');
        return;
      }

      toast.success(`${user.username} ${!user.active ? 'activated' : 'deactivated'}`);
      await loadStaff();
    } catch (err) {
      console.error('Error toggling staff status:', err);
      toast.error('An error occurred');
    }
  };

  const openEditDialog = (user: StaffUser) => {
    setSelectedStaff(user);
    setEditForm({
      username: user.username,
      fullName: user.full_name,
      active: user.active
    });
    setIsEditDialogOpen(true);
  };

  const openResetPasswordDialog = (user: StaffUser) => {
    setSelectedStaff(user);
    setResetPasswordForm({ newPassword: '' });
    setIsResetPasswordDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Staff Management</h2>
          <p className="text-sm text-purple-300 mt-1">Manage POS staff accounts and permissions</p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Create Staff Account
        </Button>
      </div>

      {/* Staff Table */}
      <Card className="bg-black/40 border-purple-600/30">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <span className="ml-3 text-purple-300">Loading staff...</span>
            </div>
          ) : staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <UserPlus className="h-12 w-12 text-purple-400 mb-4" />
              <p className="text-lg font-medium text-white">No staff accounts yet</p>
              <p className="text-sm text-purple-300 mt-2">Create your first staff account to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-purple-600/20 hover:bg-purple-600/5">
                  <TableHead className="text-purple-300">Username</TableHead>
                  <TableHead className="text-purple-300">Full Name</TableHead>
                  <TableHead className="text-purple-300">Status</TableHead>
                  <TableHead className="text-purple-300">Created</TableHead>
                  <TableHead className="text-purple-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((user) => (
                  <TableRow 
                    key={user.id} 
                    className="border-purple-600/20 hover:bg-purple-600/5"
                  >
                    <TableCell className="font-medium text-white">{user.username}</TableCell>
                    <TableCell className="text-purple-200">{user.full_name}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.active ? 'default' : 'secondary'}
                        className={user.active ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}
                      >
                        {user.active ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-purple-300">{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-purple-300 hover:text-purple-100 hover:bg-purple-600/20">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-black/95 border-purple-600/30">
                          <DropdownMenuItem 
                            onClick={() => openEditDialog(user)}
                            className="text-purple-200 hover:text-white hover:bg-purple-600/20 cursor-pointer"
                          >
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openResetPasswordDialog(user)}
                            className="text-purple-200 hover:text-white hover:bg-purple-600/20 cursor-pointer"
                          >
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleToggleActive(user)}
                            className="text-purple-200 hover:text-white hover:bg-purple-600/20 cursor-pointer"
                          >
                            {user.active ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Staff Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-black/95 border-purple-600/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-purple-100">Create Staff Account</DialogTitle>
            <DialogDescription className="text-purple-300">
              Create a new POS staff account with username and password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateStaff} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-username" className="text-purple-200">Username</Label>
              <Input
                id="create-username"
                type="text"
                placeholder="Enter username (min 3 characters)"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                required
                minLength={3}
                className="bg-black/40 border-purple-600/30 text-white placeholder:text-purple-400/50"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password" className="text-purple-200">Password</Label>
              <div className="relative">
                <Input
                  id="create-password"
                  type={showCreatePassword ? 'text' : 'password'}
                  placeholder="Enter password (min 6 characters)"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                  minLength={6}
                  className="bg-black/40 border-purple-600/30 text-white placeholder:text-purple-400/50"
                  disabled={isSubmitting}
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 border-purple-600/30 text-purple-300 hover:bg-purple-600/20"
                  disabled={isSubmitting}
                >
                  {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-fullname" className="text-purple-200">Full Name</Label>
              <Input
                id="create-fullname"
                type="text"
                placeholder="Enter full name"
                value={createForm.fullName}
                onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                required
                minLength={2}
                className="bg-black/40 border-purple-600/30 text-white placeholder:text-purple-400/50"
                disabled={isSubmitting}
              />
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                className="border-purple-600/30 text-purple-300 hover:bg-purple-600/20"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-black/95 border-purple-600/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-purple-100">Edit Staff Account</DialogTitle>
            <DialogDescription className="text-purple-300">
              Update staff account details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditStaff} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username" className="text-purple-200">Username</Label>
              <Input
                id="edit-username"
                type="text"
                placeholder="Enter username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                required
                minLength={3}
                className="bg-black/40 border-purple-600/30 text-white placeholder:text-purple-400/50"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-fullname" className="text-purple-200">Full Name</Label>
              <Input
                id="edit-fullname"
                type="text"
                placeholder="Enter full name"
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                required
                minLength={2}
                className="bg-black/40 border-purple-600/30 text-white placeholder:text-purple-400/50"
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="edit-active"
                type="checkbox"
                checked={editForm.active}
                onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                className="rounded border-purple-600/30"
                disabled={isSubmitting}
              />
              <Label htmlFor="edit-active" className="text-purple-200 cursor-pointer">
                Active (can log in)
              </Label>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                className="border-purple-600/30 text-purple-300 hover:bg-purple-600/20"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Account'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="bg-black/95 border-purple-600/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-purple-100">Reset Password</DialogTitle>
            <DialogDescription className="text-purple-300">
              Reset password for {selectedStaff?.username}. No current password required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-password" className="text-purple-200">New Password</Label>
              <div className="relative">
                <Input
                  id="reset-password"
                  type={showResetPassword ? 'text' : 'password'}
                  placeholder="Enter new password (min 6 characters)"
                  value={resetPasswordForm.newPassword}
                  onChange={(e) => setResetPasswordForm({ newPassword: e.target.value })}
                  required
                  minLength={6}
                  className="bg-black/40 border-purple-600/30 text-white placeholder:text-purple-400/50"
                  disabled={isSubmitting}
                  autoFocus
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 border-purple-600/30 text-purple-300 hover:bg-purple-600/20"
                  disabled={isSubmitting}
                >
                  {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsResetPasswordDialogOpen(false)}
                className="border-purple-600/30 text-purple-300 hover:bg-purple-600/20"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
