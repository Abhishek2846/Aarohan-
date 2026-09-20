import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: React.ElementType;
  variant?: "default" | "navy" | "green" | "amber" | "rose";
}

export function StatCard({
  title,
  value,
  subtext,
  trend,
  icon: Icon,
  variant = "default",
}: StatCardProps) {
  const iconVariants = {
    default: "bg-[#f4f1ea] text-[#171716] border border-[#d8d3c9]",
    navy: "bg-[#171716] text-[#fffdf8]",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    amber: "bg-[#ef5b2a]/10 text-[#ef5b2a] border border-[#ef5b2a]/30",
    rose: "bg-rose-50 text-rose-700 border border-rose-200",
  };

  return (
    <Card className="hover:border-[#171716]/40 transition-all rounded-xl bg-[#fffdf8] border border-[#d8d3c9] shadow-[0_1px_3px_rgba(23,23,22,0.04)] h-full flex flex-col justify-between">
      <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full gap-2">
        {/* Header row: Title on left, Icon on right */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#68655e] leading-tight line-clamp-2 min-h-[26px]" title={title}>
            {title}
          </p>
          <div className={cn("p-1.5 rounded-lg flex items-center justify-center shrink-0", iconVariants[variant])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        {/* Primary metric row: Value and Trend badge */}
        <div className="flex items-baseline justify-between gap-1.5 flex-wrap">
          <span className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#171716] leading-none">
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 inline-flex items-center",
                trend.isPositive
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              )}
            >
              {trend.value}
            </span>
          )}
        </div>

        {/* Footer row: Descriptive subtext */}
        {subtext && (
          <p className="text-[11px] text-[#68655e] leading-tight line-clamp-1" title={subtext}>
            {subtext}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
