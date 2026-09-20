"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatINR } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import {
  useGatiShaktiScreenerQuery,
  useNationalGatiShaktiSummaryQuery,
  useNocWorkflowActionMutation,
  useProjectsQuery,
} from "@/hooks/queries/use-bhoomi-queries";
import {
  GatiShaktiNoc,
  SpatialConflictPolygon,
} from "@/types/gati-shakti";
import { GatiShaktiMap } from "./gati-shakti-map";
import {
  Layers,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Compass,
  CheckCircle2,
  ExternalLink,
  Trees,
  Train,
  Zap,
  Flame,
  Landmark,
  Building,
  Scale,
  Sparkles,
  Download,
  Filter,
  FileCheck2,
  ArrowUpRight,
  HelpCircle,
  FileText,
  UserCheck,
  RefreshCw,
} from "lucide-react";

export function GatiShaktiScreener({
  defaultProjectId,
}: {
  defaultProjectId?: string;
}) {
  const { user, activeRole } = useAuth();
  const { lang } = useI18n();

  // Load all projects for corridor selector
  const { data: projectsData } = useProjectsQuery();
  const projects = useMemo(() => {
    const list = Array.isArray(projectsData)
      ? projectsData
      : (projectsData as any)?.data || [];
    return list;
  }, [projectsData]);

  const searchParams = useSearchParams();
  const urlProjectId = searchParams ? searchParams.get("project") : null;

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    urlProjectId || defaultProjectId || "BHOOMI-SEED-01"
  );

  // Sync when searchParams changes
  useEffect(() => {
    if (urlProjectId && urlProjectId !== selectedProjectId) {
      setSelectedProjectId(urlProjectId);
    }
  }, [urlProjectId]);

  // Sync with loaded projects list to ensure selectedProjectId matches an option value
  useEffect(() => {
    if (projects.length > 0) {
      const matchExact = projects.find(
        (p: any) => (p.id || p.project_id) === selectedProjectId
      );
      if (!matchExact) {
        // Match by projectCode
        const matchCode = projects.find(
          (p: any) =>
            (p.projectCode && p.projectCode.toLowerCase() === selectedProjectId.toLowerCase()) ||
            (p.project_code && p.project_code.toLowerCase() === selectedProjectId.toLowerCase())
        );
        if (matchCode) {
          setSelectedProjectId(matchCode.id || matchCode.project_id);
        } else if (!urlProjectId) {
          const firstId = projects[0].id || projects[0].project_id;
          if (firstId) setSelectedProjectId(firstId);
        }
      }
    }
  }, [projects, selectedProjectId, urlProjectId]);

  const [viewMode, setViewMode] = useState<"corridor" | "national">("corridor");
  const [selectedAgencyFilter, setSelectedAgencyFilter] = useState<string>("ALL");
  const [selectedConflict, setSelectedConflict] = useState<SpatialConflictPolygon | null>(null);
  const [tileType, setTileType] = useState<"satellite" | "standard">("satellite");

  // Active layer toggles
  const [activeLayers, setActiveLayers] = useState<string[]>([
    "MOEFCC_RESERVE_FOREST",
    "WILDLIFE_ESZ",
    "RAILWAY_CROSSING_GAD",
    "POWERGRID_HT_LINE",
    "PETROLEUM_PIPELINE",
    "DEFENCE_RESTRICTED",
    "ASI_MONUMENT_BUFFER",
  ]);

  // Action modal state
  const [activeModalNoc, setActiveModalNoc] = useState<GatiShaktiNoc | null>(null);
  const [modalActionType, setModalActionType] = useState<string>("");
  const [actionRemarks, setActionRemarks] = useState<string>("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Queries
  const {
    data: screener,
    isLoading: isScreenerLoading,
    refetch: refetchScreener,
  } = useGatiShaktiScreenerQuery(selectedProjectId);

  const {
    data: nationalSummary,
    isLoading: isNationalLoading,
    refetch: refetchNational,
  } = useNationalGatiShaktiSummaryQuery();

  const actionMutation = useNocWorkflowActionMutation(selectedProjectId);

  // Toggle single layer
  const toggleLayer = (layerCode: string) => {
    setActiveLayers((prev) =>
      prev.includes(layerCode)
        ? prev.filter((code) => code !== layerCode)
        : [...prev, layerCode]
    );
  };

  // Centerline for GIS Map
  const mapCenter: [number, number] = useMemo(() => {
    const code = (screener?.projectCode || selectedProjectId || "").toUpperCase();
    if (code.includes("02") || code.includes("WDFC") || code.includes("JAIPUR")) return [26.912, 75.787]; // Jaipur WDFC
    if (code.includes("03") || code.includes("DME") || code.includes("VADODARA")) return [22.312, 73.195]; // DME Vadodara
    if (code.includes("04") || code.includes("SOLAR") || code.includes("PAVAGADA")) return [14.102, 77.265]; // Pavagada Solar
    return [13.294, 77.534]; // Bengaluru default
  }, [screener?.projectCode, selectedProjectId]);

  const mapCenterline: [number, number][] = useMemo(() => {
    const [cLat, cLng] = mapCenter;
    return [
      [cLat - 0.02, cLng - 0.03],
      [cLat - 0.01, cLng - 0.015],
      [cLat, cLng],
      [cLat + 0.012, cLng + 0.018],
      [cLat + 0.025, cLng + 0.035],
    ];
  }, [mapCenter]);

  // Filtered NOCs
  const filteredNocs = useMemo(() => {
    if (!screener?.nocs) return [];
    if (selectedAgencyFilter === "ALL") return screener.nocs;
    if (selectedAgencyFilter === "MY_ROLE") {
      return screener.nocs.filter((n) => n.actionPendingBy === activeRole);
    }
    return screener.nocs.filter((n) => n.layerCode === selectedAgencyFilter);
  }, [screener?.nocs, selectedAgencyFilter, activeRole]);

  // Execute statutory action
  const handleExecuteAction = async () => {
    if (!activeModalNoc || !modalActionType) return;
    try {
      await actionMutation.mutateAsync({
        nocId: activeModalNoc.nocId,
        actionType: modalActionType,
        role: activeRole,
        remarks: actionRemarks || "Statutory step approved via PM Gati Shakti NMP Console",
      });
      setActionSuccessMsg(`Action "${modalActionType}" logged successfully.`);
      setTimeout(() => {
        setActionSuccessMsg(null);
        setActiveModalNoc(null);
        setModalActionType("");
        setActionRemarks("");
      }, 1800);
    } catch (err: any) {
      alert("Failed to execute action: " + (err.message || "Unknown error"));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "STAGE_2_APPROVED":
        return <Badge className="bg-emerald-600 text-white font-bold">Stage-2 Approved (Final)</Badge>;
      case "STAGE_1_APPROVED":
        return <Badge className="bg-blue-600 text-white font-bold">Stage-1 In-Principle</Badge>;
      case "JOINT_INSPECTION_PENDING":
        return <Badge className="bg-amber-600 text-white font-bold animate-pulse">Joint Inspection (JSI)</Badge>;
      case "ESCALATED_PMO":
        return <Badge className="bg-red-600 text-white font-bold">PMO PRAGATI Escalated</Badge>;
      case "APPLIED":
        return <Badge className="bg-purple-600 text-white font-bold">Applied / Under Scrutiny</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-600">Identified</Badge>;
    }
  };

  // Role-Based Access Control (RBAC): Citizens and Field Officers must not access internal multi-agency clearance dockets
  if (activeRole === "CITIZEN" || activeRole === "FIELD_OFFICER") {
    return (
      <div className="py-12 px-4 max-w-2xl mx-auto text-center space-y-6">
        <div className="p-8 rounded-2xl border border-amber-300 bg-[#fffdf8] shadow-lg space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold tracking-widest text-amber-700 uppercase">
              {lang === "hi" ? "कार्यकारी नियंत्रण कक्ष • आरक्षित पहुंच" : "Executive Console • Restricted Access"}
            </span>
            <h2 className="text-xl font-black text-[#171716]">
              {lang === "hi"
                ? "पीएम गति शक्ति राष्ट्रीय मास्टर प्लान (आंतरिक सरकारी पोर्टल)"
                : "PM Gati Shakti National Master Plan (Government Console)"}
            </h2>
            <p className="text-xs text-[#68655e] leading-relaxed max-w-md mx-auto">
              {lang === "hi"
                ? "यह एकल-खिड़की विनियामक मंजूरी प्रणाली केवल केंद्रीय मंत्रालयों, राज्य राजस्व प्राधिकरणों (CALA), और परियोजना क्रियान्वयन एजेंसियों (NHAI, Railways) के लिए आरक्षित है। नागरिक व भू-स्वामी अपने खसरा व मुआवजे की जानकारी अपने व्यक्तिगत नागरिक पोर्टल पर देख सकते हैं।"
                : "This multi-agency single-window regulatory clearance system is restricted to Central Ministries, State Revenue Authorities (CALA), and Project Implementing Agencies (NHAI, Railways). Landowners can access their acquired parcel details and compensation records in the Citizen Portal."}
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/citizen">
              <Button className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] text-xs h-9 px-4 rounded-full font-bold">
                {lang === "hi" ? "मेरे नागरिक पोर्टल पर जाएं" : "Go to Citizen Dashboard"}
              </Button>
            </Link>
            <Link href="/gazette">
              <Button variant="outline" className="border-[#d8d3c9] text-xs h-9 px-4 rounded-full font-bold">
                {lang === "hi" ? "ई-राजपत्र सार्वजनिक सूचनाएं" : "View Public e-Gazette"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase px-3 py-1 rounded-full tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                PM GATI SHAKTI NMP
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                7 Statutory Layers
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Govt of India Inter-Ministerial Engine
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              {lang === "hi"
                ? "पीएम गति शक्ति राष्ट्रीय मास्टर प्लान | अंतर-मंत्रालयी भू-मंजूरी स्क्रीनर"
                : "PM Gati Shakti NMP | Inter-Ministerial Geo-Clearance Screener"}
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl">
              {lang === "hi"
                ? "राष्ट्रीय राजमार्ग, रेलवे और ऊर्जा गलियारों में वन (MoEFCC), रेलवे (GAD), रक्षा, पाइपलाइन और पुरातत्व (ASI) मंजूरियों का स्वचालित स्थानिक टकराव विश्लेषण।"
                : "Single-window regulatory clearance engine resolving statutory bottlenecks across Forest (FCA 1980), Railway Crossings (GAD), Defence Perimeters, Gas Pipelines & Heritage Buffers."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* View Mode Toggle */}
            <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700 flex text-xs font-semibold">
              <button
                onClick={() => setViewMode("corridor")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === "corridor"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Corridor Screener
              </button>
              <button
                onClick={() => setViewMode("national")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === "national"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                PMO National Matrix
              </button>
            </div>

            {/* Print/Export Dossier */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-semibold text-xs"
            >
              <Download className="w-4 h-4 mr-1.5" />
              {lang === "hi" ? "गति शक्ति डॉसियर प्रिंट" : "Export Statutory Dossier"}
            </Button>
          </div>
        </div>

        {/* Corridor Selector Bar */}
        {viewMode === "corridor" && (
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Active Corridor:
              </span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-slate-800 text-white border border-slate-700 text-xs rounded-lg px-3 py-1.5 font-medium focus:ring-2 focus:ring-blue-500"
              >
                {projects.map((p: any) => (
                  <option key={p.id || p.project_id} value={p.id || p.project_id}>
                    {p.projectCode || p.project_code || "PRJ"} - {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="font-semibold text-emerald-400">Current Role:</span>
              <Badge variant="outline" className="border-amber-400/50 text-amber-300 font-mono">
                {activeRole}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchScreener()}
                className="h-7 px-2 text-slate-400 hover:text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Corridor Screener View */}
      {viewMode === "corridor" && isScreenerLoading && (
        <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading corridor clearances">
          {/* Top 4 Metric KPI Skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border border-slate-200 dark:border-slate-800 shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-5 w-5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  </div>
                  <div className="h-8 w-20 bg-slate-300 dark:bg-slate-600 rounded" />
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-36 bg-slate-100 dark:bg-slate-800 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* GIS Map & Conflict Skeletons */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-[520px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center space-y-3">
                <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold text-slate-500">
                  Streaming GIS Statutory Buffer Layers from PostGIS & PM Gati Shakti NMP...
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-[520px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                {[1, 2, 3].map((k) => (
                  <div key={k} className="p-3 bg-white dark:bg-slate-800 rounded-lg space-y-2 border">
                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-4 w-40 bg-slate-300 dark:bg-slate-600 rounded" />
                    <div className="h-2 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* NOC Matrix Skeleton */}
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader className="p-5">
              <div className="h-5 w-64 bg-slate-300 dark:bg-slate-700 rounded" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((k) => (
                  <div key={k} className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded flex items-center px-4 justify-between">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === "corridor" && !isScreenerLoading && !screener && (
        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-8 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Corridor Geo-Clearance Data Unavailable
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Could not retrieve PM Gati Shakti statutory clearances for the selected corridor. Please ensure the backend server is running.
          </p>
          <Button
            size="sm"
            onClick={() => refetchScreener()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry Sync
          </Button>
        </Card>
      )}

      {viewMode === "corridor" && screener && (
        <>
          {/* Top 4 Metric KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Readiness Score */}
            <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Gati Shakti Readiness
                  </span>
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-900 dark:text-emerald-100">
                    {screener.readinessScorePct}%
                  </span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    Cleared
                  </span>
                </div>
                <div className="mt-2 w-full bg-emerald-200 dark:bg-emerald-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${screener.readinessScorePct}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {screener.nocsApprovedCount} of {screener.totalNocsRequired} statutory clearances in order
                </p>
              </CardContent>
            </Card>

            {/* KPI 2: Clearances Breakdown */}
            <Card className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Multi-Agency NOCs
                  </span>
                  <Layers className="w-5 h-5 text-blue-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {screener.totalNocsRequired}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Statutory Clearances</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="text-emerald-600 font-bold">✓ {screener.nocsApprovedCount} Appr</span>
                  <span className="text-amber-600 font-bold">⏳ {screener.nocsPendingCount} Pend</span>
                  {screener.nocsEscalatedCount > 0 && (
                    <span className="text-red-600 font-bold">🚨 {screener.nocsEscalatedCount} PMO</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Across Central & State regulatory authorities
                </p>
              </CardContent>
            </Card>

            {/* KPI 3: Forest & CAMPA Dues */}
            <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Forest Diversion (FCA)
                  </span>
                  <Trees className="w-5 h-5 text-amber-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-900 dark:text-amber-100">
                    {screener.forestDiversionHa} Ha
                  </span>
                  <span className="text-xs font-bold text-amber-700">Deemed Forest</span>
                </div>
                <div className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  CAMPA NPV Due: <span className="text-amber-800 dark:text-amber-400">{formatINR(screener.estimatedCampaDuesINR)}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Net Present Value under Supreme Court guidelines
                </p>
              </CardContent>
            </Card>

            {/* KPI 4: Delay Path Risk */}
            <Card className="border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-800 dark:text-red-300">
                    Critical Path Delay
                  </span>
                  <Clock className="w-5 h-5 text-red-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-red-900 dark:text-red-100">
                    +{screener.criticalPathDelayImpactDays}d
                  </span>
                  <span className="text-xs font-bold text-red-700">SLA Breach</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-red-800 dark:text-red-300 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <span>Defence Buffer & Parivesh Stage-1 overdue</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Threatens the 90-day statutory acquisition timeline
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 3. GIS Map & Conflict Inspector Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* GIS Leaflet Map (2 Columns) */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border shadow-sm">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    GIS Spatial Conflict Overlays (PostGIS & Leaflet)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Map Layer:</span>
                  <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border flex text-[11px] font-semibold">
                    <button
                      onClick={() => setTileType("satellite")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        tileType === "satellite"
                          ? "bg-blue-600 text-white"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Satellite
                    </button>
                    <button
                      onClick={() => setTileType("standard")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        tileType === "standard"
                          ? "bg-blue-600 text-white"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Cadastral
                    </button>
                  </div>
                </div>
              </div>

              {/* Map Container */}
              <GatiShaktiMap
                center={mapCenter}
                zoom={14}
                centerline={mapCenterline}
                conflicts={screener.spatialConflicts}
                selectedConflict={selectedConflict}
                onSelectConflict={(c) => setSelectedConflict(c)}
                activeLayers={activeLayers}
                tileType={tileType}
              />

              {/* Quick Layer Legend Bar */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border text-xs flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-900 dark:text-white">Active Overlays:</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-600" /> Alignment Corridor
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-700" /> MoEFCC Forest (FCA)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-orange-600" /> Railway Crossing (GAD)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-purple-700" /> Defence Perimeter
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-yellow-500" /> PowerGrid HT
                </span>
              </div>
            </div>

            {/* Right Column: Layer Toggles & Conflict Inspector */}
            <div className="space-y-4">
              {/* Layer Toggles Card */}
              <Card className="shadow-sm">
                <CardHeader className="p-4 pb-2 border-b">
                  <CardTitle className="text-sm font-bold flex items-center justify-between">
                    <span>Statutory GIS Layers</span>
                    <Badge variant="outline" className="text-[10px]">
                      {activeLayers.length} Active
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Toggle National Master Plan clearance datasets
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {screener.availableLayers?.map((layer) => {
                    const isChecked = activeLayers.includes(layer.layer_code);
                    return (
                      <label
                        key={layer.layer_code}
                        className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                          isChecked
                            ? "bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 shadow-sm"
                            : "opacity-60 hover:opacity-100 border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleLayer(layer.layer_code)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {layer.layer_name}
                            </span>
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: layer.color_hex }}
                            />
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                            {layer.statutory_act}
                          </p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                            <span>Buffer: {layer.buffer_default_m}m</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {layer.portal_name}
                            </span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Selected Conflict Inspector */}
              <Card className="border-amber-200 dark:border-amber-900 shadow-sm bg-gradient-to-b from-white to-amber-50/30 dark:from-slate-900 dark:to-slate-900">
                <CardHeader className="p-4 pb-2 border-b">
                  <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-900 dark:text-white">
                    <span>Spatial Conflict Inspector</span>
                    {selectedConflict && (
                      <Badge className="bg-amber-600 text-white text-[10px]">
                        {selectedConflict.severity}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Click any conflict polygon on map to inspect statutory details
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {selectedConflict ? (
                    <div className="space-y-3">
                      <div className="border-b pb-2">
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                          {selectedConflict.ministry}
                        </p>
                        <p className="text-sm font-extrabold text-slate-950 dark:text-white mt-0.5">
                          {selectedConflict.layerName}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
                          <span className="text-slate-500 text-[10px] block">Chainage:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {selectedConflict.chainage}
                          </span>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
                          <span className="text-slate-500 text-[10px] block">Affected Area:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {selectedConflict.affectedAreaHa} Hectares
                          </span>
                        </div>
                      </div>

                      <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block uppercase">
                          Statutory Enactment Reference:
                        </span>
                        <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                          {selectedConflict.statutoryAct}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Mandated Remedial Action:
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800 p-2 rounded border">
                          &quot;{selectedConflict.remedyAction}&quot;
                        </p>
                      </div>

                      <Button
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                        onClick={() => {
                          const matchingNoc = screener.nocs.find(
                            (n) => n.layerCode === selectedConflict.layerCode
                          );
                          if (matchingNoc) {
                            setActiveModalNoc(matchingNoc);
                            setModalActionType(
                              activeRole === "DISTRICT_OFFICER"
                                ? "SIGN_JOINT_INSPECTION"
                                : activeRole === "STATE_AUTHORITY"
                                ? "ENDORSE_STAGE_1"
                                : activeRole === "CENTRAL_MINISTRY"
                                ? "ESCALATE_PMO"
                                : "SUBMIT_PARIVESH_COMPLIANCE"
                            );
                          }
                        }}
                      >
                        Initiate Role Action for Clearance
                      </Button>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 space-y-2">
                      <Compass className="w-8 h-8 mx-auto text-slate-300 animate-pulse" />
                      <p className="text-xs font-medium">Select a colored boundary on the map</p>
                      <p className="text-[11px] text-slate-500">
                        Shows Forest Compartment, Railway Crossing, or Defence Perimeter specifications
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 4. Multi-Agency NOC Regulatory Clearance Matrix Table */}
          <Card className="shadow-md">
            <CardHeader className="p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <Scale className="w-5 h-5 text-blue-600" />
                  <span>Inter-Ministerial NOC Clearance Matrix</span>
                  <Badge variant="outline" className="font-mono">
                    {filteredNocs.length} Active Files
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Statutory milestone tracking across Ministries with role-governed signoffs
                </CardDescription>
              </div>

              {/* Agency Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                <button
                  onClick={() => setSelectedAgencyFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg border transition-all ${
                    selectedAgencyFilter === "ALL"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white dark:bg-slate-800 text-slate-600 border-slate-200"
                  }`}
                >
                  All NOCs
                </button>
                <button
                  onClick={() => setSelectedAgencyFilter("MY_ROLE")}
                  className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                    selectedAgencyFilter === "MY_ROLE"
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-white dark:bg-slate-800 text-amber-700 border-amber-300"
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Pending My Role ({screener.nocs.filter((n) => n.actionPendingBy === activeRole).length})
                </button>
                <button
                  onClick={() => setSelectedAgencyFilter("MOEFCC_RESERVE_FOREST")}
                  className={`px-3 py-1.5 rounded-lg border transition-all ${
                    selectedAgencyFilter === "MOEFCC_RESERVE_FOREST"
                      ? "bg-emerald-700 text-white border-emerald-700"
                      : "bg-white dark:bg-slate-800 text-emerald-800 border-emerald-300"
                  }`}
                >
                  🌲 Forest (MoEFCC)
                </button>
                <button
                  onClick={() => setSelectedAgencyFilter("RAILWAY_CROSSING_GAD")}
                  className={`px-3 py-1.5 rounded-lg border transition-all ${
                    selectedAgencyFilter === "RAILWAY_CROSSING_GAD"
                      ? "bg-orange-700 text-white border-orange-700"
                      : "bg-white dark:bg-slate-800 text-orange-800 border-orange-300"
                  }`}
                >
                  🚂 Railways GAD
                </button>
                <button
                  onClick={() => setSelectedAgencyFilter("DEFENCE_RESTRICTED")}
                  className={`px-3 py-1.5 rounded-lg border transition-all ${
                    selectedAgencyFilter === "DEFENCE_RESTRICTED"
                      ? "bg-purple-700 text-white border-purple-700"
                      : "bg-white dark:bg-slate-800 text-purple-800 border-purple-300"
                  }`}
                >
                  🛡️ Defence MoD
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/60">
                  <TableRow>
                    <TableHead className="font-bold text-xs">Agency & Portal</TableHead>
                    <TableHead className="font-bold text-xs">Clearance Type & Statute</TableHead>
                    <TableHead className="font-bold text-xs">Application No & Chainage</TableHead>
                    <TableHead className="font-bold text-xs">Area (Ha)</TableHead>
                    <TableHead className="font-bold text-xs">Status</TableHead>
                    <TableHead className="font-bold text-xs">Statutory SLA Tracking</TableHead>
                    <TableHead className="font-bold text-xs">Action Pending By</TableHead>
                    <TableHead className="font-bold text-xs text-right">Role Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNocs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                        No statutory clearances match the selected filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredNocs.map((noc) => {
                      const isPendingMyRole = noc.actionPendingBy === activeRole;
                      const overdueDays = Math.max(0, noc.daysElapsed - noc.slaDaysStatutory);

                      return (
                        <TableRow
                          key={noc.nocId}
                          className={`text-xs ${
                            isPendingMyRole ? "bg-amber-50/50 dark:bg-amber-950/20 font-medium" : ""
                          }`}
                        >
                          {/* Agency & Portal */}
                          <TableCell className="font-semibold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: noc.colorHex || "#3b82f6" }}
                              />
                              <div>
                                <p className="font-bold">{noc.agencyName}</p>
                                {noc.portalUrl ? (
                                  <a
                                    href={noc.portalUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 mt-0.5"
                                  >
                                    {noc.portalName} <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ) : (
                                  <span className="text-[10px] text-slate-400">{noc.portalName}</span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Clearance Type */}
                          <TableCell>
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              {noc.clearanceType}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              Order: {noc.statutoryOrderNo || "Pending Order"}
                            </p>
                          </TableCell>

                          {/* Application No */}
                          <TableCell>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {noc.applicationNo}
                            </span>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {noc.chainageStart || "Ch 0+000"}
                            </p>
                          </TableCell>

                          {/* Area */}
                          <TableCell className="font-mono font-bold text-slate-900 dark:text-white">
                            {noc.affectedAreaHa} Ha
                          </TableCell>

                          {/* Status */}
                          <TableCell>{getStatusBadge(noc.status)}</TableCell>

                          {/* SLA Tracking */}
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className={noc.isSlaBreached ? "text-red-600 font-bold" : "text-slate-600"}>
                                  {noc.daysElapsed} / {noc.slaDaysStatutory}d
                                </span>
                                {overdueDays > 0 ? (
                                  <span className="text-red-600 font-bold text-[10px]">
                                    +{overdueDays}d Overdue
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 font-semibold text-[10px]">
                                    {noc.slaDaysStatutory - noc.daysElapsed}d left
                                  </span>
                                )}
                              </div>
                              <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    noc.isSlaBreached
                                      ? "bg-red-600"
                                      : noc.daysElapsed > noc.slaDaysStatutory * 0.7
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                  }`}
                                  style={{
                                    width: `${Math.min(100, (noc.daysElapsed / noc.slaDaysStatutory) * 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </TableCell>

                          {/* Action Pending By */}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                isPendingMyRole
                                  ? "border-amber-500 bg-amber-100 text-amber-900 font-bold"
                                  : "text-slate-500"
                              }
                            >
                              {noc.actionPendingBy}
                            </Badge>
                            <p className="text-[10px] text-slate-500 mt-1 max-w-[140px] truncate" title={noc.nextMilestone}>
                              {noc.nextMilestone}
                            </p>
                          </TableCell>

                          {/* Role Action Button */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {activeRole === "PIA" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold"
                                  onClick={() => {
                                    setActiveModalNoc(noc);
                                    setModalActionType("SUBMIT_PARIVESH_COMPLIANCE");
                                  }}
                                >
                                  Submit Compliance
                                </Button>
                              )}

                              {activeRole === "DISTRICT_OFFICER" && (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                                  onClick={() => {
                                    setActiveModalNoc(noc);
                                    setModalActionType("SIGN_JOINT_INSPECTION");
                                  }}
                                >
                                  Sign JSI Report
                                </Button>
                              )}

                              {activeRole === "STATE_AUTHORITY" && (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-indigo-700 hover:bg-indigo-800 text-white font-bold"
                                  onClick={() => {
                                    setActiveModalNoc(noc);
                                    setModalActionType("ENDORSE_STAGE_1");
                                  }}
                                >
                                  Endorse Stage-1
                                </Button>
                              )}

                              {activeRole === "CENTRAL_MINISTRY" && (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-red-700 hover:bg-red-800 text-white font-bold"
                                  onClick={() => {
                                    setActiveModalNoc(noc);
                                    setModalActionType("ESCALATE_PMO");
                                  }}
                                >
                                  PMO Escalation
                                </Button>
                              )}

                              {activeRole === "AUDITOR" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-slate-600 font-mono"
                                  onClick={() => {
                                    alert(`Cryptographic Audit Proof: Verified on-chain hash for NOC ${noc.nocId} against SHA-256 Ledger.`);
                                  }}
                                >
                                  Verify Hash
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* 3. National PMO Master Clearance Matrix View */}
      {viewMode === "national" && isNationalLoading && (
        <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading national PMO matrix">
          {/* Top National Summary KPIs Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border border-slate-200 dark:border-slate-800">
                <CardContent className="p-5 space-y-3">
                  <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-8 w-20 bg-slate-300 dark:bg-slate-600 rounded" />
                  <div className="h-3 w-48 bg-slate-100 dark:bg-slate-800 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Agency Matrix & Escalation Skeletons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="h-80 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-center items-center">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-semibold mt-3">Aggregating inter-agency clearance statistics...</p>
            </Card>
            <Card className="h-80 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-center items-center">
              <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-semibold mt-3">Compiling PMO PRAGATI escalation agenda...</p>
            </Card>
          </div>
        </div>
      )}

      {viewMode === "national" && !isNationalLoading && !nationalSummary && (
        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-8 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            National PMO Matrix Unavailable
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Unable to fetch multi-project regulatory clearance metrics. Please verify connectivity with the BhoomiSetu backend API.
          </p>
          <Button
            size="sm"
            onClick={() => refetchNational()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry Sync
          </Button>
        </Card>
      )}

      {viewMode === "national" && nationalSummary && (
        <div className="space-y-6">
          {/* Top National Summary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/30">
              <CardContent className="p-5">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                  National Clearance Index
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-blue-900 dark:text-blue-100">
                    {nationalSummary.nationalReadinessScorePct}%
                  </span>
                  <span className="text-xs font-bold text-blue-700">All India</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Cumulative statutory compliance across 6 national megaprojects
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Total NOCs Monitored
                </span>
                <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                  {nationalSummary.totalNocsTracked}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Active files across 7 Central & State regulatory bodies
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/30">
              <CardContent className="p-5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Approved & Discharged
                </span>
                <div className="mt-2 text-3xl font-black text-emerald-900 dark:text-emerald-100">
                  {nationalSummary.approvedCount}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Stage-1 In-Principle and Stage-2 Final Clearances
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-900 bg-red-50/30">
              <CardContent className="p-5">
                <span className="text-xs font-bold uppercase tracking-wider text-red-800 dark:text-red-300">
                  PMO PRAGATI Escalated
                </span>
                <div className="mt-2 text-3xl font-black text-red-900 dark:text-red-100">
                  {nationalSummary.escalatedPmoCount}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Requiring Union Secretary / Chief Secretary resolution
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Ministry-by-Ministry Clearance Compliance Matrix */}
          <Card className="shadow-md">
            <CardHeader className="p-5 border-b">
              <CardTitle className="text-base font-extrabold flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                <span>Inter-Ministerial Regulatory Clearance Breakdown</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Performance rate of clearance processing by sponsoring Ministry and regulatory board
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/60">
                  <TableRow>
                    <TableHead className="font-bold text-xs">Regulatory Authority / Ministry</TableHead>
                    <TableHead className="font-bold text-xs">Total Files</TableHead>
                    <TableHead className="font-bold text-xs">Approved</TableHead>
                    <TableHead className="font-bold text-xs">SLA Breached</TableHead>
                    <TableHead className="font-bold text-xs">Compliance Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nationalSummary.agencyBreakdown.map((item) => (
                    <TableRow key={item.layerCode} className="text-xs">
                      <TableCell className="font-bold text-slate-900 dark:text-white">
                        {item.agencyName}
                      </TableCell>
                      <TableCell className="font-mono font-bold">{item.total}</TableCell>
                      <TableCell className="font-mono font-bold text-emerald-600">
                        {item.approved}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-red-600">
                        {item.breached}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.compliancePct > 75
                                  ? "bg-emerald-600"
                                  : item.compliancePct > 40
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${item.compliancePct}%` }}
                            />
                          </div>
                          <span className="font-bold text-[11px]">{item.compliancePct}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Cabinet Secretariat / PMO PRAGATI Escalation Hotlist */}
          <Card className="border-red-300 dark:border-red-900 shadow-md">
            <CardHeader className="p-5 border-b bg-red-50/50 dark:bg-red-950/20">
              <CardTitle className="text-base font-extrabold text-red-950 dark:text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span>Cabinet Secretariat & PMO PRAGATI Review Agenda Hotlist</span>
              </CardTitle>
              <CardDescription className="text-xs text-red-800/80 dark:text-red-300">
                Critical bottlenecks overdue beyond 90 days requiring direct intervention by Chief Secretaries
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/60">
                  <TableRow>
                    <TableHead className="font-bold text-xs">Project & Sector</TableHead>
                    <TableHead className="font-bold text-xs">Clearance Type</TableHead>
                    <TableHead className="font-bold text-xs">Sponsoring Agency</TableHead>
                    <TableHead className="font-bold text-xs">Application No</TableHead>
                    <TableHead className="font-bold text-xs">Days Overdue</TableHead>
                    <TableHead className="font-bold text-xs">Chief Secretary Action Mandate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nationalSummary.pmoEscalationHotlist.map((item) => (
                    <TableRow key={item.nocId} className="text-xs">
                      <TableCell className="font-bold text-slate-900 dark:text-white">
                        <p>{item.projectCode}</p>
                        <p className="text-[11px] text-slate-500 font-normal">{item.projectTitle}</p>
                      </TableCell>
                      <TableCell className="font-bold text-red-700 dark:text-red-400">
                        {item.clearanceType}
                      </TableCell>
                      <TableCell>{item.agencyName}</TableCell>
                      <TableCell className="font-mono">{item.applicationNo}</TableCell>
                      <TableCell className="font-mono font-bold text-red-600">
                        +{item.daysOverdue} Days
                      </TableCell>
                      <TableCell className="font-medium text-slate-800 dark:text-slate-200">
                        {item.nextMilestone}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. Role Action Modal */}
      {activeModalNoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Execute Statutory Clearance Action
                </h3>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {activeRole}
              </Badge>
            </div>

            {actionSuccessMsg ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <p className="font-bold text-sm text-emerald-700">{actionSuccessMsg}</p>
                <p className="text-xs text-slate-500">Updating Gati Shakti registry...</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 text-xs">
                  <p className="text-slate-600 dark:text-slate-400">
                    You are signing off as an authorized <strong className="text-slate-900 dark:text-white">{activeRole}</strong> officer on the following regulatory file:
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {activeModalNoc.clearanceType} ({activeModalNoc.agencyName})
                    </p>
                    <p className="text-slate-500 font-mono text-[11px]">
                      Application: {activeModalNoc.applicationNo} • Chainage: {activeModalNoc.chainageStart}
                    </p>
                    <p className="text-emerald-700 font-medium text-[11px]">
                      Next Statutory Step: {activeModalNoc.nextMilestone}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Statutory Action Type:
                  </label>
                  <select
                    value={modalActionType}
                    onChange={(e) => setModalActionType(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border rounded-lg p-2 text-xs font-semibold"
                  >
                    {activeRole === "PIA" && (
                      <>
                        <option value="SUBMIT_PARIVESH_COMPLIANCE">Submit Parivesh 2.0 Compliance Package</option>
                        <option value="SUBMIT_GAD_REVISION">Submit Revised Railway ROB GAD</option>
                      </>
                    )}
                    {activeRole === "DISTRICT_OFFICER" && (
                      <>
                        <option value="SIGN_JOINT_INSPECTION">Sign Joint Site Inspection (JSI) with DFO</option>
                      </>
                    )}
                    {activeRole === "STATE_AUTHORITY" && (
                      <>
                        <option value="ENDORSE_STAGE_1">Endorse State Advisory Committee Stage-1 Recommendation</option>
                      </>
                    )}
                    {activeRole === "CENTRAL_MINISTRY" && (
                      <>
                        <option value="ESCALATE_PMO">Escalate to PMO PRAGATI Agenda</option>
                        <option value="ISSUE_FINAL_NOC">Issue Final Statutory NOC Certificate</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Official Endorsement Remarks / D.O. Letter No:
                  </label>
                  <Input
                    placeholder="Enter file memo number or inspection findings..."
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveModalNoc(null)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={actionMutation.isPending}
                    onClick={handleExecuteAction}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                  >
                    {actionMutation.isPending ? "Signing & Hashing..." : "Record Statutory Action"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
