import React from "react";
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[#eae6dc] dark:bg-[#2d2d2c]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
