import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { colors, cardStyle } from "../utils/designSystem";
import { AlertCircle, Shield, Search, AlertTriangle, KeyRound, Eye, EyeOff, ShieldCheck, BadgeInfo } from "lucide-react";
import { apiClient } from "app";
import { formatDistanceToNow } from "date-fns";
import { AdminInput } from "components/AdminInput";

interface Props {}

const UserManagement: React.FC<Props> = () => {
  // State variables
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Management password states
  const [isManagementPasswordDialogOpen, setIsManagementPasswordDialogOpen] = useState(false);
  const [managementPassword, setManagementPassword] = useState({
    password: "",
    confirmPassword: ""
  });
  const [showManagementPassword, setShowManagementPassword] = useState(false);
  const [managementPasswordErrors, setManagementPasswordErrors] = useState({
    password: "",
    confirmPassword: ""
  });
  const [passwordStatus, setPasswordStatus] = useState<{ is_set: boolean, last_updated?: string } | null>(null);
  
  // Load users and password status on component mount
  useEffect(() => {
    loadUsers();
    checkPasswordStatus();
  }, []);
  
  // Check the current status of the management password
  const checkPasswordStatus = async () => {
    try {
      const response = await apiClient.get_password_status();
      const data = await response.json();
      setPasswordStatus(data);
    } catch (error) {
      console.error("Error checking password status:", error);
      setPasswordStatus({ is_set: false });
    }
  };
  
  // Load users
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.list_users();
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowManagementPassword(!showManagementPassword);
  };
  
  // Validate management password form
  const validateManagementPasswordForm = () => {
    let isValid = true;
    const errors = {
      password: "",
      confirmPassword: ""
    };
    
    // Password validation
    if (!managementPassword.password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (managementPassword.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
      isValid = false;
    } else if (!/[A-Z]/.test(managementPassword.password)) {
      errors.password = "Password must contain at least one uppercase letter";
      isValid = false;
    } else if (!/\d/.test(managementPassword.password)) {
      errors.password = "Password must contain at least one number";
      isValid = false;
    }
    
    // Confirm password validation
    if (managementPassword.password !== managementPassword.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }
    
    setManagementPasswordErrors(errors);
    return isValid;
  };
  
  // Update management password
  const handleUpdateManagementPassword = async () => {
    if (!validateManagementPasswordForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await apiClient.update_password({
        password: managementPassword.password
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update password");
      }
      
      toast.success("Management password updated successfully");
      setIsManagementPasswordDialogOpen(false);
      setManagementPassword({
        password: "",
        confirmPassword: ""
      });
      
      // Refresh password status
      await checkPasswordStatus();
    } catch (error) {
      console.error("Error updating management password:", error);
      toast.error(`Failed to update password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open management password dialog
  const handleOpenManagementPasswordDialog = () => {
    setManagementPassword({
      password: "",
      confirmPassword: ""
    });
    setManagementPasswordErrors({
      password: "",
      confirmPassword: ""
    });
    setIsManagementPasswordDialogOpen(true);
  };
  
  // Handle management password form change
  const handleManagementPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManagementPassword(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific error when field is edited
    if (name in managementPasswordErrors) {
      setManagementPasswordErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Management Password Control Card */}
      <Card style={cardStyle}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <KeyRound className="h-5 w-5 mr-2" style={{ color: colors.brand.purple }} />
            Management Password Control
          </CardTitle>
          <CardDescription>
            Configure the universal management password for POS system access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Management Password Status */}
            <div className="flex items-center justify-between rounded-lg p-3" 
              style={{ background: colors.background.tertiary, border: `1px solid ${colors.border.light}` }}>
              <div className="flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2" style={{ color: passwordStatus?.is_set ? colors.brand.turquoise : colors.brand.purple }} />
                <div>
                  <h4 className="font-medium">{passwordStatus?.is_set ? "Management Password Set" : "Management Password Not Set"}</h4>
                  <p className="text-sm text-zinc-400">
                    {passwordStatus?.is_set && passwordStatus.last_updated ? (
                      <>Last updated {formatDistanceToNow(new Date(passwordStatus.last_updated), { addSuffix: true })}</>
                    ) : (
                      <>Set a password to protect management features</>
                    )}
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleOpenManagementPasswordDialog}
                style={{ background: colors.brand.purple }}
              >
                {passwordStatus?.is_set ? "Update Password" : "Set Password"}
              </Button>
            </div>
            
            <div className="bg-amber-950/30 border border-amber-900/30 rounded-md p-3 text-sm">
              <div className="flex items-start">
                <BadgeInfo className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-amber-400" />
                <div className="text-amber-400">
                  <p className="font-medium">About the Management Password</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Provides access to the management dashboard in the POS system</li>
                    <li>Is universal - not tied to individual user accounts</li>
                    <li>Should only be shared with trusted staff members</li>
                    <li>Automatically expires after 30 minutes of inactivity</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card style={cardStyle}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" style={{ color: colors.brand.purple }} />
            System Users
          </CardTitle>
          <CardDescription>
            View registered users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and filter */}
          <div className="flex items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                style={{ background: colors.background.tertiary, border: `1px solid ${colors.border.light}` }}
              />
            </div>
          </div>
          
          {/* Users table */}
          <div className="rounded-md border" style={{ borderColor: colors.border.medium }}>
            <Table>
              <TableHeader>
                <TableRow style={{ background: colors.background.tertiary }}>
                  <TableHead className="text-zinc-200 font-medium">Email</TableHead>
                  <TableHead className="text-zinc-200 font-medium">Last Login</TableHead>
                  <TableHead className="text-zinc-200 font-medium">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-zinc-400">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-zinc-400">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} style={{ borderColor: colors.border.light }}>
                      <TableCell className="font-medium">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <span className="text-zinc-400 text-sm">
                          {user.last_sign_in_at
                            ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })
                            : "Never"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400">
                          Active
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 text-sm text-zinc-400">
            <p className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              Note: User role management has been simplified in favor of a universal management password system.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Management Password Dialog */}
      <Dialog open={isManagementPasswordDialogOpen} onOpenChange={setIsManagementPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md" style={{ background: colors.background.secondary, border: `1px solid ${colors.border.medium}` }}>
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center">
              <KeyRound className="h-5 w-5 mr-2" style={{ color: colors.brand.purple }} />
              {passwordStatus?.is_set ? "Update Management Password" : "Set Management Password"}
            </DialogTitle>
            <DialogDescription>
              This password will be used to authenticate access to management features in the POS system
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="password">
                New Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <AdminInput
                  id="password"
                  name="password"
                  type={showManagementPassword ? "text" : "password"}
                  value={managementPassword.password}
                  onChange={handleManagementPasswordChange}
                  className="mt-1 pr-10"
                  variant="purple"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-200"
                  tabIndex={-1}
                >
                  {showManagementPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {managementPasswordErrors.password && (
                <p className="text-sm text-red-500 mt-1">{managementPasswordErrors.password}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <AdminInput
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showManagementPassword ? "text" : "password"}
                  value={managementPassword.confirmPassword}
                  onChange={handleManagementPasswordChange}
                  className="mt-1 pr-10"
                  variant="purple"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-200"
                  tabIndex={-1}
                >
                  {showManagementPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {managementPasswordErrors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{managementPasswordErrors.confirmPassword}</p>
              )}
            </div>
            
            {/* Password complexity warning */}
            <div className="bg-amber-950/30 border border-amber-900/30 rounded-md p-3 text-amber-400 text-sm">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Password requirements:</p>
                  <ul className="list-disc list-inside mt-1 ml-1 space-y-1">
                    <li>At least 8 characters long</li>
                    <li>At least one uppercase letter</li>
                    <li>At least one number</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsManagementPasswordDialogOpen(false)}
              className="border-zinc-700 text-zinc-300"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleUpdateManagementPassword}
              style={{ background: colors.brand.purple }}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
