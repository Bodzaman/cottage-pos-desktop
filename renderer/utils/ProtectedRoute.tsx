import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSimpleAuth } from './simple-auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireStaff?: boolean;
}

/**
 * A simplified component that protects routes based on authentication
 * 
 * @param children - The route content to render if access is granted
 * @param requireAuth - If true, user must be logged in to access the route
 * @param requireAdmin - If true, user must be admin (bod@barkworthhathaway.com)
 * @param requireStaff - If true, user must be admin (same as requireAdmin in simple system)
 * @returns The protected route or redirects to login page
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = false,
  requireAdmin = false,
  requireStaff = false,
}) => {
  const { user, isLoading, isAdmin } = useSimpleAuth();
  const location = useLocation();
  
  // Show loading state if auth state is still loading
  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="mt-4 text-purple-300 text-sm">Verifying access...</p>
      </div>
    );
  }

  // Check authentication requirements
  if (requireAuth && !user) {
    const returnUrl = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ returnUrl }} />;
  }

  // Check admin requirements (both requireAdmin and requireStaff map to isAdmin)
  if ((requireAdmin || requireStaff) && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
