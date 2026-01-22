import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Edit, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  label: string;
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel';
  icon?: React.ReactNode;
  readonly?: boolean;
  autoSave?: boolean; // Auto-save on blur vs manual save buttons
  badge?: React.ReactNode; // Optional badge to show next to label (e.g., verification status)
}

export function InlineEditField({
  label,
  value,
  onSave,
  placeholder = '',
  type = 'text',
  icon,
  readonly = false,
  autoSave = true,
  badge
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update edit value when prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = () => {
    if (readonly) return;
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
      toast.success(`${label} updated successfully`);
    } catch (error: any) {
      toast.error(error.message || `Failed to update ${label.toLowerCase()}`);
      setEditValue(value); // Revert to original value
    } finally {
      setIsSaving(false);
    }
  };

  const handleBlur = () => {
    if (autoSave && isEditing) {
      handleSave();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[#B7BDC6] font-medium flex items-center gap-2">
          {label}
          {badge}
        </Label>
        {!readonly && !isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-6 w-6 p-0 text-[#8B92A0] hover:text-[#EAECEF] hover:bg-white/10 rounded-md"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <div className="relative">
            {icon && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B92A0]">
                {icon}
              </div>
            )}
            <Input
              ref={inputRef}
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className={`bg-black/20 backdrop-blur-sm border border-[#8B1538] text-[#EAECEF] placeholder:text-[#8B92A0] focus:ring-[#8B153866] focus:border-[#8B1538] rounded-lg h-12 ${icon ? 'pl-10' : ''}`}
              placeholder={placeholder}
              disabled={isSaving}
            />
          </div>

          {!autoSave && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#8B1538] hover:bg-[#7A1230] text-white h-8 text-xs"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
                className="bg-black/20 text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-white/10 h-8 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B92A0]">
              {icon}
            </div>
          )}
          <div
            className={`bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg h-12 flex items-center ${icon ? 'pl-10 pr-3' : 'px-3'} ${!readonly ? 'cursor-pointer hover:border-white/20 transition-colors' : ''}`}
            onClick={handleEdit}
          >
            <span className="text-[#EAECEF]">
              {value || <span className="text-[#8B92A0]">{placeholder || 'Not set'}</span>}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
