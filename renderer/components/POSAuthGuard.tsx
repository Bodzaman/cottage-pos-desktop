import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePOSAuth } from 'utils/usePOSAuth';

interface POSAuthGuardProps {
  children: React.ReactNode;
}

/**
 * Protected route guard for POS staff authentication
 * Redirects to /pos-login if user is not authenticated
 */
export function POSAuthGuard({ children }: POSAuthGuardProps) {
  const navigate = useNavigate();
  const isAuthenticated = usePOSAuth(state => state.isAuthenticated);
  const isLoading = usePOSAuth(state => state.isLoading);

  useEffect(() => {
    // Only redirect if not loading and not authenticated
    if (!isLoading && !isAuthenticated) {
      console.log('[POSAuthGuard] User not authenticated, redirecting to /pos-login');
      navigate('/pos-login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show nothing while loading or if not authenticated
  if (isLoading || !isAuthenticated) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}
