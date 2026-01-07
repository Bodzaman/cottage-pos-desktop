import React from 'react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import { FIXED_SECTIONS, type SectionId, getSectionById } from 'utils/sectionMapping';
import { SectionChangeWarningDialog } from './SectionChangeWarningDialog';

/**
 * EditCategoryDialogEnhanced Component
 * 
 * Enhanced category editor with section change capabilities and impact analysis.
 * 
 * CRITICAL: This component implements the Section Mapping Pattern (MYA-947).
 * See utils/sectionMapping.ts for full documentation on how section assignment works.
 * 
 * Features:
 * - Direct section assignment for categories without a current section
 * - Impact analysis and warning dialog for section changes affecting items/subcategories
 * - Follows the pattern: parent_category_id = "section-{sectionId}" (e.g., "section-starters")
 * 
 * @see CategoryForm for the create flow implementation
 * @see utils/sectionMapping.ts for the canonical section mapping pattern
 */

interface EditCategoryDialogEnhancedProps {
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

export const EditCategoryDialogEnhanced = React.memo(({
  open,
  onOpenChange,
  editForm,
  setEditForm,
  onSave,
  onCancel
}: EditCategoryDialogEnhancedProps) => {
  // Section change state
  const [selectedNewSection, setSelectedNewSection] = React.useState<SectionId | null>(null);
  const [showSectionWarning, setShowSectionWarning] = React.useState(false);
  const [sectionChangeImpact, setSectionChangeImpact] = React.useState<any>(null);

  // Get current section from parent_category_id
  const currentSectionId = editForm.parent_category_id?.replace('section-', '') as SectionId | undefined;
  const currentSection = currentSectionId ? getSectionById(currentSectionId) : null;

  // Handle section change selection
  const handleSectionChange = async (newSectionId: string) => {
    if (newSectionId === 'none' || newSectionId === currentSectionId) {
      setSelectedNewSection(null);
      return;
    }

    try {
      // Analyze impact
      const response = await apiClient.analyze_section_change_impact({
        category_id: editForm.id,
        new_section_id: newSectionId
      });
      const data = await response.json();

      if (data.success) {
        setSectionChangeImpact(data.impact);
        setSelectedNewSection(newSectionId as SectionId);
        setShowSectionWarning(true);
      }
    } catch (error) {
      console.error('Failed to analyze section change:', error);
      toast.error('Failed to analyze section change impact');
    }
  };

  // Handle section change confirmation
  const handleConfirmSectionChange = async () => {
    if (!selectedNewSection) return;

    try {
      const response = await apiClient.move_category_section({
        category_id: editForm.id,
        new_section_id: selectedNewSection
      });
      const data = await response.json();

      if (data.success) {
        // Update local state to show the change immediately
        setEditForm(prev => ({
          ...prev,
          parent_category_id: `section-${selectedNewSection}`
        }));

        toast.success(
          `Category moved to ${getSectionById(selectedNewSection)?.displayName}`,
          {
            description: `${data.items_affected} items and ${data.subcategories_affected} subcategories updated`
          }
        );

        setShowSectionWarning(false);
        setSelectedNewSection(null);
      } else {
        toast.error(data.error || 'Failed to move category');
      }
    } catch (error) {
      console.error('Failed to move category:', error);
      toast.error('Failed to move category section');
    }
  };

  // Handle simple section assignment (for categories without current section)
  const handleAssignSection = async (newSectionId: string) => {
    if (newSectionId === 'none') {
      return;
    }

    // If no current section, assign directly without warning
    if (!currentSection) {
      setEditForm(prev => ({
        ...prev,
        parent_category_id: `section-${newSectionId}`
      }));
      toast.info(`Section selected: ${getSectionById(newSectionId as SectionId)?.displayName}. Click 'Update Category' to save.`);
      return;
    }

    // Otherwise, trigger the impact analysis and warning flow
    await handleSectionChange(newSectionId);
  };

  // Don't render if editForm is not ready
  if (!editForm || !editForm.id) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-black/90 backdrop-blur-sm border-[#7C5DFA]/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Category: {editForm.name}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Modify the category details and settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Section Display */}
            {currentSection && (
              <div className="p-3 rounded-lg bg-[#7C5DFA]/10 border border-[#7C5DFA]/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-300">📍 Current Section:</span>
                  <Badge className="bg-[#7C5DFA] text-white shadow-lg shadow-[#7C5DFA]/50">
                    {currentSection.icon} {currentSection.displayName}
                  </Badge>
                </div>
              </div>
            )}

            {/* Section Change Dropdown */}
            {!editForm.is_protein_type && (
              <div>
                <Label htmlFor="section_change" className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  {currentSection ? 'Change Section' : 'Assign Section'}
                </Label>
                <Select onValueChange={handleAssignSection}>
                  <SelectTrigger className="bg-black/50 border-yellow-500/50 text-white hover:border-yellow-500 transition-colors">
                    <SelectValue placeholder={currentSection ? "Select new section..." : "Select section..."} />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-[#7C5DFA]/30 text-white">
                    <SelectItem value="none">{currentSection ? "Select new section..." : "Select section..."}</SelectItem>
                    {FIXED_SECTIONS.filter(s => s.id !== currentSectionId).map(section => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.icon} {section.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 mt-1">
                  {currentSection 
                    ? 'Moving this category will update all items and subcategories'
                    : 'Assigning a section will help organize this category in your menu'
                  }
                </p>
              </div>
            )}

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

      {/* Section Change Warning Dialog */}
      {showSectionWarning && sectionChangeImpact && selectedNewSection && (
        <SectionChangeWarningDialog
          open={showSectionWarning}
          onOpenChange={setShowSectionWarning}
          categoryName={editForm.name}
          currentSection={currentSection?.displayName || 'None'}
          newSection={getSectionById(selectedNewSection)?.displayName || ''}
          itemsAffected={sectionChangeImpact.items_affected}
          subcategoriesAffected={sectionChangeImpact.subcategories_affected}
          onConfirm={handleConfirmSectionChange}
          onCancel={() => {
            setShowSectionWarning(false);
            setSelectedNewSection(null);
          }}
        />
      )}
    </>
  );
});

EditCategoryDialogEnhanced.displayName = 'EditCategoryDialogEnhanced';
