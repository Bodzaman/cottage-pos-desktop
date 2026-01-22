import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "../utils/settingsStore";
import { colors } from "../utils/designSystem";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Optional callback for successful authentication
}

const AdminPasswordModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    // Get the admin password from settings
    const adminPassword = settings.salesReportPassword || "Noor";
    
    // Verify password
    if (password === adminPassword) {
      setIsSubmitting(false);
      onClose();
      
      // Use onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
        toast.success("Admin portal access granted");
      } else {
        // Only navigate when no onSuccess callback is provided
        navigate("/admin-portal");
        toast.success("Admin portal access granted");
      }
    } else {
      setError("Incorrect password. Please try again.");
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md" style={{
        backgroundColor: colors.background.secondary,
        border: `1px solid ${colors.border.light}`,
      }}>
        <DialogHeader>
          <DialogTitle>Admin Authentication</DialogTitle>
          <DialogDescription style={{ color: colors.text.secondary }}>
            Please enter the admin password to access the admin portal.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
                style={{
                  backgroundColor: colors.background.dark,
                  borderColor: error ? colors.status.error : colors.border.medium,
                }}
              />
              {error && (
                <p className="text-sm" style={{ color: colors.status.error }}>
                  {error}
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              style={{
                borderColor: colors.border.medium,
                color: colors.text.secondary,
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || !password.trim()}
              style={{
                backgroundColor: colors.brand.purple,
                color: colors.text.primary,
              }}
            >
              {isSubmitting ? "Verifying..." : "Access Admin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminPasswordModal;
