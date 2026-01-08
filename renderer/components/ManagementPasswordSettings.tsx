import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, Check, AlertCircle, Lock, Unlock, Info } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from 'app';
import { colors } from "../utils/designSystem";

const ManagementPasswordSettings: React.FC = () => {
  const [passwordStatus, setPasswordStatus] = useState<{ is_set: boolean; last_updated?: string; }>({ is_set: false });
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch password status on mount
  useEffect(() => {
    fetchPasswordStatus();
  }, []);
  
  const fetchPasswordStatus = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get_password_status();
      const data = await response.json();
      setPasswordStatus(data);
    } catch (error) {
      console.error("Error fetching password status:", error);
      toast.error("Failed to check password status");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasswordUpdate = async () => {
    // Validate password
    if (!password) {
      setError("Password is required");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter");
      return;
    }
    
    if (!/\d/.test(password)) {
      setError("Password must contain at least one number");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      const response = await apiClient.update_password({
        password
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message || "Password updated successfully");
        setPassword("");
        setConfirmPassword("");
        fetchPasswordStatus();
      } else {
        setError(data.message || "Failed to update password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      setError("An error occurred while updating the password");
    } finally {
      setIsSaving(false);
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  
  return (
    <Card className="w-full shadow-md" style={{ backgroundColor: colors.background.tertiary }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" style={{ color: colors.brand.purple }} />
          Management Password
        </CardTitle>
        <CardDescription>
          Set a universal password for accessing management features across the system.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Password Status */}
        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: colors.background.highlight }}>
          <div className="flex items-start gap-3">
            {passwordStatus.is_set ? (
              <Lock className="h-5 w-5 mt-0.5" style={{ color: colors.brand.turquoise }} />
            ) : (
              <Unlock className="h-5 w-5 mt-0.5" style={{ color: colors.brand.gold }} />
            )}
            
            <div>
              <h4 className="font-medium text-sm">Status: {passwordStatus.is_set ? "Set" : "Not Set"}</h4>
              <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>
                {passwordStatus.is_set 
                  ? `Last updated: ${formatDate(passwordStatus.last_updated)}` 
                  : "No management password has been set yet. Please set a password to enable management features."}
              </p>
            </div>
          </div>
        </div>
        
        {/* Password update form */}
        <div className="space-y-4">
          {/* Info alert */}
          <Alert variant="default" className="bg-blue-500/10 border-blue-500/20">
            <Info className="h-4 w-4" />
            <AlertTitle>Universal Access</AlertTitle>
            <AlertDescription className="text-sm">
              This password will be used by anyone accessing management features. 
              It replaces individual user-specific management credentials.
            </AlertDescription>
          </Alert>
          
          {/* Error alert */}
          {error && (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="password">
              {passwordStatus.is_set ? "New Password" : "Password"}
            </Label>
            <Input 
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isSaving}
              placeholder="Enter a strong password"
              style={{ backgroundColor: colors.background.secondary }}
            />
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              Password must be at least 8 characters and include an uppercase letter and a number.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input 
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading || isSaving}
              placeholder="Confirm your password"
              style={{ backgroundColor: colors.background.secondary }}
            />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button
          onClick={handlePasswordUpdate}
          disabled={isLoading || isSaving || !password || !confirmPassword}
          style={{ backgroundColor: colors.brand.purple }}
        >
          {isSaving ? "Saving..." : (passwordStatus.is_set ? "Update Password" : "Set Password")}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ManagementPasswordSettings;
