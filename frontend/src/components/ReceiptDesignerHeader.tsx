/**
 * ReceiptDesignerHeader - Top action bar for ThermalReceiptDesignerV2
 * Features:
 * - Template selector dropdown
 * - Save button with unsaved indicator
 * - Duplicate button
 * - Export button
 * - Assign to Order Modes button
 * - Browse Templates button
 * - Keyboard shortcuts tooltip
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Download, Circle, FileText, Keyboard, Settings, Library, Copy, Trash2, Pencil } from 'lucide-react';
import { QSAITheme, styles } from 'utils/QSAIDesign';
import { ReceiptDesignerHeaderProps } from 'utils/receiptDesignerTypes';
import { toast } from 'sonner';
import { useSimpleAuth } from 'utils/simple-auth-context';
import { useReceiptDesignerStoreV2 } from 'utils/receiptDesignerStoreV2';
import { updateReceiptTemplate } from 'utils/receiptTemplateSupabase';

// Add onDuplicate to props interface
interface EnhancedReceiptDesignerHeaderProps extends ReceiptDesignerHeaderProps {
  onDuplicate: () => void;
  onTemplateReloaded?: () => Promise<void>; // Add callback for reloading templates
  formatToggle?: 'front_of_house' | 'kitchen_customer'; // Current template format
}

export function ReceiptDesignerHeader({
  currentTemplate,
  templatesList,
  onTemplateSelect,
  onSave,
  onDuplicate,
  onDelete,
  onExport,
  onShowAssignments,
  hasUnsavedChanges,
  onBrowseTemplates,
  onBuildSampleOrder,
  onTemplateReloaded, // Add to destructuring
  formatToggle
}: EnhancedReceiptDesignerHeaderProps) {
  const { user } = useSimpleAuth();
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Open rename dialog with current template name
  const handleOpenRename = () => {
    if (currentTemplate) {
      setNewTemplateName(currentTemplate.metadata.name);
      setShowRenameDialog(true);
    }
  };

  // Rename template via API
  const handleRenameTemplate = async () => {
    if (!currentTemplate) return;

    const trimmedName = newTemplateName.trim();
    if (!trimmedName) {
      toast.error('Template name cannot be empty');
      return;
    }

    if (trimmedName === currentTemplate.metadata.name) {
      setShowRenameDialog(false);
      return;
    }

    // Check if name already exists (excluding current template)
    const nameExists = templatesList.some(
      t => t.metadata.name.toLowerCase() === trimmedName.toLowerCase() && t.id !== currentTemplate.id
    );
    if (nameExists) {
      toast.error(`A template named "${trimmedName}" already exists`);
      return;
    }

    try {
      setIsRenaming(true);

      const result = await updateReceiptTemplate(
        currentTemplate.id,
        { name: trimmedName }
      );

      if (result.success && result.data) {
        // Show warning if kitchen variant sync had issues
        if (result.warning) {
          toast.warning(result.warning);
        }

        toast.success(`Template renamed to "${trimmedName}"`);
        setShowRenameDialog(false);

        // Update current template in store with new data (already in Template format)
        const store = useReceiptDesignerStoreV2.getState();
        store.setCurrentTemplate(result.data);

        // Reload templates list to reflect the name change
        if (onTemplateReloaded) {
          await onTemplateReloaded();
        }
      } else {
        toast.error(result.error || 'Failed to rename template');
      }
    } catch (error) {
      console.error('Error renaming template:', error);
      toast.error('Error renaming template');
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <>
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{
          backgroundColor: QSAITheme.background.panel,
          borderColor: QSAITheme.border.light
        }}
      >
        {/* Left: Template Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText
              className="h-5 w-5"
              style={{ color: QSAITheme.purple.primary }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: QSAITheme.text.secondary }}
            >
              Template:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={currentTemplate?.id || ''}
              onValueChange={onTemplateSelect}
            >
              <SelectTrigger
                className="w-64"
                style={{
                  backgroundColor: QSAITheme.background.secondary,
                  border: `1px solid ${QSAITheme.border.light}`,
                  color: QSAITheme.text.primary
                }}
              >
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent
                style={{
                  backgroundColor: QSAITheme.background.panel,
                  border: `1px solid ${QSAITheme.border.light}`
                }}
              >
                {templatesList.map((template) => (
                  <SelectItem
                    key={template.id}
                    value={template.id}
                    style={{
                      color: QSAITheme.text.primary
                    }}
                  >
                    {template.metadata.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Rename Button - Only show if a template is selected */}
            {currentTemplate && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleOpenRename}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      style={{
                        color: QSAITheme.text.secondary
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Rename template</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Format Badge - Show template format */}
            {currentTemplate && formatToggle && (
              <Badge
                variant="outline"
                className="px-2.5 py-1"
                style={{
                  backgroundColor: formatToggle === 'kitchen_customer'
                    ? 'rgba(251, 191, 36, 0.2)'
                    : 'rgba(139, 92, 246, 0.2)',
                  border: `1px solid ${formatToggle === 'kitchen_customer' ? '#fbbf24' : '#a78bfa'}`,
                  color: formatToggle === 'kitchen_customer' ? '#fbbf24' : '#a78bfa'
                }}
              >
                {formatToggle === 'kitchen_customer' ? '🍳 Kitchen' : '📄 FOH'}
              </Badge>
            )}
          </div>

          {/* Unsaved Changes Indicator */}
          {hasUnsavedChanges && (
            <Badge
              variant="outline"
              className="flex items-center gap-1.5 px-2.5 py-1"
              style={{
                backgroundColor: `${QSAITheme.purple.primary}20`,
                border: `1px solid ${QSAITheme.purple.primary}`,
                color: QSAITheme.purple.primary
              }}
            >
              <Circle className="h-2 w-2 fill-current" />
              Unsaved changes
            </Badge>
          )}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Save Button */}
          <Button
            onClick={onSave}
            className="gap-2"
            style={{
              background: hasUnsavedChanges
                ? QSAITheme.purple.primary
                : QSAITheme.background.secondary,
              color: hasUnsavedChanges
                ? QSAITheme.text.primary
                : QSAITheme.text.muted,
              border: `1px solid ${hasUnsavedChanges ? QSAITheme.purple.primary : QSAITheme.border.light}`
            }}
          >
            <Save className="h-4 w-4" />
            Save
          </Button>

          {/* Duplicate Button */}
          <Button
            onClick={onDuplicate}
            variant="outline"
            className="gap-2"
            style={{
              backgroundColor: 'transparent',
              border: `1px solid ${QSAITheme.border.light}`,
              color: QSAITheme.text.secondary
            }}
          >
            <Copy className="h-4 w-4" />
            Duplicate
          </Button>

          {/* Delete Button */}
          <Button
            onClick={onDelete}
            disabled={!currentTemplate}
            variant="outline"
            className="gap-2"
            style={{
              backgroundColor: 'transparent',
              border: `1px solid ${currentTemplate ? '#ef4444' : QSAITheme.border.light}`,
              color: currentTemplate ? '#ef4444' : QSAITheme.text.muted,
              opacity: currentTemplate ? 1 : 0.5,
              cursor: currentTemplate ? 'pointer' : 'not-allowed'
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>

          {/* Export Button */}
          <Button
            onClick={onExport}
            variant="outline"
            className="gap-2"
            style={{
              backgroundColor: 'transparent',
              border: `1px solid ${QSAITheme.border.light}`,
              color: QSAITheme.text.secondary
            }}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>

          {/* Assign to Order Modes Button */}
          <Button
            onClick={onShowAssignments}
            variant="outline"
            className="gap-2"
            style={{
              backgroundColor: 'transparent',
              border: `1px solid ${QSAITheme.border.light}`,
              color: QSAITheme.text.secondary
            }}
          >
            <Settings className="h-4 w-4" />
            Assign to Order Modes
          </Button>

          {/* Browse Templates Button */}
          <Button
            onClick={onBrowseTemplates}
            variant="outline"
            className="gap-2"
            style={{
              backgroundColor: 'transparent',
              border: `1px solid ${QSAITheme.border.light}`,
              color: QSAITheme.text.secondary
            }}
          >
            <Library className="h-4 w-4" />
            Browse Templates
          </Button>

          {/* Keyboard Shortcuts Tooltip */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  style={{
                    backgroundColor: 'transparent',
                    border: `1px solid ${QSAITheme.border.light}`,
                    color: QSAITheme.text.secondary
                  }}
                >
                  <Keyboard className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="p-4"
                style={{
                  backgroundColor: QSAITheme.background.panel,
                  border: `1px solid ${QSAITheme.border.light}`,
                  color: QSAITheme.text.primary
                }}
              >
                <div className="space-y-2">
                  <p className="font-semibold mb-2" style={{ color: QSAITheme.text.primary }}>
                    Keyboard Shortcuts
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm" style={{ color: QSAITheme.text.secondary }}>
                      Save
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs font-mono"
                      style={{
                        backgroundColor: QSAITheme.background.secondary,
                        border: `1px solid ${QSAITheme.border.light}`,
                        color: QSAITheme.text.muted
                      }}
                    >
                      Ctrl+S
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm" style={{ color: QSAITheme.text.secondary }}>
                      Duplicate
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs font-mono"
                      style={{
                        backgroundColor: QSAITheme.background.secondary,
                        border: `1px solid ${QSAITheme.border.light}`,
                        color: QSAITheme.text.muted
                      }}
                    >
                      Ctrl+D
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm" style={{ color: QSAITheme.text.secondary }}>
                      Export
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs font-mono"
                      style={{
                        backgroundColor: QSAITheme.background.secondary,
                        border: `1px solid ${QSAITheme.border.light}`,
                        color: QSAITheme.text.muted
                      }}
                    >
                      Ctrl+E
                    </Badge>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Rename Template Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent
          style={{
            backgroundColor: QSAITheme.background.panel,
            border: `1px solid ${QSAITheme.border.light}`,
            color: QSAITheme.text.primary
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: QSAITheme.text.primary }}>
              Rename Template
            </DialogTitle>
            <DialogDescription style={{ color: QSAITheme.text.secondary }}>
              Enter a new name for your template
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name" style={{ color: QSAITheme.text.secondary }}>
                Template Name
              </Label>
              <Input
                id="template-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isRenaming) {
                    handleRenameTemplate();
                  }
                }}
                placeholder="Enter template name"
                disabled={isRenaming}
                style={{
                  backgroundColor: QSAITheme.background.secondary,
                  border: `1px solid ${QSAITheme.border.light}`,
                  color: QSAITheme.text.primary
                }}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowRenameDialog(false)}
              disabled={isRenaming}
              style={{
                color: QSAITheme.text.secondary
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameTemplate}
              disabled={isRenaming || !newTemplateName.trim()}
              style={{
                backgroundColor: QSAITheme.purple.primary,
                color: '#FFFFFF'
              }}
            >
              {isRenaming ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
