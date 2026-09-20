"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { StatCard } from "@/components/common/stat-card";
import { RoleBasedDelayIntelligence } from "@/components/ai/role-based-delay-intelligence";
import { EmptyState } from "@/components/common/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  Lock,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Scale,
  ArrowUpRight,
  Fingerprint,
  Search,
  Filter,
  Eye,
  FolderOpen,
  Coins,
  MapPin,
  Clock,
  Calendar,
  Layers,
  Send,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  Building,
  Info,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { downloadAuditorComplianceReportPdf } from "@/lib/pdf-generator";
import { useAuditorAnomaliesQuery, useUpdateAnomalyStatusMutation } from "@/hooks/queries/use-bhoomi-queries";

// --- MOCK DATA FOR AUDITOR CONSOLE ---

interface AnomalyItem {
  id: string;
  title: string;
  titleHi: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  caseRef: string;
  parcelUlpin: string;
  district: string;
  districtHi: string;
  calculatedValue: string;
  districtAvg: string;
  varianceRatio: string;
  varianceRatioHi: string;
  statute: string;
  statuteHi: string;
  details: string;
  detailsHi: string;
  flagDate: string;
  flagDateHi: string;
  status: "OPEN" | "UNDER_REVIEW" | "NOTICE_ISSUED";
}

const INITIAL_ANOMALIES: AnomalyItem[] = [
  {
    id: "ANOM-001",
    title: "Compensation > 3.2x District Average (Inflated Base Rate)",
    titleHi: "मुआवजा > 3.2 गुना जिला औसत (अत्यधिक आधार दर)",
    severity: "CRITICAL",
    caseRef: "AC-2026-KA-001234",
    parcelUlpin: "KA-BLR-2026-0041",
    district: "Bengaluru Rural (Doddaballapur)",
    districtHi: "बेंगलुरु ग्रामीण (दोड्डबल्लापुर)",
    calculatedValue: "₹ 1,85,00,000",
    districtAvg: "₹ 57,80,000",
    varianceRatio: "+320% (3.2x)",
    varianceRatioHi: "+320% (3.2 गुना)",
    statute: "RFCTLARR Act 2013 Section 26(1) (Circle Rate Guidance)",
    statuteHi: "आरएफसीटीएलएआरआर अधिनियम 2013 धारा 26(1) (सर्किल दर दिशानिर्देश)",
    details: "Base market rate assessed at ₹4,800/sq.m vs prevailing circle rate benchmark of ₹1,500/sq.m without land conversion documentation.",
    detailsHi: "भूमि रूपांतरण दस्तावेज़ के बिना ₹1,500/वर्ग मी. के सर्किल दर बेंचमार्क के मुकाबले ₹4,800/वर्ग मी. पर आधार बाजार दर आंकी गई।",
    flagDate: "09 Sep 2026",
    flagDateHi: "09 सित 2026",
    status: "OPEN",
  },
  {
    id: "ANOM-002",
    title: "Public Objection Overdue Beyond 60-Day Statutory SLA",
    titleHi: "सार्वजनिक आपत्ति 60-दिवसीय वैधानिक एसएलए से अधिक लंबित",
    severity: "HIGH",
    caseRef: "LAC/2026/STRR/KA-042",
    parcelUlpin: "KA-RAM-2026-0118",
    district: "Ramanagara (Channapatna)",
    districtHi: "रामनगर (चन्नापट्टण)",
    calculatedValue: "₹ 74,50,000",
    districtAvg: "₹ 70,00,000",
    varianceRatio: "78 Days (18d breach)",
    varianceRatioHi: "78 दिन (18 दिन का उल्लंघन)",
    statute: "RFCTLARR Section 15(2) Inquiry Statutory SLA Limit",
    statuteHi: "आरएफसीटीएलएआरआर धारा 15(2) जांच वैधानिक एसएलए सीमा",
    details: "Section 15 objection filed by 14 landholders pending 78 days without Sub-Divisional Magistrate inquiry report or extension order.",
    detailsHi: "14 भूमिधारकों द्वारा दायर धारा 15 की आपत्ति उप-विभागीय मजिस्ट्रेट की जांच रिपोर्ट या विस्तार आदेश के बिना 78 दिनों से लंबित है।",
    flagDate: "07 Sep 2026",
    flagDateHi: "07 सित 2026",
    status: "NOTICE_ISSUED",
  },
  {
    id: "ANOM-003",
    title: "Missing Mandatory Joint Field Boundary Photos",
    titleHi: "अनिवार्य संयुक्त क्षेत्र सीमा तस्वीरें अनुपलब्ध",
    severity: "MEDIUM",
    caseRef: "LAC/2026/WDFC/RAJ-108",
    parcelUlpin: "RJ-JAI-2026-0891",
    district: "Jaipur Rural",
    districtHi: "जयपुर ग्रामीण",
    calculatedValue: "₹ 1,12,00,000",
    districtAvg: "₹ 1,05,00,000",
    varianceRatio: "0 of 4 Corner Photos",
    varianceRatioHi: "4 में से 0 कोने की तस्वीरें",
    statute: "Cadastral Survey & Demarcation Rule 7(a)",
    statuteHi: "भू-कर सर्वेक्षण एवं सीमांकन नियम 7(क)",
    details: "Differential GPS coordinates recorded on field PWA, but zero corner photographs or Panchanama signatures attached to record.",
    detailsHi: "फील्ड PWA पर विभेदक जीपीएस निर्देशांक दर्ज किए गए हैं, लेकिन रिकॉर्ड में शून्य कोने की तस्वीरें या पंचनामा हस्ताक्षर संलग्न हैं।",
    flagDate: "08 Sep 2026",
    flagDateHi: "08 सित 2026",
    status: "OPEN",
  },
  {
    id: "ANOM-004",
    title: "Duplicate Beneficiary PFMS Reference Detected",
    titleHi: "समान लाभार्थी पीएफएमएस संदर्भ (डुप्लिकेट) पाया गया",
    severity: "CRITICAL",
    caseRef: "AC-2026-MH-00912",
    parcelUlpin: "MH-PUN-2026-0219",
    district: "Pune (Haveli Taluk)",
    districtHi: "पुणे (हवेली तालुका)",
    calculatedValue: "₹ 96,20,000",
    districtAvg: "₹ 88,00,000",
    varianceRatio: "Duplicate Aadhaar Vault Token",
    varianceRatioHi: "डुप्लिकेट आधार वॉल्ट टोकन",
    statute: "PFMS Direct Benefit Transfer Anti-Fraud Protocol 2024",
    statuteHi: "पीएफएमएस प्रत्यक्ष लाभ अंतरण धोखाधड़ी-रोधी प्रोटोकॉल 2024",
    details: "Identical Aadhaar vault token registered across two unrelated parcel claims with different declared owners. Payout frozen.",
    detailsHi: "विभिन्न घोषित स्वामियों के साथ दो असंबंधित पार्सल दावों में समान आधार वॉल्ट टोकन पंजीकृत है। भुगतान रोक दिया गया है।",
    flagDate: "06 Sep 2026",
    flagDateHi: "06 सित 2026",
    status: "UNDER_REVIEW",
  },
  {
    id: "ANOM-005",
    title: "Rapid Stage Progression (Rushed Approval without Verification)",
    titleHi: "अति-त्वरित चरण प्रगति (बिना उचित जांच जल्दबाजी में दी गई मंजूरी)",
    severity: "HIGH",
    caseRef: "LAC/2026/NH-44/AP-012",
    parcelUlpin: "AP-KRN-2026-0442",
    district: "Kurnool",
    districtHi: "कुरनूल",
    calculatedValue: "₹ 1,42,00,000",
    districtAvg: "₹ 1,35,00,000",
    varianceRatio: "< 48 Hours Between Stages",
    varianceRatioHi: "चरणों के बीच 48 घंटे से कम",
    statute: "RFCTLARR Section 11 to Section 16 Mandatory Waiting Period",
    statuteHi: "आरएफसीटीएलएआरआर धारा 11 से धारा 16 अनिवार्य प्रतीक्षा अवधि",
    details: "Case moved from Section 11 Award inquiry to Section 16 Possession takeover in 48 hours without mandatory 60-day objection cooling.",
    detailsHi: "मामला अनिवार्य 60-दिवसीय आपत्ति अवधि के बिना 48 घंटों में धारा 11 पंचाट जांच से धारा 16 कब्जा अधिग्रहण में स्थानांतरित हो गया।",
    flagDate: "05 Sep 2026",
    flagDateHi: "05 सित 2026",
    status: "OPEN",
  },
];

interface CaseDocket {
  caseRef: string;
  project: string;
  projectHi: string;
  sector: string;
  sectorHi: string;
  currentStage: string;
  currentStageHi: string;
  qualityScore: number;
  docsUploaded: number;
  totalDocsRequired: number;
  dscVerified: boolean;
  hashIntegrity: "VALID" | "TAMPER_DETECTED";
  lastAudited: string;
}

const CASE_DOCKETS: CaseDocket[] = [
  {
    caseRef: "AC-2026-KA-001234",
    project: "Bengaluru Peripheral Ring Road (PRR)",
    projectHi: "बेंगलुरु पेरिफेरल रिंग रोड (पीआरआर)",
    sector: "National Expressways",
    sectorHi: "राष्ट्रीय एक्सप्रेसवे",
    currentStage: "Award Enactment (Sec 11)",
    currentStageHi: "पंचाट अधिनियमन (धारा 11)",
    qualityScore: 68,
    docsUploaded: 5,
    totalDocsRequired: 8,
    dscVerified: true,
    hashIntegrity: "VALID",
    lastAudited: "10 Sep 2026, 11:20 IST",
  },
  {
    caseRef: "LAC/2026/DEL-MUM/089",
    project: "Delhi-Mumbai Expressway Package 4",
    projectHi: "दिल्ली-मुंबई एक्सप्रेसवे पैकेज 4",
    sector: "National Expressways",
    sectorHi: "राष्ट्रीय एक्सप्रेसवे",
    currentStage: "PFMS Compensation Disbursed",
    currentStageHi: "पीएफएमएस मुआवजा संवितरित",
    qualityScore: 98,
    docsUploaded: 8,
    totalDocsRequired: 8,
    dscVerified: true,
    hashIntegrity: "VALID",
    lastAudited: "10 Sep 2026, 09:45 IST",
  },
  {
    caseRef: "LAC/2026/STRR/KA-042",
    project: "Satellite Town Ring Road (STRR)",
    projectHi: "सैटेलाइट टाउन रिंग रोड (एसटीआरआर)",
    sector: "National Expressways",
    sectorHi: "राष्ट्रीय एक्सप्रेसवे",
    currentStage: "Objections Hearing (Sec 15)",
    currentStageHi: "आपत्तियों की सुनवाई (धारा 15)",
    qualityScore: 74,
    docsUploaded: 6,
    totalDocsRequired: 8,
    dscVerified: true,
    hashIntegrity: "VALID",
    lastAudited: "09 Sep 2026, 17:10 IST",
  },
  {
    caseRef: "LAC/2026/WDFC/RAJ-108",
    project: "Western Dedicated Freight Corridor",
    projectHi: "पश्चिमी डेडिकेटेड फ्रेट कॉरिडोर",
    sector: "Railways & DFC",
    sectorHi: "रेलवे एवं डीएफसी",
    currentStage: "Joint Field Demarcation",
    currentStageHi: "संयुक्त फील्ड सीमांकन",
    qualityScore: 62,
    docsUploaded: 4,
    totalDocsRequired: 8,
    dscVerified: false,
    hashIntegrity: "VALID",
    lastAudited: "09 Sep 2026, 14:30 IST",
  },
  {
    caseRef: "AC-2026-MH-00912",
    project: "Pune Metro Ring Corridor Phase 2",
    projectHi: "पुणे मेट्रो रिंग कॉरिडोर चरण 2",
    sector: "Metro Rail",
    sectorHi: "मेट्रो रेल",
    currentStage: "Award Enactment (Sec 11)",
    currentStageHi: "पंचाट अधिनियमन (धारा 11)",
    qualityScore: 82,
    docsUploaded: 7,
    totalDocsRequired: 8,
    dscVerified: true,
    hashIntegrity: "VALID",
    lastAudited: "08 Sep 2026, 16:50 IST",
  },
  {
    caseRef: "LAC/2026/SOL-PAV/003",
    project: "Pavagada Solar Park Expansion",
    projectHi: "पावागड़ा सोलर पार्क विस्तार",
    sector: "Renewable Energy",
    sectorHi: "नवीकरणीय ऊर्जा",
    currentStage: "Physical Possession Handover",
    currentStageHi: "भौतिक कब्जा हस्तांतरण",
    qualityScore: 100,
    docsUploaded: 8,
    totalDocsRequired: 8,
    dscVerified: true,
    hashIntegrity: "VALID",
    lastAudited: "08 Sep 2026, 11:05 IST",
  },
];

interface CompensationAuditRecord {
  caseRef: string;
  parcelUlpin: string;
  beneficiaryMasked: string;
  landType: string;
  landTypeHi: string;
  areaHa: number;
  baseMarketValue: number;
  multiplierApplied: number;
  solatium100Pct: number;
  interest12Pct: number;
  totalAwardCalculated: number;
  districtBenchmark: number;
  variancePercentage: number;
  pfmsStatus: "DISBURSED" | "CAG_AUDIT_HOLD" | "READY_FOR_PAYOUT";
}

const COMPENSATION_AUDIT_RECORDS: CompensationAuditRecord[] = [
  {
    caseRef: "AC-2026-KA-001234",
    parcelUlpin: "KA-BLR-2026-0041",
    beneficiaryMasked: "Anand Murthy (AADH-****-4819)",
    landType: "Wet Agricultural",
    landTypeHi: "सिंचित कृषि भूमि",
    areaHa: 0.85,
    baseMarketValue: 7200000,
    multiplierApplied: 1.5,
    solatium100Pct: 7200000,
    interest12Pct: 864000,
    totalAwardCalculated: 18500000,
    districtBenchmark: 5780000,
    variancePercentage: 320,
    pfmsStatus: "CAG_AUDIT_HOLD",
  },
  {
    caseRef: "LAC/2026/DEL-MUM/089",
    parcelUlpin: "DL-MUM-2026-0412",
    beneficiaryMasked: "S. K. Verma (AADH-****-1102)",
    landType: "Dry Agricultural",
    landTypeHi: "असिंचित कृषि भूमि",
    areaHa: 1.2,
    baseMarketValue: 6400000,
    multiplierApplied: 1.5,
    solatium100Pct: 6400000,
    interest12Pct: 768000,
    totalAwardCalculated: 13568000,
    districtBenchmark: 13200000,
    variancePercentage: 2.7,
    pfmsStatus: "DISBURSED",
  },
  {
    caseRef: "LAC/2026/STRR/KA-042",
    parcelUlpin: "KA-RAM-2026-0118",
    beneficiaryMasked: "Lakshmamma (AADH-****-9931)",
    landType: "Garden Land",
    landTypeHi: "बागवानी भूमि",
    areaHa: 0.45,
    baseMarketValue: 3500000,
    multiplierApplied: 1.5,
    solatium100Pct: 3500000,
    interest12Pct: 420000,
    totalAwardCalculated: 7420000,
    districtBenchmark: 7100000,
    variancePercentage: 4.5,
    pfmsStatus: "READY_FOR_PAYOUT",
  },
  {
    caseRef: "AC-2026-MH-00912",
    parcelUlpin: "MH-PUN-2026-0219",
    beneficiaryMasked: "D. R. Shinde (AADH-****-4819)",
    landType: "Peri-Urban Commercial",
    landTypeHi: "पेरी-शहरी वाणिज्यिक भूमि",
    areaHa: 0.3,
    baseMarketValue: 4600000,
    multiplierApplied: 1.0,
    solatium100Pct: 4600000,
    interest12Pct: 420000,
    totalAwardCalculated: 9620000,
    districtBenchmark: 8800000,
    variancePercentage: 9.3,
    pfmsStatus: "CAG_AUDIT_HOLD",
  },
];

function AuditorConsoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams ? searchParams.get("tab") : null;
  const [activeTab, setActiveTab] = useState<string>(requestedTab || "overview");
  const { lang } = useI18n();
  const isHi = lang === "hi";

  // Keep state in sync with URL across any navigation
  useEffect(() => {
    const tab = requestedTab || "overview";
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [requestedTab, activeTab]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    router.replace(`/dashboard/auditor?tab=${val}`, { scroll: false });
  };

  // Live Backend Data Hook & Mutations
  const { data: auditorData } = useAuditorAnomaliesQuery();
  const updateAnomalyMutation = useUpdateAnomalyStatusMutation();

  const [anomalies, setAnomalies] = useState<AnomalyItem[]>(INITIAL_ANOMALIES);
  const [dockets, setDockets] = useState<CaseDocket[]>(CASE_DOCKETS);
  const [compRecords, setCompRecords] = useState<CompensationAuditRecord[]>(COMPENSATION_AUDIT_RECORDS);

  useEffect(() => {
    const list = Array.isArray(auditorData) ? auditorData : (auditorData as any)?.anomalies;
    if (Array.isArray(list) && list.length > 0) {
      setAnomalies(
        list.map((a: any) => ({
          id: a.anomaly_id,
          title: a.title,
          titleHi: a.title_hi,
          severity: a.severity as any,
          caseRef: a.case_ref,
          parcelUlpin: a.parcel_ulpin,
          district: a.district,
          districtHi: a.district_hi,
          calculatedValue: a.calculated_value,
          districtAvg: a.district_avg,
          varianceRatio: a.variance_ratio,
          varianceRatioHi: a.variance_ratio_hi,
          statute: a.statute,
          statuteHi: a.statute_hi,
          details: a.details,
          detailsHi: a.details_hi,
          flagDate: a.flag_date,
          flagDateHi: a.flag_date_hi,
          status: a.status as any,
        }))
      );
    }
  }, [auditorData]);

  // State for interactive modals
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyItem | null>(null);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [auditNoteText, setAuditNoteText] = useState("");
  const [auditNoticeSent, setAuditNoticeSent] = useState(false);

  const [selectedDocket, setSelectedDocket] = useState<CaseDocket | null>(null);
  const [docketModalOpen, setDocketModalOpen] = useState(false);

  const [selectedCompRecord, setSelectedCompRecord] = useState<CompensationAuditRecord | null>(null);
  const [compModalOpen, setCompModalOpen] = useState(false);

  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered anomalies
  const filteredAnomalies = anomalies.filter((item) => {
    const matchesSeverity = filterSeverity === "ALL" || item.severity === filterSeverity;
    const q = (searchQuery || "").toLowerCase();
    const matchesQuery =
      !q ||
      (item.id?.toLowerCase() || "").includes(q) ||
      (item.caseRef?.toLowerCase() || "").includes(q) ||
      (item.parcelUlpin?.toLowerCase() || "").includes(q) ||
      (item.title?.toLowerCase() || "").includes(q) ||
      (item.titleHi?.toLowerCase() || "").includes(q);
    return matchesSeverity && matchesQuery;
  });

  // Chart 1: Completeness Distribution across 193 Dockets
  const completenessDistribution = [
    { scoreRange: isHi ? "90-100% (तैयार)" : "90-100% (Stage Ready)", docketsCount: 84, fill: "#16a34a" },
    { scoreRange: isHi ? "75-89% (मामूली कमी)" : "75-89% (Minor Gaps)", docketsCount: 68, fill: "#3b82f6" },
    { scoreRange: isHi ? "50-74% (बड़ी कमी)" : "50-74% (Major Gaps)", docketsCount: 31, fill: "#d97706" },
    { scoreRange: isHi ? "<50% (गैर-अनुपालन)" : "<50% (Non-Compliant)", docketsCount: 10, fill: "#dc2626" },
  ];

  // Chart 2: SLA Adherence vs Statutory Limit
  const slaComplianceData = [
    { stage: isHi ? "धारा 4-6 (घोषणा)" : "Sec 4 to 6 (Decl.)", actualDays: 210, statutoryLimit: 365 },
    { stage: isHi ? "धारा 15 आपत्तियां" : "Sec 15 Objections", actualDays: 48, statutoryLimit: 60 },
    { stage: isHi ? "धारा 9-11 (पंचाट)" : "Sec 9 to 11 (Award)", actualDays: 420, statutoryLimit: 730 },
    { stage: isHi ? "पंचाट से पीएफएमएस" : "Award to PFMS Pay", actualDays: 42, statutoryLimit: 90 },
  ];

  const handleOpenFlagModal = (anomaly: AnomalyItem) => {
    setSelectedAnomaly(anomaly);
    setAuditNoteText(
      isHi
        ? `धारा 65B एवं आरएफसीटीएलएआरआर अधिनियम 2013 के तहत ${anomaly.titleHi} के संबंध में वैधानिक जांच नोटिस जारी किया गया। जिला कलेक्टर से 15 वैधानिक कार्य दिवसों के भीतर सत्यापित सर्किल दर आधार एवं पैन/आधार सत्यापन प्रस्तुत करने का अनुरोध किया जाता है।`
        : `Statutory Inquiry Notice issued under Section 65B & RFCTLARR Act 2013 regarding ${anomaly.title}. District Collector is requested to provide verified circle-rate basis and PAN/Aadhaar validation within 15 statutory working days.`
    );
    setAuditNoticeSent(false);
    setFlagModalOpen(true);
  };

  const handleSendNotice = () => {
    if (selectedAnomaly) {
      updateAnomalyMutation.mutate({ id: selectedAnomaly.id, status: "NOTICE_ISSUED" });
      setAnomalies((prev) =>
        prev.map((a) => (a.id === selectedAnomaly.id ? { ...a, status: "NOTICE_ISSUED" } : a))
      );
    }
    setAuditNoticeSent(true);
    setTimeout(() => {
      setFlagModalOpen(false);
      setAuditNoticeSent(false);
      showToast(
        isHi
          ? "सीएजी धारा 65B वैधानिक नोटिस जिला मजिस्ट्रेट को सफलतापूर्वक जारी किया गया!"
          : "CAG Section 65B Statutory Notice officially dispatched to District Magistrate!"
      );
    }, 1800);
  };

  const handleExportPdfReport = (reportType: string) => {
    downloadAuditorComplianceReportPdf(`CAG_Statutory_${reportType}_2026`, {
      reportTitle: `Statutory Compliance Audit Report - ${reportType.replace(/_/g, " ")}`,
      auditScope: "193 Acquisition Dockets • National Surveillance (RFCTLARR 2013)",
      totalAudited: 193,
      complianceRate: 97.4,
      anomaliesDetected: 5,
      avgQualityScore: 88.4,
    });
    showToast(
      isHi
        ? "आधिकारिक सीएजी ऑडिट पीडीएफ रिपोर्ट तैयार एवं डाउनलोड की गई!"
        : "Official CAG Audit PDF Dossier compiled & downloaded successfully!"
    );
  };

  const handleExportCsvLedger = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Block_Index,Timestamp,Officer,Action,Target_Entity,Hash,Status\n" +
      "1042,2026-09-10 14:32:18,Priya Sundaram IAS,ENACT_STATUTORY_AWARD,Case LAC/2026/DEL-MUM/089,7a2f1b098c4d5e6f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f,VERIFIED\n" +
      "1041,2026-09-10 12:15:04,Suresh Patil,UPLOAD_GPS_DEMARCATION,Parcel KA-BLR-2026-0041,e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855,VERIFIED\n" +
      "1040,2026-09-09 17:40:22,Rajeshwar Rao Secy,APPROVE_SECTION11_GAZETTE,Project KRDCL/STRR/01,8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a,VERIFIED\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "BhoomiSetu_CAG_Audit_Ledger_Export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(
      isHi
        ? "अपरिवर्तनीय ऑडिट लेजर सीएसवी सफलतापूर्वक निर्यात किया गया!"
        : "Immutable Audit Ledger CSV exported successfully!"
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-[#171716] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-200" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}
      {/* 1. Official CAG Auditor Officer Header Banner */}
      <div className="bg-[#fffdf8] text-[#171716] rounded-2xl p-6 shadow-sm border border-[#d8d3c9]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-[#ef5b2a]/10 text-[#ef5b2a] border border-[#ef5b2a]/30 font-bold text-[11px] px-2.5 py-0.5 tracking-wider uppercase rounded-full">
                {isHi ? "सीएजी ऑडिट कंसोल" : "CAG Auditor Console"}
              </Badge>
              <Badge variant="outline" className="text-[#171716] border-[#d8d3c9] text-[10px] font-mono">
                {isHi ? "अधिदेश: आरएफसीटीएलएआरआर अधिनियम 2013 एवं आईटी अधिनियम 2000" : "Mandate: RFCTLARR Act 2013 & IT Act 2000"}
              </Badge>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                <Lock className="h-3 w-3 text-emerald-700" />
                <span>{isHi ? "आधिकारिक डिजिटल हस्ताक्षर सक्रिय" : "Official Digital Signature Active"}</span>
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#171716]">
                {isHi ? "ऑडिट एवं निरीक्षण कंसोल" : "Audit & Inspection Console"}
              </h1>
              <p className="text-xs sm:text-sm text-[#68655e] max-w-2xl mt-1">
                {isHi ? (
                  <>
                    निगरानी एवं छेड़छाड़-रहित गतिविधि रिकॉर्ड प्रबंधन:{" "}
                    <strong className="text-[#ef5b2a]">के. एन. राघवन, आईएएंडएएस</strong>, महानिदेशक लेखापरीक्षा,{" "}
                    <span className="font-semibold text-[#171716]">भारत के नियंत्रक एवं महालेखापरीक्षक (सीएजी)</span>।
                  </>
                ) : (
                  <>
                    Audit and tamper-proof activity ledger managed by{" "}
                    <strong className="text-[#ef5b2a]">K. N. Raghavan, IA&AS</strong>, Director General of Audit,{" "}
                    <span className="font-semibold text-[#171716]">Comptroller & Auditor General of India (CAG)</span>.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => handleExportPdfReport("CAG_Statutory_Compliance_Report")}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs h-9 flex items-center gap-2 shadow"
            >
              <Download className="h-4 w-4 text-slate-950" />
              <span>{isHi ? "आधिकारिक सीएजी ऑडिट रिपोर्ट (पीडीएफ)" : "Export CAG Audit Report (PDF)"}</span>
            </Button>
          </div>
        </div>

        {/* Access Level Guard Indicator */}
        <div className="mt-5 pt-4 border-t border-white/15 flex items-center gap-2 text-[11px] text-blue-100/90">
          <ShieldAlert className="h-4 w-4 text-[#ef5b2a] shrink-0" />
          <span>
            <strong className="text-[#171716]">
              {isHi ? "पहुंच स्तर: केवल-पठन निरीक्षण।" : "ACCESS LEVEL: READ-ONLY AUDIT & INSPECTION."}
            </strong>{" "}
            {isHi
              ? "आप संपूर्ण केस विवरण की जांच कर सकते हैं, छेड़छाड़-रहित डिजिटल सुरक्षा मुहरों को सत्यापित कर सकते हैं और ऑडिट नोटिस जारी कर सकते हैं। आप अंतर्निहित रिकॉर्ड में बदलाव नहीं कर सकते हैं या धनराशि वितरित नहीं कर सकते हैं।"
              : "You can inspect complete case details, verify tamper-proof digital security seals, and issue audit notices. You cannot modify underlying records or disburse funds."}
          </span>
        </div>
      </div>

      {/* 2. Personalized 5-Tab Content Controlled via Role Sidebar */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">

        {/* ============================================================ */}
        {/* TAB: STATUTORY 90-DAY DELAY RISK AUDIT */}
        {/* ============================================================ */}
        <TabsContent value="delay-risk" className="space-y-6 m-0">
          <RoleBasedDelayIntelligence />
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 1: EXECUTIVE OVERVIEW & ACTIVITY LOGS */}
        {/* ============================================================ */}
        <TabsContent value="overview" className="space-y-6 m-0">
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={isHi ? "सत्यापित गतिविधि रिकॉर्ड" : "Verified Activity Logs"}
              value={isHi ? "1,042 रिकॉर्ड" : "1,042 Records"}
              subtext={isHi ? "100% डिजिटल सुरक्षा मुहर सत्यापित" : "100% Tamper-Proof & Verified"}
              icon={ShieldCheck}
              variant="green"
            />
            <StatCard
              title={isHi ? "औसत केस फाइल दस्तावेज़ स्कोर" : "Avg. Case File Document Score"}
              value="88.4 / 100"
              subtext={isHi ? "8 अनिवार्य सरकारी दस्तावेज़ों के आधार पर" : "Based on 8 mandatory official documents"}
              trend={{ value: isHi ? "+4.2 अंक" : "+4.2 pts", isPositive: true }}
              icon={CheckCircle2}
              variant="amber"
            />
            <StatCard
              title={isHi ? "सक्रिय अनियमितता एवं जोखिम अलर्ट" : "Active Risk & Irregularity Alerts"}
              value={isHi ? "5 मामले" : "5 Cases"}
              subtext={isHi ? "1 गंभीर (दर में अंतर) • 2 उच्च" : "1 Critical (Price Gap) • 2 High"}
              trend={{ value: isHi ? "कार्रवाई आवश्यक" : "Action Required", isPositive: false }}
              icon={AlertTriangle}
              variant="rose"
            />
            <StatCard
              title={isHi ? "सीएजी ऑडिट अनुपालन दर" : "Audit Compliance Rate"}
              value="97.4%"
              subtext={isHi ? "शून्य अनधिकृत परिवर्तन" : "Zero unauthorized alterations"}
              icon={Scale}
              variant="amber"
            />
          </div>

          {/* Secondary Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border bg-[#f4f1ea] border-[#d8d3c9] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#68655e] font-medium">
                  {isHi ? "कुल जांचे गए मामले" : "Total Audited Cases"}
                </span>
                <p className="text-xl font-black text-[#171716]">
                  {isHi ? "193 केस फाइलें" : "193 Case Files"}
                </p>
                <p className="text-[10px] text-[#68655e]">
                  {isHi ? "6 बुनियादी ढांचा क्षेत्रों में" : "Across 6 infrastructure sectors"}
                </p>
              </div>
              <Building className="h-8 w-8 text-blue-900/30 dark:text-blue-400/30" />
            </div>

            <div className="p-4 rounded-xl border bg-[#f4f1ea] border-[#d8d3c9] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#68655e] font-medium">
                  {isHi ? "कुल जांचा गया बैंक खाता मुआवजा" : "Total Audited Bank Payments"}
                </span>
                <p className="text-xl font-black text-[#171716]">₹ 482.60 Cr</p>
                <p className="text-[10px] text-emerald-600 font-medium">
                  {isHi ? "100% प्रत्यक्ष बैंक अंतरण (डीबीटी) से संबद्ध" : "100% Direct Bank Transfer linked"}
                </p>
              </div>
              <Coins className="h-8 w-8 text-emerald-900/30 dark:text-emerald-400/30" />
            </div>

            <div className="p-4 rounded-xl border bg-[#f4f1ea] border-[#d8d3c9] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#68655e] font-medium">
                  {isHi ? "डिजिटल सुरक्षा रिकॉर्ड स्थिति" : "Tamper-Proof Record Status"}
                </span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {isHi ? "100% सुरक्षित एवं सत्यापित" : "100% SECURE & VERIFIED"}
                </p>
                <p className="text-[10px] text-[#68655e]">
                  {isHi ? "शून्य अनधिकृत बदलाव या छेड़छाड़" : "Zero unauthorized edits or altered records"}
                </p>
              </div>
              <Fingerprint className="h-8 w-8 text-emerald-900/30 dark:text-emerald-400/30" />
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Document Completeness Score Distribution */}
            <Card className="lg:col-span-7">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold">
                    {isHi
                      ? "दस्तावेज़ पूर्णता स्कोर वितरण (193 केस फाइलें)"
                      : "Document Completeness Score Distribution (193 Case Files)"}
                  </CardTitle>
                  <span className="text-xs text-[#68655e] font-mono font-semibold">
                    {isHi ? "सरकारी लक्ष्य: ≥85%" : "Official Goal: ≥85%"}
                  </span>
                </div>
                <CardDescription className="text-xs">
                  {isHi
                    ? "8 अनिवार्य सरकारी दस्तावेज़ों (धारा 4, एसआईए, धारा 6, धारा 9, भूमि सर्वे, फॉर्म IV, धारा 16, पुनर्वास) का स्वचालित ऑडिट।"
                    : "Automated audit evaluating 8 mandatory official documents (Section 4, SIA, Sec 6, Sec 9, Survey, Form IV, Sec 16, R&R)."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={completenessDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="scoreRange" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(val) => [isHi ? `${val} केस फाइलें` : `${val} Case Files`, ""]}
                        contentStyle={{
                          backgroundColor: "#fffdf8", borderColor: "#d8d3c9",
                          borderRadius: "8px",
                          border: "none",
                          color: "#171716",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="docketsCount" name={isHi ? "भूमि अधिग्रहण केस फाइलें" : "Acquisition Case Files"} radius={[4, 4, 0, 0]}>
                        {completenessDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Cryptographic Ledger Health Box */}
            <Card className="lg:col-span-5 border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-emerald-600" />
                    <span>{isHi ? "डिजिटल सुरक्षा एवं गतिविधि रिकॉर्ड स्थिति" : "Digital Security & Activity Trail Status"}</span>
                  </CardTitle>
                  <Badge variant="success" className="text-[10px]">
                    {isHi ? "छेड़छाड़-रहित सुरक्षित" : "100% Tamper-Proof"}
                  </Badge>
                </div>
                <CardDescription className="text-xs text-emerald-800 dark:text-emerald-300">
                  {isHi
                    ? "प्रत्येक सिस्टम गतिविधि पिछले रिकॉर्ड से सुरक्षित रूप से जुड़ी है और आधिकारिक डिजिटल हस्ताक्षर से मुद्रित है:"
                    : "Every system action is securely chained to previous records and stamped with an official digital signature to prevent tampering:"}
                  <code className="block font-mono text-[10px] bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5 rounded mt-1">
                    {isHi
                      ? "सुरक्षित_रिकॉर्ड = सुरक्षा_कोड(पिछला_रिकॉर्ड + अधिकारी_हस्ताक्षर + कार्य_विवरण)"
                      : "TamperProofRecord = SecurityCode(PreviousRecord + OfficerSignature + ActionDetails)"}
                  </code>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border text-xs">
                    <span className="text-[#171716] font-medium">
                      {isHi ? "नवीनतम गतिविधि रिकॉर्ड #1042" : "Latest Activity Record #1042"}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-[#171716] bg-[#f4f1ea] dark:bg-slate-700 px-2 py-0.5 rounded">
                      7a2f1b09...3e4f
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border text-xs">
                    <span className="text-[#171716] font-medium">
                      {isHi ? "पिछला जुड़ा हुआ रिकॉर्ड #1041" : "Previous Linked Record #1041"}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-[#171716] bg-[#f4f1ea] dark:bg-slate-700 px-2 py-0.5 rounded">
                      e3b0c442...b855
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border text-xs">
                    <span className="text-[#171716] font-medium">
                      {isHi ? "मुख्य सत्यापन सील" : "Master Verification Seal"}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-[#171716] bg-[#f4f1ea] dark:bg-slate-700 px-2 py-0.5 rounded">
                      4f81c9b2...112c
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-[11px] font-medium">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>
                      {isHi
                        ? "शून्य अनधिकृत परिवर्तन या रिकॉर्ड विसंगतियां।"
                        : "Zero unauthorized alterations or record discrepancies."}
                    </span>
                  </div>
                  <Link href="/audit" className="text-blue-600 font-bold hover:underline">
                    {isHi ? "संपूर्ण गतिविधि इतिहास देखें →" : "View Full Activity History →"}
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart 2: Milestone Timeline vs Official Deadlines */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">
                    {isHi
                      ? "कार्य पूर्णता समय बनाम सरकारी समयसीमा"
                      : "Milestone Completion Time vs Official Deadlines"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {isHi
                      ? "प्रत्येक चरण में लगे वास्तविक दिनों की सरकारी समयसीमा से तुलना।"
                      : "Comparison of actual days taken for each stage against mandated government timelines."}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {isHi ? "समस्त क्षेत्र ऑडिटेड" : "All Sectors Audited"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={slaComplianceData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit={` ${isHi ? "दिन" : "d"}`} />
                    <Tooltip
                      formatter={(val, name) => [
                        `${val} ${isHi ? "दिन" : "Days"}`,
                        name === "actualDays"
                          ? isHi
                            ? "औसत वास्तविक दिन"
                            : "Avg Actual Days"
                          : isHi
                          ? "सरकारी समयसीमा"
                          : "Official Deadline",
                      ]}
                      contentStyle={{
                        backgroundColor: "#fffdf8", borderColor: "#d8d3c9",
                        borderRadius: "8px",
                        border: "none",
                        color: "#171716",
                        fontSize: "12px",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="actualDays"
                      name={isHi ? "औसत वास्तविक दिन" : "Avg Actual Days Taken"}
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="statutoryLimit"
                      name={isHi ? "अधिकतम स्वीकृत समयसीमा" : "Mandated Deadline Limit"}
                      fill="#CBD5E1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 2: ANOMALY DETECTION & RISK ALERTS */}
        {/* ============================================================ */}
        <TabsContent value="anomalies" className="space-y-6 m-0">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-rose-600" />
                    <span>
                      {isHi
                        ? "अनियमितता एवं जोखिम पहचान केंद्र"
                        : "Irregularity & Risk Detection Center"}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {isHi
                      ? "सरकारी दर अंतर, समयसीमा उल्लंघन, डुप्लिकेट बैंक लाभार्थी और बिना जांच की गई मंजूरियों की स्वचालित पहचान।"
                      : "Automated checks for price gaps, missed deadlines, duplicate bank beneficiaries, and rushed approvals."}
                  </CardDescription>
                </div>

                {/* Filter and Search */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#68655e]" />
                    <Input
                      placeholder={isHi ? "मामला, यूएलपीआईएन खोजें..." : "Search case, ULPIN..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-xs pl-8 h-8 w-[180px]"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-[#f4f1ea] border-[#d8d3c9] p-0.5 rounded-lg border text-xs">
                    {[
                      { key: "ALL", label: isHi ? "सभी" : "ALL" },
                      { key: "CRITICAL", label: isHi ? "गंभीर" : "CRITICAL" },
                      { key: "HIGH", label: isHi ? "उच्च" : "HIGH" },
                      { key: "MEDIUM", label: isHi ? "मध्यम" : "MEDIUM" },
                    ].map((sev) => (
                      <button
                        key={sev.key}
                        onClick={() => setFilterSeverity(sev.key)}
                        className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                          filterSeverity === sev.key
                            ? "bg-white dark:bg-slate-700 text-[#171716] shadow-sm font-bold"
                            : "text-[#68655e] hover:text-slate-800"
                        }`}
                      >
                        {sev.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {filteredAnomalies.length === 0 ? (
                  <EmptyState compact>
                    {isHi
                      ? "चयनित फिल्टर से मेल खाने वाली कोई विसंगति नहीं मिली।"
                      : "No anomalies found matching the selected filters."}
                  </EmptyState>
                ) : (
                  filteredAnomalies.map((anom) => (
                    <div
                      key={anom.id}
                      className={`p-4 rounded-xl border transition-all ${
                        anom.severity === "CRITICAL"
                          ? "border-rose-300 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-900"
                          : anom.severity === "HIGH"
                          ? "border-amber-300 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900"
                          : "border-[#d8d3c9] bg-[#ef5b2a]/10/30 dark:bg-blue-950/20 dark:border-blue-900"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs bg-[#fffdf8] text-[#171716] dark:bg-[#f4f1ea] dark:text-slate-900 px-2 py-0.5 rounded">
                              {anom.id}
                            </span>
                            <h3 className="font-bold text-sm text-[#171716]">
                              {isHi && anom.titleHi ? anom.titleHi : anom.title}
                            </h3>
                            <Badge
                              variant={
                                anom.severity === "CRITICAL"
                                  ? "danger"
                                  : anom.severity === "HIGH"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {isHi
                                ? anom.severity === "CRITICAL"
                                  ? "गंभीर जोखिम"
                                  : anom.severity === "HIGH"
                                  ? "उच्च जोखिम"
                                  : "मध्यम जोखिम"
                                : `${anom.severity} RISK`}
                            </Badge>
                            {anom.status === "NOTICE_ISSUED" && (
                              <Badge variant="outline" className="text-[10px] border-emerald-500 text-emerald-700 bg-emerald-50">
                                {isHi ? "नोटिस जारी" : "Notice Issued"}
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-[#171716] leading-relaxed">
                            {isHi && anom.detailsHi ? anom.detailsHi : anom.details}
                          </p>

                          {/* Detail Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] bg-[#f4f1ea] border-[#d8d3c9] p-2.5 rounded-lg border">
                            <div>
                              <span className="text-[10px] text-[#68655e] block uppercase">
                                {isHi ? "मामला एवं पार्सल" : "Case & Parcel"}
                              </span>
                              <span className="font-mono font-bold text-[#ef5b2a]">
                                {anom.caseRef}
                              </span>
                              <span className="block text-[10px] text-[#68655e] font-mono">{anom.parcelUlpin}</span>
                            </div>

                            <div>
                              <span className="text-[10px] text-[#68655e] block uppercase">
                                {isHi ? "गणना बनाम बेंचमार्क दर" : "Calculated vs Benchmark Rate"}
                              </span>
                              <span className="font-bold text-[#171716]">
                                {anom.calculatedValue}
                              </span>
                              <span className="block text-[10px] text-[#68655e]">
                                {isHi ? "औसत:" : "Avg:"} {anom.districtAvg}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-[#68655e] block uppercase">
                                {isHi ? "दर अंतर या विलंब" : "Difference / Delay"}
                              </span>
                              <span
                                className={`font-mono font-bold ${
                                  anom.severity === "CRITICAL" ? "text-rose-600" : "text-amber-600"
                                }`}
                              >
                                {isHi && anom.varianceRatioHi ? anom.varianceRatioHi : anom.varianceRatio}
                              </span>
                              <span className="block text-[10px] text-[#68655e]">
                                {isHi && anom.districtHi ? anom.districtHi : anom.district}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-[#68655e] block uppercase">
                                {isHi ? "आधिकारिक नियम" : "Official Rule"}
                              </span>
                              <span className="text-[#171716] font-medium line-clamp-1">
                                {isHi && anom.statuteHi ? anom.statuteHi : anom.statute}
                              </span>
                              <span className="block text-[10px] text-[#68655e]">
                                {isHi ? "चिह्नित:" : "Flagged:"} {anom.flagDate}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleOpenFlagModal(anom)}
                            className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm text-xs h-8 flex items-center gap-1.5 shadow-sm"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>{isHi ? "चिह्नित करें एवं नोटिस जारी करें" : "Flag & Issue Notice"}</span>
                          </Button>
                          <Link href="/gis">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8 flex items-center gap-1 text-[#171716]"
                            >
                              <MapPin className="h-3.5 w-3.5 text-blue-600" />
                              <span>{isHi ? "भूमि नक्शा देखें" : "View Land Map"}</span>
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 3: DOCUMENT COMPLETENESS & QUALITY SCORING */}
        {/* ============================================================ */}
        <TabsContent value="documents" className="space-y-6 m-0">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-blue-600" />
                    <span>
                      {isHi
                        ? "केस फाइल पूर्णता एवं आवश्यक दस्तावेज़ सत्यापन"
                        : "Case File Completeness & Document Verification"}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {isHi
                      ? "8 अनिवार्य चरण दस्तावेज़ों, आधिकारिक डिजिटल हस्ताक्षरों एवं सुरक्षा मुहर का सत्यापन।"
                      : "Verification of 8 mandatory stage documents, digital signatures, and tamper-proof security seals."}
                  </CardDescription>
                </div>
                <Badge variant="civic" className="text-xs">
                  {isHi ? "193 कुल केस फाइलें निगरानी में" : "193 Total Case Files Monitored"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#f4f1ea] border-[#d8d3c9] text-[#171716] font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">{isHi ? "केस फाइल एवं परियोजना" : "Case File & Project"}</th>
                      <th className="p-3">{isHi ? "क्षेत्र" : "Sector"}</th>
                      <th className="p-3">{isHi ? "चरण" : "Stage"}</th>
                      <th className="p-3 text-center">{isHi ? "जमा किए गए दस्तावेज़" : "Documents Submitted"}</th>
                      <th className="p-3 text-center">{isHi ? "दस्तावेज़ स्कोर" : "Document Score"}</th>
                      <th className="p-3 text-center">{isHi ? "डिजिटल हस्ताक्षर" : "Digital Signature"}</th>
                      <th className="p-3 text-center">{isHi ? "सुरक्षा मुहर" : "Security Seal"}</th>
                      <th className="p-3 text-right">{isHi ? "कार्रवाई" : "Action"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d8d3c9]/60">
                    {dockets.map((doc) => (
                      <tr key={doc.caseRef} className="hover:bg-[#f4f1ea] dark:hover:bg-[#fffdf8]/50">
                        <td className="p-3">
                          <span className="font-mono font-bold text-[#ef5b2a] block">
                            {doc.caseRef}
                          </span>
                          <span className="text-[#68655e] text-[11px] line-clamp-1">
                            {isHi && doc.projectHi ? doc.projectHi : doc.project}
                          </span>
                        </td>
                        <td className="p-3 text-[#171716]">
                          {isHi && doc.sectorHi ? doc.sectorHi : doc.sector}
                        </td>
                        <td className="p-3 font-medium text-[#171716]">
                          {isHi && doc.currentStageHi ? doc.currentStageHi : doc.currentStage}
                        </td>
                        <td className="p-3 text-center font-mono">
                          <Badge variant="outline" className="text-[10px]">
                            {doc.docsUploaded} / {doc.totalDocsRequired}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block font-mono font-bold text-xs px-2 py-0.5 rounded ${
                              doc.qualityScore >= 90
                                ? "bg-emerald-500/10 text-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                                : doc.qualityScore >= 75
                                ? "bg-[#ef5b2a]/10 text-[#ef5b2a] dark:bg-blue-950 dark:text-blue-300"
                                : doc.qualityScore >= 50
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-[#ef5b2a]"
                                : "bg-rose-500/10 text-rose-300 dark:bg-rose-950 dark:text-rose-300"
                            }`}
                          >
                            {doc.qualityScore}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {doc.dscVerified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{isHi ? "सत्यापित" : "Verified"}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-bold">
                              <AlertTriangle className="h-3 w-3" />
                              <span>{isHi ? "लंबित" : "Pending"}</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                            {isHi ? "मान्य सुरक्षित" : "VALID"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedDocket(doc);
                              setDocketModalOpen(true);
                            }}
                            className="text-xs h-7 px-2"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            <span>{isHi ? "चेकलिस्ट देखें" : "View Checklist"}</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 4: COMPENSATION & BANK PAYMENT AUDIT */}
        {/* ============================================================ */}
        <TabsContent value="compensation" className="space-y-6 m-0">
          {/* Official Formula Explanation Box */}
          <div className="p-4 rounded-xl border border-[#d8d3c9] bg-[#f4f1ea] dark:bg-blue-950/30 dark:border-blue-900 text-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <Scale className="h-4 w-4 text-[#ef5b2a]" />
              <h3 className="font-bold text-blue-950 dark:text-blue-100">
                {isHi
                  ? "आधिकारिक मुआवजा गणना सूत्र (भूमि अधिग्रहण अधिनियम 2013)"
                  : "Official Compensation Formula (Land Acquisition Act 2013)"}
              </h3>
            </div>
            <p className="text-[#171716] leading-relaxed">
              {isHi
                ? "प्रत्येक भूमि मुआवजा अधिनिर्णय पारदर्शी कानूनी सूत्र द्वारा सत्यापित होता है: "
                : "Every land compensation award is verified via a transparent legal formula: "}
              <code className="font-mono font-bold text-[#ef5b2a] bg-[#ef5b2a]/10 border border-[#ef5b2a]/30 px-2 py-0.5 rounded">
                {isHi
                  ? "कुल मुआवजा = (आधार बाजार दर × ग्रामीण/शहरी गुणक) + 100% अतिरिक्त कानूनी बोनस (सोलेशियम) + 12% वार्षिक ब्याज"
                  : "Total Compensation = (Base Land Rate × Multiplier) + 100% Legal Bonus (Solatium) + 12% Yearly Interest"}
              </code>
              {isHi
                ? "। जहां ग्रामीण गुणक 1.25x से 2.0x और शहरी गुणक 1.0x है। जिला बेंचमार्क से 5% से अधिक का कोई भी दर अंतर होने पर स्वचालित ऑडिट समीक्षा होती है।"
                : ". Where rural multiplier is 1.25x to 2.0x, urban multiplier is 1.0x. Any discrepancy exceeding 5% variance from the district benchmark triggers an automated audit review."}
            </p>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Coins className="h-5 w-5 text-emerald-600" />
                    <span>
                      {isHi ? "बैंक खाता भुगतान रिकॉर्ड एवं मुआवजा जांच" : "Bank Payment Records & Compensation Checks"}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {isHi
                      ? "सरकारी सर्किल दरों और बैंक खाता विवरण के साथ मुआवजा भुगतान आदेशों का सत्यापन।"
                      : "Verifying payment orders directly against official bank confirmations and government circle rates."}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {isHi ? "सीधा बैंक भुगतान (पीएफएमएस): सक्रिय" : "Direct Bank Payment (PFMS): LIVE"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#f4f1ea] border-[#d8d3c9] text-[#171716] font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">{isHi ? "केस एवं भू-आधार (यूलपिन)" : "Case & Land ID (ULPIN)"}</th>
                      <th className="p-3">{isHi ? "लाभार्थी" : "Beneficiary"}</th>
                      <th className="p-3">{isHi ? "भूमि प्रकार एवं क्षेत्रफल" : "Land Type & Area"}</th>
                      <th className="p-3">{isHi ? "आधार मूल्य" : "Base Value"}</th>
                      <th className="p-3">{isHi ? "गुणक" : "Multiplier"}</th>
                      <th className="p-3">{isHi ? "कुल आकलित मुआवजा" : "Total Compensation Calculated"}</th>
                      <th className="p-3">{isHi ? "जिले की औसत दर से अंतर" : "Difference vs District Benchmark"}</th>
                      <th className="p-3 text-center">{isHi ? "सीधे बैंक खाते में भुगतान" : "Direct Bank Payment Status"}</th>
                      <th className="p-3 text-right">{isHi ? "कार्रवाई" : "Action"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d8d3c9]/60">
                    {compRecords.map((rec) => (
                      <tr key={rec.caseRef + rec.parcelUlpin} className="hover:bg-[#f4f1ea] dark:hover:bg-[#fffdf8]/50">
                        <td className="p-3">
                          <span className="font-mono font-bold text-[#ef5b2a] block">
                            {rec.caseRef}
                          </span>
                          <span className="text-[#68655e] font-mono text-[10px]">{rec.parcelUlpin}</span>
                        </td>
                        <td className="p-3 font-medium text-[#171716]">{rec.beneficiaryMasked}</td>
                        <td className="p-3 text-[#68655e]">
                          {isHi && rec.landTypeHi ? rec.landTypeHi : rec.landType} ({rec.areaHa} {isHi ? "हे." : "Ha"})
                        </td>
                        <td className="p-3 font-mono">₹ {(rec.baseMarketValue / 100000).toFixed(2)} {isHi ? "लाख" : "L"}</td>
                        <td className="p-3 font-mono font-bold">{rec.multiplierApplied}x</td>
                        <td className="p-3 font-mono font-bold text-[#171716]">
                          ₹ {(rec.totalAwardCalculated / 100000).toFixed(2)} {isHi ? "लाख" : "L"}
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-mono font-bold text-[11px] ${
                              rec.variancePercentage > 50
                                ? "text-rose-600 font-black"
                                : rec.variancePercentage > 5
                                ? "text-amber-600"
                                : "text-emerald-600"
                            }`}
                          >
                            +{rec.variancePercentage}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {rec.pfmsStatus === "DISBURSED" ? (
                            <Badge variant="success" className="text-[10px]">
                              {isHi ? "खाते में जमा" : "Disbursed"}
                            </Badge>
                          ) : rec.pfmsStatus === "CAG_AUDIT_HOLD" ? (
                            <Badge variant="danger" className="text-[10px]">
                              {isHi ? "ऑडिट समीक्षा रोक" : "Audit Review Hold"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              {isHi ? "तैयार" : "Ready"}
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCompRecord(rec);
                              setCompModalOpen(true);
                            }}
                            className="text-xs h-7 px-2"
                          >
                            <Scale className="h-3 w-3 mr-1 text-blue-600" />
                            <span>{isHi ? "गणना देखें" : "View Breakdown"}</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 5: AUDIT REPORTS & OFFICIAL EXPORT */}
        {/* ============================================================ */}
        <TabsContent value="reports" className="space-y-6 m-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Report 1: CAG Statutory Audit Report */}
            <Card className="border-[#d8d3c9] bg-gradient-to-b from-blue-50/40 to-white dark:from-slate-900 dark:to-slate-950 flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-[#ef5b2a]/10 text-[#ef5b2a] border border-[#ef5b2a]/30 text-[10px]">
                    {isHi ? "सीएजी आधिकारिक प्रारूप" : "CAG Official Format"}
                  </Badge>
                  <FileText className="h-5 w-5 text-blue-800" />
                </div>
                <CardTitle className="text-sm font-bold mt-2">
                  {isHi
                    ? "व्यापक सीएजी अनुपालन ऑडिट रिपोर्ट (पीडीएफ)"
                    : "Comprehensive CAG Compliance Audit Report (PDF)"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isHi
                    ? "सभी 193 केस फाइलों, 5 जोखिम चेतावनियों, छेड़छाड़-रहित गतिविधि रिकॉर्ड और आधिकारिक डिजिटल हस्ताक्षर को शामिल करने वाली व्यापक रिपोर्ट।"
                    : "Official report covering all 193 case files, 5 detected risk alerts, tamper-proof activity logs, and official digital signatures."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  onClick={() => handleExportPdfReport("CAG_Comprehensive_Compliance_Report")}
                  className="w-full bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm font-bold text-xs h-9 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>{isHi ? "रिपोर्ट डाउनलोड करें (पीडीएफ)" : "Download Report (PDF)"}</span>
                </Button>
              </CardContent>
            </Card>

            {/* Report 2: RFCTLARR Compliance Certificate */}
            <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50/40 to-white dark:from-slate-900 dark:to-slate-950 flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-700 text-[#171716] text-[10px]">
                    {isHi ? "वैधानिक प्रमाण पत्र" : "Statutory Certificate"}
                  </Badge>
                  <Scale className="h-5 w-5 text-emerald-800" />
                </div>
                <CardTitle className="text-sm font-bold mt-2">
                  {isHi
                    ? "भूमि अधिग्रहण अधिनियम 2013 अनुपालन प्रमाण पत्र (पीडीएफ)"
                    : "Land Acquisition Act 2013 Compliance Certificate (PDF)"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isHi
                    ? "धारा 4 से 16 तक सभी अनिवार्य चरणों, समयसीमा और सामाजिक प्रभाव मूल्यांकन स्वीकृतियों को प्रमाणित करने वाला आधिकारिक प्रमाण पत्र।"
                    : "Legal certificate verifying compliance with all statutory stages from Section 4 to 16, time limits, and approvals."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  onClick={() => handleExportPdfReport("RFCTLARR_Compliance_Certificate")}
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-[#171716] font-bold text-xs h-9 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>{isHi ? "प्रमाण पत्र डाउनलोड करें (पीडीएफ)" : "Download Certificate (PDF)"}</span>
                </Button>
              </CardContent>
            </Card>

            {/* Report 3: High-Risk Anomaly Brief */}
            <Card className="border-rose-200 bg-gradient-to-b from-rose-50/40 to-white dark:from-slate-900 dark:to-slate-950 flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="danger" className="text-[10px]">
                    {isHi ? "कार्रवाई आवश्यक" : "Action Required"}
                  </Badge>
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                </div>
                <CardTitle className="text-sm font-bold mt-2">
                  {isHi
                    ? "उच्च जोखिम विसंगति एवं अनियमितता संक्षेप (पीडीएफ)"
                    : "High-Risk Irregularity & Risk Assessment Brief (PDF)"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isHi
                    ? "डुप्लिकेट बैंक खाता संदर्भों और 3.2x दर वृद्धि सहित 5 सक्रिय जोखिम चेतावनियों का विस्तृत विवरण।"
                    : "Executive dossier detailing the 5 active risk alerts including duplicate bank beneficiary references and 3.2x rate escalation."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  onClick={() => handleExportPdfReport("High_Risk_Anomaly_Brief")}
                  className="w-full bg-rose-700 hover:bg-rose-800 text-[#171716] font-bold text-xs h-9 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>{isHi ? "जोखिम संक्षेप डाउनलोड करें (पीडीएफ)" : "Download Risk Brief (PDF)"}</span>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Activity Ledger Export */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>
                  {isHi
                    ? "संपूर्ण सिस्टम गतिविधि रिकॉर्ड एवं सुरक्षा लॉग (सीएसवी निर्यात)"
                    : "Full System Activity Log & Security Records (CSV Export)"}
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                {isHi
                  ? "संसदीय निगरानी, केंद्रीय सतर्कता आयोग (सीवीसी) और आधिकारिक निरीक्षण हेतु गतिविधि रिकॉर्ड निर्यात करें।"
                  : "Export verified event records for official parliamentary oversight, Central Vigilance Commission (CVC), and regulatory review."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-[#f4f1ea] border-[#d8d3c9] text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-[#171716]">
                    BhoomiSetu_National_Audit_Ledger_2026.csv
                  </span>
                  <p className="text-[#68655e] text-[11px]">
                    {isHi
                      ? "डिजिटल सुरक्षा मुहर, अधिकारी हस्ताक्षर और कार्य विवरण के साथ 1,042 सत्यापित गतिविधि रिकॉर्ड शामिल हैं।"
                      : "Contains 1,042 verified activity records with digital security stamps, officer signatures, and action details."}
                  </p>
                </div>
                <Button
                  onClick={handleExportCsvLedger}
                  variant="outline"
                  className="text-xs h-9 flex items-center gap-1.5 shrink-0"
                >
                  <Download className="h-4 w-4" />
                  <span>{isHi ? "सीएसवी निर्यात करें (1,042 ब्लॉक)" : "Export CSV (1,042 Blocks)"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============================================================ */}
      {/* MODAL 1: FLAG CASE / ISSUE STATUTORY AUDIT NOTICE */}
      {/* ============================================================ */}
      <Dialog open={flagModalOpen} onOpenChange={setFlagModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-600" />
              <DialogTitle className="text-base font-bold">
                {isHi
                  ? "वैधानिक ऑडिट नोटिस जारी करें / मामला चिह्नित करें"
                  : "Issue Statutory Audit Notice / Flag Case"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              {isHi
                ? "यह नोटिस क्रिप्टोग्राफिक रूप से केस लेजर में संलग्न किया जाएगा और जिला कलेक्टर एवं सीएएलए को प्रेषित किया जाएगा।"
                : "This notice will be cryptographically appended to the case ledger and transmitted to the District Collector & CALA."}
            </DialogDescription>
          </DialogHeader>

          {selectedAnomaly && (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg border bg-[#f4f1ea] border-[#d8d3c9] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#ef5b2a]">
                    {selectedAnomaly.caseRef}
                  </span>
                  <Badge variant="danger" className="text-[10px]">
                    {isHi
                      ? selectedAnomaly.severity === "CRITICAL"
                        ? "गंभीर"
                        : selectedAnomaly.severity === "HIGH"
                        ? "उच्च"
                        : "मध्यम"
                      : selectedAnomaly.severity}
                  </Badge>
                </div>
                <p className="font-bold text-[#171716]">
                  {isHi && selectedAnomaly.titleHi ? selectedAnomaly.titleHi : selectedAnomaly.title}
                </p>
                <p className="text-[#68655e] text-[11px]">
                  {isHi && selectedAnomaly.detailsHi ? selectedAnomaly.detailsHi : selectedAnomaly.details}
                </p>
                <p className="text-[10px] text-[#68655e]">
                  {isHi ? "वैधानिक नियम:" : "Statutory Rule:"}{" "}
                  <strong>
                    {isHi && selectedAnomaly.statuteHi ? selectedAnomaly.statuteHi : selectedAnomaly.statute}
                  </strong>
                </p>
              </div>

              <div>
                <label className="font-bold text-[#171716] block mb-1">
                  {isHi ? "वैधानिक ऑडिट अवलोकन एवं निर्देश:" : "Statutory Audit Observation & Directive:"}
                </label>
                <textarea
                  value={auditNoteText}
                  onChange={(e) => setAuditNoteText(e.target.value)}
                  rows={4}
                  className="w-full p-2.5 rounded-lg border text-xs focus:ring-2 focus:ring-blue-900 focus:outline-none dark:bg-[#fffdf8]"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" />
                  {isHi ? "वैधानिक अधिदेश:" : "Statutory Mandate:"}
                </span>
                <p>
                  {isHi
                    ? `आरएफसीटीएलएआरआर धारा 65बी के अनुसार, सीएएलए 15 कार्य दिवसों में उत्तर देने के लिए बाध्य है। पार्सल ${selectedAnomaly.parcelUlpin} पर भुगतान सीएजी ऑडिट रोक के तहत पीएफएमएस में लॉक रहेगा।`
                    : `Pursuant to RFCTLARR Section 65B, CALA is obligated to respond within 15 working days. Payout on Parcel ${selectedAnomaly.parcelUlpin} will remain locked in PFMS under CAG Audit Hold.`}
                </p>
              </div>

              {auditNoticeSent && (
                <div className="p-3 bg-emerald-500/10 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-2 animate-pulse">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {isHi
                      ? "नोटिस क्रिप्टोग्राफिक रूप से हस्ताक्षरित एवं जिला कलेक्टर को प्रेषित किया गया!"
                      : "Notice cryptographically signed and dispatched to District Collector!"}
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setFlagModalOpen(false)}>
              {isHi ? "रद्द करें" : "Cancel"}
            </Button>
            <Button
              size="sm"
              disabled={auditNoticeSent}
              onClick={handleSendNotice}
              className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm font-bold"
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              <span>{isHi ? "हस्ताक्षर करें एवं नोटिस भेजें" : "Sign & Dispatch Notice"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL 2: CASE FILE DOCUMENT CHECKLIST INSPECTION */}
      {/* ============================================================ */}
      <Dialog open={docketModalOpen} onOpenChange={setDocketModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-blue-600" />
              <span>{isHi ? "केस फाइल दस्तावेज़ चेकलिस्ट एवं स्थिति" : "Case File Document Checklist & Status"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isHi ? "केस संदर्भ:" : "Case Ref:"}{" "}
              <strong className="font-mono text-[#171716]">
                {selectedDocket?.caseRef}
              </strong>{" "}
              • {isHi ? "परियोजना:" : "Project:"}{" "}
              {isHi && selectedDocket?.projectHi ? selectedDocket.projectHi : selectedDocket?.project}
            </DialogDescription>
          </DialogHeader>

          {selectedDocket && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-[#f4f1ea] border-[#d8d3c9] rounded-xl border">
                <div>
                  <span className="text-[10px] text-[#68655e] block uppercase">
                    {isHi ? "पूर्णता स्कोर" : "Completeness Score"}
                  </span>
                  <span className="text-lg font-black font-mono text-[#ef5b2a]">
                    {selectedDocket.qualityScore}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#68655e] block uppercase">
                    {isHi ? "जमा किए गए दस्तावेज़" : "Documents Submitted"}
                  </span>
                  <span className="text-sm font-bold font-mono">
                    {isHi
                      ? `${selectedDocket.docsUploaded} में से ${selectedDocket.totalDocsRequired}`
                      : `${selectedDocket.docsUploaded} of ${selectedDocket.totalDocsRequired}`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#68655e] block uppercase">
                    {isHi ? "डिजिटल हस्ताक्षर" : "Digital Signature"}
                  </span>
                  <span className="text-sm font-bold text-emerald-600">
                    {selectedDocket.dscVerified
                      ? isHi
                        ? "सत्यापित"
                        : "Verified"
                      : isHi
                      ? "लंबित"
                      : "Pending"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#68655e] block uppercase">
                    {isHi ? "सुरक्षा मुहर" : "Security Seal"}
                  </span>
                  <span className="text-sm font-mono font-bold text-emerald-600">
                    {isHi ? "मान्य सुरक्षित" : "VALID"}
                  </span>
                </div>
              </div>

              {/* Checklist items */}
              <div className="space-y-2">
                <span className="font-bold text-[#171716] block">
                  {isHi
                    ? "अनिवार्य सरकारी दस्तावेज़ चेकलिस्ट:"
                    : "Mandatory Official Document Checklist:"}
                </span>
                <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                  {[
                    {
                      name: isHi
                        ? "धारा 4(1) प्रारंभिक सरकारी अधिसूचना"
                        : "Section 4(1) Initial Government Notice",
                      uploaded: true,
                      hash: "4a8f...91c0",
                    },
                    {
                      name: isHi
                        ? "सामाजिक प्रभाव मूल्यांकन (एसआईए) अनापत्ति प्रमाण पत्र"
                        : "Social Impact Assessment (SIA) Clearance Certificate",
                      uploaded: true,
                      hash: "11cb...88aa",
                    },
                    {
                      name: isHi
                        ? "धारा 6 भूमि अधिग्रहण अंतिम घोषणा"
                        : "Section 6 Final Acquisition Declaration",
                      uploaded: true,
                      hash: "7f09...33de",
                    },
                    {
                      name: isHi
                        ? "धारा 9 सार्वजनिक सूचना एवं मौका मुआयना (पंचनामा)"
                        : "Section 9 Public Notice & Spot Inspection (Panchanama)",
                      uploaded: true,
                      hash: "9901...4411",
                    },
                    {
                      name: isHi
                        ? "संयुक्त जमीनी सर्वे नक्शा एवं सीमा कोने की तस्वीरें"
                        : "Joint Field Survey Map & Boundary Corner Photos",
                      uploaded: selectedDocket.docsUploaded >= 5,
                      hash: selectedDocket.docsUploaded >= 5 ? "8b12...ff21" : "MISSING",
                    },
                    {
                      name: isHi
                        ? "मुआवजा बोनस (सोलेशियम) एवं अधिनिर्णय पत्र"
                        : "Official Compensation Award & Bonus (Solatium) Sheet",
                      uploaded: selectedDocket.docsUploaded >= 6,
                      hash: selectedDocket.docsUploaded >= 6 ? "55ea...7710" : "MISSING",
                    },
                    {
                      name: isHi
                        ? "धारा 16 भौतिक भूमि कब्जा प्रमाण पत्र"
                        : "Section 16 Land Possession Certificate",
                      uploaded: selectedDocket.docsUploaded >= 7,
                      hash: selectedDocket.docsUploaded >= 7 ? "33bc...0044" : "MISSING",
                    },
                    {
                      name: isHi
                        ? "पुनर्वास एवं परिवार राहत लाभ अनुमोदन"
                        : "Family Rehabilitation & Relief Approval Order",
                      uploaded: selectedDocket.docsUploaded >= 8,
                      hash: selectedDocket.docsUploaded >= 8 ? "22de...5561" : "MISSING",
                    },
                  ].map((docItem, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2 rounded-lg border ${
                        docItem.uploaded
                          ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                          : "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {docItem.uploaded ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                        )}
                        <span
                          className={`font-medium ${
                            docItem.uploaded
                              ? "text-[#171716]"
                              : "text-rose-900 dark:text-rose-200 font-semibold"
                          }`}
                        >
                          {docItem.name}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#68655e]">
                        {docItem.hash === "MISSING" ? (isHi ? "अनुपलब्ध" : "MISSING") : docItem.hash}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button size="sm" onClick={() => setDocketModalOpen(false)}>
              {isHi ? "निरीक्षण बंद करें" : "Close Inspection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL 3: COMPENSATION FORMULA BREAKDOWN */}
      {/* ============================================================ */}
      <Dialog open={compModalOpen} onOpenChange={setCompModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Scale className="h-5 w-5 text-emerald-600" />
              <span>
                {isHi
                  ? "भूमि मुआवजा गणना सत्यापन"
                  : "Land Compensation Calculation Verification"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isHi ? "केस संदर्भ:" : "Case Ref:"}{" "}
              <strong className="font-mono">{selectedCompRecord?.caseRef}</strong> •{" "}
              {isHi ? "भू-आधार (यूलपिन):" : "Land ID (ULPIN):"}{" "}
              <strong className="font-mono">{selectedCompRecord?.parcelUlpin}</strong>
            </DialogDescription>
          </DialogHeader>

          {selectedCompRecord && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#f4f1ea] border-[#d8d3c9] rounded-xl border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#68655e] font-medium">
                    {isHi ? "लाभार्थी" : "Beneficiary"}
                  </span>
                  <span className="font-bold text-[#171716]">
                    {selectedCompRecord.beneficiaryMasked}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#68655e] font-medium">
                    {isHi ? "भूमि श्रेणी एवं क्षेत्रफल" : "Land Category & Area"}
                  </span>
                  <span className="font-bold">
                    {isHi && selectedCompRecord.landTypeHi
                      ? selectedCompRecord.landTypeHi
                      : selectedCompRecord.landType}{" "}
                    ({selectedCompRecord.areaHa} {isHi ? "हेक्टेयर" : "Hectares"})
                  </span>
                </div>
              </div>

              {/* Step by step math */}
              <div className="space-y-2">
                <span className="font-bold text-[#171716] block">
                  {isHi
                    ? "मुआवजा गणना के चरण:"
                    : "Step-by-Step Compensation Calculation:"}
                </span>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="text-[#171716]">
                      {isHi ? "1. आधार भूमि बाजार दर:" : "1. Base Land Rate:"}
                    </span>
                    <span className="font-bold">
                      ₹ {selectedCompRecord.baseMarketValue.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="text-[#171716]">
                      {isHi
                        ? `2. ग्रामीण / शहरी गुणक (${selectedCompRecord.multiplierApplied}x):`
                        : `2. Rural / Urban Multiplier (${selectedCompRecord.multiplierApplied}x):`}
                    </span>
                    <span className="font-bold text-[#ef5b2a]">
                      ₹{" "}
                      {(
                        selectedCompRecord.baseMarketValue * selectedCompRecord.multiplierApplied
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="text-[#171716]">
                      {isHi ? "3. 100% अतिरिक्त कानूनी बोनस (सोलेशियम):" : "3. 100% Legal Compensation Bonus (Solatium):"}
                    </span>
                    <span className="font-bold">
                      ₹ {selectedCompRecord.solatium100Pct.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="text-[#171716]">
                      {isHi
                        ? "4. 12% वार्षिक कानूनी ब्याज:"
                        : "4. 12% Yearly Legal Interest:"}
                    </span>
                    <span className="font-bold">
                      ₹ {selectedCompRecord.interest12Pct.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 text-xs font-bold text-[#171716]">
                    <span>
                      {isHi
                        ? "कुल आकलित मुआवजा राशि:"
                        : "Total Calculated Compensation Amount:"}
                    </span>
                    <span className="text-emerald-600 text-sm">
                      ₹ {selectedCompRecord.totalAwardCalculated.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Audit verdict */}
              <div
                className={`p-3 rounded-lg border text-[11px] ${
                  selectedCompRecord.variancePercentage > 50
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : "bg-emerald-50 border-emerald-200 text-emerald-900"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  {selectedCompRecord.variancePercentage > 50 ? (
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                  <span>
                    {isHi ? "ऑडिट निष्कर्ष: " : "Audit Verdict: "}
                    {selectedCompRecord.variancePercentage > 50
                      ? isHi
                        ? "विसंगतिपूर्ण - जिला औसत सर्कल दर से 3.2 गुना अधिक विचलन"
                        : "ANOMALOUS - 3.2x District Average Circle Rate Variance"
                      : isHi
                      ? "अनुपालन योग्य - वैधानिक सहनशीलता के भीतर"
                      : "COMPLIANT - Within statutory tolerance"}
                  </span>
                </div>
                <p>
                  {isHi
                    ? `जिला बेंचमार्क सर्कल दर: ₹ ${selectedCompRecord.districtBenchmark.toLocaleString("en-IN")}। वर्तमान पीएफएमएस स्थिति: `
                    : `District Benchmark Circle Rate: ₹ ${selectedCompRecord.districtBenchmark.toLocaleString("en-IN")}. Current PFMS status: `}
                  <strong>
                    {selectedCompRecord.pfmsStatus === "CAG_AUDIT_HOLD"
                      ? isHi
                        ? "सीएजी ऑडिट रोक"
                        : "CAG Audit Hold"
                      : selectedCompRecord.pfmsStatus === "DISBURSED"
                      ? isHi
                        ? "संवितरित"
                        : "DISBURSED"
                      : isHi
                      ? "तैयार"
                      : "READY"}
                  </strong>
                  .
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button size="sm" onClick={() => setCompModalOpen(false)}>
              {isHi ? "विवरण बंद करें" : "Close Breakdown"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AuditorDashboardPage() {
  const { lang } = useI18n();
  const isHi = lang === "hi";

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-12 text-center text-xs text-[#68655e]">
          {isHi
            ? "वैधानिक अनुपालन ऑडिटर कंसोल प्रारंभ हो रहा है..."
            : "Initializing Statutory Compliance Auditor Console..."}
        </div>
      }
    >
      <AuditorConsoleContent />
    </Suspense>
  );
}
