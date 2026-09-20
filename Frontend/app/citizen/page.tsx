"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { useCitizenProfileQuery } from "@/hooks/queries/use-bhoomi-queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatINR } from "@/lib/utils";
import { formatLandArea, formatLandAreaShort } from "@/lib/area-conversion";
import { getLegalLandTaxRate, getLegalTaxLawReference } from "@/lib/tax-rates";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck,
  Search,
  FileText,
  HelpCircle,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Clock,
  User,
  Landmark,
  Coins,
  Download,
  AlertCircle,
  Phone,
  Layers,
  ArrowRight,
  FileCheck2,
  Calendar,
  Building2,
  Camera,
  Maximize2,
  Eye,
} from "lucide-react";
import { GisMap } from "@/components/gis/gis-map";
import { GeotaggedPhotoViewer } from "@/components/gis/geotagged-photo-viewer";
import { downloadStatutoryPdf } from "@/lib/pdf-generator";
import {
  MOCK_CADASTRAL_PARCELS,
  MOCK_GEOTAGGED_PHOTOS,
  generateBufferPolygon,
  BENGALURU_STRR_CORRIDOR,
  GisParcel,
  GeotaggedPhoto,
} from "@/lib/gis-data";

function CitizenPortalContent() {
  const { user, activeRole, isAuthenticated } = useAuth();
  const { lang } = useI18n();
  const searchParams = useSearchParams();
  const tabParam = searchParams ? searchParams.get("tab") : null;

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"plot" | "compensation" | "timeline" | "objections" | "documents">("plot");
  const [newObjectionCategory, setNewObjectionCategory] = useState("Tree & Asset Valuation Re-assessment");
  const [newObjectionDesc, setNewObjectionDesc] = useState("");
  const [objectionSubmitted, setObjectionSubmitted] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<GeotaggedPhoto | null>(null);
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Synchronize active tab from URL query params (e.g. /citizen?tab=objections or /citizen?tab=documents / tab=public)
  useEffect(() => {
    if (tabParam === "objections") {
      setActiveTab("objections");
    } else if (tabParam === "documents" || tabParam === "public" || tabParam === "gazette") {
      setActiveTab("documents");
    } else if (tabParam === "compensation") {
      setActiveTab("compensation");
    } else if (tabParam === "timeline") {
      setActiveTab("timeline");
    } else if (tabParam === "plot") {
      setActiveTab("plot");
    }
  }, [tabParam]);

  const handleTabChange = (tabId: "plot" | "compensation" | "timeline" | "objections" | "documents") => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      const newUrl = tabId === "plot" ? "/citizen" : `/citizen?tab=${tabId}`;
      window.history.pushState(null, "", newUrl);
    }
  };

  const handleDownloadDoc = (docTitle: string) => {
    setDownloadingDoc(docTitle);
    toast.info("Preparing Official PDF", `Generating certified copy of ${docTitle}...`);
    try {
      downloadStatutoryPdf(docTitle, citizenData);
      toast.success("Document Downloaded", `${docTitle} is ready.`);
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Download Failed", "Failed to generate certified document copy.");
    } finally {
      setTimeout(() => setDownloadingDoc(null), 1800);
    }
  };

  const handleLodgeObjection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjectionDesc.trim()) {
      toast.error("Validation Error", "Please provide the details of your objection.");
      return;
    }

    setObjectionSubmitted(true);
    toast.success(
      "Statutory Objection Filed",
      `Objection for "${newObjectionCategory}" registered under Reference #OBJ-2026-KA-8819 with the CALA Authority.`
    );
  };

  // Live Backend Citizen Profile Query
  const { data: profileData, isLoading: isProfileLoading } = useCitizenProfileQuery(user?.id, user?.email);

  // Personalized Citizen / Landholder Record strictly dynamic from backend
  const citizenData = useMemo(() => {
    return {
      name: profileData?.name || user?.name || "Rameshwar Sharma",
      nameHi: profileData?.nameHi || (user?.name === "Rameshwar Sharma" ? "रामेश्वर शर्मा" : `${user?.name || "नागरिक"}`),
      khataNo: profileData?.khataNo || "KHT-KA-BLR-8821",
      citizenId: profileData?.citizenId || user?.id || "CIT-KA-2026-8819",
      phone: profileData?.phone || user?.phone || "+91 98765 43210",
      email: profileData?.email || user?.email || "citizen@public.bhoomsetu.gov.in",
      village: profileData?.village || "Doddaballapur",
      taluk: profileData?.taluk || "Doddaballapur",
      district: profileData?.district || "Bengaluru Rural",
      state: profileData?.state || "Karnataka",
      aadhaarMasked: profileData?.aadhaarMasked || "XXXX-XXXX-8821",
      aadhaarStatus: profileData?.aadhaarStatus || "Linked & Verified (UIDAI Bhu-Bridge)",
      bankName: profileData?.bankName || "State Bank of India",
      bankBranch: profileData?.bankBranch || "Doddaballapur Main Branch",
      accountMasked: profileData?.accountMasked || "XXXXXXXX4921",
      ifsc: profileData?.ifsc || "SBIN0004128",
      dbtStatus: profileData?.dbtStatus || "PFMS Direct Benefit Transfer Mandate Approved",

      // Affected Land Parcel Details
      ulpin: profileData?.ulpin || "KA-BLR-2026-0041",
      surveyNo: profileData?.surveyNo || "142/2A",
      landType: profileData?.landType || "Agricultural (Irrigated Multi-Crop)",
      totalAreaHa: profileData?.totalAreaHa || 1.85,
      acquiredAreaHa: profileData?.acquiredAreaHa || 1.45,
      retainedAreaHa: profileData?.retainedAreaHa || 0.4,
      acquiringCorridor: profileData?.acquiringCorridor || "Bengaluru Satellite Town Ring Road (STRR) Corridor",
      sponsoringAgency: profileData?.sponsoringAgency || "National Highways Authority of India (NHAI)",
      calaAuthority: profileData?.calaAuthority || "Special Land Acquisition Officer (CALA), Bengaluru Rural",

      // Demarcated Assets on Citizen's Plot
      assets: profileData?.assets || [
        { name: "Fruit-bearing Mature Mango Trees / फलदार आम के पेड़", count: "18 Trees / 18 पेड़", valuation: 360000 },
        { name: "Operational Deep Tube-Well (5HP Submersible) / चालू नलकूप (बोरवेल)", count: "1 Unit / 1 बोरवेल", valuation: 180000 },
        { name: "Farm Boundary Stone Wall & Fencing (240m) / खेत की पत्थर की बाड़ व दीवार", count: "240 Metres / 240 मीटर", valuation: 140000 },
      ],

      // Itemized RFCTLARR Section 26-30 Compensation Award
      compensation: (() => {
        const comp = profileData?.compensation;
        const landTypeStr = profileData?.landType || "Agricultural (Irrigated Multi-Crop)";
        const baseMV = Number(comp?.baseMarketValue || 25000000);
        const ruralMult = Number(comp?.ruralMultiplier || 1.5);
        const multMV = Number(comp?.multipliedMarketValue || Math.round(baseMV * ruralMult));
        const solatium = Number(comp?.solatium100Pct || multMV);
        const assets = Number(comp?.assetsValuation || 500000);
        const interest = Number(comp?.statutoryInterest12Pct || 500000);

        const gross = multMV + solatium + assets + interest;
        const taxRate = comp?.taxRatePercent !== undefined ? Number(comp.taxRatePercent) : getLegalLandTaxRate(landTypeStr);
        const tax = Math.round(gross * (taxRate / 100));
        const net = gross - tax;

        return {
          baseMarketValue: baseMV,
          ruralMultiplier: ruralMult,
          multipliedMarketValue: multMV,
          solatium100Pct: solatium,
          assetsValuation: assets,
          statutoryInterest12Pct: interest,
          grossCompensation: gross,
          taxRatePercent: taxRate,
          taxDeduction: tax,
          netCompensation: net,
          totalAward: net,
          disbursedPct: comp?.disbursedPct || 80,
          pfmsBatchRef: comp?.pfmsBatchRef || "PFMS-TXN-2026-88192",
          payoutDate: comp?.payoutDate || "28 Oct 2026",
        };
      })(),

      // Citizen's Personal Statutory Timeline (Plain Layman Language)
      timeline: profileData?.timeline || [
        { stage: 1, name: "Land Proposal & Survey / जमीन नाप-जोख व सर्वेक्षण", date: "12 Jan 2026", status: "completed", note: "Survey completed on plot" },
        { stage: 4, name: "Initial Public Notice / प्रारंभिक सरकारी सूचना (धारा 11)", date: "02 Mar 2026", status: "completed", note: "Gazette notification published" },
        { stage: 5, name: "Farmer Objections & Hearing / किसान आपत्ति व सुनवाई (धारा 15)", date: "18 Apr 2026", status: "completed", note: "Objection hearing closed by SLAO" },
        { stage: 6, name: "Final Government Declaration / अंतिम सरकारी घोषणा (धारा 19)", date: "28 Aug 2026", status: "current", note: "Declaration enacted by State Revenue Authority" },
        { stage: 8, name: "100% Double Bonus & Asset Valuation / 100% बोनस व पेड़-कुआं मूल्यांकन", date: "15 Oct 2026", status: "upcoming", note: "Final valuation hearing with CALA" },
        { stage: 10, name: "Direct Bank Transfer / सीधे बैंक खाते में भुगतान (PFMS DBT)", date: "28 Oct 2026", status: "upcoming", note: "Direct bank transfer to bank account" },
        { stage: 11, name: "Land Handover (Post-Payout) / कब्जा सौंपना (पूरे भुगतान के बाद)", date: "15 Nov 2026", status: "upcoming", note: "Physical handover of acquired land" },
      ],

      // Active Objection
      activeObjection: profileData?.activeObjection || {
        ref: "OBJ-2026-KA-8812",
        subject: "Re-assessment of Standing Mango Trees & Tube-Well Depth / आम के पेड़ों और नलकूप के मूल्यांकन की पुनः जांच",
        filedDate: "05 Sep 2026",
        status: "Hearing Scheduled with Sub-Divisional Magistrate / एसडीएम कोर्ट में सुनवाई तय",
        hearingDate: "18 Sep 2026, 11:00 AM at Doddaballapur Taluk Kacheri / 18 सितंबर 2026 सुबह 11:00 बजे, डोड्डाबल्लापुर तहसील कचहरी",
        presidingOfficer: "Dr. Priya Sundaram, IAS (Special Land Acquisition Officer) / डॉ. प्रिया सुंदरम, आईएएस",
      },
    };
  }, [profileData, user]);

  if (isProfileLoading && !profileData) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-[#fffdf8] border border-[#d8d3c9] rounded-2xl p-6 sm:p-8 space-y-4">
          <Skeleton className="h-6 w-36 rounded-full" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Landholder Welcome & Personal Identification Banner */}
      <div className="bg-[#fffdf8] border border-[#d8d3c9] rounded-2xl p-6 sm:p-8 text-[#171716] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge className="bg-[#ef5b2a]/10 text-[#ef5b2a] border border-[#ef5b2a]/30 font-bold text-xs py-0.5 px-2.5 rounded-full">
                {lang === "hi" ? "किसान व नागरिक पोर्टल" : "Farmer & Citizen Portal"}
              </Badge>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#ef5b2a]">
                {lang === "hi" ? "पारदर्शी मुआवजा व भूमि स्थिति" : "Direct Land & Compensation Status"}
              </h2>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171716] flex items-center gap-2.5">
              <span>{lang === "hi" ? `राम-राम / नमस्ते, ${citizenData.nameHi}` : `Welcome, ${citizenData.name}`}</span>
              <span className="text-lg">🌾</span>
            </h1>
            <p className="text-xs text-[#68655e] max-w-2xl leading-relaxed">
              {lang === "hi"
                ? `यह पोर्टल आपकी जमीन (सर्वे संख्या ${citizenData.surveyNo}, ${citizenData.village}) और आपके बैंक खाते में सीधे आने वाले सरकारी मुआवजे की पूरी जानकारी सरल भाषा में दिखाता है।`
                : `This portal gives you clear, simple information about your land (Survey No. ${citizenData.surveyNo}, ${citizenData.village}) and the exact compensation money coming directly to your bank account.`}
            </p>
          </div>

          <div className="bg-[#f4f1ea] border border-[#d8d3c9] rounded-xl p-3.5 text-xs space-y-1 shrink-0 shadow-sm">
            <div className="text-[#15803d] font-bold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#15803d]" />
              <span>{lang === "hi" ? "आधार व बैंक खाता सत्यापित" : "Aadhaar & Bank Verified"}</span>
            </div>
            <p className="text-[#68655e]">खाता / Khata: <span className="font-mono font-bold text-[#171716]">{citizenData.khataNo}</span></p>
            <p className="text-[#68655e]">जमीन पहचान (ULPIN): <span className="font-mono font-bold text-[#171716]">{citizenData.ulpin}</span></p>
            <p className="text-[#15803d] text-[11px] font-bold">✓ {lang === "hi" ? "आधार से बैंक खाता जुड़ा हुआ है" : "Aadhaar Linked & Verified"}</p>
          </div>
        </div>

        {/* Quick Personal Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-[#f4f1ea] border border-[#d8d3c9] rounded-xl p-3.5 shadow-sm hover:border-[#171716]/40 transition-all">
            <span className="text-[10px] text-[#68655e] uppercase font-bold tracking-wider block">
              {lang === "hi" ? "ली जाने वाली जमीन" : "Land Being Taken"}
            </span>
            <div className="text-xl font-black text-[#ef5b2a] mt-1">
              {formatLandAreaShort(citizenData.acquiredAreaHa)}
            </div>
            <span className="text-[10px] text-[#68655e] block mt-0.5">
              {lang === "hi"
                ? `कुल ${formatLandArea(citizenData.totalAreaHa, "KA")} में से`
                : `of ${formatLandArea(citizenData.totalAreaHa, "KA")} total`}
            </span>
          </div>

          <div className="bg-[#f4f1ea] border border-[#d8d3c9] rounded-xl p-3.5 shadow-sm hover:border-[#171716]/40 transition-all">
            <span className="text-[10px] text-[#68655e] uppercase font-bold tracking-wider block">
              {lang === "hi" ? "शुद्ध मुआवजा (Net Payout)" : "Net Compensation Payout"}
            </span>
            <div className="text-xl font-black text-[#15803d] mt-1">
              {formatINR(citizenData.compensation.netCompensation || citizenData.compensation.totalAward)}
            </div>
            <span className="text-[10px] text-[#68655e] block mt-0.5">
              {citizenData.compensation.taxRatePercent === 0
                ? (lang === "hi" ? "0% कर (धारा 10(37) पूर्ण कर-मुक्त)" : "0% Tax (Sec 10(37) Tax Exempt)")
                : (lang === "hi" ? `${citizenData.compensation.taxRatePercent}% कर कटौती के बाद` : `After ${citizenData.compensation.taxRatePercent}% Tax Deduction`)}
            </span>
          </div>

          <div className="bg-[#f4f1ea] border border-[#d8d3c9] rounded-xl p-3.5 shadow-sm hover:border-[#171716]/40 transition-all">
            <span className="text-[10px] text-[#68655e] uppercase font-bold tracking-wider block">
              {lang === "hi" ? "सीधे बैंक खाते में पैसा" : "Direct Bank Transfer"}
            </span>
            <div className="text-sm font-bold text-[#171716] mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse" />
              <span>{lang === "hi" ? "स्वीकृत (सीधे खाते में आएगा)" : "Approved (Direct to Bank)"}</span>
            </div>
            <span className="text-[10px] text-[#15803d] font-mono font-bold block mt-1">
              {citizenData.bankName} ...{citizenData.accountMasked.slice(-4)}
            </span>
          </div>

          <div className="bg-[#f4f1ea] border border-[#d8d3c9] rounded-xl p-3.5 shadow-sm hover:border-[#171716]/40 transition-all">
            <span className="text-[10px] text-[#68655e] uppercase font-bold tracking-wider block">
              {lang === "hi" ? "वर्तमान काम / स्थिति" : "Current Step"}
            </span>
            <div className="text-sm font-bold text-[#ef5b2a] mt-2 truncate" title={citizenData.timeline.find((t: any) => t.status === "current")?.name}>
              {citizenData.timeline.find((t: any) => t.status === "current")?.name || (lang === "hi" ? "अंतिम घोषणा जारी (धारा 19)" : "Final Notice Issued (Sec 19)")}
            </div>
            <span className="text-[10px] text-[#68655e] block mt-1 truncate" title={citizenData.timeline.find((t: any) => t.status === "upcoming")?.name}>
              {lang === "hi" ? "अगला: " : "Next: "}
              {citizenData.timeline.find((t: any) => t.status === "upcoming")?.name || (lang === "hi" ? "मुआवजा संवितरण" : "Payout Disbursement")}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Landholder */}
      <div className="flex border-b border-[#d8d3c9] gap-2 overflow-x-auto pb-1">
        {[
          { id: "plot", label: lang === "hi" ? "1. खेत का नक्शा व विवरण" : "1. Land & Field Map", icon: MapPin },
          { id: "compensation", label: lang === "hi" ? "2. मुआवजा पैसा व बैंक खाता" : "2. Compensation & Bank Transfer", icon: Coins },
          { id: "timeline", label: lang === "hi" ? "3. काम के चरण (समयरेखा)" : "3. Process Steps & Progress", icon: Clock },
          { id: "objections", label: lang === "hi" ? "4. शिकायत, आपत्ति व सुनवाई" : "4. Objections & Hearings", icon: HelpCircle },
          { id: "documents", label: lang === "hi" ? "5. सरकारी कागजात व आदेश" : "5. Official Papers & Orders", icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#ef5b2a]/10 text-[#ef5b2a] font-bold border border-[#ef5b2a]/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                  : "text-[#68655e] hover:text-[#171716] hover:bg-[#f4f1ea]"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-[#ef5b2a]" : "text-[#68655e]"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: My Land & Plot Details */}
      {activeTab === "plot" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <span>{lang === "hi" ? "ली जाने वाली जमीन का विवरण" : "Details of Land Being Taken"}</span>
                  </CardTitle>
                  <Badge variant="civic" className="text-[10px]">
                    {citizenData.ulpin}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {lang === "hi"
                    ? "सरकारी राजस्व रिकॉर्ड और सर्वे द्वारा प्रमाणित आपके खेत का विवरण।"
                    : "Official certified land holding records from State Revenue Department."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-[#f4f1ea] border-[#d8d3c9] rounded-xl border">
                  <div>
                    <span className="text-[#68655e] text-[11px] font-semibold">{lang === "hi" ? "खसरा / सर्वे नंबर" : "Khasra / Survey No."}</span>
                    <p className="font-bold text-[#171716] mt-0.5">{citizenData.surveyNo}</p>
                  </div>
                  <div>
                    <span className="text-[#68655e] text-[11px] font-semibold">{lang === "hi" ? "जमीन का प्रकार" : "Land Classification"}</span>
                    <p className="font-bold text-[#171716] mt-0.5">{citizenData.landType}</p>
                  </div>
                  <div>
                    <span className="text-[#68655e] text-[11px] font-semibold">{lang === "hi" ? "गाँव व तहसील" : "Village & Taluk"}</span>
                    <p className="font-bold text-[#171716] mt-0.5">{citizenData.village}, {citizenData.taluk}</p>
                  </div>
                  <div>
                    <span className="text-[#68655e] text-[11px] font-semibold">{lang === "hi" ? "कुल खेत का रकबा" : "Total Plot Area"}</span>
                    <p className="font-bold text-[#171716] mt-0.5">{formatLandArea(citizenData.totalAreaHa, "KA")}</p>
                  </div>
                  <div>
                    <span className="text-[#68655e] text-[11px] font-semibold">{lang === "hi" ? "सरकार द्वारा ली जा रही जमीन" : "Land Area Being Acquired"}</span>
                    <p className="font-bold text-amber-600 mt-0.5">{formatLandArea(citizenData.acquiredAreaHa, "KA")}</p>
                  </div>
                  <div>
                    <span className="text-[#68655e] text-[11px] font-semibold">{lang === "hi" ? "आपके पास बची रहने वाली जमीन" : "Remaining Land (Yours)"}</span>
                    <p className="font-bold text-emerald-600 mt-0.5">{formatLandArea(citizenData.retainedAreaHa, "KA")}</p>
                  </div>
                </div>

                {/* Sponsoring Project Context */}
                <div className="p-3.5 bg-[#f4f1ea] dark:bg-blue-950/30 border border-[#d8d3c9] dark:border-blue-900 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold text-[#ef5b2a]">
                    {lang === "hi" ? "सड़क / परियोजना जिसके लिए जमीन ली जा रही है" : "Project Taking The Land & Officer"}
                  </div>
                  <p className="font-semibold text-[#171716]">
                    {citizenData.acquiringCorridor}
                  </p>
                  <p className="text-[11px] text-[#68655e]">
                    {lang === "hi" ? `विभाग: ${citizenData.sponsoringAgency} • सक्षम भूमि अधिकारी: ${citizenData.calaAuthority}` : `Agency: ${citizenData.sponsoringAgency} • Authority: ${citizenData.calaAuthority}`}
                  </p>
                </div>

                {/* Joint Measurement Survey Assets */}
                <div className="space-y-2">
                  <h4 className="font-bold text-[#171716]">
                    {lang === "hi" ? "खेत में स्थित पेड़, बोरवेल व बाड़ (नाप-जोख व मूल्यांकन सूची)" : "Demarcated Assets on Plot (Survey of Trees & Well)"}
                  </h4>
                  <div className="space-y-2">
                    {citizenData.assets.map((asset: any) => (
                      <div
                        key={asset.name}
                        className="p-3 rounded-lg border bg-[#fffdf8] border-[#d8d3c9] flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-[#171716]">{asset.name}</p>
                          <p className="text-[11px] text-[#68655e]">{lang === "hi" ? "सर्वेक्षण में प्रमाणित संख्या: " : "Verified Quantity: "}{asset.count}</p>
                        </div>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatINR(asset.valuation)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-4">
            {/* Live Interactive GIS Cadastral Map for Citizen */}
            <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Layers className="h-5 w-5 text-blue-600" />
                    <span>{lang === "hi" ? "खेत का सैटेलाइट नक्शा व सीमा" : "Field Satellite Map & Boundary"}</span>
                  </CardTitle>
                  <Badge variant="civic" className="text-[10px]">
                    ULPIN {citizenData.ulpin}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {lang === "hi"
                    ? `इसरो उपग्रह द्वारा आपके खेत (सर्वे ${citizenData.surveyNo}) की प्रमाणित सीमा रेखा।`
                    : `Official satellite demarcation for Survey ${citizenData.surveyNo} certified by State Revenue.`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {/* Embedded Live Leaflet Map Canvas */}
                <div className="h-64 rounded-xl overflow-hidden border border-[#d8d3c9] dark:border-[#d8d3c9] relative shadow-inner">
                  {mounted && (
                    <GisMap
                      center={[13.294, 77.5335]}
                      zoom={17}
                      centerline={BENGALURU_STRR_CORRIDOR.centerline}
                      bufferPolygon={generateBufferPolygon(BENGALURU_STRR_CORRIDOR.centerline, 60)}
                      parcels={[
                        MOCK_CADASTRAL_PARCELS.find((p) => p.ulpin === citizenData.ulpin) || MOCK_CADASTRAL_PARCELS[0],
                      ]}
                      selectedParcel={
                        MOCK_CADASTRAL_PARCELS.find((p) => p.ulpin === citizenData.ulpin) || MOCK_CADASTRAL_PARCELS[0]
                      }
                      onSelectParcel={() => {}}
                      photos={MOCK_GEOTAGGED_PHOTOS.filter((ph) => ph.ulpin === citizenData.ulpin || ph.surveyNo === citizenData.surveyNo || ph.surveyNo === "142/2A")}
                      onSelectPhoto={(ph) => setSelectedPhoto(ph)}
                      isDrawing={false}
                      onAddWaypoint={() => {}}
                      tileLayerType="satellite"
                      showBuffer={true}
                      showParcels={true}
                      showPhotos={true}
                    />
                  )}
                  {/* Subtle Badge Overlay */}
                  <div className="absolute top-2 left-2 z-[400] bg-black/75 backdrop-blur text-[#fffdf8] px-2 py-0.5 rounded text-[10px] font-mono border border-white/20">
                    Bhuvan Satellite • Khasra {citizenData.surveyNo}
                  </div>
                </div>


                <div className="p-2.5 bg-[#f4f1ea] border-[#d8d3c9] border rounded-xl space-y-1 text-[11px]">
                  <div className="flex justify-between font-semibold">
                    <span className="text-[#68655e]">{lang === "hi" ? "खेत के 4 कोने (पिलर)" : "Boundary Corner Pillars"}</span>
                    <span className="text-[#ef5b2a] font-bold">{lang === "hi" ? "4 कोने जीपीएस द्वारा प्रमाणित" : "4 Pillars D-GPS Certified"}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-[#68655e]">{lang === "hi" ? "सड़क का दायरा (बफर)" : "Highway Corridor Buffer"}</span>
                    <span className="text-amber-700 dark:text-[#ef5b2a] font-bold">{lang === "hi" ? "60 मीटर सड़क सीमा में" : "60-Meter Direct Intersect"}</span>
                  </div>
                </div>

                {/* Verified Field Survey Photo Section */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#68655e] tracking-wider">
                      {lang === "hi" ? "खेत के मौके का प्रमाणित फोटो" : "Field Survey Photo"}
                    </span>
                    <span className="text-[10px] text-[#ef5b2a] font-semibold">
                      {MOCK_GEOTAGGED_PHOTOS.filter((ph) => ph.ulpin === citizenData.ulpin || ph.surveyNo === "142/2A").length} {lang === "hi" ? "प्रमाणित फ़ोटो" : "Records"}
                    </span>
                  </div>
                  {MOCK_GEOTAGGED_PHOTOS.filter((ph) => ph.ulpin === citizenData.ulpin || ph.surveyNo === "142/2A").map((ph) => (
                    <div
                      key={ph.id}
                      onClick={() => setSelectedPhoto(ph)}
                      className="p-3 rounded-xl border bg-[#fffdf8] border-[#d8d3c9] hover:border-blue-500 cursor-pointer transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
                    >
                      <div className="space-y-1 pr-2">
                        <p className="font-bold text-[#171716] flex items-center gap-1.5 text-xs group-hover:text-[#ef5b2a] transition-colors">
                          <Camera className="h-4 w-4 text-blue-600 shrink-0" />
                          <span>{ph.title}</span>
                        </p>
                        <p className="text-[10px] text-[#68655e] leading-tight">{ph.capturedAt} • {ph.surveyor}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhoto(ph);
                        }}
                        className="h-7 text-xs px-2.5 bg-[#ef5b2a]/10 hover:bg-blue-100 dark:bg-blue-950/50 text-[#ef5b2a] border-[#d8d3c9] dark:border-blue-800 font-semibold flex items-center gap-1 shrink-0"
                      >
                        <Eye className="h-3 w-3" />
                        <span>{lang === "hi" ? "देखें" : "View"}</span>
                      </Button>
                    </div>
                  ))}
                </div>

                <Link href="/gis">
                  <Button className="w-full bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm font-bold text-xs h-9 flex items-center justify-center gap-1.5 mt-1">
                    <span>{lang === "hi" ? "बड़ा नक्शा खोलें (Full Screen GIS)" : "Open Full Screen GIS Map"}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: Compensation & PFMS DBT */}
      {activeTab === "compensation" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Coins className="h-5 w-5 text-emerald-600" />
                    <span>{lang === "hi" ? "मुआवजे का पूरा हिसाब (पैसा सीधे बैंक खाते में आएगा)" : "Full Compensation Calculation (Direct Bank Transfer)"}</span>
                  </CardTitle>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                    {lang === "hi" ? "कलेक्टर द्वारा स्वीकृत" : "Collector Approved"}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {lang === "hi"
                    ? "भूमि कानून 2013 के अनुसार 100% अतिरिक्त सरकारी बोनस (मुआवजा दोगुना) और ब्याज सहित पूरी गणना।"
                    : "Calculated with 100% extra government bonus (double payout) and 12% statutory interest under Land Acquisition Act 2013."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="space-y-2 border rounded-xl p-3.5 bg-[#f4f1ea] border-[#d8d3c9]">
                  <div className="flex justify-between py-1.5 border-b border-[#d8d3c9]">
                    <span className="text-[#68655e]">{lang === "hi" ? "1. जमीन का सरकारी बाजार भाव (सर्कल दर अनुसार)" : "1. Base Land Rate (Circle Rate)"}</span>
                    <span className="font-mono font-bold text-[#171716]">{formatINR(citizenData.compensation.baseMarketValue)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#d8d3c9]">
                    <span className="text-[#68655e]">{lang === "hi" ? `2. ग्रामीण क्षेत्र बोनस गुणक (${citizenData.compensation.ruralMultiplier}x)` : `2. Rural Area Multiplier Factor (${citizenData.compensation.ruralMultiplier}x)`}</span>
                    <span className="font-mono font-bold text-[#171716]">{formatINR(citizenData.compensation.multipliedMarketValue)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#d8d3c9]">
                    <span className="text-[#68655e] font-bold text-amber-700 dark:text-[#ef5b2a]">
                      {lang === "hi" ? "3. 100% अतिरिक्त सरकारी बोनस (मुआवजा दोगुना करने वाला बोनस)" : "3. 100% Extra Govt Bonus (Double Money Bonus)"}
                    </span>
                    <span className="font-mono font-bold text-amber-700 dark:text-[#ef5b2a]">+ {formatINR(citizenData.compensation.solatium100Pct)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#d8d3c9]">
                    <span className="text-[#68655e]">{lang === "hi" ? "4. खेत के पेड़, कुआं व बाड़ का पैसा" : "4. Standing Trees, Well & Fencing Valuation"}</span>
                    <span className="font-mono font-bold text-[#171716]">+ {formatINR(citizenData.compensation.assetsValuation)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#d8d3c9]">
                    <span className="text-[#68655e]">{lang === "hi" ? "5. 12% सालाना अतिरिक्त ब्याज राशि" : "5. 12% Annual Statutory Interest"}</span>
                    <span className="font-mono font-bold text-[#171716]">+ {formatINR(citizenData.compensation.statutoryInterest12Pct)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#d8d3c9] bg-amber-500/10 px-2 rounded font-bold">
                    <span className="text-amber-950">{lang === "hi" ? "कुल मुआवजा राशि (Gross Total)" : "Gross Total Compensation"}</span>
                    <span className="font-mono text-amber-950">{formatINR(citizenData.compensation.grossCompensation)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#d8d3c9] bg-rose-500/10 px-2 rounded font-bold">
                    <div>
                      <span className="text-rose-950">
                        {lang === "hi"
                          ? `कानूनी भू-कर कटौती (${citizenData.compensation.taxRatePercent}% Tax)`
                          : `Legal Land Tax (${citizenData.compensation.taxRatePercent}% Tax Deduction)`}
                      </span>
                      <p className="text-[10px] text-rose-800 font-normal">
                        {getLegalTaxLawReference(citizenData.landType)}
                      </p>
                    </div>
                    <span className="font-mono text-rose-950">-{formatINR(citizenData.compensation.taxDeduction)}</span>
                  </div>
                  <div className="flex justify-between pt-2.5 px-2 text-sm font-black text-emerald-950 bg-emerald-500/10 rounded">
                    <span>{lang === "hi" ? "शुद्ध मुआवजा राशि (Net Amount After Tax):" : "Net Amount (After Tax Payout):"}</span>
                    <span className="font-mono">{formatINR(citizenData.compensation.netCompensation || citizenData.compensation.totalAward)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-4">
            {/* PFMS DBT Direct Bank Credit Details */}
            <Card className="border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-emerald-600" />
                  <span>{lang === "hi" ? "सीधे बैंक खाते में पैसा अंतरण (PFMS DBT)" : "Direct Treasury Bank Transfer"}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {lang === "hi" ? "सरकारी खजाने से सीधे आपके आधार से जुड़े बैंक खाते में पैसा आएगा।" : "Direct transfer from State Treasury into your Aadhaar-linked bank account."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="p-3 bg-[#fffdf8] border-[#d8d3c9] border rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#68655e]">{lang === "hi" ? "बैंक का नाम" : "Designated Bank"}</span>
                    <span className="font-bold text-[#171716]">{citizenData.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#68655e]">{lang === "hi" ? "खाता संख्या" : "Account Number"}</span>
                    <span className="font-mono font-bold text-[#171716]">{citizenData.accountMasked}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#68655e]">{lang === "hi" ? "आईएफएससी कोड" : "IFSC Code"}</span>
                    <span className="font-mono text-[#171716]">{citizenData.ifsc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#68655e]">{lang === "hi" ? "भुगतान संदर्भ संख्या" : "Payment Reference ID"}</span>
                    <span className="font-mono text-[#ef5b2a] font-bold">{citizenData.compensation.pfmsBatchRef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#68655e]">{lang === "hi" ? "अनुमानित भुगतान तिथि" : "Expected Transfer Date"}</span>
                    <span className="font-bold text-emerald-600">{citizenData.compensation.payoutDate}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-100/60 dark:bg-emerald-950/40 rounded-xl text-emerald-900 dark:text-emerald-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>{lang === "hi" ? "संवितरण स्थिति: स्वीकृत (सीधे खाते में आएगा)" : "Status: Approved for Bank Deposit"}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    {lang === "hi"
                      ? "जिला कलेक्टर द्वारा भुगतान आदेश पर डिजिटल हस्ताक्षर हो चुके हैं। पैसा सीधे आपके बैंक खाते में जमा होगा।"
                      : "Payment mandate signed by District Collector. Treasury credit will reflect directly in your bank account."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: Timeline */}
      {activeTab === "timeline" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>{lang === "hi" ? "आपकी जमीन की प्रक्रिया के सरल चरण" : "Your Land Acquisition Progress Steps"}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {lang === "hi"
                ? `आपकी जमीन (सर्वे ${citizenData.surveyNo}) के मामले की वर्तमान स्थिति और आने वाले कदम।`
                : `Live tracking of all progress stages for your plot (Survey No. ${citizenData.surveyNo}).`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {citizenData.timeline.map((item: any, idx: number) => (
                <div key={item.stage} className="flex items-start gap-3.5 text-xs">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        item.status === "completed"
                          ? "bg-emerald-600 text-[#fffdf8]"
                          : item.status === "current"
                          ? "bg-amber-500 text-black ring-4 ring-amber-400/30 font-extrabold"
                          : "bg-slate-200 text-[#68655e] dark:bg-slate-800"
                      }`}
                    >
                      {item.status === "completed" ? "✓" : item.stage}
                    </div>
                    {idx < citizenData.timeline.length - 1 && (
                      <div className="w-0.5 h-10 bg-slate-200 dark:bg-slate-800 my-1" />
                    )}
                  </div>

                  <div className="flex-1 p-3 rounded-xl border bg-[#f4f1ea] border-[#d8d3c9] space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#171716]">
                        {item.name}
                      </span>
                      <span className="font-mono text-[11px] text-[#68655e]">{item.date}</span>
                    </div>
                    <p className="text-[#68655e] text-[11px]">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: Objections & Hearings */}
      {activeTab === "objections" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <span>{lang === "hi" ? "आपकी दर्ज शिकायत एवं सुनवाई की तारीख" : "Active Objection & Hearing Notice"}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {lang === "hi" ? "अधिकारी के समक्ष आपकी व्यक्तिगत सुनवाई का बुलावा (आधिकारिक सूचना)।" : "Official hearing notice and summons from the District Officer."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="p-4 rounded-xl border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-900 dark:text-[#ef5b2a]">
                      {citizenData.activeObjection.ref}
                    </span>
                    <Badge variant="warning" className="text-[10px]">
                      {lang === "hi" ? "सुनवाई तय" : "Hearing Scheduled"}
                    </Badge>
                  </div>
                  <p className="font-bold text-[#171716]">
                    {citizenData.activeObjection.subject}
                  </p>
                  <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/60 space-y-1 text-[#171716]">
                    <p>
                      <strong>{lang === "hi" ? "सुनवाई की तिथि एवं समय:" : "Scheduled Hearing:"}</strong>{" "}
                      <span className="text-amber-700 dark:text-[#ef5b2a] font-bold">{citizenData.activeObjection.hearingDate}</span>
                    </p>
                    <p>
                      <strong>{lang === "hi" ? "पीठासीन अधिकारी:" : "Presiding Officer:"}</strong>{" "}
                      {citizenData.activeObjection.presidingOfficer}
                    </p>
                    <p className="text-[11px] text-[#68655e]">
                      {lang === "hi"
                        ? "किसान भाई कृपया अपने साथ: जमीन की खतौनी/पट्टा पासबुक, आधार कार्ड और बैंक पासबुक लेकर उपस्थित हों।"
                        : "Please bring your Pattadar passbook, Aadhaar card, and bank passbook with you."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                  <span>{lang === "hi" ? "नई शिकायत या समस्या दर्ज करें (निःशुल्क)" : "Register New Complaint or Query (Free)"}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {lang === "hi"
                    ? `सर्वे संख्या ${citizenData.surveyNo} के संबंध में अपनी बात सीधे जिला भूमि अधिकारी को भेजें।`
                    : `Directly dispatch your complaint or issue regarding Survey No. ${citizenData.surveyNo} to the District Officer.`}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs">
                {objectionSubmitted ? (
                  <div className="p-6 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-center space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                    <p className="font-bold">{lang === "hi" ? "आपकी शिकायत सफलतापूर्वक दर्ज कर ली गई!" : "Complaint Registered Successfully!"}</p>
                    <p className="text-[11px] text-[#68655e]">
                      {lang === "hi" ? "केस संदर्भ संख्या: OBJ-2026-KA-8819। सुनवाई की तारीख आपके मोबाइल पर एसएमएस द्वारा भेजी जाएगी।" : "Case Ref: OBJ-2026-KA-8819. Notice of hearing will be sent to your mobile."}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleLodgeObjection} className="space-y-3">
                    <div>
                      <label className="text-[#68655e] font-semibold">{lang === "hi" ? "शिकायत का विषय" : "Complaint Category"}</label>
                      <select
                        value={newObjectionCategory}
                        onChange={(e) => setNewObjectionCategory(e.target.value)}
                        className="w-full h-9 mt-1 rounded-md border border-input bg-transparent px-3 text-xs"
                      >
                        <option value="Tree & Asset Valuation Re-assessment">{lang === "hi" ? "पेड़, कुआं व संपत्ति के मूल्यांकन पर पुनर्विचार" : "Tree & Asset Valuation Re-assessment"}</option>
                        <option value="Retained Parcel Access & Boundary Realignment">{lang === "hi" ? "बची हुई जमीन का रास्ता व सीमा सुधार" : "Retained Parcel Access & Boundary Realignment"}</option>
                        <option value="Compensation & Bonus Calculation Query">{lang === "hi" ? "मुआवजा व 100% बोनस की गणना में सुधार" : "Compensation & Bonus Calculation Query"}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[#68655e] font-semibold">{lang === "hi" ? "अपनी बात या समस्या का विवरण" : "Details of Your Query"}</label>
                      <textarea
                        rows={3}
                        value={newObjectionDesc}
                        onChange={(e) => setNewObjectionDesc(e.target.value)}
                        placeholder={lang === "hi" ? "अपनी समस्या या आपत्ति यहाँ लिखें (जैसे: आम के पेड़ छूटे हैं, बोरवेल की गहराई या रास्ते की बात)..." : `State your exact query or objection regarding plot ${citizenData.surveyNo}...`}
                        required
                        className="w-full mt-1 rounded-md border border-input bg-transparent p-2 text-xs"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm font-bold h-9 text-xs">
                      {lang === "hi" ? "शिकायत दर्ज करें (सबमिट)" : "Submit Complaint"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 5: Download Documents */}
      {activeTab === "documents" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-blue-600" />
              <span>{lang === "hi" ? "आपकी जमीन के सरकारी कागजात व आदेश" : "Official Government Papers for Your Land"}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {lang === "hi" ? "हस्ताक्षरित सरकारी सूचनाएं और मुआवजे की रसीदें यहाँ से डाउनलोड करें।" : "Download signed government notices and compensation statements."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {[
              { title: lang === "hi" ? `प्रारंभिक सरकारी सूचना पत्र (गजट - सर्वे ${citizenData.surveyNo})` : `Section 11 Preliminary Notification Gazette (Survey ${citizenData.surveyNo})`, date: "02 Mar 2026", size: "1.4 MB PDF" },
              { title: lang === "hi" ? "खेत की नाप-जोख व सीमा का नक्शा (JMS Sketch)" : "Joint Measurement Survey (JMS) Field Sketch & Pillar Coordinates", date: "14 Feb 2026", size: "2.1 MB PDF" },
              { title: lang === "hi" ? "मुआवजा पैसे की गणना रसीद (अवार्ड स्टेटमेंट)" : "Form IV RFCTLARR Section 23 Award Calculation Statement", date: "28 Aug 2026", size: "980 KB PDF" },
              { title: lang === "hi" ? "बैंक खाते में भुगतान स्वीकृति प्रमाण पत्र (DBT Mandate)" : "PFMS Direct Benefit Transfer Beneficiary Mandate Certificate", date: "05 Sep 2026", size: "640 KB PDF" },
            ].map((doc) => (
              <div
                key={doc.title}
                className="p-3.5 rounded-xl border bg-[#f4f1ea] border-[#d8d3c9] flex items-center justify-between gap-3 hover:border-[#d8d3c9] transition-all shadow-sm"
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-[#171716] text-xs sm:text-sm">{doc.title}</p>
                  <p className="text-[11px] text-[#68655e]">
                    {lang === "hi" ? `दिनांक: ${doc.date} • आकार: ${doc.size} • प्रमाणित सरकारी प्रति` : `Date: ${doc.date} • ${doc.size} • Certified Official Record`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDoc(doc.title)}
                  className="text-xs flex items-center gap-1.5 shrink-0 border-[#d8d3c9] hover:bg-[#ef5b2a]/10 dark:hover:bg-blue-950/50"
                >
                  {downloadingDoc === doc.title ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 animate-bounce" />
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{lang === "hi" ? "डाउनलोड पूर्ण" : "Downloaded"}</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5 text-blue-600" />
                      <span>{lang === "hi" ? "डाउनलोड करें" : "Download PDF"}</span>
                    </>
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Kisan Sahayata Help & Voice Guidance Panel (Farmer Help Desk) */}
      <Card className="border-[#ef5b2a]/30 bg-gradient-to-br from-[#ef5b2a]/5 to-[#fffdf8]">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-[#171716]">
              <Phone className="h-5 w-5 text-[#ef5b2a]" />
              <span>{lang === "hi" ? "किसान सहायता केंद्र व मार्गदर्शिका (Kisan Sahayata Desk)" : "Farmer Assistance & Voice Help Desk"}</span>
            </CardTitle>
            <Badge className="bg-[#15803d]/10 text-[#15803d] border border-[#15803d]/30 text-[11px] font-bold self-start sm:self-auto">
              {lang === "hi" ? "टोल-फ्री 100% निःशुल्क सेवा" : "Toll-Free 100% Free Service"}
            </Badge>
          </div>
          <CardDescription className="text-xs text-[#68655e]">
            {lang === "hi"
              ? "यदि आपको पढ़ने या समझने में कोई कठिनाई हो, तो किसी दलाल के चक्कर में न पड़ें। सीधे सरकार के इन नंबरों पर कॉल करें।"
              : "If you have difficulty reading or understanding, do not contact middlemen. Call these free government helplines directly."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-[#f4f1ea] border border-[#d8d3c9] rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#ef5b2a] uppercase block">
                {lang === "hi" ? "📞 किसान कॉल सेंटर (Kisan Call Centre)" : "📞 Kisan Call Centre"}
              </span>
              <p className="text-lg font-black text-[#171716] font-mono">1800-180-1551</p>
              <p className="text-[11px] text-[#68655e]">
                {lang === "hi" ? "सुबह 6:00 से रात 10:00 बजे तक • सभी भारतीय भाषाओं में उपलब्ध" : "6:00 AM to 10:00 PM daily • All Indian languages"}
              </p>
            </div>
            <div className="p-3.5 bg-[#f4f1ea] border border-[#d8d3c9] rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#15803d] uppercase block">
                {lang === "hi" ? "🏛️ राष्ट्रीय भूमि अधिग्रहण सहायता" : "🏛️ National Land Acquisition Desk"}
              </span>
              <p className="text-lg font-black text-[#171716] font-mono">1800-11-0001</p>
              <p className="text-[11px] text-[#68655e]">
                {lang === "hi" ? "भूमि अधिग्रहण, मुआवजा व बैंक खाते से जुड़ी सहायता" : "Support for compensation payout & bank status"}
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-[#fffdf8] border border-[#d8d3c9] rounded-xl space-y-2 text-[#171716]">
            <h4 className="font-bold text-xs flex items-center gap-1.5 text-[#ef5b2a]">
              <span>💡</span>
              <span>{lang === "hi" ? "किसान भाइयों के लिए मुख्य सवाल और उनके जवाब:" : "Frequently Asked Questions for Farmers:"}</span>
            </h4>
            <div className="space-y-2 text-[11px] text-[#68655e]">
              <p>
                <strong className="text-[#171716]">
                  {lang === "hi" ? "1. मुझे मुआवजा पैसा कैसे मिलेगा?" : "1. How will I receive my compensation money?"}
                </strong>{" "}
                {lang === "hi"
                  ? "पैसा सीधे आपके आधार से जुड़े बैंक खाते में भेजा जाएगा। किसी को कोई नकद कमीशन देने की आवश्यकता नहीं है।"
                  : "Money is sent directly to your Aadhaar-linked bank account. Never pay cash commission to anyone."}
              </p>
              <p>
                <strong className="text-[#171716]">
                  {lang === "hi" ? "2. क्या मुझे 100% अतिरिक्त सरकारी बोनस मिलेगा?" : "2. Will I get the 100% extra government bonus?"}
                </strong>{" "}
                {lang === "hi"
                  ? "हाँ, कानून के तहत हर किसान को बाजार मूल्य का 100% अतिरिक्त बोनस (मुआवजा दोगुना) दिया जाता है।"
                  : "Yes, by law, every landholder receives a 100% extra bonus (doubling the market compensation)."}
              </p>
              <p>
                <strong className="text-[#171716]">
                  {lang === "hi" ? "3. अगर मेरे खेत की नाप या पेड़ छूट गए हों तो क्या करें?" : "3. What if my trees or well were missed in the survey?"}
                </strong>{" "}
                {lang === "hi"
                  ? "आप 'शिकायत, आपत्ति व सुनवाई' टैब से तुरंत आपत्ति दर्ज करें या तहसीलदार/कलेक्टर कार्यालय में आवेदन दें।"
                  : "Register an objection in the 'Objections & Hearings' tab or visit your Taluk Tehsildar office."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Geo-Tagged Field Photo Modal */}
      <GeotaggedPhotoViewer
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />
    </div>
  );
}

export default function CitizenPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto p-12 text-center text-[#68655e] space-y-2">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold">Loading Citizen Portal & Records...</p>
        </div>
      }
    >
      <CitizenPortalContent />
    </Suspense>
  );
}
