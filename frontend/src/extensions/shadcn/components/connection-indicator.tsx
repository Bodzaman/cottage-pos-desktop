import * as React from "react";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, Cloud, CloudOff, Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

const connectionIndicatorVariants = cva(
  "inline-flex items-center gap-1.5 text-xs font-medium rounded-full transition-all duration-200",
  {
    variants: {
      status: {
        online: "text-green-600 dark:text-green-400",
        offline: "text-red-600 dark:text-red-400",
        syncing: "text-amber-600 dark:text-amber-400",
        connecting: "text-blue-600 dark:text-blue-400",
      },
      size: {
        sm: "text-xs",
        default: "text-sm",
      },
      background: {
        none: "",
        pill: "px-2 py-0.5",
      },
    },
    compoundVariants: [
      {
        status: "online",
        background: "pill",
        className: "bg-green-100 dark:bg-green-900/30",
      },
      {
        status: "offline",
        background: "pill",
        className: "bg-red-100 dark:bg-red-900/30",
      },
      {
        status: "syncing",
        background: "pill",
        className: "bg-amber-100 dark:bg-amber-900/30",
      },
      {
        status: "connecting",
        background: "pill",
        className: "bg-blue-100 dark:bg-blue-900/30",
      },
    ],
    defaultVariants: {
      status: "online",
      size: "default",
      background: "none",
    },
  }
);

export type ConnectionStatus = "online" | "offline" | "syncing" | "connecting";

const iconMap = {
  online: Wifi,
  offline: WifiOff,
  syncing: Cloud,
  connecting: Loader2,
};

const defaultLabels = {
  online: "Online",
  offline: "Offline",
  syncing: "Syncing",
  connecting: "Connecting",
};

export interface ConnectionIndicatorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof connectionIndicatorVariants> {
  status?: ConnectionStatus;
  showLabel?: boolean;
  customLabel?: string;
  showDot?: boolean;
  iconType?: "wifi" | "cloud";
}

const ConnectionIndicator = React.forwardRef<
  HTMLDivElement,
  ConnectionIndicatorProps
>(
  (
    {
      className,
      status = "online",
      size,
      background,
      showLabel = true,
      customLabel,
      showDot = false,
      iconType = "wifi",
      ...props
    },
    ref
  ) => {
    const getIcon = () => {
      if (showDot) {
        return (
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              status === "online" && "bg-green-500",
              status === "offline" && "bg-red-500",
              status === "syncing" && "bg-amber-500 animate-pulse",
              status === "connecting" && "bg-blue-500 animate-pulse"
            )}
          />
        );
      }

      if (iconType === "cloud") {
        const Icon = status === "offline" ? CloudOff : Cloud;
        return (
          <Icon
            className={cn(
              "h-3.5 w-3.5",
              status === "syncing" && "animate-pulse",
              status === "connecting" && "animate-pulse"
            )}
          />
        );
      }

      const Icon = iconMap[status];
      return (
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            status === "connecting" && "animate-spin"
          )}
        />
      );
    };

    const label = customLabel || defaultLabels[status];

    return (
      <div
        ref={ref}
        role="status"
        aria-label={`Connection status: ${label}`}
        className={cn(
          connectionIndicatorVariants({ status, size, background }),
          className
        )}
        {...props}
      >
        {getIcon()}
        {showLabel && <span>{label}</span>}
      </div>
    );
  }
);
ConnectionIndicator.displayName = "ConnectionIndicator";

// Hook for tracking browser online/offline status
export function useConnectionStatus() {
  const [status, setStatus] = React.useState<ConnectionStatus>(
    navigator.onLine ? "online" : "offline"
  );

  React.useEffect(() => {
    const handleOnline = () => setStatus("online");
    const handleOffline = () => setStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const setConnecting = React.useCallback(() => setStatus("connecting"), []);
  const setSyncing = React.useCallback(() => setStatus("syncing"), []);
  const setOnline = React.useCallback(() => setStatus("online"), []);
  const setOffline = React.useCallback(() => setStatus("offline"), []);

  return {
    status,
    isOnline: status === "online",
    isOffline: status === "offline",
    isSyncing: status === "syncing",
    isConnecting: status === "connecting",
    setConnecting,
    setSyncing,
    setOnline,
    setOffline,
  };
}

export { ConnectionIndicator };
