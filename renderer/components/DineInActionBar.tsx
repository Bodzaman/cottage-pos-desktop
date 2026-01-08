import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { FileText, Receipt, XCircle } from 'lucide-react';
import { globalColors as QSAITheme } from 'utils/QSAIDesign';

interface Props {
  // Item counts
  stagingItemCount: number;
  savedItemCount: number;
  totalItemCount: number;
  
  // State flags
  orderId?: string | null;
  
  // Action handlers
  onSave: () => void;
  onReviewOrder: () => void;
  onCancelOrder: () => void;
  onResetTable?: () => void;
  
  className?: string;
}

/**
 * Dedicated action bar component for DINE-IN modal
 * Handles all primary CTAs: Preview Order, Review Order, Clear Order, Reset Table
 * 
 * Design: Follows QSAI purple gradient theme with clear status messaging
 */
export function DineInActionBar({
  stagingItemCount,
  savedItemCount,
  totalItemCount,
  orderId,
  onSave,
  onReviewOrder,
  onCancelOrder,
  onResetTable,
  className
}: Props) {
  const hasItems = totalItemCount > 0;
  const hasStaging = stagingItemCount > 0;
  const hasSaved = savedItemCount > 0;

  return (
    <div className={className} style={{ backgroundColor: QSAITheme.background.secondary }}>
      {/* Action Buttons */}
      <div className="p-3 border-t space-y-2 flex-shrink-0" style={{ borderColor: QSAITheme.border.medium }}>
        {hasItems ? (
          <>
            {/* ✅ Status Messaging */}
            {hasStaging ? (
              <div className="text-xs" style={{ color: QSAITheme.text.secondary }}>
                <div className="font-semibold" style={{ color: QSAITheme.purple.light }}>
                  ⏳ {stagingItemCount} item{stagingItemCount === 1 ? '' : 's'} in cart (not saved yet)
                </div>
                {savedItemCount > 0 && (
                  <div className="mt-1" style={{ color: QSAITheme.text.muted }}>
                    {savedItemCount} item{savedItemCount === 1 ? '' : 's'} already in database
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs" style={{ color: QSAITheme.text.secondary }}>
                <div className="font-semibold" style={{ color: QSAITheme.purple.light }}>
                  ✓ {savedItemCount} item{savedItemCount === 1 ? '' : 's'} saved
                </div>
              </div>
            )}
            
            {/* Save Order Button - Opens Preview Modal with 3 choices (Cancel | Save Order | Send to Kitchen) */}
            <Button
              onClick={onSave}
              className="w-full flex items-center justify-center gap-2 py-6 text-base font-semibold transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #7C5DFA 0%, #6B4DEA 100%)',
                color: 'white',
                border: 'none'
              }}
            >
              <FileText className="w-5 h-5" />
              Preview Order
            </Button>
            
            {/* Review Order Button - Opens full review modal */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onReviewOrder}
                  disabled={savedItemCount === 0}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold text-base shadow-lg transition-all hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-600 disabled:hover:to-purple-700"
                >
                  <Receipt className="w-5 h-5 mr-2" />
                  Review Order
                </Button>
              </TooltipTrigger>
              {savedItemCount === 0 && (
                <TooltipContent className="bg-gray-800 border border-gray-700 text-white">
                  <p>{hasStaging ? 'Save order first to review' : 'No items in order'}</p>
                </TooltipContent>
              )}
            </Tooltip>
            
            {/* Clear Order / Reset Table Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={hasStaging ? onCancelOrder : onResetTable}
              disabled={!hasStaging && (!orderId || !onResetTable)}
              className="w-full text-xs h-9 font-medium"
              style={{
                borderColor: '#EF4444',
                color: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)'
              }}
            >
              <XCircle className="w-3 h-3 mr-1.5" />
              {hasStaging ? 'Clear Order' : 'Reset Table'}
            </Button>
          </>
        ) : (
          <div className="text-center py-2">
            <div className="text-xs" style={{ color: QSAITheme.text.muted }}>
              Add items from menu - they'll save automatically
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DineInActionBar;
