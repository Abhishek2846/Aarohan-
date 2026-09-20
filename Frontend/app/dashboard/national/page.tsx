"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { formatINR, formatCompactINR, formatAreaHectares } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { generateCentralMinistryPdf, CentralMinistryPdfData } from "@/lib/pdf-generator";
import { useNationalDashboardQuery } from "@/hooks/queries/use-bhoomi-queries";
import { RoleBasedDelayIntelligence } from "@/components/ai/role-based-delay-intelligence";
import {
  Building2,
  Clock,
  AlertTriangle,
  Coins,
  TrendingUp,
  Download,
  MapPin,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Filter,
  Search,
  ChevronRight,
  Eye,
  Send,
  Sparkles,
  RefreshCw,
  X,
  AlertCircle,
  Layers,
  Check,
  ExternalLink,
  Users,
  Scale,
  HelpCircle,
  BookOpen,
  Share2,
  Flag,
} from "lucide-react";

// ==========================================
// MOCK NATIONAL REVENUE & CADASTRAL DATASETS
// ==========================================

interface StateBenchmark {
  id: string;
  state: string;
  stateHi: string;
  zone: "North" | "West" | "South" | "East" | "Central";
  projects: number;
  targetHa: number;
  acquiredHa: number;
  completionPct: number;
  avgDays: number;
  slaCompliancePct: number;
  dbtPaymentPct: number;
  rrCompletionPct: number;
  grievanceResolutionPct: number;
  litigationRate: number;
  dataQualityScore: number;
  budgetUtilizationPct: number;
  status: "EXEMPLARY" | "ON_TRACK" | "NEEDS_INTERVENTION" | "CRITICAL_LAG";
}

const STATE_BENCHMARKS: StateBenchmark[] = [
  {
    id: "GJ",
    state: "Gujarat",
    stateHi: "गुजरात",
    zone: "West",
    projects: 26,
    targetHa: 2800,
    acquiredHa: 2650,
    completionPct: 94.6,
    avgDays: 210,
    slaCompliancePct: 95.4,
    dbtPaymentPct: 96.2,
    rrCompletionPct: 91.5,
    grievanceResolutionPct: 94.0,
    litigationRate: 8.2,
    dataQualityScore: 96,
    budgetUtilizationPct: 97.4,
    status: "EXEMPLARY",
  },
  {
    id: "RJ",
    state: "Rajasthan",
    stateHi: "राजस्थान",
    zone: "North",
    projects: 26,
    targetHa: 2900,
    acquiredHa: 2680,
    completionPct: 92.4,
    avgDays: 220,
    slaCompliancePct: 93.1,
    dbtPaymentPct: 94.0,
    rrCompletionPct: 90.2,
    grievanceResolutionPct: 92.5,
    litigationRate: 7.8,
    dataQualityScore: 94,
    budgetUtilizationPct: 94.2,
    status: "EXEMPLARY",
  },
  {
    id: "TN",
    state: "Tamil Nadu",
    stateHi: "तमिलनाडु",
    zone: "South",
    projects: 22,
    targetHa: 2100,
    acquiredHa: 1910,
    completionPct: 91.0,
    avgDays: 230,
    slaCompliancePct: 92.4,
    dbtPaymentPct: 92.8,
    rrCompletionPct: 89.1,
    grievanceResolutionPct: 91.0,
    litigationRate: 9.5,
    dataQualityScore: 93,
    budgetUtilizationPct: 93.0,
    status: "EXEMPLARY",
  },
  {
    id: "MH",
    state: "Maharashtra",
    stateHi: "महाराष्ट्र",
    zone: "West",
    projects: 36,
    targetHa: 3400,
    acquiredHa: 3020,
    completionPct: 88.8,
    avgDays: 240,
    slaCompliancePct: 91.8,
    dbtPaymentPct: 93.5,
    rrCompletionPct: 88.0,
    grievanceResolutionPct: 89.2,
    litigationRate: 12.4,
    dataQualityScore: 92,
    budgetUtilizationPct: 91.8,
    status: "ON_TRACK",
  },
  {
    id: "MP",
    state: "Madhya Pradesh",
    stateHi: "मध्य प्रदेश",
    zone: "Central",
    projects: 24,
    targetHa: 2600,
    acquiredHa: 2280,
    completionPct: 87.7,
    avgDays: 250,
    slaCompliancePct: 91.0,
    dbtPaymentPct: 92.0,
    rrCompletionPct: 87.0,
    grievanceResolutionPct: 88.4,
    litigationRate: 11.2,
    dataQualityScore: 90,
    budgetUtilizationPct: 90.4,
    status: "ON_TRACK",
  },
  {
    id: "KA",
    state: "Karnataka",
    stateHi: "कर्नाटक",
    zone: "South",
    projects: 26,
    targetHa: 2400,
    acquiredHa: 2050,
    completionPct: 85.4,
    avgDays: 265,
    slaCompliancePct: 90.2,
    dbtPaymentPct: 91.0,
    rrCompletionPct: 86.5,
    grievanceResolutionPct: 87.0,
    litigationRate: 14.1,
    dataQualityScore: 89,
    budgetUtilizationPct: 88.5,
    status: "ON_TRACK",
  },
  {
    id: "HR",
    state: "Haryana",
    stateHi: "हरियाणा",
    zone: "North",
    projects: 21,
    targetHa: 1800,
    acquiredHa: 1520,
    completionPct: 84.4,
    avgDays: 270,
    slaCompliancePct: 89.7,
    dbtPaymentPct: 90.5,
    rrCompletionPct: 84.8,
    grievanceResolutionPct: 86.2,
    litigationRate: 15.2,
    dataQualityScore: 88,
    budgetUtilizationPct: 87.2,
    status: "ON_TRACK",
  },
  {
    id: "UP",
    state: "Uttar Pradesh",
    stateHi: "उत्तर प्रदेश",
    zone: "North",
    projects: 41,
    targetHa: 4200,
    acquiredHa: 3450,
    completionPct: 82.1,
    avgDays: 295,
    slaCompliancePct: 88.5,
    dbtPaymentPct: 89.2,
    rrCompletionPct: 83.4,
    grievanceResolutionPct: 84.0,
    litigationRate: 18.6,
    dataQualityScore: 85,
    budgetUtilizationPct: 86.0,
    status: "NEEDS_INTERVENTION",
  },
  {
    id: "AP",
    state: "Andhra Pradesh",
    stateHi: "आंध्र प्रदेश",
    zone: "South",
    projects: 18,
    targetHa: 1950,
    acquiredHa: 1480,
    completionPct: 75.9,
    avgDays: 310,
    slaCompliancePct: 86.2,
    dbtPaymentPct: 85.1,
    rrCompletionPct: 79.2,
    grievanceResolutionPct: 81.5,
    litigationRate: 21.0,
    dataQualityScore: 82,
    budgetUtilizationPct: 81.5,
    status: "NEEDS_INTERVENTION",
  },
  {
    id: "OD",
    state: "Odisha",
    stateHi: "ओडिशा",
    zone: "East",
    projects: 16,
    targetHa: 1700,
    acquiredHa: 1220,
    completionPct: 71.8,
    avgDays: 330,
    slaCompliancePct: 84.8,
    dbtPaymentPct: 83.4,
    rrCompletionPct: 76.5,
    grievanceResolutionPct: 79.0,
    litigationRate: 24.3,
    dataQualityScore: 79,
    budgetUtilizationPct: 78.0,
    status: "CRITICAL_LAG",
  },
];

interface NationalCorridor {
  id: string;
  name: string;
  nameHi: string;
  sector: "Highways" | "Railways" | "Industrial" | "Energy";
  lengthKm: number;
  statesTraversed: string[];
  totalHa: number;
  acquiredHa: number;
  completionPct: number;
  sanctionedCr: number;
  disbursedCr: number;
  interstateStatus: string;
  interstateStatusHi: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  leadAgency: string;
}

const NATIONAL_CORRIDORS: NationalCorridor[] = [
  {
    id: "DME_01",
    name: "Delhi-Mumbai Expressway (NE-4)",
    nameHi: "दिल्ली-मुंबई एक्सप्रेसवे (NE-4)",
    sector: "Highways",
    lengthKm: 1386,
    statesTraversed: ["DL", "HR", "RJ", "MP", "GJ", "MH"],
    totalHa: 4800,
    acquiredHa: 4420,
    completionPct: 92.1,
    sanctionedCr: 14200,
    disbursedCr: 13100,
    interstateStatus: "Dahod-Jhabua border valuation harmonization under review",
    interstateStatusHi: "दाहोद-झाबुआ सीमा मूल्यांकन सामंजस्य समीक्षाधीन",
    riskLevel: "MEDIUM",
    leadAgency: "NHAI",
  },
  {
    id: "WDFC_02",
    name: "Western Dedicated Freight Corridor",
    nameHi: "पश्चिमी समर्पित माल गलियारा (WDFC)",
    sector: "Railways",
    lengthKm: 1506,
    statesTraversed: ["DL", "HR", "RJ", "GJ", "MH"],
    totalHa: 3600,
    acquiredHa: 3450,
    completionPct: 95.8,
    sanctionedCr: 9800,
    disbursedCr: 9350,
    interstateStatus: "Rail Right-of-Way fully continuous; final Sec 38 handover active",
    interstateStatusHi: "रेलवे राइट-ऑफ-वे पूर्णतः निरंतर; धारा 38 कब्जा अंतिम चरण में",
    riskLevel: "LOW",
    leadAgency: "DFCCIL",
  },
  {
    id: "STRR_03",
    name: "Bengaluru Satellite Town Ring Road (NH-948A)",
    nameHi: "बेंगलुरु सैटेलाइट टाउन रिंग रोड (NH-948A)",
    sector: "Highways",
    lengthKm: 280,
    statesTraversed: ["KA", "TN"],
    totalHa: 1840,
    acquiredHa: 1560,
    completionPct: 84.8,
    sanctionedCr: 4500,
    disbursedCr: 3820,
    interstateStatus: "Hosur spur synchronized with Karnataka Doddaballapur package",
    interstateStatusHi: "होसुर शाखा कर्नाटक डोड्डाबल्लापुर पैकेज के साथ सिंक्रनाइज़",
    riskLevel: "LOW",
    leadAgency: "NHAI / KRDCL",
  },
  {
    id: "AMR_JAM_04",
    name: "Amritsar-Jamnagar Economic Corridor",
    nameHi: "अमृतसर-जामनगर आर्थिक गलियारा",
    sector: "Highways",
    lengthKm: 1257,
    statesTraversed: ["PB", "HR", "RJ", "GJ"],
    totalHa: 3200,
    acquiredHa: 2850,
    completionPct: 89.1,
    sanctionedCr: 9200,
    disbursedCr: 8100,
    interstateStatus: "Rajasthan desert packages complete; Punjab RoW clear",
    interstateStatusHi: "राजस्थान रेगिस्तानी पैकेज पूर्ण; पंजाब राइट-ऑफ-वे स्पष्ट",
    riskLevel: "LOW",
    leadAgency: "MoRTH",
  },
  {
    id: "VCIC_05",
    name: "Vizag-Chennai Industrial Corridor (VCIC)",
    nameHi: "विशाखापट्टनम-चेन्नई औद्योगिक गलियारा",
    sector: "Industrial",
    lengthKm: 800,
    statesTraversed: ["AP", "TN"],
    totalHa: 2400,
    acquiredHa: 1870,
    completionPct: 77.9,
    sanctionedCr: 3800,
    disbursedCr: 2950,
    interstateStatus: "Krishnapatnam node acquisition accelerated; R&R compensation disbursing",
    interstateStatusHi: "कृष्णपटनम नोड अधिग्रहण तेज; पुनर्वास मुआवजा संवितरण जारी",
    riskLevel: "HIGH",
    leadAgency: "NICDIT / APIIC",
  },
  {
    id: "BM_P1_06",
    name: "Bharatmala P1 Solapur-Kurnool Link",
    nameHi: "भारतमाला चरण 1 सोलापुर-कुरनूल लिंक",
    sector: "Highways",
    lengthKm: 340,
    statesTraversed: ["MH", "KA", "AP"],
    totalHa: 1450,
    acquiredHa: 1180,
    completionPct: 81.4,
    sanctionedCr: 2950,
    disbursedCr: 2380,
    interstateStatus: "Inter-state border revenue record cross-verification in progress",
    interstateStatusHi: "अंतर-राज्य सीमा राजस्व रिकॉर्ड सत्यापन प्रगति पर",
    riskLevel: "MEDIUM",
    leadAgency: "NHAI",
  },
];

interface CentralEscalation {
  id: string;
  title: string;
  titleHi: string;
  sourceState: string;
  corridor: string;
  category: "INTERSTATE_DISPUTE" | "FUNDING_GAP" | "POLICY_CLARIFICATION" | "LITIGATION" | "INTEGRATION";
  urgency: "CRITICAL" | "HIGH" | "MEDIUM";
  status: "PENDING_DIRECTIVE" | "UNDER_REVIEW" | "ACTION_PLAN_REQUESTED" | "RESOLVED";
  submittedDate: string;
  summary: string;
  summaryHi: string;
  requestedAction: string;
}

const CENTRAL_ESCALATIONS: CentralEscalation[] = [
  {
    id: "ESC-2026-001",
    title: "Dahod-Jhabua Inter-State Circle Rate Disparity",
    titleHi: "दाहोद-झाबुआ अंतर-राज्य सर्किल दर विषमता",
    sourceState: "Gujarat / Madhya Pradesh",
    corridor: "Delhi-Mumbai Expressway",
    category: "INTERSTATE_DISPUTE",
    urgency: "CRITICAL",
    status: "PENDING_DIRECTIVE",
    submittedDate: "04 Sep 2026",
    summary: "Farmers on the MP side of the border have staged dharna objecting to 35% higher circle rates awarded on the Gujarat side for contiguous agricultural land parcels.",
    summaryHi: "मध्य प्रदेश सीमा के किसानों ने निकटवर्ती गुजरात सीमा पर 35% अधिक सर्किल दर मिलने पर विरोध दर्ज किया है।",
    requestedAction: "Issue central advisory for uniform border solatium benchmark under Section 108 of RFCTLARR Act.",
  },
  {
    id: "ESC-2026-002",
    title: "Western DFC Palghar Mangrove Eco-Clearance Deadlock",
    titleHi: "पश्चिमी डीएफसी पालघर मैंग्रोव पर्यावरण मंजूरी गतिरोध",
    sourceState: "Maharashtra",
    corridor: "Western Dedicated Freight Corridor",
    category: "POLICY_CLARIFICATION",
    urgency: "HIGH",
    status: "UNDER_REVIEW",
    submittedDate: "01 Sep 2026",
    summary: "State Forest Advisory Committee has deferred Stage-II clearance for 14.8 Ha rail diversion citing CRZ-I regulations despite Section 6 public urgency exemption.",
    summaryHi: "राज्य वन सलाहकार समिति ने सार्वजनिक तात्कालिकता छूट के बावजूद 14.8 हेक्टेयर रेल डायवर्जन हेतु मंजूरी स्थगित की।",
    requestedAction: "Convene Joint Review Meeting with MoEFCC Central Clearance Cell and Maharashtra Principal Secretary.",
  },
  {
    id: "ESC-2026-003",
    title: "Additional Solatium Allocation for Bengaluru STRR NH-948A",
    titleHi: "बेंगलुरु एसटीआरआर अतिरिक्त तोष आवंटन मांग",
    sourceState: "Karnataka",
    corridor: "Bengaluru STRR (NH-948A)",
    category: "FUNDING_GAP",
    urgency: "HIGH",
    status: "ACTION_PLAN_REQUESTED",
    submittedDate: "28 Aug 2026",
    summary: "High land value appreciation around Doddaballapur industrial belt requires additional ₹320 Cr PFMS allocation to execute Section 30 statutory awards without treasury lag.",
    summaryHi: "डोड्डाबल्लापुर बेल्ट में भूमि मूल्य वृद्धि के कारण धारा 30 पंचाट भुगतान हेतु अतिरिक्त ₹320 करोड़ की आवश्यकता।",
    requestedAction: "Sanction supplementary treasury tranche under Ministry Infrastructure Capital Head.",
  },
  {
    id: "ESC-2026-004",
    title: "High Court Interim Injunction on Krishnapatnam Port RoW",
    titleHi: "कृष्णपटनम पोर्ट राइट-ऑफ-वे पर उच्च न्यायालय स्थगन",
    sourceState: "Andhra Pradesh",
    corridor: "Vizag-Chennai Industrial Corridor",
    category: "LITIGATION",
    urgency: "CRITICAL",
    status: "UNDER_REVIEW",
    submittedDate: "22 Aug 2026",
    summary: "Writ Petition 4821/2026 granted status quo on 280 Ha multi-crop wetland parcels contesting Section 10 food security threshold exemptions.",
    summaryHi: "रिट याचिका में धारा 10 खाद्य सुरक्षा सीमा छूट को चुनौती देते हुए 280 हेक्टेयर पर यथास्थिति आदेश दिया गया।",
    requestedAction: "Depute Additional Solicitor General to represent Union of India in urgent vacation bench hearing.",
  },
  {
    id: "ESC-2026-005",
    title: "NIC ULPIN Cadastral Server API Sync Outage in 3 Coastal Districts",
    titleHi: "3 तटीय जिलों में एनआईसी यूलपिन कैडस्ट्रल सर्वर एपीआई आउटेज",
    sourceState: "Odisha",
    corridor: "Eastern Dedicated Freight Corridor / Port Link",
    category: "INTEGRATION",
    urgency: "MEDIUM",
    status: "RESOLVED",
    submittedDate: "15 Aug 2026",
    summary: "State Bhulekh portal experienced SSL handshake timeouts while validating 14-digit ULPIN for Cuttack and Puri survey demarcation uploads.",
    summaryHi: "भुलेख पोर्टल द्वारा कटक और पुरी सर्वेक्षण अपलोड हेतु 14-अंकीय यूलपिन सत्यापन में टाइमआउट की समस्या।",
    requestedAction: "Central NIC infrastructure upgraded with dedicated WFS cadastral edge cache nodes.",
  },
];

interface BottleneckDiagnostic {
  id: string;
  stage: string;
  stageHi: string;
  rootCause: string;
  rootCauseHi: string;
  statesAffected: string[];
  casesImpacted: number;
  avgDelayDays: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  centralAction: string;
  centralActionHi: string;
}

const BOTTLENECK_DIAGNOSTICS: BottleneckDiagnostic[] = [
  {
    id: "BN-01",
    stage: "Section 8 & 11 Field Survey Demarcation",
    stageHi: "धारा 8 एवं 11 फील्ड सर्वेक्षण सीमांकन",
    rootCause: "Severe shortage of licensed Amins and Taluk Surveyors equipped with differential GPS devices",
    rootCauseHi: "डिफरेंशियल जीपीएस युक्त प्रमाणित अमीन और तहसील सर्वेक्षणकर्ताओं की भारी कमी",
    statesAffected: ["Uttar Pradesh", "Andhra Pradesh", "Odisha"],
    casesImpacted: 118,
    avgDelayDays: 45,
    severity: "CRITICAL",
    centralAction: "Release DILRMP Special Assistance Tranche for RoVer Drone Demarcation Hiring",
    centralActionHi: "ड्रोन सीमांकन भाड़े पर लेने हेतु डीआईएलआरएमपी विशेष सहायता किश्त जारी करें",
  },
  {
    id: "BN-02",
    stage: "Section 15 Gazette Objection Adjudication",
    stageHi: "धारा 15 आपत्ति निस्तारण एवं सुनवाई",
    rootCause: "SLAO benches inundated with multiple title dispute claims without digitized revenue court link",
    rootCauseHi: "डिजिटल राजस्व अदालत लिंक के बिना भूमि स्वामित्व विवादों के कारण पंचाट अधिकारी के पास आपत्तियों का ढेर",
    statesAffected: ["Uttar Pradesh", "Odisha", "Maharashtra"],
    casesImpacted: 84,
    avgDelayDays: 38,
    severity: "HIGH",
    centralAction: "Issue Model Fast-Track Section 15 Hearing Standard Operating Procedure (SOP)",
    centralActionHi: "मॉडल फास्ट-ट्रैक धारा 15 सुनवाई मानक संचालन प्रक्रिया (एसओपी) जारी करें",
  },
  {
    id: "BN-03",
    stage: "MoEFCC & Forest Clearance (Sec 19 Pre-requisite)",
    stageHi: "वन एवं पर्यावरण मंजूरी (धारा 19 पूर्व शर्त)",
    rootCause: "Stage-II clearance pending beyond statutory 60-day window due to compensatory afforestation land non-identification",
    rootCauseHi: "प्रतिपूरक वनीकरण भूमि की पहचान न होने के कारण वैधानिक 60 दिनों से अधिक समय से मंजूरी लंबित",
    statesAffected: ["Karnataka", "Maharashtra", "Odisha"],
    casesImpacted: 42,
    avgDelayDays: 62,
    severity: "CRITICAL",
    centralAction: "Schedule Central PMG Inter-Ministerial Forest Resolution Bench",
    centralActionHi: "केंद्रीय पीएमजी अंतर-मंत्रालयी वन समाधान पीठ निर्धारित करें",
  },
  {
    id: "BN-04",
    stage: "PFMS Direct Benefit Transfer (DBT) Payout",
    stageHi: "पीएफएमएस प्रत्यक्ष लाभ अंतरण (DBT) भुगतान",
    rootCause: "Aadhaar NPCI bank account mismatch and dormant joint-khata accounts blocking electronic awards",
    rootCauseHi: "आधार एनपीसीआई बैंक खाता बेमेल और निष्क्रिय संयुक्त खाता होने से इलेक्ट्रॉनिक पंचाट में रुकावट",
    statesAffected: ["Andhra Pradesh", "Uttar Pradesh"],
    casesImpacted: 65,
    avgDelayDays: 28,
    severity: "MEDIUM",
    centralAction: "Deploy NIC Special Automated Account Verification Adapter with SBI & Canara Bank",
    centralActionHi: "एसबीआई और केनरा बैंक के साथ एनआईसी विशेष स्वचालित खाता सत्यापन एडाप्टर तैनात करें",
  },
];

interface NationalStandard {
  id: string;
  code: string;
  title: string;
  version: string;
  status: "MANDATORY" | "RECOMMENDED" | "DRAFT";
  category: "CADASTRAL" | "FINANCIAL" | "LEGAL" | "GIS";
  complianceRate: number;
  summary: string;
}

const NATIONAL_STANDARDS: NationalStandard[] = [
  {
    id: "STD-01",
    code: "DoLR-ULPIN-2026.1",
    title: "14-Digit Unique Land Parcel Identification Number (Bhu-Aadhaar)",
    version: "v2.4",
    status: "MANDATORY",
    category: "CADASTRAL",
    complianceRate: 94.2,
    summary: "Standardized geospatial algorithm deriving 14-character alphanumeric identifier from WGS84 polygon centroid coordinates for zero-collision parcel tracking.",
  },
  {
    id: "STD-02",
    code: "PFMS-RFCTLARR-DBT",
    title: "Direct Benefit Transfer Central Treasury Integration Standard",
    version: "v3.1",
    status: "MANDATORY",
    category: "FINANCIAL",
    complianceRate: 92.4,
    summary: "Real-time automated reconciliation protocol with National Payments Corporation of India (NPCI) for instantaneous solatium disbursement to Khatedar Aadhaar-seeded accounts.",
  },
  {
    id: "STD-03",
    code: "OGC-WFS-BHOOMI-3.0",
    title: "OpenGIS Web Feature Service Interoperability for Multi-State Corridors",
    version: "v3.0",
    status: "MANDATORY",
    category: "GIS",
    complianceRate: 88.6,
    summary: "Lossless vector cadastral layer exchange ensuring contiguous RoW geometry alignment across interstate administrative boundaries without projection shear.",
  },
  {
    id: "STD-04",
    code: "RFCTLARR-SCHED-II-RR",
    title: "National Model Benchmark for Second Schedule Rehabilitation & Resettlement",
    version: "v1.8",
    status: "RECOMMENDED",
    category: "LEGAL",
    complianceRate: 86.5,
    summary: "Uniform entitlement calculator for housing units (50 sqm rural / 25 sqm urban), subsistence allowances, and displacement grants.",
  },
];

// ==========================================
// CENTRAL MINISTRY DASHBOARD MAIN COMPONENT
// ==========================================

function NationalDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";
  const { lang, t } = useI18n();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState<string>("ALL");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");
  const [drillDownState, setDrillDownState] = useState<StateBenchmark | null>(null);
  const [activeEscalationModal, setActiveEscalationModal] = useState<CentralEscalation | null>(null);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [policySubject, setPolicySubject] = useState("");
  const [policyContent, setPolicyContent] = useState("");
  const [policyBroadcastSuccess, setPolicyBroadcastSuccess] = useState(false);
  const [escalationsList, setEscalationsList] = useState<CentralEscalation[]>(CENTRAL_ESCALATIONS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Backend Data Hook
  const { data: nationalData } = useNationalDashboardQuery();

  const stateBenchmarks: StateBenchmark[] = useMemo(() => {
    if (nationalData?.benchmarks?.length) {
      return nationalData.benchmarks.map((b: any) => ({
        id: b.id,
        state: b.state,
        stateHi: b.state_hi,
        zone: b.zone as any,
        projects: b.projects,
        targetHa: Number(b.target_ha),
        acquiredHa: Number(b.acquired_ha),
        completionPct: Number(b.completion_pct),
        avgDays: b.avg_days,
        slaCompliancePct: Number(b.sla_compliance_pct),
        dbtPaymentPct: Number(b.dbt_payment_pct),
        rrCompletionPct: Number(b.rr_completion_pct),
        grievanceResolutionPct: Number(b.grievance_resolution_pct),
        litigationRate: Number(b.litigation_rate),
        dataQualityScore: b.data_quality_score,
        budgetUtilizationPct: Number(b.budget_utilization_pct),
        status: b.status as any,
      }));
    }
    return STATE_BENCHMARKS;
  }, [nationalData]);

  const nationalCorridors: NationalCorridor[] = useMemo(() => {
    if (nationalData?.corridors?.length) {
      return nationalData.corridors.map((c: any) => ({
        id: c.corridor_id,
        name: c.name,
        nameHi: c.name_hi,
        sector: c.sector as any,
        lengthKm: Number(c.length_km),
        statesTraversed: Array.isArray(c.states_traversed) ? c.states_traversed : JSON.parse(c.states_traversed || '[]'),
        totalHa: Number(c.total_ha),
        acquiredHa: Number(c.acquired_ha),
        completionPct: Number(c.completion_pct),
        sanctionedCr: Number(c.sanctioned_cr),
        disbursedCr: Number(c.disbursed_cr),
        interstateStatus: c.interstate_status,
        interstateStatusHi: c.interstate_status_hi,
        riskLevel: c.risk_level as any,
        leadAgency: c.lead_agency,
      }));
    }
    return NATIONAL_CORRIDORS;
  }, [nationalData]);

  const bottleneckDiagnostics: BottleneckDiagnostic[] = useMemo(() => {
    if (nationalData?.bottlenecks?.length) {
      return nationalData.bottlenecks.map((b: any) => ({
        id: b.diagnostic_id,
        stage: b.stage,
        stageHi: b.stage_hi,
        rootCause: b.root_cause,
        rootCauseHi: b.root_cause_hi,
        statesAffected: Array.isArray(b.states_affected) ? b.states_affected : JSON.parse(b.states_affected || '[]'),
        casesImpacted: b.cases_impacted,
        avgDelayDays: b.avg_delay_days,
        severity: b.severity as any,
        centralAction: b.central_action,
        centralActionHi: b.central_action_hi,
      }));
    }
    return BOTTLENECK_DIAGNOSTICS;
  }, [nationalData]);

  const nationalStandards: NationalStandard[] = useMemo(() => {
    if (nationalData?.standards?.length) {
      return nationalData.standards.map((s: any) => ({
        id: s.standard_id,
        code: s.code,
        title: s.title,
        version: s.version,
        status: s.status as any,
        category: s.category as any,
        complianceRate: Number(s.compliance_rate),
        summary: s.summary,
      }));
    }
    return NATIONAL_STANDARDS;
  }, [nationalData]);

  useEffect(() => {
    if (nationalData?.escalations?.length) {
      setEscalationsList(
        nationalData.escalations.map((e: any) => ({
          id: e.escalation_id,
          title: e.title,
          titleHi: e.title_hi,
          sourceState: e.source_state,
          corridor: e.corridor,
          category: e.category as any,
          urgency: e.urgency as any,
          status: e.status as any,
          submittedDate: e.submitted_date,
          summary: e.summary,
          summaryHi: e.summary_hi,
          requestedAction: e.requested_action,
        }))
      );
    }
  }, [nationalData]);

  // Tab switcher helper
  const handleTabChange = (tabId: string) => {
    router.push(`/dashboard/national?tab=${tabId}`, { scroll: false });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered States
  const filteredStates = useMemo(() => {
    return stateBenchmarks.filter((st) => {
      const matchSearch =
        st.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.stateHi.includes(searchQuery);
      const matchZone = selectedZone === "ALL" || st.zone === selectedZone;
      const matchTier = selectedTier === "ALL" || st.status === selectedTier;
      return matchSearch && matchZone && matchTier;
    });
  }, [stateBenchmarks, searchQuery, selectedZone, selectedTier]);

  // Filtered Corridors
  const filteredCorridors = useMemo(() => {
    return nationalCorridors.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nameHi.includes(searchQuery);
      const matchSector = selectedSector === "ALL" || c.sector === selectedSector;
      return matchSearch && matchSector;
    });
  }, [nationalCorridors, searchQuery, selectedSector]);

  // Handle Escalation Action
  const handleEscalationAction = (escId: string, actionType: "ACTION_PLAN" | "DIRECTIVE" | "RESOLVE") => {
    setEscalationsList((prev) =>
      prev.map((esc) => {
        if (esc.id === escId) {
          if (actionType === "ACTION_PLAN") {
            return { ...esc, status: "ACTION_PLAN_REQUESTED" };
          } else if (actionType === "DIRECTIVE") {
            return { ...esc, status: "UNDER_REVIEW" };
          } else if (actionType === "RESOLVE") {
            return { ...esc, status: "RESOLVED" };
          }
        }
        return esc;
      })
    );
    setActiveEscalationModal(null);
    showToast(
      actionType === "RESOLVE"
        ? "Escalation petition marked as officially resolved and closed."
        : actionType === "ACTION_PLAN"
        ? "Official directive dispatched to State Authority requesting action plan."
        : "Central Policy Directive transmitted to relevant departments."
    );
  };

  // Handle Exporting PDF
  const handleExportPdf = () => {
    const pdfPayload: CentralMinistryPdfData = {
      reportTitle: "BhoomiSetu National Infrastructure Land Acquisition & R&R Oversight Review",
      totalProjects: 48,
      totalCases: 1842,
      completedCases: 1498,
      totalAreaHa: 15600,
      totalCompensationCr: 30450,
      nationalSlaCompliance: 91.2,
      pendingEscalations: escalationsList.filter((e) => e.status !== "RESOLVED").length,
      stateRankings: stateBenchmarks.map((s) => ({
        state: s.state,
        projects: s.projects,
        targetHa: s.targetHa,
        acquiredHa: s.acquiredHa,
        slaPct: s.slaCompliancePct,
        status: s.status,
      })),
    };
    generateCentralMinistryPdf(pdfPayload);
    showToast("Official Cabinet Briefing PDF generated and saved.");
  };

  // Handle Policy Circular Broadcast
  const handleBroadcastPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!policySubject || !policyContent) return;
    setPolicyBroadcastSuccess(true);
    setTimeout(() => {
      setPolicyBroadcastSuccess(false);
      setIsPolicyModalOpen(false);
      setPolicySubject("");
      setPolicyContent("");
      showToast("National Policy Advisory circular broadcasted to 28 State Revenue Departments via BhoomiSetu.");
    }, 1200);
  };

  // 1. Total Projects by State BarChart
  const projectsByStateData = [
    { state: "Gujarat", highway: 14, rail: 8, metro: 4, total: 26 },
    { state: "Maharashtra", highway: 18, rail: 12, metro: 6, total: 36 },
    { state: "Karnataka", highway: 12, rail: 6, metro: 8, total: 26 },
    { state: "Rajasthan", highway: 15, rail: 9, metro: 2, total: 26 },
    { state: "Haryana", highway: 10, rail: 8, metro: 3, total: 21 },
    { state: "Uttar Pradesh", highway: 22, rail: 14, metro: 5, total: 41 },
  ];

  // 2. Acquisition Progress Timeline
  const timelineData = [
    { month: "Jan 26", notifiedHa: 2400, acquiredHa: 1100 },
    { month: "Feb 26", notifiedHa: 4800, acquiredHa: 2400 },
    { month: "Mar 26", notifiedHa: 7200, acquiredHa: 4100 },
    { month: "Apr 26", notifiedHa: 9800, acquiredHa: 6200 },
    { month: "May 26", notifiedHa: 12400, acquiredHa: 8900 },
    { month: "Jun 26", notifiedHa: 15100, acquiredHa: 11800 },
    { month: "Jul 26", notifiedHa: 16800, acquiredHa: 13900 },
    { month: "Aug 26", notifiedHa: 18420, acquiredHa: 15600 },
  ];

  // 3. Compensation Outlay PFMS vs Sanctioned
  const compensationOutlayData = [
    { corridor: "Delhi-Mumbai Exp", sanctionedCr: 14200, disbursedCr: 13100 },
    { corridor: "Western DFC", sanctionedCr: 9800, disbursedCr: 9350 },
    { corridor: "Bengaluru STRR", sanctionedCr: 4500, disbursedCr: 3820 },
    { corridor: "Amritsar-Jamnagar", sanctionedCr: 9200, disbursedCr: 8100 },
    { corridor: "Vizag-Chennai", sanctionedCr: 3800, disbursedCr: 2950 },
    { corridor: "Solapur-Kurnool", sanctionedCr: 2950, disbursedCr: 2380 },
  ];

  // 4. R&R Progress
  const rrData = [
    { name: "Housing Units Built", value: 4200, color: "#15803d" },
    { name: "Housing in Progress", value: 600, color: "#ef5b2a" },
    { name: "Subsistence Credited", value: 6100, color: "#d97706" },
    { name: "Land Allotments Done", value: 950, color: "#171716" },
  ];

  // 5. Stage Funnel Data
  const stageFunnelData = [
    { stage: "Sec 4 (SIA Study)", count: 1842, pct: 100 },
    { stage: "Sec 11 (Preliminary Gazette)", count: 1780, pct: 96.6 },
    { stage: "Sec 15 (Objections Clear)", count: 1690, pct: 91.7 },
    { stage: "Sec 19 (Final Declaration)", count: 1612, pct: 87.5 },
    { stage: "Sec 23 (Statutory Award)", count: 1540, pct: 83.6 },
    { stage: "Sec 38 (Physical Handover)", count: 1498, pct: 81.3 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#171716] text-[#fffdf8] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#d8d3c9]/30 text-xs animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-[#fffdf8] border border-[#d8d3c9] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-[#ef5b2a]/10 text-[#ef5b2a] border border-[#ef5b2a]/30 font-bold text-xs py-0.5 px-2.5 rounded-full">
                {lang === "hi" ? "केंद्रीय नीति एवं राष्ट्रीय निगरानी" : "Central Policy & National Monitoring"}
              </Badge>
              <span className="text-xs text-[#68655e] font-semibold">
                {lang === "hi" ? "भूमि संसाधन विभाग (DoLR) • भारत सरकार" : "Department of Land Resources (DoLR) • Govt of India"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171716] flex items-center gap-2.5">
              <span>{lang === "hi" ? "राष्ट्रीय भूमि अधिग्रहण एवं पुनर्वास कमान केंद्र" : "National Infrastructure Land Acquisition Command Center"}</span>
              <span className="text-xl">🇮🇳</span>
            </h1>
            <p className="text-xs text-[#68655e] max-w-3xl leading-relaxed">
              {lang === "hi"
                ? "राष्ट्रीय स्तर पर 28 राज्यों, 765 जिलों और 48 प्राथमिकता वाले गतिशक्ति गलियारों में भूमि अधिग्रहण, राज्य प्रदर्शन, अंतर-राज्य समन्वय, पीएफएमएस मुआवजा एवं नीति मानकों की एकीकृत निगरानी।"
                : "Authoritative national policy oversight, inter-state corridor synchronization, PFMS compensation visibility, bottleneck diagnostics, and central escalation reviews across India."}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              onClick={() => setIsPolicyModalOpen(true)}
              variant="outline"
              size="sm"
              className="h-9 text-xs flex items-center gap-1.5 border-[#d8d3c9] bg-[#fffdf8] hover:bg-[#f4f1ea] text-[#171716] rounded-full shadow-sm"
            >
              <Send className="h-3.5 w-3.5 text-[#ef5b2a]" />
              <span>{lang === "hi" ? "नीति परिपत्र जारी करें" : "Publish Policy Circular"}</span>
            </Button>
            <Button
              onClick={handleExportPdf}
              size="sm"
              className="h-9 text-xs flex items-center gap-1.5 bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold rounded-full shadow-sm"
            >
              <Download className="h-3.5 w-3.5 text-[#ef5b2a]" />
              <span>{lang === "hi" ? "कैबिनेट रिपोर्ट (PDF)" : "Export Cabinet Brief (PDF)"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB: UNIFIED AI DELAY RISK & BOTTLENECK INTELLIGENCE                     */}
      {/* ========================================================================= */}
      {(currentTab === "delay-risk" || currentTab === "bottlenecks") && (
        <div className="space-y-8">
          {/* 1. Core ML 90-Day Delay Predictor & SHAP Explainability Engine */}
          <RoleBasedDelayIntelligence />

          {/* 2. Integrated National Statutory Bottleneck Diagnostics */}
          <div className="space-y-4 pt-4 border-t border-[#d8d3c9] dark:border-slate-800">
            <div className="bg-[#fffdf8] dark:bg-slate-900 border border-[#d8d3c9] dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#171716] dark:text-white">
                      {lang === "hi"
                        ? "राष्ट्रीय चरणबद्ध रुकावट एवं वैधानिक विलंब डायग्नोस्टिक्स"
                        : "National Stage-by-Stage Bottleneck Diagnostics Engine"}
                    </h3>
                    <p className="text-xs text-[#68655e] dark:text-slate-400">
                      {lang === "hi"
                        ? "1,842 सक्रिय अधिग्रहण मामलों में वैधानिक रुकावटों और नीतिगत देरी के मूल कारणों का गहन विश्लेषण।"
                        : "Algorithmic analysis of statutory lag across 1,842 cases. Identifies operational root causes without altering state and district administrative autonomy."}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-400 font-mono text-[10px] w-fit">
                  4 Statutory Bottlenecks
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bottleneckDiagnostics.map((bn) => (
                <div
                  key={bn.id}
                  className="bg-[#fffdf8] dark:bg-slate-900 border border-[#d8d3c9] dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#ef5b2a] uppercase">{bn.id}</span>
                      <h4 className="text-xs font-bold text-[#171716] dark:text-white mt-0.5">
                        {lang === "hi" ? bn.stageHi : bn.stage}
                      </h4>
                    </div>
                    <Badge variant={bn.severity === "CRITICAL" ? "destructive" : "warning"} className="text-[10px]">
                      {bn.severity}
                    </Badge>
                  </div>

                  <p className="text-xs text-[#68655e] dark:text-slate-300 leading-relaxed">
                    <strong>Root Cause:</strong> {lang === "hi" ? bn.rootCauseHi : bn.rootCause}
                  </p>

                  <div className="grid grid-cols-3 gap-2 bg-[#f4f1ea] dark:bg-slate-800/60 p-2.5 rounded-lg border border-[#d8d3c9] dark:border-slate-700 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-[#68655e] dark:text-slate-400 block">Affected States</span>
                      <span className="font-bold text-[#171716] dark:text-white">{bn.statesAffected.length} States</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#68655e] dark:text-slate-400 block">Cases Delayed</span>
                      <span className="font-bold text-[#ef5b2a]">{bn.casesImpacted}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#68655e] dark:text-slate-400 block">Average Lag</span>
                      <span className="font-bold text-rose-600">+{bn.avgDelayDays} Days</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#d8d3c9] dark:border-slate-800 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-[#15803d] dark:text-emerald-400 block">Recommended Central Action:</span>
                    <p className="text-[11px] text-[#171716] dark:text-slate-200 font-semibold">{lang === "hi" ? bn.centralActionHi : bn.centralAction}</p>
                    <Button
                      onClick={() => {
                        setIsPolicyModalOpen(true);
                        setPolicySubject(`Central Advisory: ${bn.stage}`);
                        setPolicyContent(`Ref: DoLR/ADVISORY/2026/BN - Addressing root cause: ${bn.rootCause}. States directed to implement fast-track mitigation.`);
                      }}
                      size="sm"
                      className="w-full h-8 text-xs bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold rounded-full mt-1"
                    >
                      <Send className="h-3 w-3 mr-1.5 text-[#ef5b2a]" />
                      <span>Issue Central Directive to States</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: NATIONAL OVERVIEW (DASHBOARD)                                     */}
      {/* ========================================================================= */}
      {currentTab === "overview" && (
        <div className="space-y-6">
          {/* 10 KPI Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard
              title={lang === "hi" ? "निगरानी वाले कॉरिडोर" : "Monitored Corridors"}
              value="48"
              subtext={lang === "hi" ? "पीएम गतिशक्ति परियोजनाएं" : "GatiShakti High Priority"}
              icon={Building2}
              variant="amber"
            />
            <StatCard
              title={lang === "hi" ? "चल रही परियोजनाएं" : "Pipeline Projects"}
              value="176"
              subtext={lang === "hi" ? "राजमार्ग, रेलवे व मेट्रो" : "Highways, Rail & Metro"}
              icon={Compass}
              variant="amber"
            />
            <StatCard
              title={lang === "hi" ? "जमीन अधिग्रहण मामले" : "Acquisition Cases"}
              value="1,842"
              subtext={lang === "hi" ? "344 मामलों पर काम जारी" : "344 active in pipeline"}
              icon={FileText}
              variant="amber"
            />
            <StatCard
              title={lang === "hi" ? "पूरे हुए मामले" : "Completed Cases"}
              value="1,498"
              subtext={lang === "hi" ? "81.3% काम पूरा हुआ" : "81.3% Completion Rate"}
              trend={{ value: lang === "hi" ? "+94 इस तिमाही" : "+94 Qtr", isPositive: true }}
              icon={CheckCircle2}
              variant="green"
            />
            <StatCard
              title={lang === "hi" ? "अधिग्रहित कुल भूमि" : "Land Area Acquired"}
              value={lang === "hi" ? "15,600 हेक्टेयर" : formatAreaHectares(15600)}
              subtext={lang === "hi" ? "लक्ष्य 18,420 हेक्टेयर का 84.7%" : "84.7% of 18,420 Ha Target"}
              trend={{ value: lang === "hi" ? "+840 हे./माह" : "+840 Ha/mo", isPositive: true }}
              icon={MapPin}
              variant="green"
            />
            <StatCard
              title={lang === "hi" ? "मुआवजा राशि संवितरित" : "PFMS Outlay Disbursed"}
              value={formatCompactINR(304500000000)}
              subtext={lang === "hi" ? "कुल ₹32,950 Cr का 92.4%" : "92.4% of ₹32,950 Cr"}
              trend={{ value: lang === "hi" ? "सीधे बैंक खाते में" : "PFMS Direct", isPositive: true }}
              icon={Coins}
              variant="green"
            />
            <StatCard
              title={lang === "hi" ? "औसत निपटान समय" : "Avg Processing Time"}
              value={lang === "hi" ? "242 दिन" : "242 Days"}
              subtext={lang === "hi" ? "धारा 11 से कब्जा मिलने तक" : "Sec 11 to possession"}
              trend={{ value: lang === "hi" ? "-18 दिन तेज" : "-18 Days", isPositive: true }}
              icon={Clock}
              variant="amber"
            />
            <StatCard
              title={lang === "hi" ? "समय-सीमा का पालन" : "National SLA Compliance"}
              value="91.2%"
              subtext={lang === "hi" ? "सभी 12 कानूनी चरणों में" : "Across 12 statutory stages"}
              trend={{ value: lang === "hi" ? "लक्ष्य: 95%" : "Target 95%", isPositive: true }}
              icon={TrendingUp}
              variant="amber"
            />
            <StatCard
              title={lang === "hi" ? "आपत्ति व देरी वाले मामले" : "High Risk Cases"}
              value="33"
              subtext={lang === "hi" ? "9 गंभीर, 24 उच्च प्राथमिकता" : "9 Critical, 24 High Risk"}
              trend={{ value: lang === "hi" ? "33 आपत्तियां" : "33 Objections", isPositive: false }}
              icon={AlertTriangle}
              variant="rose"
            />
            <StatCard
              title={lang === "hi" ? "मंत्रालय स्तर के मामले" : "Central Escalations"}
              value="7"
              subtext={lang === "hi" ? "3 अंतर-राज्यीय सीमा मामले" : "3 Interstate disputes"}
              trend={{ value: lang === "hi" ? "कार्रवाई जरूरी" : "Action Needed", isPositive: false }}
              icon={ShieldCheck}
              variant="rose"
            />
          </div>

          {/* National State Benchmark Leadership Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#fffdf8] border border-[#d8d3c9] rounded-xl flex items-center justify-between shadow-sm">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] text-[#68655e] uppercase font-bold block truncate">
                  {lang === "hi" ? "सबसे तेज प्रगति" : "Top Velocity State"}
                </span>
                <p className="text-sm font-black text-[#171716] truncate">
                  {lang === "hi" ? "गुजरात" : "Gujarat"}
                </p>
                <span className="text-[10px] text-emerald-700 font-bold block truncate">
                  {lang === "hi" ? "94.6% अधिग्रहण पूर्ण" : "94.6% Acquired"}
                </span>
              </div>
              <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-emerald-600 text-white shadow-sm shrink-0">
                #1 Rank
              </span>
            </div>
            <div className="p-3 bg-[#fffdf8] border border-[#d8d3c9] rounded-xl flex items-center justify-between shadow-sm">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] text-[#68655e] uppercase font-bold block truncate">
                  {lang === "hi" ? "उत्तरी कॉरिडोर लीडर" : "Northern Leader"}
                </span>
                <p className="text-sm font-black text-[#171716] truncate">
                  {lang === "hi" ? "राजस्थान" : "Rajasthan"}
                </p>
                <span className="text-[10px] text-emerald-700 font-bold block truncate">
                  {lang === "hi" ? "92.4% अधिग्रहण पूर्ण" : "92.4% Acquired"}
                </span>
              </div>
              <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-emerald-500 text-white shadow-sm shrink-0">
                #2 Rank
              </span>
            </div>
            <div className="p-3 bg-[#fffdf8] border border-[#d8d3c9] rounded-xl flex items-center justify-between shadow-sm">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] text-[#68655e] uppercase font-bold block truncate">
                  {lang === "hi" ? "दक्षिणी कॉरिडोर लीडर" : "Southern Leader"}
                </span>
                <p className="text-sm font-black text-[#171716] truncate">
                  {lang === "hi" ? "तमिलनाडु" : "Tamil Nadu"}
                </p>
                <span className="text-[10px] text-blue-700 font-bold block truncate">
                  {lang === "hi" ? "91.0% अधिग्रहण पूर्ण" : "91.0% Acquired"}
                </span>
              </div>
              <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-blue-600 text-white shadow-sm shrink-0">
                #3 Rank
              </span>
            </div>
            <div className="p-3 bg-[#fffdf8] border border-[#d8d3c9] rounded-xl flex items-center justify-between shadow-sm">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] text-[#68655e] uppercase font-bold block truncate">
                  {lang === "hi" ? "मध्य कॉरिडोर लीडर" : "Central Leader"}
                </span>
                <p className="text-sm font-black text-[#171716] truncate">
                  {lang === "hi" ? "महाराष्ट्र" : "Maharashtra"}
                </p>
                <span className="text-[10px] text-slate-700 font-bold block truncate">
                  {lang === "hi" ? "88.5% अधिग्रहण पूर्ण" : "88.5% Acquired"}
                </span>
              </div>
              <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-slate-700 text-white shadow-sm shrink-0">
                #4 Rank
              </span>
            </div>
          </div>

          {/* Urgent High-Priority Alerts Panel */}
          <Card className="border-l-4 border-l-[#ef5b2a] bg-[#fffdf8] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center justify-between text-[#171716]">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-[#ef5b2a]" />
                  <span>{lang === "hi" ? "उच्च-प्राथमिकता राष्ट्रीय अलर्ट एवं नीतिगत हस्तक्षेप" : "High-Priority National Alerts & Central Intervention Watchlist"}</span>
                </div>
                <Badge className="bg-[#ef5b2a]/10 text-[#ef5b2a] border-[#ef5b2a]/30 text-[10px] font-bold">
                  4 Urgent Items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#171716]">Odisha: SLA Compliance Below 85% Threshold</span>
                    <Badge variant="destructive" className="text-[9px]">Critical Lag</Badge>
                  </div>
                  <p className="text-[11px] text-[#68655e]">
                    Cuttack & Puri taluks reporting 62-day average delay in Section 15 objection disposal due to revenue amin capacity constraints.
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-[#ef5b2a] font-semibold">Affected: 16 Projects • ₹1,220 Cr Outlay</span>
                    <Button
                      onClick={() => handleTabChange("bottlenecks")}
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] text-[#171716] font-bold hover:bg-[#fffdf8]"
                    >
                      View Bottleneck →
                    </Button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#171716]">Dahod-Jhabua Interstate Land Valuation Dispute</span>
                    <Badge variant="warning" className="text-[9px]">Escalation Active</Badge>
                  </div>
                  <p className="text-[11px] text-[#68655e]">
                    MP landholders protesting 35% higher circle rates awarded on Gujarat border section of Delhi-Mumbai Expressway.
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-[#ef5b2a] font-semibold">Corridor: NE-4 • 42 Hectares Paused</span>
                    <Button
                      onClick={() => handleTabChange("escalations")}
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] text-[#171716] font-bold hover:bg-[#fffdf8]"
                    >
                      Open Escalation →
                    </Button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#171716]">Andhra Pradesh: PFMS Name-Mismatch Failure Spurt</span>
                    <Badge variant="warning" className="text-[9px]">PFMS Flag</Badge>
                  </div>
                  <p className="text-[11px] text-[#68655e]">
                    340 compensation DBT tranches halted due to Telugu patronymic string mismatch between Aadhaar NPCI mapper and Khata records.
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-[#ef5b2a] font-semibold">Pending: ₹42.8 Cr • Krishnapatnam Node</span>
                    <Button
                      onClick={() => handleTabChange("compensation")}
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] text-[#171716] font-bold hover:bg-[#fffdf8]"
                    >
                      PFMS Monitor →
                    </Button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#171716]">Western DFC: Palghar CRZ-I Stage-II Deferral</span>
                    <Badge variant="destructive" className="text-[9px]">Forest Deadlock</Badge>
                  </div>
                  <p className="text-[11px] text-[#68655e]">
                    Maharashtra Forest Panel deferred diversion for 14.8 Ha rail alignment; joint inter-ministerial hearing with MoEFCC recommended.
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-[#ef5b2a] font-semibold">Impact: 1,506 Km Corridor Timeline</span>
                    <Button
                      onClick={() => handleTabChange("escalations")}
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] text-[#171716] font-bold hover:bg-[#fffdf8]"
                    >
                      Convene Review →
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart Row 1: Projects by State & Cumulative Acquisition Velocity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-6 bg-[#fffdf8] border-[#d8d3c9] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between text-[#171716]">
                  <span>{lang === "hi" ? "राज्यवार बुनियादी ढांचा परियोजनाएं" : "Total Linear Projects by State Portfolio"}</span>
                  <span className="text-xs font-normal text-[#68655e]">176 Projects Total</span>
                </CardTitle>
                <CardDescription className="text-xs text-[#68655e]">
                  Distribution across Highways, Dedicated Freight Rail, and Urban Transit systems.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectsByStateData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="state" tick={{ fontSize: 11, fill: "#171716" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#171716" }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fffdf8", borderColor: "#d8d3c9", borderRadius: "12px", color: "#171716", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Bar dataKey="highway" name="Highways" fill="#171716" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="rail" name="Freight Rail" fill="#ef5b2a" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="metro" name="Metro Transit" fill="#15803d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-6 bg-[#fffdf8] border-[#d8d3c9] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between text-[#171716]">
                  <span>{lang === "hi" ? "अधिग्रहण गति: अधिसूचित बनाम कब्जा (हेक्टेयर)" : "Acquisition Velocity: Notified vs Possessed (Hectares)"}</span>
                  <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                    84.7% Velocity
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-[#68655e]">
                  Cumulative trajectory tracking from Section 11 Notification to Section 38 Physical Possession.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="notifiedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef5b2a" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ef5b2a" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="acquiredGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#15803d" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#171716" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#171716" }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fffdf8", borderColor: "#d8d3c9", borderRadius: "12px", color: "#171716", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Area
                        type="monotone"
                        dataKey="notifiedHa"
                        name="Notified Area (Ha)"
                        stroke="#ef5b2a"
                        fillOpacity={1}
                        fill="url(#notifiedGrad)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="acquiredHa"
                        name="Possession Acquired (Ha)"
                        stroke="#15803d"
                        fillOpacity={1}
                        fill="url(#acquiredGrad)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Row 2: Stage Funnel & Compensation Outlay */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-5 bg-[#fffdf8] border-[#d8d3c9] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between text-[#171716]">
                  <span>{lang === "hi" ? "वैधानिक अधिग्रहण चरण फ़नल (1,842 केस)" : "Statutory 12-Stage Acquisition Funnel"}</span>
                  <span className="text-xs text-[#68655e]">RFCTLARR 2013</span>
                </CardTitle>
                <CardDescription className="text-xs text-[#68655e]">
                  National case progression from Section 4 SIA to Section 38 handover.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {stageFunnelData.map((st) => (
                  <div key={st.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#171716]">{st.stage}</span>
                      <span className="font-mono text-[#68655e]">{st.count} Cases ({st.pct}%)</span>
                    </div>
                    <div className="w-full bg-[#eae6dc] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#171716] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${st.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-7 bg-[#fffdf8] border-[#d8d3c9] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between text-[#171716]">
                  <span>{lang === "hi" ? "मुआवजा संवितरण: स्वीकृत बनाम पीएफएमएस क्रेडिट (₹ करोड़)" : "PFMS Compensation: Sanctioned vs Disbursed (₹ Crores)"}</span>
                  <span className="text-xs font-mono font-bold text-[#15803d]">92.4% Disbursed</span>
                </CardTitle>
                <CardDescription className="text-xs text-[#68655e]">
                  Direct Benefit Transfer delivery rates across key GatiShakti priority corridors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={compensationOutlayData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="corridor" tick={{ fontSize: 10, fill: "#171716" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#171716" }} />
                      <Tooltip
                        formatter={(val: any) => [`₹${val} Crores`, ""]}
                        contentStyle={{ backgroundColor: "#fffdf8", borderColor: "#d8d3c9", borderRadius: "12px", color: "#171716", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Bar dataKey="sanctionedCr" name="Sanctioned Outlay (₹ Cr)" fill="#68655e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="disbursedCr" name="Disbursed via PFMS (₹ Cr)" fill="#15803d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALL NATIONAL PROJECTS & INTER-STATE CORRIDORS                      */}
      {/* ========================================================================= */}
      {currentTab === "projects" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fffdf8] p-4 rounded-xl border border-[#d8d3c9]">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#68655e]" />
                <Input
                  placeholder={lang === "hi" ? "परियोजना या कॉरिडोर खोजें..." : "Search project, corridor or agency..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs border-[#d8d3c9] bg-[#fffdf8]"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {["ALL", "Highways", "Railways", "Industrial"].map((sec) => (
                  <Button
                    key={sec}
                    size="sm"
                    variant={selectedSector === sec ? "default" : "outline"}
                    onClick={() => setSelectedSector(sec)}
                    className={`h-8 text-xs rounded-full ${
                      selectedSector === sec
                        ? "bg-[#171716] text-[#fffdf8]"
                        : "border-[#d8d3c9] text-[#171716] hover:bg-[#f4f1ea]"
                    }`}
                  >
                    {sec}
                  </Button>
                ))}
              </div>
            </div>
            <div className="text-xs text-[#68655e] font-semibold">
              Showing <strong>{filteredCorridors.length}</strong> Priority Corridors
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCorridors.map((c) => (
              <div
                key={c.id}
                className="bg-[#fffdf8] border border-[#d8d3c9] rounded-xl p-5 shadow-sm space-y-3 hover:border-[#171716]/40 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#171716] text-[#fffdf8] text-[10px] font-mono">
                        {c.leadAgency}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-[#d8d3c9]">
                        {c.sector}
                      </Badge>
                      <span className="text-xs text-[#68655e] font-mono">{c.lengthKm} Km</span>
                    </div>
                    <h3 className="text-sm font-bold text-[#171716] mt-1">
                      {lang === "hi" ? c.nameHi : c.name}
                    </h3>
                  </div>

                  <Badge
                    variant={
                      c.riskLevel === "LOW"
                        ? "success"
                        : c.riskLevel === "MEDIUM"
                        ? "warning"
                        : "destructive"
                    }
                    className="text-[10px]"
                  >
                    {c.riskLevel} RISK
                  </Badge>
                </div>

                {/* States Traversed Multi-Badge */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#68655e] block">
                    Inter-State Trajectory ({c.statesTraversed.length} States):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {c.statesTraversed.map((st) => (
                      <span
                        key={st}
                        className="px-2 py-0.5 rounded bg-[#f4f1ea] border border-[#d8d3c9] text-[11px] font-bold font-mono text-[#171716]"
                      >
                        {st}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Progress Metric Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#68655e]">Acquired Extent</span>
                    <span className="font-bold text-[#171716]">
                      {c.acquiredHa.toLocaleString()} / {c.totalHa.toLocaleString()} Ha ({c.completionPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#eae6dc] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#ef5b2a] h-2 rounded-full"
                      style={{ width: `${c.completionPct}%` }}
                    />
                  </div>
                </div>

                {/* Financial Progress & Coordination Status */}
                <div className="pt-2 border-t border-[#d8d3c9] grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#68655e] block text-[10px]">PFMS Disbursement</span>
                    <span className="font-bold text-[#15803d]">₹{c.disbursedCr.toLocaleString()} Cr / ₹{c.sanctionedCr.toLocaleString()} Cr</span>
                  </div>
                  <div>
                    <span className="text-[#68655e] block text-[10px]">Harmonization Status</span>
                    <span className="font-semibold text-[#171716] line-clamp-1" title={c.interstateStatus}>
                      {c.interstateStatus}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STATE PERFORMANCE & RANKINGS                                       */}
      {/* ========================================================================= */}
      {currentTab === "states" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fffdf8] p-4 rounded-xl border border-[#d8d3c9]">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#68655e]" />
                <Input
                  placeholder={lang === "hi" ? "राज्य खोजें..." : "Filter state name..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs border-[#d8d3c9] bg-[#fffdf8]"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-xs text-[#68655e] font-semibold mr-1">Zone:</span>
                {["ALL", "North", "West", "South", "East", "Central"].map((z) => (
                  <Button
                    key={z}
                    size="sm"
                    variant={selectedZone === z ? "default" : "outline"}
                    onClick={() => setSelectedZone(z)}
                    className={`h-7 px-2 text-[11px] rounded-full ${
                      selectedZone === z
                        ? "bg-[#171716] text-[#fffdf8]"
                        : "border-[#d8d3c9] text-[#171716] hover:bg-[#f4f1ea]"
                    }`}
                  >
                    {z}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <span className="text-xs text-[#68655e] font-semibold mr-1">Tier:</span>
                {["ALL", "EXEMPLARY", "ON_TRACK", "NEEDS_INTERVENTION", "CRITICAL_LAG"].map((tr) => (
                  <Button
                    key={tr}
                    size="sm"
                    variant={selectedTier === tr ? "default" : "outline"}
                    onClick={() => setSelectedTier(tr)}
                    className={`h-7 px-2 text-[11px] rounded-full ${
                      selectedTier === tr
                        ? "bg-[#ef5b2a] text-white"
                        : "border-[#d8d3c9] text-[#171716] hover:bg-[#f4f1ea]"
                    }`}
                  >
                    {tr.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleExportPdf}
              size="sm"
              variant="outline"
              className="h-8 text-xs border-[#d8d3c9] text-[#171716] hover:bg-[#f4f1ea] rounded-full shrink-0"
            >
              <Download className="h-3.5 w-3.5 mr-1 text-[#ef5b2a]" />
              <span>Export Rankings</span>
            </Button>
          </div>

          {/* State Rankings Comparative Table */}
          <div className="bg-[#fffdf8] border border-[#d8d3c9] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#eae6dc]/60 border-b border-[#d8d3c9] text-[#171716] uppercase font-bold text-[11px] tracking-wider">
                  <tr>
                    <th className="p-3">Rank & State</th>
                    <th className="p-3">Zone</th>
                    <th className="p-3 text-center">Projects</th>
                    <th className="p-3">Acquisition (Ha)</th>
                    <th className="p-3 text-center">Avg Days</th>
                    <th className="p-3 text-center">SLA Compliance</th>
                    <th className="p-3 text-center">DBT Payout %</th>
                    <th className="p-3 text-center">R&R Fulfillment</th>
                    <th className="p-3 text-center">Data Quality</th>
                    <th className="p-3 text-center">Status Tier</th>
                    <th className="p-3 text-right">Drill-Down</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8d3c9]/70">
                  {filteredStates.map((st, idx) => (
                    <tr
                      key={st.id}
                      className="hover:bg-[#f4f1ea]/60 transition-colors text-[#171716]"
                    >
                      <td className="p-3 font-bold flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#171716] text-[#fffdf8] flex items-center justify-center text-[10px] font-mono">
                          {idx + 1}
                        </span>
                        <div>
                          <span>{lang === "hi" ? st.stateHi : st.state}</span>
                          <span className="block text-[10px] text-[#68655e] font-mono font-normal">Code: {st.id}</span>
                        </div>
                      </td>
                      <td className="p-3 text-[#68655e]">{st.zone}</td>
                      <td className="p-3 text-center font-mono font-bold">{st.projects}</td>
                      <td className="p-3">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold">{st.acquiredHa.toLocaleString()} Ha</span>
                          <span className="text-[10px] text-[#68655e] block">of {st.targetHa.toLocaleString()} ({st.completionPct}%)</span>
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono">{st.avgDays} d</td>
                      <td className="p-3 text-center font-bold">
                        <span className={st.slaCompliancePct >= 90 ? "text-[#15803d]" : "text-[#ef5b2a]"}>
                          {st.slaCompliancePct}%
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono">{st.dbtPaymentPct}%</td>
                      <td className="p-3 text-center font-mono">{st.rrCompletionPct}%</td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className="text-[10px] font-mono font-bold">
                          {st.dataQualityScore}/100
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={
                            st.status === "EXEMPLARY"
                              ? "success"
                              : st.status === "ON_TRACK"
                              ? "default"
                              : st.status === "NEEDS_INTERVENTION"
                              ? "warning"
                              : "destructive"
                          }
                          className="text-[9px]"
                        >
                          {st.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDrillDownState(st)}
                          className="h-7 text-[11px] border-[#d8d3c9] text-[#171716] hover:bg-[#171716] hover:text-[#fffdf8] rounded-full"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          <span>Districts</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DISTRICT PERFORMANCE MATRIX                                        */}
      {/* ========================================================================= */}
      {currentTab === "districts" && (
        <div className="space-y-4">
          <div className="bg-[#fffdf8] border border-[#d8d3c9] rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#171716]">All-India District Cadastral Matrix</h3>
              <p className="text-xs text-[#68655e]">Cross-district SLA benchmark, case backlog and primary bottleneck attribution.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#68655e]">Monitoring <strong>76</strong> Priority Corridor Districts</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { district: "Bengaluru Rural", state: "Karnataka", active: 24, acquired: 2050, target: 2400, sla: 90.2, bottleneck: "Sec 30 Solatium Award Signoff" },
              { district: "Ahmedabad", state: "Gujarat", active: 18, acquired: 1890, target: 1950, sla: 96.4, bottleneck: "Possession Handover Complete" },
              { district: "Pune", state: "Maharashtra", active: 28, acquired: 2100, target: 2450, sla: 89.5, bottleneck: "Sec 15 Objection Backlog" },
              { district: "Palghar", state: "Maharashtra", active: 22, acquired: 920, target: 1250, sla: 76.4, bottleneck: "MoEFCC Mangrove Eco-Clearance" },
              { district: "Jaipur", state: "Rajasthan", active: 14, acquired: 1420, target: 1510, sla: 94.2, bottleneck: "Sec 38 Possession Handover" },
              { district: "Prayagraj", state: "Uttar Pradesh", active: 34, acquired: 1650, target: 2200, sla: 78.9, bottleneck: "Survey Amin Capacity Deficit" },
              { district: "Visakhapatnam", state: "Andhra Pradesh", active: 20, acquired: 1240, target: 1680, sla: 81.2, bottleneck: "PFMS Name-Mismatch Failure" },
              { district: "Cuttack", state: "Odisha", active: 19, acquired: 820, target: 1190, sla: 74.8, bottleneck: "Section 11 Gazette Delay" },
              { district: "Kanchipuram", state: "Tamil Nadu", active: 16, acquired: 1350, target: 1480, sla: 92.1, bottleneck: "R&R Allotment Ratification" },
            ].map((d) => (
              <div key={d.district} className="bg-[#fffdf8] border border-[#d8d3c9] rounded-xl p-4 space-y-2.5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#171716]">{d.district}</h4>
                    <span className="text-[10px] text-[#68655e]">{d.state}</span>
                  </div>
                  <Badge variant={d.sla >= 90 ? "success" : d.sla >= 80 ? "warning" : "destructive"} className="text-[10px]">
                    {d.sla}% SLA
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#68655e]">Acquisition Extent</span>
                    <span className="font-bold text-[#171716]">{d.acquired} / {d.target} Ha</span>
                  </div>
                  <div className="w-full bg-[#eae6dc] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#171716] h-1.5 rounded-full"
                      style={{ width: `${(d.acquired / d.target) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#d8d3c9] text-[10px] flex items-center justify-between text-[#68655e]">
                  <span>Bottleneck:</span>
                  <span className="font-semibold text-[#ef5b2a] line-clamp-1">{d.bottleneck}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* ========================================================================= */}
      {/* TAB 6: COMPENSATION & R&R MONITORING (PFMS)                              */}
      {/* ========================================================================= */}
      {currentTab === "compensation" && (
        <div className="space-y-6">
          {/* Top Financial Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title={lang === "hi" ? "केंद्रीय बजट आवंटन" : "Central Budget Allocation"}
              value="₹35,000 Cr"
              subtext={lang === "hi" ? "मंत्रालय पूंजीगत व्यय" : "Ministry Capital Expenditure"}
              icon={Coins}
              variant="amber"
            />
            <StatCard
              title={lang === "hi" ? "राज्यों को जारी राशि" : "Treasury Funds Released"}
              value="₹32,950 Cr"
              subtext={lang === "hi" ? "28 राज्य खजानों में जारी" : "Released to 28 State Treasuries"}
              icon={Building2}
              variant="amber"
            />
            <StatCard
              title={lang === "hi" ? "किसानों को मिला प्रत्यक्ष मुआवजा" : "PFMS DBT Disbursed"}
              value="₹30,450 Cr"
              subtext={lang === "hi" ? "92.4% जमीन मालिकों को क्रेडिट" : "92.4% Credited to Landholders"}
              trend={{ value: lang === "hi" ? "सीधे बैंक खाते में" : "Direct Transfer", isPositive: true }}
              icon={CheckCircle2}
              variant="green"
            />
            <StatCard
              title={lang === "hi" ? "लंबित फंड मांग" : "Pending Release Requests"}
              value="₹2,050 Cr"
              subtext={lang === "hi" ? "अतिरिक्त किस्तों की मांग" : "Supplemental Tranche Demands"}
              trend={{ value: lang === "hi" ? "3 राज्य प्रतीक्षारत" : "3 States Pending", isPositive: false }}
              icon={AlertTriangle}
              variant="rose"
            />
          </div>

          {/* R&R Implementation Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-7 bg-[#fffdf8] border-[#d8d3c9] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between text-[#171716]">
                  <span>Second Schedule R&R Benefit Implementation</span>
                  <Badge className="bg-[#ef5b2a]/10 text-[#ef5b2a] border-[#ef5b2a]/30 text-[10px]">
                    13,050 Resettled Families
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-[#68655e]">
                  Rehabilitation housing, subsistence allowance, and cattle shed grant delivery.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#f4f1ea] p-3 rounded-xl border border-[#d8d3c9] text-center">
                    <span className="text-[10px] text-[#68655e] block font-bold">Housing Units Built</span>
                    <span className="text-xl font-black text-[#15803d]">4,200</span>
                    <span className="text-[10px] text-[#68655e] block">87.5% of 4,800</span>
                  </div>
                  <div className="bg-[#f4f1ea] p-3 rounded-xl border border-[#d8d3c9] text-center">
                    <span className="text-[10px] text-[#68655e] block font-bold">Subsistence Paid</span>
                    <span className="text-xl font-black text-[#171716]">₹420 Cr</span>
                    <span className="text-[10px] text-[#15803d] block font-bold">94.2% Credit</span>
                  </div>
                  <div className="bg-[#f4f1ea] p-3 rounded-xl border border-[#d8d3c9] text-center">
                    <span className="text-[10px] text-[#68655e] block font-bold">Cattle Shed Grants</span>
                    <span className="text-xl font-black text-[#171716]">₹84 Cr</span>
                    <span className="text-[10px] text-[#15803d] block font-bold">91.0% Payout</span>
                  </div>
                  <div className="bg-[#f4f1ea] p-3 rounded-xl border border-[#d8d3c9] text-center">
                    <span className="text-[10px] text-[#68655e] block font-bold">Land-for-Land Plots</span>
                    <span className="text-xl font-black text-[#ef5b2a]">950</span>
                    <span className="text-[10px] text-[#68655e] block">78.5% Ratified</span>
                  </div>
                </div>

                <div className="h-[200px] w-full flex items-center justify-center pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={rrData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {rrData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fffdf8", borderColor: "#d8d3c9", borderRadius: "12px", color: "#171716", fontSize: "12px" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-5 bg-[#fffdf8] border-[#d8d3c9] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-[#171716]">State-wise Fund Utilization & Tranche Requisitions</CardTitle>
                <CardDescription className="text-xs text-[#68655e]">Expenditure rate against central allocations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { state: "Gujarat", allocated: 5200, disbursed: 4980, pct: 95.7, status: "Optimal" },
                  { state: "Maharashtra", allocated: 6800, disbursed: 6240, pct: 91.8, status: "Optimal" },
                  { state: "Karnataka", allocated: 4100, disbursed: 3630, pct: 88.5, status: "Requisition Pending" },
                  { state: "Uttar Pradesh", allocated: 7200, disbursed: 6190, pct: 86.0, status: "Requisition Pending" },
                  { state: "Andhra Pradesh", allocated: 2900, disbursed: 2360, pct: 81.4, status: "Under-Utilized" },
                ].map((s) => (
                  <div key={s.state} className="p-2.5 rounded-lg bg-[#f4f1ea] border border-[#d8d3c9] text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#171716]">{s.state}</span>
                      <span className="font-mono text-[#15803d] font-bold">{s.pct}%</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-[#68655e]">
                      <span>Allocated: ₹{s.allocated} Cr</span>
                      <span>Disbursed: ₹{s.disbursed} Cr</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: GRIEVANCES & LITIGATION RADAR                                      */}
      {/* ========================================================================= */}
      {currentTab === "litigation" && (
        <div className="space-y-6">
          <div className="bg-[#fffdf8] border border-[#d8d3c9] rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#171716]">National Land Acquisition Litigation & Dispute Radar</h3>
              <p className="text-xs text-[#68655e]">Tracking High Court writ petitions, District Court title suits, and LARRA Section 64 enhancement references.</p>
            </div>
            <Badge variant="destructive" className="text-xs">
              464 Active Disputes Across India
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#fffdf8] border border-[#d8d3c9] p-4 rounded-xl shadow-sm text-center space-y-1">
              <span className="text-xs text-[#68655e] font-bold uppercase">High Courts (Writ Jurisdiction)</span>
              <p className="text-3xl font-black text-rose-600">84</p>
              <span className="text-[11px] text-[#68655e]">Constitutional challenges & Section 10 exemptions</span>
            </div>
            <div className="bg-[#fffdf8] border border-[#d8d3c9] p-4 rounded-xl shadow-sm text-center space-y-1">
              <span className="text-xs text-[#68655e] font-bold uppercase">District Courts (Title Injunctions)</span>
              <p className="text-3xl font-black text-[#ef5b2a]">168</p>
              <span className="text-[11px] text-[#68655e]">Partition suits, joint-khata disputes & encumbrances</span>
            </div>
            <div className="bg-[#fffdf8] border border-[#d8d3c9] p-4 rounded-xl shadow-sm text-center space-y-1">
              <span className="text-xs text-[#68655e] font-bold uppercase">LARRA Statutory Authorities</span>
              <p className="text-3xl font-black text-[#171716]">212</p>
              <span className="text-[11px] text-[#68655e]">Section 64 market valuation & solatium claims</span>
            </div>
          </div>

          {/* Dispute Density Hotspot Table */}
          <div className="bg-[#fffdf8] border border-[#d8d3c9] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#d8d3c9]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#171716]">Top Litigation Density Hotspots (Districts with Highest Active Contests)</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#eae6dc]/60 border-b border-[#d8d3c9] text-[#171716] uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">District & State</th>
                    <th className="p-3">Corridor Impacted</th>
                    <th className="p-3 text-center">Writ Petitions</th>
                    <th className="p-3 text-center">Title Suits</th>
                    <th className="p-3 text-center">Stay Orders</th>
                    <th className="p-3">Primary Legal Ground</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8d3c9]/70 text-[#171716]">
                  {[
                    { district: "Prayagraj", state: "Uttar Pradesh", corridor: "Amritsar-Kolkata Eastern DFC", writs: 18, suits: 32, stays: 4, ground: "Circle rate determination vs actual registry sale deed value" },
                    { district: "Palghar", state: "Maharashtra", corridor: "Delhi-Mumbai Exp & WDFC", writs: 14, suits: 22, stays: 2, ground: "CRZ-I environmental clearance and tribal forest rights" },
                    { district: "Visakhapatnam", state: "Andhra Pradesh", corridor: "Vizag-Chennai Industrial", writs: 12, suits: 19, stays: 3, ground: "Section 10 multi-crop agricultural land threshold dispute" },
                    { district: "Bengaluru Rural", state: "Karnataka", corridor: "Bengaluru STRR (NH-948A)", writs: 9, suits: 24, stays: 1, ground: "Gramathana boundary overlap with private survey numbers" },
                    { district: "Cuttack", state: "Odisha", corridor: "Eastern Industrial Spurt", writs: 8, suits: 18, stays: 2, ground: "Compensation apportionment between landlord and tenant cultivators" },
                  ].map((h) => (
                    <tr key={h.district} className="hover:bg-[#f4f1ea]/60">
                      <td className="p-3 font-bold">
                        {h.district}, <span className="font-normal text-[#68655e]">{h.state}</span>
                      </td>
                      <td className="p-3 font-mono">{h.corridor}</td>
                      <td className="p-3 text-center font-bold text-rose-600">{h.writs}</td>
                      <td className="p-3 text-center font-mono">{h.suits}</td>
                      <td className="p-3 text-center">
                        <Badge variant={h.stays > 0 ? "destructive" : "outline"} className="text-[9px]">
                          {h.stays} Stays
                        </Badge>
                      </td>
                      <td className="p-3 text-[#68655e] max-w-xs truncate">{h.ground}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: CENTRAL ESCALATIONS WORKBENCH                                     */}
      {/* ========================================================================= */}
      {currentTab === "escalations" && (
        <div className="space-y-4">
          <div className="bg-[#fffdf8] border border-[#d8d3c9] rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#171716]">State-to-Centre Escalation Resolution Workbench</h3>
              <p className="text-xs text-[#68655e]">Formal petitions submitted by State Revenue Secretaries requesting Central Ministry policy guidance, funding, or inter-state harmonization.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="civic" className="text-xs">
                {escalationsList.filter((e) => e.status !== "RESOLVED").length} Active Petitions
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            {escalationsList.map((esc) => (
              <div
                key={esc.id}
                className="bg-[#fffdf8] border border-[#d8d3c9] rounded-xl p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#ef5b2a]">{esc.id}</span>
                    <Badge variant="outline" className="text-[10px] border-[#d8d3c9]">
                      {esc.category.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-[#68655e]">Submitted: {esc.submittedDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        esc.status === "RESOLVED"
                          ? "success"
                          : esc.status === "ACTION_PLAN_REQUESTED"
                          ? "warning"
                          : "default"
                      }
                      className="text-[10px]"
                    >
                      {esc.status.replace("_", " ")}
                    </Badge>
                    <Badge
                      variant={esc.urgency === "CRITICAL" ? "destructive" : "warning"}
                      className="text-[10px]"
                    >
                      {esc.urgency}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#171716]">
                    {lang === "hi" ? esc.titleHi : esc.title}
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-[#68655e] mt-1">
                    <span>Source: <strong className="text-[#171716]">{esc.sourceState}</strong></span>
                    <span>Corridor: <strong className="text-[#171716]">{esc.corridor}</strong></span>
                  </div>
                </div>

                <p className="text-xs text-[#68655e] bg-[#f4f1ea] p-3 rounded-lg border border-[#d8d3c9] leading-relaxed">
                  {lang === "hi" ? esc.summaryHi : esc.summary}
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-[#ef5b2a] font-semibold text-[11px]">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Requested: {esc.requestedAction}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {esc.status !== "RESOLVED" ? (
                      <>
                        <Button
                          onClick={() => handleEscalationAction(esc.id, "ACTION_PLAN")}
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-[#d8d3c9] text-[#171716] hover:bg-[#f4f1ea] rounded-full"
                        >
                          Request State Action Plan
                        </Button>
                        <Button
                          onClick={() => handleEscalationAction(esc.id, "DIRECTIVE")}
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-[#d8d3c9] text-[#171716] hover:bg-[#f4f1ea] rounded-full"
                        >
                          Issue Guidance Directive
                        </Button>
                        <Button
                          onClick={() => handleEscalationAction(esc.id, "RESOLVE")}
                          size="sm"
                          className="h-8 text-xs bg-[#15803d] hover:bg-emerald-800 text-white font-bold rounded-full shadow-sm"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Mark Resolved
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-[#15803d] font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Escalation Action Completed & Archived
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: POLICY, STANDARDS & DATA INTEROPERABILITY                          */}
      {/* ========================================================================= */}
      {currentTab === "compliance" && (
        <div className="space-y-6">
          <div className="bg-[#fffdf8] border border-[#d8d3c9] rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#171716]">National Land Data Standards & Interoperability Library</h3>
              <p className="text-xs text-[#68655e]">Published technical specifications, geospatial schemas, and data exchange protocols under DILRMP 2.0.</p>
            </div>
            <Button
              onClick={() => setIsPolicyModalOpen(true)}
              size="sm"
              className="h-8 text-xs bg-[#171716] text-[#fffdf8] font-bold rounded-full"
            >
              <Send className="h-3.5 w-3.5 mr-1.5 text-[#ef5b2a]" />
              Publish Circular
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nationalStandards.map((std) => (
              <div key={std.id} className="bg-[#fffdf8] border border-[#d8d3c9] rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-[#ef5b2a] font-bold">{std.code} • {std.version}</span>
                    <h4 className="text-xs font-bold text-[#171716] mt-0.5">{std.title}</h4>
                  </div>
                  <Badge className="bg-[#171716] text-[#fffdf8] text-[9px]">
                    {std.status}
                  </Badge>
                </div>

                <p className="text-xs text-[#68655e] leading-relaxed">
                  {std.summary}
                </p>

                <div className="pt-2 border-t border-[#d8d3c9] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[#68655e]">National Adoption:</span>
                    <span className="font-bold text-[#15803d] font-mono">{std.complianceRate}%</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-[#d8d3c9]">
                    Category: {std.category}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 10: NATIONAL DECISION SUPPORT REPORTS                                  */}
      {/* ========================================================================= */}
      {currentTab === "reports" && (
        <div className="space-y-4">
          <div className="bg-[#fffdf8] border border-[#d8d3c9] rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#171716]">National Decision Support & Executive Reports</h3>
              <p className="text-xs text-[#68655e]">Generate, print, or export parliamentary review documents and statutory compliance summaries.</p>
            </div>
            <Button
              onClick={handleExportPdf}
              size="sm"
              className="h-8 text-xs bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold rounded-full"
            >
              <Download className="h-3.5 w-3.5 mr-1.5 text-[#ef5b2a]" />
              Generate Cabinet PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Monthly Cabinet Land Acquisition Status Brief",
                desc: "High-level review of 48 GatiShakti priority corridors, aggregate hectarage acquired, and inter-state bottleneck matrix.",
                period: "August 2026",
                action: handleExportPdf,
              },
              {
                title: "State Performance & Ranking White Paper",
                desc: "Comprehensive 10-indicator ranking identifying high-performing states and jurisdictions requiring central intervention.",
                period: "Q2 FY 2026-27",
                action: handleExportPdf,
              },
              {
                title: "Parliamentary Standing Committee Review Summary",
                desc: "Second Schedule R&R compensation disbursement rates, beneficiary coverage, and litigation resolution timeline.",
                period: "Bi-Annual 2026",
                action: handleExportPdf,
              },
              {
                title: "Inter-State Linear Corridor Harmonization Assessment",
                desc: "Boundary continuity analysis for Delhi-Mumbai Expressway and Dedicated Freight Corridors.",
                period: "Current Sprint",
                action: handleExportPdf,
              },
              {
                title: "National Land Records Data Quality & ULPIN Audit",
                desc: "Audit scorecard of 28 State Bhulekh portals for 14-digit Bhu-Aadhaar compliance and WFS GIS alignment.",
                period: "Annual 2026",
                action: handleExportPdf,
              },
              {
                title: "High-Risk Case Early Warning & Bottleneck Register",
                desc: "Comprehensive catalog of 33 critical cases with root cause diagnostics and proposed central remedies.",
                period: "Real-Time Feed",
                action: handleExportPdf,
              },
            ].map((rep) => (
              <div
                key={rep.title}
                className="bg-[#fffdf8] border border-[#d8d3c9] rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-[#68655e] mb-1">
                    <span className="font-mono font-bold text-[#ef5b2a]">OFFICIAL BRIEF</span>
                    <span>{rep.period}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#171716] leading-snug">{rep.title}</h4>
                  <p className="text-[11px] text-[#68655e] mt-1.5 leading-relaxed">{rep.desc}</p>
                </div>

                <div className="pt-3 border-t border-[#d8d3c9] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#68655e]">Format: PDF / CSV</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={rep.action}
                    className="h-7 text-xs border-[#d8d3c9] text-[#171716] hover:bg-[#f4f1ea] rounded-full"
                  >
                    <Download className="h-3 w-3 mr-1 text-[#ef5b2a]" />
                    Export
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: STATE DISTRICT DRILL-DOWN MODAL                                  */}
      {/* ========================================================================= */}
      {drillDownState && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#fffdf8] border border-[#d8d3c9] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col text-[#171716]">
            <div className="flex items-center justify-between pb-3 border-b border-[#d8d3c9]">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#171716] text-[#fffdf8] text-[10px]">{drillDownState.id}</Badge>
                  <h3 className="text-base font-bold text-[#171716]">
                    {drillDownState.state} ({drillDownState.stateHi}) — District-Wise Acquisition Breakdown
                  </h3>
                </div>
                <p className="text-xs text-[#68655e] mt-0.5">
                  Zone: {drillDownState.zone} • {drillDownState.projects} Linear Projects • SLA Compliance: {drillDownState.slaCompliancePct}%
                </p>
              </div>
              <button
                onClick={() => setDrillDownState(null)}
                className="text-[#68655e] hover:text-[#171716] p-1.5 rounded-full hover:bg-[#f4f1ea]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1">
              <div className="grid grid-cols-3 gap-2 bg-[#f4f1ea] p-3 rounded-xl border border-[#d8d3c9] text-center text-xs">
                <div>
                  <span className="text-[10px] text-[#68655e] block">Land Acquired</span>
                  <span className="font-bold text-[#171716] font-mono">{drillDownState.acquiredHa.toLocaleString()} Ha ({drillDownState.completionPct}%)</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#68655e] block">DBT Payment Rate</span>
                  <span className="font-bold text-[#15803d] font-mono">{drillDownState.dbtPaymentPct}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#68655e] block">Data Quality Score</span>
                  <span className="font-bold text-[#ef5b2a] font-mono">{drillDownState.dataQualityScore}/100</span>
                </div>
              </div>

              <span className="text-xs font-bold text-[#171716] block pt-2">Key Constituent Districts:</span>
              <div className="space-y-2">
                {[
                  { name: `${drillDownState.state} District Alpha`, cases: 14, acquired: "920 Ha", sla: "94.2%", status: "On Track" },
                  { name: `${drillDownState.state} District Beta`, cases: 22, acquired: "840 Ha", sla: "88.6%", status: "Sec 15 Objections" },
                  { name: `${drillDownState.state} District Gamma`, cases: 12, acquired: "890 Ha", sla: "92.0%", status: "On Track" },
                ].map((d) => (
                  <div key={d.name} className="p-3 rounded-lg bg-[#fffdf8] border border-[#d8d3c9] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#171716]">{d.name}</span>
                      <span className="text-[10px] text-[#68655e] block">{d.cases} Active Cases • {d.acquired}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#15803d] font-mono">{d.sla} SLA</span>
                      <span className="text-[10px] text-[#68655e] block">{d.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#d8d3c9] flex justify-end">
              <Button
                size="sm"
                onClick={() => setDrillDownState(null)}
                className="bg-[#171716] text-[#fffdf8] text-xs font-bold rounded-full px-5"
              >
                Close State Inspector
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BROADCAST POLICY CIRCULAR MODAL                                  */}
      {/* ========================================================================= */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#fffdf8] border border-[#d8d3c9] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-[#171716]">
            <div className="flex items-center justify-between pb-3 border-b border-[#d8d3c9]">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-[#ef5b2a]" />
                <h3 className="text-sm font-bold text-[#171716]">
                  Publish National Policy Advisory / Circular
                </h3>
              </div>
              <button
                onClick={() => setIsPolicyModalOpen(false)}
                className="text-[#68655e] hover:text-[#171716] p-1.5 rounded-full hover:bg-[#f4f1ea]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {policyBroadcastSuccess ? (
              <div className="text-center py-8 space-y-2">
                <CheckCircle2 className="h-12 w-12 text-[#15803d] mx-auto" />
                <h4 className="text-sm font-bold text-[#171716]">Policy Circular Transmitted Successfully!</h4>
                <p className="text-xs text-[#68655e]">
                  Dispatched to 28 State Revenue Departments and SLAO units via BhoomiSetu secure channel.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBroadcastPolicy} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-[#171716] block mb-1">Circular Subject / Title</label>
                  <Input
                    required
                    placeholder="e.g., Standard Operating Procedure for Section 15 Objection Redressal"
                    value={policySubject}
                    onChange={(e) => setPolicySubject(e.target.value)}
                    className="h-9 text-xs border-[#d8d3c9] bg-[#fffdf8]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#171716] block mb-1">Statutory Authority / Classification</label>
                  <Input
                    disabled
                    value="DoLR/2026/CIRCULAR — Section 108 RFCTLARR Act 2013 Policy Directive"
                    className="h-8 text-xs font-mono bg-[#f4f1ea] border-[#d8d3c9] text-[#68655e]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#171716] block mb-1">Advisory Content & Guidelines</label>
                  <Textarea
                    required
                    rows={4}
                    placeholder="Provide specific guidelines, timeframes, or standard benchmarks for State Revenue Authorities..."
                    value={policyContent}
                    onChange={(e) => setPolicyContent(e.target.value)}
                    className="text-xs border-[#d8d3c9] bg-[#fffdf8]"
                  />
                </div>

                <div className="pt-2 border-t border-[#d8d3c9] flex items-center justify-between">
                  <span className="text-[10px] text-[#68655e]">Broadcasts to: 28 State Revenue Cells</span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPolicyModalOpen(false)}
                      className="h-8 text-xs border-[#d8d3c9] rounded-full"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="h-8 text-xs bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold rounded-full"
                    >
                      Broadcast Circular
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NationalDashboardPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-12 text-center text-xs text-[#68655e]">Initializing National Visual Analytics...</div>}>
      <NationalDashboardContent />
    </Suspense>
  );
}