import React from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  description: string;
  imageUrl?: string;
}

/**
 * Simple, focused modal for displaying full item descriptions
 * Used when clicking "See more..." on menu cards
 */
export const DescriptionModal: React.FC<DescriptionModalProps> = ({
  isOpen,
  onClose,
  itemName,
  description,
  imageUrl
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden flex flex-col">
        {/* Header with Item Name */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-foreground">
            {itemName}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            {/* Optional Image */}
            {imageUrl && (
              <div className="mb-4 rounded-lg overflow-hidden mx-auto max-w-md">
                <img 
                  src={imageUrl} 
                  alt={itemName}
                  className="w-full aspect-square object-cover"
                />
              </div>
            )}

            {/* Full Description */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">
                {description}
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Footer with Close Button */}
        <div className="px-6 py-4 border-t bg-muted/20 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
