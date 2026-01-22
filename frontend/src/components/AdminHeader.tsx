import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { ArrowLeft } from "lucide-react";

interface Props {
  userEmail: string | undefined;
  onBackToPOS?: () => void;
  onLogout: () => void;
  /** Show back button (only for standalone /admin route) */
  showBackButton?: boolean;
  /** Whether this is standalone mode (shows breadcrumbs) */
  isStandalone?: boolean;
  /** Current active tab for breadcrumb display */
  activeTab?: string;
}

/**
 * Admin Portal Header
 * Displays navigation, page title, and user info with logout
 */
const AdminHeader: React.FC<Props> = ({ 
  userEmail, 
  onBackToPOS, 
  onLogout, 
  showBackButton = false,
  isStandalone = false,
  activeTab = "Menu Management"
}) => {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutDialog(false);
    onLogout();
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
      <div className="flex flex-col gap-3 w-full md:w-auto">
        {/* Breadcrumbs for standalone mode */}
        {isStandalone && (
          <Breadcrumb>
            <BreadcrumbList className="text-purple-300">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/pos-desktop" className="hover:text-purple-100">POS Desktop</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">Admin Portal</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-purple-200">{activeTab}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        )}

        <div className="flex items-center gap-4">
          {/* Back button - only shown in standalone mode */}
          {showBackButton && onBackToPOS && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToPOS}
              className="flex items-center gap-2 border-purple-600 text-purple-300 hover:bg-purple-600 hover:text-white"
              aria-label="Back to POS Desktop"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to POS
            </Button>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Restaurant Admin Portal</h1>
            <p className="text-sm md:text-base text-purple-300">Manage your restaurant operations and analytics</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto justify-end">
        <div className="text-right">
          <p className="text-sm text-purple-300">Welcome back</p>
          <p className="font-medium text-white truncate max-w-[150px] md:max-w-[200px]" title={userEmail}>
            {userEmail}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogoutClick}
          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
          aria-label="Logout from admin portal"
        >
          Logout
        </Button>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-gray-900 border-purple-600">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription className="text-purple-300">
              Are you sure you want to sign out of the Admin Portal? You will be redirected to the POS login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-purple-600 text-purple-300 hover:bg-purple-600 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogoutConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminHeader;
