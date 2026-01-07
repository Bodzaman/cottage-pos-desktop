import React from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Category } from '../utils/menuTypes';

interface ExtendedMenuCategory extends Category {
  children?: ExtendedMenuCategory[];
  item_count?: number;
}

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryData: {
    categoryId: string;
    categoryName: string;
    itemCount: number;
    items: any[];
  } | null;
  deleteAction: 'reassign' | 'delete_all';
  setDeleteAction: (action: 'reassign' | 'delete_all') => void;
  targetCategoryId: string;
  setTargetCategoryId: (id: string) => void;
  availableCategories: ExtendedMenuCategory[];
  onConfirm: (individualAssignments?: { [itemId: string]: { action: 'reassign' | 'delete'; targetCategoryId?: string } }) => void;
  onCancel: () => void;
}

export const DeleteCategoryDialog = React.memo(({
  open,
  onOpenChange,
  categoryData,
  deleteAction,
  setDeleteAction,
  targetCategoryId,
  setTargetCategoryId,
  availableCategories,
  onConfirm,
  onCancel
}: DeleteCategoryDialogProps) => {
  // State for individual item control
  const [showIndividualControl, setShowIndividualControl] = React.useState(false);
  const [individualAssignments, setIndividualAssignments] = React.useState<{
    [itemId: string]: { action: 'reassign' | 'delete'; targetCategoryId?: string }
  }>({});
  
  if (!categoryData) return null;
  
  // Filter out the category being deleted from available targets
  const targetOptions = availableCategories.filter(
    cat => cat.id !== categoryData.categoryId && !cat.is_protein_type
  );
  
  // Handle individual item action change
  const handleIndividualAction = (itemId: string, action: 'reassign' | 'delete', targetCategoryId?: string) => {
    setIndividualAssignments(prev => ({
      ...prev,
      [itemId]: { action, targetCategoryId }
    }));
  };
  
  // Handle confirm with individual assignments if applicable
  const handleConfirmClick = () => {
    if (showIndividualControl && Object.keys(individualAssignments).length > 0) {
      // Pass individual assignments to parent
      onConfirm(individualAssignments);
    } else {
      onConfirm();
    }
  };
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-black/95 backdrop-blur-sm border-red-500/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white text-2xl flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-500" />
            Delete Category: {categoryData.categoryName}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300 text-base">
            ⚠️ This category contains <strong className="text-yellow-400">{categoryData.itemCount} menu item(s)</strong>.
            <br />Choose how to proceed:
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Show sample items */}
          {categoryData.items && categoryData.items.length > 0 && (
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
              <p className="text-sm text-gray-400 mb-2">Items in this category (showing up to 10):</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {categoryData.items.slice(0, 10).map((item: any) => (
                  <div key={item.id} className="text-sm text-gray-300 flex justify-between">
                    <span>• {item.name}</span>
                    <span className="text-gray-500">£{item.base_price?.toFixed(2) || '0.00'}</span>
                  </div>
                ))}
                {categoryData.itemCount > 10 && (
                  <p className="text-xs text-gray-500 italic pt-2">...and {categoryData.itemCount - 10} more</p>
                )}
              </div>
            </div>
          )}
          
          {/* Action selection - only show if individual control is not active */}
          {!showIndividualControl && (
            <div className="space-y-3">
              <Label className="text-white text-base font-semibold">Choose an action:</Label>
              
              {/* Option A: Reassign */}
              <div 
                onClick={() => setDeleteAction('reassign')}
                className={cn(
                  "border rounded-lg p-4 cursor-pointer transition-all",
                  deleteAction === 'reassign' 
                    ? "border-blue-500 bg-blue-500/10" 
                    : "border-gray-600 hover:border-gray-500"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                    deleteAction === 'reassign' ? "border-blue-500" : "border-gray-500"
                  )}>
                    {deleteAction === 'reassign' && (
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Option A: Reassign ALL items to another category</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Move all {categoryData.itemCount} item(s) to a different category before deleting
                    </p>
                    {deleteAction === 'reassign' && (
                      <div className="mt-3">
                        <Label className="text-sm text-gray-300 mb-2 block">Select target category:</Label>
                        <select
                          value={targetCategoryId}
                          onChange={(e) => setTargetCategoryId(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">-- Select a category --</option>
                          {targetOptions.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name} {cat.item_count ? `(${cat.item_count} items)` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Option B: Delete All */}
              <div 
                onClick={() => setDeleteAction('delete_all')}
                className={cn(
                  "border rounded-lg p-4 cursor-pointer transition-all",
                  deleteAction === 'delete_all' 
                    ? "border-red-500 bg-red-500/10" 
                    : "border-gray-600 hover:border-gray-500"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                    deleteAction === 'delete_all' ? "border-red-500" : "border-gray-500"
                  )}>
                    {deleteAction === 'delete_all' && (
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium flex items-center gap-2">
                      Option B: Delete category AND all items
                      <Badge variant="destructive" className="text-xs">Permanent</Badge>
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      ⚠️ This will permanently delete the category and all {categoryData.itemCount} item(s)
                    </p>
                    {deleteAction === 'delete_all' && (
                      <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded">
                        <p className="text-xs text-red-300">
                          💀 <strong>WARNING:</strong> This action cannot be undone. All menu items will be permanently deleted.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Progressive Disclosure: Individual Item Control */}
          <div className="border-t border-gray-700 pt-4 mt-4">
            <Button
              type="button"
              variant="ghost"
              className="w-full text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 flex items-center justify-center gap-2"
              onClick={() => setShowIndividualControl(!showIndividualControl)}
            >
              {showIndividualControl ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Or customize each item individually
            </Button>
            
            {showIndividualControl && categoryData.items && categoryData.items.length > 0 && (
              <div className="mt-4 space-y-2 border border-blue-500/30 rounded-lg p-4 bg-blue-500/5">
                <p className="text-sm text-gray-400 mb-3">
                  Choose what to do with each item individually:
                </p>
                
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {categoryData.items.map((item: any) => {
                    const assignment = individualAssignments[item.id];
                    const currentAction = assignment?.action || 'reassign';
                    const currentTargetId = assignment?.targetCategoryId || '';
                    
                    return (
                      <div 
                        key={item.id} 
                        className="border border-gray-700 rounded-lg p-3 bg-gray-900/50 hover:bg-gray-900/70 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            checked={!!assignment}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleIndividualAction(item.id, 'reassign', targetOptions[0]?.id);
                              } else {
                                setIndividualAssignments(prev => {
                                  const newAssignments = { ...prev };
                                  delete newAssignments[item.id];
                                  return newAssignments;
                                });
                              }
                            }}
                            className="mt-1"
                          />
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-white font-medium">{item.name}</span>
                              <span className="text-gray-500 text-sm">£{item.base_price?.toFixed(2) || '0.00'}</span>
                            </div>
                            
                            {assignment && (
                              <div className="flex items-center gap-2">
                                <select
                                  value={currentAction}
                                  onChange={(e) => {
                                    const newAction = e.target.value as 'reassign' | 'delete';
                                    if (newAction === 'delete') {
                                      handleIndividualAction(item.id, 'delete');
                                    } else {
                                      handleIndividualAction(item.id, 'reassign', currentTargetId || targetOptions[0]?.id);
                                    }
                                  }}
                                  className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:border-blue-500"
                                >
                                  <option value="reassign">→ Move to</option>
                                  <option value="delete">🗑️ Delete</option>
                                </select>
                                
                                {currentAction === 'reassign' && (
                                  <select
                                    value={currentTargetId}
                                    onChange={(e) => handleIndividualAction(item.id, 'reassign', e.target.value)}
                                    className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:border-blue-500"
                                  >
                                    <option value="">-- Select category --</option>
                                    {targetOptions.map(cat => (
                                      <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                      </option>
                                    ))}
                                  </select>
                                )}
                                
                                {currentAction === 'delete' && (
                                  <div className="flex-1 flex items-center gap-2 text-red-400 text-sm">
                                    <Trash2 className="h-3 w-3" />
                                    <span>Will be deleted</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {Object.keys(individualAssignments).length > 0 && (
                  <div className="mt-3 p-2 bg-blue-900/20 border border-blue-500/30 rounded text-xs text-blue-300">
                    ✓ {Object.keys(individualAssignments).length} item(s) configured individually
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onCancel}
            className="border-gray-600 text-white hover:bg-gray-800"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmClick}
            disabled={!showIndividualControl && deleteAction === 'reassign' && !targetCategoryId}
            className={cn(
              "text-white",
              showIndividualControl && Object.keys(individualAssignments).length > 0
                ? "bg-purple-600 hover:bg-purple-700"
                : deleteAction === 'reassign' 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "bg-red-600 hover:bg-red-700",
              !showIndividualControl && deleteAction === 'reassign' && !targetCategoryId && "opacity-50 cursor-not-allowed"
            )}
          >
            {showIndividualControl && Object.keys(individualAssignments).length > 0 ? (
              <>Apply Custom Changes & Delete Category</>
            ) : deleteAction === 'reassign' ? (
              <>Reassign & Delete Category</>
            ) : (
              <>Delete Category & All Items</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

DeleteCategoryDialog.displayName = 'DeleteCategoryDialog';
