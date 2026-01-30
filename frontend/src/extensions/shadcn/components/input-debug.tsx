import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const InputDebug = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base sm:text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        onPaste={(e) => {
          console.log('🎯 [InputDebug] PASTE EVENT FIRED!', {
            clipboardData: e.clipboardData?.getData('text'),
            target: e.target,
            defaultPrevented: e.defaultPrevented
          });
        }}
        onCopy={(e) => {
          console.log('📋 [InputDebug] COPY EVENT FIRED!', {
            target: e.target,
            defaultPrevented: e.defaultPrevented
          });
        }}
        onCut={(e) => {
          console.log('✂️ [InputDebug] CUT EVENT FIRED!', {
            target: e.target,
            defaultPrevented: e.defaultPrevented
          });
        }}
        {...props}
      />
    );
  },
);
InputDebug.displayName = "InputDebug";

export { InputDebug };
