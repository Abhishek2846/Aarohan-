import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-xl border border-[#d8d3c9] bg-[#fffdf8] px-3 py-2 text-sm text-[#171716] shadow-sm placeholder:text-[#68655e]/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ef5b2a]/30 focus-visible:border-[#ef5b2a] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
