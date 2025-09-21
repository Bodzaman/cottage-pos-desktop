import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Key, AlertCircle, ShieldCheck } from "lucide-react";
import { colors } from "../utils/designSystem";
import brain from "brain";
import { verifyManagementPassword } from "../utils/management-auth";

interface ManagementPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
  userId?: string; // Making userId optional as we're using universal password
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
          onClose();
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
        onClose();
        // Reset form
        setShowPasswordChange(false);
        setPassword("");
        setNewPassword("");
        setConfirmPassword("");
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                style={{ 
                  background: colors.background.secondary, 
                  borderColor: error ? "rgb(220, 38, 38)" : colors.border.light 
                }}
                className="focus:border-purple-500 focus:ring-purple-500"
                disabled={isAuthenticating}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  style={{ 
                    background: colors.background.secondary, 
                    borderColor: error ? "rgb(220, 38, 38)" : colors.border.light 
                  }}
                  className="focus:border-purple-500 focus:ring-purple-500"
                  disabled={isChangingPassword}
                  placeholder="Enter new password (min 8 characters)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{ 
                    background: colors.background.secondary, 
                    borderColor: error ? "rgb(220, 38, 38)" : colors.border.light 
                  }}
                  className="focus:border-purple-500 focus:ring-purple-500"
                  disabled={isChangingPassword}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
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