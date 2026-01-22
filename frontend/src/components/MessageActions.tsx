import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, RotateCcw, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumTheme } from '../utils/premiumTheme';

interface MessageActionsProps {
  messageContent: string;
  messageId: string;
  sender: 'user' | 'bot';
  onRetry?: () => void;
  onEdit?: (messageId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function MessageActions({ 
  messageContent, 
  messageId, 
  sender, 
  onRetry, 
  onEdit, 
  disabled = false,
  className = '' 
}: MessageActionsProps) {
  const [isCopying, setIsCopying] = useState(false);

  const handleCopy = async () => {
    if (disabled || isCopying) return;
    
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(messageContent);
      toast.success('Message copied to clipboard!', {
        duration: 2000,
        position: 'top-center'
      });
    } catch (error) {
      console.error('Failed to copy message:', error);
      toast.error('Failed to copy message');
    } finally {
      setTimeout(() => setIsCopying(false), 500);
    }
  };

  const handleRetry = () => {
    if (disabled || !onRetry) return;
    onRetry();
  };

  const handleEdit = () => {
    if (disabled || !onEdit) return;
    onEdit(messageId);
  };

  // Only show actions for non-empty messages
  if (!messageContent.trim()) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${className}`}>
      {/* Copy button - available for all messages */}
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled || isCopying}
        onClick={handleCopy}
        className="h-6 w-6 p-0 hover:bg-opacity-20"
        style={{
          color: PremiumTheme.colors.text.muted,
          '--hover-bg': PremiumTheme.colors.burgundy[500]
        } as React.CSSProperties}
        title="Copy message"
      >
        <Copy className="h-3 w-3" />
      </Button>

      {/* Retry button - only for bot messages */}
      {sender === 'bot' && onRetry && (
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={handleRetry}
          className="h-6 w-6 p-0 hover:bg-opacity-20"
          style={{
            color: PremiumTheme.colors.text.muted,
            '--hover-bg': PremiumTheme.colors.burgundy[500]
          } as React.CSSProperties}
          title="Retry response"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      )}

      {/* Edit button - only for user messages */}
      {sender === 'user' && onEdit && (
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={handleEdit}
          className="h-6 w-6 p-0 hover:bg-opacity-20"
          style={{
            color: PremiumTheme.colors.text.muted,
            '--hover-bg': PremiumTheme.colors.burgundy[500]
          } as React.CSSProperties}
          title="Edit & resend"
        >
          <Edit3 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export default MessageActions;
