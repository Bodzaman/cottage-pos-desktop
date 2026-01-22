import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Copy, Save, Upload, RotateCcw, ChevronDown, X, Sparkles, FileBox } from 'lucide-react';

interface BulkActionsToolbarProps {
  isEditing: boolean;
  hasVariants: boolean;
  savedTemplates: Array<{ id: string; name: string; data: any }>;
  onDuplicateItem: () => void;
  onSaveAsTemplate: () => void;
  onLoadTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string, e: React.MouseEvent) => void;
  onCopyPricesToAll: () => void;
  onResetForm: () => void;
}

/**
 * Bulk Actions Toolbar Component
 * 
 * Provides quick actions for menu item management:
 * - Duplicate existing items
 * - Save/Load templates
 * - Copy pricing across all service types
 * - Reset form
 * 
 * Extracted from MenuItemForm for better maintainability.
 */
export const BulkActionsToolbar = React.memo<BulkActionsToolbarProps>(({ 
  isEditing,
  hasVariants,
  savedTemplates,
  onDuplicateItem,
  onSaveAsTemplate,
  onLoadTemplate,
  onDeleteTemplate,
  onCopyPricesToAll,
  onResetForm
}) => {
  return (
    <Card className="mb-6 bg-gray-900/50 border-purple-500/20">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
          </div>
          <div className="flex items-center gap-2" role="toolbar" aria-label="Menu item quick actions">
            {/* Duplicate Item Button */}
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDuplicateItem}
                className="border-purple-500/30 hover:bg-purple-500/10"
                aria-label="Duplicate this menu item"
              >
                <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                Duplicate Item
              </Button>
            )}

            {/* Save as Template Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSaveAsTemplate}
              className="border-purple-500/30 hover:bg-purple-500/10"
              aria-label="Save current item as template for future use"
            >
              <Save className="h-4 w-4 mr-2" aria-hidden="true" />
              Save as Template
            </Button>

            {/* Load Template Dropdown */}
            {savedTemplates.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-purple-500/30 hover:bg-purple-500/10"
                    aria-label="Load saved template"
                    aria-haspopup="menu"
                  >
                    <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                    Load Template
                    <ChevronDown className="h-4 w-4 ml-2" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700 w-64">
                  {savedTemplates.map((template) => (
                    <DropdownMenuItem
                      key={template.id}
                      onClick={() => onLoadTemplate(template.id)}
                      className="text-white hover:bg-purple-500/20 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <FileBox className="h-4 w-4 text-purple-400" aria-hidden="true" />
                        <span>{template.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => onDeleteTemplate(template.id, e)}
                        className="h-6 w-6 p-0 hover:bg-red-500/20"
                        aria-label={`Delete template ${template.name}`}
                      >
                        <X className="h-3 w-3 text-red-400" aria-hidden="true" />
                      </Button>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Quick Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-purple-500/30 hover:bg-purple-500/10"
                  aria-label="More actions menu"
                  aria-haspopup="menu"
                >
                  More Actions
                  <ChevronDown className="h-4 w-4 ml-2" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                {!hasVariants && (
                  <>
                    <DropdownMenuItem
                      onClick={onCopyPricesToAll}
                      className="text-white hover:bg-purple-500/20 cursor-pointer"
                    >
                      <Copy className="h-4 w-4 mr-2 text-purple-400" aria-hidden="true" />
                      Copy Prices to All Types
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-700" />
                  </>
                )}
                <DropdownMenuItem
                  onClick={onResetForm}
                  className="text-white hover:bg-red-500/20 cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4 mr-2 text-red-400" aria-hidden="true" />
                  Reset Form
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

BulkActionsToolbar.displayName = 'BulkActionsToolbar';
