/**
 * AllergenBadge - Displays a visual indicator for allergen status.
 *
 * "contains"    -> red circle with X
 * "may_contain" -> amber circle with !
 * null/absent   -> grey dash
 */

interface AllergenBadgeProps {
  status: "contains" | "may_contain" | null | undefined;
  /** Optional: show text label alongside the indicator */
  showLabel?: boolean;
  /** Size variant */
  size?: "sm" | "md";
}

const config = {
  contains: {
    bg: "bg-red-600",
    text: "text-white",
    symbol: "\u2715",
    label: "Contains",
    ring: "ring-red-500/30",
  },
  may_contain: {
    bg: "bg-amber-500",
    text: "text-white",
    symbol: "!",
    label: "May contain",
    ring: "ring-amber-400/30",
  },
  none: {
    bg: "bg-white/10",
    text: "text-white/30",
    symbol: "\u2014",
    label: "Free from",
    ring: "",
  },
} as const;

export function AllergenBadge({ status, showLabel = false, size = "sm" }: AllergenBadgeProps) {
  const key = status === "contains" || status === "may_contain" ? status : "none";
  const c = config[key];

  const sizeClasses = size === "sm" ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`${sizeClasses} rounded-full ${c.bg} ${c.text} ${c.ring} ring-2 inline-flex items-center justify-center font-bold select-none shrink-0`}
        aria-label={c.label}
      >
        {c.symbol}
      </span>
      {showLabel && (
        <span className="text-xs text-white/60">{c.label}</span>
      )}
    </span>
  );
}
