import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, X, Save, Trash2, User, Users, ChevronDown, ChevronRight, Split, Merge, MoveRight, CheckSquare, Square, Receipt, CreditCard } from 'lucide-react';
import { QSAITheme } from 'utils/QSAIDesign';
import { CustomerTab } from 'types';
import { useCustomerTabs } from 'utils/useCustomerTabs';
import BillReviewModal from 'components/BillReviewModal';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  tableNumber: number;
  tableLevelItemCount?: number; // Optional: table-level order items count (from parent)
  className?: string;
}

/**
 * Compact customer tabs component that merges list and actions into horizontal layout
 * Optimized for space efficiency with collapsible customer tabs section
 * Height: ~40px when collapsed, expands dynamically when customer tabs exist
 * 
 * ✅ EVENT-DRIVEN ARCHITECTURE (MYA-1595):
 * Fully migrated to event-driven pattern using useCustomerTabs hook.
 * No legacy tableOrdersStore dependencies.
 */
export function CustomerTabsCompact({
  tableNumber,
  tableLevelItemCount = 0,
  className
}: Props) {
  // ✅ EVENT-DRIVEN: Use hook directly (no legacy store)
  const {
    customerTabs,
    activeTabId,
    setActiveTabId,
    createTab,
    renameTab,
    closeTab,
    splitTab,
    mergeTabs,
    moveItemsBetweenTabs
  } = useCustomerTabs(tableNumber);
  
  // DEBUG: Log when customerTabs changes
  useEffect(() => {
    console.log('[CustomerTabsCompact] 📋 CUSTOMER_TABS DATA:', {
      tableNumber,
      tabCount: customerTabs?.length || 0,
      tabs: customerTabs,
      activeTabId
    });
  }, [customerTabs, activeTabId, tableNumber]);
  
  // Get active customer tab object from array
  const activeCustomerTab = customerTabs.find(tab => tab.id === activeTabId) || null;
  
  // UI state
  const [isExpanded, setIsExpanded] = useState(customerTabs.length > 0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showBillReview, setShowBillReview] = useState(false);
  
  // Form states
  const [newTabName, setNewTabName] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [splitTabName, setSplitTabName] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [targetTabId, setTargetTabId] = useState<string>('');
  
  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  
  // Auto-expand when customer tabs are created
  React.useEffect(() => {
    if (customerTabs.length > 0 && !isExpanded) {
      setIsExpanded(true);
    }
  }, [customerTabs.length, isExpanded]);
  
  // Handle customer tab selection
  const handleCustomerTabSelect = (customerTab: CustomerTab | null) => {
    setActiveTabId(customerTab?.id || null);
  };
  
  // Handle create customer tab
  const handleCreate = async () => {
    if (!newTabName.trim()) {
      toast.error('Customer tab name is required');
      return;
    }

    setIsCreating(true);
    try {
      await createTab(newTabName.trim());
      setNewTabName('');
      setShowCreateModal(false);
      setIsExpanded(true); // Auto-expand when new tab is created
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
      await renameTab(activeCustomerTab.id!, renameValue.trim());
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
      await closeTab(activeCustomerTab.id!);
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
  
  // Handle split customer tab
  const handleSplit = async () => {
    if (!activeCustomerTab || !splitTabName.trim() || selectedItems.length === 0) {
      toast.error('Please select items and provide a tab name');
      return;
    }

    setIsSplitting(true);
    try {
      const result = await splitTab(activeCustomerTab.id, splitTabName.trim(), selectedItems);
      if (result.success) {
        setSplitTabName('');
        setSelectedItems([]);
        setShowSplitModal(false);
        toast.success(result.message);
      }
    } catch (error) {
      toast.error('Failed to split tab');
    } finally {
      setIsSplitting(false);
    }
  };

  // Handle merge customer tabs
  const handleMerge = async () => {
    if (!activeCustomerTab || !targetTabId) {
      toast.error('Please select a target tab');
      return;
    }

    setIsMerging(true);
    try {
      const result = await mergeTabs(activeCustomerTab.id, targetTabId);
      if (result.success) {
        setTargetTabId('');
        setShowMergeModal(false);
        toast.success(result.message);
      }
    } catch (error) {
      toast.error('Failed to merge tabs');
    } finally {
      setIsMerging(false);
    }
  };

  // Handle move items between tabs
  const handleMoveItems = async () => {
    if (!activeCustomerTab || !targetTabId || selectedItems.length === 0) {
      toast.error('Please select items and a target tab');
      return;
    }

    setIsMoving(true);
    try {
      const result = await moveItemsBetweenTabs(activeCustomerTab.id, targetTabId, selectedItems);
      if (result.success) {
        setTargetTabId('');
        setSelectedItems([]);
        setShowMoveModal(false);
        toast.success(result.message);
      }
    } catch (error) {
      toast.error('Failed to move items');
    } finally {
      setIsMoving(false);
    }
  };

  // Handle item selection for split/move operations
  const toggleItemSelection = (index: number) => {
    setSelectedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Reset modal states when closing
  const resetModals = () => {
    setSplitTabName('');
    setSelectedItems([]);
    setTargetTabId('');
  };
  
  // Handle per-tab bill review
  const handleTabBillReview = () => {
    if (!activeCustomerTab || !activeCustomerTab.order_items || activeCustomerTab.order_items.length === 0) {
      toast.error('No items to bill for this customer tab');
      return;
    }
    setShowBillReview(true);
  };

  // Handle final bill print and close customer tab
  const handleTabFinalBillPrint = async () => {
    if (!activeCustomerTab) return;
    
    try {
      // Close the customer tab after payment
      await closeTab(activeCustomerTab.id!);
      
      // Close bill review modal
      setShowBillReview(false);
      
      toast.success(`Customer tab "${activeCustomerTab.tab_name}" paid and closed`);
    } catch (error) {
      console.error('Error completing customer tab payment:', error);
      toast.error('Failed to complete payment');
    }
  };
  
  return (
    <>
      {/* Compact Header - Always visible ~40px height */}
      <div className={`border rounded-lg transition-all duration-300 ease-in-out ${className}`}
           style={{ 
             borderColor: QSAITheme.border.light, 
             backgroundColor: QSAITheme.background.secondary 
           }}>
        
        {/* Top Row: Table Badge + Status Message + New Customer Button + Expand Toggle */}
        <div className="flex items-center justify-between p-3 h-10">
          {/* Left: Table Badge + Status */}
          <div className="flex items-center gap-3">
            {/* Table Badge */}
            <Badge 
              variant="outline"
              className="flex items-center gap-1 px-2 py-1 text-xs"
              style={{
                backgroundColor: QSAITheme.purple.primary,
                borderColor: QSAITheme.purple.primary,
                color: 'white'
              }}
            >
              <Users size={12} />
              Table {tableNumber}
              {tableLevelItemCount > 0 && (
                <span className="ml-1 text-xs opacity-80">({tableLevelItemCount})</span>
              )}
            </Badge>
            
            {/* Status Message */}
            <span style={{ color: QSAITheme.text.muted }} className="text-xs">
              {customerTabs.length === 0 
                ? "No individual customer tabs" 
                : `${customerTabs.length} customer tab${customerTabs.length !== 1 ? 's' : ''}`
              }
            </span>
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* New Customer Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 h-7 px-2 text-xs"
              style={{
                backgroundColor: QSAITheme.purple.primary,
                borderColor: QSAITheme.purple.primary,
                color: 'white'
              }}
            >
              <Plus size={12} />
              New Customer
            </Button>
            
            {/* Expand/Collapse Toggle - only show when customer tabs exist */}
            {customerTabs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-7 w-7 p-0"
                style={{ color: QSAITheme.text.muted }}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </Button>
            )}
          </div>
        </div>
        
        {/* Expandable Customer Tabs Section */}
        <AnimatePresence>
          {isExpanded && customerTabs.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div className="px-3 pb-3 border-t" style={{ borderColor: QSAITheme.border.light }}>
                {/* Customer Tabs Row */}
                <div className="flex gap-2 flex-wrap mt-2">
                  {/* Table-level tab (default) */}
                  <Button
                    variant={!activeCustomerTab ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCustomerTabSelect(null)}
                    className="flex items-center gap-1 h-7 text-xs"
                    style={{
                      backgroundColor: !activeCustomerTab ? QSAITheme.purple.primary : 'transparent',
                      borderColor: !activeCustomerTab ? QSAITheme.purple.primary : QSAITheme.border.medium,
                      color: !activeCustomerTab ? 'white' : QSAITheme.text.primary
                    }}
                  >
                    <Users size={12} />
                    Table {tableNumber}
                    {tableLevelItemCount > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="ml-1 h-4 px-1 text-[10px]"
                        style={{
                          backgroundColor: !activeCustomerTab ? 'rgba(255,255,255,0.2)' : QSAITheme.purple.light,
                          color: 'white'
                        }}
                      >
                        {tableLevelItemCount}
                      </Badge>
                    )}
                  </Button>

                  {/* Individual Customer Tabs */}
                  {customerTabs.map(customerTab => {
                    const isActive = activeCustomerTab?.id === customerTab.id;
                    const itemCount = customerTab.order_items?.length || 0;
                    
                    return (
                      <Button
                        key={customerTab.id}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleCustomerTabSelect(customerTab)}
                        className="flex items-center gap-1 h-7 text-xs"
                        style={{
                          backgroundColor: isActive ? QSAITheme.purple.primary : 'transparent',
                          borderColor: isActive ? QSAITheme.purple.primary : QSAITheme.border.medium,
                          color: isActive ? 'white' : QSAITheme.text.primary
                        }}
                      >
                        <User size={12} />
                        {customerTab.tab_name}
                        {customerTab.guest_id && (
                          <span className="text-[10px] opacity-75">#{customerTab.guest_id}</span>
                        )}
                        {itemCount > 0 && (
                          <Badge 
                            variant="secondary" 
                            className="ml-1 h-4 px-1 text-[10px]"
                            style={{
                              backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : QSAITheme.purple.light,
                              color: 'white'
                            }}
                          >
                            {itemCount}
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
                
                {/* Customer Tab Actions Row */}
                {activeCustomerTab && (
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openRenameModal}
                      className="flex items-center gap-1 h-6 px-2 text-xs"
                      style={{
                        borderColor: QSAITheme.border.medium,
                        color: QSAITheme.text.primary
                      }}
                    >
                      <Edit2 size={10} />
                      Rename
                    </Button>
                    
                    {/* Split Tab Button - only show if tab has items */}
                    {activeCustomerTab.order_items && activeCustomerTab.order_items.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          resetModals();
                          setShowSplitModal(true);
                        }}
                        className="flex items-center gap-1 h-6 px-2 text-xs"
                        style={{
                          borderColor: QSAITheme.purple.primary,
                          color: QSAITheme.purple.primary
                        }}
                      >
                        <Split size={10} />
                        Split
                      </Button>
                    )}
                    
                    {/* Merge Tab Button - only show if there are other tabs */}
                    {customerTabs.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          resetModals();
                          setShowMergeModal(true);
                        }}
                        className="flex items-center gap-1 h-6 px-2 text-xs"
                        style={{
                          borderColor: QSAITheme.purple.primary,
                          color: QSAITheme.purple.primary
                        }}
                      >
                        <Merge size={10} />
                        Merge
                      </Button>
                    )}
                    
                    {/* Move Items Button - only show if tab has items and there are other tabs */}
                    {activeCustomerTab.order_items && activeCustomerTab.order_items.length > 0 && customerTabs.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          resetModals();
                          setShowMoveModal(true);
                        }}
                        className="flex items-center gap-1 h-6 px-2 text-xs"
                        style={{
                          borderColor: QSAITheme.purple.primary,
                          color: QSAITheme.purple.primary
                        }}
                      >
                        <MoveRight size={10} />
                        Move Items
                      </Button>
                    )}
                    
                    {/* Bill & Pay Button - only show if tab has items */}
                    {activeCustomerTab.order_items && activeCustomerTab.order_items.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTabBillReview}
                        className="flex items-center gap-1 h-6 px-2 text-xs"
                        style={{
                          borderColor: QSAITheme.status.success,
                          color: QSAITheme.status.success
                        }}
                      >
                        <Receipt size={10} />
                        Bill & Pay
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCloseModal(true)}
                      className="flex items-center gap-1 h-6 px-2 text-xs"
                      style={{
                        borderColor: QSAITheme.status.error,
                        color: QSAITheme.status.error
                      }}
                    >
                      <X size={10} />
                      Close Tab
                    </Button>
                    
                    <div className="flex-1" />
                    
                    {/* Active Tab Info */}
                    <span style={{ color: QSAITheme.text.muted }} className="text-xs">
                      <span style={{ color: QSAITheme.purple.primary, fontWeight: 'bold' }}>
                        {activeCustomerTab.tab_name}
                      </span>
                      {activeCustomerTab.order_items?.length > 0 ? (
                        <span> • {activeCustomerTab.order_items.length} item{activeCustomerTab.order_items.length !== 1 ? 's' : ''}</span>
                      ) : (
                        <span> • No items yet</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

      {/* Split Customer Tab Modal */}
      <Dialog open={showSplitModal} onOpenChange={setShowSplitModal}>
        <DialogContent className="max-w-md" style={{ backgroundColor: QSAITheme.background.primary }}>
          <DialogHeader>
            <DialogTitle style={{ color: QSAITheme.text.primary }}>
              Split Customer Tab
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>
                New Tab Name
              </label>
              <Input
                value={splitTabName}
                onChange={(e) => setSplitTabName(e.target.value)}
                placeholder="Enter new customer tab name"
                className="mt-1"
                style={{
                  backgroundColor: QSAITheme.background.secondary,
                  borderColor: QSAITheme.border.medium,
                  color: QSAITheme.text.primary
                }}
              />
            </div>
            
            {/* Item Selection for Split */}
            <div>
              <label className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>
                Select Items to Move to New Tab
              </label>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded p-2" style={{ borderColor: QSAITheme.border.medium }}>
                {activeCustomerTab?.order_items?.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: QSAITheme.background.secondary }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleItemSelection(index)}
                      className="h-6 w-6 p-0"
                      style={{ color: selectedItems.includes(index) ? QSAITheme.purple.primary : QSAITheme.text.muted }}
                    >
                      {selectedItems.includes(index) ? <CheckSquare size={16} /> : <Square size={16} />}
                    </Button>
                    <div className="flex-1">
                      <span className="text-sm" style={{ color: QSAITheme.text.primary }}>
                        {item.item_name}
                      </span>
                      {item.variant_name && (
                        <span className="text-xs ml-2" style={{ color: QSAITheme.text.muted }}>
                          ({item.variant_name})
                        </span>
                      )}
                      <div className="text-xs" style={{ color: QSAITheme.text.muted }}>
                        Qty: {item.quantity} • £{item.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )) || []}
              </div>
              {selectedItems.length > 0 && (
                <p className="text-xs mt-1" style={{ color: QSAITheme.purple.primary }}>
                  {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSplit}
                disabled={isSplitting || !splitTabName.trim() || selectedItems.length === 0}
                className="flex items-center gap-2"
                style={{
                  backgroundColor: QSAITheme.purple.primary,
                  color: 'white'
                }}
              >
                <Split size={14} />
                {isSplitting ? 'Splitting...' : 'Split Tab'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowSplitModal(false)}
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

      {/* Merge Customer Tabs Modal */}
      <Dialog open={showMergeModal} onOpenChange={setShowMergeModal}>
        <DialogContent className="max-w-md" style={{ backgroundColor: QSAITheme.background.primary }}>
          <DialogHeader>
            <DialogTitle style={{ color: QSAITheme.text.primary }}>
              Merge Customer Tabs
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>
                Select Target Tab
              </label>
              <select
                value={targetTabId}
                onChange={(e) => setTargetTabId(e.target.value)}
                className="mt-1 w-full"
                style={{
                  backgroundColor: QSAITheme.background.secondary,
                  borderColor: QSAITheme.border.medium,
                  color: QSAITheme.text.primary
                }}
              >
                <option value="">Select a tab</option>
                {customerTabs.map(tab => (
                  <option key={tab.id} value={tab.id}>
                    {tab.tab_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleMerge}
                disabled={isMerging || !targetTabId}
                className="flex items-center gap-2"
                style={{
                  backgroundColor: QSAITheme.purple.primary,
                  color: 'white'
                }}
              >
                <Merge size={14} />
                {isMerging ? 'Merging...' : 'Merge Tabs'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowMergeModal(false)}
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

      {/* Move Items Between Tabs Modal */}
      <Dialog open={showMoveModal} onOpenChange={setShowMoveModal}>
        <DialogContent className="max-w-md" style={{ backgroundColor: QSAITheme.background.primary }}>
          <DialogHeader>
            <DialogTitle style={{ color: QSAITheme.text.primary }}>
              Move Items Between Tabs
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>
                Select Target Tab
              </label>
              <select
                value={targetTabId}
                onChange={(e) => setTargetTabId(e.target.value)}
                className="mt-1 w-full"
                style={{
                  backgroundColor: QSAITheme.background.secondary,
                  borderColor: QSAITheme.border.medium,
                  color: QSAITheme.text.primary
                }}
              >
                <option value="">Select a tab</option>
                {customerTabs.map(tab => (
                  <option key={tab.id} value={tab.id}>
                    {tab.tab_name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Item Selection for Move */}
            <div>
              <label className="text-sm font-medium" style={{ color: QSAITheme.text.primary }}>
                Select Items to Move
              </label>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded p-2" style={{ borderColor: QSAITheme.border.medium }}>
                {activeCustomerTab?.order_items?.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: QSAITheme.background.secondary }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleItemSelection(index)}
                      className="h-6 w-6 p-0"
                      style={{ color: selectedItems.includes(index) ? QSAITheme.purple.primary : QSAITheme.text.muted }}
                    >
                      {selectedItems.includes(index) ? <CheckSquare size={16} /> : <Square size={16} />}
                    </Button>
                    <div className="flex-1">
                      <span className="text-sm" style={{ color: QSAITheme.text.primary }}>
                        {item.item_name}
                      </span>
                      {item.variant_name && (
                        <span className="text-xs ml-2" style={{ color: QSAITheme.text.muted }}>
                          ({item.variant_name})
                        </span>
                      )}
                      <div className="text-xs" style={{ color: QSAITheme.text.muted }}>
                        Qty: {item.quantity} • £{item.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )) || []}
              </div>
              {selectedItems.length > 0 && (
                <p className="text-xs mt-1" style={{ color: QSAITheme.purple.primary }}>
                  {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleMoveItems}
                disabled={isMoving || !targetTabId || selectedItems.length === 0}
                className="flex items-center gap-2"
                style={{
                  backgroundColor: QSAITheme.purple.primary,
                  color: 'white'
                }}
              >
                <MoveRight size={14} />
                {isMoving ? 'Moving...' : 'Move Items'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowMoveModal(false)}
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
      
      {/* Bill Review Modal for Customer Tab */}
      {activeCustomerTab && (
        <BillReviewModal
          isOpen={showBillReview}
          onClose={() => setShowBillReview(false)}
          tableNumber={tableNumber}
          orderItems={activeCustomerTab.order_items || []}
          onPrintFinalBill={handleTabFinalBillPrint}
        />
      )}
    </>
  );
}

export default CustomerTabsCompact;
