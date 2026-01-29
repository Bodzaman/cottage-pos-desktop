import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

const inlineErrorVariants = cva(
  "flex items-start gap-2 text-sm rounded-md transition-all duration-200",
  {
    variants: {
      variant: {
        error: "text-destructive",
        warning: "text-amber-600 dark:text-amber-500",
        info: "text-blue-600 dark:text-blue-400",
      },
      size: {
        sm: "text-xs py-1",
        default: "text-sm py-1.5",
        lg: "text-base py-2",
      },
      background: {
        none: "",
        subtle: "",
      },
    },
    compoundVariants: [
      {
        variant: "error",
        background: "subtle",
        className: "bg-destructive/10 px-3",
      },
      {
        variant: "warning",
        background: "subtle",
        className: "bg-amber-500/10 px-3",
      },
      {
        variant: "info",
        background: "subtle",
        className: "bg-blue-500/10 px-3",
      },
    ],
    defaultVariants: {
      variant: "error",
      size: "default",
      background: "none",
    },
  }
);

const iconMap = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export interface InlineErrorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof inlineErrorVariants> {
  message?: string | null;
  showIcon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const InlineError = React.forwardRef<HTMLDivElement, InlineErrorProps>(
  (
    {
      className,
      variant = "error",
      size,
      background,
      message,
      showIcon = true,
      dismissible = false,
      onDismiss,
      children,
      ...props
    },
    ref
  ) => {
    const [dismissed, setDismissed] = React.useState(false);

    // Reset dismissed state when message changes
    React.useEffect(() => {
      if (message) {
        setDismissed(false);
      }
    }, [message]);

    const content = message || children;

    if (!content || dismissed) {
      return null;
    }

    const Icon = iconMap[variant || "error"];

    const handleDismiss = () => {
      setDismissed(true);
      onDismiss?.();
    };

    return (
      <div
        ref={ref}
        role={variant === "error" ? "alert" : "status"}
        aria-live={variant === "error" ? "assertive" : "polite"}
        className={cn(
          inlineErrorVariants({ variant, size, background }),
          className
        )}
        {...props}
      >
        {showIcon && (
          <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
        )}
        <span className="flex-1">{content}</span>
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-shrink-0 p-0.5 hover:opacity-70 transition-opacity"
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }
);
InlineError.displayName = "InlineError";

// Hook for managing inline error state
export function useInlineError() {
  const [error, setError] = React.useState<string | null>(null);

  const showError = React.useCallback((message: string) => {
    setError(message);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  // Clear error after a delay
  const showErrorTimed = React.useCallback(
    (message: string, duration = 5000) => {
      setError(message);
      const timer = setTimeout(() => setError(null), duration);
      return () => clearTimeout(timer);
    },
    []
  );

  return { error, showError, clearError, showErrorTimed };
}

// Convenience component for form field errors
export interface FieldErrorProps {
  error?: string | null;
  className?: string;
}

const FieldError = React.forwardRef<HTMLDivElement, FieldErrorProps>(
  ({ error, className }, ref) => {
    if (!error) return null;

    return (
      <InlineError
        ref={ref}
        message={error}
        size="sm"
        className={cn("mt-1", className)}
      />
    );
  }
);
FieldError.displayName = "FieldError";

export { InlineError, FieldError };
