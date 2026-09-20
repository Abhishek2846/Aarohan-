import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef5b2a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ea] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#171716] text-[#fffdf8] hover:bg-[#2d2d2c] font-bold shadow-sm",
        destructive:
          "bg-rose-600 text-white shadow-sm hover:bg-rose-700 font-semibold",
        outline:
          "border border-[#d8d3c9] bg-[#fffdf8] text-[#171716] shadow-sm hover:bg-[#f4f1ea] hover:border-[#171716]/40",
        secondary:
          "border border-[#d8d3c9] bg-[#eae6dc] text-[#171716] shadow-sm hover:bg-[#d8d3c9]",
        ghost:
          "text-[#68655e] hover:bg-[#eae6dc]/70 hover:text-[#171716]",
        link: "text-[#ef5b2a] underline-offset-4 hover:underline font-semibold",
        civic:
          "bg-[#ef5b2a] text-white hover:bg-[#d94e20] font-bold shadow-sm shadow-[#ef5b2a]/20",
        saffron:
          "bg-[#ef5b2a] text-white hover:bg-[#d94e20] font-bold shadow-sm shadow-[#ef5b2a]/20",
        emerald: "bg-[#15803d] text-white hover:bg-[#166534] shadow-sm font-semibold",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
