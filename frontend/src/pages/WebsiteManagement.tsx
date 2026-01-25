import React, { useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePOSAuth } from '../utils/usePOSAuth';
import { Globe, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WebsiteCMSContent = lazy(() => import('../components/WebsiteCMSContent'));

/**
 * Standalone Website Management page.
 * Protected by POS admin auth (same as /admin).
 */
export default function WebsiteManagement() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = usePOSAuth();

  // Auth guard - redirect to POS login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/pos-login', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#1a1a2e]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/50 hover:text-white"
            onClick={() => navigate('/admin')}
            title="Back to Admin"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-400" />
            <h1 className="text-lg font-semibold text-white">Website Management</h1>
          </div>
        </div>
      </header>

      {/* CMS Content */}
      <main className="flex-1 p-4">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          }
        >
          <WebsiteCMSContent />
        </Suspense>
      </main>
    </div>
  );
}
