import { forwardRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check } from 'lucide-react';
import { colors } from '../utils/designSystem';
import { SortableItem } from './SortableItem';

export interface DraggableItemProps {
  id: string;
  children: React.ReactNode;
  isSelected: boolean;
  onSelect: (id: string, e: React.MouseEvent) => void;
  index: number;
  className?: string;
  disabled?: boolean;
}

const DraggableItem = forwardRef<HTMLDivElement, DraggableItemProps>((
  { id, children, isSelected, onSelect, index, className = '', disabled = false },
  ref
) => {
  return (
    <SortableItem id={id} className={`${className} ${isSelected ? 'bg-[rgba(124,93,250,0.15)] border-[rgba(124,93,250,0.3)]' : ''}`}>
      <div className="flex items-center">
        {/* Checkbox for selection */}
        <div 
          className="flex items-center justify-center w-10 h-10"
          onClick={(e) => onSelect(id, e)}
        >
          <div 
            className={`w-5 h-5 rounded-md flex items-center justify-center border ${isSelected ? 'bg-[#7C5DFA] border-[#7C5DFA]' : 'border-gray-600'}`}
          >
            {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1" onClick={(e) => onSelect(id, e)}>
          {children}
        </div>
      </div>
    </SortableItem>
  );
});

DraggableItem.displayName = 'DraggableItem';

export default DraggableItem;