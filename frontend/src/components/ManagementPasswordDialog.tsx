import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Key, AlertCircle, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { colors } from "../utils/designSystem";
import brain from "brain";
import { verifyManagementPassword } from "../utils/management-auth";

interface ManagementPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
  userId?: string;
}

const ManagementPasswordDialog: React.FC<ManagementPasswordDialogProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  userId
}) => {
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Show/hide password states
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Clear all fields when dialog closes
  const handleClose = () => {
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setShowPasswordChange(false);
    setShowPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };
  
  // Auto-hide password when user clicks away (blur)
  const handlePasswordBlur = () => {
    setShowPassword(false);
  };
  
  const handleNewPasswordBlur = () => {
    setShowNewPassword(false);
  };
  
  const handleConfirmPasswordBlur = () => {
    setShowConfirmPassword(false);
  };
  
  const handleAuthenticate = async () => {
    if (!password.trim()) {
      setError("Please enter a password");
      return;
    }
    
    try {
      setIsAuthenticating(true);
      setError(null);
      
      // Using the utility function to verify password and handle authentication
      const authResult = await verifyManagementPassword(password);
      
      if (authResult.authenticated) {
        if (authResult.isDefaultPassword) {
          // Force password change for default password
          setShowPasswordChange(true);
          toast.info("Please change the default password", {
            description: "For security, you must set a new password"
          });
        } else {
          toast.success("Management access granted");
          onAuthenticated();
          handleClose(); // Clear passwords on success
        }
      } else {
        setError("Invalid password. Please try again.");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setError("Authentication failed. Please try again.");
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  const handlePasswordChange = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    try {
      setIsChangingPassword(true);
      setError(null);
      
      const response = await brain.update_password({ password: newPassword });
      const result = await response.json();
      
      if (result.success) {
        toast.success("Password changed successfully");
        onAuthenticated();
        handleClose(); // Clear all fields on success
      } else {
        setError(result.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Password change error:", error);
      setError("Failed to change password. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (showPasswordChange) {
        handlePasswordChange();
      } else {
        handleAuthenticate();
      }
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="sm:max-w-md" 
        style={{ 
          backgroundColor: colors.background.tertiary,
          borderColor: colors.border.medium,
          color: colors.text.primary
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" style={{ color: colors.brand.purple }} />
            {showPasswordChange ? "Change Default Password" : "Management Access"}
          </DialogTitle>
          <DialogDescription>
            {showPasswordChange 
              ? "You must change the default password for security reasons."
              : "Please enter the management password to access administrative features."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {error && (
            <div 
              className="mb-4 p-3 rounded-md flex items-start gap-2" 
              style={{ backgroundColor: "rgba(220, 38, 38, 0.1)", borderLeft: "3px solid rgb(220, 38, 38)" }}
            >
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: "rgb(220, 38, 38)" }} />
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {!showPasswordChange ? (
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handlePasswordBlur}
                  autoFocus
                  style={{ 
                    background: colors.background.secondary, 
                    borderColor: error ? "rgb(220, 38, 38)" : colors.border.light,
                    paddingRight: '40px'
                  }}
                  className="focus:border-purple-500 focus:ring-purple-500"
                  disabled={isAuthenticating}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  disabled={isAuthenticating}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleNewPasswordBlur}
                    autoFocus
                    style={{ 
                      background: colors.background.secondary, 
                      borderColor: error ? "rgb(220, 38, 38)" : colors.border.light,
                      paddingRight: '40px'
                    }}
                    className="focus:border-purple-500 focus:ring-purple-500"
                    disabled={isChangingPassword}
                    placeholder="Enter new password (min 8 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    disabled={isChangingPassword}
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleConfirmPasswordBlur}
                    style={{ 
                      background: colors.background.secondary, 
                      borderColor: error ? "rgb(220, 38, 38)" : colors.border.light,
                      paddingRight: '40px'
                    }}
                    className="focus:border-purple-500 focus:ring-purple-500"
                    disabled={isChangingPassword}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    disabled={isChangingPassword}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isAuthenticating || isChangingPassword}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button 
            onClick={showPasswordChange ? handlePasswordChange : handleAuthenticate}
            disabled={isAuthenticating || isChangingPassword}
            style={{ backgroundColor: colors.brand.purple }}
          >
            {isChangingPassword ? "Changing Password..." : 
             isAuthenticating ? "Authenticating..." : 
             showPasswordChange ? "Change Password" : "Authenticate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManagementPasswordDialog;
