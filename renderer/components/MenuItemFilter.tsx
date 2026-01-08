import { useState, useEffect, useMemo, forwardRef } from 'react';
import { Search, X, Clock, ChevronDown } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useMenuItems } from '../utils/menuQueries';
import { MenuSection } from '../utils/mediaHierarchyUtils';
import { toast } from 'sonner';
import { announceFilterChange } from '../utils/announceToScreenReader';

interface MenuItemFilterProps {
  selectedMenuItemId: string | null;
  onMenuItemSelect: (itemId: string | null) => void;
  sections: MenuSection[];
}

const RECENT_ITEMS_KEY = 'mediaLibrary_recentMenuItems';
const MAX_RECENT_ITEMS = 5;

export const MenuItemFilter = forwardRef<HTMLButtonElement, MenuItemFilterProps>(
  function MenuItemFilter(
    {
      selectedMenuItemId,
      onMenuItemSelect,
      sections,
    },
    ref
  ) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [recentItemIds, setRecentItemIds] = useState<string[]>([]);

    const { data: menuItems, isLoading } = useMenuItems();

    // Load recent items from localStorage
    useEffect(() => {
      try {
        const saved = localStorage.getItem(RECENT_ITEMS_KEY);
        if (saved) {
          setRecentItemIds(JSON.parse(saved));
        }
      } catch (error) {
        console.warn('Failed to load recent menu items:', error);
      }
    }, []);

    // Save recent items to localStorage
    const saveRecentItem = (itemId: string) => {
      try {
        const updated = [
          itemId,
          ...recentItemIds.filter(id => id !== itemId),
        ].slice(0, MAX_RECENT_ITEMS);

        setRecentItemIds(updated);
        localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save recent menu item:', error);
      }
    };

    // Build category path lookup from sections
    const categoryPathMap = useMemo(() => {
      const map = new Map<string, string>();

      if (!sections || sections.length === 0) {
        return map;
      }

      sections.forEach(section => {
        section.categories?.forEach(category => {
          map.set(category.category_id, `${section.section_name} → ${category.category_name}`);
        });
      });

      return map;
    }, [sections]);

    // Filter menu items based on search query
    const filteredItems = useMemo(() => {
      if (!menuItems) return [];

      const query = searchQuery.toLowerCase().trim();
      if (!query) return menuItems.slice(0, 50); // Limit to 50 when no search

      return menuItems
        .filter(item => {
          const nameMatch = item.name.toLowerCase().includes(query);
          const kitchenNameMatch = item.kitchen_display_name?.toLowerCase().includes(query);
          return nameMatch || kitchenNameMatch;
        })
        .slice(0, 50); // Limit results to 50
    }, [menuItems, searchQuery]);

    // Get recent items data
    const recentItems = useMemo(() => {
      if (!menuItems) return [];
      return recentItemIds
        .map(id => menuItems.find(item => item.id === id))
        .filter(Boolean);
    }, [menuItems, recentItemIds]);

    // Get selected item
    const selectedItem = useMemo(() => {
      if (!selectedMenuItemId || !menuItems) return null;
      return menuItems.find(item => item.id === selectedMenuItemId);
    }, [selectedMenuItemId, menuItems]);

    // Handle item selection
    const handleSelect = (itemId: string) => {
      const item = menuItems?.find(i => i.id === itemId);
      onMenuItemSelect(itemId);
      saveRecentItem(itemId);
      setOpen(false);
      
      if (item) {
        announceFilterChange('Menu Item', item.name);
        toast.success('Menu item filter applied');
      }
    };

    // Handle clear
    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onMenuItemSelect(null);
      setSearchQuery('');
      announceFilterChange('Menu Item', 'cleared');
      toast.info('Menu item filter cleared');
    };

    // Format display text
    const getItemDisplayText = (item: any) => {
      const categoryPath = categoryPathMap.get(item.category_id) || 'Unknown Category';
      return {
        name: item.name,
        context: categoryPath,
        price: item.price ? `£${item.price.toFixed(2)}` : '',
      };
    };

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Menu Item
        </label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-labelledby="menu-item-filter-label"
              aria-haspopup="listbox"
              className="w-full justify-between text-left font-normal transition-all duration-200 hover:border-purple-500/30 hover:bg-purple-500/5 hover:shadow-md"
            >
              {selectedItem ? (
                <div className="flex-1 truncate">
                  <div className="font-medium">{selectedItem.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {getItemDisplayText(selectedItem).context}
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground">Search menu items...</span>
              )}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200" aria-hidden="true" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-[400px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Type to search menu items..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="h-9"
                aria-label="Search menu items"
              />

              <CommandList role="listbox" aria-label="Menu item search results">
                {isLoading ? (
                  <div 
                    className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"
                    role="status"
                    aria-live="polite"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Loading menu items...</span>
                  </div>
                ) : (
                  <>
                    {/* Recent Items */}
                    {!searchQuery && recentItems.length > 0 && (
                      <>
                        <CommandGroup heading="Recent">
                          {recentItems.map((item: any) => {
                            const display = getItemDisplayText(item);
                            return (
                              <CommandItem
                                key={item.id}
                                value={item.id}
                                onSelect={() => handleSelect(item.id)}
                                className="flex items-start gap-2 py-2 transition-all duration-150 hover:bg-purple-500/10"
                                role="option"
                                aria-label={`${display.name}, ${display.context}${display.price ? `, ${display.price}` : ''}`}
                              >
                                <Clock className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground transition-transform duration-200 hover:scale-110" aria-hidden="true" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {display.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {display.context}
                                  </div>
                                </div>
                                {display.price && (
                                  <div className="text-xs font-medium text-muted-foreground" aria-hidden="true">
                                    {display.price}
                                  </div>
                                )}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                        <CommandSeparator />
                      </>
                    )}

                    {/* Filtered Results */}
                    {filteredItems.length === 0 ? (
                      <CommandEmpty>
                        {searchQuery
                          ? 'No menu items found'
                          : 'Start typing to search...'}
                      </CommandEmpty>
                    ) : (
                      <CommandGroup
                        heading={
                          searchQuery
                            ? `Results (${filteredItems.length}${filteredItems.length === 50 ? '+' : ''})`
                            : 'All Menu Items'
                        }
                      >
                        {filteredItems.map((item: any) => {
                          const display = getItemDisplayText(item);
                          return (
                            <CommandItem
                              key={item.id}
                              value={item.id}
                              onSelect={() => handleSelect(item.id)}
                              className="flex items-start gap-2 py-2 transition-all duration-150 hover:bg-purple-500/10"
                              role="option"
                              aria-label={`${display.name}, ${display.context}${display.price ? `, ${display.price}` : ''}`}
                            >
                              <Search className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground transition-transform duration-200 hover:scale-110" aria-hidden="true" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {display.name}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {display.context}
                                </div>
                              </div>
                              {display.price && (
                                <div className="text-xs font-medium text-muted-foreground" aria-hidden="true">
                                  {display.price}
                                </div>
                              )}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    )}

                    {/* Show hint if results limited */}
                    {filteredItems.length === 50 && (
                      <div className="px-2 py-2 text-xs text-center text-muted-foreground border-t">
                        Showing top 50 results. Type more to refine search.
                      </div>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);
