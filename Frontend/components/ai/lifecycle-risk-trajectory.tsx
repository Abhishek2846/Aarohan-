"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProjectRiskTrajectoryQuery } from "@/hooks/queries/use-bhoomi-queries";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { Activity, Clock, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { RiskLevel } from "@/types/ai-delay";

interface LifecycleRiskTrajectoryProps {
  projectId: string;
  className?: string;
}

export function LifecycleRiskTrajectory({
  projectId,
  className = "",
}: LifecycleRiskTrajectoryProps) {
  const { data, isLoading } = useProjectRiskTrajectoryQuery(projectId);

  if (isLoading) {
    return (
      <Card className={`border-slate-200 dark:border-slate-800 ${className}`}>
        <CardContent className="p-8 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-500" />
            <span>Loading longitudinal lifecycle risk trajectory...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.trajectory || data.trajectory.length === 0) {
    return null;
  }

  const chartData = data.trajectory.map((s) => ({
    checkpoint: s.lifecycleCheckpoint,
    probability: s.delayProbabilityPct,
    delayDays: s.predictedDelayDays,
    riskLevel: s.riskLevel,
    dominantCategory: s.dominantRiskCategory,
    date: new Date(s.snapshotDate).toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    }),
  }));

  const getBadgeStyle = (level: RiskLevel) => {
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="p-3 rounded-lg bg-slate-900 text-white text-xs space-y-1.5 shadow-xl border border-slate-700 font-sans">
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold text-amber-400">{p.checkpoint} Checkpoint</span>
            <span className="text-[10px] text-slate-400">{p.date}</span>
          </div>
          <div className="pt-1 border-t border-slate-800 space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Delay Probability:</span>
              <span className="font-bold font-mono text-white">{p.probability}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Predicted Delay:</span>
              <span className="font-bold font-mono text-white">~{p.delayDays} Days</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Dominant Driver:</span>
              <span className="font-bold text-amber-300">{p.dominantCategory}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={`overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#fffdf8] dark:bg-[#1a1a19] shadow-sm ${className}`}>
      <CardHeader className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-[#fbf9f4] dark:bg-[#161615]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-600" />
              <CardTitle className="text-base font-black text-slate-900 dark:text-white">
                Statutory Lifecycle Risk Trajectory
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
              Longitudinal tracking of predicted 90-day delay probability across statutory acquisition milestones.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 font-bold font-mono">
              <span className="w-2 h-0.5 bg-red-500 inline-block" />
              <span>50% Threshold (90-Day Breach Line)</span>
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Recharts Area Chart */}
        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="checkpoint"
                tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={50}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: "90-Day Delay Threshold",
                  position: "insideTopRight",
                  fill: "#ef4444",
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              />
              <Area
                type="monotone"
                dataKey="probability"
                stroke="#f97316"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#riskGradient)"
                dot={{ r: 4, fill: "#ea580c", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#ea580c", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Checkpoint Milestone Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
          {data.trajectory.map((s, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fbf9f4] dark:bg-[#1f1f1e] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black font-mono text-slate-800 dark:text-slate-200">
                  {s.lifecycleCheckpoint}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getBadgeStyle(s.riskLevel)}`}>
                  {s.riskLevel.slice(0, 4)}
                </span>
              </div>

              <div>
                <div className="text-base font-black text-slate-900 dark:text-white font-mono leading-none">
                  {s.delayProbabilityPct}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  ~{s.predictedDelayDays}d delay
                </div>
              </div>

              <div className="text-[9px] text-slate-500 truncate pt-1 border-t border-slate-200 dark:border-slate-800">
                {s.dominantRiskCategory}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
