import React, { useEffect, useMemo, useRef, useState } from "react";

interface ColumnsConfig {
  base?: number; // default 1
  md?: number;   // default 2
  lg?: number;   // default 3
  xl?: number;   // default 4
}

interface MasonryGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns?: ColumnsConfig;
  rowHeight?: number; // grid-auto-rows baseline in px (1 recommended for pixel-perfect)
  gap?: number;       // gap in px
  className?: string;
  /** Optional: when reflow completes */
  onReflow?: () => void;
}

/**
 * MasonryGrid
 * - Professional CSS Grid masonry using grid-auto-rows and dynamic row-span
 * - Uses ResizeObserver to recompute spans on content changes and window resize
 * - Provides a safe fallback to CSS columns masonry if ResizeObserver is unavailable
 * - Preserves DOM/LTR focus order unlike CSS columns
 */
export function MasonryGrid<T = any>({
  items,
  renderItem,
  columns = { base: 1, md: 2, lg: 3, xl: 4 },
  rowHeight = 1, // 1px baseline for pixel-perfect spans
  gap = 24,
  className = "",
  onReflow,
}: MasonryGridProps<T>) {
  const supportsResizeObserver = typeof window !== "undefined" && "ResizeObserver" in window;

  // Fallback: CSS columns masonry if ResizeObserver is not supported
  const fallbackColumnsClass = useMemo(() => {
    const base = columns.base ?? 1;
    const md = columns.md ?? 2;
    const lg = columns.lg ?? 3;
    const xl = columns.xl ?? 4;
    return `columns-${base} md:columns-${md} lg:columns-${lg} xl:columns-${xl}`;
  }, [columns.base, columns.md, columns.lg, columns.xl]);

  // Grid container ref
  const gridRef = useRef<HTMLDivElement | null>(null);
  // Individual item refs (wrappers)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Track spans
  const [spans, setSpans] = useState<number[]>([]);

  // Utility: get computed vertical margins for an element
  const getVerticalMargins = (el: HTMLElement): number => {
    const styles = window.getComputedStyle(el);
    const mt = parseFloat(styles.marginTop || "0") || 0;
    const mb = parseFloat(styles.marginBottom || "0") || 0;
    return mt + mb;
  };

  // Utility to compute span for an element based on rowHeight and gap
  const computeSpan = (el: HTMLElement): number => {
    // Measure content height (prefer first child which is the content wrapper)
    const content = (el.firstElementChild as HTMLElement) ?? el;

    // Use offsetHeight for layout height and add vertical margins so outer spacing is accounted for
    const baseHeight = content.offsetHeight;
    const margins = getVerticalMargins(content);
    const totalHeight = baseHeight + margins;

    const row = rowHeight;
    const rowGap = gap; // approximate row gap
    // Pixel-perfect formula: include a gap unit so last row rounds correctly
    const span = Math.max(1, Math.ceil((totalHeight + rowGap) / (row + rowGap)));
    return span;
  };

  // Batch measurement using rAF + tiny debounce to allow motion transforms to settle
  const scheduleMeasureFactory = () => {
    let frame = 0 as number;
    let timer: number | undefined = undefined;

    const clear = () => {
      if (frame) cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
      frame = 0;
      timer = undefined;
    };

    const measureAll = () => {
      if (!gridRef.current) return;
      const nextSpans: number[] = [];
      itemRefs.current.forEach((node) => {
        if (!node) {
          nextSpans.push(1);
          return;
        }
        nextSpans.push(computeSpan(node));
      });
      setSpans(nextSpans);
      if (onReflow) onReflow();
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      if (frame) cancelAnimationFrame(frame);
      // Tiny debounce (40ms) + rAF for layout stability
      timer = window.setTimeout(() => {
        frame = requestAnimationFrame(measureAll);
      }, 40);
    };

    return { schedule, clear };
  };

  // Setup ResizeObserver per item
  useEffect(() => {
    if (!supportsResizeObserver) return; // handled by fallback render

    const { schedule, clear } = scheduleMeasureFactory();

    const observers: ResizeObserver[] = [];

    // Observe grid container resize as well (for column changes)
    const containerObserver = new ResizeObserver(() => schedule());
    if (gridRef.current) containerObserver.observe(gridRef.current);

    // Observe each item's content box
    itemRefs.current.forEach((el) => {
      if (!el) return;
      const ro = new ResizeObserver(() => schedule());
      ro.observe(el);

      // Observe all images inside this card (not just first)
      const imgs = el.querySelectorAll<HTMLImageElement>("img");
      imgs.forEach((img) => {
        if (!img.complete) {
          img.addEventListener("load", schedule, { once: true });
          img.addEventListener("error", schedule, { once: true });
        }
      });

      observers.push(ro);
    });

    // First measure after mount/update
    schedule();

    // Window resize listener (for safety)
    window.addEventListener("resize", schedule);

    return () => {
      observers.forEach((o) => o.disconnect());
      containerObserver.disconnect();
      window.removeEventListener("resize", schedule);
      clear();
    };
    // Re-run when items array changes length or spacing changes
  }, [items.length, gap, rowHeight, supportsResizeObserver]);

  // Extra: trigger measure when fonts finish loading to tighten gaps
  useEffect(() => {
    if (!supportsResizeObserver) return;
    const anyDoc: any = typeof document !== 'undefined' ? document : null;
    if (anyDoc && anyDoc.fonts && anyDoc.fonts.ready) {
      anyDoc.fonts.ready.then(() => {
        // Dispatch a resize event to invoke schedule() from the effect above
        window.dispatchEvent(new Event('resize'));
      }).catch(() => {
        // no-op
      });
    }
  }, [supportsResizeObserver]);

  // Ensure refs length matches items
  itemRefs.current = items.map((_, i) => itemRefs.current[i] || null);

  // Tailwind JIT safelist: ensure these classes are included in final CSS
  // Note: This hidden element is never rendered visually but helps Tailwind detect class tokens
  const TailwindSafelist = (
    <div
      className="hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 columns-1 md:columns-2 lg:columns-3 xl:columns-4 [&>*]:m-0"
      aria-hidden
    />
  );

  if (!supportsResizeObserver) {
    // Safe fallback: CSS columns masonry
    return (
      <div
        className={`${fallbackColumnsClass} ${className}`}
        style={{ columnGap: `${gap}px` }}
      >
        {TailwindSafelist}
        {items.map((item, idx) => (
          <div
            key={idx}
            className="inline-block w-full align-top break-inside-avoid"
            style={{ breakInside: "avoid", marginBottom: `${gap}px` }}
          >
            {/* Normalize outer spacing of the direct child */}
            <div data-masonry-content className="[&>*]:m-0">
              {renderItem(item, idx)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const gridColsClass = useMemo(() => {
    const base = columns.base ?? 1;
    const md = columns.md ?? 2;
    const lg = columns.lg ?? 3;
    const xl = columns.xl ?? 4;
    return `grid grid-cols-${base} md:grid-cols-${md} lg:grid-cols-${lg} xl:grid-cols-${xl}`;
  }, [columns.base, columns.md, columns.lg, columns.xl]);

  return (
    <div
      ref={gridRef}
      className={`${gridColsClass} ${className}`}
      style={{ gap: `${gap}px`, gridAutoRows: `${rowHeight}px` }}
    >
      {TailwindSafelist}
      {items.map((item, idx) => (
        <div
          // Wrapper measured by ResizeObserver
          key={idx}
          ref={(el) => (itemRefs.current[idx] = el)}
          style={{ gridRowEnd: `span ${spans[idx] || 1}` }}
        >
          {/* Content container (measured height); normalize margins to avoid holes */}
          <div data-masonry-content className="[&>*]:m-0 flow-root">
            {renderItem(item, idx)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default MasonryGrid;
