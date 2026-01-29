import * as React from "react";
import { Button, ButtonProps, buttonVariants } from "./button";
import { cn } from "@/lib/utils";
import { Loader2, Check, X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

export type ButtonState = "idle" | "loading" | "success" | "error";

const stateStyles = cva("transition-all duration-200", {
  variants: {
    state: {
      idle: "",
      loading: "cursor-wait",
      success: "bg-green-600 hover:bg-green-600 text-white",
      error: "bg-destructive hover:bg-destructive text-destructive-foreground",
    },
  },
  defaultVariants: {
    state: "idle",
  },
});

export interface AnimatedButtonProps extends ButtonProps {
  state?: ButtonState;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  resetDelay?: number; // ms to wait before resetting to idle after success/error
  onReset?: () => void;
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      className,
      children,
      state = "idle",
      loadingText,
      successText = "Done",
      errorText = "Failed",
      resetDelay = 2000,
      onReset,
      disabled,
      variant,
      ...props
    },
    ref
  ) => {
    const [internalState, setInternalState] = React.useState<ButtonState>(state);

    // Sync with external state
    React.useEffect(() => {
      setInternalState(state);
    }, [state]);

    // Auto-reset after success/error
    React.useEffect(() => {
      if (internalState === "success" || internalState === "error") {
        const timer = setTimeout(() => {
          setInternalState("idle");
          onReset?.();
        }, resetDelay);
        return () => clearTimeout(timer);
      }
    }, [internalState, resetDelay, onReset]);

    const isDisabled = disabled || internalState === "loading";

    const renderContent = () => {
      switch (internalState) {
        case "loading":
          return (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {loadingText || children}
            </>
          );
        case "success":
          return (
            <>
              <Check className="mr-2 h-4 w-4" />
              {successText}
            </>
          );
        case "error":
          return (
            <>
              <X className="mr-2 h-4 w-4" />
              {errorText}
            </>
          );
        default:
          return children;
      }
    };

    // Override variant for success state
    const effectiveVariant =
      internalState === "success" ? "default" : variant;

    return (
      <Button
        ref={ref}
        className={cn(stateStyles({ state: internalState }), className)}
        disabled={isDisabled}
        variant={effectiveVariant}
        {...props}
      >
        {renderContent()}
      </Button>
    );
  }
);
AnimatedButton.displayName = "AnimatedButton";

// Hook for managing button state with async operations
export function useAnimatedButton() {
  const [state, setState] = React.useState<ButtonState>("idle");

  const execute = React.useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T | undefined> => {
      setState("loading");
      try {
        const result = await operation();
        setState("success");
        return result;
      } catch (error) {
        setState("error");
        throw error;
      }
    },
    []
  );

  const reset = React.useCallback(() => {
    setState("idle");
  }, []);

  return { state, setState, execute, reset };
}

export { AnimatedButton };
