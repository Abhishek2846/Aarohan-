"use client";

import React, { useState } from "react";
import { DataQualityScore } from "@/types/case";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Award,
  Layers,
  FileCheck2,
  Users,
  Camera,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface QualityDimension {
  name: string;
  score: number;
  weight: number;
  status: "PASS" | "WARNING" | "FAIL";
  description: string;
  icon: any;
}

interface DataQualityScoreIndicatorProps {
  scoreData?: DataQualityScore;
  className?: string;
  onRemediate?: (item: string) => void;
}

const DEFAULT_DIMENSIONS: QualityDimension[] = [
  {
    name: "Cadastral Geometry Integrity",
    score: 96,
    weight: 25,
    status: "PASS",
    description: "Polygon closure error < 0.002%, zero self-intersection or illegal overlaps.",
    icon: Layers,
  },
  {
    name: "Revenue Record (RoR) Concordance",
    score: 92,
    weight: 25,
    status: "PASS",
    description: "Jamabandi Khata extent variance within ±0.4% of DGPS boundary survey.",
    icon: FileCheck2,
  },
  {
    name: "Beneficiary KYC & PFMS Match",
    score: 100,
    weight: 20,
    status: "PASS",
    description: "100% beneficiaries mapped with active NPCI Aadhaar bank bridge.",
    icon: Users,
  },
  {
    name: "Field DGPS Photo Evidence",
    score: 85,
    weight: 15,
    status: "WARNING",
    description: "3 of 4 corners documented with tamper-evident civic watermark telemetry.",
    icon: Camera,
  },
  {
    name: "Cryptographic Audit Ledger",
    score: 100,
    weight: 15,
    status: "PASS",
    description: "All gazette filings and award enactments sealed with SHA-256 blocks.",
    icon: ShieldCheck,
  },
];

export function DataQualityScoreIndicator({
  scoreData,
  className,
  onRemediate,
}: DataQualityScoreIndicatorProps) {
  const [dimensions] = useState<QualityDimension[]>(DEFAULT_DIMENSIONS);

  const overallScore = scoreData?.score ?? 94;
  const passedChecks = scoreData?.passedChecks ?? 18;
  const totalChecks = scoreData?.totalChecks ?? 19;
  const missingItems = scoreData?.missingItems ?? [
    "Field Photo Corner #4 pending surveyor telemetry stamp",
  ];

  const getGrade = (s: number) => {
    if (s >= 90) return { grade: "A+", label: "Exemplary", color: "text-emerald-600 bg-emerald-50 border-emerald-300" };
    if (s >= 80) return { grade: "A", label: "Good Compliance", color: "text-blue-600 bg-blue-50 border-blue-300" };
    if (s >= 70) return { grade: "B", label: "Moderate Risk", color: "text-amber-600 bg-amber-50 border-amber-300" };
    return { grade: "C", label: "Critical Discrepancy", color: "text-rose-600 bg-rose-50 border-rose-300" };
  };

  const gradeInfo = getGrade(overallScore);

  return (
    <Card className={cn("border border-slate-200 bg-white dark:bg-slate-900 shadow-sm", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <span>Multi-Dimensional Data Quality Score</span>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-bold border",
                    gradeInfo.color
                  )}
                >
                  Grade {gradeInfo.grade} • {gradeInfo.label}
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Statutory prerequisite evaluation before gazette notification and award enactment
              </CardDescription>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {overallScore}
            </span>
            <span className="text-xs text-slate-400 font-bold">/100</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-xs">
        {/* Composite Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Overall Statutory Completeness</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {passedChecks} of {totalChecks} Criteria Satisfied ({overallScore}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${overallScore}%` }}
            />
          </div>
        </div>

        {/* 5 Dimensional Breakdown Bars */}
        <div className="space-y-2 pt-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Criteria Decomposition
          </span>
          <div className="space-y-2">
            {dimensions.map((dim, idx) => {
              const Icon = dim.icon;
              return (
                <div
                  key={idx}
                  className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <Icon className="h-3.5 w-3.5 text-blue-600" />
                      {dim.name}
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {dim.score}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        dim.score >= 90
                          ? "bg-emerald-500"
                          : dim.score >= 80
                          ? "bg-blue-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actionable Missing Prerequisites Checklist */}
        {missingItems.length > 0 ? (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Missing Prerequisites ({missingItems.length})
              </span>
            </div>
            <ul className="text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
              {missingItems.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between gap-2">
                  <span>• {item}</span>
                  <button
                    onClick={() => onRemediate?.(item)}
                    className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Fix</span>
                    <ArrowUpRight className="h-2.5 w-2.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>All statutory and cadastral data criteria validated for stage transition.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
