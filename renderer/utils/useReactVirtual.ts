import { useVirtualizer, VirtualizerOptions } from '@tanstack/react-virtual';

/**
 * Desktop-optimized virtualization wrapper for POSDesktop components.
 * 
 * This is a thin configuration wrapper around @tanstack/react-virtual's useVirtualizer
 * that provides sensible defaults optimized for desktop POS environments.
 * 
 * ## Why Desktop-Specific Optimization?
 * 
 * Desktop POS systems have different performance characteristics than responsive web apps:
 * 
 * 1. **Fixed Viewports**: Desktop apps run in consistent viewport sizes, unlike mobile/tablet
 *    responsive layouts. This allows for more accurate size estimation.
 * 
 * 2. **Mouse Wheel Scrolling**: Desktop users scroll with mouse wheels and keyboard navigation,
 *    which tends to be faster and more aggressive than touch scrolling. Higher overscan prevents
 *    white flashing during rapid scrolls.
 * 
 * 3. **Memory vs. Smoothness Tradeoff**: Desktop systems typically have more available memory,
 *    allowing us to render more off-screen items (higher overscan) for buttery-smooth scrolling
 *    without the memory constraints of mobile devices.
 * 
 * 4. **Performance Expectations**: POS operators expect instant, lag-free interactions.
 *    Desktop-class hardware allows us to prioritize visual smoothness over memory efficiency.
 * 
 * ## Desktop-Optimized Defaults
 * 
 * - **overscan: 5** - Renders 5 extra rows/columns above and below viewport
 *   - Mobile typically uses 1-2 for memory efficiency
 *   - Desktop can afford 5 to eliminate any visible blank rows during fast scrolling
 *   - Prevents the "white flash" effect when scrolling quickly through large lists
 * 
 * - **estimateSize: () => 100** - Conservative default row/column size estimate
 *   - Desktop fixed layouts allow accurate measurement on first render
 *   - This default works well for typical POS list items (orders, menu items, etc.)
 *   - Override with your actual measured size for best performance
 * 
 * - **enabled: true** - Virtualization always active
 *   - Desktop apps benefit from virtualization even at moderate list sizes (50+ items)
 *   - Unlike mobile, no need to toggle based on viewport changes
 * 
 * ## Use Cases in POSDesktop
 * 
 * - Menu item grids (100+ menu items across categories)
 * - Order history lists (large transaction logs, potentially 1000+ orders)
 * - Customer search results (searching large customer databases)
 * - Kitchen display order queues (many pending orders during rush hours)
 * - Table management grids (restaurants with 50+ tables)
 * - Inventory lists (hundreds of ingredients/products)
 * 
 * ## Usage Example
 * 
 * ```tsx
 * import { useReactVirtual } from 'utils/useReactVirtual';
 * 
 * function MenuItemGrid({ items }: { items: MenuItem[] }) {
 *   const parentRef = useRef<HTMLDivElement>(null);
 * 
 *   const rowVirtualizer = useReactVirtual({
 *     count: items.length,
 *     getScrollElement: () => parentRef.current,
 *     estimateSize: () => 380, // Override with your actual card height
 *   });
 * 
 *   return (
 *     <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
 *       <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
 *         {rowVirtualizer.getVirtualItems().map((virtualRow) => (
 *           <div
 *             key={virtualRow.key}
 *             style={{
 *               position: 'absolute',
 *               top: 0,
 *               left: 0,
 *               width: '100%',
 *               height: `${virtualRow.size}px`,
 *               transform: `translateY(${virtualRow.start}px)`,
 *             }}
 *           >
 *             {items[virtualRow.index].name}
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 * 
 * ## Horizontal Virtualization
 * 
 * ```tsx
 * const columnVirtualizer = useReactVirtual({
 *   count: columns.length,
 *   getScrollElement: () => parentRef.current,
 *   estimateSize: () => 200, // Column width
 *   horizontal: true, // Enable horizontal mode
 * });
 * ```
 * 
 * @param options - Virtualization options (same as @tanstack/react-virtual useVirtualizer)
 * @returns Virtualizer instance with desktop-optimized configuration
 * 
 * @see {@link https://tanstack.com/virtual/latest/docs/framework/react/react-virtual TanStack Virtual Docs}
 */
export function useReactVirtual<
  TScrollElement extends Element | Window,
  TItemElement extends Element
>(options: Partial<VirtualizerOptions<TScrollElement, TItemElement>> & {
  count: number;
  getScrollElement: () => TScrollElement | null;
}) {
  return useVirtualizer<TScrollElement, TItemElement>({
    // Desktop-optimized defaults
    overscan: 5, // Higher overscan for desktop to prevent white flashing during fast scrolls
    estimateSize: () => 100, // Conservative default, should be overridden per use case
    enabled: true, // Always enabled for desktop POS
    
    // Spread user options (allows full override of defaults)
    ...options,
  });
}

/**
 * Re-export types from @tanstack/react-virtual for convenience
 */
export type { VirtualizerOptions, Virtualizer, VirtualItem } from '@tanstack/react-virtual';
