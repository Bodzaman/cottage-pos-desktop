import { useEffect } from 'react';
import { X } from 'lucide-react';
import { colors } from 'utils/designSystem';
import { AdminTabsContent } from './AdminTabsContent';

interface AdminSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: string;
}

export function AdminSidePanel({ isOpen, onClose, defaultTab = 'menu' }: AdminSidePanelProps) {
  // Handle Escape key to close panel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when panel is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Full-screen overlay panel */}
      <div
        className="fixed inset-0 z-50 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.background.primary} 0%, ${colors.background.secondary} 100%)`,
          animation: 'fadeScaleIn 250ms ease-out',
        }}
      >
        {/* Header with close button */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{
            borderColor: colors.border.medium,
            background: `linear-gradient(90deg, ${colors.brand.purple}22 0%, transparent 100%)`,
          }}
        >
          <h2 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
            Admin Control Panel
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: colors.text.secondary }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Admin tabs content - renders without ProtectedRoute, no URL sync */}
        <div className="h-[calc(100%-88px)] overflow-y-auto p-6">
          <AdminTabsContent defaultTab={defaultTab as any} syncWithUrl={false} />
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes fadeScaleIn {
          from {
            opacity: 0;
            transform: scale(0.97);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

      `}</style>
    </>
  );
}
