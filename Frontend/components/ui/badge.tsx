import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-[#ef5b2a] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-[#d8d3c9] bg-[#fffdf8] text-[#171716] shadow-sm",
        secondary:
          "border-[#d8d3c9] bg-[#eae6dc] text-[#68655e]",
        destructive:
          "border-rose-300 bg-rose-50 text-rose-800 font-semibold",
        outline:
          "border-[#d8d3c9] bg-transparent text-[#171716]",
        success: "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold",
        warning:
          "border-amber-300 bg-amber-50 text-amber-900 font-semibold",
        danger: "border-rose-300 bg-rose-50 text-rose-800 font-semibold",
        civic:
          "border-[#ef5b2a]/30 bg-[#ef5b2a]/10 text-[#ef5b2a] font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
