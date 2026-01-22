import React, { useEffect, useState } from "react";
import { X, MoreVertical, ChevronUp, ChevronDown, Check, Eye, EyeOff, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { colors } from "utils/designSystem";

interface FloatingActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete?: () => void;
  onToggleActive?: (active: boolean) => void;
  onTogglePos?: (showOnPos: boolean) => void;
  onToggleWebsite?: (showOnWebsite: boolean) => void;
  onMoveToCategory?: () => void;
  categoryOptions?: boolean;
  posOptions?: boolean;
  websiteOptions?: boolean;
  visibilityOptions?: boolean;
}

const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  selectedCount,
  onClearSelection,
  onDelete,
  onToggleActive,
  onTogglePos,
  onToggleWebsite,
  onMoveToCategory,
  categoryOptions = false,
  posOptions = true,
  websiteOptions = true,
  visibilityOptions = true,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  
  // Hide the floating bar when no items are selected
  if (selectedCount === 0) return null;
  
  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <div 
        className="flex items-center gap-2 py-3 px-4 rounded-full shadow-lg" 
        style={{ backgroundColor: colors.background.dark, boxShadow: '0 10px 25px rgba(0,0,0,0.3), 0 0 0 1px rgba(124,93,250,0.2)' }}
      >
        <span className="text-sm font-medium mr-2" style={{ color: colors.text.primary }}>
          {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
        </span>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-1 mr-1">
          {visibilityOptions && onToggleActive && (
            <>
              <button 
                onClick={() => onToggleActive(true)}
                className="p-1.5 rounded-full hover:bg-[rgba(124,93,250,0.15)] transition-colors"
                title="Activate Selected"
              >
                <ToggleRight className="h-4 w-4" style={{ color: colors.brand.turquoise }} />
              </button>
              
              <button 
                onClick={() => onToggleActive(false)}
                className="p-1.5 rounded-full hover:bg-[rgba(124,93,250,0.15)] transition-colors"
                title="Deactivate Selected"
              >
                <ToggleLeft className="h-4 w-4" style={{ color: colors.text.secondary }} />
              </button>
            </>
          )}
          
          {onDelete && (
            <button 
              onClick={onDelete}
              className="p-1.5 rounded-full hover:bg-[rgba(255,55,55,0.15)] transition-colors"
              title="Delete Selected"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          )}
        </div>
        
        {/* More Options Button */}
        {(posOptions || websiteOptions || categoryOptions) && (
          <button 
            onClick={() => setShowOptions(!showOptions)}
            className={`p-1.5 rounded-full transition-colors ${showOptions ? 'bg-[rgba(124,93,250,0.2)]' : 'hover:bg-[rgba(124,93,250,0.15)]'}`}
            title="More Options"
          >
            {showOptions ? (
              <ChevronUp className="h-4 w-4" style={{ color: colors.brand.purple }} />
            ) : (
              <MoreVertical className="h-4 w-4" style={{ color: colors.text.secondary }} />
            )}
          </button>
        )}
        
        {/* Clear Selection */}
        <button 
          onClick={onClearSelection}
          className="p-1.5 rounded-full hover:bg-[rgba(124,93,250,0.15)] transition-colors"
          title="Clear Selection"
        >
          <X className="h-4 w-4" style={{ color: colors.text.secondary }} />
        </button>
      </div>
      
      {/* Extended Options Panel */}
      {showOptions && (
        <div 
          className="absolute bottom-16 left-0 right-0 mx-auto p-3 rounded-lg w-max shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150"
          style={{ backgroundColor: colors.background.dark, boxShadow: '0 10px 25px rgba(0,0,0,0.3), 0 0 0 1px rgba(124,93,250,0.2)', minWidth: '280px' }}
        >
          <div className="space-y-2">
            {categoryOptions && onMoveToCategory && (
              <button 
                onClick={onMoveToCategory}
                className="flex items-center gap-2 w-full p-2 rounded hover:bg-[rgba(124,93,250,0.15)] text-left transition-colors"
              >
                <span className="flex-1 text-sm">Move to category</span>
              </button>
            )}
            
            {posOptions && onTogglePos && (
              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => onTogglePos(true)}
                  className="flex items-center justify-between w-full p-2 rounded hover:bg-[rgba(124,93,250,0.15)] text-left transition-colors"
                >
                  <span className="text-sm">Show on POS</span>
                  <Eye className="h-4 w-4" style={{ color: colors.brand.turquoise }} />
                </button>
                
                <button 
                  onClick={() => onTogglePos(false)}
                  className="flex items-center justify-between w-full p-2 rounded hover:bg-[rgba(124,93,250,0.15)] text-left transition-colors"
                >
                  <span className="text-sm">Hide on POS</span>
                  <EyeOff className="h-4 w-4" style={{ color: colors.text.secondary }} />
                </button>
              </div>
            )}
            
            {websiteOptions && onToggleWebsite && (
              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => onToggleWebsite(true)}
                  className="flex items-center justify-between w-full p-2 rounded hover:bg-[rgba(124,93,250,0.15)] text-left transition-colors"
                >
                  <span className="text-sm">Show on Website</span>
                  <Eye className="h-4 w-4" style={{ color: colors.brand.turquoise }} />
                </button>
                
                <button 
                  onClick={() => onToggleWebsite(false)}
                  className="flex items-center justify-between w-full p-2 rounded hover:bg-[rgba(124,93,250,0.15)] text-left transition-colors"
                >
                  <span className="text-sm">Hide on Website</span>
                  <EyeOff className="h-4 w-4" style={{ color: colors.text.secondary }} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingActionBar;