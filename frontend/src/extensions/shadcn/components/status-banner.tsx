import * as React from "react";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  Loader2,
} from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

const statusBannerVariants = cva(
  "flex items-center gap-3 px-4 py-2 text-sm font-medium transition-all duration-300",
  {
    variants: {
      variant: {
        info: "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border-b border-blue-100 dark:border-blue-900",
        warning:
          "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-b border-amber-100 dark:border-amber-900",
        error:
          "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200 border-b border-red-100 dark:border-red-900",
        success:
          "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200 border-b border-green-100 dark:border-green-900",
        loading:
          "bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800",
      },
      position: {
        top: "fixed top-0 left-0 right-0 z-50",
        inline: "relative w-full",
      },
    },
    defaultVariants: {
      variant: "info",
      position: "inline",
    },
  }
);

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
  loading: Loader2,
};

export interface StatusBannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBannerVariants> {
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const StatusBanner = React.forwardRef<HTMLDivElement, StatusBannerProps>(
  (
    {
      className,
      variant = "info",
      position,
      message,
      dismissible = false,
      onDismiss,
      action,
      ...props
    },
    ref
  ) => {
    const [dismissed, setDismissed] = React.useState(false);

    if (dismissed) return null;

    const Icon = iconMap[variant || "info"];
    const isLoading = variant === "loading";

    const handleDismiss = () => {
      setDismissed(true);
      onDismiss?.();
    };

    return (
      <div
        ref={ref}
        role={variant === "error" ? "alert" : "status"}
        aria-live={variant === "error" ? "assertive" : "polite"}
        className={cn(statusBannerVariants({ variant, position }), className)}
        {...props}
      >
        <Icon
          className={cn("h-4 w-4 flex-shrink-0", isLoading && "animate-spin")}
          aria-hidden="true"
        />
        <span className="flex-1">{message}</span>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="font-semibold underline underline-offset-2 hover:no-underline transition-all"
          >
            {action.label}
          </button>
        )}
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 hover:opacity-70 transition-opacity rounded"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
StatusBanner.displayName = "StatusBanner";

// Hook for managing status banner state
export type StatusBannerState = {
  visible: boolean;
  message: string;
  variant: "info" | "warning" | "error" | "success" | "loading";
};

export function useStatusBanner(initialState?: Partial<StatusBannerState>) {
  const [state, setState] = React.useState<StatusBannerState>({
    visible: false,
    message: "",
    variant: "info",
    ...initialState,
  });

  const show = React.useCallback(
    (
      message: string,
      variant: StatusBannerState["variant"] = "info"
    ) => {
      setState({ visible: true, message, variant });
    },
    []
  );

  const hide = React.useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const showLoading = React.useCallback((message: string) => {
    setState({ visible: true, message, variant: "loading" });
  }, []);

  const showSuccess = React.useCallback((message: string) => {
    setState({ visible: true, message, variant: "success" });
  }, []);

  const showError = React.useCallback((message: string) => {
    setState({ visible: true, message, variant: "error" });
  }, []);

  const showWarning = React.useCallback((message: string) => {
    setState({ visible: true, message, variant: "warning" });
  }, []);

  return {
    ...state,
    show,
    hide,
    showLoading,
    showSuccess,
    showError,
    showWarning,
  };
}

export { StatusBanner };
