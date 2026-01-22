import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { SortOption } from '../pages/MediaLibrary';

interface MediaFiltersProps {
  onFilterChange: (filters: any) => void;
  onSortChange: (sort: SortOption) => void;
  sortOption: SortOption;
}

export const MediaFilters: React.FC<MediaFiltersProps> = ({ onSortChange, sortOption }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter & Sort
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={sortOption} onValueChange={(value) => onSortChange(value as SortOption)}>
          <DropdownMenuRadioItem value="date-desc">Newest</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="date-asc">Oldest</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="name-asc">Name (A-Z)</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="name-desc">Name (Z-A)</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
        {/* Add filter options here */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
