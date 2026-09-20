"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatCard } from "@/components/common/stat-card";
import { formatINR, formatCompactINR, formatAreaHectares } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { generateDistrictOfficerPdf, DistrictPdfData } from "@/lib/pdf-generator";
import { useDistrictRosterQuery } from "@/hooks/queries/use-bhoomi-queries";
import { RoleBasedDelayIntelligence } from "@/components/ai/role-based-delay-intelligence";
import {
  Building,
  Clock,
  Camera,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  MapPin,
  Coins,
  FileSignature,
  HelpCircle,
  Download,
  Calendar,
  Layers,
  FileText,
  UserCheck,
  Search,
  ExternalLink,
  ChevronRight,
  FolderOpen,
  Filter,
  Check,
  X,
  Printer,
  Sparkles,
  Map as MapIcon,
} from "lucide-react";

// Types
interface SurveyItem {
  id: string;
  caseRef: string;
  project: string;
  projectHi?: string;
  ulpin: string;
  surveyNo: string;
  village: string;
  taluk: string;
  areaHa: number;
  surveyor: string;
  witnessCount: number;
  submittedDate: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  photoUrl: string;
  coords: string;
}

interface AwardItem {
  id: string;
  caseRef: string;
  project: string;
  projectHi?: string;
  ownerName: string;
  ulpin: string;
  surveyNo: string;
  landType: string;
  landTypeHi: string;
  areaHa: number;
  marketRateSqm: number;
  multiplier: number;
  solatium100Pct: number;
  totalAwardINR: number;
  status: "AWAITING_SIGNATURE" | "SIGNED" | "HOLD";
}

interface PossessionItem {
  id: string;
  caseRef: string;
  project: string;
  projectHi?: string;
  taluk: string;
  village: string;
  scheduledDate: string;
  parcelsCount: number;
  areaHa: number;
  revenueInspector: string;
  receivingAgency: string;
  status: "SCHEDULED" | "COMPLETED" | "NOTICE_ISSUED";
}

interface GrievanceItem {
  id: string;
  refNo: string;
  citizenName: string;
  caseRef: string;
  category: string;
  categoryHi: string;
  filingDate: string;
  hearingDate: string;
  status: "HEARING_SCHEDULED" | "RESOLVED" | "UNDER_ENQUIRY";
  description: string;
  descriptionHi: string;
}

function DistrictDashboardContent() {
  const { lang } = useI18n();
  const isHi = lang === "hi";
  const searchParams = useSearchParams();
  const requestedTab = searchParams ? searchParams.get("tab") : null;
  const [activeTab, setActiveTab] = useState<string>(requestedTab || "overview");

  useEffect(() => {
    const tab = requestedTab || "overview";
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [requestedTab, activeTab]);

  const [mounted, setMounted] = useState(false);

  // Modals state
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyItem | null>(null);
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);

  const [selectedAward, setSelectedAward] = useState<AwardItem | null>(null);
  const [awardModalOpen, setAwardModalOpen] = useState(false);
  const [signingAward, setSigningAward] = useState(false);

  const [selectedPossession, setSelectedPossession] = useState<PossessionItem | null>(null);
  const [possessionModalOpen, setPossessionModalOpen] = useState(false);
  const [newPossessionDate, setNewPossessionDate] = useState("2026-09-24");
  const [newInspector, setNewInspector] = useState("K. V. Ramesh (RI Doddaballapur)");

  const [selectedGrievance, setSelectedGrievance] = useState<GrievanceItem | null>(null);
  const [grievanceModalOpen, setGrievanceModalOpen] = useState(false);
  const [hearingRemarks, setHearingRemarks] = useState("");

  // Search and filter states
  const [surveyFilter, setSurveyFilter] = useState("ALL");
  const [surveySearch, setSurveySearch] = useState("");
  const [awardSearch, setAwardSearch] = useState("");
  const [grievanceSearch, setGrievanceSearch] = useState("");

  // Officer Profile
  const officerProfile = {
    name: isHi ? "श्री मंजुनाथ आर., आईएएस" : "Shri Manjunath R., IAS",
    title: isHi ? "उपायुक्त एवं जिला दंडाधिकारी (कलेक्टर)" : "Deputy Commissioner & District Magistrate",
    district: isHi ? "बेंगलुरु ग्रामीण जिला" : "Bengaluru Rural District",
    jurisdiction: isHi ? "4 तालुका (दोड्डबल्लापुर, देवनहल्ली, होसकोटे, नेलमंगला) • 540 भूखंड" : "4 Taluks (Doddaballapur, Devanahalli, Hosakote, Nelamangala) • 540 Land Plots",
    dscToken: "CCA Class-3 DSC Token (KA-BLR-0042) • VALID",
    calaRole: isHi ? "सक्षम प्राधिकारी भूमि अधिग्रहण (CALA) एवं एसडीएम अपीलीय प्रमुख" : "Competent Authority for Land Acquisition (CALA) & SDM Appellate Head",
  };

  // Live Backend District Roster Data
  const { data: rosterData } = useDistrictRosterQuery();

  // Survey Items
  const [surveys, setSurveys] = useState<SurveyItem[]>([
    {
      id: "SURV-101",
      caseRef: "LAC/2026/BLR-R/014",
      project: "Bengaluru STRR Ring Road Pkg 2",
      projectHi: "बेंगलुरु एसटीआरआर रिंग रोड पैकेज 2",
      ulpin: "KA-BLR-2026-0041",
      surveyNo: "142/2A",
      village: "Channapatna",
      taluk: "Doddaballapur",
      areaHa: 1.45,
      surveyor: "S. N. Kumar (Field Surveyor)",
      witnessCount: 3,
      submittedDate: "08 Sep 2026",
      status: "PENDING_APPROVAL",
      photoUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=700&auto=format&fit=crop&q=80",
      coords: "13.2941° N, 77.5335° E (Accuracy ±0.8m)",
    },
    {
      id: "SURV-102",
      caseRef: "LAC/2026/BLR-R/014",
      project: "Bengaluru STRR Ring Road Pkg 2",
      projectHi: "बेंगलुरु एसटीआरआर रिंग रोड पैकेज 2",
      ulpin: "KA-BLR-2026-0042",
      surveyNo: "143/1",
      village: "Channapatna",
      taluk: "Doddaballapur",
      areaHa: 0.85,
      surveyor: "S. N. Kumar (Field Surveyor)",
      witnessCount: 4,
      submittedDate: "08 Sep 2026",
      status: "PENDING_APPROVAL",
      photoUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=700&auto=format&fit=crop&q=80",
      coords: "13.2955° N, 77.5342° E (Accuracy ±0.6m)",
    },
    {
      id: "SURV-103",
      caseRef: "LAC/2026/BLR-R/015",
      project: "Bengaluru-Chennai Expressway Link",
      projectHi: "बेंगलुरु-चेन्नई एक्सप्रेसवे लिंक",
      ulpin: "KA-BLR-2026-0095",
      surveyNo: "88/3",
      village: "Budigere",
      taluk: "Devanahalli",
      areaHa: 2.1,
      surveyor: "R. Gopal (Head Surveyor)",
      witnessCount: 2,
      submittedDate: "07 Sep 2026",
      status: "PENDING_APPROVAL",
      photoUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=700&auto=format&fit=crop&q=80",
      coords: "13.2450° N, 77.7120° E (Accuracy ±0.9m)",
    },
    {
      id: "SURV-104",
      caseRef: "LAC/2026/BLR-R/016",
      project: "Suburban Rail Corridor (K-RIDE)",
      projectHi: "उपनगरीय रेल कॉरिडोर (के-राइड)",
      ulpin: "KA-BLR-2026-0112",
      surveyNo: "201/B",
      village: "Nelamangala Town",
      taluk: "Nelamangala",
      areaHa: 0.65,
      surveyor: "Anand Murthy (Surveyor)",
      witnessCount: 3,
      submittedDate: "06 Sep 2026",
      status: "APPROVED",
      photoUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=700&auto=format&fit=crop&q=80",
      coords: "13.0980° N, 77.3910° E (Accuracy ±0.5m)",
    },
  ]);

  // Mock Awards to Sign
  const [awards, setAwards] = useState<AwardItem[]>([
    {
      id: "AWD-201",
      caseRef: "LAC/2026/BLR-R/015",
      project: "Bengaluru-Chennai Expressway Link",
      projectHi: "बेंगलुरु-चेन्नई एक्सप्रेसवे लिंक",
      ownerName: "G. Narayanswamy & Smt. Gowramma",
      ulpin: "KA-BLR-2026-0092",
      surveyNo: "74/1",
      landType: "Irrigated Agricultural",
      landTypeHi: "सिंचित कृषि भूमि",
      areaHa: 1.25,
      marketRateSqm: 2800,
      multiplier: 1.5,
      solatium100Pct: 52500000,
      totalAwardINR: 112800000,
      status: "AWAITING_SIGNATURE",
    },
    {
      id: "AWD-202",
      caseRef: "LAC/2026/BLR-R/015",
      project: "Bengaluru-Chennai Expressway Link",
      projectHi: "बेंगलुरु-चेन्नई एक्सप्रेसवे लिंक",
      ownerName: "K. R. Muniswamy Gowda",
      ulpin: "KA-BLR-2026-0093",
      surveyNo: "74/2",
      landType: "Semi-Urban Dry Agricultural",
      landTypeHi: "अर्ध-शहरी शुष्क कृषि",
      areaHa: 0.85,
      marketRateSqm: 3200,
      multiplier: 1.25,
      solatium100Pct: 34000000,
      totalAwardINR: 73100000,
      status: "AWAITING_SIGNATURE",
    },
    {
      id: "AWD-203",
      caseRef: "LAC/2026/BLR-R/014",
      project: "Bengaluru STRR Ring Road Pkg 2",
      projectHi: "बेंगलुरु एसटीआरआर रिंग रोड पैकेज 2",
      ownerName: "T. Chandrashekhar",
      ulpin: "KA-BLR-2026-0038",
      surveyNo: "139",
      landType: "Agricultural with Assets (Borewell/Teak)",
      landTypeHi: "कृषि परिसंपत्ति सहित (बोरवेल/सागौन)",
      areaHa: 1.6,
      marketRateSqm: 2400,
      multiplier: 1.5,
      solatium100Pct: 57600000,
      totalAwardINR: 124500000,
      status: "AWAITING_SIGNATURE",
    },
    {
      id: "AWD-204",
      caseRef: "LAC/2026/BLR-R/016",
      project: "Suburban Rail Corridor (K-RIDE)",
      projectHi: "उपनगरीय रेल कॉरिडोर (के-राइड)",
      ownerName: "M/s Precision Agro Tech Ltd",
      ulpin: "KA-BLR-2026-0118",
      surveyNo: "210/4",
      landType: "Commercial Agro-Industrial",
      landTypeHi: "वाणिज्यिक कृषि-औद्योगिक",
      areaHa: 0.95,
      marketRateSqm: 4500,
      multiplier: 1.0,
      solatium100Pct: 42750000,
      totalAwardINR: 91910000,
      status: "AWAITING_SIGNATURE",
    },
    {
      id: "AWD-205",
      caseRef: "LAC/2026/BLR-R/018",
      project: "Devanahalli Aerotropolis Link",
      projectHi: "देवनहल्ली एरोट्रोपोलिस लिंक",
      ownerName: "P. Venkataramaiah & Sons",
      ulpin: "KA-BLR-2026-0215",
      surveyNo: "45/A",
      landType: "Non-Agricultural Industrial",
      landTypeHi: "गैर-कृषि औद्योगिक",
      areaHa: 1.1,
      marketRateSqm: 5200,
      multiplier: 1.0,
      solatium100Pct: 57200000,
      totalAwardINR: 122980000,
      status: "AWAITING_SIGNATURE",
    },
  ]);

  // Mock Possession Items
  const [possessions, setPossessions] = useState<PossessionItem[]>([
    {
      id: "POSS-301",
      caseRef: "LAC/2026/BLR-R/017",
      project: "Industrial Corridor Doddaballapur",
      projectHi: "औद्योगिक कॉरिडोर दोड्डबल्लापुर",
      taluk: "Doddaballapur",
      village: "Bashettihalli",
      scheduledDate: "15 Sep 2026",
      parcelsCount: 18,
      areaHa: 24.5,
      revenueInspector: "M. N. Suresh (RI)",
      receivingAgency: "KIADB (Karnataka Industrial Area Dev Board)",
      status: "SCHEDULED",
    },
    {
      id: "POSS-302",
      caseRef: "LAC/2026/BLR-R/014",
      project: "Bengaluru STRR Ring Road Pkg 2",
      projectHi: "बेंगलुरु एसटीआरआर रिंग रोड पैकेज 2",
      taluk: "Devanahalli",
      village: "Kundana",
      scheduledDate: "18 Sep 2026",
      parcelsCount: 22,
      areaHa: 31.2,
      revenueInspector: "B. K. Anand (RI)",
      receivingAgency: "NHAI (National Highways Authority of India)",
      status: "SCHEDULED",
    },
    {
      id: "POSS-303",
      caseRef: "LAC/2026/BLR-R/016",
      project: "Suburban Rail Corridor (K-RIDE)",
      projectHi: "उपनगरीय रेल कॉरिडोर (के-राइड)",
      taluk: "Nelamangala",
      village: "T. Begur",
      scheduledDate: "22 Sep 2026",
      parcelsCount: 14,
      areaHa: 18.0,
      revenueInspector: "H. L. Venkatesh (RI)",
      receivingAgency: "K-RIDE (Rail Infrastructure Dev Co.)",
      status: "NOTICE_ISSUED",
    },
  ]);

  // Mock Grievances & Hearings
  const [grievances, setGrievances] = useState<GrievanceItem[]>([
    {
      id: "GRIEV-401",
      refNo: "OBJ-2026-KA-8812",
      citizenName: "Rameshwar K. Patel",
      caseRef: "LAC/2026/BLR-R/014",
      category: "Tree & Borewell Asset Valuation Re-assessment",
      categoryHi: "पेड़ एवं बोरवेल परिसंपत्ति पुनर्मूल्यांकन",
      filingDate: "05 Sep 2026",
      hearingDate: "18 Sep 2026, 11:00 AM",
      status: "HEARING_SCHEDULED",
      description: "Applicant claims 45 mature teakwood trees and a 600ft functional submersible tube-well were excluded during the preliminary joint survey.",
      descriptionHi: "आवेदक का दावा है कि प्रारंभिक संयुक्त सर्वेक्षण के दौरान 45 परिपक्व सागौन के पेड़ और 600 फीट गहरा बोरवेल छोड़ दिया गया था।",
    },
    {
      id: "GRIEV-402",
      refNo: "OBJ-2026-KA-8815",
      citizenName: "Smt. Shanthamma Muniswamy",
      caseRef: "LAC/2026/BLR-R/014",
      category: "Severance of Retained Land Access Corridor",
      categoryHi: "अवशिष्ट भूमि के रास्ते की बाधा",
      filingDate: "03 Sep 2026",
      hearingDate: "18 Sep 2026, 02:30 PM",
      status: "HEARING_SCHEDULED",
      description: "Remaining 0.99 acres of land parcel 142/2A loses tractor road access due to the elevated embankment design of the STRR highway.",
      descriptionHi: "एसटीआरआर हाईवे के ऊंचे तटबंध डिजाइन के कारण पार्सल 142/2A की शेष 0.99 एकड़ भूमि का ट्रैक्टर मार्ग संपर्क कट जाता है।",
    },
    {
      id: "GRIEV-403",
      refNo: "OBJ-2026-KA-8819",
      citizenName: "Anand Kumar Verma",
      caseRef: "LAC/2026/BLR-R/015",
      category: "Calculation of 100% Legal Compensation Bonus",
      categoryHi: "100% अतिरिक्त कानूनी बोनस (सोलेशियम) गणना",
      filingDate: "01 Sep 2026",
      hearingDate: "21 Sep 2026, 11:30 AM",
      status: "HEARING_SCHEDULED",
      description: "Claimant requests application of 1.5x rural multiplier instead of 1.25x as the plot is located 14.5km outside the municipal boundary.",
      descriptionHi: "दावेदार 1.25x के बजाय 1.5x ग्रामीण गुणक लागू करने का अनुरोध करता है क्योंकि भूखंड नगरपालिका सीमा से 14.5 किमी बाहर है।",
    },
    {
      id: "GRIEV-404",
      refNo: "OBJ-2026-KA-8822",
      citizenName: "Srikanth N. Swamy",
      caseRef: "LAC/2026/BLR-R/016",
      category: "Ownership Title & Khata Name Correction",
      categoryHi: "स्वामित्व पट्टा एवं खाता नाम संशोधन",
      filingDate: "28 Aug 2026",
      hearingDate: "22 Sep 2026, 03:00 PM",
      status: "UNDER_ENQUIRY",
      description: "Partition deed executed in 2024 requires updation in revenue RTC before compensation payout is initiated to prevent family dispute.",
      descriptionHi: "मुआवजा भुगतान से पहले पारिवारिक विवाद रोकने के लिए राजस्व आरटीसी में 2024 के विभाजन विलेख को अद्यतन करने की आवश्यकता है।",
    },
  ]);

  // Charts Data
  // 1. Cases by Stage
  const casesByStageData = useMemo(() => {
    if (rosterData?.cases?.length) {
      const counts: Record<string, number> = {};
      rosterData.cases.forEach((c: any) => {
        const stage = c.stage || "Sec 11 Preliminary";
        counts[stage] = (counts[stage] || 0) + 1;
      });
      return [
        { name: isHi ? "धारा 11 प्रारंभिक" : "Sec 11 Preliminary", count: counts["SEC_11_PRELIMINARY"] || counts["STAGE_11"] || 4, fill: "#3b82f6" },
        { name: isHi ? "धारा 15 आपत्तियां" : "Sec 15 Objections", count: counts["SEC_15_HEARING"] || counts["STAGE_15"] || 5, fill: "#f59e0b" },
        { name: isHi ? "धारा 19 घोषणा" : "Sec 19 Declaration", count: counts["SEC_19_DECLARATION"] || counts["STAGE_19"] || 3, fill: "#6366f1" },
        { name: isHi ? "धारा 23 मुआवजा" : "Sec 23 Award Sign", count: counts["SEC_23_AWARD"] || counts["STAGE_23"] || 3, fill: "#8b5cf6" },
        { name: isHi ? "बैंक भुगतान (PFMS)" : "Bank Payout", count: counts["DISBURSEMENT"] || 2, fill: "#10b981" },
        { name: isHi ? "धारा 38 कब्जा" : "Sec 38 Possession", count: counts["POSSESSION"] || 1, fill: "#15803d" },
      ];
    }
    return [
      { name: isHi ? "धारा 11 प्रारंभिक" : "Sec 11 Preliminary", count: 4, fill: "#3b82f6" },
      { name: isHi ? "धारा 15 आपत्तियां" : "Sec 15 Objections", count: 5, fill: "#f59e0b" },
      { name: isHi ? "धारा 19 घोषणा" : "Sec 19 Declaration", count: 3, fill: "#6366f1" },
      { name: isHi ? "धारा 23 मुआवजा" : "Sec 23 Award Sign", count: 3, fill: "#8b5cf6" },
      { name: isHi ? "बैंक भुगतान (PFMS)" : "Bank Payout", count: 2, fill: "#10b981" },
      { name: isHi ? "धारा 38 कब्जा" : "Sec 38 Possession", count: 1, fill: "#15803d" },
    ];
  }, [rosterData, isHi]);

  // 2. Survey Status Data
  const surveyStatusData = [
    { name: isHi ? "सत्यापित एवं सीमा लॉक" : "Verified & Boundary Locked", value: 340, color: "#16a34a" },
    { name: isHi ? "संयुक्त सर्वेक्षण पूर्ण" : "Joint Field Survey Done", value: 120, color: "#3b82f6" },
    { name: isHi ? "सीमांकन लंबित" : "Demarcation Pending", value: 65, color: "#d97706" },
    { name: isHi ? "सीमा अंतर / विवाद" : "Disputed Discrepancy", value: 15, color: "#dc2626" },
  ];

  // 3. Taluk-wise Possession
  const possessionData = [
    { taluk: "Doddaballapur", targetHa: 140, handedOverHa: 122 },
    { taluk: "Devanahalli", targetHa: 95, handedOverHa: 80 },
    { taluk: "Hosakote", targetHa: 110, handedOverHa: 75 },
    { taluk: "Nelamangala", targetHa: 85, handedOverHa: 60 },
  ];

  // 4. Monthly Acquisition Trend (Area Chart)
  const monthlyTrendData = [
    { month: "Apr 2026", parcelsAcquired: 42, hectares: 28.5 },
    { month: "May 2026", parcelsAcquired: 65, hectares: 45.2 },
    { month: "Jun 2026", parcelsAcquired: 78, hectares: 54.0 },
    { month: "Jul 2026", parcelsAcquired: 92, hectares: 68.4 },
    { month: "Aug 2026", parcelsAcquired: 114, hectares: 82.1 },
    { month: "Sep 2026 (Est)", parcelsAcquired: 139, hectares: 98.6 },
  ];

  // 5. Timeline Progress by Stage (BarChart)
  const timelineProgressData = [
    { stage: "Sec 11 Notice", actualDays: 22, deadlineDays: 30 },
    { stage: "Joint Survey", actualDays: 38, deadlineDays: 45 },
    { stage: "Sec 15 Hearings", actualDays: 52, deadlineDays: 60 },
    { stage: "Sec 19 Declaration", actualDays: 26, deadlineDays: 30 },
    { stage: "Sec 23 Award", actualDays: 24, deadlineDays: 30 },
    { stage: "Bank Payout", actualDays: 14, deadlineDays: 21 },
  ];

  // Assigned Priority Cases Table
  const assignedCases = useMemo(() => {
    if (rosterData?.cases?.length) {
      return rosterData.cases.map((c: any, index: number) => ({
        id: c.id,
        number: c.caseNumber || `LAC/2026/BLR-R/0${14 + index}`,
        project: c.projectName || "Bengaluru Infrastructure Corridor",
        projectHi: c.projectName || "बेंगलुरु अवसंरचना कॉरिडोर",
        stage: c.stage || "Sec 11 Preliminary",
        daysLeft: c.slaDaysRemaining ?? 14,
        isOverdue: (c.slaDaysRemaining ?? 14) < 0,
        parcels: c.parcelsCount || 20,
        outlayINR: c.estimatedCompensation || 150000000,
      }));
    }
    return [
      {
        id: "CAS-01",
        number: "LAC/2026/BLR-R/014",
        project: "Bengaluru STRR Ring Road Pkg 2",
        projectHi: "बेंगलुरु एसटीआरआर रिंग रोड पैकेज 2",
        stage: isHi ? "धारा 15 आपत्ति सुनवाई" : "Sec 15 Objections Hearing",
        daysLeft: -4,
        isOverdue: true,
        parcels: 84,
        outlayINR: 420000000,
      },
      {
        id: "CAS-02",
        number: "LAC/2026/BLR-R/015",
        project: "Bengaluru-Chennai Expressway Link",
        projectHi: "बेंगलुरु-चेन्नई एक्सप्रेसवे लिंक",
        stage: isHi ? "धारा 23 पंचाट जांच" : "Sec 23 Award Inquiry",
        daysLeft: 12,
        isOverdue: false,
        parcels: 112,
        outlayINR: 680000000,
      },
      {
        id: "CAS-03",
        number: "LAC/2026/BLR-R/016",
        project: "Suburban Rail Corridor (K-RIDE)",
        projectHi: "उपनगरीय रेल कॉरिडोर (के-राइड)",
        stage: isHi ? "धारा 11 प्रारंभिक प्रकाशित" : "Sec 11 Published",
        daysLeft: 22,
        isOverdue: false,
        parcels: 45,
        outlayINR: 195000000,
      },
    ];
  }, [rosterData, isHi]);

  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (rosterData) {
      if (rosterData.surveys?.length) {
        setSurveys(
          rosterData.surveys.map((s: any, idx: number) => ({
            id: s.survey_id || `SURV-${101 + idx}`,
            caseRef: s.case_id || "LAC/2026/BLR-R/014",
            project: s.survey_type || "Bengaluru STRR Ring Road Pkg 2",
            projectHi: s.survey_type || "बेंगलुरु एसटीआरआर रिंग रोड पैकेज 2",
            ulpin: s.client_record_id || `KA-BLR-2026-004${idx + 1}`,
            surveyNo: s.device_id || `14${idx}/1`,
            village: "Channapatna",
            taluk: "Doddaballapur",
            areaHa: 1.45,
            surveyor: "S. N. Kumar (Field Surveyor)",
            witnessCount: Array.isArray(s.witness_names) ? s.witness_names.length : 3,
            submittedDate: s.surveyed_at ? new Date(s.surveyed_at).toLocaleDateString() : "08 Sep 2026",
            status: s.sync_status === "SYNCED" ? "APPROVED" : "PENDING_APPROVAL",
            photoUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=700&auto=format&fit=crop&q=80",
            coords: "13.2941° N, 77.5335° E (Accuracy ±0.8m)",
          }))
        );
      }
      if (rosterData.awards?.length) {
        setAwards(
          rosterData.awards.map((a: any, idx: number) => ({
            id: a.award_calculation_id || `AWD-${201 + idx}`,
            caseRef: a.case_parcel_id || "LAC/2026/BLR-R/015",
            project: "Bengaluru-Chennai Expressway Link",
            projectHi: "बेंगलुरु-चेन्नई एक्सप्रेसवे लिंक",
            ownerName: "Verified Land Title Beneficiary",
            ulpin: `KA-BLR-2026-009${idx + 1}`,
            surveyNo: `74/${idx + 1}`,
            landType: "Irrigated Agricultural",
            landTypeHi: "सिंचित कृषि भूमि",
            areaHa: Number(a.area_sqm) > 0 ? Number(a.area_sqm) / 10000 : 1.25,
            marketRateSqm: Number(a.base_market_rate_per_sqm) || 2800,
            multiplier: Number(a.multiplier_factor) || 1.5,
            solatium100Pct: Number(a.solatium_inr) || 52500000,
            totalAwardINR: Number(a.net_award_inr) || 112800000,
            status: a.calculation_status === "APPROVED" ? "SIGNED" : "AWAITING_SIGNATURE",
          }))
        );
      }
      if (rosterData.possessions?.length) {
        setPossessions(
          rosterData.possessions.map((p: any, idx: number) => ({
            id: p.possession_record_id || `POSS-${301 + idx}`,
            caseRef: p.case_id || "LAC/2026/BLR-R/017",
            project: p.receiving_agency || "Industrial Corridor Doddaballapur",
            projectHi: p.receiving_agency || "औद्योगिक कॉरिडोर दोड्डबल्लापुर",
            taluk: "Doddaballapur",
            village: "Bashettihalli",
            scheduledDate: p.handover_date ? new Date(p.handover_date).toLocaleDateString() : "15 Sep 2026",
            parcelsCount: 18,
            areaHa: 24.5,
            revenueInspector: "M. N. Suresh (RI)",
            receivingAgency: p.receiving_agency || "KIADB",
            status: (p.possession_status as any) || "SCHEDULED",
          }))
        );
      }
      if (rosterData.grievances?.length) {
        setGrievances(
          rosterData.grievances.map((g: any, idx: number) => ({
            id: g.grievance_id || `GRIEV-${401 + idx}`,
            refNo: g.grievance_reference || `OBJ-2026-KA-881${idx}`,
            citizenName: g.citizen_name_masked || "Verified Citizen Claimant",
            caseRef: g.case_id || "LAC/2026/BLR-R/014",
            category: g.category || "Asset Valuation",
            categoryHi: g.category || "परिसंपत्ति मूल्यांकन",
            filingDate: g.filed_at ? new Date(g.filed_at).toLocaleDateString() : "05 Sep 2026",
            hearingDate: g.sla_deadline ? new Date(g.sla_deadline).toLocaleDateString() : "18 Sep 2026",
            status: (g.grievance_status as any) || "HEARING_SCHEDULED",
            description: g.details || "Dispute claim lodged for judicial verification under RFCTLARR Section 15.",
            descriptionHi: g.details || "आरएफसीटीएलएआरआर धारा 15 के तहत न्यायिक सत्यापन के लिए विवाद दावा दर्ज किया गया।",
          }))
        );
      }
    }
  }, [rosterData]);

  // Handlers for Modals
  const handleApproveSurvey = () => {
    if (!selectedSurvey) return;
    setSurveys((prev) =>
      prev.map((s) => (s.id === selectedSurvey.id ? { ...s, status: "APPROVED" } : s))
    );
    setSurveyModalOpen(false);
    showToast(isHi ? "सर्वेक्षण सफलतापूर्वक स्वीकृत एवं सीमा लॉक की गई!" : "Survey successfully approved and boundary coordinates locked!");
  };

  const handleSignAward = () => {
    if (!selectedAward) return;
    setSigningAward(true);
    setTimeout(() => {
      setSigningAward(false);
      setAwards((prev) =>
        prev.map((a) => (a.id === selectedAward.id ? { ...a, status: "SIGNED" } : a))
      );
      setAwardModalOpen(false);
      showToast(isHi ? "मुआवजा आदेश पर क्लास-3 डीएससी से सफलतापूर्वक हस्ताक्षर किए गए! बैंक भुगतान जारी।" : "Compensation Award signed with Class-3 DSC! Released for direct bank payment.");
    }, 1200);
  };

  const handleConfirmPossessionSchedule = () => {
    if (!selectedPossession) return;
    setPossessions((prev) =>
      prev.map((p) =>
        p.id === selectedPossession.id
          ? { ...p, scheduledDate: newPossessionDate, revenueInspector: newInspector, status: "NOTICE_ISSUED" }
          : p
      )
    );
    setPossessionModalOpen(false);
    showToast(isHi ? "कब्जा हस्तांतरण तिथि निर्धारित एवं आधिकारिक नोटिस जारी किया गया!" : "Possession handover date scheduled and official notice dispatched!");
  };

  const handleResolveGrievance = () => {
    if (!selectedGrievance) return;
    setGrievances((prev) =>
      prev.map((g) =>
        g.id === selectedGrievance.id ? { ...g, status: "RESOLVED" } : g
      )
    );
    setGrievanceModalOpen(false);
    showToast(isHi ? "आपत्ति सुनवाई आदेश दर्ज किया गया एवं केस समाधान मार्क हुआ!" : "SDM hearing order recorded and grievance marked resolved!");
  };

  const handleDownloadDistrictPdf = () => {
    const pdfData: DistrictPdfData = {
      officerName: "Shri Manjunath R., IAS",
      designation: "Deputy Commissioner & District Magistrate",
      district: "Bengaluru Rural District",
      state: "Karnataka",
      activeCases: 18,
      totalParcels: 540,
      demarcatedParcels: 460,
      totalCompensationINR: 1295000000,
      possessionCompletedPct: 78.3,
      pendingGrievances: 4,
    };
    generateDistrictOfficerPdf("District Land Acquisition Progress Report", pdfData, isHi);
  };

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center text-xs text-[#68655e]">
        Initializing District Officer Command Console...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-[#171716] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-200" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      {/* 1. Personalized Collector Profile & Header Strip */}
      <div className="bg-[#fffdf8] text-[#171716] rounded-2xl p-5 shadow-sm border border-[#d8d3c9] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-[#ef5b2a]/10 text-[#ef5b2a] border border-[#ef5b2a]/30">
              <Building className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#ef5b2a] w-full">
                  {isHi ? "जिला कलेक्टर एवं दंडाधिकारी कमांड कंसोल" : "District Magistrate & SLAO Command Console"}
                </h2>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  {officerProfile.name}
                </h1>
                <Badge className="bg-[#ef5b2a]/10 text-[#ef5b2a] border border-[#ef5b2a]/30 font-bold text-[10px] tracking-wider px-2 py-0.5 rounded-full">
                  {isHi ? "आईएएस • जिला मजिस्ट्रेट" : "IAS • DISTRICT COLLECTOR"}
                </Badge>
                <Badge variant="outline" className="text-[10px] text-emerald-800 border-emerald-300 bg-emerald-50 font-mono">
                  {officerProfile.dscToken}
                </Badge>
              </div>
              <p className="text-xs text-[#68655e] mt-1 font-medium">
                {officerProfile.title} • {officerProfile.district} • {officerProfile.calaRole}
              </p>
              <p className="text-[11px] text-[#68655e] mt-0.5">
                {officerProfile.jurisdiction}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <Button
              size="sm"
              onClick={handleDownloadDistrictPdf}
              className="bg-emerald-600 hover:bg-emerald-700 text-[#171716] font-bold text-xs h-9 shadow flex items-center gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span>{isHi ? "जिला रिपोर्ट (PDF)" : "District Report (PDF)"}</span>
            </Button>
            <Link href="/cases/new">
              <Button
                size="sm"
                className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm font-bold text-xs h-9 flex items-center gap-1.5"
              >
                <FolderOpen className="h-4 w-4" />
                <span>{isHi ? "नया केस दर्ज करें" : "Create Acquisition Case"}</span>
              </Button>
            </Link>
            <Link href="/gis">
              <Button
                size="sm"
                variant="outline"
                className="bg-slate-800/80 hover:bg-slate-700 text-[#171716] border-slate-600 text-xs h-9 flex items-center gap-1.5"
              >
                <MapIcon className="h-4 w-4 text-blue-400" />
                <span>{isHi ? "डिजिटल नक्शा" : "Land Map"}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Action Priority Quick Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#d8d3c9] text-xs">
          <Link href="/dashboard/district?tab=surveys" className="p-2 rounded-xl bg-[#fffdf8] border border-[#d8d3c9] hover:border-[#171716] transition-colors flex items-center justify-between">
            <span className="text-[#171716]">{isHi ? "लंबित सर्वेक्षण:" : "Surveys to Approve:"}</span>
            <span className="font-bold text-[#ef5b2a] font-mono">12 Pending</span>
          </Link>
          <Link href="/dashboard/district?tab=awards" className="p-2 rounded-xl bg-[#fffdf8] border border-[#d8d3c9] hover:border-[#ef5b2a]/40 transition-colors flex items-center justify-between">
            <span className="text-[#171716]">{isHi ? "हस्ताक्षर हेतु पंचाट:" : "Awards to Sign:"}</span>
            <span className="font-bold text-blue-400 font-mono">5 To Sign</span>
          </Link>
          <Link href="/dashboard/district?tab=possession" className="p-2 rounded-xl bg-[#fffdf8] border border-[#d8d3c9] hover:border-emerald-400 transition-colors flex items-center justify-between">
            <span className="text-[#171716]">{isHi ? "कब्जा कार्यक्रम:" : "Possession Scheduled:"}</span>
            <span className="font-bold text-emerald-400 font-mono">3 Memos</span>
          </Link>
          <Link href="/dashboard/district?tab=grievances" className="p-2 rounded-xl bg-[#fffdf8] border border-[#d8d3c9] hover:border-rose-400 transition-colors flex items-center justify-between">
            <span className="text-[#171716]">{isHi ? "आपत्ति सुनवाई:" : "Citizen Hearings:"}</span>
            <span className="font-bold text-rose-400 font-mono">4 Hearings</span>
          </Link>
        </div>
      </div>

      {/* 2. Primary Tabs Content Switcher */}
      {activeTab === "delay-risk" && <RoleBasedDelayIntelligence />}

      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top 4 Core Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={isHi ? "जिले में कुल सक्रिय केस" : "Assigned District Cases"}
              value="18"
              subtext={isHi ? "4 राष्ट्रीय कॉरिडोर परियोजनाओं में" : "Across 4 Infrastructure Corridors"}
              icon={Building}
              variant="amber"
            />
            <StatCard
              title={isHi ? "सीमांकित एवं लॉक भूखंड" : "Land Plots Demarcated"}
              value="460 / 540"
              subtext={isHi ? "85.2% फील्ड सर्वेक्षण सत्यापित" : "85.2% Field Surveys Locked"}
              trend={{ value: isHi ? "+28 इस सप्ताह" : "+28 this week", isPositive: true }}
              icon={Camera}
              variant="green"
            />
            <StatCard
              title={isHi ? "सीधे बैंक खाते में भुगतान" : "Direct Bank Payments (PFMS)"}
              value={formatCompactINR(1295000000)}
              subtext={isHi ? "शत-प्रतिशत प्रत्यक्ष अंतरण" : "Direct to Beneficiary Accounts"}
              icon={Coins}
              variant="amber"
            />
            <StatCard
              title={isHi ? "लंबित आपत्ति सुनवाई (SDM)" : "Pending Objection Hearings"}
              value="4"
              subtext={isHi ? "एसडीएम कोर्ट में इस सप्ताह" : "SDM Court Scheduled this week"}
              trend={{ value: isHi ? "1 विलंबित" : "1 overdue", isPositive: false }}
              icon={AlertCircle}
              variant="rose"
            />
          </div>

          {/* Row 1: Charts - Survey Donut & Possession BarChart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Survey Completion Status Donut */}
            <Card className="lg:col-span-5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>{isHi ? "भूमि सर्वेक्षण एवं सीमांकन स्थिति" : "Land Survey & Boundary Marking Status"}</span>
                  <span className="text-xs font-mono font-bold text-[#ef5b2a]">
                    540 {isHi ? "भूखंड" : "Parcels"}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isHi ? "फील्ड राजस्व दल द्वारा जीपीएस सीमांकन एवं फोटो साक्ष्य सत्यापन।" : "Field officer satellite GPS boundary capture and photo evidence verification."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[270px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={surveyStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {surveyStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => [`${val} ${isHi ? "भूखंड" : "Parcels"}`, ""]}
                        contentStyle={{ backgroundColor: "#fffdf8", borderColor: "#d8d3c9", borderRadius: "8px", border: "none", color: "#171716", fontSize: "12px" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Possession Handover Tracking BarChart */}
            <Card className="lg:col-span-7 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>{isHi ? "तालुका-वार भौतिक कब्जा हस्तांतरण (हेक्टेयर)" : "Taluk-Wise Possession Handover Tracking (Hectares)"}</span>
                  <Badge variant="success" className="text-[10px]">
                    78.3% {isHi ? "पूर्ण" : "Completed"}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isHi ? "धारा 38 पंचनामा के तहत निर्माण एजेंसियों को सौंपा गया क्षेत्र।" : "Section 38 panchanama land handovers to executing agencies."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[270px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={possessionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="taluk" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(val) => [`${val} Ha`, ""]}
                        contentStyle={{ backgroundColor: "#fffdf8", borderColor: "#d8d3c9", borderRadius: "8px", border: "none", color: "#171716", fontSize: "12px" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Bar dataKey="targetHa" name={isHi ? "अपेक्षित (हेक्टेयर)" : "Required (Ha)"} fill="#64748b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="handedOverHa" name={isHi ? "हस्तांतरित (हेक्टेयर)" : "Handed Over (Ha)"} fill="#15803d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Charts - Monthly Acquisition Trend & Timeline Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Monthly Progress Trend */}
            <Card className="lg:col-span-6 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>{isHi ? "मासिक अधिग्रहण प्रगति रुझान" : "Monthly Acquisition Progress Trend"}</span>
                  <span className="text-xs font-semibold text-emerald-600">
                    +24.8% {isHi ? "मासिक वृद्धि" : "Monthly Pace"}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isHi ? "विगत 6 महीनों में अधिग्रहीत भूखंड एवं हेक्टेयर क्षेत्रफल।" : "Parcels and total hectares successfully acquired over the past 6 months."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="areaHaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(val, name) => [val, name === "hectares" ? `${val} Ha` : `${val} Parcels`]}
                        contentStyle={{ backgroundColor: "#fffdf8", borderColor: "#d8d3c9", borderRadius: "8px", border: "none", color: "#171716", fontSize: "12px" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                      <Area
                        type="monotone"
                        dataKey="hectares"
                        name={isHi ? "अधिग्रहीत क्षेत्र (हेक्टेयर)" : "Acquired Area (Ha)"}
                        stroke="#f59e0b"
                        fillOpacity={1}
                        fill="url(#areaHaGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="parcelsAcquired"
                        name={isHi ? "भूखंडों की संख्या" : "Parcels Count"}
                        stroke="#10b981"
                        fill="none"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Cases by Stage Donut / Bar */}
            <Card className="lg:col-span-6 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>{isHi ? "चरण-वार समयसीमा अनुपालन (दिन)" : "Timeline Progress vs Statutory Deadlines"}</span>
                  <span className="text-xs font-semibold text-blue-600">
                    {isHi ? "91.4% समय पर पूर्ण" : "91.4% SLA Adherence"}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isHi ? "वास्तविक कार्य दिवस बनाम राज्य भूमि अधिग्रहण नियम समयसीमा।" : "Actual working days taken per stage versus official turnaround limits."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timelineProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(val) => [`${val} ${isHi ? "दिन" : "Days"}`, ""]}
                        contentStyle={{ backgroundColor: "#fffdf8", borderColor: "#d8d3c9", borderRadius: "8px", border: "none", color: "#171716", fontSize: "12px" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                      <Bar dataKey="actualDays" name={isHi ? "वास्तविक दिन" : "Actual Days"} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="deadlineDays" name={isHi ? "सरकारी समयसीमा" : "Mandated Deadline"} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Collector's Pending Actions Queue */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#171716] flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <span>{isHi ? "कलेक्टर त्वरित निर्णय सूची" : "Collector's Pending Actions Queue"}</span>
              </h3>
              <Badge variant="warning" className="text-xs">
                7 {isHi ? "कार्रवाइयां प्रतीक्षारत" : "Urgent Decisions"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Action 1: Surveys to Approve */}
              <div className="p-4 rounded-xl border bg-[#fffdf8] border-[#d8d3c9] shadow-sm space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#171716]">
                      {isHi ? "सर्वेक्षण अनुमोदन" : "Surveys to Approve"}
                    </span>
                    <Badge className="bg-[#ef5b2a]/10 text-[#ef5b2a] border-[#ef5b2a]/30 text-[10px]">
                      12 Pending
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#68655e] mt-1">
                    {isHi ? "दोड्डबल्लापुर एवं देवनहल्ली में फील्ड सर्वे फोटो एवं जीपीएस सीमांकन सत्यापन।" : "Verify joint measurement photos, witness attestations and locked DGPS boundaries."}
                  </p>
                </div>
                <Link href="/dashboard/district?tab=surveys">
                  <Button size="sm" className="w-full mt-2 bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm text-xs h-8">
                    {isHi ? "सर्वेक्षण अनुमोदन करें (Approve)" : "Review & Approve Surveys"}
                  </Button>
                </Link>
              </div>

              {/* Action 2: Awards to Sign */}
              <div className="p-4 rounded-xl border bg-[#fffdf8] border-[#d8d3c9] shadow-sm space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#171716]">
                      {isHi ? "मुआवजा आदेश हस्ताक्षर" : "Awards to Sign"}
                    </span>
                    <Badge className="bg-[#ef5b2a]/10 text-[#ef5b2a] border-[#ef5b2a]/30 text-[10px]">
                      5 Awaiting Sign
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#68655e] mt-1">
                    {isHi ? "धारा 23 के तहत 100% अतिरिक्त कानूनी बोनस सहित पंचाट आदेश पर डीएससी हस्ताक्षर।" : "Section 23 award orders with 100% legal bonus awaiting Class-3 DSC digital token sign-off."}
                  </p>
                </div>
                <Link href="/dashboard/district?tab=awards">
                  <Button size="sm" className="w-full mt-2 bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm text-xs h-8">
                    {isHi ? "आदेश हस्ताक्षर करें" : "Sign Awards (DSC)"}
                  </Button>
                </Link>
              </div>

              {/* Action 3: Possession Schedule */}
              <div className="p-4 rounded-xl border bg-[#fffdf8] border-[#d8d3c9] shadow-sm space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#171716]">
                      {isHi ? "कब्जा कार्यक्रम जारी" : "Schedule Possession"}
                    </span>
                    <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[10px]">
                      3 Scheduled
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#68655e] mt-1">
                    {isHi ? "धारा 38 पंचनामा कब्जा हस्तांतरण तिथि तय करें एवं संबंधित अधिकारियों को नोटिस भेजें।" : "Issue Section 38 handover memo dates and assign taluk revenue teams."}
                  </p>
                </div>
                <Link href="/dashboard/district?tab=possession">
                  <Button size="sm" className="w-full mt-2 bg-emerald-700 hover:bg-emerald-800 text-[#171716] text-xs h-8">
                    {isHi ? "कब्जा शेड्यूल करें" : "Manage Schedule"}
                  </Button>
                </Link>
              </div>

              {/* Action 4: Grievance Hearings */}
              <div className="p-4 rounded-xl border bg-[#fffdf8] border-[#d8d3c9] shadow-sm space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#171716]">
                      {isHi ? "नागरिक आपत्तियां" : "Citizen Hearings"}
                    </span>
                    <Badge className="bg-rose-500/10 text-rose-300 border-rose-500/30 text-[10px]">
                      4 Scheduled
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#68655e] mt-1">
                    {isHi ? "धारा 15 के तहत पेड़-बोरवेल मूल्यांकन एवं सीमा संरेखण आपत्तियों की सुनवाई।" : "Section 15 hearings regarding asset valuations and severance corridor realignment."}
                  </p>
                </div>
                <Link href="/dashboard/district?tab=grievances">
                  <Button size="sm" className="w-full mt-2 bg-rose-700 hover:bg-rose-800 text-[#171716] text-xs h-8">
                    {isHi ? "सुनवाई आदेश दें" : "Conduct Hearings"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Row 4: Assigned Priority Cases Table */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">
                  {isHi ? "जिले के प्राथमिकता केस फाइलें" : "Assigned Priority Cases"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isHi ? "एसडीएम / कलेक्टर स्तर पर प्रशासनिक मंजूरी या सुनवाई की आवश्यकता।" : "Cases requiring administrative action, award signing, or hearing orders."}
                </CardDescription>
              </div>
              <Link href="/cases">
                <Button variant="ghost" size="sm" className="text-xs">
                  {isHi ? "सभी 18 केस देखें" : "View All 18 Cases"}
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isHi ? "केस संख्या" : "Case Number"}</TableHead>
                    <TableHead>{isHi ? "परियोजना" : "Infrastructure Project"}</TableHead>
                    <TableHead>{isHi ? "वर्तमान चरण" : "Current Stage"}</TableHead>
                    <TableHead>{isHi ? "समयसीमा स्थिति" : "Timeline Status"}</TableHead>
                    <TableHead>{isHi ? "भूखंड" : "Parcels Extent"}</TableHead>
                    <TableHead>{isHi ? "कुल मुआवजा राशि" : "Total Compensation Outlay"}</TableHead>
                    <TableHead className="text-right">{isHi ? "कार्रवाई" : "Action"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedCases.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs font-bold text-[#ef5b2a]">
                        {c.number}
                      </TableCell>
                      <TableCell className="font-bold text-xs">{isHi && c.projectHi ? c.projectHi : c.project}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] border-[#d8d3c9] text-blue-900 dark:text-blue-200">
                          {c.stage}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {c.isOverdue ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <Clock className="h-3 w-3" />
                            <span>{isHi ? `विलंबित ${Math.abs(c.daysLeft)} दिन` : `Overdue ${Math.abs(c.daysLeft)}d`}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Clock className="h-3 w-3" />
                            <span>{isHi ? `${c.daysLeft} दिन शेष` : `${c.daysLeft}d left`}</span>
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{c.parcels} {isHi ? "भूखंड" : "Parcels"}</TableCell>
                      <TableCell className="text-xs font-mono font-semibold">
                        {formatINR(c.outlayINR)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/cases/${c.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            <span>{isHi ? "खोलें" : "Open"}</span>
                            <ArrowUpRight className="h-3 w-3 ml-0.5" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. Tab: Surveys to Approve */}
      {activeTab === "surveys" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fffdf8] border-[#d8d3c9] p-4 rounded-xl border">
            <div>
              <h2 className="text-base font-bold text-[#171716] flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-600" />
                <span>{isHi ? "संयुक्त सर्वेक्षण अनुमोदन केंद्र" : "Surveys to Approve & Boundary Verification"}</span>
              </h2>
              <p className="text-xs text-[#68655e]">
                {isHi
                  ? "फील्ड राजस्व अमिन एवं सर्वेयरों द्वारा प्रस्तुत किए गए सीमांकन और जियो-टैग फोटो साक्ष्य।"
                  : "Scrutinize field photos, GPS coordinates, and witness attestations before locking statutory boundaries."}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Input
                placeholder={isHi ? "केस / यूलपिन खोजें..." : "Search Case / Land ID..."}
                value={surveySearch}
                onChange={(e) => setSurveySearch(e.target.value)}
                className="h-9 w-48 text-xs font-mono"
              />
              <select
                value={surveyFilter}
                onChange={(e) => setSurveyFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-xs"
              >
                <option value="ALL">{isHi ? "सभी स्थिति" : "All Status"}</option>
                <option value="PENDING_APPROVAL">{isHi ? "स्वीकृति प्रतीक्षारत" : "Pending Approval"}</option>
                <option value="APPROVED">{isHi ? "स्वीकृत" : "Approved"}</option>
              </select>
              <Button
                size="sm"
                className="h-9 text-xs bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold"
                onClick={() => {
                  const pending = surveys.find((s) => s.status === "PENDING_APPROVAL");
                  if (pending) {
                    setSelectedSurvey(pending);
                    setSurveyModalOpen(true);
                  }
                }}
              >
                {isHi ? "अनुमोदन करें (Approve)" : "Approve Survey"}
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isHi ? "केस संदर्भ" : "Case Ref"}</TableHead>
                    <TableHead>{isHi ? "भू-आधार (Land ID)" : "Land ID (ULPIN)"}</TableHead>
                    <TableHead>{isHi ? "सर्वे / खसरा" : "Survey / Khasra"}</TableHead>
                    <TableHead>{isHi ? "तालुका एवं गाँव" : "Taluk & Village"}</TableHead>
                    <TableHead>{isHi ? "क्षेत्रफल (हेक्टेयर)" : "Area (Ha)"}</TableHead>
                    <TableHead>{isHi ? "सर्वेयर" : "Field Surveyor"}</TableHead>
                    <TableHead>{isHi ? "गवाह" : "Witnesses"}</TableHead>
                    <TableHead>{isHi ? "स्थिति" : "Status"}</TableHead>
                    <TableHead className="text-right">{isHi ? "निरीक्षण" : "Inspect"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surveys
                    .filter((s) => {
                      if (surveyFilter !== "ALL" && s.status !== surveyFilter) return false;
                      if (
                        surveySearch &&
                        !s.caseRef.toLowerCase().includes(surveySearch.toLowerCase()) &&
                        !s.ulpin.toLowerCase().includes(surveySearch.toLowerCase()) &&
                        !s.surveyNo.toLowerCase().includes(surveySearch.toLowerCase())
                      )
                        return false;
                      return true;
                    })
                    .map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs font-bold text-[#ef5b2a]">
                          {s.caseRef}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold">{s.ulpin}</TableCell>
                        <TableCell className="font-semibold text-xs">{s.surveyNo}</TableCell>
                        <TableCell className="text-xs">{s.taluk}, {s.village}</TableCell>
                        <TableCell className="text-xs font-bold">{s.areaHa} Ha</TableCell>
                        <TableCell className="text-xs text-[#171716]">{s.surveyor}</TableCell>
                        <TableCell className="text-xs">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                            <UserCheck className="h-3 w-3" />
                            {s.witnessCount} {isHi ? "गवाह" : "Signatures"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {s.status === "APPROVED" ? (
                            <Badge variant="success" className="text-[10px]">
                              {isHi ? "सीमा लॉक (स्वीकृत)" : "Boundary Locked"}
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="text-[10px]">
                              {isHi ? "स्वीकृति प्रतीक्षारत" : "Pending Approval"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSurvey(s);
                              setSurveyModalOpen(true);
                            }}
                            className="h-7 text-xs border-[#d8d3c9] hover:bg-[#ef5b2a]/10 dark:hover:bg-blue-950/40 text-[#ef5b2a]"
                          >
                            {isHi ? "जांचें एवं अनुमोदन (Approve)" : "Scrutinize & Approve"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. Tab: Awards to Sign */}
      {activeTab === "awards" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fffdf8] border-[#d8d3c9] p-4 rounded-xl border">
            <div>
              <h2 className="text-base font-bold text-[#171716] flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-blue-600" />
                <span>{isHi ? "धारा 23 वैधानिक पंचाट हस्ताक्षर केंद्र" : "Section 23 Statutory Awards to Sign (CALA)"}</span>
              </h2>
              <p className="text-xs text-[#68655e]">
                {isHi
                  ? "100% अतिरिक्त कानूनी बोनस (सोलेशियम) एवं ब्याज गणना का सत्यापन कर क्लास-3 डीएससी से हस्ताक्षर करें।"
                  : "Verify Section 30 100% legal bonus and annual interest before applying Class-3 DSC digital token."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder={isHi ? "भू-स्वामी या यूलपिन खोजें..." : "Search Landowner / Land ID..."}
                value={awardSearch}
                onChange={(e) => setAwardSearch(e.target.value)}
                className="h-9 w-56 text-xs font-mono"
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isHi ? "केस संदर्भ" : "Case Ref"}</TableHead>
                    <TableHead>{isHi ? "भू-स्वामी का नाम" : "Entitled Landowner"}</TableHead>
                    <TableHead>{isHi ? "भू-आधार" : "Land ID (ULPIN)"}</TableHead>
                    <TableHead>{isHi ? "भूमि प्रकार" : "Land Category"}</TableHead>
                    <TableHead>{isHi ? "क्षेत्रफल" : "Area"}</TableHead>
                    <TableHead>{isHi ? "100% कानूनी बोनस" : "100% Legal Bonus"}</TableHead>
                    <TableHead>{isHi ? "कुल स्वीकृत राशि" : "Total Award Outlay"}</TableHead>
                    <TableHead>{isHi ? "डीएससी स्थिति" : "DSC Status"}</TableHead>
                    <TableHead className="text-right">{isHi ? "हस्ताक्षर" : "Sign Award"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {awards
                    .filter((a) => {
                      if (
                        awardSearch &&
                        !a.ownerName.toLowerCase().includes(awardSearch.toLowerCase()) &&
                        !a.ulpin.toLowerCase().includes(awardSearch.toLowerCase()) &&
                        !a.caseRef.toLowerCase().includes(awardSearch.toLowerCase())
                      )
                        return false;
                      return true;
                    })
                    .map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-xs font-bold text-[#ef5b2a]">
                          {a.caseRef}
                        </TableCell>
                        <TableCell className="font-bold text-xs">{a.ownerName}</TableCell>
                        <TableCell className="font-mono text-xs">{a.ulpin} ({a.surveyNo})</TableCell>
                        <TableCell className="text-xs text-[#171716]">
                          {isHi ? a.landTypeHi : a.landType}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{a.areaHa} Ha</TableCell>
                        <TableCell className="text-xs font-mono font-bold text-amber-700 dark:text-[#ef5b2a]">
                          + {formatINR(a.solatium100Pct)}
                        </TableCell>
                        <TableCell className="text-xs font-mono font-black text-emerald-700 dark:text-emerald-400">
                          {formatINR(a.totalAwardINR)}
                        </TableCell>
                        <TableCell>
                          {a.status === "SIGNED" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              {isHi ? "डीएससी हस्ताक्षरित" : "DSC Signed & Released"}
                            </span>
                          ) : (
                            <Badge variant="warning" className="text-[10px]">
                              {isHi ? "हस्ताक्षर प्रतीक्षारत" : "Awaiting DSC Sign"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            disabled={a.status === "SIGNED"}
                            onClick={() => {
                              setSelectedAward(a);
                              setAwardModalOpen(true);
                            }}
                            className="h-7 text-xs bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm font-bold"
                          >
                            {a.status === "SIGNED" ? (isHi ? "हस्ताक्षरित" : "Signed") : (isHi ? "हस्ताक्षर करें" : "Sign Award")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. Tab: Possession Schedule */}
      {activeTab === "possession" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fffdf8] border-[#d8d3c9] p-4 rounded-xl border">
            <div>
              <h2 className="text-base font-bold text-[#171716] flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span>{isHi ? "धारा 38 भौतिक कब्जा एवं हस्तांतरण कार्यक्रम" : "Section 38 Physical Possession & Handover Schedule"}</span>
              </h2>
              <p className="text-xs text-[#68655e]">
                {isHi
                  ? "मुआवजा पूर्ण भुगतान के उपरांत निर्माण एजेंसियों को भूमि हस्तांतरण कार्यक्रम।"
                  : "Coordinate physical panchanama handovers to executing agencies post full compensation credit."}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setSelectedPossession(possessions[0]);
                setPossessionModalOpen(true);
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-[#171716] text-xs h-9 flex items-center gap-1.5"
            >
              <Calendar className="h-4 w-4" />
              <span>{isHi ? "नया कब्जा शेड्यूल करें" : "Schedule New Handover"}</span>
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isHi ? "केस संदर्भ" : "Case Ref"}</TableHead>
                    <TableHead>{isHi ? "परियोजना" : "Infrastructure Project"}</TableHead>
                    <TableHead>{isHi ? "तालुका एवं गाँव" : "Location"}</TableHead>
                    <TableHead>{isHi ? "निर्धारित तिथि" : "Scheduled Date"}</TableHead>
                    <TableHead>{isHi ? "भूखंड संख्या" : "Parcels"}</TableHead>
                    <TableHead>{isHi ? "हस्तांतरित क्षेत्र" : "Area"}</TableHead>
                    <TableHead>{isHi ? "प्राप्तकर्ता एजेंसी" : "Receiving Agency"}</TableHead>
                    <TableHead>{isHi ? "राजस्व निरीक्षक" : "Revenue Team"}</TableHead>
                    <TableHead>{isHi ? "स्थिति" : "Status"}</TableHead>
                    <TableHead className="text-right">{isHi ? "विवरण" : "Action"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {possessions.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs font-bold text-[#ef5b2a]">
                        {p.caseRef}
                      </TableCell>
                      <TableCell className="font-bold text-xs">{isHi && p.projectHi ? p.projectHi : p.project}</TableCell>
                      <TableCell className="text-xs">{p.taluk}, {p.village}</TableCell>
                      <TableCell className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {p.scheduledDate}
                      </TableCell>
                      <TableCell className="text-xs font-semibold">{p.parcelsCount} {isHi ? "भूखंड" : "Parcels"}</TableCell>
                      <TableCell className="text-xs font-bold">{p.areaHa} Ha</TableCell>
                      <TableCell className="text-xs font-medium text-[#171716]">{p.receivingAgency}</TableCell>
                      <TableCell className="text-xs text-[#68655e]">{p.revenueInspector}</TableCell>
                      <TableCell>
                        <Badge variant="civic" className="text-[10px]">
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPossession(p);
                            setPossessionModalOpen(true);
                          }}
                          className="h-7 text-xs"
                        >
                          {isHi ? "री-शेड्यूल / मेमो" : "Edit / Notice"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 6. Tab: Citizen Grievances & Hearings */}
      {activeTab === "grievances" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fffdf8] border-[#d8d3c9] p-4 rounded-xl border">
            <div>
              <h2 className="text-base font-bold text-[#171716] flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-rose-600" />
                <span>{isHi ? "धारा 15 नागरिक आपत्तियां एवं एसडीएम कोर्ट सुनवाई" : "Section 15 Citizen Objections & SDM Hearings"}</span>
              </h2>
              <p className="text-xs text-[#68655e]">
                {isHi
                  ? "नागरिकों द्वारा दर्ज आपत्तियों की सुनवाई, परिसंपत्ति पुनर्मूल्यांकन एवं वैधानिक आदेश निर्गमन।"
                  : "Adjudicate citizen representations regarding tree counts, severed access, and valuation appeals."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder={isHi ? "आपत्ति क्रमांक या नाम खोजें..." : "Search Ref / Citizen Name..."}
                value={grievanceSearch}
                onChange={(e) => setGrievanceSearch(e.target.value)}
                className="h-9 w-56 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {grievances
              .filter((g) => {
                if (
                  grievanceSearch &&
                  !g.refNo.toLowerCase().includes(grievanceSearch.toLowerCase()) &&
                  !g.citizenName.toLowerCase().includes(grievanceSearch.toLowerCase()) &&
                  !g.caseRef.toLowerCase().includes(grievanceSearch.toLowerCase())
                )
                  return false;
                return true;
              })
              .map((g) => (
                <Card key={g.id} className="shadow-sm border border-[#d8d3c9]">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#ef5b2a] text-xs">
                        {g.refNo} • {g.caseRef}
                      </span>
                      {g.status === "RESOLVED" ? (
                        <Badge variant="success" className="text-[10px]">
                          {isHi ? "आदेश निर्गत (समाधान)" : "Order Dispatched"}
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="text-[10px]">
                          {isHi ? "सुनवाई निर्धारित" : "Hearing Scheduled"}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-sm font-bold text-[#171716] pt-1">
                      {isHi ? g.categoryHi : g.category}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {isHi ? "शिकायतकर्ता:" : "Complainant:"} <strong>{g.citizenName}</strong> • {isHi ? "दर्ज तिथि:" : "Filed:"} {g.filingDate}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="p-3 rounded-lg bg-[#f4f1ea] border-[#d8d3c9] border text-[11px] text-[#171716]">
                      {isHi ? g.descriptionHi : g.description}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#d8d3c9]">
                      <div className="flex items-center gap-1.5 text-amber-700 dark:text-[#ef5b2a] font-bold text-[11px]">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{g.hearingDate}</span>
                      </div>

                      <Button
                        size="sm"
                        disabled={g.status === "RESOLVED"}
                        onClick={() => {
                          setSelectedGrievance(g);
                          setHearingRemarks(
                            isHi
                              ? "संयुक्त माप सर्वेक्षण दल को 3 कार्य दिवसों के भीतर पुनः निरीक्षण करने और संशोधित रिपोर्ट प्रस्तुत करने का आदेश दिया गया।"
                              : "Joint survey team directed to conduct re-measurement and submit verified valuation within 3 working days."
                          );
                          setGrievanceModalOpen(true);
                        }}
                        className="h-7 text-xs bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm"
                      >
                        {g.status === "RESOLVED" ? (isHi ? "समाधान पूर्ण" : "Resolved") : (isHi ? "सुनवाई आदेश दर्ज करें" : "Record Hearing Order")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* 7. Tab: Official District Reports & Orders */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="bg-[#fffdf8] border-[#d8d3c9] p-4 rounded-xl border">
            <h2 className="text-base font-bold text-[#171716] flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              <span>{isHi ? "आधिकारिक जिला भू-अधिग्रहण रिपोर्ट एवं कानूनी आदेश" : "Official District Reports, Gazette Orders & Legal Export"}</span>
            </h2>
            <p className="text-xs text-[#68655e] mt-0.5">
              {isHi
                ? "कलेक्टर कार्यालय की ओर से प्रमाणित पीडीएफ और डेटासेट तुरंत डाउनलोड करें।"
                : "Generate authoritative, legally certified PDF executive briefs and raw land parcel rosters for district records."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Report 1: District Progress Report */}
            <Card className="shadow-sm border-[#d8d3c9]/70 bg-gradient-to-br from-blue-50/20 to-transparent">
              <CardHeader className="pb-3">
                <Badge className="w-fit bg-blue-900 text-[#171716] text-[10px]">
                  Official DC Report
                </Badge>
                <CardTitle className="text-sm font-bold text-[#171716] pt-1">
                  {isHi ? "समग्र जिला भू-अधिग्रहण प्रगति रिपोर्ट (PDF)" : "Comprehensive District Land Acquisition Progress Report (PDF)"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isHi
                    ? "सभी 4 तालुका, 18 केस पैकेज, 540 भूखंड, पंचाट भुगतान एवं कब्जा प्रगति का आधिकारिक सारांश।"
                    : "Complete statistical audit of all 4 taluks, 18 packages, 540 parcels, bank payments, and Section 38 possession."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleDownloadDistrictPdf}
                  className="w-full bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm font-bold text-xs h-9 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>{isHi ? "डाउनलोड रिपोर्ट (PDF)" : "Download Report (PDF)"}</span>
                </Button>
              </CardContent>
            </Card>

            {/* Report 2: Gazette Compliance */}
            <Card className="shadow-sm border-emerald-200/70 bg-gradient-to-br from-emerald-50/20 to-transparent">
              <CardHeader className="pb-3">
                <Badge className="w-fit bg-emerald-800 text-[#171716] text-[10px]">
                  RFCTLARR Mandate
                </Badge>
                <CardTitle className="text-sm font-bold text-[#171716] pt-1">
                  {isHi ? "राजपत्र अधिसूचना एवं समयसीमा अनुपालन प्रमाणपत्र" : "Gazette Notifications & Milestone Compliance Summary"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isHi
                    ? "धारा 11, धारा 15 एवं धारा 19 अधिसूचनाओं का सरकारी समयसीमा अनुपालन विवरण।"
                    : "Statutory SLA milestone tracking across Section 11, 15, and 19 notifications for state audit."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => {
                    const pdfData: DistrictPdfData = {
                      officerName: "Shri Manjunath R., IAS",
                      designation: "Deputy Commissioner & District Magistrate",
                      district: "Bengaluru Rural District",
                      state: "Karnataka",
                      activeCases: 18,
                      totalParcels: 540,
                      demarcatedParcels: 460,
                      totalCompensationINR: 1295000000,
                      possessionCompletedPct: 78.3,
                    };
                    generateDistrictOfficerPdf("Gazette Notifications Milestone Compliance Certificate", pdfData, isHi);
                  }}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-[#171716] font-bold text-xs h-9 flex items-center justify-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  <span>{isHi ? "अनुपालन प्रमाणपत्र (PDF)" : "Compliance Certificate (PDF)"}</span>
                </Button>
              </CardContent>
            </Card>

            {/* Report 3: CSV Export */}
            <Card className="shadow-sm border-[#d8d3c9]">
              <CardHeader className="pb-3">
                <Badge variant="outline" className="w-fit text-[10px] font-mono">
                  CSV Dataset • 540 Plots
                </Badge>
                <CardTitle className="text-sm font-bold text-[#171716] pt-1">
                  {isHi ? "जिले के 540 भूखंडों का सम्पूर्ण डेटासेट (CSV)" : "Complete 540 Land Plots Dataset (CSV Export)"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isHi
                    ? "यूलपिन, खसरा, भू-स्वामी, मुआवजा गणना, बैंक खाता स्थिति एवं भौतिक कब्जा स्थिति की सूची।"
                    : "Tabular export of all 540 parcels with 14-digit Land ID, khasra, area, compensation, and possession state."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => {
                    const csvRows = [
                      ["ULPIN", "SurveyNo", "Taluk", "Village", "AreaHa", "CompensationINR", "PossessionStatus", "SecuritySeal"],
                      ["KA-BLR-2026-0041", "142/2A", "Doddaballapur", "Channapatna", "1.45", "165400000", "COMPLETED", "VERIFIED"],
                      ["KA-BLR-2026-0042", "143/1", "Doddaballapur", "Channapatna", "0.85", "87200000", "SCHEDULED", "VERIFIED"],
                      ["KA-BLR-2026-0095", "88/3", "Devanahalli", "Budigere", "2.10", "224500000", "IN_PROGRESS", "VERIFIED"],
                      ["KA-BLR-2026-0112", "201/B", "Nelamangala", "Nelamangala Town", "0.65", "68900000", "COMPLETED", "VERIFIED"],
                    ];
                    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `Bengaluru_Rural_540_Parcels_Roster_${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="w-full text-xs h-9 flex items-center justify-center gap-2 border-[#d8d3c9] dark:border-[#d8d3c9]"
                >
                  <Download className="h-4 w-4" />
                  <span>{isHi ? "डाउनलोड CSV डेटासेट" : "Download Raw CSV"}</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* Modal 1: Review & Approve Field Survey */}
      <Dialog open={surveyModalOpen} onOpenChange={setSurveyModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-600" />
              <span>{isHi ? "फील्ड सर्वेक्षण सत्यापन एवं सीमा लॉक" : "Review & Approve Field Demarcation Survey"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isHi
                ? "फील्ड सर्वेयर द्वारा ली गई जियो-टैग फोटो, जीपीएस निर्देशांक और उपस्थित गवाहों की जांच करें।"
                : "Examine high-resolution satellite GPS lock, field photograph, and witness signatures."}
            </DialogDescription>
          </DialogHeader>

          {selectedSurvey && (
            <div className="space-y-3 text-xs pt-1">
              <div className="grid grid-cols-2 gap-2 bg-[#f4f1ea] border-[#d8d3c9] p-3 rounded-xl border">
                <div>
                  <span className="text-[#68655e] text-[10px]">{isHi ? "केस संदर्भ:" : "Case Reference:"}</span>
                  <p className="font-bold text-[#171716]">{selectedSurvey.caseRef}</p>
                </div>
                <div>
                  <span className="text-[#68655e] text-[10px]">{isHi ? "भू-आधार (Land ID):" : "Land ID (ULPIN):"}</span>
                  <p className="font-bold font-mono text-[#ef5b2a]">{selectedSurvey.ulpin}</p>
                </div>
                <div>
                  <span className="text-[#68655e] text-[10px]">{isHi ? "खसरा एवं तालुका:" : "Survey No & Location:"}</span>
                  <p className="font-bold text-[#171716]">
                    No. {selectedSurvey.surveyNo}, {selectedSurvey.village} ({selectedSurvey.taluk})
                  </p>
                </div>
                <div>
                  <span className="text-[#68655e] text-[10px]">{isHi ? "सत्यापित क्षेत्रफल:" : "Demarcated Area:"}</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">{selectedSurvey.areaHa} Hectares</p>
                </div>
              </div>

              {/* Geo-tagged Boundary Photo Preview */}
              <div className="border rounded-xl p-2 bg-[#fffdf8] text-[#171716] space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#171716]">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#ef5b2a]" />
                    {selectedSurvey.coords}
                  </span>
                  <Badge className="bg-emerald-500 text-slate-950 font-bold text-[9px]">
                    GPS STAMPED
                  </Badge>
                </div>
                <div className="h-44 rounded-lg overflow-hidden relative border border-[#d8d3c9]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedSurvey.photoUrl}
                    alt="Boundary Pillar"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-[#fffdf8]/80 backdrop-blur-sm p-1.5 rounded text-[10px] font-mono border border-[#d8d3c9]">
                    Pillar P-04 • ULPIN: {selectedSurvey.ulpin} • Time: {selectedSurvey.submittedDate}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#ef5b2a]/10 dark:bg-blue-950/30 border border-[#d8d3c9] dark:border-blue-900 text-[11px] space-y-1">
                <div className="font-bold text-[#ef5b2a]">
                  {isHi ? "पंचनामा गवाह प्रमाण:" : "Panchanama Witness Signatures:"}
                </div>
                <p className="text-[#171716]">
                  {isHi
                    ? `ग्राम लेखाकार, राजस्व निरीक्षक एवं ${selectedSurvey.witnessCount} स्थानीय खातेदार उपस्थित थे और उन्होंने डिजिटल हस्ताक्षर किए हैं।`
                    : `Village Accountant, Revenue Inspector, and ${selectedSurvey.witnessCount} local landholders attested this measurement.`}
                </p>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSurveyModalOpen(false)}
                  className="text-xs"
                >
                  {isHi ? "रद्द करें" : "Cancel"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleApproveSurvey}
                  className="bg-emerald-700 hover:bg-emerald-800 text-[#171716] font-bold text-xs flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>{isHi ? "स्वीकृत करें एवं सीमा लॉक करें" : "Approve Survey & Lock Boundary"}</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 2: Sign Compensation Award with DSC */}
      <Dialog open={awardModalOpen} onOpenChange={setAwardModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-blue-600" />
              <span>{isHi ? "धारा 23 वैधानिक पंचाट आदेश - क्लास-3 डीएससी हस्ताक्षर" : "Section 23 Statutory Award - Class-3 DSC Digital Sign"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isHi
                ? "भूमि अधिग्रहण अधिनियम 2013 के तहत 100% वैधानिक सोलेशियम एवं कुल पंचाट राशि का अनुमोदन।"
                : "Approve statutory compensation formula and certify award with District Collector DSC token."}
            </DialogDescription>
          </DialogHeader>

          {selectedAward && (
            <div className="space-y-3 text-xs pt-1">
              <div className="bg-[#f4f1ea] border-[#d8d3c9] p-3 rounded-xl border space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[#68655e] text-[10px]">{isHi ? "हकदार भू-स्वामी:" : "Entitled Landowner:"}</span>
                  <span className="font-bold text-sm text-[#171716]">{selectedAward.ownerName}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#68655e]">{isHi ? "भू-आधार एवं खसरा:" : "Land ID & Survey No:"}</span>
                  <span className="font-mono font-bold">{selectedAward.ulpin} (Kh. {selectedAward.surveyNo})</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#68655e]">{isHi ? "भूमि श्रेणी एवं क्षेत्रफल:" : "Category & Area:"}</span>
                  <span className="font-semibold">{isHi ? selectedAward.landTypeHi : selectedAward.landType} • {selectedAward.areaHa} Ha</span>
                </div>
              </div>

              {/* Statutory Math Breakdown */}
              <div className="p-3 bg-[#f4f1ea] dark:bg-blue-950/30 border border-[#d8d3c9] dark:border-blue-900 rounded-xl space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-[#171716]">
                  <span>1. Base Market Value (₹{selectedAward.marketRateSqm}/sq.m × {selectedAward.multiplier}x)</span>
                  <span>₹ {((selectedAward.totalAwardINR - selectedAward.solatium100Pct) * 0.85).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold text-amber-700 dark:text-[#ef5b2a] border-t border-[#d8d3c9]/60 pt-1">
                  <span>2. 100% Legal Bonus (Solatium under Sec 30)</span>
                  <span>+ ₹ {selectedAward.solatium100Pct.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-[#171716] border-t border-[#d8d3c9]/60 pt-1">
                  <span>3. 12% Annual Interest (Section 30(3))</span>
                  <span>+ ₹ {Math.round(selectedAward.totalAwardINR * 0.08).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-emerald-700 dark:text-emerald-400 border-t-2 border-emerald-500/60 pt-1.5">
                  <span>TOTAL STATUTORY AWARD (Sec 23)</span>
                  <span>₹ {selectedAward.totalAwardINR.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#fffdf8] text-[#171716] flex items-center justify-between text-[11px]">
                <div>
                  <p className="font-bold text-[#ef5b2a]">Class-3 Digital Signature Token</p>
                  <p className="text-[10px] text-[#68655e]">Token ID: KA-BLR-0042 • Valid until 2028</p>
                </div>
                <Badge className="bg-emerald-500 text-slate-950 font-bold text-[10px]">
                  HARDWARE KEY READY
                </Badge>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAwardModalOpen(false)}
                  className="text-xs"
                >
                  {isHi ? "रद्द करें" : "Cancel"}
                </Button>
                <Button
                  size="sm"
                  disabled={signingAward}
                  onClick={handleSignAward}
                  className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm font-bold text-xs flex items-center gap-1.5"
                >
                  {signingAward ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin text-[#ef5b2a]" />
                      <span>{isHi ? "डीएससी से हस्ताक्षर हो रहा है..." : "Applying Class-3 DSC..."}</span>
                    </>
                  ) : (
                    <>
                      <FileSignature className="h-4 w-4" />
                      <span>{isHi ? "हस्ताक्षर करें एवं भुगतान जारी करें" : "Sign & Authorize Payout"}</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 3: Possession Scheduling */}
      <Dialog open={possessionModalOpen} onOpenChange={setPossessionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <span>{isHi ? "धारा 38 कब्जा हस्तांतरण शेड्यूलिंग" : "Schedule Section 38 Land Handover"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isHi
                ? "पंचनामा तिथि निर्धारित करें और संबंधित राजस्व निरीक्षक दल को तैनात करें।"
                : "Fix panchanama date, assign revenue inspector, and notify executing agency."}
            </DialogDescription>
          </DialogHeader>

          {selectedPossession && (
            <div className="space-y-3 text-xs pt-1">
              <div className="bg-[#f4f1ea] border-[#d8d3c9] p-2.5 rounded-xl border space-y-1">
                <p className="font-bold text-[#171716]">
                  {selectedPossession.project} ({selectedPossession.caseRef})
                </p>
                <p className="text-[#68655e] text-[11px]">
                  {selectedPossession.parcelsCount} Parcels • {selectedPossession.areaHa} Hectares in {selectedPossession.taluk}
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#171716]">
                  {isHi ? "हस्तांतरण तिथि:" : "Scheduled Handover Date:"}
                </label>
                <Input
                  type="date"
                  value={newPossessionDate}
                  onChange={(e) => setNewPossessionDate(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#171716]">
                  {isHi ? "तैनात राजस्व निरीक्षक (RI):" : "Designated Revenue Inspector:"}
                </label>
                <Input
                  value={newInspector}
                  onChange={(e) => setNewInspector(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#171716]">
                  {isHi ? "प्राप्तकर्ता एजेंसी:" : "Receiving Authority:"}
                </label>
                <Input
                  defaultValue={selectedPossession.receivingAgency}
                  disabled
                  className="h-9 text-xs bg-[#f4f1ea] border-[#d8d3c9]"
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPossessionModalOpen(false)}
                  className="text-xs"
                >
                  {isHi ? "रद्द करें" : "Cancel"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmPossessionSchedule}
                  className="bg-emerald-700 hover:bg-emerald-800 text-[#171716] font-bold text-xs"
                >
                  {isHi ? "कब्जा तिथि निश्चित करें" : "Confirm Handover Schedule"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 4: Grievance Hearing Order */}
      <Dialog open={grievanceModalOpen} onOpenChange={setGrievanceModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-rose-600" />
              <span>{isHi ? "एसडीएम कोर्ट सुनवाई निर्णय एवं आदेश" : "Record SDM Hearing Finding & Order"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isHi
                ? "धारा 15 के अंतर्गत नागरिक आपत्ति पर पीठासीन अधिकारी का वैधानिक आदेश दर्ज करें।"
                : "Formal adjudication order under Section 15 of RFCTLARR Act 2013."}
            </DialogDescription>
          </DialogHeader>

          {selectedGrievance && (
            <div className="space-y-3 text-xs pt-1">
              <div className="bg-[#f4f1ea] border-[#d8d3c9] p-2.5 rounded-xl border">
                <div className="flex justify-between font-bold">
                  <span className="font-mono text-blue-600">{selectedGrievance.refNo}</span>
                  <span>{selectedGrievance.citizenName}</span>
                </div>
                <p className="text-[11px] text-[#68655e] mt-0.5">{selectedGrievance.category}</p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#171716]">
                  {isHi ? "पीठासीन अधिकारी के निष्कर्ष एवं आदेश:" : "Hearing Observation & Adjudication Order:"}
                </label>
                <Textarea
                  rows={4}
                  value={hearingRemarks}
                  onChange={(e) => setHearingRemarks(e.target.value)}
                  className="text-xs font-sans leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#171716]">
                  {isHi ? "अंतिम निर्णय स्थिति:" : "Verdict Status:"}
                </label>
                <select className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-xs">
                  <option value="RESOLVED">{isHi ? "आपत्ति स्वीकृत (संशोधित रिपोर्ट का आदेश)" : "Objection Upheld (Re-valuation Ordered)"}</option>
                  <option value="SETTLED">{isHi ? "पारस्परिक सहमति से समाधान" : "Amicably Settled in SDM Court"}</option>
                  <option value="DISMISSED">{isHi ? "बिना साक्ष्य आपत्ति खारिज" : "Dismissed as Devoid of Merits"}</option>
                </select>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGrievanceModalOpen(false)}
                  className="text-xs"
                >
                  {isHi ? "रद्द करें" : "Cancel"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleResolveGrievance}
                  className="bg-rose-700 hover:bg-rose-800 text-[#171716] font-bold text-xs"
                >
                  {isHi ? "आदेश निर्गत करें एवं बंद करें" : "Dispatch Order & Close"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DistrictDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-12 text-center text-xs text-[#68655e]">
          Loading District Command Console...
        </div>
      }
    >
      <DistrictDashboardContent />
    </Suspense>
  );
}
