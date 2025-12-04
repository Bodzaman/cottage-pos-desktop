import React from "react";
import { useViewport } from 'utils/useViewport';

export interface ResponsiveZones {
  customer: React.ReactNode;
  categories: React.ReactNode | null;
  menu: React.ReactNode;
  summary: React.ReactNode;
}

interface Props {
  zones: ResponsiveZones;
}

/**
 * ResponsivePOSShell
 * - Provides adaptive grid for POS without altering inner visuals
 * - Desktop (>=1440): 4 columns with fixed tokens
 * - Laptop (1024-1439): 4 columns with slight clamps to relieve pressure
 * - Tablet (768-1023): 2 columns (Menu | Summary) with floating toggles to open Customer/Categories as overlays
 * - Small (<768): Single column Menu with overlay panels for Customer, Categories, and a sticky Summary drawer
 */
export function ResponsivePOSShell({ zones }: Props) {
  const { width } = useViewport();

  const layout = React.useMemo(() => {
    if (width >= 1440) return "desktop" as const;
    if (width >= 1024) return "laptop" as const;
    if (width >= 768) return "tablet" as const;
    return "small" as const;
  }, [width]);

  // Overlay panel state (tablet/small)
  const [showCustomer, setShowCustomer] = React.useState(false);
  const [showCategories, setShowCategories] = React.useState(false);

  // Common container styles + tokens
  const baseContainer: React.CSSProperties = {
    background:
      "linear-gradient(135deg, rgba(15,15,15,0.98) 0%, rgba(25,25,25,0.95) 100%)",
    boxShadow: "var(--pos-shadow, 0 12px 30px -8px rgba(0,0,0,0.6))",
    border: "var(--pos-border, 1px solid rgba(124,93,250,0.15))",
    borderRadius: "var(--pos-panel-radius, 12px)" as any,
    backdropFilter: "blur(10px)",
    minHeight: 0,
    height: "100%",
    position: "relative",
    padding: "var(--pos-padding, 1rem)",
  };

  // Utility wrapper to enforce scroll/overflow contracts on each zone
  const ZoneWrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="min-w-0 min-h-0 overflow-hidden">{children}</div>
  );

  if (layout === "desktop") {
    // 3-column layout when categories is null (Customer | Menu | Summary)
    if (!zones.categories) {
      return (
        <div
          className="grid"
          style={{
            ...baseContainer,
            gap: "var(--pos-gap, 1rem)",
            gridTemplateColumns:
              "var(--pos-col-customer, 300px) 1fr var(--pos-col-summary, 300px)",
          }}
        >
          {/* Customer | Menu | Summary */}
          <ZoneWrap>{zones.customer}</ZoneWrap>
          <ZoneWrap>{zones.menu}</ZoneWrap>
          <ZoneWrap>{zones.summary}</ZoneWrap>
        </div>
      );
    }

    // 4-column layout with categories (Customer | Categories | Menu | Summary)
    return (
      <div
        className="grid"
        style={{
          ...baseContainer,
          gap: "var(--pos-gap, 1rem)",
          gridTemplateColumns:
            "var(--pos-col-customer, 300px) var(--pos-col-categories, 200px) 1fr var(--pos-col-summary, 300px)",
        }}
      >
        {/* Customer | Categories | Menu | Summary */}
        <ZoneWrap>{zones.customer}</ZoneWrap>
        <ZoneWrap>{zones.categories}</ZoneWrap>
        <ZoneWrap>{zones.menu}</ZoneWrap>
        <ZoneWrap>{zones.summary}</ZoneWrap>
      </div>
    );
  }

  if (layout === "laptop") {
    // 3-column layout when categories is null
    if (!zones.categories) {
      return (
        <div
          className="grid"
          style={{
            ...baseContainer,
            gap: "var(--pos-gap, 1rem)",
            gridTemplateColumns:
              "minmax(260px, var(--pos-col-customer, 300px)) 1fr minmax(260px, var(--pos-col-summary, 300px))",
          }}
        >
          <ZoneWrap>{zones.customer}</ZoneWrap>
          <ZoneWrap>{zones.menu}</ZoneWrap>
          <ZoneWrap>{zones.summary}</ZoneWrap>
        </div>
      );
    }

    // 4-column layout with categories
    return (
      <div
        className="grid"
        style={{
          ...baseContainer,
          gap: "var(--pos-gap, 1rem)",
          // Slightly compress fixed columns to avoid horizontal pressure
          gridTemplateColumns:
            "minmax(260px, var(--pos-col-customer, 300px)) minmax(160px, var(--pos-col-categories, 200px)) 1fr minmax(260px, var(--pos-col-summary, 300px))",
        }}
      >
        <ZoneWrap>{zones.customer}</ZoneWrap>
        <ZoneWrap>{zones.categories}</ZoneWrap>
        <ZoneWrap>{zones.menu}</ZoneWrap>
        <ZoneWrap>{zones.summary}</ZoneWrap>
      </div>
    );
  }

  if (layout === "tablet") {
    return (
      <div style={{ ...baseContainer }}>
        {/* Top action bar for toggles */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-300">Tablet layout</div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded-md text-sm"
              style={{
                background:
                  "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(91,33,182,0.2))",
                border: "1px solid rgba(124,58,237,0.25)",
                borderRadius: "var(--pos-card-radius, 8px)",
              }}
              onClick={() => setShowCustomer((v) => !v)}
            >
              {showCustomer ? "Hide Customer" : "Customer"}
            </button>
            <button
              className="px-3 py-1 rounded-md text-sm"
              style={{
                background:
                  "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(91,33,182,0.2))",
                border: "1px solid rgba(124,58,237,0.25)",
                borderRadius: "var(--pos-card-radius, 8px)",
              }}
              onClick={() => setShowCategories((v) => !v)}
            >
              {showCategories ? "Hide Categories" : "Categories"}
            </button>
          </div>
        </div>

        {/* Two-column base: Menu | Summary */}
        <div
          className="grid"
          style={{
            gap: "var(--pos-gap, 1rem)",
            gridTemplateColumns: "1fr minmax(260px, var(--pos-col-summary, 300px))",
            minHeight: 0,
            height: "calc(100% - 36px)",
          }}
        >
          <ZoneWrap>{zones.menu}</ZoneWrap>
          <ZoneWrap>{zones.summary}</ZoneWrap>
        </div>

        {/* Overlays */}
        {showCustomer && (
          <div
            className="absolute top-4 left-4 w-[320px] max-h-[85%] overflow-hidden z-40"
            style={{
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "var(--pos-panel-radius, 12px)",
              background: "rgba(20,20,20,0.98)",
            }}
          >
            <ZoneWrap>{zones.customer}</ZoneWrap>
          </div>
        )}
        {zones.categories && showCategories && (
          <div
            className="absolute top-4 left-4 w-[260px] max-h-[85%] overflow-hidden z-40"
            style={{
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "var(--pos-panel-radius, 12px)",
              background: "rgba(20,20,20,0.98)",
            }}
          >
            <ZoneWrap>{zones.categories}</ZoneWrap>
          </div>
        )}
      </div>
    );
  }

  // small
  return (
    <div style={{ ...baseContainer, padding: "var(--pos-padding, 1rem)" }}>
      {/* Action bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-300">Compact layout</div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded-md text-sm"
            style={{
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(91,33,182,0.2))",
              border: "1px solid rgba(124,58,237,0.25)",
              borderRadius: "var(--pos-card-radius, 8px)",
            }}
            onClick={() => setShowCustomer((v) => !v)}
          >
            Customer
          </button>
          <button
            className="px-3 py-1 rounded-md text-sm"
            style={{
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(91,33,182,0.2))",
              border: "1px solid rgba(124,58,237,0.25)",
              borderRadius: "var(--pos-card-radius, 8px)",
            }}
            onClick={() => setShowCategories((v) => !v)}
          >
            Categories
          </button>
        </div>
      </div>

      {/* Single column menu */}
      <div className="min-h-0" style={{ height: "calc(100% - 44px)" }}>
        <ZoneWrap>{zones.menu}</ZoneWrap>
      </div>

      {/* Sticky summary drawer */}
      <div className="fixed bottom-4 right-4 left-4 max-w-[720px] mx-auto z-30">
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(20,20,20,0.98)",
            borderRadius: "var(--pos-panel-radius, 12px)",
          }}
        >
          <ZoneWrap>{zones.summary}</ZoneWrap>
        </div>
      </div>

      {/* Overlays */}
      {showCustomer && (
        <div
          className="fixed inset-0 bg-black/60 flex items-start justify-center p-4 z-50"
          onClick={() => setShowCustomer(false)}
        >
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <ZoneWrap>{zones.customer}</ZoneWrap>
          </div>
        </div>
      )}
      {showCategories && (
        <div
          className="fixed inset-0 bg-black/60 flex items-start justify-center p-4 z-50"
          onClick={() => setShowCategories(false)}
        >
          <div className="w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
            <ZoneWrap>{zones.categories}</ZoneWrap>
          </div>
        </div>
      )}
    </div>
  );
}
