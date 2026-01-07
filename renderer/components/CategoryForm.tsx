import { useState, Fragment, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AdminInput } from '../components/AdminInput';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { supabase } from '../utils/supabaseClient';
import { useCategories, menuKeys } from '../utils/menuQueries';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtimeMenuStore } from '../utils/realtimeMenuStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Category } from '../utils/menuTypes';
import { Info, AlertTriangle, Printer, HelpCircle } from "lucide-react";
import { useMountedRef, useSafeTimeout } from 'utils/safeHooks';
import { OrderNumberInput } from 'components/OrderNumberInput';
import { FIXED_SECTIONS, type SectionId, getSectionById } from 'utils/sectionMapping';
import { SectionChangeWarningDialog } from './SectionChangeWarningDialog';

/**
 * CategoryForm Component
 * 
 * Handles creation and editing of menu categories with proper section assignment.
 * 
 * CRITICAL: This component implements the Section Mapping Pattern (MYA-947).
 * See utils/sectionMapping.ts for full documentation on how section assignment works.
 * 
 * Key Pattern:
 * - Main categories: parent_category_id = "section-{sectionId}" (e.g., "section-starters")
 * - Subcategories: parent_category_id = {parentCategoryId} (UUID)
 * 
 * @param onSuccess - Callback function to execute after successful save
 * @param initialData - Optional initial data for editing existing categories
 * @param isEditing - Flag indicating if this is an edit operation
 */

// Schema for category form validation
const categorySchema = z.object({
  name: z.string().min(2, { message: 'Category name must be at least 2 characters' }),
  description: z.string().optional(),
  menu_order: z.coerce.number().int().nonnegative().default(0),
  print_order: z.coerce.number().int().nonnegative().default(0),
  print_to_kitchen: z.boolean().default(true),
  active: z.boolean().default(true),
  category_type: z.enum(['main', 'sub']).default('main'),
  section_id: z.string().optional(), // Section for main categories
  parent_category_id: z.string().nullable().optional(), // Parent for subcategories
});

type CategoryFormValues = z.infer<typeof categorySchema>;

// Helper function to determine if a category is a main category or subcategory
const determineCategoryType = (parent_category_id: string | null | undefined): 'main' | 'sub' => {
  // If parent_category_id starts with "section-", it's a main category under a section
  if (parent_category_id?.startsWith('section-')) {
    return 'main';
  }
  // If parent_category_id is null, it's a main category without a section (legacy)
  // If parent_category_id is a UUID, it's a subcategory
  return parent_category_id ? 'sub' : 'main';
};

// Helper to extract section ID from parent_category_id like "section-starters" -> "starters"
const extractSectionId = (parent_category_id: string | null | undefined): string | undefined => {
  if (parent_category_id?.startsWith('section-')) {
    return parent_category_id.replace('section-', '');
  }
  return undefined;
};

interface CategoryFormProps {
  onSuccess: () => void;
  initialData?: CategoryFormValues & { id?: string, parent_category_id?: string | null };
  isEditing?: boolean;
}

export default function CategoryForm({ onSuccess, initialData, isEditing = false }: CategoryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const mountedRef = useMountedRef();
  const { setSafeTimeout, clearSafeTimeout } = useSafeTimeout();
  
  // Section change state
  const [selectedNewSection, setSelectedNewSection] = useState<string | null>(null);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [impactData, setImpactData] = useState<{
    oldSectionName: string | null;
    newSectionName: string;
    itemsAffected: number;
    subcategoriesAffected: number;
  } | null>(null);
  const [isSectionChangeLoading, setIsSectionChangeLoading] = useState(false);
  
  // React Query: Fetch categories with auto-refresh and loading states
  const { data: categoriesData = [], isLoading } = useCategories({ enabled: isOpen });
  
  // React Query: Query client for manual cache invalidation
  const queryClient = useQueryClient();
  
  // Real-time store for POS synchronization
  const realtimeMenuStore = useRealtimeMenuStore();
  
  // Filter categories for parent dropdown (exclude self when editing)
  const categories = isEditing && initialData?.id
    ? categoriesData.filter(cat => cat.id !== initialData.id)
    : categoriesData;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData ? {
      ...initialData,
      category_type: determineCategoryType(initialData.parent_category_id),
      section_id: extractSectionId(initialData.parent_category_id),
      menu_order: initialData.display_order || 0,
      print_order: initialData.print_order || 0,
    } : {
      name: '',
      description: '',
      menu_order: 0,
      print_order: 0,
      print_to_kitchen: true,
      active: true,
      category_type: 'main',
      section_id: undefined,
      parent_category_id: null,
    }
  });
  
  // Watch the category_type field to show/hide parent dropdown
  const categoryType = form.watch('category_type');

  // Effect to handle category type changes
  useEffect(() => {
    // If main category is selected, clear the parent_category_id
    if (categoryType === 'main') {
      form.setValue('parent_category_id', null);
    }
    // If subcategory is selected, clear the section_id
    if (categoryType === 'sub') {
      form.setValue('section_id', undefined);
    }
  }, [categoryType, form]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      clearSafeTimeout();
    };
  }, [clearSafeTimeout]);

  // Handler for section change selection
  const handleSectionChangeSelect = async (newSectionId: string) => {
    if (!isEditing || !initialData?.id) return;
    
    setSelectedNewSection(newSectionId);
    setIsSectionChangeLoading(true);
    
    try {
      // Call backend to analyze impact
      const response = await apiClient.analyze_section_change_impact({
        category_id: initialData.id,
        new_section_id: newSectionId
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        setImpactData({
          oldSectionName: result.current_section_name,
          newSectionName: result.new_section_name,
          itemsAffected: result.items_affected,
          subcategoriesAffected: result.subcategories_affected
        });
        setWarningDialogOpen(true);
      } else {
        toast.error('Failed to analyze section change impact');
      }
    } catch (error: any) {
      console.error('Error analyzing section change:', error);
      toast.error('Error analyzing section change: ' + error.message);
    } finally {
      setIsSectionChangeLoading(false);
    }
  };
  
  // Handler to execute section move
  const handleConfirmSectionChange = async () => {
    if (!selectedNewSection || !initialData?.id || !mountedRef.current) return;
    
    setIsSectionChangeLoading(true);
    
    try {
      const response = await apiClient.move_category_section({
        category_id: initialData.id,
        new_section_id: selectedNewSection
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        toast.success(
          <div>
            <p className="font-semibold">✅ Category Moved Successfully</p>
            <p className="text-sm mt-1">
              "{result.category_name}" has been moved to {impactData?.newSectionName}
            </p>
            {result.items_affected > 0 && (
              <ul className="text-xs mt-2 space-y-0.5">
                <li>• {result.items_affected} items updated</li>
                {result.subcategories_affected > 0 && (
                  <li>• {result.subcategories_affected} subcategories moved</li>
                )}
                <li>• Changes are live in POS</li>
              </ul>
            )}
          </div>,
          { duration: 6000 }
        );
        
        // Invalidate cache using React Query
        queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
        queryClient.invalidateQueries({ queryKey: menuKeys.completeMenu() });
        
        setSafeTimeout(() => {
          if (mountedRef.current) {
            realtimeMenuStore.refreshData();
          }
        }, 500);
        
        // Close dialogs and reset
        setWarningDialogOpen(false);
        setIsOpen(false);
        setSelectedNewSection(null);
        setImpactData(null);
        
        // Call onSuccess
        setSafeTimeout(() => {
          if (mountedRef.current) {
            onSuccess();
          }
        }, 200);
      } else {
        toast.error(result.message || 'Failed to move category');
      }
    } catch (error: any) {
      console.error('Error moving category section:', error);
      toast.error('Error moving category: ' + error.message);
    } finally {
      if (mountedRef.current) {
        setIsSectionChangeLoading(false);
      }
    }
  };

  const onSubmit = async (data: CategoryFormValues) => {
    if (!mountedRef.current) return;
    
    // Determine the correct parent_category_id based on category type
    let finalParentCategoryId: string | null = null;
    
    if (data.category_type === 'main' && data.section_id && data.section_id !== 'none') {
      // Main category: Use section ID in format "section-{sectionId}"
      // Filter out 'none' which is the placeholder value
      finalParentCategoryId = `section-${data.section_id}`;
    } else if (data.category_type === 'sub') {
      // Subcategory: Use the selected parent category ID
      finalParentCategoryId = data.parent_category_id || null;
    }
    // If neither, leave as null (legacy main categories without section)

    // Create a copy with correct field mapping
    const dataToSave = {
      name: data.name,
      description: data.description,
      display_order: data.menu_order,
      print_order: data.print_order,
      print_to_kitchen: data.print_to_kitchen,
      active: data.active,
      parent_category_id: finalParentCategoryId,
      is_protein_type: false
    };
    
    // Add ID for editing
    if (isEditing && initialData?.id) {
      dataToSave['id'] = initialData.id;
    }
    
    try {
      if (!mountedRef.current) return;
      
      // Use the working standard endpoint for category operations
      const saveResponse = await apiClient.save_category(dataToSave);
      
      if (!mountedRef.current) return;
      
      const saveResult = await saveResponse.json();
      
      if (saveResult.status !== 'success') {
        throw new Error(saveResult.message || 'Unknown error saving category');
      }
      
      if (mountedRef.current) {
        toast.success(isEditing ? 'Category updated successfully' : 'Category created successfully');
      }
      
      // React Query: Invalidate affected queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
      queryClient.invalidateQueries({ queryKey: menuKeys.completeMenu() });

      // Debounced refresh with timeout to prevent rapid successive updates
      setSafeTimeout(() => {
        if (mountedRef.current) {
          try {
            realtimeMenuStore.refreshData();
          } catch (storeError) {
            console.warn('Failed to refresh real-time store:', storeError);
          }
        }
      }, 500);

      if (mountedRef.current) {
        // Reset form and close dialog
        form.reset();
        setIsOpen(false);
        
        // Call onSuccess after a small delay to prevent immediate reload
        setSafeTimeout(() => {
          if (mountedRef.current) {
            onSuccess();
          }
        }, 200);
      }
    } catch (error: any) {
      if (mountedRef.current) {
        toast.error('Error saving category: ' + error.message);
        console.error('Error saving category:', error);
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-[rgba(21, 25, 42, 0.95)] text-white border-[rgba(124, 93, 250, 0.2)] max-w-2xl backdrop-blur-md max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-[#7C5DFA]">
              {isEditing ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
            <DialogDescription className="text-[#BBC3E1]">
              {isEditing ? 'Update the category details below.' : 'Fill in the details for the new menu category.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto flex-1 pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="category_type"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[#FFFFFF]">Category Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                        value={field.value}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="main" id="main" />
                          <label htmlFor="main" className="text-[#FFFFFF] cursor-pointer">
                            Main Category
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sub" id="sub" />
                          <label htmlFor="sub" className="text-[#FFFFFF] cursor-pointer">
                            Subcategory
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription className="text-[#BBC3E1]">
                      Select whether this is a main category or a subcategory under another category.
                    </FormDescription>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#FFFFFF]">Category Name</FormLabel>
                    <FormControl>
                      <AdminInput 
                        placeholder="e.g. Starters, Main Courses" 
                        {...field} 
                        variant="purple"
                      />
                    </FormControl>
                    <FormDescription className="text-[#BBC3E1]">
                      This will be displayed in the menu navigation.
                    </FormDescription>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#FFFFFF]">Description (Optional)</FormLabel>
                    <FormControl>
                      <AdminInput 
                        placeholder="Brief description of this category" 
                        {...field} 
                        value={field.value || ''}
                        variant="purple"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="menu_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#FFFFFF]">Display Order</FormLabel>
                    <FormControl>
                      <OrderNumberInput
                        value={field.value || 0}
                        onChange={field.onChange}
                        placeholder="Select display order..."
                        helpText="Categories are sorted by this number in the menu (lower numbers first)."
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              
              {/* Section Selector - Shows for Main Categories */}
              {form.watch('category_type') === 'main' && (
                <>
                  {/* Section Change UI (Edit Mode) - Shows for ALL main categories */}
                  {isEditing && (
                    <div className="bg-[rgba(124,93,250,0.15)] border-2 border-[rgba(124,93,250,0.5)] rounded-lg p-4 mb-4">
                      {/* Current Section Badge */}
                      {initialData?.parent_category_id?.startsWith('section-') && (
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-purple-600/80 text-white border-purple-400/50 px-3 py-1.5 text-base shadow-lg shadow-purple-500/20">
                            📍 Current Section: {(() => {
                              const sectionId = initialData.parent_category_id.replace('section-', '');
                              const section = getSectionById(sectionId as SectionId);
                              return section ? `${section.icon} ${section.displayName}` : sectionId;
                            })()}
                          </Badge>
                        </div>
                      )}
                      
                      {/* No Section Badge */}
                      {!initialData?.parent_category_id?.startsWith('section-') && (
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-amber-600/80 text-white border-amber-400/50 px-3 py-1.5 text-base shadow-lg shadow-amber-500/20">
                            ⚠️ No Section Assigned
                          </Badge>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-2 mt-3 pt-3 border-t border-[rgba(124,93,250,0.3)]">
                        <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div className="space-y-2 flex-1">
                          <FormLabel className="text-[#FFFFFF] flex items-center gap-2">
                            {initialData?.parent_category_id?.startsWith('section-') ? 'Change Section' : 'Assign to Section'}
                          </FormLabel>
                          <Select
                            onValueChange={handleSectionChangeSelect}
                            value={selectedNewSection || "none"}
                            disabled={isSectionChangeLoading}
                          >
                            <SelectTrigger className="bg-[rgba(26,26,26,0.9)] border-[rgba(234,179,8,0.6)] text-[#FFFFFF] focus:border-yellow-500 focus:ring-2 focus:ring-[rgba(234,179,8,0.3)] hover:border-yellow-500 transition-all duration-200 backdrop-blur-sm shadow-md">
                              <SelectValue placeholder="Select section..." />
                            </SelectTrigger>
                            <SelectContent className="bg-[rgba(26,26,26,0.95)] border-[rgba(124,93,250,0.4)] text-[#FFFFFF] backdrop-blur-xl shadow-xl">
                              <SelectItem value="none">Select section...</SelectItem>
                              {FIXED_SECTIONS.filter(section => {
                                const currentSectionId = initialData?.parent_category_id?.replace('section-', '');
                                return section.id !== currentSectionId;
                              }).map(section => (
                                <SelectItem key={section.id} value={section.id}>
                                  {section.icon} {section.displayName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-[#BBC3E1] text-sm">
                            {initialData?.parent_category_id?.startsWith('section-') 
                              ? 'Moving this category will update all items and subcategories'
                              : 'Assigning a section will organize this category in the POS menu structure'}
                          </FormDescription>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Original Section Selector (Create Mode) */}
                  {!isEditing && (
                    <FormField
                      control={form.control}
                      name="section_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#FFFFFF]">Menu Section</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || "none"}
                            disabled={isLoading}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-[rgba(26,26,26,0.9)] border-[rgba(124,93,250,0.4)] text-[#FFFFFF] focus:border-[#7C5DFA] focus:ring-2 focus:ring-[rgba(124,93,250,0.2)] hover:border-[rgba(124,93,250,0.6)] transition-all duration-200 backdrop-blur-sm shadow-md">
                                <SelectValue placeholder="Select menu section" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[rgba(26,26,26,0.95)] border-[rgba(124,93,250,0.4)] text-[#FFFFFF] backdrop-blur-xl shadow-xl">
                              <SelectItem value="none">Select a menu section</SelectItem>
                              {FIXED_SECTIONS.map(section => (
                                <SelectItem key={section.id} value={section.id}>
                                  {section.icon} {section.displayName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-[#BBC3E1]">
                            Choose which section this category appears under in the POS system (Starters, Main Course, etc.).
                          </FormDescription>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}
              
              <div className="mt-6 mb-4 bg-[#161A2C]/70 p-4 rounded-md border-2 border-[rgba(124,93,250,0.5)] shadow-[0_0_12px_rgba(124,93,250,0.15)]">
                <h3 className="text-lg font-medium mb-3 flex items-center text-[#7C5DFA]">
                  <Printer className="h-5 w-5 mr-2" />
                  Category Print Settings
                  <HelpCircle
                    className="h-4 w-4 ml-2 text-[#BBC3E1] hover:text-white cursor-help transition-colors"
                    onClick={() => {
                      toast("Print Settings Best Practices", {
                        description: (
                          <div className="space-y-2 text-sm mt-2">
                            <p>• Set common print settings at the category level first</p>
                            <p>• Categories like Drinks typically don't print to kitchen</p>
                            <p>• Use print order to group similar items (starters, mains, sides)</p>
                            <p>• Only override at the item level for exceptions</p>
                          </div>
                        ),
                        duration: 10000,
                      });
                    }}
                  />
                </h3>
                <div className="p-3 bg-[rgba(124,93,250,0.05)] rounded-md mb-3">
                  <FormDescription className="text-[#BBC3E1]">
                    <span className="block mb-1 font-medium text-white text-base">These settings affect ALL items in this category.</span>
                    <div className="flex items-start mt-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-400 mr-2 mt-0.5" />
                      <span>
                        Items will inherit these settings by default. Individual items can override these settings only when needed.
                      </span>
                    </div>
                  </FormDescription>
                </div>
                
                <FormField
                  control={form.control}
                  name="print_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#FFFFFF]">Print Order</FormLabel>
                      <FormControl>
                        <OrderNumberInput
                          value={field.value || 0}
                          onChange={field.onChange}
                          placeholder="Select print order..."
                          helpText="Determines the order this category appears in printed tickets (lower numbers first)."
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
            
                <FormField
                  control={form.control}
                  name="print_to_kitchen"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[rgba(124, 93, 250, 0.3)] p-3 shadow-sm bg-[#161A2C] mt-4 hover:border-[rgba(124,93,250,0.5)]">
                      <div className="space-y-0.5">
                        <FormLabel className="text-[#FFFFFF] flex items-center">
                          <span>Print to Kitchen</span>
                          {!field.value && (
                            <Badge variant="outline" className="ml-2 text-xs bg-amber-600/20 text-amber-400 border-amber-400/30">
                              Disabled
                            </Badge>
                          )}
                        </FormLabel>
                        <FormDescription className="text-[#BBC3E1]">
                          <div className="flex items-start">
                            <span>
                              {field.value 
                                ? "All items in this category will be printed on kitchen tickets." 
                                : "Items in this category will NOT be printed on kitchen tickets."}
                            </span>
                          </div>
                          <div className="mt-1 text-xs">
                            {!field.value && (
                              <span className="italic text-amber-300">Common for categories like Drinks, Packaged Items, etc.</span>
                            )}
                          </div>
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="accent-[#7C5DFA] h-5 w-5"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Parent Category Selector - Shows for Subcategories */}
              {form.watch('category_type') === 'sub' && (
                <FormField
                  control={form.control}
                  name="parent_category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#FFFFFF]">Parent Category</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                        value={field.value || "none"}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-[rgba(26,26,26,0.9)] border-[rgba(124,93,250,0.4)] text-[#FFFFFF] focus:border-[#7C5DFA] focus:ring-2 focus:ring-[rgba(124,93,250,0.2)] hover:border-[rgba(124,93,250,0.6)] transition-all duration-200 backdrop-blur-sm shadow-md">
                            <SelectValue placeholder="Select a parent category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[rgba(26,26,26,0.95)] border-[rgba(124,93,250,0.4)] text-[#FFFFFF] backdrop-blur-xl shadow-xl">
                          <SelectItem value="none">Select a parent category</SelectItem>
                          {isLoading ? (
                            <SelectItem value="loading-placeholder">Loading categories...</SelectItem>
                          ) : (
                            categories.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-[#BBC3E1]">
                        Select a parent category to organise this under a main section.
                      </FormDescription>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[rgba(124,93,250,0.4)] p-3 shadow-md bg-[rgba(26,26,26,0.9)] backdrop-blur-sm hover:border-[rgba(124,93,250,0.6)] transition-all duration-200">
                    <div className="space-y-0.5">
                      <FormLabel className="text-[#FFFFFF]">Active Status</FormLabel>
                      <FormDescription className="text-[#BBC3E1]">
                        Inactive categories won't be displayed in the menu.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="accent-[#7C5DFA] h-5 w-5"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-[#7C5DFA] hover:bg-[#9277FF] text-white w-full mt-2 transition-colors duration-200"
                >
                  {isLoading ? 'Saving...' : isEditing ? 'Update Category' : 'Add Category'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Section Change Warning Dialog */}
      {impactData && (
        <SectionChangeWarningDialog
          isOpen={warningDialogOpen}
          onClose={() => {
            setWarningDialogOpen(false);
            setSelectedNewSection(null);
            setImpactData(null);
          }}
          onConfirm={handleConfirmSectionChange}
          categoryName={initialData?.name || ''}
          oldSectionName={impactData.oldSectionName}
          newSectionName={impactData.newSectionName}
          itemsAffected={impactData.itemsAffected}
          subcategoriesAffected={impactData.subcategoriesAffected}
          isLoading={isSectionChangeLoading}
        />
      )}
    </>
  );
}
