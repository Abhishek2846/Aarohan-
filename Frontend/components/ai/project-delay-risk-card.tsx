"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  useProjectDelayRiskQuery,
  useSimulateWhatIfMutation,
} from "@/hooks/queries/use-bhoomi-queries";
import {
  AlertTriangle,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Scale,
  Sliders,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Zap,
  Layers,
  ArrowRight,
} from "lucide-react";
import { RiskLevel, ProjectShapFactor } from "@/types/ai-delay";

interface ProjectDelayRiskCardProps {
  projectId: string;
  className?: string;
}

export function ProjectDelayRiskCard({ projectId, className = "" }: ProjectDelayRiskCardProps) {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [activeTab, setActiveTab] = useState<"all" | "increasing" | "mitigating">("all");
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Simulator state
  const [simStays, setSimStays] = useState(false);
  const [simDbt, setSimDbt] = useState(false);
  const [simSlao, setSimSlao] = useState(false);
  const [simObjections, setSimObjections] = useState(false);
  const [simDgps, setSimDgps] = useState(false);

  const { data: assessment, isLoading, refetch } = useProjectDelayRiskQuery(projectId);
  const whatIfMutation = useSimulateWhatIfMutation(projectId);

  const handleRunSimulation = () => {
    whatIfMutation.mutate({
      resolveLitigations: simStays,
      accelerateDbtDisbursementPct: simDbt ? 30 : undefined,
      deployAdditionalSlao: simSlao,
      resolveSection15Objections: simObjections,
      completeCadastralSurveys: simDgps,
    });
  };

  const handleResetSimulation = () => {
    setSimStays(false);
    setSimDbt(false);
    setSimSlao(false);
    setSimObjections(false);
    setSimDgps(false);
    whatIfMutation.reset();
  };

  if (isLoading) {
    return (
      <Card className={`border-slate-200 dark:border-slate-800 ${className}`}>
        <CardContent className="p-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
            <span>Computing calibrated 90-day delay probability & TreeSHAP attributions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!assessment) {
    return null;
  }

  const isHi = lang === "hi";
  const simResult = whatIfMutation.data;

  // Active displayed metrics (either simulated or baseline)
  const currentProb = simResult
    ? simResult.simulated.delayProbabilityPct
    : assessment.delayProbabilityPct;
  const currentRiskLevel: RiskLevel = simResult
    ? simResult.simulated.riskLevel
    : assessment.riskLevel;
  const currentDelayDays = simResult
    ? simResult.simulated.predictedDelayDays
    : assessment.predictedDelayDays;
  const isCrossing90 = currentDelayDays >= 90 || currentProb >= 50;

  // Risk styling helper
  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case "CRITICAL":
        return {
          bg: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
          barColor: "#ef4444",
          label: isHi ? "गंभीर जोखिम" : "CRITICAL RISK",
        };
      case "HIGH":
        return {
          bg: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30",
          barColor: "#f97316",
          label: isHi ? "उच्च जोखिम" : "HIGH RISK",
        };
      case "MODERATE":
        return {
          bg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
          barColor: "#f59e0b",
          label: isHi ? "मध्यम जोखिम" : "MODERATE RISK",
        };
      case "LOW":
      default:
        return {
          bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
          barColor: "#10b981",
          label: isHi ? "न्यूनतम जोखिम" : "LOW RISK",
        };
    }
  };

  const riskBadge = getRiskBadge(currentRiskLevel);

  // Filter SHAP factors according to tab
  const displayedFactors = assessment.shapFactors.filter((f) => {
    if (activeTab === "increasing") return !f.isMitigating;
    if (activeTab === "mitigating") return f.isMitigating;
    return true;
  });

  return (
    <Card className={`overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#fffdf8] dark:bg-[#1a1a19] shadow-sm ${className}`}>
      {/* Top Header */}
      <CardHeader className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-[#fbf9f4] dark:bg-[#161615]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                {isHi ? "एआई विलंब पूर्वानुमान और व्याख्या" : "Explainable AI 90-Day Delay Predictor"}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {assessment.modelMetadata.modelType.split("(")[0].trim()}
              </span>
            </div>
            <CardTitle className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isHi ? "90-दिवसीय वैधानिक विलंब जोखिम विश्लेषण" : "90-Day Statutory Delay Risk Assessment"}</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
              {isHi
                ? "आरएफटीसीटीएलएआरआर अधिनियम के तहत 90 दिनों से अधिक देरी की संभावना का ट्री-एसएचएपी विश्लेषण।"
                : "Calibrated likelihood of exceeding 90-day statutory milestone threshold under RFCTLARR Act with TreeSHAP attributions."}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* Language Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="h-8 text-xs font-semibold px-2.5"
            >
              {lang === "en" ? "हिन्दी" : "English"}
            </Button>

            {/* What-If Simulator Toggle */}
            <Button
              size="sm"
              onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
              className={`h-8 text-xs font-semibold px-3 flex items-center gap-1.5 ${
                isSimulatorOpen
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isHi ? "व्हाट-इफ सिमुलेशन" : "What-If Simulator"}</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Core Prediction Gauges & 90-Day Status Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left: Dial & Numerical Probabilities */}
          <div className="lg:col-span-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fbf9f4] dark:bg-[#1f1f1e] flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {isHi ? "विलंब संभावना" : "Delay Probability"}
              </span>
              <span className={`px-2 py-0.5 text-xs font-black rounded border ${riskBadge.bg}`}>
                {riskBadge.label}
              </span>
            </div>

            {/* Circular Gauge Graphic */}
            <div className="relative flex flex-col items-center justify-center my-2">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-slate-200 dark:text-slate-800"
                  />
                  {/* Progress Arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={riskBadge.barColor}
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 * (1 - currentProb / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-slate-900 dark:text-white font-mono leading-none">
                    {currentProb}%
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1">
                    P(Delay &gt; 90d)
                  </span>
                </div>
              </div>

              {simResult && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>
                    -{simResult.impact.probabilityDeltaPct}% ({simResult.impact.daysSaved}d saved)
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-center">
              <div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {isHi ? "अनुमानित अतिरिक्त विलंब" : "Predicted Delay"}
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                  ~{currentDelayDays} {isHi ? "दिन" : "Days"}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {isHi ? "मॉडल विश्वास स्कोर" : "Model Confidence"}
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                  {assessment.confidenceScorePct}%
                </div>
              </div>
            </div>
          </div>

          {/* Right: 90-Day Delay Threshold Alert & Key Indicators */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-3">
            {/* 90-Day Statutory Banner */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                isCrossing90
                  ? "bg-red-500/10 border-red-500/30 text-red-950 dark:text-red-200"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
              }`}
            >
              {isCrossing90 ? (
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold tracking-tight">
                    {isCrossing90
                      ? isHi
                        ? "चेतावनी: 90-दिवसीय वैधानिक सीमा पार होने की उच्च संभावना"
                        : "CRITICAL: Project Likely to Cross the 90-Day Statutory Delay Threshold"
                      : isHi
                      ? "संतोषजनक: 90-दिवसीय सीमा के भीतर कार्य प्रगति पर"
                      : "ON-TRACK: Project Conditions Unlikely to Cross 90-Day Delay Threshold"}
                  </h4>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10">
                    RFCTLARR Section 15 & 19
                  </span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">
                  {isCrossing90
                    ? isHi
                      ? `वर्तमान प्रशासनिक एवं न्यायिक स्थितियों के अनुसार यह परियोजना वैधानिक समय-सीमा से ~${currentDelayDays} दिन अधिक ले सकती है। निर्धारित 90 दिनों की सीमा से ${Math.abs(
                          assessment.daysToThreshold,
                        )} दिन अतिरिक्त हैं। तत्काल प्रशासनिक हस्तक्षेप आवश्यक है।`
                      : `Current pipeline conditions project an estimated statutory slippage of ~${currentDelayDays} days, exceeding the 90-day critical statutory buffer by ${Math.abs(
                          assessment.daysToThreshold,
                        )} days. Urgent remedial fast-track hearing and title dispute intervention required.`
                    : isHi
                    ? `परियोजना का अपेक्षित विलंब केवल ~${currentDelayDays} दिन है, जो 90-दिवसीय वैधानिक सीमा के सुरक्षित दायरे में है।`
                    : `Predicted project delay is constrained to ~${currentDelayDays} days, remaining comfortably within the 90-day statutory threshold buffer.`}
                </p>
              </div>
            </div>

            {/* Dominant Risk Factor & Bottleneck Snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-[#fbf9f4] dark:bg-[#1b1b1a] space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-tight">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{isHi ? "प्रमुख जोखिम कारक" : "Dominant Risk Factor"}</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight line-clamp-1">
                  {assessment.dominantRiskFactor}
                </div>
                <p className="text-[11px] text-slate-500">
                  {isHi ? "जोखिम श्रेणी" : "Risk Category"}: <span className="font-semibold text-slate-700 dark:text-slate-300">{assessment.dominantRiskCategory}</span>
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-[#fbf9f4] dark:bg-[#1b1b1a] space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-tight">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{isHi ? "प्राथमिक अवरोध चरण" : "Primary Bottleneck Stage"}</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {assessment.primaryBottleneckStage}
                </div>
                <p className="text-[11px] text-slate-500">
                  {isHi ? "कॉन्फिडेंस रेंज" : "Confidence Range"}:{" "}
                  <span className="font-semibold font-mono text-slate-700 dark:text-slate-300">
                    {assessment.confidenceIntervalDays[0]}d - {assessment.confidenceIntervalDays[1]}d
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What-If Simulation Drawer / Panel */}
        {isSimulatorOpen && (
          <div className="p-4 sm:p-5 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-600" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isHi ? "एआई व्हाट-इफ परिदृश्य सिम्युलेटर" : "Interactive What-If Scenario Simulator"}
                </h4>
              </div>
              {simResult && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetSimulation}
                  className="h-7 text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isHi ? "रीसेट" : "Reset Baseline"}</span>
                </Button>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {isHi
                ? "विभिन्न कानूनी व प्रशासनिक सुधारों को लागू करके विलंब जोखिम और बचाए गए दिनों का पूर्वानुमान देखें:"
                : "Toggle planned policy or operational interventions to evaluate dynamic reduction in delay probability and days saved:"}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <label className="flex items-start gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c1c1b] cursor-pointer hover:border-amber-400 transition-colors">
                <input
                  type="checkbox"
                  checked={simStays}
                  onChange={(e) => setSimStays(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {isHi ? "उच्च न्यायालय रोक हटाना" : "Vacate High Court Stays"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isHi ? "विशेष पीठ के समक्ष त्वरित आवेदन" : "Urgent mention before High Court vacation bench"}
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c1c1b] cursor-pointer hover:border-amber-400 transition-colors">
                <input
                  type="checkbox"
                  checked={simSlao}
                  onChange={(e) => setSimSlao(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {isHi ? "अतिरिक्त एसएलएओ अधिकारी" : "Deploy Dual SLAO Officers"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isHi ? "धारा 15 आपत्तियों की दैनिक सुनवाई" : "Daily taluk hearing roster to clear backlog"}
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c1c1b] cursor-pointer hover:border-amber-400 transition-colors">
                <input
                  type="checkbox"
                  checked={simDbt}
                  onChange={(e) => setSimDbt(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {isHi ? "त्वरित डीबीटी वितरण (+30%)" : "Accelerate DBT Disbursals (+30%)"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isHi ? "पीएफएमएस आधार सीडिंग कैंप" : "Village camp for NPCI bank mapping"}
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c1c1b] cursor-pointer hover:border-amber-400 transition-colors">
                <input
                  type="checkbox"
                  checked={simObjections}
                  onChange={(e) => setSimObjections(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {isHi ? "ग्राम सभा सुलह समझौता" : "Settle All Sec 15 Objections"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isHi ? "तालुक स्तर पर शत-प्रतिशत समाधान" : "Consensus resolution via Gram Sabha sitting"}
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c1c1b] cursor-pointer hover:border-amber-400 transition-colors">
                <input
                  type="checkbox"
                  checked={simDgps}
                  onChange={(e) => setSimDgps(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {isHi ? "डीजीपीएस फील्ड पुन: सीमांकन" : "Complete DGPS Resurveys"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isHi ? "विवादित पार्सल का भौतिक मापन" : "Resolve RoR boundary variance via GNSS"}
                  </div>
                </div>
              </label>

              <div className="flex items-center justify-center p-2">
                <Button
                  onClick={handleRunSimulation}
                  disabled={whatIfMutation.isPending}
                  className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Zap className="w-4 h-4" />
                  <span>
                    {whatIfMutation.isPending
                      ? isHi
                        ? "गणना जारी..."
                        : "Computing..."
                      : isHi
                      ? "सिमुलेशन परिणाम देखें"
                      : "Compute Simulated Impact"}
                  </span>
                </Button>
              </div>
            </div>

            {/* Simulation Impact Banner */}
            {simResult && (
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      {isHi ? "सिमुलेशन प्रभाव:" : "Simulation Result:"}{" "}
                      {simResult.impact.riskLevelShift}
                    </span>
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    {isHi ? "लागू किए गए उपाय:" : "Applied Interventions:"}{" "}
                    {simResult.implementedInterventions.join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-4 self-end sm:self-center font-mono">
                  <div className="text-center">
                    <span className="text-[10px] uppercase text-slate-500 block">
                      {isHi ? "जोखिम कमी" : "Prob. Drop"}
                    </span>
                    <span className="text-sm font-black text-emerald-600">
                      -{simResult.impact.probabilityDeltaPct}%
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] uppercase text-slate-500 block">
                      {isHi ? "बचाए गए दिन" : "Days Saved"}
                    </span>
                    <span className="text-sm font-black text-emerald-600">
                      {simResult.impact.daysSaved}d
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Explainable TreeSHAP Factor Waterfall Breakdown */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span>{isHi ? "ट्री-एसएचएपी कारक विश्लेषण" : "TreeSHAP Explainability Decomposition"}</span>
              </h4>
              <p className="text-xs text-slate-500">
                {isHi
                  ? "प्रत्येक कारक का विलंब संभावना पर सकारात्मक (जोखिम बढ़ाने वाला) अथवा नकारात्मक (निवारक) प्रभाव।"
                  : "Decomposes prediction into positive risk drivers and mitigating accelerators."}
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs self-start sm:self-auto">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === "all"
                    ? "bg-white dark:bg-[#1a1a19] text-slate-900 dark:text-white shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                {isHi ? "सभी कारक" : "All Signals"}
              </button>
              <button
                onClick={() => setActiveTab("increasing")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === "increasing"
                    ? "bg-white dark:bg-[#1a1a19] text-red-700 dark:text-red-400 shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-red-600"
                }`}
              >
                {isHi ? "जोखिम वर्धक" : "Risk Increasing"} ({assessment.riskIncreasingFactors.length})
              </button>
              <button
                onClick={() => setActiveTab("mitigating")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === "mitigating"
                    ? "bg-white dark:bg-[#1a1a19] text-emerald-700 dark:text-emerald-400 shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-emerald-600"
                }`}
              >
                {isHi ? "निवारक / गतिवर्धक" : "Accelerators"} ({assessment.riskMitigatingFactors.length})
              </button>
            </div>
          </div>

          {/* Factor Rows */}
          <div className="space-y-2.5 pt-1">
            {displayedFactors.map((factor, idx) => {
              const isPositive = !factor.isMitigating;
              const barWidth = Math.min(100, Math.max(8, Math.abs(factor.shapWeight) * 3));

              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fbf9f4] dark:bg-[#1c1c1b] space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                          isPositive
                            ? "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
                            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {factor.category}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {factor.factor}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        ({factor.featureValue})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-xs font-bold">
                      <span
                        className={
                          isPositive
                            ? "text-red-600 dark:text-red-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {isPositive ? `+${factor.shapWeight}%` : `${factor.shapWeight}%`} SHAP
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {isPositive ? `+${factor.impactDays}d` : `${factor.impactDays}d`}
                      </span>
                    </div>
                  </div>

                  {/* Visual Impact Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex items-center">
                    {isPositive ? (
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    ) : (
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                    {isHi ? factor.descriptionHi : factor.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actionable Prescriptive Interventions */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <span>{isHi ? "अनुशंसित सुधारात्मक कार्ययोजना" : "AI Prescriptive Interventions"}</span>
              </h4>
              <p className="text-xs text-slate-500">
                {isHi
                  ? "विलंब कम करने हेतु वैधानिक और प्रशासनिक कार्यवाही।"
                  : "Targeted statutory interventions prioritized by potential delay day reduction."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {assessment.prescriptiveActions.map((action, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fbf9f4] dark:bg-[#1a1a19] space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold font-mono text-slate-500 uppercase">
                      {action.statutoryReference}
                    </span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                        action.urgency === "IMMEDIATE"
                          ? "bg-red-500/15 text-red-700 dark:text-red-400"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {action.urgency}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {isHi ? action.actionTitleHi : action.actionTitle}
                  </h5>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                    {action.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                    Save ~{action.expectedDelayReductionDays} Days (-{action.expectedRiskReductionPct}%)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsSimulatorOpen(true);
                      if (action.id.includes("LEGAL")) setSimStays(true);
                      if (action.id.includes("SDM")) setSimSlao(true);
                      if (action.id.includes("DGPS")) setSimDgps(true);
                      if (action.id.includes("PFMS")) setSimDbt(true);
                    }}
                    className="h-7 text-[10px] font-semibold px-2 flex items-center gap-1"
                  >
                    <span>{isHi ? "सिमुलेट करें" : "Simulate"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
