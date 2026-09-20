"use client";

import React, { useState } from "react";
import { DelayRiskEvaluation } from "@/types/case";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Activity,
  BrainCircuit,
  Clock,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ShapFactor {
  factor: string;
  weight: number; // e.g. 34 for +34%
  impactDays: number;
  category: "OBJECTIONS" | "CADASTRAL" | "LITIGATION" | "CLEARANCE" | "MITIGATION";
  isMitigating?: boolean;
  description: string;
}

interface ExplainableDelayRiskProps {
  delayRisk?: DelayRiskEvaluation;
  caseNumber?: string;
  onActionClick?: (action: string) => void;
  className?: string;
}

const DEFAULT_FACTORS: ShapFactor[] = [
  {
    factor: "Section 15 Public Objections Hearing Backlog",
    weight: 34,
    impactDays: 18,
    category: "OBJECTIONS",
    isMitigating: false,
    description: "14 unadjudicated boundary objections pending with the Sub-Divisional Magistrate.",
  },
  {
    factor: "Cadastral RoR (Jamabandi) vs GIS Area Variance",
    weight: 26,
    impactDays: 14,
    category: "CADASTRAL",
    isMitigating: false,
    description: "4 parcels exhibit > 2.4% geometric discrepancy between revenue passbook and DGPS boundary.",
  },
  {
    factor: "Civil Court Interim Injunction on Adjacent Alignment",
    weight: 22,
    impactDays: 12,
    category: "LITIGATION",
    isMitigating: false,
    description: "Writ Petition #WP-2026/812 pending in High Court; stay granted on parcel #215.",
  },
  {
    factor: "MoEFCC Forest Clearance Stage-II Awaited",
    weight: 18,
    impactDays: 9,
    category: "CLEARANCE",
    isMitigating: false,
    description: "Compensatory afforestation scheme verification awaiting Regional Office clearance.",
  },
  {
    factor: "Fast-Track Collector Conciliation Sittings",
    weight: -15,
    impactDays: -8,
    category: "MITIGATION",
    isMitigating: true,
    description: "Special Gram Sabha settlement convened, expediting 8 land parcel consents.",
  },
];

export function ExplainableDelayRisk({
  delayRisk,
  caseNumber = "CASE-2026-001",
  onActionClick,
  className,
}: ExplainableDelayRiskProps) {
  const [factors] = useState<ShapFactor[]>(DEFAULT_FACTORS);
  const [selectedFactor, setSelectedFactor] = useState<ShapFactor | null>(null);
  const [executedActions, setExecutedActions] = useState<string[]>([]);

  const score = delayRisk?.score ?? 78;
  const level = delayRisk?.level ?? "HIGH";
  const reasons = delayRisk?.reasons ?? [
    "14 pending Section 15 objections under SDM review",
    "Cadastral boundary overlap detected in Survey #142/2A",
    "Section 11 notice statutory lapse approaching in 14 days",
  ];
  const recommendedActions = delayRisk?.recommendedActions ?? [
    "Schedule Special Gram Sabha conciliation sitting",
    "Dispatch DGPS surveyor for joint re-demarcation",
    "Deploy Additional Land Acquisition Hearing Officer",
  ];

  const handleAction = (act: string) => {
    if (!executedActions.includes(act)) {
      setExecutedActions((prev) => [...prev, act]);
    }
    if (onActionClick) {
      onActionClick(act);
    } else {
      alert(`Statutory Intervention Dispatched: "${act}". Work order logged with Central LAO.`);
    }
  };

  const isCritical = level === "CRITICAL" || level === "HIGH";

  return (
    <Card
      className={cn(
        "border shadow-sm transition-all",
        isCritical
          ? "border-rose-200 bg-gradient-to-br from-rose-50/40 via-white to-orange-50/20 dark:from-rose-950/20 dark:to-slate-900"
          : "border-slate-200 bg-white dark:bg-slate-900",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <span>Explainable Delay-Risk & SHAP Factor Engine</span>
                <Badge
                  variant={isCritical ? "danger" : "warning"}
                  className="text-[10px] font-mono"
                >
                  {level} RISK ({score}/100)
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Predictive AI model trained on 1,840 statutory acquisition corridors • 94.2% confidence
              </CardDescription>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <Clock className="h-3.5 w-3.5 text-rose-600" />
              <span className="font-mono font-bold text-sm text-rose-700 dark:text-rose-400">
                +42 Days Over SLA
              </span>
            </div>
            <span className="text-[10px] text-slate-500">Statutory SLA Expiry in 14 Days</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-xs">
        {/* SHAP Factor Decomposition Bars */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
              Root-Cause Contributing Weights (SHAP Decomposition)
            </span>
            <span className="text-[10px] text-slate-400">Click any factor to inspect mitigation</span>
          </div>

          <div className="space-y-2">
            {factors.map((item, idx) => {
              const isPositive = item.weight > 0;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedFactor(item)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    selectedFactor?.factor === item.factor
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                      : "border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      {isPositive ? (
                        <TrendingUp className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      )}
                      {item.factor}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        isPositive ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {isPositive ? `+${item.weight}%` : `${item.weight}%`} ({item.impactDays > 0 ? `+${item.impactDays}d` : `${item.impactDays}d`})
                    </span>
                  </div>

                  {/* Horizontal visual bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isPositive ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.abs(item.weight) * 2}%` }}
                    />
                  </div>

                  {selectedFactor?.factor === item.factor && (
                    <p className="mt-2 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Prescriptive Interventions & Actions */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
              Prescriptive Administrative Interventions
            </span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Automated Recommendation
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {recommendedActions.map((action, idx) => {
              const isDone = executedActions.includes(action);
              return (
                <Button
                  key={idx}
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(action)}
                  disabled={isDone}
                  className={`h-7 text-xs flex items-center gap-1.5 ${
                    isDone
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : "bg-white dark:bg-slate-900 border-blue-200 text-blue-900 dark:text-blue-300 hover:bg-blue-50"
                  }`}
                >
                  {isDone ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>Dispatched</span>
                    </>
                  ) : (
                    <>
                      <span>{action}</span>
                      <ArrowRight className="h-3 w-3 text-blue-600" />
                    </>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
