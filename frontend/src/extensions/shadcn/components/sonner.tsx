import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Theme-aware Toaster component
 *
 * Toast styling respects the page's design system:
 * - Staff pages (.theme-internal): Purple accent (#7C3AED)
 * - Customer pages (.theme-customer): Burgundy accent (#8B1538)
 *
 * CSS variables are defined in index.css:
 * - --toast-accent: RGB values for the theme accent color
 * - --toast-accent-bg: Background color with transparency
 * - --toast-accent-border: Border color with transparency
 * - --toast-accent-text: Solid text color
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#1A1A1A] group-[.toaster]:text-white group-[.toaster]:border group-[.toaster]:border-[var(--toast-accent-border)] group-[.toaster]:shadow-[0_4px_20px_rgba(124,58,237,0.15)]",
          description: "group-[.toast]:text-gray-300",
          actionButton:
            "group-[.toast]:bg-[var(--toast-accent-text)] group-[.toast]:text-white group-[.toast]:hover:opacity-90",
          cancelButton:
            "group-[.toast]:bg-[#2A2A2A] group-[.toast]:text-gray-300 group-[.toast]:hover:bg-[#333333]",
          success:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-[var(--toast-accent-text)]",
          error:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-red-500",
          warning:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-amber-500",
          info:
            "group-[.toaster]:border-l-4 group-[.toaster]:border-l-[var(--toast-accent-text)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
