"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/common/stat-card";
import { formatINR, formatCompactINR, formatAreaHectares } from "@/lib/utils";
import {
  TrendingUp,
  AlertTriangle,
  Building2,
  MapPin,
  Clock,
  Compass,
  ArrowUpRight,
  FileSpreadsheet,
} from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { useAnalyticsQuery } from "@/hooks/queries/use-bhoomi-queries";
import { PortfolioRiskOverview } from "@/components/ai/portfolio-risk-overview";

export default function MinistryAnalyticsPage() {
  const { lang } = useI18n();
  const isHi = lang === "hi";
  const { data: analytics } = useAnalyticsQuery();
  const overview = analytics?.overview as {
    totalCorridors?: number;
    gatiShaktiPriorityCorridors?: number;
    totalCompensationDisbursedINR?: number;
    totalBeneficiaries?: number;
    highDelayRiskProjectsCount?: number;
  } | undefined;
  const statePerformance = (analytics?.stateBenchmarks || []) as Array<{
    state: string;
    activeCases: number;
    totalLandHa: number;
    avgDaysToAward: number;
    slaCompliance: string;
  }>;
  const topBottlenecks = (analytics?.bottlenecks || []) as Array<{
    stage: string;
    avgDelay: string;
    impactedProjects: number;
    mitigation: string;
  }>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#171716]">
            {isHi ? "केंद्रीय मंत्रालय राष्ट्रीय डैशबोर्ड" : "Central Ministry National Dashboard"}
          </h1>
          <p className="text-xs text-[#68655e]">
            {isHi
              ? "समस्त राज्यों की परियोजना गति, बाधा विश्लेषण एवं समय पर कार्य पूरा करने की निगरानी।"
              : "Interstate infrastructure acquisition throughput, bottleneck diagnostics, and delay-risk forecasting."}
          </p>
        </div>

        <Button className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm font-bold text-xs h-9 flex items-center gap-1.5">
          <FileSpreadsheet className="h-4 w-4" />
          <span>{isHi ? "अंतर-मंत्रालयी कैबिनेट नोट डाउनलोड करें" : "Export Inter-Ministerial Cabinet Note"}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="National Corridors"
          value={String(overview?.totalCorridors ?? 0)}
          subtext={`${overview?.gatiShaktiPriorityCorridors ?? 0} GatiShakti Priority Corridors`}
          icon={Building2}
          variant="amber"
        />
        <StatCard
          title="Avg. Acquisition Cycle"
          value="124 Days"
          subtext="-38 Days faster than 2024 benchmark"
          trend={{ value: "-23% timeline", isPositive: true }}
          icon={Clock}
          variant="green"
        />
        <StatCard
          title="High Delay-Risk Projects"
          value={String(overview?.highDelayRiskProjectsCount ?? 0)}
          subtext="Under active escalation with Chief Secretaries"
          trend={{ value: "2 critical", isPositive: false }}
          icon={AlertTriangle}
          variant="rose"
        />
        <StatCard
          title="Total Outlay Disbursed"
          value={formatCompactINR(overview?.totalCompensationDisbursedINR ?? 0)}
          subtext={`Direct to ${(overview?.totalBeneficiaries ?? 0).toLocaleString()}+ Beneficiaries`}
          icon={TrendingUp}
          variant="amber"
        />
      </div>

      {/* National Portfolio Delay Risk Intelligence & Prioritized Queue */}
      <PortfolioRiskOverview />

      {/* Interstate Comparison */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Interstate Acquisition Performance & Timeline Compliance</CardTitle>
          <CardDescription className="text-xs">
            Benchmarking state revenue departments under the unified Aarohan framework.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statePerformance.map((st) => (
              <div
                key={st.state}
                className="p-4 rounded-xl border bg-[#f4f1ea] border-[#d8d3c9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-[#171716]">{st.state}</span>
                  <p className="text-[#68655e] text-[11px]">
                    {st.activeCases} Active Cases • {formatAreaHectares(st.totalLandHa)} Land Under Acquisition
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[10px] text-[#68655e] uppercase font-bold">Avg. Cycle</p>
                    <p className="font-bold text-[#171716]">{st.avgDaysToAward} Days</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#68655e] uppercase font-bold">Timeline Compliance</p>
                    <Badge variant="success" className="text-[10px]">
                      {st.slaCompliance}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottlenecks Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Compass className="h-4 w-4 text-rose-600" />
            <span>Identified Structural Bottlenecks & Policy Mitigations</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Automated activity monitoring pinpointing administrative delays across state revenue offices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {topBottlenecks.map((b, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-rose-100 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-900 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#171716]">{b.stage}</span>
                <Badge variant="danger" className="text-[10px]">
                  {b.avgDelay}
                </Badge>
              </div>
              <p className="text-[#171716] text-[11px]">
                Impacts <strong>{b.impactedProjects} major linear corridors</strong>.
              </p>
              <div className="pt-1 text-[11px] text-[#ef5b2a] font-medium">
                👉 Recommended Action: {b.mitigation}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
