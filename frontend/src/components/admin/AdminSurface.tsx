import React from "react";
import { InternalTheme } from "../../utils/InternalDesignSystem";

type SurfaceVariant = "panel" | "card" | "inset" | "toolbar";

interface AdminSurfaceProps {
  variant?: SurfaceVariant;
  className?: string;
  children: React.ReactNode;
  as?: "div" | "section" | "aside";
}

const variantMap: Record<SurfaceVariant, string> = {
  panel: InternalTheme.classes.surfacePanel,
  card: InternalTheme.classes.surfaceCard,
  inset: InternalTheme.classes.surfaceInset,
  toolbar: InternalTheme.classes.surfaceToolbar,
};

export function AdminSurface({
  variant = "panel",
  className = "",
  children,
  as: Component = "div",
}: AdminSurfaceProps) {
  return (
    <Component className={`${variantMap[variant]} ${className}`}>
      {children}
    </Component>
  );
}
