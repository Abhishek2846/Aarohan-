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
import { useProjectsQuery, useParcelsQuery } from "@/hooks/queries/use-bhoomi-queries";
import { RoleBasedDelayIntelligence } from "@/components/ai/role-based-delay-intelligence";
import { generatePiaProjectReportPdf, PiaPdfData } from "@/lib/pdf-generator";
import {
  Building,
  Building2,
  MapPin,
  Clock,
  Layers,
  Map,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Coins,
  Compass,
  FileText,
  FolderOpen,
  HelpCircle,
  ShieldCheck,
  Users,
  AlertTriangle,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Upload,
  Send,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Eye,
  Check,
  X,
  FileCheck,
  FileSpreadsheet,
} from "lucide-react";

// --- MOCK PIA DOMAIN DATA ---

interface ProjectItem {
  id: string;
  code: string;
  title: string;
  titleHi: string;
  sector: "HIGHWAY" | "RAILWAY" | "AIRPORT" | "INDUSTRIAL" | "METRO" | "IRRIGATION";
  state: string;
  districts: string[];
  totalBudgetCr: number;
  disbursedCr: number;
  totalLengthKm: number;
  bufferWidthM: number;
  totalParcels: number;
  acquiredParcels: number;
  areaHa: number;
  progressPct: number;
  status: "PLANNING" | "ALIGNMENT_UPLOADED" | "PROPOSAL_SUBMITTED" | "IN_PROGRESS" | "COMPLETED";
  timelineMonths: number;
  leadOfficer: string;
}

const PIA_PROJECTS: ProjectItem[] = [
  {
    id: "PRJ-PIA-01",
    code: "NHAI/EXP/DEL-MUM/PKG-04",
    title: "Delhi-Mumbai Expressway Vadodara Spur Link",
    titleHi: "दिल्ली-मुंबई एक्सप्रेसवे वडोदरा लिंक",
    sector: "HIGHWAY",
    state: "Gujarat",
    districts: ["Vadodara", "Bharuch", "Surat"],
    totalBudgetCr: 4200,
    disbursedCr: 3450,
    totalLengthKm: 84.5,
    bufferWidthM: 70,
    totalParcels: 1240,
    acquiredParcels: 980,
    areaHa: 520.4,
    progressPct: 79,
    status: "IN_PROGRESS",
    timelineMonths: 36,
    leadOfficer: "Vikram Malhotra (CGM Tech)",
  },
  {
    id: "PRJ-PIA-02",
    code: "DFCCIL/WDFC/GUJ-MAH/PKG-2",
    title: "Western Dedicated Freight Corridor Feeder Link",
    titleHi: "पश्चिमी समर्पित फ्रेट कॉरिडोर फीडर लाइन",
    sector: "RAILWAY",
    state: "Gujarat / Maharashtra",
    districts: ["Valsad", "Navsari", "Palghar"],
    totalBudgetCr: 3800,
    disbursedCr: 2950,
    totalLengthKm: 112.0,
    bufferWidthM: 50,
    totalParcels: 980,
    acquiredParcels: 710,
    areaHa: 410.8,
    progressPct: 72,
    status: "IN_PROGRESS",
    timelineMonths: 42,
    leadOfficer: "S. K. Verma (GM Civil)",
  },
  {
    id: "PRJ-PIA-03",
    code: "AAI/DHLR/CARGO-EXP/01",
    title: "Dholera Greenfield International Airport Cargo Link",
    titleHi: "धोलेरा ग्रीनफील्ड अंतर्राष्ट्रीय हवाई अड्डा कार्गो लिंक",
    sector: "AIRPORT",
    state: "Gujarat",
    districts: ["Ahmedabad", "Botad"],
    totalBudgetCr: 2400,
    disbursedCr: 2100,
    totalLengthKm: 34.0,
    bufferWidthM: 90,
    totalParcels: 620,
    acquiredParcels: 560,
    areaHa: 380.0,
    progressPct: 90,
    status: "IN_PROGRESS",
    timelineMonths: 24,
    leadOfficer: "R. C. Nair (Chief Engineer)",
  },
  {
    id: "PRJ-PIA-04",
    code: "GIDC/SANAND/MMLP-02",
    title: "Sanand Auto-Hub Multi-Modal Logistics Park",
    titleHi: "साणंद मल्टी-मॉडल लॉजिस्टिक्स पार्क",
    sector: "INDUSTRIAL",
    state: "Gujarat",
    districts: ["Ahmedabad"],
    totalBudgetCr: 1600,
    disbursedCr: 850,
    totalLengthKm: 18.5,
    bufferWidthM: 120,
    totalParcels: 480,
    acquiredParcels: 240,
    areaHa: 260.5,
    progressPct: 50,
    status: "PROPOSAL_SUBMITTED",
    timelineMonths: 30,
    leadOfficer: "A. P. Joshi (Project Director)",
  },
  {
    id: "PRJ-PIA-05",
    code: "GMRC/METRO-PH2/GND-EXT",
    title: "Ahmedabad-Gandhinagar Metro Phase-2 Spur",
    titleHi: "अहमदाबाद-गांधीनगर मेट्रो फेज-2 विस्तार",
    sector: "METRO",
    state: "Gujarat",
    districts: ["Gandhinagar"],
    totalBudgetCr: 1950,
    disbursedCr: 1780,
    totalLengthKm: 22.8,
    bufferWidthM: 35,
    totalParcels: 380,
    acquiredParcels: 360,
    areaHa: 110.2,
    progressPct: 95,
    status: "COMPLETED",
    timelineMonths: 28,
    leadOfficer: "M. D. Patel (ED Infrastructure)",
  },
  {
    id: "PRJ-PIA-06",
    code: "SSNNL/NARMADA/DIST-CANAL-14",
    title: "Saurashtra Branch Irrigation Feeder Canal Network",
    titleHi: "सौराष्ट्र शाखा सिंचाई फीडर नहर नेटवर्क",
    sector: "IRRIGATION",
    state: "Gujarat",
    districts: ["Surendranagar", "Rajkot"],
    totalBudgetCr: 1450,
    disbursedCr: 620,
    totalLengthKm: 65.0,
    bufferWidthM: 45,
    totalParcels: 580,
    acquiredParcels: 190,
    areaHa: 158.5,
    progressPct: 33,
    status: "ALIGNMENT_UPLOADED",
    timelineMonths: 36,
    leadOfficer: "K. R. Solanki (Superintending Engineer)",
  },
];

interface AlignmentVersion {
  version: string;
  date: string;
  uploadedBy: string;
  description: string;
  lengthKm: number;
  bufferM: number;
  totalParcels: number;
  affectedAreaHa: number;
  familiesEstimated: number;
  status: "APPROVED" | "PENDING_STATE_REVIEW" | "SUPERSEDED";
}

const ALIGNMENT_VERSIONS: AlignmentVersion[] = [
  {
    version: "v2.0 (Official Current)",
    date: "14 Jul 2026",
    uploadedBy: "Vikram Malhotra (CGM Tech)",
    description: "Realignment around Bharuch eco-buffer: reduced forest parcel intersection by 14.8 Ha and added bypass at Ch. 42+200.",
    lengthKm: 84.5,
    bufferM: 70,
    totalParcels: 1240,
    affectedAreaHa: 520.4,
    familiesEstimated: 410,
    status: "APPROVED",
  },
  {
    version: "v1.1 (Interim Re-route)",
    date: "28 Feb 2026",
    uploadedBy: "Vikram Malhotra (CGM Tech)",
    description: "Avoided village settlement at Navsari North; shifted alignment 150m west to follow barren revenue scrubland.",
    lengthKm: 85.2,
    bufferM: 70,
    totalParcels: 1310,
    affectedAreaHa: 545.0,
    familiesEstimated: 490,
    status: "SUPERSEDED",
  },
  {
    version: "v1.0 (DPR Baseline)",
    date: "10 Oct 2025",
    uploadedBy: "Pre-Feasibility GIS Cell",
    description: "Initial straight-line DPR corridor derived from satellite terrain digital elevation model (DEM).",
    lengthKm: 82.0,
    bufferM: 80,
    totalParcels: 1480,
    affectedAreaHa: 590.2,
    familiesEstimated: 620,
    status: "SUPERSEDED",
  },
];

interface AffectedParcel {
  ulpin: string;
  surveyNo: string;
  village: string;
  taluk: string;
  district: string;
  totalAreaHa: number;
  requiredAreaHa: number;
  landUse: "IRRIGATED_AGRI" | "DRY_AGRI" | "COMMERCIAL" | "FOREST" | "GOVT_SCRUB";
  ownerMasked: string;
  estimatedCompINR: number;
  encumbranceStatus: "UNENCUMBERED" | "TITLE_DISPUTE" | "MORTGAGED" | "COURT_STAY";
  acquisitionStage: string;
  linkedProject: string;
}

const AFFECTED_PARCELS: AffectedParcel[] = [
  {
    ulpin: "GJ-VAD-2026-0041",
    surveyNo: "74/1",
    village: "Karjan",
    taluk: "Karjan",
    district: "Vadodara",
    totalAreaHa: 1.45,
    requiredAreaHa: 0.95,
    landUse: "IRRIGATED_AGRI",
    ownerMasked: "Jayeshbhai Patel (AADH-****-9421)",
    estimatedCompINR: 8550000,
    encumbranceStatus: "UNENCUMBERED",
    acquisitionStage: "Sec 23 Award Sign",
    linkedProject: "Delhi-Mumbai Expressway Vadodara Spur Link",
  },
  {
    ulpin: "GJ-VAD-2026-0042",
    surveyNo: "74/2",
    village: "Karjan",
    taluk: "Karjan",
    district: "Vadodara",
    totalAreaHa: 2.10,
    requiredAreaHa: 1.40,
    landUse: "DRY_AGRI",
    ownerMasked: "Shantaben Parmar (AADH-****-5512)",
    estimatedCompINR: 9800000,
    encumbranceStatus: "UNENCUMBERED",
    acquisitionStage: "Sec 23 Award Sign",
    linkedProject: "Delhi-Mumbai Expressway Vadodara Spur Link",
  },
  {
    ulpin: "GJ-BHR-2026-0118",
    surveyNo: "142/2A",
    village: "Ankleshwar Rural",
    taluk: "Ankleshwar",
    district: "Bharuch",
    totalAreaHa: 0.88,
    requiredAreaHa: 0.88,
    landUse: "COMMERCIAL",
    ownerMasked: "V. R. Synthetics Pvt Ltd",
    estimatedCompINR: 18400000,
    encumbranceStatus: "MORTGAGED",
    acquisitionStage: "Sec 19 Declaration",
    linkedProject: "Delhi-Mumbai Expressway Vadodara Spur Link",
  },
  {
    ulpin: "GJ-BHR-2026-0119",
    surveyNo: "142/3",
    village: "Ankleshwar Rural",
    taluk: "Ankleshwar",
    district: "Bharuch",
    totalAreaHa: 3.20,
    requiredAreaHa: 1.15,
    landUse: "FOREST",
    ownerMasked: "State Forest Dept (Compensatory RoW)",
    estimatedCompINR: 4200000,
    encumbranceStatus: "UNENCUMBERED",
    acquisitionStage: "Sec 11 Preliminary",
    linkedProject: "Delhi-Mumbai Expressway Vadodara Spur Link",
  },
  {
    ulpin: "GJ-SRT-2026-0204",
    surveyNo: "88/1",
    village: "Kamrej",
    taluk: "Kamrej",
    district: "Surat",
    totalAreaHa: 1.75,
    requiredAreaHa: 1.20,
    landUse: "IRRIGATED_AGRI",
    ownerMasked: "Hasmukhbhai Desai (AADH-****-7819)",
    estimatedCompINR: 14400000,
    encumbranceStatus: "TITLE_DISPUTE",
    acquisitionStage: "Sec 15 Objections",
    linkedProject: "Delhi-Mumbai Expressway Vadodara Spur Link",
  },
  {
    ulpin: "GJ-SRT-2026-0205",
    surveyNo: "88/3",
    village: "Kamrej",
    taluk: "Kamrej",
    district: "Surat",
    totalAreaHa: 0.65,
    requiredAreaHa: 0.65,
    landUse: "GOVT_SCRUB",
    ownerMasked: "Revenue Gamtal Department",
    estimatedCompINR: 2100000,
    encumbranceStatus: "UNENCUMBERED",
    acquisitionStage: "Sec 38 Possession",
    linkedProject: "Delhi-Mumbai Expressway Vadodara Spur Link",
  },
];

interface ClarificationItem {
  id: string;
  projectCode: string;
  sourceAuthority: string;
  authorityRole: string;
  category: "ALIGNMENT_OVERLAP" | "MISSING_CLEARANCE" | "BUDGET_MISMATCH" | "PARCEL_DISCREPANCY";
  urgency: "CRITICAL" | "HIGH" | "MEDIUM";
  dateRaised: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  requiredAction: string;
  status: "ACTION_REQUIRED" | "RESUBMITTED" | "CLOSED";
}

const CLARIFICATION_REQUESTS: ClarificationItem[] = [
  {
    id: "CLR-2026-001",
    projectCode: "NHAI/EXP/DEL-MUM/PKG-04",
    sourceAuthority: "District Collector Office, Bharuch",
    authorityRole: "CALA / District Magistrate",
    category: "ALIGNMENT_OVERLAP",
    urgency: "CRITICAL",
    dateRaised: "08 Sep 2026",
    title: "Drainage Canal Overlap at Chainage 42+200",
    titleHi: "चेनेज 42+200 पर सिंचाई नहर एवं प्राकृतिक नाला अतिव्यापन",
    description: "Proposed 70m right-of-way buffer directly intersects village water drain N-14, threatening monsoon inundation of 12 downstream agricultural plots. District irrigation department has objected.",
    descriptionHi: "प्रस्तावित 70 मीटर राइट-ऑफ-वे बफर ग्रामीण जल निकासी नाले से टकराता है, जिससे 12 खेतों में जलभराव का खतरा है।",
    requiredAction: "Submit revised micro-alignment with box-culvert hydraulic plan or shift alignment by 40m southward.",
    status: "ACTION_REQUIRED",
  },
  {
    id: "CLR-2026-002",
    projectCode: "DFCCIL/WDFC/GUJ-MAH/PKG-2",
    sourceAuthority: "Gujarat State Revenue Department (Apex)",
    authorityRole: "State Sanctioning Authority",
    category: "MISSING_CLEARANCE",
    urgency: "HIGH",
    dateRaised: "05 Sep 2026",
    title: "Stage-I Forest Advisory Committee (FAC) In-Principle Approval",
    titleHi: "चरण-1 वन सलाहकार समिति (FAC) सैद्धांतिक अनापत्ति पत्र",
    description: "14.8 Ha of Mangrove Buffer land parcel in Valsad coastal section lacks formal Stage-I in-principle approval from MoEFCC Regional Office. Section 19 declaration cannot be notified in Gazette without this.",
    descriptionHi: "वलसाड तटीय क्षेत्र के 14.8 हेक्टेयर मैंग्रोव बफर भूमि हेतु पर्यावरण मंत्रालय की मंजूरी संलग्न नहीं है।",
    requiredAction: "Upload verified MoEFCC Stage-I Clearance letter along with Compensatory Afforestation (CA) scheme receipt.",
    status: "ACTION_REQUIRED",
  },
  {
    id: "CLR-2026-003",
    projectCode: "NHAI/EXP/DEL-MUM/PKG-04",
    sourceAuthority: "Special Land Acquisition Office (CALA), Vadodara",
    authorityRole: "Competent Authority for Land Acquisition",
    category: "BUDGET_MISMATCH",
    urgency: "HIGH",
    dateRaised: "02 Sep 2026",
    title: "Solatium Multiplier Application on Peri-Urban Parcel 88/1",
    titleHi: "पेरी-अर्बन पार्सल 88/1 पर तोष (सोलेशियम) गुणक विसंगति",
    description: "PIA acquisition proposal computed compensation with 1.25x rural multiplier. Revenue records confirm plot falls inside Karjan Municipal Urban Development Authority (KMUDA) boundary, necessitating 1.0x factor.",
    descriptionHi: "प्रस्ताव में 1.25x ग्रामीण गुणक लगाया गया है जबकि भूमि शहरी विकास सीमा के भीतर है जहां 1.0x लागू होता है।",
    requiredAction: "Recalculate statutory award estimate in Schedule-I format and submit adjusted compensation outlay of ₹ 11.2 Cr.",
    status: "ACTION_REQUIRED",
  },
];

function PiaDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams ? searchParams.get("tab") : null;
  const requestedProjectId = searchParams ? searchParams.get("projectId") : null;
  const [currentTab, setCurrentTab] = useState<string>(requestedTab || "overview");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(requestedProjectId || "");

  useEffect(() => {
    const tab = requestedTab || "overview";
    if (tab !== currentTab) {
      setCurrentTab(tab);
    }
  }, [requestedTab, currentTab]);

  useEffect(() => {
    if (requestedProjectId && requestedProjectId !== selectedProjectId) {
      setSelectedProjectId(requestedProjectId);
    }
  }, [requestedProjectId, selectedProjectId]);

  const { lang, t } = useI18n();
  const isHi = lang === "hi";

  // Filter States
  const [selectedSector, setSelectedSector] = useState<string>("ALL");
  const [projectSearch, setProjectSearch] = useState("");
  const [parcelSearch, setParcelSearch] = useState("");
  const [selectedLandUse, setSelectedLandUse] = useState<string>("ALL");
  const [selectedParcels, setSelectedParcels] = useState<string[]>([]);

  // Modals
  const [isAlignmentModalOpen, setIsAlignmentModalOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [activeClarification, setActiveClarification] = useState<ClarificationItem | null>(null);
  const [clarificationResponseText, setClarificationResponseText] = useState("");
  const [clarificationsList, setClarificationsList] = useState<ClarificationItem[]>(CLARIFICATION_REQUESTS);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Alignment Form State
  const [alignProjectCode, setAlignProjectCode] = useState(PIA_PROJECTS[0].code);
  const [alignVersion, setAlignVersion] = useState("v2.1");
  const [alignBufferWidth, setAlignBufferWidth] = useState("70");
  const [alignRationale, setAlignRationale] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Live queries for database projects and parcels
  const { data: dbProjects = [] } = useProjectsQuery();
  const { data: dbParcels = [] } = useParcelsQuery();

  const activeProjects = useMemo(() => {
    if (dbProjects && dbProjects.length > 0) {
      return dbProjects.map((p) => {
        const areaHa = Number(p.totalAcquisitionAreaHa || 120);
        const parcelsCount = p.affectedParcelsCount || Math.max(80, Math.round(areaHa * 1.6));
        const lengthKm = (p as any).totalLengthKm || (p as any).corridorLengthKm || Math.max(18.5, +(areaHa * 0.55).toFixed(1));
        const bufferM = (p as any).bufferWidthM || (p.sector === "RAILWAYS" ? 50 : 60);

        return {
          id: p.id,
          code: p.projectCode,
          title: p.title,
          titleHi: p.title,
          sector: (p.sector === "RAILWAYS" ? "RAILWAY" : p.sector === "RENEWABLE_ENERGY" ? "INDUSTRIAL" : "HIGHWAY") as ProjectItem["sector"],
          state: p.state || "Karnataka",
          districts: p.districts && p.districts.length > 0 ? p.districts : ["Bengaluru Rural"],
          totalBudgetCr: Math.round(Number(p.estimatedBudgetINR || 4500000000) / 10000000),
          disbursedCr: Math.round((Number(p.estimatedBudgetINR || 4500000000) * 0.4) / 10000000),
          totalLengthKm: lengthKm,
          bufferWidthM: bufferM,
          totalParcels: parcelsCount,
          acquiredParcels: Math.round(parcelsCount * 0.6),
          areaHa: areaHa,
          progressPct: p.status === "COMPLETED" ? 100 : p.status === "PLANNING" ? 15 : 65,
          status: (p.status || "IN_PROGRESS") as ProjectItem["status"],
          timelineMonths: 36,
          leadOfficer: "Vikram Malhotra (CGM Tech)",
        };
      });
    }
    return PIA_PROJECTS;
  }, [dbProjects]);

  // Selected Project resolution
  const selectedProject = useMemo(() => {
    if (!activeProjects || activeProjects.length === 0) return PIA_PROJECTS[0];
    if (selectedProjectId) {
      const found = activeProjects.find((p) => p.id === selectedProjectId || p.code === selectedProjectId);
      if (found) return found;
    }
    return activeProjects[0];
  }, [activeProjects, selectedProjectId]);

  // Synchronize alignment form code with selected project
  useEffect(() => {
    if (selectedProject?.code) {
      setAlignProjectCode(selectedProject.code);
    }
  }, [selectedProject?.code]);

  // Dynamic Alignment Audit Versions for active project
  const projectVersions = useMemo(() => {
    if (selectedProject.code === PIA_PROJECTS[0].code) {
      return ALIGNMENT_VERSIONS;
    }
    return [
      {
        version: "v2.0 (Official Current)",
        date: "14 Jul 2026",
        uploadedBy: selectedProject.leadOfficer || "Vikram Malhotra (CGM Tech)",
        description: `Approved baseline alignment for ${selectedProject.title}. RoW Buffer: ${selectedProject.bufferWidthM}m across ${selectedProject.districts.join(", ")}.`,
        lengthKm: selectedProject.totalLengthKm,
        bufferM: selectedProject.bufferWidthM,
        totalParcels: selectedProject.totalParcels,
        affectedAreaHa: selectedProject.areaHa,
        familiesEstimated: Math.round(selectedProject.totalParcels * 0.35),
        status: "APPROVED" as const,
      },
      {
        version: "v1.1 (Interim Re-route)",
        date: "28 Feb 2026",
        uploadedBy: selectedProject.leadOfficer || "Vikram Malhotra (CGM Tech)",
        description: `Interim alignment variation minimizing environmental & settlement impact in ${selectedProject.districts[0] || "corridor"}.`,
        lengthKm: +(selectedProject.totalLengthKm * 1.02).toFixed(1),
        bufferM: selectedProject.bufferWidthM,
        totalParcels: Math.round(selectedProject.totalParcels * 1.06),
        affectedAreaHa: +(selectedProject.areaHa * 1.05).toFixed(1),
        familiesEstimated: Math.round(selectedProject.totalParcels * 0.39),
        status: "SUPERSEDED" as const,
      },
      {
        version: "v1.0 (DPR Baseline)",
        date: "10 Oct 2025",
        uploadedBy: "Pre-Feasibility GIS Cell",
        description: `Initial DPR corridor derived from satellite terrain DEM and preliminary survey data for ${selectedProject.code}.`,
        lengthKm: +(selectedProject.totalLengthKm * 0.98).toFixed(1),
        bufferM: selectedProject.bufferWidthM + 10,
        totalParcels: Math.round(selectedProject.totalParcels * 1.15),
        affectedAreaHa: +(selectedProject.areaHa * 1.1).toFixed(1),
        familiesEstimated: Math.round(selectedProject.totalParcels * 0.44),
        status: "SUPERSEDED" as const,
      },
    ];
  }, [selectedProject]);

  const activeParcels = useMemo(() => {
    if (dbParcels && dbParcels.length > 0) {
      return dbParcels.map((pr: any) => ({
        ulpin: pr.ulpin,
        surveyNo: pr.surveyNumber || pr.survey_number || "142/2A",
        village: pr.village || pr.village_name || "Doddaballapur",
        taluk: "Doddaballapur",
        district: pr.district || "Bengaluru Rural",
        totalAreaHa: Number(pr.totalAreaHa || pr.total_area_ha || 1.45),
        requiredAreaHa: Number(pr.totalAreaHa || pr.total_area_ha || 1.45) * 0.8,
        landUse: (pr.landUseCategory === "COMMERCIAL" ? "COMMERCIAL" : "IRRIGATED_AGRI") as AffectedParcel["landUse"],
        ownerMasked: pr.ownerMasked || pr.owner_name_masked || "Landowner",
        estimatedCompINR: Number(pr.estimatedMarketValueINR || pr.estimated_market_value_inr || 12500000),
        encumbranceStatus: (pr.isDisputed ? "TITLE_DISPUTE" : "UNENCUMBERED") as AffectedParcel["encumbranceStatus"],
        acquisitionStage: "Sec 11 Preliminary",
        linkedProject: "Bengaluru STRR Expressway",
      }));
    }
    return AFFECTED_PARCELS;
  }, [dbParcels]);

  // Tab switcher with optional project selection
  const handleTabChange = (tabId: string, projectId?: string) => {
    const targetProject = projectId || selectedProjectId;
    if (targetProject && (tabId === "alignments" || projectId)) {
      setSelectedProjectId(targetProject);
      router.push(`/dashboard/pia?tab=${tabId}&projectId=${targetProject}`, { scroll: false });
    } else {
      router.push(`/dashboard/pia?tab=${tabId}`, { scroll: false });
    }
  };

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return activeProjects.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(projectSearch.toLowerCase()) ||
        p.state.toLowerCase().includes(projectSearch.toLowerCase());
      const matchSector = selectedSector === "ALL" || p.sector === selectedSector;
      return matchSearch && matchSector;
    });
  }, [activeProjects, projectSearch, selectedSector]);

  // Filtered Parcels
  const filteredParcels = useMemo(() => {
    return activeParcels.filter((pr) => {
      const matchSearch =
        pr.ulpin.toLowerCase().includes(parcelSearch.toLowerCase()) ||
        pr.surveyNo.toLowerCase().includes(parcelSearch.toLowerCase()) ||
        pr.village.toLowerCase().includes(parcelSearch.toLowerCase()) ||
        pr.district.toLowerCase().includes(parcelSearch.toLowerCase());
      const matchUse = selectedLandUse === "ALL" || pr.landUse === selectedLandUse;
      return matchSearch && matchUse;
    });
  }, [activeParcels, parcelSearch, selectedLandUse]);

  // Handle Parcel Selection
  const toggleParcelSelect = (ulpin: string) => {
    setSelectedParcels((prev) =>
      prev.includes(ulpin) ? prev.filter((p) => p !== ulpin) : [...prev, ulpin]
    );
  };

  const selectAllParcels = () => {
    if (selectedParcels.length === filteredParcels.length) {
      setSelectedParcels([]);
    } else {
      setSelectedParcels(filteredParcels.map((p) => p.ulpin));
    }
  };

  // Handle Clarification Submission
  const handleClarificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClarification || !clarificationResponseText.trim()) return;

    setClarificationsList((prev) =>
      prev.map((c) =>
        c.id === activeClarification.id ? { ...c, status: "RESUBMITTED" } : c
      )
    );
    setActiveClarification(null);
    setClarificationResponseText("");
    showToast(isHi ? "स्पष्टीकरण एवं संशोधित दस्तावेज राज्य प्राधिकरण को सफलतापूर्वक प्रेषित किए गए!" : "Clarification & revised alignment successfully resubmitted to State Authority!");
  };

  // Handle Alignment Upload Simulation
  const handleUploadAlignment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAlignmentModalOpen(false);
    showToast(
      isHi
        ? `नया GeoJSON संरेखण अपलोड हुआ! GIS बफर द्वारा ${selectedProject.totalParcels.toLocaleString("en-IN")} भूखंड पुनः आकलित।`
        : `New GeoJSON alignment registered for ${selectedProject.title}! GIS buffer recalculated ${selectedProject.totalParcels.toLocaleString("en-IN")} intersecting parcels.`
    );
  };

  // Handle Acquisition Proposal Submission
  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProposalModalOpen(false);
    setSelectedParcels([]);
    showToast(isHi ? "भूमि अधिग्रहण प्रस्ताव राज्य राजस्व प्राधिकरण को समीक्षा हेतु आधिकारिक रूप से प्रस्तुत किया गया!" : "Formal Land Acquisition Proposal submitted to State Revenue Department for Section 11 review!");
  };

  // Export PIA Report PDF
  const handleExportPdf = () => {
    const p = selectedProject;
    const pdfData: PiaPdfData = {
      reportTitle: "PIA Infrastructure Land Acquisition & Alignment Requisition Review",
      agencyName: "National Highways Authority of India (NHAI)",
      projectName: p.title,
      projectCode: p.code,
      sector: p.sector,
      totalLengthKm: p.totalLengthKm,
      bufferWidthM: p.bufferWidthM,
      totalParcels: p.totalParcels,
      totalAreaHa: p.areaHa,
      estimatedCostCr: p.totalBudgetCr,
      disbursedCostCr: p.disbursedCr,
      timelineMonths: p.timelineMonths,
      affectedDistricts: p.districts,
      packages: [
        { name: `Package 1: ${p.districts[0] || "Main"} Corridor Sector`, targetHa: Math.round(p.areaHa * 0.4), acquiredHa: Math.round(p.areaHa * 0.4 * (p.progressPct / 100)), status: "IN_PROGRESS", progressPct: p.progressPct },
        { name: `Package 2: ${p.districts[1] || p.districts[0] || "Secondary"} Feeder Link`, targetHa: Math.round(p.areaHa * 0.35), acquiredHa: Math.round(p.areaHa * 0.35 * (p.progressPct / 100)), status: "IN_PROGRESS", progressPct: p.progressPct },
        { name: `Package 3: Terminal Node & Bypass`, targetHa: Math.round(p.areaHa * 0.25), acquiredHa: Math.round(p.areaHa * 0.25 * (p.progressPct / 100)), status: "IN_PROGRESS", progressPct: p.progressPct },
      ],
    };
    generatePiaProjectReportPdf(pdfData);
    showToast(isHi ? "पीआईए परियोजना रिपोर्ट (PDF) डाउनलोड की गई।" : "Official PIA Project Requisition Report PDF generated.");
  };

  // Chart Mock Data
  const parcelMonthlyTimeline = [
    { month: "Jan 26", notified: 180, acquired: 120 },
    { month: "Feb 26", notified: 360, acquired: 260 },
    { month: "Mar 26", notified: 540, acquired: 410 },
    { month: "Apr 26", notified: 780, acquired: 620 },
    { month: "May 26", notified: 980, acquired: 890 },
    { month: "Jun 26", notified: 1140, acquired: 1080 },
    { month: "Jul 26", notified: 1240, acquired: 1180 },
  ];

  const budgetExpenditureData = [
    { name: "Vadodara Spur", sanctioned: 4200, disbursed: 3450 },
    { name: "WDFC Feeder", sanctioned: 3800, disbursed: 2950 },
    { name: "Dholera Cargo", sanctioned: 2400, disbursed: 2100 },
    { name: "Sanand Logistics", sanctioned: 1600, disbursed: 850 },
    { name: "Metro Ph-2", sanctioned: 1950, disbursed: 1780 },
  ];

  const stageFunnelData = [
    { stage: "Sec 4 SIA", parcels: 1240, color: "#ef5b2a" },
    { stage: "Sec 11 Notice", parcels: 1180, color: "#f59e0b" },
    { stage: "Sec 15 Inquiry", parcels: 1090, color: "#6366f1" },
    { stage: "Sec 19 Decl", parcels: 1040, color: "#8b5cf6" },
    { stage: "Sec 23 Award", parcels: 980, color: "#10b981" },
    { stage: "Sec 38 Possess", parcels: 860, color: "#15803d" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#171716] text-[#fffdf8] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#d8d3c9] animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* 1. PIA APEX IDENTITY & REQUISITION BANNER */}
      <div className="bg-[#fffdf8] border border-[#d8d3c9] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-[#ef5b2a]/10 text-[#ef5b2a] border border-[#ef5b2a]/30 font-bold text-xs py-0.5 px-2.5 rounded-full flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-[#ef5b2a]" />
                {isHi ? "परियोजना कार्यान्वयन एजेंसी (PIA)" : "Project Implementing Agency (PIA)"}
              </Badge>
              <span className="text-xs text-[#68655e] font-semibold">
                {isHi ? "भारतीय राष्ट्रीय राजमार्ग प्राधिकरण (NHAI) • गुजरात क्षेत्रीय कार्यालय" : "National Highways Authority of India (NHAI) • Western Region"}
              </span>
              <span className="text-xs text-[#d8d3c9] hidden sm:inline">•</span>
              <span className="text-xs text-emerald-700 font-mono font-bold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {isHi ? "सक्षम परियोजनाकर्ता: PIA-NHAI-GUJ-04" : "PIA Key: PIA-NHAI-GUJ-04"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171716] flex items-center gap-2.5">
              <span>{isHi ? "पीआईए अवसंरचना परियोजना एवं भूमि अधिग्रहण कमान केंद्र" : "PIA Infrastructure Requisition & Acquisition Command Center"}</span>
            </h1>

            <p className="text-xs text-[#68655e] max-w-3xl leading-relaxed">
              {isHi
                ? "राष्ट्रीय राजमार्ग, समर्पित फ्रेट कॉरिडोर एवं लॉजिस्टिक्स परियोजनाओं के लिए संरेखण (GeoJSON) नियोजन, प्रभावित भूखंड चयन, अधिग्रहण प्रस्ताव प्रेषण एवं राज्य-जिला समन्वय पीठ।"
                : "Authoritative project execution workspace: manage corridor alignments, assess intersecting cadastral parcels, submit RFCTLARR acquisition proposals, and resolve state revenue clarifications."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              onClick={() => setIsAlignmentModalOpen(true)}
              variant="outline"
              size="sm"
              className="h-9 text-xs flex items-center gap-1.5 border-[#d8d3c9] bg-[#fffdf8] hover:bg-[#f4f1ea] text-[#171716] rounded-full shadow-sm"
            >
              <Upload className="h-3.5 w-3.5 text-[#ef5b2a]" />
              <span>{isHi ? "GeoJSON संरेखण फ़ाइल अपलोड" : "Upload GeoJSON Corridor File"}</span>
            </Button>

            <Link href="/projects/new">
              <Button
                size="sm"
                className="h-9 text-xs flex items-center gap-1.5 bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold rounded-full shadow-sm"
              >
                <Plus className="h-3.5 w-3.5 text-[#ef5b2a]" />
                <span>{isHi ? "नया प्रोजेक्ट बनाएं" : "Create New Project"}</span>
              </Button>
            </Link>

            <Button
              onClick={handleExportPdf}
              size="sm"
              variant="outline"
              className="h-9 text-xs flex items-center gap-1.5 border-[#d8d3c9] hover:bg-[#f4f1ea] text-[#171716] font-bold rounded-full"
            >
              <Download className="h-3.5 w-3.5 text-[#ef5b2a]" />
              <span>{isHi ? "परियोजना रिपोर्ट (PDF)" : "Export Dossier (PDF)"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DOMAIN: UNIFIED CORRIDOR DELAY RISK & BOTTLENECK RADAR                   */}
      {/* ========================================================================= */}
      {(currentTab === "delay-risk" || currentTab === "risks") && (
        <div className="space-y-8">
          {/* 1. ML 90-Day Delay Predictor & What-If Simulator */}
          <RoleBasedDelayIntelligence />

          {/* 2. Critical Path & Milestone Delay Radar Cards */}
          <div className="space-y-4 pt-4 border-t border-[#d8d3c9] dark:border-slate-800">
            <div className="bg-[#fffdf8] dark:bg-slate-900 border border-[#d8d3c9] dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#171716] dark:text-white">
                      {isHi ? "क्रिटिकल पाथ एवं माइलस्टोन विलंब रडार" : "Critical Path & Milestone Delay Radar"}
                    </h3>
                    <p className="text-xs text-[#68655e] dark:text-slate-400">
                      {isHi
                        ? "वैधानिक अधिग्रहण मील के पत्थरों में पूर्वानुमानात्मक जोखिम संकेतक। वाणिज्यिक परिचालन समयसीमा से पहले प्रोजेक्ट बाधाओं की पहचान।"
                        : "Predictive risk indicators across statutory acquisition milestones. Flags project bottlenecks before critical commercial operations deadlines are missed."}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-400 font-mono text-[10px]">
                  Corridor Level
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-[#fffdf8] dark:bg-slate-900 border border-[#d8d3c9] dark:border-slate-800 shadow-sm rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#171716] dark:text-white">Vadodara Spur Link</span>
                  <Badge className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 font-mono text-[10px]">Delay Risk: 42/100</Badge>
                </div>
                <p className="text-xs text-[#68655e] dark:text-slate-300">
                  Delay bottleneck at Section 15 objection hearing due to Karjan canal crossing revision.
                </p>
                <div className="p-2.5 rounded-xl bg-[#f4f1ea] dark:bg-slate-800 border border-[#d8d3c9] dark:border-slate-700 text-[11px] text-[#171716] dark:text-slate-200">
                  <strong>Recommended Mitigation:</strong> Convene joint field visit with Bharuch Collectorate and submit culvert design.
                </div>
              </Card>

              <Card className="bg-[#fffdf8] dark:bg-slate-900 border border-[#d8d3c9] dark:border-slate-800 shadow-sm rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#171716] dark:text-white">Western DFC Feeder</span>
                  <Badge className="bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 font-mono text-[10px]">Delay Risk: 68/100</Badge>
                </div>
                <p className="text-xs text-[#68655e] dark:text-slate-300">
                  Stage-I Forest clearance pending with Regional Office. 14.8 Ha mangrove land stalling Section 19 declaration.
                </p>
                <div className="p-2.5 rounded-xl bg-[#f4f1ea] dark:bg-slate-800 border border-[#d8d3c9] dark:border-slate-700 text-[11px] text-[#171716] dark:text-slate-200">
                  <strong>Recommended Mitigation:</strong> Escalate via Central PMG portal to Ministry of Environment & Forests.
                </div>
              </Card>

              <Card className="bg-[#fffdf8] dark:bg-slate-900 border border-[#d8d3c9] dark:border-slate-800 shadow-sm rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#171716] dark:text-white">Dholera Airport Cargo</span>
                  <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 font-mono text-[10px]">Delay Risk: 12/100</Badge>
                </div>
                <p className="text-xs text-[#68655e] dark:text-slate-300">
                  On track. 90% parcels possessed under Section 38. Physical possession handed over for runway earthwork.
                </p>
                <div className="p-2.5 rounded-xl bg-[#f4f1ea] dark:bg-slate-800 border border-[#d8d3c9] dark:border-slate-700 text-[11px] text-[#171716] dark:text-slate-200">
                  <strong>Recommended Mitigation:</strong> Complete final disbursement of R&R annuities to remaining 18 families.
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOMAIN 1: OVERVIEW DASHBOARD                                              */}
      {/* ========================================================================= */}
      {currentTab === "overview" && (
        <div className="space-y-6">
          {/* 8 Macro KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
            <StatCard
              title={isHi ? "मेरी कुल परियोजनाएं" : "My Projects"}
              value="6"
              subtext={isHi ? "4 सक्रिय • 1 पूर्ण • 1 ड्राफ्ट" : "4 Active • 1 Completed • 1 Draft"}
              icon={Building2}
              variant="amber"
            />
            <StatCard
              title={isHi ? "कुल प्रभावित भूखंड" : "Affected Parcels"}
              value="4,280"
              subtext={isHi ? "2,740 अधिग्रहीत (64.0%)" : "2,740 Acquired (64.0%)"}
              icon={Layers}
              variant="default"
            />
            <StatCard
              title={isHi ? "आवश्यक भूमि क्षेत्र" : "Required Land Extent"}
              value="1,840.4 Ha"
              subtext={isHi ? "6 प्रमुख गतिशक्ति गलियारे" : "Across 6 Key Infrastructure Corridors"}
              icon={Compass}
              variant="amber"
            />
            <StatCard
              title={isHi ? "स्वीकृत पूंजी बजट" : "Sanctioned Budget"}
              value={formatCompactINR(154000000000)}
              subtext={isHi ? "₹ 11,230 Cr संवितरित (PFMS)" : "₹ 11,230 Cr Disbursed (PFMS)"}
              icon={Coins}
              variant="green"
            />
          </div>

          {/* Pending Clarifications Alert Banner */}
          {clarificationsList.some((c) => c.status === "ACTION_REQUIRED") && (
            <div className="bg-[#fffdf8] border-2 border-[#ef5b2a]/30 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-[#ef5b2a]/10 text-[#ef5b2a] border border-[#ef5b2a]/20 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#171716] flex items-center gap-2">
                    <span>{isHi ? "राज्य एवं जिला अधिकारियों से 3 स्पष्टीकरण अनुरोध लंबित हैं" : "3 Clarification Requests Awaiting PIA Response"}</span>
                    <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold">Action Required</Badge>
                  </h3>
                  <p className="text-xs text-[#68655e] mt-0.5 max-w-2xl">
                    {isHi
                      ? "भरूच कलेक्टर ने चेनेज 42+200 पर जल निकासी नाले के अतिव्यापन पर आपत्ति दर्ज की है। धारा 11 अधिसूचना जारी करने हेतु तत्काल संरेखण सुधार अनिवार्य है।"
                      : "Collector Bharuch & State Revenue Dept have flagged critical alignment overlaps and clearance requirements before Section 11 gazette notification can proceed."}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => handleTabChange("clarifications")}
                className="bg-[#ef5b2a] hover:bg-[#d94e20] text-white text-xs font-bold rounded-full shrink-0 shadow-sm"
              >
                <span>{isHi ? "स्पष्टीकरण निस्तारित करें" : "Resolve Clarifications"}</span>
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          )}

          {/* Active Corridors Snapshot Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeProjects.slice(0, 3).map((prj) => (
              <div
                key={prj.id}
                onClick={() => handleTabChange("alignments", prj.id)}
                className="p-3.5 bg-[#fffdf8] border border-[#d8d3c9] rounded-2xl flex items-center justify-between shadow-sm hover:border-[#171716] cursor-pointer transition-all group"
                title={isHi ? `${prj.title} का अलाइनमेंट देखें` : `View alignment for ${prj.title}`}
              >
                <div>
                  <span className="text-[10px] text-[#68655e] uppercase font-bold group-hover:text-[#ef5b2a] transition-colors">
                    {prj.sector} Corridor
                  </span>
                  <p className="text-xs font-black text-[#171716] mt-0.5 group-hover:text-[#ef5b2a] transition-colors">{prj.title}</p>
                  <p className="text-[10px] text-[#68655e]">{prj.districts.join(", ")} • {prj.totalLengthKm} Km</p>
                </div>
                <Badge variant="civic" className="text-[10px]">{prj.progressPct}% Acquired</Badge>
              </div>
            ))}
          </div>

          {/* Visual Charts Row: Acquisition Timeline & Budget Outlay */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-7 bg-[#fffdf8] border border-[#d8d3c9] shadow-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-[#171716] flex items-center justify-between">
                  <span>{isHi ? "मासिक भूमि अधिग्रहण प्रगति (हेक्टेयर)" : "Monthly Parcel Acquisition Progress (Cumulative Hectares)"}</span>
                  <Badge variant="outline" className="text-[10px] text-emerald-800 border-emerald-300 bg-emerald-50">
                    +14.2% MoM
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-[#68655e]">
                  {isHi ? "अधिसूचित लक्ष्य बनाम भौतिक कब्जा प्राप्त हेक्टेयर" : "Statutorily notified hectares vs physically possessed land"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={parcelMonthlyTimeline}>
                      <defs>
                        <linearGradient id="notifiedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#171716" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#171716" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="acquiredGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef5b2a" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#ef5b2a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                      <XAxis dataKey="month" stroke="#68655e" fontSize={11} />
                      <YAxis stroke="#68655e" fontSize={11} unit=" Ha" />
                      <Tooltip contentStyle={{ backgroundColor: "#fffdf8", borderColor: "#d8d3c9", borderRadius: "12px", fontSize: "12px" }} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Area type="monotone" dataKey="notified" name="Notified Extent" stroke="#171716" strokeWidth={2} fill="url(#notifiedGrad)" />
                      <Area type="monotone" dataKey="acquired" name="Possessed Extent" stroke="#ef5b2a" strokeWidth={2.5} fill="url(#acquiredGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-5 bg-[#fffdf8] border border-[#d8d3c9] shadow-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-[#171716] flex items-center justify-between">
                  <span>{isHi ? "परियोजना बजट बनाम वास्तविक संवितरण" : "Budget vs PFMS Expenditure"}</span>
                  <span className="text-xs font-mono font-bold text-[#ef5b2a]">₹ in Cr</span>
                </CardTitle>
                <CardDescription className="text-xs text-[#68655e]">
                  {isHi ? "प्रत्येक पैकेज हेतु स्वीकृत मुआवजा बनाम प्रत्यक्ष बैंक भुगतान" : "Sanctioned compensation outlay vs actual PFMS DBT transfers"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={budgetExpenditureData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" />
                      <XAxis dataKey="name" stroke="#68655e" fontSize={10} />
                      <YAxis stroke="#68655e" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: "#fffdf8", borderColor: "#d8d3c9", borderRadius: "12px", fontSize: "12px" }} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Bar dataKey="sanctioned" name="Sanctioned Outlay" fill="#171716" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="disbursed" name="PFMS Disbursed" fill="#ef5b2a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statutory Funnel Distribution */}
          <Card className="bg-[#fffdf8] border border-[#d8d3c9] shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-[#171716] flex items-center justify-between">
                <span>{isHi ? "वैधानिक अधिग्रहण चरण स्थिति (RFCTLARR 2013)" : "Statutory Stage Funnel Distribution (RFCTLARR Act, 2013)"}</span>
                <span className="text-xs text-[#68655e] font-medium">{isHi ? "वडोदरा-सूरत एक्सप्रेसवे लिंक • कुल 1,240 भूखंड" : "Vadodara-Surat Link • 1,240 Total Parcels"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {stageFunnelData.map((item, idx) => (
                  <div key={item.stage} className="p-3.5 rounded-xl border border-[#d8d3c9] bg-[#f4f1ea]/60 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#171716]">{item.stage}</span>
                      <span className="text-[10px] text-[#68655e] font-mono">Stage {idx + 1}</span>
                    </div>
                    <div>
                      <div className="text-2xl font-black font-mono text-[#171716]">{item.parcels}</div>
                      <div className="text-[10px] text-[#68655e]">{Math.round((item.parcels / 1240) * 100)}% of corridor scope</div>
                    </div>
                    <div className="w-full bg-[#d8d3c9] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#ef5b2a] h-full rounded-full" style={{ width: `${(item.parcels / 1240) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOMAIN 2: MY PROJECTS CATALOG                                             */}
      {/* ========================================================================= */}
      {currentTab === "projects" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fffdf8] p-4 rounded-2xl border border-[#d8d3c9] shadow-sm">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="h-4 w-4 text-[#68655e]" />
              <Input
                placeholder={isHi ? "प्रोजेक्ट नाम, कोड या राज्य खोजें..." : "Search projects by title, code, or state..."}
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="h-9 text-xs border-[#d8d3c9] bg-[#f4f1ea]/40 focus:bg-white rounded-xl"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#68655e] font-medium flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Sector:
              </span>
              {["ALL", "HIGHWAY", "RAILWAY", "AIRPORT", "INDUSTRIAL", "METRO", "IRRIGATION"].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSector(sec)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                    selectedSector === sec
                      ? "bg-[#171716] text-[#fffdf8]"
                      : "bg-[#f4f1ea] text-[#68655e] hover:text-[#171716] border border-[#d8d3c9]"
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((prj) => (
              <Card key={prj.id} className="bg-[#fffdf8] border border-[#d8d3c9] shadow-sm rounded-2xl hover:border-[#171716]/40 transition-all flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono border-[#d8d3c9] bg-[#f4f1ea] text-[#171716]">
                      {prj.code}
                    </Badge>
                    <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      prj.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                        : prj.status === "IN_PROGRESS"
                        ? "bg-[#ef5b2a]/10 text-[#ef5b2a] border border-[#ef5b2a]/30"
                        : "bg-[#f4f1ea] text-[#171716] border border-[#d8d3c9]"
                    }`}>
                      {prj.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-[#171716] pt-2 leading-snug">
                    {isHi ? prj.titleHi : prj.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-[#68655e]">
                    {prj.state} • {prj.districts.join(", ")}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-2 gap-2 text-xs border-y border-[#d8d3c9] py-2.5">
                    <div>
                      <span className="text-[10px] text-[#68655e] block">Length & RoW</span>
                      <span className="font-bold font-mono text-[#171716]">{prj.totalLengthKm} km ({prj.bufferWidthM}m)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#68655e] block">Land Required</span>
                      <span className="font-bold font-mono text-[#171716]">{prj.areaHa} Ha</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#68655e] block">Budget Outlay</span>
                      <span className="font-bold font-mono text-[#171716]">₹ {prj.totalBudgetCr.toLocaleString()} Cr</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#68655e] block">Parcels</span>
                      <span className="font-bold font-mono text-[#171716]">{prj.acquiredParcels} / {prj.totalParcels}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-[#68655e]">Acquisition Velocity</span>
                      <span className="font-bold font-mono text-[#171716]">{prj.progressPct}%</span>
                    </div>
                    <div className="w-full bg-[#d8d3c9] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#ef5b2a] h-full rounded-full" style={{ width: `${prj.progressPct}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[11px] text-[#68655e]">Lead: {prj.leadOfficer.split(" ")[0]}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTabChange("alignments", prj.id)}
                      className="h-7 text-xs border-[#d8d3c9] hover:bg-[#f4f1ea] rounded-full"
                    >
                      <span>{isHi ? "संरेखण देखें" : "View Alignment"}</span>
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOMAIN 3: PROJECT ALIGNMENTS & GIS ENGINE                                  */}
      {/* ========================================================================= */}
      {currentTab === "alignments" && (
        <div className="space-y-6">
          <div className="bg-[#fffdf8] border border-[#d8d3c9] rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#171716]">{isHi ? "गतिशक्ति गलियारा संरेखण एवं बफर इंजन" : "Corridor Alignment & Buffer Engine"}</h2>
              <p className="text-xs text-[#68655e]">
                {isHi
                  ? "GeoJSON संरेखण फाइलें प्रबंधित करें, राइट-ऑफ-वे बफर चौड़ाई (40m - 120m) सेट करें और कैडस्ट्रल पार्सल प्रतिच्छेदन ट्रैक करें।"
                  : "Manage GeoJSON alignment files, specify Right-of-Way buffer widths (40m - 120m), track version history, and trigger automated cadastral parcel intersection."}
              </p>
            </div>
            <Button
              onClick={() => {
                setAlignProjectCode(selectedProject.code);
                setIsAlignmentModalOpen(true);
              }}
              className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold text-xs rounded-full shadow-sm flex items-center gap-1.5"
            >
              <Upload className="h-3.5 w-3.5 text-[#ef5b2a]" />
              <span>{isHi ? "संशोधित संरेखण अपलोड करें" : "Upload Revised Alignment"}</span>
            </Button>
          </div>

          {/* Project Switcher Bar */}
          <div className="bg-[#fffdf8] border border-[#d8d3c9] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
              <label htmlFor="alignment-project-selector" className="text-xs font-bold text-[#171716] whitespace-nowrap flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-[#ef5b2a]" />
                <span>{isHi ? "सक्रिय परियोजना चुनें:" : "Select Active Project:"}</span>
              </label>
              <select
                id="alignment-project-selector"
                value={selectedProject.id}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedProjectId(newId);
                  router.push(`/dashboard/pia?tab=alignments&projectId=${newId}`, { scroll: false });
                }}
                className="bg-[#f4f1ea] border border-[#d8d3c9] text-xs font-bold text-[#171716] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ef5b2a] flex-1 md:w-80 cursor-pointer"
              >
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="text-[10px] font-mono border-[#d8d3c9] bg-[#f4f1ea] text-[#171716]">
                {selectedProject.code}
              </Badge>
              <Badge className="bg-[#ef5b2a]/10 text-[#ef5b2a] border border-[#ef5b2a]/30 text-[10px] font-bold">
                {selectedProject.sector}
              </Badge>
              <span className="text-[#68655e] text-xs font-medium">
                {selectedProject.state} ({selectedProject.districts.join(", ")})
              </span>
            </div>
          </div>

          {/* Active Alignment Detail Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-8 bg-[#fffdf8] border border-[#d8d3c9] shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-[10px]">
                    CURRENT APPROVED BASELINE (v2.0)
                  </Badge>
                  <span className="text-xs text-[#68655e] font-mono">
                    Status: <span className="font-bold text-[#171716]">{selectedProject.status.replace("_", " ")}</span>
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-[#171716] pt-1">
                  {selectedProject.title} Alignment
                </CardTitle>
                <CardDescription className="text-xs text-[#68655e]">
                  {selectedProject.totalLengthKm} km corridor traversing {selectedProject.districts.length} district{selectedProject.districts.length > 1 ? "s" : ""} ({selectedProject.districts.join(", ")}) with a {selectedProject.bufferWidthM}m Right-of-Way buffer.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* GIS Preview Mock Map Placeholder */}
                <div className="h-56 w-full rounded-xl bg-[#eae6dc]/80 border border-[#d8d3c9] flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <Compass className="h-8 w-8 text-[#ef5b2a] animate-spin" style={{ animationDuration: "12s" }} />
                  <span className="text-xs font-bold text-[#171716]">GIS Web Map Feature Service Synchronized (EPSG:4326)</span>
                  <p className="text-[11px] text-[#68655e] max-w-md">
                    Polygon buffer overlay calculated across {selectedProject.totalParcels.toLocaleString("en-IN")} registered revenue survey parcels in {selectedProject.state} ({selectedProject.districts.join(", ")}). Connected to state land records database.
                  </p>
                  <Link href={`/gis?project=${encodeURIComponent(selectedProject.id)}&city=${encodeURIComponent(selectedProject.districts?.[0] || selectedProject.state || "Bengaluru")}`}>
                    <Button size="sm" variant="outline" className="h-7 text-xs border-[#d8d3c9] bg-white rounded-full mt-2">
                      <Map className="h-3.5 w-3.5 text-[#ef5b2a] mr-1" />
                      <span>{isHi ? "पूर्ण जीआईएस केंद्र खोलें" : "Open Full Interactive GIS Center"}</span>
                    </Button>
                  </Link>
                </div>

                {/* Spatial Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9]">
                    <span className="text-[10px] text-[#68655e] block">{isHi ? "कुल लंबाई" : "Total Length"}</span>
                    <span className="font-black text-[#171716] font-mono">{selectedProject.totalLengthKm} km</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9]">
                    <span className="text-[10px] text-[#68655e] block">{isHi ? "आरओडब्ल्यू बफर" : "RoW Buffer"}</span>
                    <span className="font-black text-[#171716] font-mono">{selectedProject.bufferWidthM} meters</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9]">
                    <span className="text-[10px] text-[#68655e] block">{isHi ? "प्रभावित भूखंड" : "Intersecting Parcels"}</span>
                    <span className="font-black text-[#171716] font-mono">{selectedProject.totalParcels.toLocaleString("en-IN")} Plots</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9]">
                    <span className="text-[10px] text-[#68655e] block">{isHi ? "प्रभावित परिवार (PAPs)" : "Affected Families"}</span>
                    <span className="font-black text-[#171716] font-mono">{Math.round(selectedProject.totalParcels * 0.35).toLocaleString("en-IN")} PAPs</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Version History Log */}
            <Card className="lg:col-span-4 bg-[#fffdf8] border border-[#d8d3c9] shadow-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-[#171716]">{isHi ? "संरेखण ऑडिट संस्करण" : "Alignment Audit Versions"}</CardTitle>
                <CardDescription className="text-xs text-[#68655e]">
                  {isHi ? "प्रत्येक परिवर्तन समय-मुद्रित और गणना अंतर के साथ दर्ज है।" : "All changes are timestamped with recalculation diffs."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {projectVersions.map((ver) => (
                  <div key={ver.version} className="p-3 rounded-xl border border-[#d8d3c9] bg-[#f4f1ea]/50 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#171716]">{ver.version}</span>
                      <Badge variant="outline" className="text-[9px] border-[#d8d3c9]">{ver.date}</Badge>
                    </div>
                    <p className="text-[11px] text-[#68655e]">{ver.description}</p>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-[#171716] font-mono">
                      <span>{ver.lengthKm} km • {ver.totalParcels} parcels</span>
                      <span className={ver.status === "APPROVED" ? "text-emerald-700 font-bold" : "text-[#68655e]"}>{ver.status}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOMAIN 4: AFFECTED PARCELS EXPLORER                                       */}
      {/* ========================================================================= */}
      {currentTab === "parcels" && (
        <div className="space-y-6">
          {/* Action & Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#fffdf8] p-4 rounded-2xl border border-[#d8d3c9] shadow-sm">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="h-4 w-4 text-[#68655e]" />
              <Input
                placeholder="Search by 14-digit ULPIN, Survey/Khasra, Village, or Taluk..."
                value={parcelSearch}
                onChange={(e) => setParcelSearch(e.target.value)}
                className="h-9 text-xs border-[#d8d3c9] bg-[#f4f1ea]/40 focus:bg-white rounded-xl"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#68655e] font-medium flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Land Use:
              </span>
              {["ALL", "IRRIGATED_AGRI", "DRY_AGRI", "COMMERCIAL", "FOREST", "GOVT_SCRUB"].map((use) => (
                <button
                  key={use}
                  onClick={() => setSelectedLandUse(use)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                    selectedLandUse === use
                      ? "bg-[#171716] text-[#fffdf8]"
                      : "bg-[#f4f1ea] text-[#68655e] hover:text-[#171716] border border-[#d8d3c9]"
                  }`}
                >
                  {use.replace("_", " ")}
                </button>
              ))}
            </div>

            {selectedParcels.length > 0 && (
              <Button
                size="sm"
                onClick={() => setIsProposalModalOpen(true)}
                className="bg-[#ef5b2a] hover:bg-[#d94e20] text-white text-xs font-bold rounded-full shadow-sm"
              >
                <span>Draft Proposal ({selectedParcels.length} Selected)</span>
                <Send className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            )}
          </div>

          {/* Parcels Table Card */}
          <Card className="bg-[#fffdf8] border border-[#d8d3c9] shadow-sm rounded-2xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#171716]">
                  Intersecting Cadastral Parcels ({filteredParcels.length})
                </CardTitle>
                <CardDescription className="text-xs text-[#68655e]">
                  Linked to State Revenue Land Records (Bhoomi / Bhu-Naksha). Authorized read-only verification.
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={selectAllParcels}
                className="h-8 text-xs border-[#d8d3c9] rounded-full"
              >
                {selectedParcels.length === filteredParcels.length ? "Deselect All" : "Select All"}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#d8d3c9] text-[#68655e] font-semibold bg-[#f4f1ea]/60">
                      <th className="p-3 w-10">Select</th>
                      <th className="p-3">ULPIN / Survey No</th>
                      <th className="p-3">Village & Taluk</th>
                      <th className="p-3">Land Extent</th>
                      <th className="p-3">Land Use</th>
                      <th className="p-3">Owner / Khatedar</th>
                      <th className="p-3">Est. Compensation</th>
                      <th className="p-3">Encumbrance</th>
                      <th className="p-3">Acquisition Stage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d8d3c9]/70">
                    {filteredParcels.map((pr) => {
                      const isSelected = selectedParcels.includes(pr.ulpin);
                      return (
                        <tr key={pr.ulpin} className={`hover:bg-[#f4f1ea]/40 transition-colors ${isSelected ? "bg-[#ef5b2a]/5" : ""}`}>
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleParcelSelect(pr.ulpin)}
                              className="rounded border-[#d8d3c9] text-[#ef5b2a] focus:ring-[#ef5b2a]"
                            />
                          </td>
                          <td className="p-3">
                            <div className="font-mono font-bold text-[#171716]">{pr.ulpin}</div>
                            <div className="text-[10px] text-[#68655e]">Survey #{pr.surveyNo}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-[#171716]">{pr.village}</div>
                            <div className="text-[10px] text-[#68655e]">{pr.taluk}, {pr.district}</div>
                          </td>
                          <td className="p-3 font-mono">
                            <div>{pr.requiredAreaHa} Ha</div>
                            <div className="text-[10px] text-[#68655e]">of {pr.totalAreaHa} Ha</div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-[10px] border-[#d8d3c9] bg-[#f4f1ea]">
                              {pr.landUse.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="p-3 font-medium text-[#171716]">
                            {pr.ownerMasked}
                          </td>
                          <td className="p-3 font-mono font-bold text-[#171716]">
                            {formatINR(pr.estimatedCompINR)}
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              pr.encumbranceStatus === "UNENCUMBERED"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : "bg-amber-50 text-amber-800 border-amber-300"
                            }`}>
                              {pr.encumbranceStatus}
                            </span>
                          </td>
                          <td className="p-3">
                            <Badge className="bg-[#171716] text-[#fffdf8] text-[10px]">
                              {pr.acquisitionStage}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOMAIN 5: CLARIFICATION REQUESTS WORKBENCH                                */}
      {/* ========================================================================= */}
      {currentTab === "clarifications" && (
        <div className="space-y-6">
          <div className="bg-[#fffdf8] border border-[#d8d3c9] rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-bold text-[#171716]">Government Clarification & Review Workbench</h2>
            <p className="text-xs text-[#68655e]">
              Official issues raised by the State Revenue Department or District Collector / CALA. Review observations, attach updated technical reports or revised alignments, and resubmit for gazette clearance.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {clarificationsList.map((req) => (
              <Card key={req.id} className="bg-[#fffdf8] border border-[#d8d3c9] shadow-sm rounded-2xl">
                <CardContent className="p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#d8d3c9] pb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs font-bold border-[#d8d3c9] bg-[#f4f1ea]">
                        {req.id}
                      </Badge>
                      <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        req.urgency === "CRITICAL"
                          ? "bg-rose-50 text-rose-800 border border-rose-300"
                          : "bg-amber-50 text-amber-800 border border-amber-300"
                      }`}>
                        {req.urgency} URGENCY
                      </Badge>
                      <span className="text-xs font-semibold text-[#68655e]">{req.sourceAuthority} ({req.authorityRole})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#68655e] font-mono">Raised: {req.dateRaised}</span>
                      <Badge className={`text-xs font-bold ${
                        req.status === "ACTION_REQUIRED"
                          ? "bg-rose-600 text-white"
                          : "bg-emerald-700 text-white"
                      }`}>
                        {req.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#171716]">
                      {isHi ? req.titleHi : req.title}
                    </h3>
                    <p className="text-xs text-[#68655e] mt-1 leading-relaxed">
                      {isHi ? req.descriptionHi : req.description}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9] text-xs space-y-1">
                    <span className="font-bold text-[#171716] flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 text-[#ef5b2a]" />
                      Mandated Government Action:
                    </span>
                    <p className="text-[#68655e] pl-4">{req.requiredAction}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-[#68655e] font-mono">Project: {req.projectCode}</span>
                    {req.status === "ACTION_REQUIRED" ? (
                      <Button
                        size="sm"
                        onClick={() => setActiveClarification(req)}
                        className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold text-xs rounded-full shadow-sm"
                      >
                        <Send className="h-3.5 w-3.5 mr-1.5 text-[#ef5b2a]" />
                        Respond & Resubmit to State
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Dossier Resubmitted to Authority
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}



      {/* ========================================================================= */}
      {/* DOMAIN 7: REPORTS & EXPORTS                                               */}
      {/* ========================================================================= */}
      {currentTab === "reports" && (
        <div className="space-y-6">
          <div className="bg-[#fffdf8] border border-[#d8d3c9] rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#171716]">Project Requisition Reports & Statutory Statements</h2>
              <p className="text-xs text-[#68655e]">
                Download official Land Requirement Statements (LRS), Schedule-I award drafts, alignment validation certificates, and DPR annexures for Cabinet submissions.
              </p>
            </div>
            <Button
              onClick={handleExportPdf}
              className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold text-xs rounded-full shadow-sm flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5 text-[#ef5b2a]" />
              <span>Download Official Dossier (PDF)</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-[#fffdf8] border border-[#d8d3c9] shadow-sm rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#ef5b2a]/10 text-[#ef5b2a] border border-[#ef5b2a]/20">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#171716]">Cadastral Land Requirement Statement (LRS)</h4>
                  <p className="text-xs text-[#68655e]">Schedule of 1,240 parcels with ULPINs, survey numbers, and estimated solatium.</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={handleExportPdf} className="h-8 text-xs border-[#d8d3c9] rounded-full">
                PDF
              </Button>
            </Card>

            <Card className="bg-[#fffdf8] border border-[#d8d3c9] shadow-sm rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#171716] text-[#fffdf8]">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#171716]">PFMS Compensation Reconciliation Schedule</h4>
                  <p className="text-xs text-[#68655e]">Direct Benefit Transfer logs across 980 validated bank accounts.</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={handleExportPdf} className="h-8 text-xs border-[#d8d3c9] rounded-full">
                PDF
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: UPLOAD REVISED ALIGNMENT (GEOJSON)                              */}
      {/* ========================================================================= */}
      {isAlignmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fffdf8] border border-[#d8d3c9] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#d8d3c9] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#171716] flex items-center gap-2">
                  <Upload className="h-4 w-4 text-[#ef5b2a]" />
                  Upload Project Alignment (GeoJSON / Shapefile)
                </h3>
                <p className="text-xs text-[#68655e]">Recalculates intersecting cadastral plots and PAP estimates.</p>
              </div>
              <button onClick={() => setIsAlignmentModalOpen(false)} className="text-[#68655e] hover:text-[#171716]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadAlignment} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#171716]">Select Infrastructure Project</label>
                <select
                  value={alignProjectCode}
                  onChange={(e) => setAlignProjectCode(e.target.value)}
                  className="w-full h-9 rounded-xl border border-[#d8d3c9] bg-white px-3 text-xs"
                >
                  {activeProjects.map((p) => (
                    <option key={p.code} value={p.code}>{p.title} ({p.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#171716]">New Version Tag</label>
                  <Input value={alignVersion} onChange={(e) => setAlignVersion(e.target.value)} className="h-9 text-xs border-[#d8d3c9]" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#171716]">Right-of-Way Buffer (Meters)</label>
                  <Input value={alignBufferWidth} onChange={(e) => setAlignBufferWidth(e.target.value)} className="h-9 text-xs border-[#d8d3c9]" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#171716]">GeoJSON / Shapefile Document</label>
                <div className="border-2 border-dashed border-[#d8d3c9] rounded-xl p-6 text-center hover:border-[#171716] transition-colors cursor-pointer bg-[#f4f1ea]/40">
                  <Upload className="h-6 w-6 text-[#ef5b2a] mx-auto mb-1" />
                  <span className="font-bold text-[#171716]">Click to attach alignment.geojson or drop files here</span>
                  <p className="text-[11px] text-[#68655e]">WGS84 EPSG:4326 • Maximum size 25MB</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#171716]">Revision Rationale & Engineering Justification</label>
                <Textarea
                  placeholder="Explain reason for alignment revision (e.g., canal avoidance, reducing residential displacement)..."
                  value={alignRationale}
                  onChange={(e) => setAlignRationale(e.target.value)}
                  className="text-xs border-[#d8d3c9] min-h-[70px]"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                <strong>Constitutional Notice:</strong> Alignments submitted by the PIA require formal Section 11 gazette notification by the State Revenue Authority before taking legal effect.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAlignmentModalOpen(false)} className="h-8 text-xs border-[#d8d3c9] rounded-full">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold rounded-full">
                  Recalculate & Submit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DRAFT ACQUISITION PROPOSAL                                       */}
      {/* ========================================================================= */}
      {isProposalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fffdf8] border border-[#d8d3c9] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#d8d3c9] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#171716] flex items-center gap-2">
                  <Send className="h-4 w-4 text-[#ef5b2a]" />
                  Submit Formal Land Acquisition Proposal
                </h3>
                <p className="text-xs text-[#68655e]">Routes to State Revenue Authority for Section 11 Preliminary Review.</p>
              </div>
              <button onClick={() => setIsProposalModalOpen(false)} className="text-[#68655e] hover:text-[#171716]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProposal} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9] space-y-2">
                <div className="flex items-center justify-between font-bold text-[#171716]">
                  <span>Bundled Parcel Requisition</span>
                  <Badge className="bg-[#171716] text-[#fffdf8]">{selectedParcels.length} Parcels Selected</Badge>
                </div>
                <div className="text-[11px] text-[#68655e]">
                  ULPINs: {selectedParcels.join(", ")}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#171716]">Project Requisition Docket Title</label>
                <Input defaultValue="Requisition Proposal for Package 4 (Karjan to Bharuch Section)" className="h-9 text-xs border-[#d8d3c9]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#171716]">Estimated Compensation Outlay</label>
                  <Input defaultValue="₹ 48,20,00,000" className="h-9 text-xs border-[#d8d3c9]" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#171716]">Target Possession Date</label>
                  <Input type="date" defaultValue="2027-03-31" className="h-9 text-xs border-[#d8d3c9]" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsProposalModalOpen(false)} className="h-8 text-xs border-[#d8d3c9] rounded-full">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs bg-[#ef5b2a] hover:bg-[#d94e20] text-white font-bold rounded-full shadow-sm">
                  Transmit to State Authority
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RESPOND TO CLARIFICATION REQUEST                                 */}
      {/* ========================================================================= */}
      {activeClarification && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fffdf8] border border-[#d8d3c9] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#d8d3c9] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#171716] flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-[#ef5b2a]" />
                  Respond to Official Clarification Request ({activeClarification.id})
                </h3>
                <p className="text-xs text-[#68655e]">{activeClarification.sourceAuthority}</p>
              </div>
              <button onClick={() => setActiveClarification(null)} className="text-[#68655e] hover:text-[#171716]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleClarificationSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1 text-amber-950">
                <div className="font-bold text-xs">{activeClarification.title}</div>
                <p className="text-[11px] text-amber-900">{activeClarification.description}</p>
                <div className="font-semibold text-[11px] pt-1 text-[#ef5b2a]">Required: {activeClarification.requiredAction}</div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#171716]">PIA Technical Explanation & Resolution Details</label>
                <Textarea
                  placeholder="Enter detailed engineering justification, hydraulic calculations, or revised alignment references..."
                  value={clarificationResponseText}
                  onChange={(e) => setClarificationResponseText(e.target.value)}
                  className="text-xs border-[#d8d3c9] min-h-[90px]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#171716]">Attach Corrected Document / Revised GeoJSON</label>
                <div className="border border-dashed border-[#d8d3c9] rounded-xl p-3 text-center bg-[#f4f1ea] cursor-pointer">
                  <span className="text-[11px] text-[#171716] font-semibold">Attach hydraulic_culvert_dwg_v2.pdf or revised alignment (Max 15MB)</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveClarification(null)} className="h-8 text-xs border-[#d8d3c9] rounded-full">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold rounded-full">
                  Submit Resolution to Authority
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PiaDashboardPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-12 text-center text-xs text-[#68655e]">Initializing PIA Infrastructure Dashboard...</div>}>
      <PiaDashboardContent />
    </Suspense>
  );
}
