import React, { useState, useEffect } from "react";
import { useSimpleAuth } from "../utils/simple-auth-context";
import ManagementPasswordDialog from "./ManagementPasswordDialog";
import { AlertTriangle } from "lucide-react";
import { colors } from "../utils/designSystem";

interface ProtectedManagerRouteProps {
  children: React.ReactNode;
}

const ProtectedManagerRoute: React.FC<ProtectedManagerRouteProps> = ({ children }) => {
  const { user, isLoading, isAdmin } = useSimpleAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  
  useEffect(() => {
    // For admin users, grant immediate access
    if (isAdmin) {
      setIsAuthenticated(true);
      setShowDialog(false);
      return;
    }
  }, [user]);
  
  const checkAuthentication = () => {
    if (!user) return;
    
    // Check session storage for authentication status
    const authenticated = sessionStorage.getItem("management_authenticated") === "true";
    const authenticatedUserId = sessionStorage.getItem("management_user_id");
    
    // Only consider authenticated if the stored user ID matches current user
    if (authenticated && authenticatedUserId === user.id) {
      // Optional: Check for session timeout (e.g., 30 minutes)
      const authTime = sessionStorage.getItem("management_auth_time");
      if (authTime) {
        const expiryTime = parseInt(authTime) + (30 * 60 * 1000); // 30 minutes
        if (Date.now() > expiryTime) {
          // Session expired
          sessionStorage.removeItem("management_authenticated");
          sessionStorage.removeItem("management_user_id");
          sessionStorage.removeItem("management_auth_time");
          setIsAuthenticated(false);
          return;
        }
      }
      
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  };
  
  const handleOpenDialog = () => {
    setShowDialog(true);
  };
  
  const handleCloseDialog = () => {
    setShowDialog(false);
  };
  
  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };
  
  // Show loading state if auth state is still loading
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }
  
  // If user is not logged in, show access denied
  if (!user) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center p-6">
        <div 
          className="bg-red-900/20 text-white p-6 rounded-lg border" 
          style={{ borderColor: "rgba(220, 38, 38, 0.3)" }}
        >
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h2 className="text-xl font-semibold">Authentication Required</h2>
          </div>
          <p>Please log in to access this page.</p>
        </div>
      </div>
    );
  }
  
  // If user is logged in but not authenticated for management, show prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center p-6">
        <div 
          className="bg-opacity-20 p-6 rounded-lg border text-center max-w-md"
          style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.medium }}
        >
          <div className="flex flex-col items-center gap-3 mb-4">
            <AlertTriangle className="h-12 w-12" style={{ color: colors.brand.purple }} />
            <h2 className="text-xl font-semibold">Management Access Required</h2>
          </div>
          <p className="mb-6">This section requires management access. Please authenticate to continue.</p>
          <button
            onClick={handleOpenDialog}
            className="px-4 py-2 rounded-md"
            style={{ backgroundColor: colors.brand.purple, color: colors.text.primary }}
          >
            Authenticate
          </button>
          
          <ManagementPasswordDialog
            isOpen={showDialog}
            onClose={handleCloseDialog}
            onAuthenticated={handleAuthenticated}
            userId={user.id}
          />
        </div>
      </div>
    );
  }
  
  // If authenticated, show the protected content
  return <>{children}</>;
};

export default ProtectedManagerRoute;