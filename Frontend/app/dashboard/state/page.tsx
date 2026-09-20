"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { formatINR, formatAreaHectares } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { generateStateAuthorityPdf } from "@/lib/pdf-generator";
import { useStateDashboardQuery, useUpdateStateApprovalMutation } from "@/hooks/queries/use-bhoomi-queries";
import { RoleBasedDelayIntelligence } from "@/components/ai/role-based-delay-intelligence";
import {
  Building,
  Clock,
  AlertTriangle,
  Coins,
  Compass,
  CheckCircle2,
  FileCheck,
  TrendingUp,
  Download,
  Eye,
  Check,
  X,
  Filter,
  Search,
  ChevronRight,
  Layers,
  FileText,
  MapPin,
  Sparkles,
  Send,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

// --- MOCK STATE DATA ---

interface DistrictMetric {
  id: string;
  name: string;
  nameHi: string;
  division: string;
  dcName: string;
  targetHa: number;
  acquiredHa: number;
  completionPct: number;
  activeCases: number;
  slaCompliancePct: number;
  avgDaysToHandover: number;
  compensationCr: number;
  bottleneckStage: string;
  bottleneckStageHi: string;
  status: "EXCEEDING" | "ON_TRACK" | "REQUIRES_ATTENTION" | "CRITICAL_LAG";
}

const KARNATAKA_DISTRICTS: DistrictMetric[] = [
  {
    id: "BLR_R",
    name: "Bengaluru Rural",
    nameHi: "बेंगलुरु ग्रामीण",
    division: "Bengaluru Division",
    dcName: "Shri Manjunath R., IAS",
    targetHa: 380,
    acquiredHa: 310,
    completionPct: 81.6,
    activeCases: 18,
    slaCompliancePct: 91.2,
    avgDaysToHandover: 52,
    compensationCr: 842.5,
    bottleneckStage: "Section 15 Objections",
    bottleneckStageHi: "धारा 15 नागरिक आपत्तियां",
    status: "ON_TRACK",
  },
  {
    id: "KLR",
    name: "Kolar",
    nameHi: "कोलार",
    division: "Bengaluru Division",
    dcName: "Smt. Akram Pasha, IAS",
    targetHa: 210,
    acquiredHa: 190,
    completionPct: 90.5,
    activeCases: 6,
    slaCompliancePct: 94.8,
    avgDaysToHandover: 41,
    compensationCr: 310.2,
    bottleneckStage: "Bank Account Verification",
    bottleneckStageHi: "बैंक खाता सत्यापन",
    status: "EXCEEDING",
  },
  {
    id: "MND",
    name: "Mandya",
    nameHi: "मांड्या",
    division: "Mysuru Division",
    dcName: "Dr. Kumar, IAS",
    targetHa: 280,
    acquiredHa: 250,
    completionPct: 89.3,
    activeCases: 8,
    slaCompliancePct: 92.0,
    avgDaysToHandover: 46,
    compensationCr: 520.0,
    bottleneckStage: "Physical Possession Memo",
    bottleneckStageHi: "कब्जा एवं हस्तांतरण मेमो",
    status: "EXCEEDING",
  },
  {
    id: "RAM",
    name: "Ramanagara",
    nameHi: "रामनगर",
    division: "Bengaluru Division",
    dcName: "Shri Avinash Menon, IAS",
    targetHa: 290,
    acquiredHa: 245,
    completionPct: 84.5,
    activeCases: 9,
    slaCompliancePct: 89.4,
    avgDaysToHandover: 54,
    compensationCr: 612.4,
    bottleneckStage: "Section 19 Declaration",
    bottleneckStageHi: "धारा 19 अंतिम घोषणा",
    status: "ON_TRACK",
  },
  {
    id: "MYS",
    name: "Mysuru",
    nameHi: "मैसूरु",
    division: "Mysuru Division",
    dcName: "Dr. K. V. Rajendra, IAS",
    targetHa: 320,
    acquiredHa: 265,
    completionPct: 82.8,
    activeCases: 11,
    slaCompliancePct: 88.5,
    avgDaysToHandover: 57,
    compensationCr: 710.8,
    bottleneckStage: "Joint Field Survey",
    bottleneckStageHi: "संयुक्त सीमा सर्वेक्षण",
    status: "ON_TRACK",
  },
  {
    id: "TUM",
    name: "Tumakuru",
    nameHi: "तुमकुरु",
    division: "Bengaluru Division",
    dcName: "Shri Subha Kalyan, IAS",
    targetHa: 450,
    acquiredHa: 320,
    completionPct: 71.1,
    activeCases: 14,
    slaCompliancePct: 78.4,
    avgDaysToHandover: 69,
    compensationCr: 690.0,
    bottleneckStage: "Field Measurement & DGPS",
    bottleneckStageHi: "भूमि माप एवं जीपीएस सीमांकन",
    status: "REQUIRES_ATTENTION",
  },
  {
    id: "BEL",
    name: "Belagavi",
    nameHi: "बेलगावी",
    division: "Belagavi Division",
    dcName: "Shri Nitesh Patil, IAS",
    targetHa: 390,
    acquiredHa: 268,
    completionPct: 68.7,
    activeCases: 12,
    slaCompliancePct: 76.2,
    avgDaysToHandover: 72,
    compensationCr: 480.5,
    bottleneckStage: "Award Calculation Discrepancy",
    bottleneckStageHi: "मुआवजा गणना मिलान",
    status: "REQUIRES_ATTENTION",
  },
  {
    id: "CKB",
    name: "Chikkaballapura",
    nameHi: "चिक्काबल्लापुर",
    division: "Bengaluru Division",
    dcName: "Shri P. N. Ravindra, IAS",
    targetHa: 340,
    acquiredHa: 215,
    completionPct: 63.2,
    activeCases: 15,
    slaCompliancePct: 71.0,
    avgDaysToHandover: 84,
    compensationCr: 395.0,
    bottleneckStage: "Section 15 Citizen Hearings",
    bottleneckStageHi: "धारा 15 नागरिक आपत्तियां",
    status: "CRITICAL_LAG",
  },
  {
    id: "DKN",
    name: "Dakshina Kannada",
    nameHi: "दक्षिण कन्नड़",
    division: "Mysuru Division",
    dcName: "Shri Mullai Muhilan, IAS",
    targetHa: 220,
    acquiredHa: 140,
    completionPct: 63.6,
    activeCases: 9,
    slaCompliancePct: 72.5,
    avgDaysToHandover: 81,
    compensationCr: 415.0,
    bottleneckStage: "Forest & Coastal Clearance",
    bottleneckStageHi: "वन एवं तटीय नियामक अनापत्ति",
    status: "CRITICAL_LAG",
  },
  {
    id: "KLB",
    name: "Kalaburagi",
    nameHi: "कलबुर्गी",
    division: "Kalaburagi Division",
    dcName: "Shri Fouzia Taranum, IAS",
    targetHa: 360,
    acquiredHa: 220,
    completionPct: 61.1,
    activeCases: 13,
    slaCompliancePct: 68.9,
    avgDaysToHandover: 88,
    compensationCr: 310.0,
    bottleneckStage: "Title Dispute & Mutation",
    bottleneckStageHi: "स्वामित्व विवाद एवं दाखिल खारिज",
    status: "CRITICAL_LAG",
  },
];

interface PendingApproval {
  id: string;
  type: "PROPOSAL" | "DRAFT_NOTIFICATION" | "FINAL_DECLARATION" | "HIGH_VALUE_AWARD";
  title: string;
  titleHi: string;
  project: string;
  district: string;
  landAreaHa: number;
  financialOutlayCr: number;
  submittedBy: string;
  submittedDate: string;
  slaDeadline: string;
  slaHoursLeft: number;
  isUrgent: boolean;
  dossierSummary: string;
  dossierSummaryHi: string;
  status: "PENDING" | "APPROVED" | "RETURNED";
}

const INITIAL_APPROVALS: PendingApproval[] = [
  {
    id: "APPR-2026-001",
    type: "PROPOSAL",
    title: "Administrative Sanction for Bengaluru Outer Peripheral Ring Road (STRR Phase-II)",
    titleHi: "बेंगलुरु आउटर पेरिफेरल रिंग रोड (एसटीआरआर फेज-II) हेतु प्रशासनिक मंजूरी",
    project: "Satellite Town Ring Road (STRR NH-948A)",
    district: "Bengaluru Rural & Ramanagara",
    landAreaHa: 680.5,
    financialOutlayCr: 2450.0,
    submittedBy: "NHAI Project Implementation Unit (PIU Bengaluru)",
    submittedDate: "04 Sep 2026",
    slaDeadline: "14 Sep 2026",
    slaHoursLeft: 72,
    isUrgent: false,
    dossierSummary: "Comprehensive Social Impact Assessment (SIA) completed. State Multi-Disciplinary Expert Group has recommended acquisition with provision for 1,420 rehabilitation plots.",
    dossierSummaryHi: "सामाजिक प्रभाव आकलन (एसआईए) पूर्ण। राज्य बहु-विषयक विशेषज्ञ समूह ने 1,420 पुनर्वास भूखंडों के प्रावधान के साथ अधिग्रहण की सिफारिश की है।",
    status: "PENDING",
  },
  {
    id: "APPR-2026-002",
    type: "DRAFT_NOTIFICATION",
    title: "Section 11 Preliminary Notification Gazette Publication Approval",
    titleHi: "धारा 11 प्रारंभिक अधिसूचना राजपत्र प्रकाशन अनुमोदन",
    project: "Mysuru-Kushalnagar 4-Lane Greenfield Economic Corridor",
    district: "Mysuru",
    landAreaHa: 240.0,
    financialOutlayCr: 680.0,
    submittedBy: "Special Land Acquisition Officer (SLAO - CALA Mysuru)",
    submittedDate: "07 Sep 2026",
    slaDeadline: "11 Sep 2026",
    slaHoursLeft: 18,
    isUrgent: true,
    dossierSummary: "SIA exemption granted under public infrastructure provisions. 14-digit ULPIN plot boundaries demarcated for 340 agricultural holdings. Ready for State Extraordinary Gazette.",
    dossierSummaryHi: "सार्वजनिक बुनियादी ढांचा प्रावधानों के तहत एसआईए छूट प्राप्त। 340 कृषि जोतों के 14-अंकीय भू-आधार सीमांकन पूर्ण। राज्य असाधारण राजपत्र हेतु तैयार।",
    status: "PENDING",
  },
  {
    id: "APPR-2026-003",
    type: "FINAL_DECLARATION",
    title: "Section 19 Declaration of Acquisition & R&R Summary Ratification",
    titleHi: "धारा 19 अंतिम अधिग्रहण घोषणा एवं पुनर्वास सारांश अनुमोदन",
    project: "Tumakuru Industrial Node Phase-III (CBIC Smart City)",
    district: "Tumakuru",
    landAreaHa: 410.0,
    financialOutlayCr: 1120.0,
    submittedBy: "Deputy Commissioner & DM, Tumakuru",
    submittedDate: "02 Sep 2026",
    slaDeadline: "12 Sep 2026",
    slaHoursLeft: 42,
    isUrgent: false,
    dossierSummary: "Public objection hearings completed under Section 15 with 94% consensus. Compensation package structured with 100% Solatium Legal Bonus. Ready for final acquisition declaration.",
    dossierSummaryHi: "धारा 15 के तहत 94% सहमति के साथ नागरिक आपत्तियां निस्तारित। 100% कानूनी बोनस के साथ मुआवजा पैकेज तय। अंतिम घोषणा हेतु तैयार।",
    status: "PENDING",
  },
  {
    id: "APPR-2026-004",
    type: "HIGH_VALUE_AWARD",
    title: "High-Value Compensation Award Exceeding ₹10 Cr CALA Limit Approval",
    titleHi: "₹10 करोड़ सीमा से अधिक का उच्च-मूल्य मुआवजा अवार्ड अनुमोदन",
    project: "BMRCL Airport Metro Extension Package 4 (Hebbal-Yelahanka)",
    district: "Bengaluru Rural",
    landAreaHa: 18.5,
    financialOutlayCr: 184.5,
    submittedBy: "Special Land Acquisition Officer (CALA Bengaluru)",
    submittedDate: "28 Aug 2026",
    slaDeadline: "08 Sep 2026",
    slaHoursLeft: -48,
    isUrgent: true,
    dossierSummary: "Commercial parcel acquisition for metro viaduct piers. State Level Screening Committee has vetted circle rates and rural multiplier of 1.5x. Requires Principal Secretary signature.",
    dossierSummaryHi: "मेट्रो वायाडक्ट खंभों हेतु व्यावसायिक भूखंड। राज्य स्तरीय स्क्रीनिंग समिति ने सर्कल दर और 1.5x ग्रामीण गुणक की पुष्टि की है। प्रमुख सचिव के हस्ताक्षर आवश्यक हैं।",
    status: "PENDING",
  },
];

interface StateProject {
  id: string;
  name: string;
  nameHi: string;
  sector: string;
  districts: string;
  targetHa: number;
  acquiredHa: number;
  budgetCr: number;
  disbursedCr: number;
  status: "ACTIVE" | "COMPLETED" | "CRITICAL_REVIEW";
}

const STATE_PROJECTS: StateProject[] = [
  {
    id: "KA-PRJ-001",
    name: "Satellite Town Ring Road (STRR NH-948A)",
    nameHi: "सैटेलाइट टाउन रिंग रोड (एसटीआरआर)",
    sector: "National Highways",
    districts: "Bengaluru Rural, Ramanagara",
    targetHa: 680,
    acquiredHa: 540,
    budgetCr: 2450.0,
    disbursedCr: 2180.0,
    status: "ACTIVE",
  },
  {
    id: "KA-PRJ-002",
    name: "Bengaluru Suburban Railway Corridor 2 (Baiyappanahalli-Chikkabanavara)",
    nameHi: "बेंगलुरु उपनगरीय रेलवे कॉरिडोर 2",
    sector: "Railways & Urban Transit",
    districts: "Bengaluru Urban, Bengaluru Rural",
    targetHa: 195,
    acquiredHa: 172,
    budgetCr: 940.0,
    disbursedCr: 880.0,
    status: "ACTIVE",
  },
  {
    id: "KA-PRJ-003",
    name: "Tumakuru Industrial Node Phase-III (CBIC Node)",
    nameHi: "तुमकुरु औद्योगिक क्षेत्र फेज-III",
    sector: "Industrial Corridor",
    districts: "Tumakuru",
    targetHa: 450,
    acquiredHa: 320,
    budgetCr: 1120.0,
    disbursedCr: 810.0,
    status: "ACTIVE",
  },
  {
    id: "KA-PRJ-004",
    name: "Bengaluru-Chennai Expressway Package 1 & 2",
    nameHi: "बेंगलुरु-चेन्नई एक्सप्रेसवे",
    sector: "Expressways",
    districts: "Bengaluru Rural, Kolar",
    targetHa: 420,
    acquiredHa: 410,
    budgetCr: 1650.0,
    disbursedCr: 1620.0,
    status: "COMPLETED",
  },
  {
    id: "KA-PRJ-005",
    name: "BMRCL Airport Metro Extension (Blue Line Phase 2B)",
    nameHi: "बीएमआरसीएल एयरपोर्ट मेट्रो लाइन",
    sector: "Urban Transit",
    districts: "Bengaluru Rural",
    targetHa: 85,
    acquiredHa: 76,
    budgetCr: 780.0,
    disbursedCr: 695.0,
    status: "ACTIVE",
  },
  {
    id: "KA-PRJ-006",
    name: "Upper Krishna Project Stage-III Irrigation Canal Network",
    nameHi: "अपर कृष्णा परियोजना स्टेज-III नहर",
    sector: "Water & Irrigation",
    districts: "Kalaburagi, Bagalkote",
    targetHa: 520,
    acquiredHa: 310,
    budgetCr: 1890.0,
    disbursedCr: 1120.0,
    status: "CRITICAL_REVIEW",
  },
];

// --- 4 DISTRICT COMPARISON CHART DATASETS ---

const STAGE_DISTRIBUTION_DATA = [
  { name: "Sec 11 Preliminary", nameHi: "धारा 11 प्रारंभिक", count: 8, color: "#3b82f6" },
  { name: "Field Survey & DGPS", nameHi: "सर्वेक्षण एवं सीमांकन", count: 14, color: "#6366f1" },
  { name: "Sec 15 Objections", nameHi: "धारा 15 आपत्तियां", count: 11, color: "#f59e0b" },
  { name: "Sec 19 Declaration", nameHi: "धारा 19 अंतिम घोषणा", count: 6, color: "#ec4899" },
  { name: "Sec 23 Award & Bonus", nameHi: "धारा 23 मुआवजा आदेश", count: 9, color: "#8b5cf6" },
  { name: "Bank Payment (PFMS)", nameHi: "बैंक भुगतान (पीएफएमएस)", count: 5, color: "#10b981" },
  { name: "Physical Possession", nameHi: "भूमि कब्जा हस्तांतरण", count: 4, color: "#059669" },
];

const MONTHLY_TREND_DATA = [
  { month: "Apr 2026", monthHi: "अप्रैल", landHa: 145, amountCr: 380 },
  { month: "May 2026", monthHi: "मई", landHa: 210, amountCr: 540 },
  { month: "Jun 2026", monthHi: "जून", landHa: 280, amountCr: 690 },
  { month: "Jul 2026", monthHi: "जुलाई", landHa: 315, amountCr: 810 },
  { month: "Aug 2026", monthHi: "अगस्त", landHa: 385, amountCr: 980 },
  { month: "Sep 2026", monthHi: "सितंबर", landHa: 440, amountCr: 1120 },
];

const COMPENSATION_DISTRICT_DATA = [
  { district: "Bengaluru Rural", sanctioned: 950, disbursed: 842.5 },
  { district: "Tumakuru", sanctioned: 890, disbursed: 690.0 },
  { district: "Ramanagara", sanctioned: 710, disbursed: 612.4 },
  { district: "Mysuru", sanctioned: 820, disbursed: 710.8 },
  { district: "Mandya", sanctioned: 560, disbursed: 520.0 },
  { district: "Kolar", sanctioned: 340, disbursed: 310.2 },
];

// --- MAIN DASHBOARD CONTENT COMPONENT ---

function StateDashboardContent() {
  const searchParams = useSearchParams();
  const currentTab = searchParams ? searchParams.get("tab") || "overview" : "overview";
  const { lang } = useI18n();
  const isHi = lang === "hi";

  const [approvals, setApprovals] = useState<PendingApproval[]>(INITIAL_APPROVALS);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictMetric>(KARNATAKA_DISTRICTS[0]);
  const [approvalFilter, setApprovalFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Live Backend Data Hook & Mutations
  const { data: stateData } = useStateDashboardQuery();
  const updateApprovalMutation = useUpdateStateApprovalMutation();

  const districtMetrics: DistrictMetric[] = useMemo(() => {
    if (stateData?.districts?.length) {
      return stateData.districts.map((d: any) => ({
        id: d.metric_id,
        name: d.name,
        nameHi: d.name_hi,
        division: d.division,
        dcName: d.dc_name,
        targetHa: Number(d.target_ha),
        acquiredHa: Number(d.acquired_ha),
        completionPct: Number(d.completion_pct),
        activeCases: d.active_cases,
        slaCompliancePct: Number(d.sla_compliance_pct),
        avgDaysToHandover: d.avg_days_to_handover,
        compensationCr: Number(d.compensation_cr),
        bottleneckStage: d.bottleneck_stage,
        bottleneckStageHi: d.bottleneck_stage_hi,
        status: d.status as any,
      }));
    }
    return KARNATAKA_DISTRICTS;
  }, [stateData]);

  const stateProjects: StateProject[] = useMemo(() => {
    if (stateData?.projects?.length) {
      return stateData.projects.map((p: any) => ({
        id: p.id,
        name: p.name,
        nameHi: p.name,
        sector: p.sector,
        districts: "State Infrastructure Hub",
        targetHa: p.targetHa || 450,
        acquiredHa: Math.round((p.targetHa || 450) * 0.8),
        budgetCr: p.budgetCr || 1200,
        disbursedCr: Math.round((p.budgetCr || 1200) * 0.75),
        status: p.status === "COMPLETED" ? "COMPLETED" : "ACTIVE",
      }));
    }
    return STATE_PROJECTS;
  }, [stateData]);

  const compensationDistrictData = useMemo(() => {
    if (districtMetrics.length > 0) {
      return districtMetrics.slice(0, 6).map((d) => ({
        district: d.name,
        sanctioned: Math.round(d.compensationCr * 1.15),
        disbursed: d.compensationCr,
      }));
    }
    return COMPENSATION_DISTRICT_DATA;
  }, [districtMetrics]);

  useEffect(() => {
    if (stateData?.approvals?.length) {
      setApprovals(
        stateData.approvals.map((a: any) => ({
          id: a.approval_id,
          type: a.approval_type,
          title: a.title,
          titleHi: a.title_hi,
          project: a.project,
          district: a.district,
          landAreaHa: Number(a.land_area_ha),
          financialOutlayCr: Number(a.financial_outlay_cr),
          submittedBy: a.submitted_by,
          submittedDate: a.submitted_date,
          slaDeadline: a.sla_deadline,
          slaHoursLeft: a.sla_hours_left,
          isUrgent: a.is_urgent,
          dossierSummary: a.dossier_summary,
          dossierSummaryHi: a.dossier_summary_hi,
          status: a.status,
        }))
      );
    }
    if (districtMetrics.length > 0 && selectedDistrict.id === KARNATAKA_DISTRICTS[0].id) {
      setSelectedDistrict(districtMetrics[0]);
    }
  }, [stateData, districtMetrics, selectedDistrict.id]);

  // Modals state
  const [activeDossier, setActiveDossier] = useState<PendingApproval | null>(null);
  const [approvalModalItem, setApprovalModalItem] = useState<PendingApproval | null>(null);
  const [remarksModalItem, setRemarksModalItem] = useState<PendingApproval | null>(null);
  const [directiveDistrict, setDirectiveDistrict] = useState<DistrictMetric | null>(null);
  const [remarksInput, setRemarksInput] = useState("");
  const [directiveInput, setDirectiveInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleApprove = (id: string) => {
    setIsProcessing(true);
    updateApprovalMutation.mutate(
      { id, status: "APPROVED" },
      {
        onSettled: () => {
          setApprovals((prev) =>
            prev.map((item) => (item.id === id ? { ...item, status: "APPROVED" } : item))
          );
          setIsProcessing(false);
          setApprovalModalItem(null);
          showToast(
            isHi
              ? "सफलतापूर्वक अनुमोदित एवं राज्य राजपत्र हेतु सील किया गया!"
              : "Successfully Approved & Sealed for State Extraordinary Gazette!"
          );
        },
      }
    );
  };

  const handleReturnWithRemarks = (id: string) => {
    if (!remarksInput.trim()) return;
    setIsProcessing(true);
    updateApprovalMutation.mutate(
      { id, status: "RETURNED", remarks: remarksInput },
      {
        onSettled: () => {
          setApprovals((prev) =>
            prev.map((item) => (item.id === id ? { ...item, status: "RETURNED" } : item))
          );
          setIsProcessing(false);
          setRemarksModalItem(null);
          setRemarksInput("");
          showToast(
            isHi
              ? "टिप्पणियों के साथ केस संबंधित जिला कलेक्टर को पुनः भेजा गया।"
              : "Case Dossier returned to District Magistrate & SLAO with executive remarks."
          );
        },
      }
    );
  };

  const handleIssueDirective = (districtName: string) => {
    if (!directiveInput.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setDirectiveDistrict(null);
      setDirectiveInput("");
      showToast(
        isHi
          ? `प्रमुख सचिव निर्देश पत्र ${districtName} जिला प्रशासन को जारी किया गया।`
          : `Official Principal Secretary Directive dispatched to ${districtName} District Administration.`
      );
    }, 1000);
  };

  const filteredApprovals = approvals.filter((appr) => {
    if (approvalFilter !== "ALL" && appr.type !== approvalFilter) return false;
    if (searchQuery) {
      const q = (searchQuery || "").toLowerCase();
      return (
        (appr.title?.toLowerCase() || "").includes(q) ||
        (appr.project?.toLowerCase() || "").includes(q) ||
        (appr.district?.toLowerCase() || "").includes(q) ||
        (appr.id?.toLowerCase() || "").includes(q)
      );
    }
    return true;
  });

  const pendingCount = approvals.filter((a) => a.status === "PENDING").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-[#171716] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-200" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      {/* STATE AUTHORITY OFFICER IDENTITY & AUTHORITY BANNER */}
      <div className="bg-[#fffdf8] text-[#171716] rounded-2xl p-5 sm:p-6 shadow-sm border border-[#d8d3c9]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="bg-[#ef5b2a]/10 text-[#ef5b2a] px-3 py-0.5 rounded-full text-xs font-bold border border-[#ef5b2a]/30 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#ef5b2a]" />
                {isHi ? "राज्य राजस्व प्राधिकरण (मुख्यालय)" : "State Revenue Authority (Apex)"}
              </span>
              <span className="text-xs text-[#68655e] font-semibold">
                {isHi ? "कर्नाटक सरकार • राजस्व विभाग" : "Government of Karnataka • Revenue Department"}
              </span>
              <span className="text-xs text-[#d8d3c9] hidden sm:inline">•</span>
              <span className="text-xs text-[#15803d] font-mono font-bold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#15803d] animate-pulse" />
                {isHi ? "डिजिटल सील: KA-REV-SEC-0019" : "State Digital Seal: KA-REV-SEC-0019"}
              </span>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#171716]">
                {isHi ? "श्री राजेश्वर राव, आईएएस — प्रमुख सचिव (राजस्व)" : "Shri Rajeshwar Rao, IAS — Principal Secretary (Revenue)"}
              </h1>
              <p className="text-xs sm:text-sm text-[#68655e] max-w-3xl pt-0.5">
                {isHi
                  ? "राज्य भर में भूमि अधिग्रहण, प्रारंभिक धारा 11 अधिसूचना, धारा 19 घोषणा, राजपत्र मुद्रण एवं ₹10 करोड़ से अधिक के मुआवजा अवार्ड की सर्वोच्च स्वीकृति पीठ।"
                  : "Apex sanction authority for RFCTLARR Section 11 preliminary notifications, Section 19 final declarations, State Gazette issuances, and high-value awards across 31 districts."}
              </p>
            </div>
          </div>

          {/* Quick Action Pills linking to tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 shrink-0">
            <a
              href="/dashboard/state?tab=approvals"
              className={`px-3 py-2 rounded-xl text-left border transition-all ${
                currentTab === "approvals"
                  ? "bg-amber-400 text-slate-900 border-amber-300 shadow-md font-bold"
                  : "bg-white/10 hover:bg-white/15 text-[#171716] border-[#d8d3c9]"
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-blue-200">
                {isHi ? "लंबित अनुमोदन" : "Pending Approvals"}
              </div>
              <div className="text-sm font-black flex items-center justify-between">
                <span>{pendingCount} {isHi ? "प्रस्ताव" : "Cases"}</span>
                {pendingCount > 0 && (
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </div>
            </a>

            <a
              href="/dashboard/state?tab=districts"
              className={`px-3 py-2 rounded-xl text-left border transition-all ${
                currentTab === "districts" ? "bg-[#ef5b2a]/15 text-[#ef5b2a] border-[#ef5b2a]/40 shadow-[0_0_12px_rgba(245,158,11,0.2)] font-bold"
                  : "bg-white/10 hover:bg-white/15 text-[#171716] border-[#d8d3c9]"
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-blue-200">
                {isHi ? "निगरानी जिले" : "Monitored Districts"}
              </div>
              <div className="text-sm font-black">31 {isHi ? "जिले" : "Districts"}</div>
            </a>

            <a
              href="/dashboard/state?tab=projects"
              className={`px-3 py-2 rounded-xl text-left border transition-all ${
                currentTab === "projects" ? "bg-[#ef5b2a]/15 text-[#ef5b2a] border-[#ef5b2a]/40 shadow-[0_0_12px_rgba(245,158,11,0.2)] font-bold"
                  : "bg-white/10 hover:bg-white/15 text-[#171716] border-[#d8d3c9]"
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-blue-200">
                {isHi ? "राज्य परियोजनाएं" : "State Projects"}
              </div>
              <div className="text-sm font-black">42 {isHi ? "कॉरिडोर" : "Corridors"}</div>
            </a>

            <a
              href="/dashboard/state?tab=reports"
              className={`px-3 py-2 rounded-xl text-left border transition-all ${
                currentTab === "reports" ? "bg-[#ef5b2a]/15 text-[#ef5b2a] border-[#ef5b2a]/40 shadow-[0_0_12px_rgba(245,158,11,0.2)] font-bold"
                  : "bg-white/10 hover:bg-white/15 text-[#171716] border-[#d8d3c9]"
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-blue-200">
                {isHi ? "आधिकारिक रिपोर्ट" : "Cabinet Reports"}
              </div>
              <div className="text-sm font-black flex items-center gap-1">
                <span>PDF & CSV</span>
                <Download className="h-3 w-3" />
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* TAB: STATE DELAY RISK RADAR */}
      {currentTab === "delay-risk" && <RoleBasedDelayIntelligence />}

      {/* TAB 1: OVERVIEW */}
      {currentTab === "overview" && (
        <div className="space-y-6">
          {/* Section 3.1: 6 STATE OVERVIEW METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <StatCard
              title={isHi ? "राज्य में कुल परियोजनाएं" : "Total Projects in State"}
              value="42"
              subtext={isHi ? "6 प्रमुख अवसंरचना क्षेत्र" : "Across 6 Key Infrastructure Sectors"}
              icon={Building}
              variant="amber"
            />
            <StatCard
              title={isHi ? "सक्रिय भूमि केस" : "Active Land Cases"}
              value="57"
              subtext={isHi ? "12 जिलों में प्रक्रियाधीन" : "In Progress across 12 Districts"}
              icon={Layers}
              variant="default"
            />
            <StatCard
              title={isHi ? "पूर्ण अधिग्रहण केस" : "Completed Cases"}
              value="128"
              subtext={isHi ? "कब्जा निर्माण एजेंसी को सौंपा" : "Possession Handed Over"}
              icon={CheckCircle2}
              variant="green"
            />
            <StatCard
              title={isHi ? "कुल वितरित मुआवजा" : "Compensation Disbursed"}
              value="₹ 4,280 Cr"
              subtext={isHi ? "सीधे बैंक खातों में भुगतान" : "Direct Treasury PFMS Transfers"}
              icon={Coins}
              variant="amber"
            />
            <StatCard
              title={isHi ? "समयसीमा अनुपालन दर" : "SLA Compliance Rate"}
              value="88.4%"
              subtext={isHi ? "राष्ट्रीय औसत से +3.2% अधिक" : "+3.2% Above National Average"}
              icon={Clock}
              variant="amber"
            />
            <StatCard
              title={isHi ? "बजट उपयोग प्रतिशत" : "Budget Utilization %"}
              value="91.2%"
              subtext={isHi ? "₹4,690 Cr में से व्यय" : "Disbursed of ₹4,690 Cr Outlay"}
              icon={TrendingUp}
              variant="green"
            />
          </div>

          {/* Section 3.4: 4 DISTRICT COMPARISON CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: District-wise Progress (BarChart) */}
            <Card className="lg:col-span-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>{isHi ? "जिलावार अधिग्रहण प्रगति (हेक्टेयर)" : "District-Wise Land Acquisition Velocity (Ha)"}</span>
                  <Badge variant="civic" className="text-[10px]">
                    {isHi ? "लक्ष्य बनाम कब्जा" : "Target vs Possessed"}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isHi
                    ? "जिलों में अधिसूचित भूमि लक्ष्य बनाम निर्माण एजेंसी को सौंपा गया वास्तविक कब्जा।"
                    : "Notified required land area vs actual physically handed possession."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={districtMetrics.slice(0, 6)} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis dataKey={isHi ? "nameHi" : "name"} tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(val) => [`${val} Ha`, ""]}
                        contentStyle={{ backgroundColor: "#fffdf8", borderColor: "#d8d3c9", borderRadius: "8px", border: "none", color: "#171716", fontSize: "12px" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                      <Bar dataKey="targetHa" name={isHi ? "आवश्यक भूमि (हेक्टेयर)" : "Required Land (Ha)"} fill="#64748b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="acquiredHa" name={isHi ? "हस्तांतरित कब्जा (हेक्टेयर)" : "Possession Handed (Ha)"} fill="#16a34a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 2: Cases by Stage (Pie / Donut Chart) */}
            <Card className="lg:col-span-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>{isHi ? "प्रक्रिया चरणवार सक्रिय केस वितरण" : "Active Land Acquisition Cases by Stage"}</span>
                  <Badge variant="civic" className="text-[10px]">57 {isHi ? "सक्रिय केस" : "Active Cases"}</Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isHi
                    ? "राज्य भर में विभिन्न प्रशासनिक चरणों में लंबित केसों का विभाजन।"
                    : "Breakdown of the 57 active cases across statutory workflow stages."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={STAGE_DISTRIBUTION_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey={isHi ? "nameHi" : "name"}
                      >
                        {STAGE_DISTRIBUTION_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value} ${isHi ? "केस" : "Cases"}`, name]}
                        contentStyle={{ backgroundColor: "#fffdf8", borderColor: "#d8d3c9", borderRadius: "8px", border: "none", color: "#171716", fontSize: "12px" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "10px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 3: Monthly Trend (Line Chart) */}
            <Card className="lg:col-span-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>{isHi ? "मासिक अधिग्रहण एवं मुआवजा वितरण प्रवृत्ति" : "Monthly Acquisition Velocity & Payout Trend"}</span>
                  <span className="text-xs font-semibold text-emerald-600">
                    {isHi ? "लगातार 6 माह में वृद्धि" : "Steady Acceleration (6 Months)"}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isHi
                    ? "प्रत्येक माह में हस्तांतरित भूमि क्षेत्र (हेक्टेयर) तथा संवितरित मुआवजा राशि (₹ करोड़)।"
                    : "Monthly physically transferred land (Ha) vs direct bank disbursement (₹ Cr)."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={MONTHLY_TREND_DATA} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis dataKey={isHi ? "monthHi" : "month"} tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fffdf8", borderColor: "#d8d3c9", borderRadius: "8px", border: "none", color: "#171716", fontSize: "12px" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="landHa"
                        name={isHi ? "भूमि कब्जा (हेक्टेयर)" : "Possession Land (Ha)"}
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="amountCr"
                        name={isHi ? "वितरित राशि (₹ करोड़)" : "Disbursed Outlay (₹ Cr)"}
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 4: Compensation by District (Stacked Bar Chart) */}
            <Card className="lg:col-span-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>{isHi ? "जिलावार मुआवजा: स्वीकृत बनाम वितरित (₹ करोड़)" : "Compensation by District: Budget vs Disbursed (₹ Cr)"}</span>
                  <Badge variant="civic" className="text-[10px]">91.2% {isHi ? "उपयोग" : "Utilized"}</Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isHi
                    ? "राज्य कैबिनेट द्वारा स्वीकृत वित्तीय आवंटन बनाम सीधे किसानों के बैंक खातों में संवितरित राशि।"
                    : "Treasury sanctioned compensation allocation vs direct beneficiary bank disbursements."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={compensationDistrictData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis dataKey="district" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(val) => [`₹ ${val} Cr`, ""]}
                        contentStyle={{ backgroundColor: "#fffdf8", borderColor: "#d8d3c9", borderRadius: "8px", border: "none", color: "#171716", fontSize: "12px" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                      <Bar dataKey="sanctioned" name={isHi ? "स्वीकृत बजट (₹ करोड़)" : "Sanctioned Budget (₹ Cr)"} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="disbursed" name={isHi ? "वितरित राशि (₹ करोड़)" : "Disbursed to Farmers (₹ Cr)"} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Administrative Directives Panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Compass className="h-4 w-4 text-rose-600" />
                <span>{isHi ? "राज्य प्रशासनिक अड़चनें एवं प्रमुख सचिव के उपचारात्मक निर्देश" : "State Administrative Bottlenecks & Executive Directives"}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {isHi
                  ? "भूमिसेतु स्वचालित प्रणाली द्वारा चिह्नित विलंब तथा सुधारात्मक सरकारी कदम।"
                  : "Automated escalation alerts identifying milestone delays and required remedial directives."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#171716]">
                      {isHi ? "धारा 15 नागरिक आपत्तियां लंबित" : "Section 15 Hearing Backlog"}
                    </span>
                    <Badge variant="destructive" className="text-[10px]">
                      +18 {isHi ? "दिन विलंब" : "Days Over SLA"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#68655e]">
                    {isHi ? "प्रभावित जिले:" : "Impacted Districts:"}{" "}
                    <strong className="text-[#171716]">Bengaluru Rural, Chikkaballapura, Dakshina Kannada</strong>
                  </p>
                  <p className="pt-2 border-t border-rose-200 dark:border-rose-900 text-[11px] text-[#ef5b2a] font-medium">
                    {isHi
                      ? "उपचारात्मक कदम: त्वरित सुनवाई हेतु 2 अतिरिक्त विशेष भूमि अधिग्रहण अधिकारी (SLAO) नियुक्त करें।"
                      : "Directive: Depute 2 additional SLAOs for fast-track hearings to eliminate backlog within 10 days."}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#171716]">
                      {isHi ? "भूमि सीमा पैमाइश एवं डीजीपीएस विलंब" : "Boundary DGPS Survey Delays"}
                    </span>
                    <Badge variant="warning" className="text-[10px]">
                      +12 {isHi ? "दिन विलंब" : "Days Over SLA"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#68655e]">
                    {isHi ? "प्रभावित जिले:" : "Impacted Districts:"}{" "}
                    <strong className="text-[#171716]">Tumakuru, Belagavi</strong>
                  </p>
                  <p className="pt-2 border-t border-amber-200 dark:border-amber-900 text-[11px] text-[#ef5b2a] font-medium">
                    {isHi
                      ? "उपचारात्मक कदम: स्थानीय राजस्व अमीनों को भूमिसेतु ऑफलाइन मोबाइल ऐप से सुसज्जित करें।"
                      : "Directive: Issue offline demarcation roving kits to Taluk Amins for same-day digital boundary capture."}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#d8d3c9] bg-[#f4f1ea] dark:bg-blue-950/20 dark:border-blue-900 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#171716]">
                      {isHi ? "बैंक खाता एवं आधार नाम विसंगति" : "Bank Name & Aadhaar Mismatch"}
                    </span>
                    <Badge variant="civic" className="text-[10px]">
                      +5 {isHi ? "दिन" : "Days"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#68655e]">
                    {isHi ? "प्रभावित जिले:" : "Impacted Districts:"}{" "}
                    <strong className="text-[#171716]">Kalaburagi, Mandya</strong>
                  </p>
                  <p className="pt-2 border-t border-[#d8d3c9] dark:border-blue-900 text-[11px] text-[#ef5b2a] font-medium">
                    {isHi
                      ? "उपचारात्मक कदम: एनपीसीआई आधार-ब्रिज से स्वचालित मिलान कर बैंक भुगतान में गति लाएं।"
                      : "Directive: Trigger automated NPCI name-matching adapter to disburse without manual affidavit delays."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: DISTRICT PERFORMANCE & MAP (Section 3.2) */}
      {currentTab === "districts" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#171716] flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span>{isHi ? "कर्नाटक राज्य जिलावार प्रदर्शन नक्शा एवं तुलना" : "Karnataka District Performance Map & Benchmarks"}</span>
              </h2>
              <p className="text-xs text-[#68655e]">
                {isHi
                  ? "राज्य के 31 जिलों में भूमि अधिग्रहण पूर्णता प्रतिशत, समयसीमा अनुपालन और उपचारात्मक हस्तक्षेप।"
                  : "State-wide geographical surveillance of land acquisition progress, SLA ratings, and collector performance."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#68655e]">{isHi ? "संकेत:" : "Legend:"}</span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> &gt;80% {isHi ? "अग्रणी" : "Leading"}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> 65-80% {isHi ? "सामान्य" : "Average"}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-300">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> &lt;65% {isHi ? "हस्तक्षेप आवश्यक" : "Lagging"}
              </span>
            </div>
          </div>

          {/* Interactive District Performance Map Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Visual District Map Selector */}
            <Card className="lg:col-span-7">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>{isHi ? "कर्नाटक जिला मानचित्र ग्रिड" : "Interactive Karnataka District Map Grid"}</span>
                  <span className="text-xs font-normal text-[#68655e]">
                    {isHi ? "विवरण देखने हेतु जिले पर क्लिक करें" : "Click district card to inspect telemetry"}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isHi ? "अधिग्रहण पूर्णता दर अनुसार रंग-कोडेड।" : "Color-coded by land acquisition completion rate."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {districtMetrics.map((dist) => {
                    const isSelected = selectedDistrict.id === dist.id;
                    const statusBg =
                      dist.completionPct >= 80
                        ? "border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-950"
                        : dist.completionPct >= 65
                        ? "border-amber-300 bg-amber-50/50 hover:bg-amber-100/70 text-amber-950"
                        : "border-rose-300 bg-rose-50/50 hover:bg-rose-100/70 text-rose-950";

                    return (
                      <button
                        key={dist.id}
                        type="button"
                        onClick={() => setSelectedDistrict(dist)}
                        className={`p-3 rounded-xl border text-left transition-all ${statusBg} ${
                          isSelected
                            ? "ring-2 ring-blue-600 shadow-lg scale-[1.02]"
                            : "hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs">
                            {isHi ? dist.nameHi : dist.name}
                          </span>
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                              dist.completionPct >= 80
                                ? "bg-emerald-200 text-emerald-900"
                                : dist.completionPct >= 65
                                ? "bg-amber-200 text-amber-900"
                                : "bg-rose-200 text-rose-900"
                            }`}
                          >
                            {dist.completionPct}%
                          </span>
                        </div>
                        <div className="text-[10px] text-[#68655e] flex items-center justify-between">
                          <span>{dist.acquiredHa} / {dist.targetHa} Ha</span>
                          <span>{dist.activeCases} {isHi ? "केस" : "cases"}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Selected District Telemetry Inspector */}
            <Card className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <Badge variant="civic" className="text-[10px]">
                    {selectedDistrict.division}
                  </Badge>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedDistrict.completionPct >= 80
                        ? "bg-emerald-500/10 text-emerald-300"
                        : selectedDistrict.completionPct >= 65
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-500/10 text-rose-300"
                    }`}
                  >
                    {selectedDistrict.status.replace("_", " ")}
                  </span>
                </div>
                <CardTitle className="text-base font-bold pt-1">
                  {isHi ? selectedDistrict.nameHi : selectedDistrict.name} {isHi ? "जिला" : "District"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isHi ? "उपायुक्त एवं जिला दंडाधिकारी:" : "Deputy Commissioner & DM:"}{" "}
                  <strong className="text-[#171716]">{selectedDistrict.dcName}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border text-xs">
                    <span className="text-[10px] text-[#68655e] block">{isHi ? "अधिग्रहित भूमि" : "Acquired Land"}</span>
                    <span className="font-bold text-[#171716] text-sm">
                      {selectedDistrict.acquiredHa} <span className="text-xs font-normal">/ {selectedDistrict.targetHa} Ha</span>
                    </span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border text-xs">
                    <span className="text-[10px] text-[#68655e] block">{isHi ? "समयसीमा अनुपालन" : "SLA Compliance"}</span>
                    <span className="font-bold text-blue-600 text-sm">{selectedDistrict.slaCompliancePct}%</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border text-xs">
                    <span className="text-[10px] text-[#68655e] block">{isHi ? "संवितरित मुआवजा" : "Disbursed Compensation"}</span>
                    <span className="font-bold text-amber-600 text-sm">₹ {selectedDistrict.compensationCr} Cr</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border text-xs">
                    <span className="text-[10px] text-[#68655e] block">{isHi ? "औसत हस्तांतरण समय" : "Avg Handover Days"}</span>
                    <span className="font-bold text-[#171716] text-sm">{selectedDistrict.avgDaysToHandover} {isHi ? "दिन" : "Days"}</span>
                  </div>
                </div>

                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-bold text-[#171716]">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                      {isHi ? "प्राथमिक प्रशासनिक अड़चन" : "Primary Bottleneck Stage"}
                    </span>
                  </div>
                  <p className="text-[#171716] font-semibold">
                    {isHi ? selectedDistrict.bottleneckStageHi : selectedDistrict.bottleneckStage}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setDirectiveDistrict(selectedDistrict)}
                    className="w-full bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm text-xs font-semibold gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{isHi ? "प्रमुख सचिव निर्देश पत्र जारी करें" : "Issue Principal Secretary Directive"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top 5 and Bottom 5 Districts Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 Districts Table */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center justify-between text-emerald-800 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <span>{isHi ? "शीर्ष 5 उत्कृष्ट प्रदर्शन वाले जिले" : "Top 5 Performing Districts"}</span>
                  </span>
                  <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">
                    &gt;80% {isHi ? "प्रगति" : "Complete"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f4f1ea] border-[#d8d3c9]/60 text-[#68655e] font-semibold border-b">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">{isHi ? "जिला" : "District"}</th>
                        <th className="p-3">{isHi ? "पूर्णता %" : "Complete %"}</th>
                        <th className="p-3">{isHi ? "समयसीमा %" : "SLA %"}</th>
                        <th className="p-3">{isHi ? "औसत समय" : "Avg Days"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d8d3c9]/60">
                      {districtMetrics.slice(0, 5).map((d, idx) => (
                        <tr key={d.id} className="hover:bg-[#f4f1ea]/80 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-[#68655e]">{idx + 1}</td>
                          <td className="p-3">
                            <span className="font-bold text-[#171716] block">
                              {isHi ? d.nameHi : d.name}
                            </span>
                            <span className="text-[10px] text-[#68655e]">{d.dcName}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-emerald-600">{d.completionPct}%</span>
                            <span className="text-[10px] text-[#68655e] block">{d.acquiredHa} Ha</span>
                          </td>
                          <td className="p-3 font-semibold text-[#171716]">
                            {d.slaCompliancePct}%
                          </td>
                          <td className="p-3 text-[#68655e] font-mono">
                            {d.avgDaysToHandover}d
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Bottom 5 Districts Table */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center justify-between text-rose-800 dark:text-rose-300">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>{isHi ? "विलंबित 5 जिले — राज्य हस्तक्षेप आवश्यक" : "Bottom 5 Districts Requiring State Intervention"}</span>
                  </span>
                  <Badge variant="outline" className="text-rose-700 border-rose-300 bg-rose-50">
                    &lt;72% {isHi ? "प्रगति" : "Complete"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f4f1ea] border-[#d8d3c9]/60 text-[#68655e] font-semibold border-b">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">{isHi ? "जिला" : "District"}</th>
                        <th className="p-3">{isHi ? "अड़चन चरण" : "Bottleneck"}</th>
                        <th className="p-3">{isHi ? "पूर्णता %" : "Complete %"}</th>
                        <th className="p-3">{isHi ? "कार्रवाई" : "Action"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d8d3c9]/60">
                      {districtMetrics.slice(5, 10).map((d, idx) => (
                        <tr key={d.id} className="hover:bg-[#f4f1ea]/80 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-[#68655e]">{idx + 6}</td>
                          <td className="p-3">
                            <span className="font-bold text-[#171716] block">
                              {isHi ? d.nameHi : d.name}
                            </span>
                            <span className="text-[10px] text-[#68655e]">{d.dcName}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-rose-600 font-semibold block line-clamp-1">
                              {isHi ? d.bottleneckStageHi : d.bottleneckStage}
                            </span>
                            <span className="text-[10px] text-[#68655e]">{d.avgDaysToHandover} {isHi ? "दिन औसत" : "days avg"}</span>
                          </td>
                          <td className="p-3 font-bold text-[#171716]">
                            {d.completionPct}%
                          </td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDirectiveDistrict(d)}
                              className="h-7 px-2 text-[10px] font-bold text-rose-700 border-rose-300 hover:bg-rose-50 gap-1"
                            >
                              <span>{isHi ? "निर्देश भेजें" : "Directive"}</span>
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: PENDING APPROVALS QUEUE (Section 3.3) */}
      {currentTab === "approvals" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fffdf8] border-[#d8d3c9] p-4 rounded-xl border">
            <div>
              <h2 className="text-base font-bold text-[#171716] flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <span>{isHi ? "राज्य अनुमोदन प्रतीक्षा सूची (समयसीमा संचालित)" : "State Approvals Pending Queue (SLA Governed)"}</span>
              </h2>
              <p className="text-xs text-[#68655e]">
                {isHi
                  ? "परियोजना प्रस्ताव, प्रारंभिक धारा 11 अधिसूचनाएं, धारा 19 अंतिम घोषणाएं एवं ₹10 करोड़ से अधिक के उच्च-मूल्य अवार्ड।"
                  : "Statutory queue requiring Principal Secretary review, gazette sealing, or return with directives."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-[#68655e]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isHi ? "केस या परियोजना खोजें..." : "Search case or corridor..."}
                  className="h-8 pl-8 text-xs w-48"
                />
              </div>

              <select
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm font-semibold"
              >
                <option value="ALL">{isHi ? "सभी प्रकार" : "All Approval Types"}</option>
                <option value="PROPOSAL">{isHi ? "परियोजना प्रस्ताव" : "Project Proposals"}</option>
                <option value="DRAFT_NOTIFICATION">{isHi ? "प्रारंभिक धारा 11" : "Draft Notifications (Sec 11)"}</option>
                <option value="FINAL_DECLARATION">{isHi ? "अंतिम धारा 19" : "Final Declarations (Sec 19)"}</option>
                <option value="HIGH_VALUE_AWARD">{isHi ? "उच्च-मूल्य अवार्ड (>10 Cr)" : "High-Value Awards (>₹10 Cr)"}</option>
              </select>
            </div>
          </div>

          {/* Approvals Task List */}
          <div className="space-y-3">
            {filteredApprovals.length === 0 ? (
              <EmptyState>
                {isHi ? "कोई लंबित अनुमोदन नहीं मिला।" : "No pending approvals found matching filter criteria."}
              </EmptyState>
            ) : (
              filteredApprovals.map((appr) => {
                const isApproved = appr.status === "APPROVED";
                const isReturned = appr.status === "RETURNED";

                return (
                  <div
                    key={appr.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isApproved
                        ? "bg-emerald-50/50 border-emerald-300 dark:bg-emerald-950/20"
                        : isReturned
                        ? "bg-slate-100/70 border-slate-300 dark:bg-slate-800/40 opacity-75"
                        : appr.isUrgent
                        ? "bg-amber-50/40 border-amber-300 dark:bg-amber-950/20 shadow-sm"
                        : "bg-[#fffdf8] border-[#d8d3c9] border-[#d8d3c9]"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Metadata & Titles */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#ef5b2a] bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                            {appr.id}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              appr.type === "HIGH_VALUE_AWARD"
                                ? "bg-purple-500/10 text-purple-300"
                                : appr.type === "DRAFT_NOTIFICATION"
                                ? "bg-[#ef5b2a]/10 text-[#ef5b2a]"
                                : appr.type === "FINAL_DECLARATION"
                                ? "bg-emerald-500/10 text-emerald-300"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {appr.type.replace("_", " ")}
                          </span>
                          <span className="text-xs text-[#68655e] font-medium">
                            {isHi ? "जिला:" : "District:"} <strong>{appr.district}</strong>
                          </span>

                          {/* SLA Timer Badge */}
                          {appr.status === "PENDING" && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                appr.slaHoursLeft < 0
                                  ? "bg-rose-600 text-[#171716] animate-pulse"
                                  : appr.slaHoursLeft <= 24
                                  ? "bg-amber-500 text-[#171716]"
                                  : "bg-[#ef5b2a]/10 text-[#ef5b2a]"
                              }`}
                            >
                              <Clock className="h-3 w-3" />
                              {appr.slaHoursLeft < 0
                                ? `${Math.abs(appr.slaHoursLeft)}h ${isHi ? "समयसीमा पार (अति आवश्यक)" : "OVERDUE"}`
                                : `${appr.slaHoursLeft}h ${isHi ? "शेष" : "remaining"}`}
                            </span>
                          )}

                          {isApproved && (
                            <span className="bg-emerald-600 text-[#171716] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              {isHi ? "राज्य अनुमोदित" : "STATE APPROVED & SEALED"}
                            </span>
                          )}

                          {isReturned && (
                            <span className="bg-slate-600 text-[#171716] text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {isHi ? "टिप्पणियों सहित वापस" : "RETURNED WITH REMARKS"}
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-[#171716]">
                            {isHi ? appr.titleHi : appr.title}
                          </h3>
                          <p className="text-xs text-[#ef5b2a] font-semibold">
                            {appr.project}
                          </p>
                        </div>

                        <p className="text-xs text-[#68655e] line-clamp-2">
                          {isHi ? appr.dossierSummaryHi : appr.dossierSummary}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#68655e] pt-1">
                          <span>
                            {isHi ? "अधिसूचित क्षेत्र:" : "Land Area:"}{" "}
                            <strong className="text-[#171716]">{appr.landAreaHa} Ha</strong>
                          </span>
                          <span>•</span>
                          <span>
                            {isHi ? "वित्तीय प्रावधान:" : "Financial Outlay:"}{" "}
                            <strong className="text-[#171716]">₹ {appr.financialOutlayCr} Cr</strong>
                          </span>
                          <span>•</span>
                          <span>
                            {isHi ? "प्रस्तुतकर्ता:" : "Submitted By:"}{" "}
                            <span className="text-[#171716]">{appr.submittedBy}</span>
                          </span>
                        </div>
                      </div>

                      {/* Right: Action Buttons */}
                      <div className="flex flex-row lg:flex-col items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveDossier(appr)}
                          className="text-xs font-semibold h-8 px-3 gap-1.5 border-[#d8d3c9]"
                        >
                          <Eye className="h-3.5 w-3.5 text-blue-600" />
                          <span>{isHi ? "दस्तावेज़ देखें" : "Review Dossier"}</span>
                        </Button>

                        {appr.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => setApprovalModalItem(appr)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-[#171716] text-xs font-bold h-8 px-3 gap-1.5 shadow-sm"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>{isHi ? "अनुमोदन एवं सील" : "Approve & Seal"}</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setRemarksModalItem(appr)}
                              className="text-xs text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-8 px-2.5"
                            >
                              <span>{isHi ? "टिप्पणी सहित वापस" : "Return with Remarks"}</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PROJECTS IN STATE */}
      {currentTab === "projects" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fffdf8] border-[#d8d3c9] p-4 rounded-xl border">
            <div>
              <h2 className="text-base font-bold text-[#171716] flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                <span>{isHi ? "कर्नाटक राज्य अवसंरचना परियोजनाएं (42 कॉरिडोर)" : "Karnataka State Infrastructure Corridors (42 Projects)"}</span>
              </h2>
              <p className="text-xs text-[#68655e]">
                {isHi
                  ? "राष्ट्रीय राजमार्ग, उपनगरीय मेट्रो, औद्योगिक स्मार्ट नोड तथा सिंचाई नहर नेटवर्क का व्यापक विवरण।"
                  : "Multi-sectoral infrastructure portfolio under RFCTLARR statutory execution across Karnataka."}
              </p>
            </div>
            <a
              href="/projects"
              className="text-xs font-bold text-[#ef5b2a] hover:underline flex items-center gap-1"
            >
              <span>{isHi ? "पूर्ण परियोजना डेटाबेस" : "Open Full Project Directory"}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stateProjects.map((prj) => {
              const progressPct = Math.round((prj.acquiredHa / prj.targetHa) * 100);
              return (
                <Card key={prj.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#68655e]">{prj.id}</span>
                      <Badge
                        variant={
                          prj.status === "COMPLETED"
                            ? "success"
                            : prj.status === "CRITICAL_REVIEW"
                            ? "destructive"
                            : "civic"
                        }
                        className="text-[10px]"
                      >
                        {prj.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-bold pt-1">
                      {isHi ? prj.nameHi : prj.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {prj.sector} • {prj.districts}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[#68655e]">{isHi ? "कब्जा प्रगति:" : "Possession Progress:"}</span>
                        <span className="font-bold text-blue-700">{progressPct}%</span>
                      </div>
                      <div className="w-full bg-[#f4f1ea] rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            progressPct >= 90
                              ? "bg-emerald-600"
                              : progressPct >= 70
                              ? "bg-blue-600"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#68655e] mt-1">
                        <span>{prj.acquiredHa} Ha {isHi ? "हस्तांतरित" : "Handed"}</span>
                        <span>{prj.targetHa} Ha {isHi ? "लक्ष्य" : "Target"}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-[#68655e] block">{isHi ? "स्वीकृत बजट" : "Budget Outlay"}</span>
                        <span className="font-bold text-[#171716]">₹ {prj.budgetCr} Cr</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#68655e] block">{isHi ? "संवितरित" : "Disbursed"}</span>
                        <span className="font-bold text-emerald-600">₹ {prj.disbursedCr} Cr</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: STATE REPORTS & CABINET ORDERS */}
      {currentTab === "reports" && (
        <div className="space-y-6">
          <div className="bg-[#fffdf8] border-[#d8d3c9] p-5 rounded-2xl border space-y-1">
            <h2 className="text-lg font-bold text-[#171716] flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              <span>{isHi ? "आधिकारिक राज्य रिपोर्ट एवं कैबिनेट ज्ञापन डाउनलोड" : "Official State Reports & Cabinet Memorandums"}</span>
            </h2>
            <p className="text-xs text-[#68655e]">
              {isHi
                ? "राज्य कैबिनेट बैठकों तथा वैधानिक अभिलेख हेतु 1-क्लिक अधिकृत पीडीएफ एवं संपूर्ण सीएसवी डेटा निर्यात।"
                : "One-click generation of digitally authenticated executive PDF reports and raw CSV land datasets."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Report 1: State Cabinet Memorandum PDF */}
            <Card className="hover:border-[#d8d3c9] transition-colors">
              <CardHeader className="pb-3">
                <Badge variant="civic" className="w-fit text-[10px]">
                  {isHi ? "कैबिनेट दस्तावेज़ (PDF)" : "Cabinet Memo (PDF)"}
                </Badge>
                <CardTitle className="text-base font-bold pt-1">
                  {isHi ? "राज्य कैबिनेट त्रैमासिक भूमि अधिग्रहण प्रगति ज्ञापन" : "State Cabinet Land Acquisition Progress Memorandum"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isHi
                    ? "समस्त 31 जिलों के आंकड़े, बजट व्यय, धारा 11 एवं 19 की स्थिति तथा प्रमुख सचिव का वैधानिक प्रमाणीकरण।"
                    : "Comprehensive state review of all 31 districts, financial outlays, gazette status, and executive seals."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  onClick={() =>
                    generateStateAuthorityPdf({
                      reportTitle: "State Cabinet Quarterly Land Acquisition Progress Memorandum",
                      stateName: "Karnataka",
                      principalSecretary: "Shri Rajeshwar Rao, IAS",
                      totalProjects: 42,
                      activeCases: 57,
                      completedCases: 128,
                      compensationDisbursed: "Rs 4,280 Cr",
                      slaRate: "88.4%",
                      budgetUtilization: "91.2%",
                    })
                  }
                  className="w-full bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm text-xs font-bold gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>{isHi ? "कैबिनेट ज्ञापन डाउनलोड करें (PDF)" : "Download Cabinet Memo (PDF)"}</span>
                </Button>
              </CardContent>
            </Card>

            {/* Report 2: District SLA Benchmark Report */}
            <Card className="hover:border-[#d8d3c9] transition-colors">
              <CardHeader className="pb-3">
                <Badge variant="warning" className="w-fit text-[10px]">
                  {isHi ? "प्रदर्शन विश्लेषण (PDF)" : "District SLA Benchmark (PDF)"}
                </Badge>
                <CardTitle className="text-base font-bold pt-1">
                  {isHi ? "जिलावार समयसीमा एवं अड़चन निदान रिपोर्ट" : "District-Wise SLA Compliance & Remedial Report"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isHi
                    ? "शीर्ष एवं विलंबित जिलों की तुलना, चरणवार समय विश्लेषण तथा उपचारात्मक प्रशासनिक निर्देश।"
                    : "Benchmarking of top and lagging districts, milestone days analysis, and fast-track hearing orders."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  onClick={() =>
                    generateStateAuthorityPdf({
                      reportTitle: "District SLA Compliance & Remedial Intervention Report",
                      stateName: "Karnataka",
                      principalSecretary: "Shri Rajeshwar Rao, IAS",
                      totalProjects: 42,
                      activeCases: 57,
                      compensationDisbursed: "Rs 4,280 Cr",
                      slaRate: "88.4%",
                    })
                  }
                  variant="outline"
                  className="w-full text-xs font-bold gap-2 border-[#d8d3c9] hover:bg-[#f4f1ea]"
                >
                  <Download className="h-4 w-4 text-blue-600" />
                  <span>{isHi ? "जिला विश्लेषण डाउनलोड करें (PDF)" : "Download SLA Analysis (PDF)"}</span>
                </Button>
              </CardContent>
            </Card>

            {/* Report 3: Full CSV Data Export */}
            <Card className="hover:border-[#d8d3c9] transition-colors">
              <CardHeader className="pb-3">
                <Badge variant="outline" className="w-fit text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50">
                  {isHi ? "कच्चा डेटा (CSV)" : "Master Raw Data (CSV)"}
                </Badge>
                <CardTitle className="text-base font-bold pt-1">
                  {isHi ? "राज्य भर के 1,240 भूखंड एवं मुआवजा डेटा" : "State-Wide 1,240 Parcels & Compensation Ledger"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isHi
                    ? "14-अंकीय भू-आधार (ULPIN), किसान का नाम, क्षेत्रफल, सर्कल दर, कानूनी बोनस एवं बैंक स्थिति।"
                    : "Complete tabular dump including 14-digit ULPINs, owners, survey numbers, solatium, and PFMS ref."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  onClick={() => {
                    const csvRows = [
                      "ULPIN,District,Taluk,Project,Land_Type,Area_Ha,Base_Value_Cr,Solatium_100_Cr,Total_Award_Cr,PFMS_Status",
                      ...districtMetrics.map(
                        (d, i) =>
                          `KA-${d.id}-2026-00${i + 1},${d.name},Taluk-1,STRR-Corridor,Agricultural,${(d.targetHa / 10).toFixed(1)},1.20,1.20,2.64,DISBURSED`
                      ),
                    ];
                    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "karnataka_state_land_acquisition_master_2026.csv";
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast(isHi ? "सीएसवी फाइल सफलतापूर्वक डाउनलोड हुई!" : "Master CSV dataset downloaded successfully!");
                  }}
                  variant="outline"
                  className="w-full text-xs font-bold gap-2 border-[#d8d3c9] hover:bg-[#f4f1ea]"
                >
                  <Download className="h-4 w-4 text-emerald-600" />
                  <span>{isHi ? "सीएसवी निर्यात करें (1,240 भूखंड)" : "Export Master CSV (1,240 Plots)"}</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* --- INTERACTIVE MODAL 1: REVIEW DOSSIER --- */}
      {activeDossier && (
        <div className="fixed inset-0 z-50 bg-[#fffdf8]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fffdf8] border-[#d8d3c9] rounded-2xl max-w-2xl w-full border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#fffdf8] text-[#171716] p-5 flex items-center justify-between border-b border-[#d8d3c9]">
              <div>
                <span className="text-[10px] font-mono text-blue-300 font-bold">{activeDossier.id}</span>
                <h3 className="text-base font-bold">
                  {isHi ? activeDossier.titleHi : activeDossier.title}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveDossier(null)}
                className="text-[#68655e] hover:text-[#171716] h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#f4f1ea] border-[#d8d3c9]/50 rounded-xl border">
                <div>
                  <span className="text-[10px] text-[#68655e] block">{isHi ? "परियोजना:" : "Project Corridor:"}</span>
                  <span className="font-bold text-[#171716]">{activeDossier.project}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#68655e] block">{isHi ? "संबंधित जिला:" : "Jurisdiction District:"}</span>
                  <span className="font-bold text-[#171716]">{activeDossier.district}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#68655e] block">{isHi ? "अधिसूचित भूमि क्षेत्र:" : "Notified Land Area:"}</span>
                  <span className="font-bold text-emerald-600">{activeDossier.landAreaHa} Hectares</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#68655e] block">{isHi ? "वित्तीय प्रावधान:" : "Financial Provision:"}</span>
                  <span className="font-bold text-amber-600">₹ {activeDossier.financialOutlayCr} Cr</span>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-[#171716]">
                  {isHi ? "विस्तृत प्रशासनिक एवं वैधानिक सारांश:" : "Executive & Statutory Review Summary:"}
                </h4>
                <p className="text-[#171716] leading-relaxed">
                  {isHi ? activeDossier.dossierSummaryHi : activeDossier.dossierSummary}
                </p>
              </div>

              <div className="p-3 bg-[#ef5b2a]/10 dark:bg-blue-950/30 rounded-xl border border-[#d8d3c9] dark:border-blue-900 space-y-1">
                <span className="font-bold text-blue-950 dark:text-blue-200">
                  {isHi ? "प्रस्तुतीकरण एवं सत्यापन विवरण:" : "Submission & Telemetry Record:"}
                </span>
                <div className="text-[11px] text-[#68655e] space-y-0.5">
                  <p>• {isHi ? "प्रस्तुतकर्ता:" : "Submitted By:"} {activeDossier.submittedBy}</p>
                  <p>• {isHi ? "प्रस्तुति तिथि:" : "Submission Date:"} {activeDossier.submittedDate}</p>
                  <p>• {isHi ? "वैधानिक समयसीमा:" : "Statutory SLA Limit:"} {activeDossier.slaDeadline} ({activeDossier.slaHoursLeft}h)</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#f4f1ea] border-[#d8d3c9]/40 border-t flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveDossier(null)}
                className="text-xs"
              >
                {isHi ? "बंद करें" : "Close"}
              </Button>

              {activeDossier.status === "PENDING" && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRemarksModalItem(activeDossier);
                      setActiveDossier(null);
                    }}
                    className="text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
                  >
                    {isHi ? "टिप्पणी सहित वापस" : "Return with Remarks"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setApprovalModalItem(activeDossier);
                      setActiveDossier(null);
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-[#171716] text-xs font-bold"
                  >
                    {isHi ? "अनुमोदन करें" : "Approve Proposal"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- INTERACTIVE MODAL 2: STATE APPROVAL & GAZETTE SEAL --- */}
      {approvalModalItem && (
        <div className="fixed inset-0 z-50 bg-[#fffdf8]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fffdf8] border-[#d8d3c9] rounded-2xl max-w-lg w-full border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-emerald-900 text-[#171716] p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                <h3 className="text-base font-bold">
                  {isHi ? "राज्य असाधारण राजपत्र अनुमोदन एवं सील" : "State Gazette Approval & Electronic Seal"}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setApprovalModalItem(null)}
                className="text-emerald-300 hover:text-[#171716] h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-[#171716]">
                {isHi
                  ? "आप निम्नलिखित वैधानिक अधिसूचना को कर्नाटक राज्य असाधारण राजपत्र में प्रकाशन हेतु औपचारिक रूप से अनुमोदित एवं सील करने जा रहे हैं:"
                  : "You are about to formally ratify and electronically seal the following statutory requisition for publication in the Karnataka Extraordinary Gazette:"}
              </p>

              <div className="p-3 bg-[#f4f1ea] border-[#d8d3c9] rounded-xl border space-y-1">
                <p className="font-bold text-[#171716]">
                  {isHi ? approvalModalItem.titleHi : approvalModalItem.title}
                </p>
                <p className="text-[#68655e]">{approvalModalItem.project} • {approvalModalItem.district}</p>
                <p className="font-semibold text-emerald-700">
                  {approvalModalItem.landAreaHa} Ha • ₹ {approvalModalItem.financialOutlayCr} Cr
                </p>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-300 space-y-1 text-emerald-900 dark:text-emerald-200">
                <span className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {isHi ? "सत्यापित प्राधिकार:" : "Authorized Electronic Sign-off:"}
                </span>
                <p className="text-[11px]">
                  {isHi ? "हस्ताक्षरकर्ता: श्री राजेश्वर राव, आईएएस — प्रमुख सचिव (राजस्व)" : "Signatory: Shri Rajeshwar Rao, IAS — Principal Secretary (Revenue)"}
                </p>
                <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300">
                  State Digital Seal: KA-REV-SEC-0019 (Admissible under Section 65B IT Act)
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#f4f1ea] border-[#d8d3c9]/40 border-t flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApprovalModalItem(null)}
                disabled={isProcessing}
                className="text-xs"
              >
                {isHi ? "रद्द करें" : "Cancel"}
              </Button>
              <Button
                size="sm"
                onClick={() => handleApprove(approvalModalItem.id)}
                disabled={isProcessing}
                className="bg-emerald-700 hover:bg-emerald-800 text-[#171716] text-xs font-bold gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>{isHi ? "सील किया जा रहा है..." : "Sealing & Notifying..."}</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>{isHi ? "अनुमोदित एवं राजपत्र सील करें" : "Confirm Approval & Seal Gazette"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- INTERACTIVE MODAL 3: RETURN WITH REMARKS --- */}
      {remarksModalItem && (
        <div className="fixed inset-0 z-50 bg-[#fffdf8]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fffdf8] border-[#d8d3c9] rounded-2xl max-w-lg w-full border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-rose-900 text-[#171716] p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-300" />
                <h3 className="text-base font-bold">
                  {isHi ? "टिप्पणियों सहित केस पुनः जिला कलेक्टर को भेजें" : "Return Dossier to District Magistrate with Remarks"}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRemarksModalItem(null)}
                className="text-rose-300 hover:text-[#171716] h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-[#171716]">
                {isHi
                  ? "कृपया जिला कलेक्टर एवं विशेष भूमि अधिग्रहण अधिकारी (SLAO) को सुधारात्मक निर्देश दर्ज करें:"
                  : "Specify mandatory rectifications or discrepancies required before state gazette clearance:"}
              </p>

              <div className="p-3 bg-[#f4f1ea] border-[#d8d3c9] rounded-xl border text-xs">
                <span className="font-bold text-[#171716]">
                  {isHi ? remarksModalItem.titleHi : remarksModalItem.title}
                </span>
                <p className="text-[#68655e]">{remarksModalItem.district} • {remarksModalItem.submittedBy}</p>
              </div>

              <div>
                <label className="font-bold text-[#171716] block mb-1">
                  {isHi ? "प्रमुख सचिव की आधिकारिक टिप्पणियां / निर्देश:" : "Principal Secretary Directive & Observations:"}
                </label>
                <Textarea
                  value={remarksInput}
                  onChange={(e) => setRemarksInput(e.target.value)}
                  placeholder={
                    isHi
                      ? "उदाहरण: संयुक्त पैमाइश में 12 भूखंडों के खसरा मिलान में विसंगति पाई गई है। 7 दिनों के भीतर पुनः जांच कर प्रस्तुत करें..."
                      : "e.g., Discrepancy noted in circle rate multiplier and 12 plot survey numbers. Resubmit with rectified joint demarcation report within 7 days..."
                  }
                  rows={4}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="p-4 bg-[#f4f1ea] border-[#d8d3c9]/40 border-t flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRemarksModalItem(null)}
                disabled={isProcessing}
                className="text-xs"
              >
                {isHi ? "रद्द करें" : "Cancel"}
              </Button>
              <Button
                size="sm"
                onClick={() => handleReturnWithRemarks(remarksModalItem.id)}
                disabled={isProcessing || !remarksInput.trim()}
                className="bg-rose-700 hover:bg-rose-800 text-[#171716] text-xs font-bold gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>{isHi ? "प्रेषित हो रहा है..." : "Dispatching..."}</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>{isHi ? "निर्देश भेजें" : "Dispatch Directive"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- INTERACTIVE MODAL 4: ISSUE DIRECTIVE TO DISTRICT --- */}
      {directiveDistrict && (
        <div className="fixed inset-0 z-50 bg-[#fffdf8]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fffdf8] border-[#d8d3c9] rounded-2xl max-w-lg w-full border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-blue-900 text-[#171716] p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-300" />
                <h3 className="text-base font-bold">
                  {isHi ? "जिला कलेक्टर को प्रमुख सचिव निर्देश जारी करें" : "Issue Principal Secretary Directive to District"}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDirectiveDistrict(null)}
                className="text-blue-300 hover:text-[#171716] h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-[#f4f1ea] border-[#d8d3c9] rounded-xl border">
                <span className="text-[10px] text-[#68655e] block">{isHi ? "लक्षित जिला एवं अधिकारी:" : "Target District & Officer:"}</span>
                <span className="font-bold text-[#171716] text-sm">
                  {directiveDistrict.name} — {directiveDistrict.dcName}
                </span>
                <p className="text-rose-600 font-semibold pt-1">
                  {isHi ? "पहचानी गई अड़चन:" : "Identified Bottleneck:"}{" "}
                  {isHi ? directiveDistrict.bottleneckStageHi : directiveDistrict.bottleneckStage}
                </p>
              </div>

              <div>
                <label className="font-bold text-[#171716] block mb-1">
                  {isHi ? "आधिकारिक सरकारी निर्देश पत्र:" : "Official Ministerial Directive:"}
                </label>
                <Textarea
                  value={directiveInput}
                  onChange={(e) => setDirectiveInput(e.target.value)}
                  placeholder={
                    isHi
                      ? "उदाहरण: धारा 15 की आपत्तियों के त्वरित निस्तारण हेतु कैंप कोर्ट आयोजित करें तथा 10 दिनों में अनुपालन रिपोर्ट प्रस्तुत करें..."
                      : "e.g., You are hereby directed to schedule special daily Taluk hearings to clear all pending Section 15 representations within 10 days..."
                  }
                  rows={4}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="p-4 bg-[#f4f1ea] border-[#d8d3c9]/40 border-t flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDirectiveDistrict(null)}
                disabled={isProcessing}
                className="text-xs"
              >
                {isHi ? "रद्द करें" : "Cancel"}
              </Button>
              <Button
                size="sm"
                onClick={() => handleIssueDirective(directiveDistrict.name)}
                disabled={isProcessing || !directiveInput.trim()}
                className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm text-xs font-bold gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>{isHi ? "भेजा जा रहा है..." : "Sending..."}</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>{isHi ? "आदेश प्रेषित करें" : "Transmit Executive Order"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper for search params
export default function StateDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-12 text-center text-xs text-[#68655e]">
          Loading State Revenue Authority Console...
        </div>
      }
    >
      <StateDashboardContent />
    </Suspense>
  );
}
