import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link2, X, Plus, AlertCircle } from 'lucide-react';
import { QSAITheme } from 'utils/QSAIDesign';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentTableNumber: number;
  linkedTables: number[];
  availableTables: number[]; // All restaurant tables
  onSave: (newLinkedTables: number[]) => Promise<boolean>;
}

/**
 * Dialog for managing linked tables in a DINE-IN order
 * Allows staff to add/remove tables from the linked group
 * 
 * Features:
 * - View current linked tables
 * - Add tables from available list
 * - Remove tables from linked group
 * - Validation (prevent unlinking primary table)
 * - Save changes bidirectionally
 * 
 * Design: Purple theme matching QSAI design system
 */
export function ManageLinkedTablesDialog({
  isOpen,
  onClose,
  currentTableNumber,
  linkedTables,
  availableTables,
  onSave
}: Props) {
  // Local state for editing
  const [editedLinkedTables, setEditedLinkedTables] = useState<number[]>(linkedTables);
  const [isSaving, setIsSaving] = useState(false);

  // Reset edited state when dialog opens or linkedTables changes
  useEffect(() => {
    setEditedLinkedTables(linkedTables);
  }, [linkedTables, isOpen]);

  // Calculate which tables can be added (not already linked, not current table)
  const addableTables = availableTables.filter(
    tableNum => !editedLinkedTables.includes(tableNum) && tableNum !== currentTableNumber
  );

  const handleAddTable = (tableNumber: number) => {
    if (!editedLinkedTables.includes(tableNumber)) {
      setEditedLinkedTables([...editedLinkedTables, tableNumber]);
      toast.success(`Table ${tableNumber} added to linked group`);
    }
  };

  const handleRemoveTable = (tableNumber: number) => {
    // Prevent removing the primary table (current table)
    if (tableNumber === currentTableNumber) {
      toast.error('Cannot unlink the primary table');
      return;
    }

    setEditedLinkedTables(editedLinkedTables.filter(t => t !== tableNumber));
    toast.success(`Table ${tableNumber} removed from linked group`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await onSave(editedLinkedTables);
      if (success) {
        toast.success('Linked tables updated successfully');
        onClose();
      } else {
        toast.error('Failed to update linked tables');
      }
    } catch (error) {
      console.error('[ManageLinkedTablesDialog] Save failed:', error);
      toast.error('Failed to update linked tables');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedLinkedTables(linkedTables); // Reset to original
    onClose();
  };

  const hasChanges = JSON.stringify(editedLinkedTables.sort()) !== JSON.stringify(linkedTables.sort());

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent 
        className="max-w-2xl border-0 border-b-2"
        style={{
          background: `linear-gradient(135deg, ${QSAITheme.purple.dark} 0%, ${QSAITheme.background.darker} 100%)`,
          borderBottom: `2px solid ${QSAITheme.purple.primary}`
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Link2 className="w-6 h-6 text-purple-400" />
            Manage Linked Tables
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Table {currentTableNumber} - Add or remove linked tables for large parties
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Linked Tables Section */}
          <div>
            <h3 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Currently Linked Tables ({editedLinkedTables.length})
            </h3>
            
            {editedLinkedTables.length === 0 ? (
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 text-center">
                <p className="text-gray-400 text-sm">No linked tables</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {editedLinkedTables.map(tableNum => (
                  <div
                    key={tableNum}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg"
                  >
                    <span className="text-white font-medium">Table {tableNum}</span>
                    {tableNum === currentTableNumber && (
                      <Badge variant="outline" className="border-blue-500/30 text-blue-300 text-xs">
                        Primary
                      </Badge>
                    )}
                    {tableNum !== currentTableNumber && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTable(tableNum)}
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Tables Section */}
          <div>
            <h3 className="text-sm font-semibold text-green-300 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Available Tables ({addableTables.length})
            </h3>
            
            {addableTables.length === 0 ? (
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 text-center">
                <p className="text-gray-400 text-sm">All tables are already linked</p>
              </div>
            ) : (
              <ScrollArea className="h-40">
                <div className="grid grid-cols-4 gap-2">
                  {addableTables.map(tableNum => (
                    <Button
                      key={tableNum}
                      variant="outline"
                      onClick={() => handleAddTable(tableNum)}
                      className="border-green-500/30 text-green-300 hover:bg-green-500/20 hover:border-green-500/50"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Table {tableNum}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Info Alert */}
          <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">Linked Table Behavior:</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-blue-200">
                <li>All linked tables share the same order and guest count</li>
                <li>Changes are synchronized across all linked tables</li>
                <li>Primary table (Table {currentTableNumber}) cannot be unlinked</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            style={{
              background: hasChanges 
                ? `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`
                : undefined
            }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
