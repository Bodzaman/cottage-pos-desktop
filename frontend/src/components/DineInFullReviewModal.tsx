/**
 * DineInFullReviewModal - Full-Screen Order Review & Customer Tab Management
 *
 * Complete order management interface for DINE-IN orders with:
 * - Customer tab management (create, edit, delete, assign items)
 * - Item editing (quantity, customize, delete)
 * - Split billing per customer tab
 * - Combined billing for entire table
 *
 * TRIGGER: "Review Order" button in DineInOrderModal
 * DATA SOURCE: enrichedItems from useDineInOrder hook (with full menu metadata)
 * STATE MANAGEMENT: Parent handles all Supabase CRUD, this component only manages UI state
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  Plus,
  Minus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Receipt,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  Printer,
  ClipboardList,
  Cog,
  Utensils,
  User,
  Edit2,
  UtensilsCrossed,
  ChevronUp,
  ArrowLeft,
  FileText,
  StickyNote,
  MessageSquare,
} from 'lucide-react';
import { QSAITheme } from 'utils/QSAIDesign';
import { getTimeOccupied } from 'utils/tableTypes';
import { toast } from 'sonner';
import brain from 'brain';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ThermalReceiptDisplay from 'components/ThermalReceiptDisplay';
import { EnrichedOrderItemCard } from 'components/EnrichedOrderItemCard';
import { CompactDineInItemRow } from 'components/CompactDineInItemRow';
import { CustomerNotesDialog } from 'components/CustomerNotesDialog';
import type { OrderItem } from 'types';
import type { OrderItem as MenuOrderItem } from '../utils/menuTypes';
import type { EnrichedDineInOrderItem, DineInOrder } from '../brain/data-contracts';

/**
 * Local CustomerTab interface for this component.
 * Uses snake_case to match the database schema and parent component data.
 * Different from types/tables.ts CustomerTab which uses camelCase.
 */
interface CustomerTab {
  id: string;
  table_id?: number;
  tab_name: string;
  status: 'active' | 'paid' | 'closed';
  items?: OrderItem[];
  subtotal?: number;
  total?: number;
  payment_status?: string;
  payment_method?: string;
  paid_amount?: number;
  created_at?: string;
  updated_at?: string;
}
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { DineInBillPreviewModal } from 'components/DineInBillPreviewModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRealtimeMenuStore } from 'utils/realtimeMenuStore';
import { shallow } from 'zustand/shallow';
import { markBillPrinted } from 'utils/supabaseQueries';

// ==================== TYPE DEFINITIONS ====================

/**
 * Props for DineInFullReviewModal
 * All data from parent, all actions via callbacks
 */
interface DineInFullReviewModalProps {
  open: boolean;
  onClose: () => void;
  tableNumber: number;
  orderItems: OrderItem[];
  enrichedItems: EnrichedDineInOrderItem[];
  enrichedLoading?: boolean;
  enrichedError?: string | null;
  customerTabs: CustomerTab[];
  activeTab: CustomerTab | null;
  order?: DineInOrder | null;
  onCreateCustomerTab: (name: string) => void;
  onUpdateCustomerTabName: (tabId: string, newName: string) => void;
  onDeleteCustomerTab: (tabId: string) => void;
  onAssignItemToTab: (itemId: string, customerTabId: string | null) => void;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onDeleteItem: (itemId: string) => void;
  onCustomizeItem: (item: EnrichedDineInOrderItem) => void;
  onPrintBill: () => void;
  onPrintIndividualBill: (customerTabId: string) => void;
  linkedTables?: number[];
  tableCapacity?: number;
  isPrimaryTable?: boolean;
  totalLinkedCapacity?: number;
}

// ==================== SUB-COMPONENTS ====================

/**
 * AddCustomerTabDialog - Dialog for creating new customer tabs
 * Auto-suggests names like "Customer 1", "Customer 2", etc.
 * Validates against duplicate names
 */
interface AddCustomerTabDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTab: (tabName: string) => void;
  existingTabNames: string[];
}

function AddCustomerTabDialog({
  isOpen,
  onClose,
  onCreateTab,
  existingTabNames,
}: AddCustomerTabDialogProps) {
  const [tabName, setTabName] = useState('');
  const [error, setError] = useState('');

  // Generate suggested name (Customer 1, Customer 2, etc.)
  const getSuggestedName = () => {
    let counter = 1;
    while (existingTabNames.includes(`Customer ${counter}`)) {
      counter++;
    }
    return `Customer ${counter}`;
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      const suggested = getSuggestedName();
      setTabName(suggested);
      setError('');
    }
  }, [isOpen]);

  const validateAndCreate = () => {
    const trimmedName = tabName.trim();

    // Validation
    if (!trimmedName) {
      setError('Tab name cannot be empty');
      return;
    }

    if (existingTabNames.includes(trimmedName)) {
      setError(`Tab "${trimmedName}" already exists for this table`);
      return;
    }

    // Create tab
    onCreateTab(trimmedName);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateAndCreate();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md"
        style={{
          background: QSAITheme.background.panel,
          border: `1px solid ${QSAITheme.border.accent}`,
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            Add Customer Tab
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Customer Name</label>
            <input
              type="text"
              value={tabName}
              onChange={(e) => {
                setTabName(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Customer 1, John, Sarah"
              autoFocus
              className="w-full px-4 py-3 rounded-lg text-white text-base"
              style={{
                background: QSAITheme.background.secondary,
                border: `1px solid ${error ? '#EF4444' : QSAITheme.border.light}`,
                outline: 'none',
              }}
            />

            {/* Error message */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm"
                style={{ color: '#EF4444' }}
              >
                {error}
              </motion.p>
            )}
          </div>

          {/* Suggestions */}
          <div className="space-y-2">
            <p className="text-xs text-white/50">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {[getSuggestedName(), 'John', 'Sarah', 'Mike', 'Emma'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setTabName(suggestion);
                    setError('');
                  }}
                  disabled={existingTabNames.includes(suggestion)}
                  className="px-3 py-1.5 rounded-md text-sm transition-all"
                  style={{
                    background: existingTabNames.includes(suggestion)
                      ? QSAITheme.background.secondary
                      : `rgba(91, 33, 182, 0.15)`,
                    border: `1px solid ${
                      existingTabNames.includes(suggestion)
                        ? QSAITheme.border.light
                        : 'rgba(91, 33, 182, 0.3)'
                    }`,
                    color: existingTabNames.includes(suggestion)
                      ? 'rgba(255, 255, 255, 0.3)'
                      : QSAITheme.purple.light,
                    cursor: existingTabNames.includes(suggestion) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-white/70"
            style={{
              borderColor: QSAITheme.border.light,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={validateAndCreate}
            className="flex items-center gap-2"
            style={{
              background: QSAITheme.purple.primary,
              color: 'white',
            }}
          >
            <Plus className="h-4 w-4" />
            Create Tab
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== CUSTOMER TAB GROUP COMPONENT ====================

/**
 * CustomerTabGroup - Simplified customer tab display with inline editing
 * Matches CustomerTabsCompact visual patterns while staying prop-driven
 */
interface CustomerTabGroupProps {
  tab: CustomerTab;
  items: EnrichedDineInOrderItem[];
  sentItems: EnrichedDineInOrderItem[];
  pendingItems: EnrichedDineInOrderItem[];
  subtotal: number;
  isEmpty: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onUpdateTabName: (tabId: string, newName: string) => void;
  onDeleteTab: (tabId: string) => void;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onDeleteItem: (itemId: string) => void;
  onCustomizeItem: (item: EnrichedDineInOrderItem) => void;
  onAssignItemToTab: (itemId: string, customerTabId: string | null) => void;
  existingTabNames: string[];
  customerTabs: CustomerTab[]; // For reassign dropdown
  onPrintIndividualBill: (customerTabId: string) => void;
}

function CustomerTabGroup({
  tab,
  items,
  sentItems,
  pendingItems,
  subtotal,
  isEmpty,
  isCollapsed,
  onToggleCollapse,
  onUpdateTabName,
  onDeleteTab,
  onUpdateQuantity,
  onDeleteItem,
  onCustomizeItem,
  onAssignItemToTab,
  existingTabNames,
  customerTabs,
  onPrintIndividualBill,
}: CustomerTabGroupProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(tab.tab_name);
  const [nameError, setNameError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  const handleSaveEdit = () => {
    const trimmedName = editedName.trim();
    if (!trimmedName) {
      setNameError('Name cannot be empty');
      return;
    }
    if (trimmedName !== tab.tab_name && existingTabNames.includes(trimmedName)) {
      setNameError('This name is already taken');
      return;
    }
    onUpdateTabName(tab.id, trimmedName);
    setIsEditingName(false);
    setNameError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit();
    else if (e.key === 'Escape') {
      setEditedName(tab.tab_name);
      setNameError('');
      setIsEditingName(false);
    }
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: QSAITheme.background.panel,
        border: `1px solid ${QSAITheme.border.light}`,
      }}
    >
      {/* Header Bar */}
      <div
        className="p-4 cursor-pointer transition-colors hover:bg-white/[0.02]"
        style={{
          background: `rgba(59, 130, 246, 0.05)`,
          borderBottom: isCollapsed ? 'none' : `1px solid ${QSAITheme.border.light}`,
        }}
        onClick={() => !isEditingName && onToggleCollapse()}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left: Collapse + Name + Badges */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-5 w-5 text-white/60 flex-shrink-0" />
            </motion.div>

            {/* Editable name */}
            {isEditingName ? (
              <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={inputRef}
                  type="text"
                  value={editedName}
                  onChange={(e) => {
                    setEditedName(e.target.value);
                    setNameError('');
                  }}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSaveEdit}
                  className="px-3 py-1.5 rounded text-white font-semibold focus:outline-none"
                  style={{
                    background: QSAITheme.background.secondary,
                    border: `1px solid ${nameError ? '#EF4444' : QSAITheme.border.accent}`,
                    maxWidth: '200px',
                  }}
                />
                {nameError && <span className="text-xs text-red-400">{nameError}</span>}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 flex-shrink-0" style={{ color: '#3B82F6' }} />
                <h3 className="text-lg font-semibold text-white truncate">{tab.tab_name}</h3>
              </div>
            )}

            {/* Item count */}
            <div
              className="px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
              style={{
                background: isEmpty ? 'rgba(255, 255, 255, 0.05)' : 'rgba(59, 130, 246, 0.15)',
                color: isEmpty ? 'rgba(255, 255, 255, 0.4)' : '#3B82F6',
              }}
            >
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </div>

            {/* Subtotal */}
            <div className="text-lg font-bold whitespace-nowrap" style={{ color: '#3B82F6' }}>
              £{subtotal.toFixed(2)}
            </div>
          </div>

          {/* Right: Action buttons */}
          {!isEditingName && (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {/* Print Individual Bill button */}
              {!isEmpty && (
                <button
                  onClick={() => onPrintIndividualBill(tab.id)}
                  className="p-2 rounded-lg transition-all hover:scale-105"
                  style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                  }}
                  title={`Print bill for ${tab.tab_name}`}
                >
                  <Printer className="h-4 w-4" style={{ color: '#3B82F6' }} />
                </button>
              )}
              <button
                onClick={() => {
                  setEditedName(tab.tab_name);
                  setNameError('');
                  setIsEditingName(true);
                }}
                className="p-2 rounded-lg transition-all hover:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${QSAITheme.border.light}`,
                }}
                title="Edit name"
              >
                <Edit2 className="h-4 w-4 text-white/60" />
              </button>

              <button
                onClick={() => (isEmpty ? onDeleteTab(tab.id) : setShowDeleteConfirm(true))}
                className="p-2 rounded-lg transition-all hover:scale-105"
                style={{
                  background: isEmpty ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${isEmpty ? 'rgba(239, 68, 68, 0.3)' : QSAITheme.border.light}`,
                }}
                title={isEmpty ? 'Delete tab' : 'Delete tab (has items)'}
              >
                <Trash2
                  className="h-4 w-4"
                  style={{ color: isEmpty ? '#EF4444' : 'rgba(255, 255, 255, 0.6)' }}
                />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {isEmpty ? (
              <div className="py-8 text-center">
                <User
                  className="h-10 w-10 mx-auto mb-3"
                  style={{ color: QSAITheme.purple.primary + '40' }}
                />
                <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
                  No items assigned to {tab.tab_name}
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                  Use the "Assign to Customer" dropdown on items to add them here
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Sent items */}
                {sentItems.length > 0 && (
                  <div className="space-y-3">
                    <div
                      className="px-2 py-1 rounded text-xs font-medium inline-block"
                      style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' }}
                    >
                      Sent to Kitchen ({sentItems.length})
                    </div>
                    {/* Grid layout: 2-3 columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                      {sentItems.map((item) => (
                        <EnrichedOrderItemCard
                          key={item.id}
                          item={item}
                          customerTabs={customerTabs}
                          currentCustomerTabId={tab.id}
                          onUpdateQuantity={onUpdateQuantity}
                          onDeleteItem={onDeleteItem}
                          onCustomizeItem={onCustomizeItem}
                          onAssignItemToTab={onAssignItemToTab}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending items */}
                {pendingItems.length > 0 && (
                  <div className="space-y-3">
                    <div
                      className="px-2 py-1 rounded text-xs font-medium inline-block"
                      style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#F97316' }}
                    >
                      Pending ({pendingItems.length})
                    </div>
                    {/* Grid layout: 2-3 columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                      {pendingItems.map((item) => (
                        <EnrichedOrderItemCard
                          key={item.id}
                          item={item}
                          customerTabs={customerTabs}
                          currentCustomerTabId={tab.id}
                          onUpdateQuantity={onUpdateQuantity}
                          onDeleteItem={onDeleteItem}
                          onCustomizeItem={onCustomizeItem}
                          onAssignItemToTab={onAssignItemToTab}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent
          className="max-w-md"
          style={{
            background: QSAITheme.background.panel,
            border: `1px solid ${QSAITheme.border.accent}`,
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Delete Customer Tab?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-white/80">
              This customer tab has{' '}
              <span className="font-semibold" style={{ color: '#3B82F6' }}>
                {items.length} items
              </span>
              .
            </p>
            <p className="text-white/60 mt-2 text-sm">
              Deleting this tab will reassign all items back to table-level (shared by whole table).
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="text-white/70"
              style={{ borderColor: QSAITheme.border.light }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onDeleteTab(tab.id);
                setShowDeleteConfirm(false);
              }}
              className="flex items-center gap-2"
              style={{ background: '#EF4444', color: 'white' }}
            >
              <Trash2 className="h-4 w-4" />
              Delete Tab
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function DineInFullReviewModal({
  open,
  onClose,
  tableNumber,
  orderItems,
  enrichedItems,
  enrichedLoading = false,
  enrichedError = null,
  customerTabs,
  activeTab,
  linkedTables = [],
  tableCapacity = 0,
  isPrimaryTable = false,
  totalLinkedCapacity = 0,
  order = null,
  onCreateCustomerTab,
  onUpdateCustomerTabName,
  onDeleteCustomerTab,
  onAssignItemToTab,
  onUpdateQuantity,
  onDeleteItem,
  onCustomizeItem,
  onPrintBill,
  onPrintIndividualBill,
}: DineInFullReviewModalProps) {

  // ==================== MENU STORE (for image_url and category_name enrichment) ====================
  // Uses same data source as POSMenuSelector - already has resolved image URLs
  const menuItems = useRealtimeMenuStore(state => state.menuItems, shallow);
  const categories = useRealtimeMenuStore(state => state.categories, shallow);

  // Create lookup maps for efficient enrichment
  const menuItemsMap = useMemo(() =>
    Object.fromEntries(menuItems.map(item => [item.id, item])), [menuItems]);
  const categoriesMap = useMemo(() =>
    Object.fromEntries(categories.map(cat => [cat.id, cat])), [categories]);

  // ==================== STATE ====================

  const [isCreatingTab, setIsCreatingTab] = useState(false);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [selectedFilterTab, setSelectedFilterTab] = useState<'all' | string>('all');

  // State for billing actions
  const [isPrintingBill, setIsPrintingBill] = useState(false);
  const quantityUpdateTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // State for Notes dialog
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState<string>('');

  // State for collapsed categories
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // State for view mode: 'category' or 'customer'
  const [viewMode, setViewMode] = useState<'category' | 'customer'>('category');

  // State for collapsed customer tabs (when in customer view)
  const [collapsedCustomerTabs, setCollapsedCustomerTabs] = useState<Set<string>>(new Set());

  // State for live session timer
  const [elapsedTime, setElapsedTime] = useState<string>('');

  // Effect for live timer updates (every minute)
  useEffect(() => {
    if (!order?.created_at) {
      setElapsedTime('');
      return;
    }

    const updateTimer = () => {
      const createdAt = new Date(order.created_at);
      setElapsedTime(getTimeOccupied(createdAt));
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [order?.created_at]);

  // Sync notes with order data
  useEffect(() => {
    if (order?.notes) {
      setOrderNotes(order.notes);
    }
  }, [order?.notes]);

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Calculate subtotal for a given set of items
   * Falls back to unit_price * quantity if line_total is not available
   */
  const calculateSubtotal = (items: EnrichedDineInOrderItem[]): number => {
    return items.reduce((sum, item) => {
      const itemTotal = item.line_total ?? (item.unit_price * item.quantity);
      return sum + itemTotal;
    }, 0);
  };

  /**
   * Toggle category collapse state
   */
  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  /**
   * Toggle customer tab collapse state
   */
  const toggleCustomerTabCollapse = (tabId: string) => {
    setCollapsedCustomerTabs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tabId)) {
        newSet.delete(tabId);
      } else {
        newSet.add(tabId);
      }
      return newSet;
    });
  };

  // ==================== HANDLERS ====================

  const handleOpenBillPreview = () => {
    setShowBillPreview(true);
  };

  const handlePrintFinalBill = async (orderTotal: number): Promise<boolean> => {
    try {
      onPrintBill();
      // Mark bill as printed for session tracking
      await markBillPrinted(tableNumber);
      return true;
    } catch (error) {
      console.error('Failed to mark bill as printed:', error);
      // Still return true since the print was initiated
      return true;
    }
  };

  /**
   * Save notes to order via API
   * Note: Uses type cast as update_order_notes may not be in generated Brain types yet
   */
  const handleSaveNotes = async (notes: string): Promise<void> => {
    if (!order?.id) {
      toast.error('Cannot save notes: Order ID not available');
      throw new Error('Order ID missing');
    }

    try {
      // Type cast for update_order_notes - method may be added to backend
      const brainWithNotes = brain as typeof brain & {
        update_order_notes: (params: { order_id: string; notes: string }) => Promise<Response>;
      };
      const response = await brainWithNotes.update_order_notes({
        order_id: order.id,
        notes: notes,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to save notes');
      }

      setOrderNotes(notes);
      toast.success('Notes saved successfully');
    } catch (error) {
      console.error('Failed to save notes:', error);
      toast.error('Failed to save notes');
      throw error;
    }
  };

  /**
   * Debounced quantity update handler
   * Waits 300ms after last change before triggering update
   */
  const handleDebouncedQuantityUpdate = useCallback(
    (itemId: string, newQuantity: number) => {
      // Clear existing timeout for this item
      if (quantityUpdateTimeoutRef.current[itemId]) {
        clearTimeout(quantityUpdateTimeoutRef.current[itemId]);
      }

      // Set new timeout
      quantityUpdateTimeoutRef.current[itemId] = setTimeout(() => {
        onUpdateQuantity(itemId, newQuantity);
        delete quantityUpdateTimeoutRef.current[itemId];
      }, 300);
    },
    [onUpdateQuantity]
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(quantityUpdateTimeoutRef.current).forEach(clearTimeout);
    };
  }, []);

  // ==================== HELPER FUNCTIONS FOR DROPDOWNS ====================

  /**
   * Get display label for table selector
   */
  const getTableSelectorLabel = (): string => {
    if (selectedFilterTab === 'all') return 'All Tables';
    if (selectedFilterTab.startsWith('table-')) {
      const tableNum = parseInt(selectedFilterTab.replace('table-', ''));
      return `Table ${tableNum}`;
    }
    return 'Select Table';
  };

  /**
   * Get display label for customer tab selector
   */
  const getCustomerTabSelectorLabel = (): string => {
    if (selectedFilterTab === 'all') return 'All Customers';
    const selectedTab = customerTabs.find((tab) => tab.id === selectedFilterTab);
    return selectedTab ? selectedTab.tab_name : 'Select Customer';
  };

  /**
   * Check if current filter is a table filter
   */
  const isTableFilterActive =
    selectedFilterTab === 'all' || selectedFilterTab.startsWith('table-');

  /**
   * Check if current filter is a customer tab filter
   */
  const isCustomerTabFilterActive = !isTableFilterActive && selectedFilterTab !== 'all';

  /**
   * Handle creating a new customer tab
   */
  const handleAddCustomerTab = (tabName: string) => {
    onCreateCustomerTab(tabName);
    setIsCreatingTab(false);
  };

  // ==================== DATA GROUPING & FILTERING ====================

  /**
   * ENRICHMENT HELPER: Get image_url and category_name from realtimeMenuStore
   * This aligns with how POSMenuSelector displays menu items
   */
  const enrichItemWithMenuData = useCallback((item: any) => {
    const menuItem = item.menu_item_id ? menuItemsMap[item.menu_item_id] : null;
    const category = item.category_id ? categoriesMap[item.category_id] : null;

    return {
      ...item,
      // Enrich image_url: prefer existing, fallback to menu store
      image_url: item.image_url || menuItem?.image_url || null,
      // Enrich category_name: prefer existing, fallback to menu store, then 'Uncategorized'
      category_name: item.category_name || category?.name || 'Uncategorized',
      // Enrich kitchen_display_name for thermal receipt printing
      kitchen_display_name: item.kitchen_display_name || menuItem?.kitchen_display_name || null,
      // Enrich display_order for item sorting within sections
      display_order: item.display_order ?? menuItem?.display_order ?? 0,
    };
  }, [menuItemsMap, categoriesMap]);

  /**
   * FALLBACK: Convert orderItems to enrichedItems format when dine_in_order_items table is empty
   * This handles legacy orders that were stored only in orders.items JSONB
   * ENRICHMENT: Always enrich with image_url and category_name from realtimeMenuStore
   */
  const effectiveEnrichedItems = useMemo(() => {
    // If we have enrichedItems from dine_in_order_items table, enrich them with menu data
    if (enrichedItems && enrichedItems.length > 0) {
      return enrichedItems.map(enrichItemWithMenuData) as EnrichedDineInOrderItem[];
    }

    // Fallback: Convert orderItems (from orders.items JSONB) to enriched format
    if (orderItems && orderItems.length > 0) {
      return orderItems.map((item: any) => {
        const baseItem = {
          id: item.id,
          order_id: order?.id || '',
          customer_tab_id: null,
          table_number: tableNumber,
          menu_item_id: item.menu_item_id || null,
          variant_id: item.variant?.id || null,
          item_name: item.name,
          variant_name: item.variant?.name || null,
          protein_type: item.variant?.protein_type || null,
          quantity: item.quantity,
          unit_price: item.price,
          line_total: item.price * item.quantity,
          customizations: item.customizations || [],
          notes: item.notes || null,
          status: 'NEW',
          sent_to_kitchen_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          image_url: item.image_url || null,
          category_name: item.category_name || null,
          category_id: item.category_id || null,
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: false,
          spice_level: null,
        };
        // Enrich with menu store data
        return enrichItemWithMenuData(baseItem);
      }) as EnrichedDineInOrderItem[];
    }

    return [];
  }, [enrichedItems, orderItems, order?.id, tableNumber, enrichItemWithMenuData]);

  /**
   * Get item count for a customer tab
   */
  const getItemCountForCustomerTab = (tabId: string): number => {
    return effectiveEnrichedItems.filter((item) => item.customer_tab_id === tabId).length;
  };

  /**
   * Filter items based on selected pill tab
   */
  const filteredItems = useMemo(() => {
    if (selectedFilterTab === 'all') {
      return effectiveEnrichedItems;
    } else if (selectedFilterTab.startsWith('table-')) {
      const tableNum = parseInt(selectedFilterTab.replace('table-', ''));
      return effectiveEnrichedItems.filter(
        (item) => item.table_number === tableNum && !item.customer_tab_id
      );
    } else {
      return effectiveEnrichedItems.filter((item) => item.customer_tab_id === selectedFilterTab);
    }
  }, [selectedFilterTab, effectiveEnrichedItems]);

  /**
   * Group filtered items by category for display
   */
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    const categoryName = item.category_name || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, EnrichedDineInOrderItem[]>);

  // ==================== COMPUTED VALUES ====================

  /**
   * Total item count across all items
   */
  const totalItemCount = effectiveEnrichedItems.length;

  /**
   * All table numbers (primary + linked)
   */
  const allTableNumbers = [tableNumber, ...linkedTables];

  /**
   * Calculate item count for a specific table (excluding customer tab items)
   */
  const getItemCountForTable = (tableNum: number): number => {
    return effectiveEnrichedItems.filter(
      (item) => item.table_number === tableNum && !item.customer_tab_id
    ).length;
  };

  /**
   * Compute item counts for each pill
   */
  const customerTabsWithCounts = customerTabs
    .filter((tab) => tab.status === 'active')
    .map((tab) => ({
      ...tab,
      itemCount: effectiveEnrichedItems.filter((item) => item.customer_tab_id === tab.id).length,
    }));

  // ==================== MEMOIZED RECEIPT DATA ====================

  /**
   * Memoized order data for ThermalReceiptDisplay
   * Only recomputes when filteredItems or related props change
   */
  const receiptOrderData = useMemo(() => {
    const subtotal = filteredItems.reduce((sum, item) => sum + (item.line_total ?? (item.unit_price * item.quantity)), 0);
    const tax = subtotal * 0.2;
    const total = subtotal * 1.2;

    return {
      orderId: `TABLE-${tableNumber}-${Date.now()}`,
      orderNumber: `T${tableNumber}-${Date.now().toString().slice(-6)}`,
      orderType: 'DINE-IN' as const,
      tableNumber: tableNumber.toString(),
      guestCount: totalLinkedCapacity > 0 ? totalLinkedCapacity : tableCapacity,
      items: filteredItems.map((item) => ({
        id: item.id,
        name: item.item_name || 'Unknown Item',
        price: item.unit_price,
        quantity: item.quantity,
        // Section divider support - pass through for ThermalPreview grouping
        category_id: item.category_id,
        menu_item_id: item.menu_item_id,
        variant:
          item.variant_name && item.variant_name !== 'Default'
            ? {
                id: item.variant_id || '',
                name: item.variant_name,
                price_adjustment: 0,
              }
            : undefined,
        customizations: item.customizations || [],
        instructions: item.notes,
      })),
      subtotal,
      tax,
      total,
      timestamp: new Date().toISOString(),
    };
  }, [filteredItems, tableNumber, totalLinkedCapacity, tableCapacity]);

  // ==================== RENDER ====================

  return (
    <>
      {/* Add Customer Tab Dialog */}
      <AddCustomerTabDialog
        isOpen={isCreatingTab}
        onClose={() => setIsCreatingTab(false)}
        onCreateTab={handleAddCustomerTab}
        existingTabNames={customerTabs
          .filter((tab) => tab.status === 'active')
          .map((tab) => tab.tab_name)}
      />

      {/* Main Review Modal */}
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className="max-w-[95vw] max-h-[95dvh] w-full h-full p-0 flex flex-col overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${QSAITheme.background.primary} 0%, ${QSAITheme.background.secondary} 100%)`,
            border: `1px solid ${QSAITheme.border.accent}`,
          }}
        >
          {/* ==================== STICKY HEADER ==================== */}
          <div
            className="sticky top-0 z-20 px-6 py-4 border-b flex-shrink-0"
            style={{
              background: QSAITheme.background.panel,
              borderColor: QSAITheme.border.light,
            }}
          >
            <div className="flex items-center justify-between">
              {/* Title */}
              <div>
                <DialogTitle
                  className="text-2xl font-bold"
                  style={{ color: QSAITheme.text.primary }}
                >
                  Order Review
                </DialogTitle>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
                    Table {tableNumber} • {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                  </p>
                  {elapsedTime && (
                    <div
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-md"
                      style={{
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                      }}
                    >
                      <Clock className="h-3.5 w-3.5" style={{ color: '#F59E0B' }} />
                      <span className="text-sm font-medium" style={{ color: '#F59E0B' }}>
                        {elapsedTime}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="h-10 w-10 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
                style={{
                  color: QSAITheme.text.muted,
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* ==================== 60/40 SPLIT CONTENT ==================== */}
          <div className="flex-1 flex overflow-hidden">
            {/* LEFT PANEL (60%) - Items Display */}
            <div
              className="w-[60%] flex flex-col border-r"
              style={{ borderColor: QSAITheme.border.medium }}
            >
              {/* Pill Navigation for Item Filtering */}
              <div
                className="px-6 py-3 border-b overflow-x-auto flex-shrink-0"
                style={{ borderColor: QSAITheme.border.light }}
              >
                <div className="flex items-center gap-2 min-w-max">
                  {/* All Items Pill */}
                  <button
                    onClick={() => setSelectedFilterTab('all')}
                    className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all hover:scale-105"
                    style={{
                      background:
                        selectedFilterTab === 'all'
                          ? 'rgba(91, 33, 182, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                      color:
                        selectedFilterTab === 'all'
                          ? QSAITheme.purple.light
                          : QSAITheme.text.muted,
                      border: `1px solid ${
                        selectedFilterTab === 'all'
                          ? QSAITheme.purple.primary
                          : QSAITheme.border.light
                      }`,
                      boxShadow:
                        selectedFilterTab === 'all'
                          ? `0 0 12px ${QSAITheme.purple.glow}`
                          : 'none',
                    }}
                  >
                    All Items ({totalItemCount})
                  </button>

                  {/* Table Selector Dropdown */}
                  {allTableNumbers.length > 0 && (
                    <Select
                      value={
                        isTableFilterActive && selectedFilterTab !== 'all'
                          ? selectedFilterTab
                          : undefined
                      }
                      onValueChange={(value) => setSelectedFilterTab(value)}
                    >
                      <SelectTrigger
                        className="w-[180px] h-8 text-sm"
                        style={{
                          background:
                            isTableFilterActive && selectedFilterTab !== 'all'
                              ? 'rgba(249, 115, 22, 0.2)'
                              : 'rgba(255, 255, 255, 0.05)',
                          color:
                            isTableFilterActive && selectedFilterTab !== 'all'
                              ? '#F97316'
                              : QSAITheme.text.muted,
                          border: `1px solid ${
                            isTableFilterActive && selectedFilterTab !== 'all'
                              ? 'rgba(249, 115, 22, 0.5)'
                              : QSAITheme.border.light
                          }`,
                          boxShadow:
                            isTableFilterActive && selectedFilterTab !== 'all'
                              ? '0 0 12px rgba(249, 115, 22, 0.3)'
                              : 'none',
                        }}
                      >
                        <SelectValue placeholder="Table">
                          <div className="flex items-center gap-1.5">
                            <UtensilsCrossed className="h-3.5 w-3.5" />
                            Table: {getTableSelectorLabel()}
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {allTableNumbers.map((tableNum) => {
                          const itemCount = getItemCountForTable(tableNum);
                          const tabId = `table-${tableNum}`;
                          const isLinked = tableNum !== tableNumber;

                          return (
                            <SelectItem key={tabId} value={tabId}>
                              <div className="flex items-center justify-between w-full gap-4">
                                <span className="font-medium">Table {tableNum}</span>
                                <span
                                  className="text-xs"
                                  style={{ color: QSAITheme.text.muted }}
                                >
                                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                                  {itemCount === 0 && isLinked && ' - linked'}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Customer Tab Selector Dropdown */}
                  {customerTabsWithCounts.length > 0 && (
                    <Select
                      value={isCustomerTabFilterActive ? selectedFilterTab : undefined}
                      onValueChange={(value) => setSelectedFilterTab(value)}
                    >
                      <SelectTrigger
                        className="w-[200px] h-8 text-sm"
                        style={{
                          background: isCustomerTabFilterActive
                            ? 'rgba(168, 85, 247, 0.2)'
                            : 'rgba(255, 255, 255, 0.05)',
                          color: isCustomerTabFilterActive
                            ? '#A855F7'
                            : QSAITheme.text.muted,
                          border: `1px solid ${
                            isCustomerTabFilterActive
                              ? 'rgba(168, 85, 247, 0.5)'
                              : QSAITheme.border.light
                          }`,
                          boxShadow: isCustomerTabFilterActive
                            ? '0 0 12px rgba(168, 85, 247, 0.3)'
                            : 'none',
                        }}
                      >
                        <SelectValue placeholder="Customer">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            Customer: {getCustomerTabSelectorLabel()}
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {customerTabsWithCounts.map((tab) => {
                          const itemCount = getItemCountForCustomerTab(tab.id);

                          return (
                            <SelectItem key={tab.id} value={tab.id}>
                              <div className="flex items-center justify-between w-full gap-4">
                                <span className="font-medium">{tab.tab_name}</span>
                                <span
                                  className="text-xs"
                                  style={{ color: QSAITheme.text.muted }}
                                >
                                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* View Mode Toggle */}
                  <div
                    className="flex items-center rounded-lg p-0.5"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${QSAITheme.border.light}`,
                    }}
                  >
                    <button
                      onClick={() => setViewMode('category')}
                      className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                      style={{
                        background: viewMode === 'category' ? QSAITheme.purple.primary : 'transparent',
                        color: viewMode === 'category' ? 'white' : QSAITheme.text.muted,
                      }}
                    >
                      By Category
                    </button>
                    <button
                      onClick={() => setViewMode('customer')}
                      className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                      style={{
                        background: viewMode === 'customer' ? '#3B82F6' : 'transparent',
                        color: viewMode === 'customer' ? 'white' : QSAITheme.text.muted,
                      }}
                    >
                      By Customer
                    </button>
                  </div>

                  {/* Add Customer Tab Button */}
                  <button
                    onClick={() => setIsCreatingTab(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
                    style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#3B82F6',
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Customer
                  </button>
                </div>
              </div>

              {/* Items Content Area (Scrollable) */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {totalItemCount === 0 ? (
                  /* Empty State */
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-4">
                      <div
                        className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
                        style={{
                          background: `rgba(91, 33, 182, 0.1)`,
                          border: `2px solid rgba(91, 33, 182, 0.3)`,
                        }}
                      >
                        <ClipboardList
                          className="h-8 w-8"
                          style={{ color: QSAITheme.purple.primary }}
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">No Items Yet</h3>
                        <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
                          Add items to this order to begin.
                        </p>
                      </div>
                      <Button
                        onClick={onClose}
                        className="mt-4"
                        style={{
                          background: `linear-gradient(135deg, ${QSAITheme.purple.primary} 0%, ${QSAITheme.purple.light} 100%)`,
                          border: `1px solid ${QSAITheme.purple.light}`,
                        }}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                ) : enrichedLoading ? (
                  /* Loading State */
                  <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg p-4"
                        style={{
                          background: QSAITheme.background.tertiary,
                          border: `1px solid ${QSAITheme.border.medium}`,
                        }}
                      >
                        <Skeleton
                          height={60}
                          baseColor={QSAITheme.background.secondary}
                          highlightColor={QSAITheme.background.highlight}
                        />
                      </div>
                    ))}
                  </div>
                ) : enrichedError ? (
                  /* Error State */
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-4">
                      <div
                        className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '2px solid rgba(239, 68, 68, 0.3)',
                        }}
                      >
                        <X className="h-8 w-8 text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Failed to Load Items
                        </h3>
                        <p className="text-sm text-red-400">{enrichedError}</p>
                      </div>
                      <Button
                        onClick={onClose}
                        variant="outline"
                        className="mt-4"
                        style={{
                          borderColor: QSAITheme.border.medium,
                          color: QSAITheme.text.secondary,
                        }}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                ) : viewMode === 'category' ? (
                  /* ==================== CATEGORY-GROUPED ITEMS DISPLAY ==================== */
                  <div className="space-y-6">
                    {Object.keys(itemsByCategory).length === 0 ? (
                      /* No items in filtered view */
                      <div className="flex items-center justify-center h-64">
                        <div className="text-center space-y-2">
                          <p
                            className="text-lg font-medium"
                            style={{ color: QSAITheme.text.secondary }}
                          >
                            No items in this filter
                          </p>
                          <p className="text-sm" style={{ color: QSAITheme.text.muted }}>
                            Try selecting a different tab or adding items to this category.
                          </p>
                        </div>
                      </div>
                    ) : (
                      Object.keys(itemsByCategory).map((categoryName) => {
                        const categoryItems = itemsByCategory[categoryName];
                        const isCollapsed = collapsedCategories.has(categoryName);
                        const categoryTotal = calculateSubtotal(categoryItems);

                        return (
                          <div key={categoryName}>
                            {/* Category Header (Collapsible) */}
                            <button
                              onClick={() => toggleCategory(categoryName)}
                              className="w-full flex items-center justify-between px-4 py-3 rounded-lg mb-2 transition-all hover:bg-white/5"
                              style={{
                                background: 'rgba(91, 33, 182, 0.08)',
                                border: `1px solid ${QSAITheme.border.accent}`,
                              }}
                            >
                              <div className="flex items-center gap-3">
                                {isCollapsed ? (
                                  <ChevronDown
                                    className="h-4 w-4"
                                    style={{ color: QSAITheme.purple.light }}
                                  />
                                ) : (
                                  <ChevronUp
                                    className="h-4 w-4"
                                    style={{ color: QSAITheme.purple.light }}
                                  />
                                )}
                                <h3
                                  className="text-sm font-bold uppercase tracking-wide"
                                  style={{ color: QSAITheme.text.primary }}
                                >
                                  {categoryName}
                                </h3>
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{
                                    background: 'rgba(91, 33, 182, 0.2)',
                                    color: QSAITheme.purple.light,
                                  }}
                                >
                                  {categoryItems.length}{' '}
                                  {categoryItems.length === 1 ? 'item' : 'items'}
                                </span>
                              </div>
                              <p
                                className="text-sm font-semibold"
                                style={{ color: QSAITheme.text.secondary }}
                              >
                                £{categoryTotal.toFixed(2)}
                              </p>
                            </button>

                            {/* Category Items (Collapsible Content) */}
                            {!isCollapsed && (
                              <div className="space-y-1 pl-2">
                                {categoryItems.map((item) => (
                                  <CompactDineInItemRow
                                    key={item.id}
                                    item={item}
                                    onUpdateQuantity={handleDebouncedQuantityUpdate}
                                    onDeleteItem={onDeleteItem}
                                    onCustomizeItem={onCustomizeItem}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  /* ==================== CUSTOMER TAB VIEW ==================== */
                  <div className="space-y-4">
                    {/* Table-Level Items (unassigned to any customer) */}
                    {(() => {
                      const tableItems = effectiveEnrichedItems.filter((item) => !item.customer_tab_id);
                      // Use sent_to_kitchen_at timestamp to determine if item was sent to kitchen
                      const sentTableItems = tableItems.filter((item) => item.sent_to_kitchen_at !== null);
                      const pendingTableItems = tableItems.filter((item) => item.sent_to_kitchen_at === null);
                      const tableSubtotal = calculateSubtotal(tableItems);

                      if (tableItems.length > 0) {
                        return (
                          <div
                            className="rounded-lg overflow-hidden"
                            style={{
                              background: QSAITheme.background.panel,
                              border: `1px solid ${QSAITheme.border.light}`,
                            }}
                          >
                            {/* Table Items Header */}
                            <div
                              className="p-4 flex items-center justify-between"
                              style={{
                                background: 'rgba(249, 115, 22, 0.05)',
                                borderBottom: `1px solid ${QSAITheme.border.light}`,
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <Utensils className="h-5 w-5" style={{ color: '#F97316' }} />
                                <h3 className="text-lg font-semibold text-white">Table Items</h3>
                                <span
                                  className="px-2 py-1 rounded text-xs font-medium"
                                  style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#F97316' }}
                                >
                                  {tableItems.length} {tableItems.length === 1 ? 'item' : 'items'}
                                </span>
                              </div>
                              <span className="text-lg font-bold" style={{ color: '#F97316' }}>
                                £{tableSubtotal.toFixed(2)}
                              </span>
                            </div>
                            <div className="p-4 space-y-4">
                              {/* Sent items */}
                              {sentTableItems.length > 0 && (
                                <div className="space-y-3">
                                  <div
                                    className="px-2 py-1 rounded text-xs font-medium inline-block"
                                    style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' }}
                                  >
                                    Sent to Kitchen ({sentTableItems.length})
                                  </div>
                                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {sentTableItems.map((item) => (
                                      <EnrichedOrderItemCard
                                        key={item.id}
                                        item={item}
                                        customerTabs={customerTabs.filter((t) => t.status === 'active')}
                                        currentCustomerTabId={null}
                                        onUpdateQuantity={handleDebouncedQuantityUpdate}
                                        onDeleteItem={onDeleteItem}
                                        onCustomizeItem={onCustomizeItem}
                                        onAssignItemToTab={onAssignItemToTab}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                              {/* Pending items */}
                              {pendingTableItems.length > 0 && (
                                <div className="space-y-3">
                                  <div
                                    className="px-2 py-1 rounded text-xs font-medium inline-block"
                                    style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#F97316' }}
                                  >
                                    Pending ({pendingTableItems.length})
                                  </div>
                                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {pendingTableItems.map((item) => (
                                      <EnrichedOrderItemCard
                                        key={item.id}
                                        item={item}
                                        customerTabs={customerTabs.filter((t) => t.status === 'active')}
                                        currentCustomerTabId={null}
                                        onUpdateQuantity={handleDebouncedQuantityUpdate}
                                        onDeleteItem={onDeleteItem}
                                        onCustomizeItem={onCustomizeItem}
                                        onAssignItemToTab={onAssignItemToTab}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Customer Tabs */}
                    {customerTabs
                      .filter((tab) => tab.status === 'active')
                      .map((tab) => {
                        const tabItems = effectiveEnrichedItems.filter((item) => item.customer_tab_id === tab.id);
                        // Use sent_to_kitchen_at timestamp to determine if item was sent to kitchen
                        const sentItems = tabItems.filter((item) => item.sent_to_kitchen_at !== null);
                        const pendingItems = tabItems.filter((item) => item.sent_to_kitchen_at === null);
                        const tabSubtotal = calculateSubtotal(tabItems);

                        return (
                          <CustomerTabGroup
                            key={tab.id}
                            tab={tab}
                            items={tabItems}
                            sentItems={sentItems}
                            pendingItems={pendingItems}
                            subtotal={tabSubtotal}
                            isEmpty={tabItems.length === 0}
                            isCollapsed={collapsedCustomerTabs.has(tab.id)}
                            onToggleCollapse={() => toggleCustomerTabCollapse(tab.id)}
                            onUpdateTabName={onUpdateCustomerTabName}
                            onDeleteTab={onDeleteCustomerTab}
                            onUpdateQuantity={handleDebouncedQuantityUpdate}
                            onDeleteItem={onDeleteItem}
                            onCustomizeItem={onCustomizeItem}
                            onAssignItemToTab={onAssignItemToTab}
                            existingTabNames={customerTabs
                              .filter((t) => t.status === 'active')
                              .map((t) => t.tab_name)}
                            customerTabs={customerTabs.filter((t) => t.status === 'active')}
                            onPrintIndividualBill={onPrintIndividualBill}
                          />
                        );
                      })}

                    {/* Empty state if no customer tabs */}
                    {customerTabs.filter((tab) => tab.status === 'active').length === 0 && (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <Users
                          className="h-12 w-12 mb-4"
                          style={{ color: QSAITheme.purple.primary + '40' }}
                        />
                        <h3
                          className="text-lg font-semibold mb-2"
                          style={{ color: QSAITheme.text.secondary }}
                        >
                          No Customer Tabs
                        </h3>
                        <p className="text-sm mb-4" style={{ color: QSAITheme.text.muted }}>
                          Create customer tabs to split the bill between guests.
                        </p>
                        <button
                          onClick={() => setIsCreatingTab(true)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                          style={{
                            background: '#3B82F6',
                            color: 'white',
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          Add First Customer
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT PANEL (40%) - Live Receipt Preview */}
            <div className="w-[40%] flex flex-col">
              {/* Receipt Display - Centered with Independent Scrolling */}
              <div className="flex-1 overflow-y-auto flex justify-center items-start py-6 px-4">
                <div
                  className="receipt-wrapper"
                  style={{
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <ThermalReceiptDisplay
                    orderMode="DINE-IN"
                    orderData={receiptOrderData}
                    paperWidth={80}
                    showZoomControls={false}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ==================== STICKY FOOTER ==================== */}
          {totalItemCount > 0 && !enrichedLoading && !enrichedError && (
            <div
              className="sticky bottom-0 z-10 px-6 py-3 border-t flex-shrink-0"
              style={{
                background: QSAITheme.background.panel,
                borderColor: QSAITheme.border.light,
              }}
            >
              <div className="flex items-center justify-between">
                {/* Left: Running Total + View Actions */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {totalItemCount} items · Total: £{calculateSubtotal(effectiveEnrichedItems).toFixed(2)}
                  </span>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => setIsNotesDialogOpen(true)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Notes
                    {orderNotes.trim() && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                        ✓
                      </Badge>
                    )}
                  </Button>
                </div>

                {/* Right: Primary Actions */}
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Order
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleOpenBillPreview}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    View Bill
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DineInBillPreviewModal - WYSIWYG thermal receipt preview before printing */}
      <DineInBillPreviewModal
        isOpen={showBillPreview}
        onClose={() => setShowBillPreview(false)}
        tableNumber={tableNumber}
        orderItems={enrichedItems as unknown as MenuOrderItem[]}
        guestCount={totalLinkedCapacity > 0 ? totalLinkedCapacity : tableCapacity}
        orderTotal={calculateSubtotal(effectiveEnrichedItems)}
        onPrintBill={handlePrintFinalBill}
      />

      {/* Notes Dialog */}
      <CustomerNotesDialog
        open={isNotesDialogOpen}
        onClose={() => setIsNotesDialogOpen(false)}
        initialNotes={orderNotes}
        onSave={handleSaveNotes}
        tableNumber={tableNumber}
      />
    </>
  );
}
