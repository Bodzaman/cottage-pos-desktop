import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit2, X, Save, Trash2 } from 'lucide-react';
import { QSAITheme } from 'utils/QSAIDesign';
import { CustomerTab } from 'types';
import { toast } from 'sonner';

interface Props {
  tableNumber: number;
  activeCustomerTab: CustomerTab | null;
  onCustomerTabCreate: (tabName: string) => Promise<void>;
  onCustomerTabRename: (tabId: string, newName: string) => Promise<void>;
  onCustomerTabClose: (tabId: string) => Promise<void>;
  className?: string;
}

/**
 * Customer tabs action bar with create, rename, and close functionality
 * Compact horizontal layout with QSAI design consistency
 */
export function CustomerTabsActions({
  tableNumber,
  activeCustomerTab,
  onCustomerTabCreate,
  onCustomerTabRename,
  onCustomerTabClose,
  className
}: Props) {
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  
  // Form states
  const [newTabName, setNewTabName] = useState('');
  const [newGuestId, setNewGuestId] = useState('');
  const [renameValue, setRenameValue] = useState('');
  
  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Handle create customer tab
  const handleCreate = async () => {
    if (!newTabName.trim()) {
      toast.error('Customer tab name is required');
      return;
    }

    setIsCreating(true);
    try {
      await onCustomerTabCreate(newTabName.trim());
      setNewTabName('');
      setNewGuestId('');
      setShowCreateModal(false);
      toast.success(`Customer tab "${newTabName}" created`);
    } catch (error) {
      toast.error('Failed to create customer tab');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle rename customer tab
  const handleRename = async () => {
    if (!activeCustomerTab || !renameValue.trim()) {
      toast.error('New tab name is required');
      return;
    }

    setIsRenaming(true);
    try {
      await onCustomerTabRename(activeCustomerTab.id!, renameValue.trim());
      setRenameValue('');
      setShowRenameModal(false);
      toast.success(`Customer tab renamed to "${renameValue}"`);
    } catch (error) {
      toast.error('Failed to rename customer tab');
    } finally {
      setIsRenaming(false);
    }
  };

  // Handle close customer tab
  const handleClose = async () => {
    if (!activeCustomerTab) return;

    setIsClosing(true);
    try {
      await onCustomerTabClose(activeCustomerTab.id!);
      setShowCloseModal(false);
      toast.success(`Customer tab "${activeCustomerTab.tab_name}" closed`);
    } catch (error) {
      toast.error('Failed to close customer tab');
    } finally {
      setIsClosing(false);
    }
  };

  // Open rename modal with current tab name
  const openRenameModal = () => {
    if (activeCustomerTab) {
      setRenameValue(activeCustomerTab.tab_name);
      setShowRenameModal(true);
    }
  };

  return (
    <>
      {/* Action Buttons Row */}
      <div className={`flex items-center gap-2 p-2 border rounded-lg ${className}`}
           style={{ borderColor: QSAITheme.border.light, backgroundColor: QSAITheme.background.secondary }}>
        
        {/* Create Customer Tab */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
          style={{
            backgroundColor: QSAITheme.purple.primary,
            backgroundImage: `linear-gradient(135deg, ${QSAITheme.purple.primary}, ${QSAITheme.purple.light})`,
            color: '#FFFFFF',
            border: 'none',
            boxShadow: `0 2px 4px rgba(91, 33, 182, 0.3)`
          }}
        >
          <Plus size={14} />
          New Customer
        </Button>

        {/* Rename Active Customer Tab */}
        {activeCustomerTab && (
          <Button
            variant="outline"
            size="sm"
            onClick={openRenameModal}
            className="flex items-center gap-2"
            style={{
              borderColor: QSAITheme.border.medium,
              color: QSAITheme.text.primary
            }}
          >
            <Edit2 size={14} />
            Rename
          </Button>
        )}

        {/* Close Active Customer Tab */}
        {activeCustomerTab && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCloseModal(true)}
            className="flex items-center gap-2"
            style={{
              borderColor: QSAITheme.status.error,
              color: QSAITheme.status.error
            }}
          >
            <X size={14} />
            Close Tab
          </Button>
        )}
        
        <div className="flex-1" /> {/* Spacer */}
        
        {/* Info Text */}
        <span style={{ color: QSAITheme.text.muted }} className="text-xs">
          Manage individual customer orders within Table {tableNumber}
        </span>
      </div>

      {/* Create Customer Tab Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md" style={{ backgroundColor: QSAITheme.background.primary }}>
          <DialogHeader>
            <DialogTitle style={{ color: QSAITheme.text.primary }}>
              Create New Customer Tab - Table {tableNumber}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>
                Customer Tab Name *
              </label>
              <Input
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                placeholder="e.g., Customer 1, John, VIP Guest"
                className="mt-1"
                style={{
                  backgroundColor: QSAITheme.background.secondary,
                  borderColor: QSAITheme.border.medium,
                  color: QSAITheme.text.primary
                }}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>
                Guest ID (Optional)
              </label>
              <Input
                value={newGuestId}
                onChange={(e) => setNewGuestId(e.target.value)}
                placeholder="e.g., G001, VIP, Party Leader"
                className="mt-1"
                style={{
                  backgroundColor: QSAITheme.background.secondary,
                  borderColor: QSAITheme.border.medium,
                  color: QSAITheme.text.primary
                }}
              />
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleCreate}
                disabled={isCreating || !newTabName.trim()}
                className="flex items-center gap-2"
                style={{
                  backgroundColor: QSAITheme.purple.primary,
                  color: 'white'
                }}
              >
                <Save size={14} />
                {isCreating ? 'Creating...' : 'Create Tab'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                style={{
                  borderColor: QSAITheme.border.medium,
                  color: QSAITheme.text.primary
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Customer Tab Modal */}
      <Dialog open={showRenameModal} onOpenChange={setShowRenameModal}>
        <DialogContent className="max-w-md" style={{ backgroundColor: QSAITheme.background.primary }}>
          <DialogHeader>
            <DialogTitle style={{ color: QSAITheme.text.primary }}>
              Rename Customer Tab
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>
                New Tab Name
              </label>
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Enter new customer tab name"
                className="mt-1"
                style={{
                  backgroundColor: QSAITheme.background.secondary,
                  borderColor: QSAITheme.border.medium,
                  color: QSAITheme.text.primary
                }}
              />
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleRename}
                disabled={isRenaming || !renameValue.trim()}
                className="flex items-center gap-2"
                style={{
                  backgroundColor: QSAITheme.purple.primary,
                  color: 'white'
                }}
              >
                <Save size={14} />
                {isRenaming ? 'Renaming...' : 'Rename Tab'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowRenameModal(false)}
                style={{
                  borderColor: QSAITheme.border.medium,
                  color: QSAITheme.text.primary
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Customer Tab Modal */}
      <Dialog open={showCloseModal} onOpenChange={setShowCloseModal}>
        <DialogContent className="max-w-md" style={{ backgroundColor: QSAITheme.background.primary }}>
          <DialogHeader>
            <DialogTitle style={{ color: QSAITheme.text.primary }}>
              Close Customer Tab
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p style={{ color: QSAITheme.text.secondary }} className="text-sm">
              Are you sure you want to close "{activeCustomerTab?.tab_name}"?
              This will mark the customer tab as closed and move all orders to the completed state.
            </p>
            
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleClose}
                disabled={isClosing}
                className="flex items-center gap-2"
                style={{
                  backgroundColor: QSAITheme.status.error,
                  color: 'white'
                }}
              >
                <Trash2 size={14} />
                {isClosing ? 'Closing...' : 'Close Tab'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowCloseModal(false)}
                style={{
                  borderColor: QSAITheme.border.medium,
                  color: QSAITheme.text.primary
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CustomerTabsActions;
