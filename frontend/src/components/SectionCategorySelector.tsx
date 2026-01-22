import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FolderTree, X, AlertCircle } from 'lucide-react';
import { MenuSection, MenuCategory } from 'utils/mediaHierarchyUtils';

interface SectionCategorySelectorProps {
  sections: MenuSection[];
  selectedSectionId: string | null;
  selectedCategoryId: string | null;
  onSectionChange: (sectionId: string | null) => void;
  onCategoryChange: (categoryId: string | null) => void;
  isLoading?: boolean;
}

export default function SectionCategorySelector({
  sections,
  selectedSectionId,
  selectedCategoryId,
  onSectionChange,
  onCategoryChange,
  isLoading = false,
}: SectionCategorySelectorProps) {
  // Get available categories for selected section
  const availableCategories = React.useMemo(() => {
    if (!selectedSectionId) return [];
    const section = sections.find((s) => s.id === selectedSectionId);
    return section?.categories || [];
  }, [sections, selectedSectionId]);

  // Reset category when section changes
  React.useEffect(() => {
    if (selectedCategoryId && !availableCategories.find((c) => c.id === selectedCategoryId)) {
      onCategoryChange(null);
    }
  }, [selectedSectionId, selectedCategoryId, availableCategories, onCategoryChange]);

  const handleClearFilters = () => {
    onSectionChange(null);
    onCategoryChange(null);
  };

  const hasActiveFilters = selectedSectionId || selectedCategoryId;
  const isUncategorizedView = selectedSectionId === 'uncategorized';

  return (
    <div className="flex items-center gap-3 p-4 bg-card/30 border border-border/50 rounded-lg">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FolderTree className="h-4 w-4" />
        <span className="font-medium">Filter by:</span>
      </div>

      {/* Section Selector */}
      <Select
        value={selectedSectionId || 'all'}
        onValueChange={(value) => onSectionChange(value === 'all' ? null : value)}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[200px] bg-background/50 border-border/50 focus:border-purple-500/50 focus:ring-purple-500/20">
          <SelectValue placeholder="All Sections" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <span className="font-medium">All Sections</span>
          </SelectItem>
          <SelectItem value="uncategorized">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-orange-400">Uncategorized</span>
            </div>
          </SelectItem>
          {sections.map((section) => (
            <SelectItem key={section.id} value={section.id}>
              <div className="flex items-center gap-2">
                <span>{section.display_name}</span>
                {section.categories.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({section.categories.length})
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Category Selector - Only show when a real section is selected (not uncategorized) */}
      {selectedSectionId && !isUncategorizedView && (
        <Select
          value={selectedCategoryId || 'all'}
          onValueChange={(value) => onCategoryChange(value === 'all' ? null : value)}
          disabled={isLoading || availableCategories.length === 0}
        >
          <SelectTrigger className="w-[200px] bg-background/50 border-border/50 focus:border-purple-500/50 focus:ring-purple-500/20">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="font-medium">All Categories</span>
            </SelectItem>
            {availableCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="ml-auto text-muted-foreground hover:text-foreground hover:bg-purple-500/10 transition-colors"
        >
          <X className="h-4 w-4 mr-1" />
          Clear Filters
        </Button>
      )}

      {/* Filter Summary */}
      {!hasActiveFilters && (
        <span className="ml-auto text-xs text-muted-foreground italic">
          Showing all menu images
        </span>
      )}
    </div>
  );
}
