"use client";

import React, { useState, useEffect } from "react";
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
import { useAuth, MOCK_PROFILES } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import {
  usePortfolioRiskQuery,
  useProjectDelayRiskQuery,
  useProjectRiskTrajectoryQuery,
} from "@/hooks/queries/use-bhoomi-queries";
import { ProjectDelayRiskCard } from "./project-delay-risk-card";
import { LifecycleRiskTrajectory } from "./lifecycle-risk-trajectory";
import { PortfolioRiskOverview } from "./portfolio-risk-overview";
import {
  AlertTriangle,
  ShieldCheck,
  Scale,
  Sparkles,
  Building2,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
  ExternalLink,
  Download,
  Send,
  Zap,
  Flame,
  ArrowRight,
  FileText,
  UserCheck,
  Briefcase,
} from "lucide-react";
import { formatINR, formatAreaHectares } from "@/lib/utils";

interface RoleBasedDelayIntelligenceProps {
  className?: string;
}

export function RoleBasedDelayIntelligence({ className = "" }: RoleBasedDelayIntelligenceProps) {
  const { activeRole, user } = useAuth();
  const { lang } = useI18n();
  const isHi = lang === "hi";

  const currentProfile = user || MOCK_PROFILES[activeRole] || MOCK_PROFILES.DISTRICT_OFFICER;

  const { data: portfolioSummary, isLoading: portfolioLoading } = usePortfolioRiskQuery();

  // Selected project state for deep-dive
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Set default selected project once portfolio loads
  useEffect(() => {
    if (portfolioSummary?.prioritizedLeaderboard?.length && !selectedProjectId) {
      setSelectedProjectId(portfolioSummary.prioritizedLeaderboard[0].projectId);
    }
  }, [portfolioSummary, selectedProjectId]);

  const selectedProjectItem = portfolioSummary?.prioritizedLeaderboard.find(
    (p) => p.projectId === selectedProjectId,
  ) || portfolioSummary?.prioritizedLeaderboard?.[0];

  const handleExecuteAction = (actionTitle: string, reference: string) => {
    setActionSuccessMessage(
      `${isHi ? "सफल आदेश:" : "Order Promulgated:"} "${actionTitle}" (${reference}). ${
        isHi ? "ऑडिट ट्रेल में विधिवत दर्ज।" : "Dispatched and recorded in audit log."
      }`,
    );
    setTimeout(() => setActionSuccessMessage(null), 5000);
  };

  // Role metadata
  const getRoleHeaderInfo = () => {
    switch (activeRole) {
      case "CENTRAL_MINISTRY":
        return {
          roleTitle: isHi ? "केंद्रीय मंत्रालय राष्ट्रीय विलंब रडार" : "Central Ministry 90-Day Delay Radar",
          badge: isHi ? "राष्ट्रीय पीएमयू कमान" : "National PMU Command",
          description: isHi
            ? "समस्त राष्ट्रीय राजमार्ग, रेलवे व ऊर्जा कॉरिडोर में 90-दिवसीय वैधानिक विलंब का मैक्रो विश्लेषण एवं कैबिनेट समीक्षा।"
            : "Macro portfolio delay prediction, capital exposure surveillance, and inter-ministerial cabinet risk notifications across national corridors.",
          actionText: isHi ? "कैबिनेट नोट डाउनलोड करें" : "Export Inter-Ministerial Cabinet Risk Docket",
        };
      case "DISTRICT_OFFICER":
        return {
          roleTitle: isHi ? "विशेष भूमि अधिग्रहण अधिकारी (SLAO) विलंब डॉकेट" : "Competent Authority & SLAO 90-Day Delay Docket",
          badge: isHi ? "न्यायिक एवं प्रशासनिक पीठ" : "Magisterial & CALA Bench",
          description: isHi
            ? "धारा 15 जन-आपत्तियों का बैकलॉग, धारा 11 प्रारंभिक अधिसूचना व्यपगत होने की उल्टी गिनती एवं डीजीपीएस सत्यापन।"
            : "Section 15 objection backlog adjudication, Section 11 lapse countdown tracking, and fast-track taluk conciliation dockets.",
          actionText: isHi ? "विशेष सुनवाई रोस्टर जारी करें" : "Promulgate Special SDM Hearing Roster",
        };
      case "PIA":
        return {
          roleTitle: isHi ? "परियोजना क्रियान्वयन एजेंसी (PIA) विलंब पूर्वानुमान" : "Project Implementing Agency (PIA) Corridor Delay Forecast",
          badge: isHi ? "कॉरिडोर निष्पादन नियंत्रण" : "Corridor Engineering & RoW",
          description: isHi
            ? "निर्माण संविदाकार को कब्जा सुपुर्दगी, वन एवं पर्यावरण अनापत्ति तथा डीबीटी मुआवजा तरलता का एआई विश्लेषण।"
            : "Linear corridor handover feasibility, forest clearance bottlenecks, and predictive What-If corridor acceleration simulation.",
          actionText: isHi ? "संविदाकार सुपुर्दगी पूर्वानुमान डाउनलोड करें" : "Export Contractor Handover Schedule",
        };
      case "AUDITOR":
        return {
          roleTitle: isHi ? "कैग (CAG) वैधानिक समय-सीमा व विलंब ऑडिट" : "Statutory SLA Timeline & Delay Risk Forensic Audit",
          badge: isHi ? "स्वतंत्र संवैधानिक जांच" : "Constitutional Oversight",
          description: isHi
            ? "आरएफटीसीटीएलएआरआर अधिनियम के तहत वैधानिक समय-सीमा उल्लंघन, पीएफएमएस भुगतान विफलता व कैडस्ट्रल विसंगतियों की जांच।"
            : "Statutory SLA breach diagnostics, PFMS transaction failure anomalies, and TreeSHAP explainability audit certification.",
          actionText: isHi ? "वैधानिक ऑडिट प्रतिवेदन जनरेट करें" : "Generate Statutory SLA Audit Docket",
        };
      case "STATE_AUTHORITY":
        return {
          roleTitle: isHi ? "राज्य राजस्व विभाग विलंब निगरानी कंसोल" : "State Revenue Directorate Delay Surveillance Console",
          badge: isHi ? "राज्य अपीलीय व राजस्व कमान" : "State Apex Revenue",
          description: isHi
            ? "समस्त जिलों में भूमि अधिग्रहण गति, राजस्व न्यायालय अपीलों का निपटान तथा 4-बैंड जोखिम वर्गीकरण।"
            : "Inter-district acquisition velocity, revenue court appeals, and statewide 4-band statutory delay risk surveillance.",
          actionText: isHi ? "राज्यस्तरीय समीक्षा रिपोर्ट जारी करें" : "Issue State District Directives",
        };
      case "FIELD_OFFICER":
      default:
        return {
          roleTitle: isHi ? "क्षेत्रीय सर्वेक्षक कैडस्ट्रल विलंब एवं मापन जोखिम" : "Cadastral Survey Delay & Boundary Demarcation Intelligence",
          badge: isHi ? "फील्ड राजस्व दल" : "Field Survey Squad",
          description: isHi
            ? "जमाबंदी एवं भौतिक जीपीएस मापन में विसंगतियां, विवादित सर्वे नंबर एवं फील्ड टास्क प्राथमिकीकरण।"
            : "DGPS walking survey discrepancy resolution, disputed cadastral parcel identification, and field survey prioritization.",
          actionText: isHi ? "जीपीएस सर्वे प्रारंभ करें" : "Launch Priority GPS Walking Survey",
        };
    }
  };

  const roleInfo = getRoleHeaderInfo();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Officer Credential & Designated Role Banner */}
      <div className="p-4 sm:p-5 rounded-2xl border border-[#d8d3c9] dark:border-slate-800 bg-gradient-to-r from-[#fffdf8] via-[#f7f4ed] to-[#fffdf8] dark:from-[#1b1b1a] dark:to-[#171716] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-[#ef5b2a]/10 text-[#ef5b2a] border border-[#ef5b2a]/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{roleInfo.badge}</span>
              </span>
              <span className="text-xs font-bold text-slate-500 font-mono">
                {currentProfile.jurisdiction?.districtName || currentProfile.jurisdiction?.stateName || "All-India Jurisdiction"}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-[#171716] dark:text-white tracking-tight">
              {roleInfo.roleTitle}
            </h2>

            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 flex-wrap">
              <span className="font-bold flex items-center gap-1 text-slate-900 dark:text-white">
                <UserCheck className="w-3.5 h-3.5 text-[#ef5b2a]" />
                <span>{currentProfile.name}</span>
              </span>
              <span>•</span>
              <span className="font-semibold">{currentProfile.designation}</span>
              <span>•</span>
              <span className="text-slate-500">{currentProfile.department}</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 pt-0.5 max-w-3xl">
              {roleInfo.description}
            </p>
          </div>

          {/* Role Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-start md:self-center shrink-0">
            <Button
              onClick={() =>
                handleExecuteAction(
                  roleInfo.actionText,
                  activeRole === "DISTRICT_OFFICER"
                    ? "RFCTLARR Sec 15(2) Roster"
                    : activeRole === "CENTRAL_MINISTRY"
                    ? "Cabinet Note MoRTH/DoLR/2026/09"
                    : "Official Directive",
                )
              }
              className="bg-[#171716] hover:bg-[#2e2e2d] dark:bg-white dark:text-[#171716] dark:hover:bg-slate-200 text-white font-bold text-xs h-10 px-4 flex items-center gap-2 shadow-sm"
            >
              <FileText className="w-4 h-4 text-[#ef5b2a]" />
              <span>{roleInfo.actionText}</span>
            </Button>
          </div>
        </div>

        {/* Action Flash Alert */}
        {actionSuccessMessage && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* Corridor Selector Strip */}
      {portfolioSummary?.prioritizedLeaderboard && portfolioSummary.prioritizedLeaderboard.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800 bg-[#fffdf8] dark:bg-[#1a1a19] shadow-xs">
          <CardHeader className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-[#fbf9f4] dark:bg-[#161615]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#ef5b2a]" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  {isHi ? "सक्रिय राष्ट्रीय कॉरिडोर चयन (जोखिम क्रम में)" : "Select Corridor for Deep-Dive Delay Diagnostics"}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                {isHi ? "शीर्ष विलंब संभावना अनुसार सूचीबद्ध" : "Ranked by P(Delay &gt; 90 Days)"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {portfolioSummary.prioritizedLeaderboard.map((item) => {
                const isSelected = item.projectId === selectedProjectId;
                return (
                  <button
                    key={item.projectId}
                    onClick={() => setSelectedProjectId(item.projectId)}
                    className={`shrink-0 p-2.5 rounded-xl border text-left transition-all max-w-xs ${
                      isSelected
                        ? "bg-white dark:bg-[#242423] border-[#ef5b2a] ring-2 ring-[#ef5b2a]/20 shadow-sm"
                        : "bg-[#fbf9f4] dark:bg-[#1e1e1d] border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[10px] font-black text-[#ef5b2a]">
                        #{item.priorityRank}
                      </span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${
                          item.riskLevel === "CRITICAL"
                            ? "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30"
                            : item.riskLevel === "HIGH"
                            ? "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30"
                            : item.riskLevel === "MODERATE"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {item.delayProbabilityPct}%
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-1">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
                      <span>{item.sector}</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        ~{item.predictedDelayDays}d
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Corridor Live Prediction Card & Trajectory */}
      {selectedProjectId && (
        <div className="space-y-6">
          <ProjectDelayRiskCard projectId={selectedProjectId} />
          <LifecycleRiskTrajectory projectId={selectedProjectId} />
        </div>
      )}

      {/* Role-Specific Diagnostic Console */}
      {activeRole === "DISTRICT_OFFICER" && (
        <Card className="border-slate-200 dark:border-slate-800 bg-[#fffdf8] dark:bg-[#1a1a19] shadow-sm">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-[#fbf9f4] dark:bg-[#161615]">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#ef5b2a]" />
                  <span>SLAO Section 15 Public Objections Hearing Docket</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                  Adjudication docket for landowner claims under RFCTLARR Section 15(2). Unresolved objections push project delay past statutory 90d limits.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() =>
                  handleExecuteAction(
                    "Convene Special Gram Sabha Conciliation Court",
                    "Doddaballapur Taluk Roster",
                  )
                }
                className="h-8 text-xs font-semibold bg-[#ef5b2a] hover:bg-[#d94f22] text-white"
              >
                <span>Convene Taluk Conciliation</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Objection Docket ID</TableHead>
                  <TableHead>Landowner / Representative</TableHead>
                  <TableHead>Survey / Khasra No.</TableHead>
                  <TableHead>Dispute Nature</TableHead>
                  <TableHead>Days Pending</TableHead>
                  <TableHead>AI Delay Impact</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    id: "OBJ-2026-SEC15-014",
                    owner: "Gowda Farms & 4 Others",
                    survey: "142/2A (Doddaballapur)",
                    nature: "Title Claim & Tree Solatium Valuation Variance",
                    days: 34,
                    impact: "+14d delay",
                  },
                  {
                    id: "OBJ-2026-SEC15-019",
                    owner: "Smt. Shanthamma & Legal Heirs",
                    survey: "158/3B (Devanahalli)",
                    nature: "Cadastral Boundary Overlap vs RoR Records",
                    days: 48,
                    impact: "+21d delay",
                  },
                  {
                    id: "OBJ-2026-SEC15-022",
                    owner: "K. R. Venkataswamy",
                    survey: "163/1 (Hosakote)",
                    nature: "High Court Interim Injunction (Stay on Notice Pub.)",
                    days: 62,
                    impact: "+35d delay",
                  },
                ].map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs font-bold text-blue-900 dark:text-blue-300">
                      {row.id}
                    </TableCell>
                    <TableCell className="text-xs font-bold">{row.owner}</TableCell>
                    <TableCell className="text-xs font-mono">{row.survey}</TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                      {row.nature}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono font-bold text-red-600">
                        {row.days} Days
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 font-mono">
                        {row.impact}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleExecuteAction(
                            `Notice of Priority Hearing for ${row.id}`,
                            "SDM Court Room 2",
                          )
                        }
                        className="h-7 text-[11px] font-semibold"
                      >
                        Schedule Hearing
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* National Portfolio Risk Console for Central Ministry & Auditor */}
      {(activeRole === "CENTRAL_MINISTRY" || activeRole === "AUDITOR" || activeRole === "STATE_AUTHORITY") && (
        <PortfolioRiskOverview />
      )}
    </div>
  );
}
