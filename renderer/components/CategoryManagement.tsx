import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  EyeOff,
  GripVertical,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Archive,
  Check,
  CheckCircle,
  AlertCircle,
  ChefHat,
  ToggleLeft,
  ToggleRight,
  Hash,
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient'; // Added missing import
import { apiClient } from 'app';
import { MenuCategory } from '../utils/menuTypes';
import { FIXED_SECTIONS, type SectionId, getSectionById, organizeCategoriesBySection } from 'utils/sectionMapping';
import { CategorySectionView } from './CategorySectionView';
import { SectionChangeWarningDialog } from './SectionChangeWarningDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditCategoryDialogEnhanced } from './EditCategoryDialogEnhanced';
import { AdminButton } from './AdminButton';
import { CustomDropdown } from './CustomDropdown';
import { DeleteCategoryDialog } from './DeleteCategoryDialog';
import { OrderNumberInput } from './OrderNumberInput';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useCategories, menuKeys } from '../utils/menuQueries';

interface ExtendedMenuCategory extends MenuCategory {
  children?: ExtendedMenuCategory[];
  item_count?: number;
}

interface CategoryManagementProps {
  onMenuChange?: () => void;
  className?: string;
}

// Extract EditCategoryDialog as a separate memoized component
interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editForm: {
    id: string;
    name: string;
    description: string;
    menu_order: number;
    print_order: number;
    print_to_kitchen: boolean;
    active: boolean;
    parent_category_id: string | null;
    is_protein_type: boolean;
  };
  setEditForm: React.Dispatch<React.SetStateAction<any>>;
  onSave: () => Promise<void>;
  onCancel: () => void;
}

const EditCategoryDialog = React.memo(({ 
  open, 
  onOpenChange, 
  editForm, 
  setEditForm, 
  onSave,
  onCancel 
}: EditCategoryDialogProps) => {
  console.log('[EditCategoryDialog] Rendered with editForm:', editForm);
  
  // Don't render if editForm is not ready
  if (!editForm || !editForm.id) {
    return null;
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/90 backdrop-blur-sm border-[#7C5DFA]/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Category: {editForm.name}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Modify the category details and settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit_name" className="text-white">Category Name *</Label>
            <Input
              id="edit_name"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              className="bg-black/50 border-gray-600 text-white"
            />
          </div>
          
          <div>
            <Label htmlFor="edit_description" className="text-white">Description</Label>
            <Textarea
              id="edit_description"
              value={editForm.description}
              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              className="bg-black/50 border-gray-600 text-white"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit_menu_order" className="text-white">Menu Order</Label>
              <Input
                id="edit_menu_order"
                type="number"
                value={editForm.menu_order}
                onChange={(e) => setEditForm(prev => ({ ...prev, menu_order: parseInt(e.target.value) || 0 }))}
                className="bg-black/50 border-gray-600 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="edit_print_order" className="text-white">Print Order</Label>
              <Input
                id="edit_print_order"
                type="number"
                value={editForm.print_order}
                onChange={(e) => setEditForm(prev => ({ ...prev, print_order: parseInt(e.target.value) || 0 }))}
                className="bg-black/50 border-gray-600 text-white"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="edit_print_to_kitchen"
                checked={editForm.print_to_kitchen}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, print_to_kitchen: checked }))}
              />
              <Label htmlFor="edit_print_to_kitchen" className="text-white">Print to Kitchen</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_protein_type"
                checked={editForm.is_protein_type}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_protein_type: checked }))}
              />
              <Label htmlFor="edit_is_protein_type" className="text-white">Protein Type Category</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit_active"
                checked={editForm.active}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, active: checked }))}
              />
              <Label htmlFor="edit_active" className="text-white">Active</Label>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              onClick={onSave}
              className="flex-1 bg-[#7C5DFA] hover:bg-[#6B4CE6] text-white"
            >
              Update Category
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

EditCategoryDialog.displayName = 'EditCategoryDialog';

const CategoryManagement: React.FC<CategoryManagementProps> = ({ onMenuChange, className = "" }) => {
  // State management
  const [categories, setCategories] = useState<ExtendedMenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActive, setShowActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [moving, setMoving] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select' | 'form'>('select');
  
  // Add missing DnD state variables
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<ExtendedMenuCategory | null>(null);
  
  // Form state - single source of truth
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    id: string;
    name: string;
    description: string;
    menu_order: number;
    print_order: number;
    print_to_kitchen: boolean;
    active: boolean;
    parent_category_id: string | null;
    is_protein_type: boolean;
  }>({
    id: "",
    name: "",
    description: "",
    menu_order: 0,
    print_order: 0,
    print_to_kitchen: true,
    active: true,
    parent_category_id: null,
    is_protein_type: false
  });
  
  // Enhanced dialog state for two-step form (MOVED OUTSIDE FUNCTION)
  const [selectedParentCategory, setSelectedParentCategory] = useState<string | null>(null);
  const [isTopLevelCategory, setIsTopLevelCategory] = useState(false);
  const [showFormStep, setShowFormStep] = useState(false);
  
  // Template and bulk operation state
  const [deletingCategories, setDeletingCategories] = useState(false);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDialogData, setDeleteDialogData] = useState<{
    categoryId: string;
    categoryName: string;
    itemCount: number;
    items: any[];
  } | null>(null);
  const [deleteAction, setDeleteAction] = useState<'reassign' | 'delete_all'>('reassign');
  const [targetCategoryId, setTargetCategoryId] = useState<string>('');
  
  // Menu data hook - replace with React Query
  const queryClient = useQueryClient();
  
  // React Query: fetch categories and expose refetch for imperative updates
  const { data: categoriesData = [], isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();
  
  // Memoize display order calculation to prevent reactive dependencies
  const nextMenuOrder = useMemo(() => {
    const topLevelCategories = categories.filter(cat => !cat.parent_category_id);
    return Math.max(0, ...topLevelCategories.map(cat => cat.menu_order || cat.display_order || 0)) + 1;
  }, [categories]);
  
  // Setup DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Reset form when no category is selected
  useEffect(() => {
    if (selectedCategoryId === null) {
      resetForm();
    }
  }, [selectedCategoryId]);
  
  // Debug: Track re-renders
  useEffect(() => {
    console.log('[CategoryManagement] Component re-rendered', {
      categoriesCount: categories.length,
      selectedCategoryId,
      isEditDialogOpen,
      editFormName: editForm.name
    });
  });
  
  const resetForm = () => {
    setEditForm({
      id: "",
      name: "",
      description: "",
      menu_order: nextMenuOrder,
      print_order: nextMenuOrder,
      print_to_kitchen: true,
      active: true,
      parent_category_id: null,
      is_protein_type: false
    });
  };
  
  const getNextMenuOrder = () => {
    const topLevelCategories = categories.filter(cat => !cat.parent_category_id);
    return Math.max(0, ...topLevelCategories.map(cat => cat.menu_order || cat.display_order || 0)) + 1;
  };
  
  const loadCategoryData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use React Query refetch to ensure we have the latest categories
      const refetchResult = await refetchCategories();
      const freshCategories = Array.isArray(refetchResult.data) ? refetchResult.data : [];
      
      // FIXED: Use direct Supabase query instead of problematic execute_sql RPC
      let categoriesWithCounts;
      try {
        // Get all category IDs for processing
        const categoryIds = (freshCategories || []).map((cat: any) => cat.id);
        
        if (categoryIds.length > 0) {
          // Use direct Supabase client instead of execute_sql RPC
          const { data: itemCounts, error: countError } = await supabase
            .from('menu_items')
            .select('category_id')
            .eq('is_active', true)
            .in('category_id', categoryIds);
          
          if (countError) {
            console.warn('Error getting item counts:', countError);
            throw countError;
          }
          
          // Count items per category
          const countMap = new Map();
          (itemCounts || []).forEach((item: any) => {
            const count = countMap.get(item.category_id) || 0;
            countMap.set(item.category_id, count + 1);
          });
          
          // Apply counts to categories
          categoriesWithCounts = (freshCategories || []).map((category: any) => ({
            ...category,
            item_count: countMap.get(category.id) || 0
          }));
        } else {
          // No categories, just use empty array
          categoriesWithCounts = [];
        }
      } catch (countError) {
        console.warn('Error getting item counts, using 0 for all:', countError);
        // Fallback: set all counts to 0
        categoriesWithCounts = (freshCategories || []).map((category: any) => ({
          ...category,
          item_count: 0
        }));
      }
      
      // OPTIMIZED: Batch state updates to reduce re-renders
      const expanded: Record<string, boolean> = {};
      categoriesWithCounts.forEach((cat: any) => {
        if (!cat.parent_category_id) {
          expanded[cat.id] = true;
        }
      });
      
      // Single state update instead of multiple
      setCategories(categoriesWithCounts);
      setExpandedCategories(expanded);
      
    } catch (error: any) {
      console.error('Error loading category data:', error);
      setError(error.message || 'Failed to load categories');
      toast.error('Failed to load category data');
    } finally {
      setLoading(false);
    }
  };
  
  // Trigger initial load on mount so Categories tab displays data
  useEffect(() => {
    loadCategoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Filter categories based on search and status
  const filteredCategories = categories.filter(category => {
    const matchesSearch = searchQuery === '' || 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = showActive === 'all' || 
      (showActive === 'active' && category.active) ||
      (showActive === 'inactive' && !category.active);
    
    return matchesSearch && matchesStatus;
  });
  
  // Get top-level categories for drag and drop
  const topLevelCategories = filteredCategories.filter(cat => !cat.parent_category_id);
  
  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setSelectedCategories([]); // Clear selections when dragging
    
    const item = categories.find(c => c.id === event.active.id);
    if (item) {
      setDraggedItem(item);
    }
  };
  
  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = topLevelCategories.findIndex((cat) => cat.id === active.id);
      const newIndex = topLevelCategories.findIndex((cat) => cat.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(topLevelCategories, oldIndex, newIndex);
        
        // Update display orders
        const updatedCategories = newOrder.map((cat, index) => ({
          ...cat,
          menu_order: index
        }));
        
        try {
          // Update database with new display orders
          const updates = updatedCategories.map((cat) => ({
            id: cat.id,
            menu_order: cat.menu_order
          }));
          
          const { error } = await supabase
            .from('menu_categories')
            .upsert(updates, { returning: 'minimal' });
          
          if (error) {
            throw new Error(error.message);
          }
          
          // Update local state
          setCategories(prevCategories => {
            return prevCategories.map(cat => {
              if (!cat.parent_category_id) {
                const updatedCat = updatedCategories.find(c => c.id === cat.id);
                return updatedCat || cat;
              }
              return cat;
            });
          });
          
          // Notify parent of changes
          onMenuChange?.();
          
          // Refresh data - use React Query invalidation
          await queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
          
          toast.success('Menu section order updated');
        } catch (error: any) {
          console.error('Error updating menu section order:', error);
          toast.error('Failed to update menu section order');
        }
      }
    }
    
    setActiveId(null);
    setDraggedItem(null);
  };
  
  // Helper to check if a category is a protein type
  const isProteinTypeCategory = (category: MenuCategory) => {
    return Boolean(category.is_protein_type);
  };

  // Toggle multi-select for categories
  const toggleMultiSelect = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Handle category selection for editing
  const handleSelectCategory = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      setEditForm({
        id: category.id,
        name: category.name,
        description: category.description || '',
        menu_order: (category as any).display_order || category.menu_order || 0,
        print_order: ((category as any).display_order || category.menu_order || 0),
        print_to_kitchen: category.print_to_kitchen || false,
        active: category.active,
        parent_category_id: category.parent_category_id || null,
        is_protein_type: category.is_protein_type || false
      });
      setSelectedCategoryId(categoryId);
      setIsEditDialogOpen(true);
    }
  };

  // Move category up or down in display order
  const moveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    setMoving(categoryId);
    try {
      const category = categories.find(cat => cat.id === categoryId);
      if (!category) return;

      const siblings = categories.filter(cat => 
        cat.parent_category_id === category.parent_category_id
      ).sort((a, b) => a.menu_order - b.menu_order);

      const currentIndex = siblings.findIndex(cat => cat.id === categoryId);
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex >= 0 && targetIndex < siblings.length) {
        const targetCategory = siblings[targetIndex];
        
        // Swap display orders
        await apiClient.save_category({
          id: category.id,
          name: category.name,
          description: category.description || '',
          display_order: targetCategory.display_order || targetCategory.menu_order || 0,
          print_to_kitchen: category.print_to_kitchen || false,
          active: category.active,
          parent_category_id: category.parent_category_id || null,
          is_protein_type: category.is_protein_type || false
        });
        
        await apiClient.save_category({
          id: targetCategory.id,
          name: targetCategory.name,
          description: targetCategory.description || '',
          display_order: category.display_order || category.menu_order || 0,
          print_to_kitchen: targetCategory.print_to_kitchen || false,
          active: targetCategory.active,
          parent_category_id: targetCategory.parent_category_id || null,
          is_protein_type: targetCategory.is_protein_type || false
        });
        
        await loadCategoryData();
        toast.success('Menu section order updated');
      }
    } catch (error) {
      console.error('Error moving menu section:', error);
      toast.error('Failed to update menu section order');
    } finally {
      setMoving(null);
    }
  };

  // Edit category function
  const editCategory = (category: MenuCategory) => {
    setEditForm({
      id: category.id,
      name: category.name,
      description: category.description || '',
      menu_order: category.menu_order,
      print_to_kitchen: category.print_to_kitchen || false,
      active: category.active,
      parent_category_id: category.parent_category_id || null,
      is_protein_type: category.is_protein_type || false
    });
    setSelectedCategoryId(category.id);
    setIsEditDialogOpen(true);
  };

  // Toggle active status
  const toggleActive = async (categoryId: string, active: boolean) => {
    try {
      const category = categories.find(cat => cat.id === categoryId);
      if (!category) return;

      await apiClient.save_category({
        id: category.id,
        name: category.name,
        description: category.description || '',
        display_order: category.display_order || category.menu_order || 0,
        print_to_kitchen: category.print_to_kitchen || false,
        active: active,
        parent_category_id: category.parent_category_id || null,
        is_protein_type: category.is_protein_type || false
      });
      
      await loadCategoryData();
      toast.success(`Menu section ${active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling menu section status:', error);
      toast.error('Failed to update menu section status');
    }
  };

  // Delete single category with enhanced safeguards
  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // First, check the category and get item count
      const checkResponse = await apiClient.check_category_delete({ categoryId });
      const checkData = await checkResponse.json();
      
      if (!checkData.can_delete) {
        toast.error(checkData.message);
        return;
      }
      
      // If category has items, show the enhanced delete dialog
      if (checkData.item_count > 0) {
        setDeleteDialogData({
          categoryId: checkData.category_id,
          categoryName: checkData.category_name,
          itemCount: checkData.item_count,
          items: checkData.items || []
        });
        setDeleteAction('reassign'); // Default to reassign
        setTargetCategoryId(''); // Reset target
        setDeleteDialogOpen(true);
      } else {
        // Category is empty, confirm simple delete
        if (confirm(`Delete empty category "${checkData.category_name}"?`)) {
          await executeDeleteCategory(categoryId, 'delete_all', null);
        }
      }
    } catch (error) {
      console.error('Error checking category for deletion:', error);
      toast.error('Failed to check category status');
    }
  };
  
  // Execute the actual delete operation
  const executeDeleteCategory = async (
    categoryId: string,
    action: 'reassign' | 'delete_all',
    targetCategoryId: string | null
  ) => {
    try {
      const response = await apiClient.safe_delete_category({
        category_id: categoryId,
        action: action,
        target_category_id: targetCategoryId
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadCategoryData();
        toast.success(result.message);
        setDeleteDialogOpen(false);
        setDeleteDialogData(null);
      } else {
        toast.error(result.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  // Handle delete dialog confirmation
  const handleConfirmDelete = (individualAssignments?: { [itemId: string]: { action: 'reassign' | 'delete'; targetCategoryId?: string } }) => {
    if (!deleteDialogData) return;
    
    // ROUTING LOGIC: If individual assignments provided, use the individual handler
    if (individualAssignments && Object.keys(individualAssignments).length > 0) {
      processIndividualItemAssignments(deleteDialogData.categoryId, individualAssignments);
      return;
    }
    
    // Otherwise, use existing bulk operation logic
    if (deleteAction === 'reassign' && !targetCategoryId) {
      toast.error('Please select a target category for reassignment');
      return;
    }
    
    // Execute the delete with chosen action
    executeDeleteCategory(
      deleteDialogData.categoryId,
      deleteAction,
      deleteAction === 'reassign' ? targetCategoryId : null
    );
  };

  // Create new category function
  const createNewCategory = () => {
    setEditForm({
      id: "",
      name: '',
      description: '',
      menu_order: categories.length,
      print_to_kitchen: true,
      active: true,
      parent_category_id: null,
      is_protein_type: false
    });
    setSelectedCategoryId(null);
    setIsCreateDialogOpen(true);
  };

  // Bulk operations
  const handleBulkToggleActive = async (active: boolean) => {
    if (selectedCategories.length === 0) return;
    
    try {
      for (const categoryId of selectedCategories) {
        await toggleActive(categoryId, active);
      }
      setSelectedCategories([]);
    } catch (error) {
      console.error('Error in bulk toggle:', error);
      toast.error('Failed to update menu sections');
    }
  };
  
  // Group categories into parent-child hierarchy
  const organizeCategories = () => {
    // Apply search and active filter to categories only
    const filteredCategories = categories.filter(cat => {
      const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesActiveFilter = showActive === 'all' || 
        (showActive === 'active' && cat.active) || 
        (showActive === 'inactive' && !cat.active);
      return matchesSearch && matchesActiveFilter && !cat.is_protein_type;
    });
    
    // First get the top level categories
    const topLevel = filteredCategories.filter(cat => !cat.parent_category_id);
    
    // Function to get children for a category
    const getChildren = (parentId: string) => {
      return filteredCategories.filter(cat => cat.parent_category_id === parentId)
        .sort((a, b) => a.menu_order - b.menu_order);
    };
    
    // Organize categories into a hierarchical structure
    const organizedCategories = topLevel.sort((a, b) => a.menu_order - b.menu_order)
      .map(parent => ({
        ...parent,
        children: getChildren(parent.id)
      }));
    
    return organizedCategories;
  };
  
  // Toggle expansion of a section
  const toggleSectionExpansion = (sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Toggle expansion of a parent category
  const toggleCategoryExpansion = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  
  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedCategories.length === 0) return;
    
    const selectedCategoryNames = categories
      .filter(c => selectedCategories.includes(c.id))
      .map(c => c.name);
    
    const confirmMessage = `Delete ${selectedCategories.length} menu sections?\n\n` +
      selectedCategoryNames.join(', ') + '\n\n' +
      'This action cannot be undone.';
    
    if (!confirm(confirmMessage)) return;
    
    setDeletingCategories(true);
    try {
      const response = await apiClient.bulk_delete_items_safe({
        item_ids: selectedCategories,
        // FIX: Use canonical type understood by backend
        item_type: 'categories'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete menu sections');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete menu sections');
      }
      
      // Use server message for clarity (e.g., which were blocked)
      toast.success(result.message || `${selectedCategories.length} menu sections deleted successfully`);
      setSelectedCategories([]);
      
      // Reload data
      await loadCategoryData();
      if (onMenuChange) onMenuChange();
      
    } catch (error: any) {
      console.error('Error deleting menu sections:', error);
      toast.error(error.message || 'Failed to delete menu sections');
    } finally {
      setDeletingCategories(false);
    }
  };
  
  // Handle saving category (create or update)
  const handleSaveCategory = async () => {
    console.log('[handleSaveCategory] Starting save with editForm:', JSON.stringify(editForm, null, 2));
    
    if (!editForm.name.trim()) {
      toast.error('Menu section name is required');
      return;
    }

    setSaving(true);
    try {
      const savePayload = {
        id: editForm.id,
        name: editForm.name,
        description: editForm.description || '',
        display_order: editForm.menu_order,
        print_order: editForm.print_order,
        print_to_kitchen: editForm.print_to_kitchen,
        active: editForm.active,
        parent_category_id: editForm.parent_category_id,
        is_protein_type: editForm.is_protein_type
      };
      
      const apiResponse = await apiClient.save_category(savePayload);
      
      const responseData = await apiResponse.json();

      toast.success(editForm.id ? 'Menu section updated successfully' : 'Menu section created successfully');
      
      // OPTIMIZED: Reset form and close dialogs immediately for better UX
      resetForm();
      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedCategoryId('');
      
      console.log('[handleSaveCategory] Starting delayed reload (300ms)...');
      // OPTIMIZED: Debounced reload to prevent rapid successive updates
      setTimeout(async () => {
        try {
          console.log('[handleSaveCategory] Executing loadCategoryData...');
          await loadCategoryData();
          console.log('[handleSaveCategory] loadCategoryData completed successfully');
          if (onMenuChange) {
            console.log('[handleSaveCategory] Calling onMenuChange callback');
            onMenuChange();
          }
        } catch (reloadError) {
          console.error('[handleSaveCategory] ❌ ERROR during reload:', reloadError);
          console.warn('Error reloading after save:', reloadError);
        }
      }, 300); // 300ms delay
      
    } catch (error: any) {
      console.error('[handleSaveCategory] ❌ FATAL ERROR during save:', error);
      toast.error(error.message || 'Failed to save menu section');
    } finally {
      setSaving(false);
    }
  };
  
  // Create New Category Dialog
  const CreateCategoryDialog = () => {
    // Define hardcoded parent categories with metadata (same as before)
    const HARDCODED_CATEGORIES = [
      { name: 'STARTERS', icon: '🥗', description: 'Appetizers and small plates', defaultOrder: 10, examples: ['Appetizers', 'Small Plates', 'Shared Dishes'] },
      { name: 'MAIN COURSE', icon: '🍛', description: 'Primary dishes and entrees', defaultOrder: 20, examples: ['Curry Dishes', 'Tandoori Specials', 'Chef Recommendations'] },
      { name: 'SIDE DISHES', icon: '🍚', description: 'Accompaniments and sides', defaultOrder: 30, examples: ['Rice & Bread', 'Vegetables', 'Lentils'] },
      { name: 'ACCOMPANIMENTS', icon: '🥄', description: 'Chutneys and condiments', defaultOrder: 40, examples: ['Chutneys', 'Pickles', 'Raita'] },
      { name: 'COFFEE & DESSERTS', icon: '☕', description: 'Sweet treats and beverages', defaultOrder: 50, examples: ['Sweet Treats', 'Hot Beverages', 'Traditional Desserts'] },
      { name: 'DRINKSS & WINE', icon: '🍷', description: 'Beverages and alcoholic drinks', defaultOrder: 60, examples: ['Beverages', 'Alcoholic Drinks', 'Mocktails'] },
      { name: 'SET MEALS', icon: '🍽️', description: 'Combination meals and portions', defaultOrder: 70, examples: ['Combination Meals', 'Family Portions', 'Value Sets'] }
    ];

    // Simple dialog state - no complex dependencies
    const [currentStep, setCurrentStep] = useState<'select' | 'form'>('select');
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      menu_order: 0,
      print_to_kitchen: true,
      active: true,
      parent_category_id: null as string | null,
      is_protein_type: false,
    });
    const [selectedParent, setSelectedParent] = useState<string | null>(null);
    const [isTopLevel, setIsTopLevel] = useState(false);

    // Reset when dialog opens
    const handleDialogOpenChange = (open: boolean) => {
      setIsCreateDialogOpen(open);
      if (open) {
        // Reset to initial state
        setCurrentStep('select');
        setSelectedParent(null);
        setIsTopLevel(false);
        setFormData({
          name: '',
          description: '',
          menu_order: nextMenuOrder,
          print_to_kitchen: true,
          active: true,
          parent_category_id: null,
          is_protein_type: false,
        });
      }
    };

    // Handle parent category selection
    const handleParentSelect = (categoryName: string | null) => {
      setSelectedParent(categoryName);
      setIsTopLevel(categoryName === null);
      
      // Set form defaults based on selection
      if (categoryName) {
        const categoryMeta = HARDCODED_CATEGORIES.find(c => c.name === categoryName);
        const matchingSection = FIXED_SECTIONS.find(section => section.name.toUpperCase() === categoryName.toUpperCase());
        
        console.log('🔍 [CREATE] Section mapping:', {
          selectedName: categoryName,
          matchingSection: matchingSection?.id,
          parentCategoryId: matchingSection ? `section-${matchingSection.id}` : null
        });
        
        setFormData({
          name: '',
          description: '',
          menu_order: categoryMeta?.defaultOrder || nextMenuOrder,
          print_to_kitchen: true,
          active: true,
          parent_category_id: matchingSection ? `section-${matchingSection.id}` : null,
          is_protein_type: false,
        });
      } else {
        setFormData({
          name: '',
          description: '',
          menu_order: nextMenuOrder,
          print_to_kitchen: true,
          active: true,
          parent_category_id: null,
          is_protein_type: false,
        });
      }
      
      setCurrentStep('form');
    };

    // Handle form submission
    const handleSubmit = async () => {
      if (!formData.name.trim()) return;
      
      setSaving(true);
      try {
        await apiClient.save_category({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          display_order: formData.menu_order,
          print_order: 0,
          print_to_kitchen: formData.print_to_kitchen,
          active: formData.active,
          parent_category_id: formData.parent_category_id,
          is_protein_type: formData.is_protein_type
        });

        toast.success('Category created successfully');
        setIsCreateDialogOpen(false);
        await loadCategoryData();
        if (onMenuChange) onMenuChange();
        
      } catch (error: any) {
        console.error('Error creating category:', error);
        toast.error(error.message || 'Failed to create category');
      } finally {
        setSaving(false);
      }
    };

    const selectedCategoryMeta = selectedParent ? 
      HARDCODED_CATEGORIES.find(c => c.name === selectedParent) : null;

    return (
      <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="bg-[#1E1E1E] backdrop-blur-md border-2 border-[#7C5DFA]/20 text-white max-w-2xl shadow-2xl">
          <DialogHeader className="border-b border-[#7C5DFA]/10 pb-4">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              ✨ Create New Category
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {currentStep === 'select' ? 'Choose the section where you want to create a category.' : 
               `Creating a ${isTopLevel ? 'new main' : selectedParent} category.`}
            </DialogDescription>
          </DialogHeader>
          
          {currentStep === 'select' ? (
            // Step 1: Section Selection
            <div className="space-y-6 pt-2">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  🏷️ Choose Section
                </h3>
                
                {/* Dropdown Interface */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-white font-medium mb-1 block text-sm">Choose section or create new main section</Label>
                    <CustomDropdown
                      value={selectedParent || "top-level"}
                      onValueChange={(value) => {
                        const parentName = value === "top-level" ? null : value;
                        handleParentSelect(parentName);
                      }}
                      placeholder="Choose section or create new main section"
                      options={[
                        {
                          value: "top-level",
                          label: "Create New Category/Sub-Category",
                          description: "Create a new category or sub-category",
                          className: "bg-[#7C5DFA]/10 border-l-4 border-l-[#7C5DFA]"
                        },
                        ...HARDCODED_CATEGORIES.map((category) => {
                          const existingCategory = categories.find(cat => cat.name.toUpperCase() === category.name.toUpperCase());
                          return {
                            value: category.name,
                            label: `${category.icon} ${category.name}${existingCategory ? ' (Exists)' : ''}`,
                            description: category.description,
                            className: existingCategory ? "bg-emerald-500/10 border-l-4 border-l-emerald-500" : ""
                          };
                        })
                      ]}
                      triggerClassName="h-14 bg-[#222222] border-[#7C5DFA]/30 hover:border-[#7C5DFA]/50 focus:border-[#7C5DFA]"
                      contentClassName="bg-[#1E1E1E] border-[#7C5DFA]/30 shadow-2xl"
                    />
                  </div>
                  
                  {/* Contextual Help */}
                  {selectedParent && (
                    <div className="mt-4 p-4 bg-[#222222] rounded-xl border border-[#7C5DFA]/30 transition-all duration-300">
                      {(() => {
                        const categoryMeta = HARDCODED_CATEGORIES.find(c => c.name === selectedParent);
                        return categoryMeta ? (
                          <div>
                            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                              <span className="text-[#7C5DFA]">📋</span>
                              Category Examples for {selectedParent}:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {categoryMeta.examples.map((example, idx) => (
                                <span key={idx} className="text-xs px-3 py-1.5 bg-[#7C5DFA]/20 text-gray-300 rounded-lg border border-[#7C5DFA]/20 hover:border-[#7C5DFA]/40 transition-all duration-200">
                                  {example}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()} 
                    </div>
                  )}
                  
                  {isTopLevel && (
                    <div className="mt-4 p-4 bg-[#222222] rounded-xl border border-[#7C5DFA]/30 transition-all duration-300">
                      <div className="flex items-center gap-3 text-[#7C5DFA]">
                        <span className="text-lg">💡</span>
                        <div>
                          <span className="text-sm font-medium">
                            Creating a new category or sub-category
                          </span>
                          <p className="text-xs text-[#7C5DFA]/80 mt-1">
                            This will be added to the selected section
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Step 2: Form with QSAI styling
            <div className="space-y-6 pt-2">
              {/* Context Information */}
              {selectedCategoryMeta && (
                <div className="flex items-center space-x-3 p-4 bg-[#222222] rounded-xl border border-[#7C5DFA]/60">
                  <div className="text-2xl">{selectedCategoryMeta.icon}</div>
                  <div>
                    <h4 className="font-medium text-white flex items-center gap-2">
                      Creating category under 
                      <span className="text-[#7C5DFA] font-semibold">{selectedParent}</span>
                    </h4>
                    <p className="text-sm text-gray-300 mt-1">{selectedCategoryMeta.description}</p>
                  </div>
                </div>
              )}
              
              {isTopLevel && (
                <div className="flex items-center space-x-3 p-4 bg-[#222221] rounded-xl border border-amber-500/30">
                  <div className="text-2xl">🏷️</div>
                  <div>
                    <h4 className="font-medium text-white">Creating new category or sub-category</h4>
                    <p className="text-sm text-amber-200/80 mt-1">This will be added to the selected section</p>
                  </div>
                </div>
              )}
              
              {/* Form Fields */}
              <div className="space-y-5">
                <div>
                  <Label htmlFor="categoryName" className="text-white font-medium mb-2 block">Category Name *</Label>
                  <Input
                    id="categoryName"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter category name"
                    className="bg-[#222222] border-[#7C5DFA]/40 text-white placeholder-gray-400 focus:border-[#7C5DFA] transition-all duration-300 h-12"
                  />
                </div>
                
                <div>
                  <Label htmlFor="categoryDescription" className="text-white font-medium mb-2 block">Description</Label>
                  <Input
                    id="categoryDescription"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Optional description"
                    className="bg-[#222222] border-[#7C5DFA]/40 text-white placeholder-gray-400 focus:border-[#7C5DFA] transition-all duration-300 h-12"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="menuOrder" className="text-white font-medium mb-2 block">Menu Order</Label>
                    <OrderNumberInput
                      value={formData.menu_order || 0}
                      onChange={(value) => setFormData({...formData, menu_order: value})}
                      placeholder="Select menu order..."
                      helpText="Single ordering value for consistent display across POS and receipts (lower numbers appear first)"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="printOrder" className="text-white font-medium mb-2 block">Print Order</Label>
                    <OrderNumberInput
                      value={formData.print_order || 0}
                      onChange={(value) => setFormData({...formData, print_order: value})}
                      placeholder="Select print order..."
                      helpText="Controls the order in which this category appears on printed receipts and kitchen orders"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="menuOrder" className="text-white font-medium mb-2 block">Menu Order</Label>
                    <OrderNumberInput
                      value={formData.menu_order || 0}
                      onChange={(value) => setFormData({...formData, menu_order: value})}
                      placeholder="Select menu order..."
                      helpText="Single ordering value for consistent display across POS and receipts (lower numbers appear first)"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-[#222222] border border-[#7C5DFA]/20">
                  <Checkbox
                    id="printToKitchen"
                    checked={formData.print_to_kitchen}
                    onCheckedChange={(checked) => setFormData({...formData, print_to_kitchen: !!checked})}
                    className="border-[#7C5DFA]/40 data-[state=checked]:bg-[#7C5DFA] data-[state=checked]:border-[#7C5DFA]"
                  />
                  <Label htmlFor="printToKitchen" className="text-white font-medium cursor-pointer">Print to Kitchen</Label>
                </div>
              </div>
              
              {/* Premium Form Actions */}
              <div className="flex gap-3 pt-6 border-t border-[#7C5DFA]/20">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('select')}
                  className="border-[#7C5DFA]/40 text-white hover:bg-[#7C5DFA]/20 hover:border-[#7C5DFA]/60 transition-all duration-300"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.name.trim() || saving}
                  className="flex-1 bg-[#7C5DFA] hover:bg-[#6B4CE6] text-white disabled:opacity-50 shadow-lg shadow-[#7C5DFA]/25 hover:shadow-[0_0_20px_rgba(124,F1,250,0.4)] transition-all duration-300 font-medium"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    <><span className="mr-2">✨</span>Create Section</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="border-[#7C5DFA]/40 text-white hover:bg-[#7C5DFA]/20 hover:border-[#7C5DFA]/60 transition-all duration-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };
  
  // Preview modal state management
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewCategoryId, setPreviewCategoryId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Function to open preview modal
  const openPreviewModal = (categoryId: string) => {
    setPreviewCategoryId(categoryId);
    setPreviewModalOpen(true);
  };
  
  // QuickPreviewModal component
  const QuickPreviewModal = () => {
    const category = categories.find(c => c.id === previewCategoryId);
    if (!category) return null;
    
    return (
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="bg-[#1E1E1E] backdrop-blur-md border-2 border-[#7C5DFA]/20 text-white max-w-2xl shadow-2xl">
          <DialogHeader className="border-b border-[#7C5DFA]/10 pb-4">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              ✨ Preview Category
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {category.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="preview_name" className="text-white">Category Name *</Label>
              <Input
                id="preview_name"
                value={category.name}
                readOnly
                className="bg-[#222222] border-[#7C5DFA]/40 text-white placeholder-gray-400 focus:border-[#7C5DFA] transition-all duration-300 h-12"
              />
            </div>
            
            <div>
              <Label htmlFor="preview_description" className="text-white">Description</Label>
              <Textarea
                id="preview_description"
                value={category.description || ''}
                readOnly
                className="bg-[#222222] border-[#7C5DFA]/40 text-white placeholder-gray-400 focus:border-[#7C5DFA] transition-all duration-300"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preview_menu_order" className="text-white">Menu Order</Label>
                <Input
                  id="preview_menu_order"
                  type="number"
                  value={category.menu_order}
                  readOnly
                  className="bg-[#222222] border-[#7C5DFA]/40 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="preview_print_order" className="text-white">Print Order</Label>
                <Input
                  id="preview_print_order"
                  type="number"
                  value={category.print_order}
                  readOnly
                  className="bg-[#222222] border-[#7C5DFA]/40 text-white"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="preview_print_to_kitchen"
                  checked={category.print_to_kitchen}
                  className="border-[#7C5DFA]/40 data-[state=checked]:bg-[#7C5DFA] data-[state=checked]:border-[#7C5DFA]"
                />
                <Label htmlFor="preview_print_to_kitchen" className="text-white">Print to Kitchen</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="preview_is_protein_type"
                  checked={category.is_protein_type}
                  className="border-[#7C5DFA]/60 data-[state=checked]:bg-[#7C5DFA] data-[state=checked]:border-[#7C5DFA]"
                />
                <Label htmlFor="preview_is_protein_type" className="text-white">Protein Type Category</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="preview_active"
                  checked={category.active}
                  className="border-[#7C5DFA]/40 data-[state=checked]:bg-[#7C5DFA] data-[state=checked]:border-[#7C5DFA]"
                />
                <Label htmlFor="preview_active" className="text-white">Active</Label>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => {
                  setPreviewModalOpen(false);
                  setPreviewCategoryId(null);
                }}
                className="flex-1 bg-[#7C5DFA] hover:bg-[#6B4CE6] text-white"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  
  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-[#7C5DFA]" />
          <p className="text-white">Loading categories...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="bg-red-600/20 border-red-500/30">
          <CardContent className="p-6 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={loadCategoryData} className="bg-red-600 hover:bg-red-700 text-white">
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with unified styling */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Menu Categories</h2>
        <div className="flex gap-2">
          {/* Create button with refined solid purple design */}
          <AdminButton
            variant="primary"
            size="sm"
            onClick={() => {
              setIsCreateDialogOpen(true);
            }}
            className="bg-[#7C5DFA] hover:bg-[#6B4CE6] text-white border-0 transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-xl"
          >
            <Plus className="h-4 w-4" />
            Create Category
          </AdminButton>
        </div>
      </div>

      {/* Search and filters with unified styling */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1A1A1A] border-[rgba(124,93,250,0.2)] text-white placeholder:text-gray-400 focus:border-[#7C5DFA] focus:ring-1 focus:ring-[#7C5DFA]/20"
          />
        </div>
        
        <CustomDropdown
          value={showActive}
          onValueChange={(value: any) => setShowActive(value)}
          placeholder="All Categories"
          options={[
            { value: "all", label: "All Categories" },
            { value: "active", label: "Active Only" },
            { value: "inactive", label: "Inactive Only" }
          ]}
          triggerClassName="w-40 bg-[#1A1A1A] border-[rgba(124,93,250,0.2)] text-white hover:border-[#7C5DFA]"
          contentClassName="bg-[#1A1A1A] border-[rgba(124,93,250,0.3)] backdrop-blur-xl"
        />
        
        {selectedCategories.length > 0 && (
          <AdminButton
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={deletingCategories}
            loading={deletingCategories}
            loadingText="Deleting..."
          >
            <Trash2 className="h-4 w-4" />
            Delete ({selectedCategories.length})
          </AdminButton>
        )}
      </div>

      {/* Categories List with unified styling */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C5DFA]" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="bg-[#1A1A1A] border border-red-500/30 rounded-lg p-8">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <AdminButton
              variant="secondary"
              size="sm"
              onClick={loadCategoryData}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </AdminButton>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <CategorySectionView
            sections={organizeCategoriesBySection(
              categories.filter(cat => !cat.is_protein_type),
              searchQuery,
              showActive === 'all' ? null : (showActive === 'active')
            )}
            selectedCategories={selectedCategories}
            expandedSections={expandedSections}
            onToggleSection={toggleSectionExpansion}
            onToggleMultiSelect={toggleMultiSelect}
            onSelectCategory={handleSelectCategory}
            onToggleActive={toggleActive}
            onDeleteCategory={handleDeleteCategory}
          />

          {(() => {
            const organizedCategories = organizeCategories();
            return organizedCategories.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-[#1A1A1A] border border-[rgba(124,93,250,0.2)] rounded-lg p-8">
                  <Hash className="h-12 w-12 text-[#7C5DFA] mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">
                    {searchQuery || showActive !== 'all' 
                      ? 'No categories match your filters' 
                      : 'No categories created yet'
                    }
                  </p>
                  {(!searchQuery && showActive === 'all') && (
                    <AdminButton
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setEditForm({
                          id: '',
                          name: '',
                          description: '',
                          menu_order: 0,
                          print_to_kitchen: true,
                          active: true,
                          parent_category_id: null,
                          is_protein_type: false
                        });
                        setIsCreateDialogOpen(true);
                      }}
                      glow
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Category
                    </AdminButton>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Create and Edit Dialog Dialog */}
      <CreateCategoryDialog />
      <EditCategoryDialogEnhanced 
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editForm={editForm}
        setEditForm={setEditForm}
        onSave={handleSaveCategory}
        onCancel={() => {
          setIsEditDialogOpen(false);
          setSelectedCategoryId(null);
          resetForm();
        }}
      />
      
      {/* Delete Category Dialog with Enhanced Safeguards */}
      <DeleteCategoryDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        categoryData={deleteDialogData}
        deleteAction={deleteAction}
        setDeleteAction={setDeleteAction}
        targetCategoryId={targetCategoryId}
        setTargetCategoryId={setTargetCategoryId}
        availableCategories={categories}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setDeleteDialogData(null);
        }}
      />
      
      {/* Preview modal */}
      <QuickPreviewModal />
    </div>
  );
};

export default CategoryManagement;
