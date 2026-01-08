
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

// StrictDialog enforces: no outside-click close, allows Esc, and relies on explicit close via onOpenChange(false)
export const StrictDialog: React.FC<Props> = ({ open, onOpenChange, title, description, className, children }) => {
  // Intercept onOpenChange: only allow programmatic close (buttons/Esc), never outside click
  const handleOpenChange = (next: boolean) => {
    if (next) return onOpenChange(true);
    // Close requests come from Esc or programmatic handlers in our usage
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal>
      <DialogContent
        className={className}
        // Prevent outside click from closing
        onInteractOutside={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onPointerDownOutside={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        // Allow Esc to close via onOpenChange(false)
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default StrictDialog;
