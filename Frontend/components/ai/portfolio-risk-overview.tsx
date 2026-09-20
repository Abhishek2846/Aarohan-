"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePortfolioRiskQuery } from "@/hooks/queries/use-bhoomi-queries";
import {
  AlertTriangle,
  ShieldAlert,
  Building2,
  TrendingUp,
  Search,
  ExternalLink,
  Layers,
  ArrowRight,
  Flame,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { formatINR, formatAreaHectares } from "@/lib/utils";
import { RiskLevel, PrioritizedProjectItem } from "@/types/ai-delay";

interface PortfolioRiskOverviewProps {
  className?: string;
}

export function PortfolioRiskOverview({ className = "" }: PortfolioRiskOverviewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");

  const { data: summary, isLoading } = usePortfolioRiskQuery();

  if (isLoading) {
    return (
      <Card className={`border-slate-200 dark:border-slate-800 ${className}`}>
        <CardContent className="p-8 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Activity className="w-4 h-4 animate-spin text-amber-500" />
            <span>Aggregating portfolio delay risk & strategic capital exposure...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  const filteredLeaderboard = summary.prioritizedLeaderboard.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sector.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel = selectedLevel === "ALL" || p.riskLevel === selectedLevel;

    return matchesSearch && matchesLevel;
  });

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case "CRITICAL":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30";
      case "HIGH":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30";
      case "MODERATE":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
      case "LOW":
      default:
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-[#fffdf8] dark:bg-[#1a1a19] shadow-xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Active Corridors Monitored
            </p>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {summary.totalActiveProjects}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Avg. Risk: {summary.portfolioAverageDelayProbPct}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Multimodal Infrastructure Pipeline</p>
          </CardContent>
        </Card>

        <Card className="border-red-500/30 bg-red-500/5 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase font-bold text-red-700 dark:text-red-400 tracking-wider">
                &gt;90-Day Delay Breach Likelihood
              </p>
              <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-red-700 dark:text-red-400 font-mono">
                {summary.projectsCrossing90DayThreshold}{" "}
                <span className="text-sm font-semibold">({summary.projectsCrossingThresholdPct}%)</span>
              </span>
            </div>
            <p className="text-[11px] text-red-600/80">Active Projects Exceeding 90d Threshold</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-[#fffdf8] dark:bg-[#1a1a19] shadow-xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Strategic Capital Exposure
            </p>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {formatINR(summary.strategicCapitalAtRiskINR)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Total Outlay in High & Critical Delay Risk</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-[#fffdf8] dark:bg-[#1a1a19] shadow-xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Land Extent at Risk
            </p>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {formatAreaHectares(summary.landAreaAtRiskHa)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Corridor parcels under procedural drag</p>
          </CardContent>
        </Card>
      </div>

      {/* 4-Band Portfolio Distribution Console */}
      <Card className="border-slate-200 dark:border-slate-800 bg-[#fffdf8] dark:bg-[#1a1a19] shadow-sm">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-[#fbf9f4] dark:bg-[#161615]">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>National Portfolio Delay Risk Bands</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                Calibrated distribution across statutory risk levels: Critical (&ge;80%), High (60-79%), Moderate (30-59%), Low (&lt;30%).
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Critical */}
            <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-red-700 dark:text-red-400">CRITICAL RISK</span>
                <span className="font-mono font-bold text-red-700 dark:text-red-400">
                  {summary.distribution.criticalCount} ({summary.distribution.criticalPct}%)
                </span>
              </div>
              <div className="w-full bg-red-200 dark:bg-red-950/50 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600 rounded-full transition-all"
                  style={{ width: `${summary.distribution.criticalPct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500">Delay Prob &ge;80% | &gt;120d Slippage</p>
            </div>

            {/* High */}
            <div className="p-3.5 rounded-xl border border-orange-500/30 bg-orange-500/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-orange-700 dark:text-orange-400">HIGH RISK</span>
                <span className="font-mono font-bold text-orange-700 dark:text-orange-400">
                  {summary.distribution.highCount} ({summary.distribution.highPct}%)
                </span>
              </div>
              <div className="w-full bg-orange-200 dark:bg-orange-950/50 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all"
                  style={{ width: `${summary.distribution.highPct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500">Delay Prob 60-79% | Approaching 90d Threshold</p>
            </div>

            {/* Moderate */}
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-700 dark:text-amber-400">MODERATE RISK</span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                  {summary.distribution.moderateCount} ({summary.distribution.moderatePct}%)
                </span>
              </div>
              <div className="w-full bg-amber-200 dark:bg-amber-950/50 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${summary.distribution.moderatePct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500">Delay Prob 30-59% | Procedural Attention</p>
            </div>

            {/* Low */}
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-700 dark:text-emerald-400">LOW RISK</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {summary.distribution.lowCount} ({summary.distribution.lowPct}%)
                </span>
              </div>
              <div className="w-full bg-emerald-200 dark:bg-emerald-950/50 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${summary.distribution.lowPct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500">Delay Prob &lt;30% | On-Track Velocity</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prioritized Project Leaderboard Table */}
      <Card className="border-slate-200 dark:border-slate-800 bg-[#fffdf8] dark:bg-[#1a1a19] shadow-sm">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-[#fbf9f4] dark:bg-[#161615]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-600" />
                <span>Risk-Based Executive Monitoring Queue</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                Prioritized project leaderboard ranked by predicted delay probability & urgency of statutory intervention.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Search input */}
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter corridor, code..."
                  className="h-8 pl-8 text-xs bg-white dark:bg-[#1f1f1e]"
                />
              </div>

              {/* Band filters */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                {["ALL", "CRITICAL", "HIGH", "MODERATE", "LOW"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      selectedLevel === level
                        ? "bg-white dark:bg-[#1a1a19] text-slate-900 dark:text-white font-bold shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14 text-center">Rank</TableHead>
                <TableHead>Project Corridor</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Delay Probability</TableHead>
                <TableHead>Est. Delay</TableHead>
                <TableHead>90d Threshold</TableHead>
                <TableHead>Dominant Risk Factor</TableHead>
                <TableHead>Top Action</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaderboard.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-xs text-slate-500">
                    No infrastructure corridors matched the selected filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeaderboard.map((item) => (
                  <TableRow key={item.projectId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <TableCell className="text-center font-bold font-mono text-xs">
                      #{item.priorityRank}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white hover:underline">
                          <Link href={`/projects/${item.projectId}`}>{item.title}</Link>
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {item.projectCode} • {formatINR(item.estimatedBudgetINR)}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {item.sector}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs">
                          {item.delayProbabilityPct}%
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRiskBadge(item.riskLevel)}`}>
                          {item.riskLevel}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs font-semibold">
                      ~{item.predictedDelayDays}d
                    </TableCell>

                    <TableCell>
                      {item.isLikelyToCross90DayDelay ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Likely Breach</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Safe</span>
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300 max-w-xs truncate">
                        {item.dominantRiskFactor}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-[11px] text-slate-500 max-w-xs truncate">
                        {item.topPrescriptiveAction}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Link href={`/projects/${item.projectId}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs flex items-center gap-1">
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
