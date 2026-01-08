import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw } from 'lucide-react';

interface MenuItemDeleteButtonProps {
  itemId: string;
  onDelete: (itemId: string) => void;
  isDeleting?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const MenuItemDeleteButton: React.FC<MenuItemDeleteButtonProps> = ({
  itemId,
  onDelete,
  isDeleting = false,
  size = 'sm',
  className = ''
}) => {
  return (
    <Button 
      size={size} 
      variant="ghost" 
      className={`opacity-0 group-hover:opacity-100 transition-opacity text-red-500 ${className}`}
      onClick={() => onDelete(itemId)}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </Button>
  );
};

export default MenuItemDeleteButton;
