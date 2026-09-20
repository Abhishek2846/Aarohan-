import React from "react";
import type { LucideIcon } from "lucide-react";
import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  description?: React.ReactNode;
  title?: React.ReactNode;
  icon?: LucideIcon;
  compact?: boolean;
}

export function EmptyState({
  className,
  description,
  children,
  title,
  icon: Icon = SearchX,
  compact = false,
  ...props
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-2 text-center border border-[#d8d3c9] rounded-xl bg-[#fffdf8] text-[#68655e]",
        compact
          ? "px-4 py-4 text-xs border-dashed"
          : "px-6 py-10 text-sm",
        className
      )}
      {...props}
    >
      <span
        className="flex items-center justify-center p-3 rounded-xl bg-[#ef5b2a]/10 border border-[#ef5b2a]/20 text-[#ef5b2a]"
        aria-hidden="true"
      >
        <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} strokeWidth={1.8} />
      </span>
      {title ? <p className="font-bold text-[#171716] tracking-tight">{title}</p> : null}
      <p className="text-[#68655e] text-xs max-w-xl leading-relaxed">{description ?? children}</p>
    </div>
  );
}
