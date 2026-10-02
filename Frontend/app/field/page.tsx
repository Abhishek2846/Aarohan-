"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { usePwa } from "@/hooks/use-pwa";
import { useGps } from "@/hooks/use-gps";
import { offlineSyncQueue, OfflineQueueItem } from "@/lib/offline-sync-queue";
import { CameraCapture } from "@/components/field/camera-capture";
import { useFieldTasksQuery, useUpdateFieldTaskMutation } from "@/hooks/queries/use-bhoomi-queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  LayoutDashboard,
  Smartphone,
  MapPin,
  Camera,
  Layers,
  Compass,
  Satellite,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  Zap,
  Navigation,
  FileCheck2,
  Trees,
  Home,
  AlertTriangle,
  Clock,
  Search,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Check,
  X,
  UploadCloud,
  FolderOpen,
  Info,
  Sliders,
  Database,
  Eye,
  Crosshair,
  Map as MapIcon,
  HelpCircle,
  FileText,
  Wifi,
  WifiOff,
  Footprints,
} from "lucide-react";
import { RoleBasedDelayIntelligence } from "@/components/ai/role-based-delay-intelligence";

// Types
interface AssignedTask {
  id: string;
  parcelId: string;
  ulpin: string;
  caseNo: string;
  surveyNo: string;
  village: string;
  taluk: string;
  district: string;
  recordedAreaHa: number;
  measuredAreaHa?: number;
  status: "PENDING_SURVEY" | "IN_PROGRESS" | "SUBMITTED" | "CORRECTION_REQUIRED" | "APPROVED";
  priority: "HIGH" | "MEDIUM" | "ROUTINE";
  dueDate: string;
  distanceKm: number;
  bearingDeg: number;
  landholder: string;
  accessStatus: "ACCESSIBLE" | "GATED" | "DISPUTED_TERRAIN";
  correctionRemarks?: string;
}

interface CornerPoint {
  id: string;
  pointNo: string;
  lat: number;
  lng: number;
  accuracy: number;
  altitude: number;
  timestamp: string;
  stoneStatus: "INTACT" | "DAMAGED" | "MISSING" | "RESTORED";
}

interface EvidencePhoto {
  id: string;
  category: string;
  photoUrl: string;
  timestamp: string;
  coords: [number, number];
  azimuth: number;
  hash: string;
  synced: boolean;
}

const INITIAL_TASKS: AssignedTask[] = [
  {
    id: "TASK-001",
    parcelId: "P-KA-BLR-567890",
    ulpin: "KA-BLR-2026-0045",
    caseNo: "AC-2026-KA-001234",
    surveyNo: "45/2A",
    village: "Ramnagar",
    taluk: "Doddaballapur",
    district: "Bengaluru Rural",
    recordedAreaHa: 2.48,
    measuredAreaHa: 2.44,
    status: "PENDING_SURVEY",
    priority: "HIGH",
    dueDate: "15 September 2026",
    distanceKm: 3.2,
    bearingDeg: 38,
    landholder: "Gopalakrishna Gowda & 2 Others",
    accessStatus: "ACCESSIBLE",
  },
  {
    id: "TASK-002",
    parcelId: "P-KA-BLR-567891",
    ulpin: "KA-BLR-2026-0046",
    caseNo: "AC-2026-KA-001234",
    surveyNo: "45/2B",
    village: "Ramnagar",
    taluk: "Doddaballapur",
    district: "Bengaluru Rural",
    recordedAreaHa: 1.15,
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueDate: "15 September 2026",
    distanceKm: 3.4,
    bearingDeg: 42,
    landholder: "Devamma W/o late Narayana",
    accessStatus: "ACCESSIBLE",
  },
  {
    id: "TASK-003",
    parcelId: "P-KA-BLR-567842",
    ulpin: "KA-BLR-2026-0041",
    caseNo: "AC-2026-KA-001198",
    surveyNo: "142/1",
    village: "Doddaballapur",
    taluk: "Doddaballapur",
    district: "Bengaluru Rural",
    recordedAreaHa: 3.80,
    measuredAreaHa: 3.81,
    status: "SUBMITTED",
    priority: "MEDIUM",
    dueDate: "18 September 2026",
    distanceKm: 5.1,
    bearingDeg: 120,
    landholder: "K. Venkateshappa",
    accessStatus: "ACCESSIBLE",
  },
  {
    id: "TASK-004",
    parcelId: "P-KA-BLR-567843",
    ulpin: "KA-BLR-2026-0042",
    caseNo: "AC-2026-KA-001198",
    surveyNo: "145/2",
    village: "Doddaballapur",
    taluk: "Doddaballapur",
    district: "Bengaluru Rural",
    recordedAreaHa: 2.10,
    status: "CORRECTION_REQUIRED",
    priority: "HIGH",
    dueDate: "12 September 2026",
    distanceKm: 2.8,
    bearingDeg: 310,
    landholder: "Suresh Kumar Reddy",
    accessStatus: "GATED",
    correctionRemarks: "District Officer Review: East boundary monument photo missing; please clarify whether irrigation tubewell is shared with Survey 145/3.",
  },
  {
    id: "TASK-005",
    parcelId: "P-KA-BLR-567819",
    ulpin: "KA-BLR-2026-0038",
    caseNo: "AC-2026-KA-001205",
    surveyNo: "89/1",
    village: "Alahalli",
    taluk: "Doddaballapur",
    district: "Bengaluru Rural",
    recordedAreaHa: 0.95,
    status: "PENDING_SURVEY",
    priority: "ROUTINE",
    dueDate: "22 September 2026",
    distanceKm: 6.7,
    bearingDeg: 215,
    landholder: "Channakeshava Swamy Trust",
    accessStatus: "ACCESSIBLE",
  },
  {
    id: "TASK-006",
    parcelId: "P-KA-BLR-567780",
    ulpin: "KA-BLR-2026-0019",
    caseNo: "AC-2026-KA-000982",
    surveyNo: "12/3",
    village: "Bashettihalli",
    taluk: "Doddaballapur",
    district: "Bengaluru Rural",
    recordedAreaHa: 4.25,
    measuredAreaHa: 4.23,
    status: "APPROVED",
    priority: "MEDIUM",
    dueDate: "10 September 2026",
    distanceKm: 8.3,
    bearingDeg: 180,
    landholder: "Anjinappa & Brothers",
    accessStatus: "ACCESSIBLE",
  },
];

function FieldSurveyorDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams ? searchParams.get("tab") : null;
  const [activeTab, setActiveTab] = useState<string>(requestedTab || "tasks");

  useEffect(() => {
    const tab = requestedTab || "tasks";
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [requestedTab, activeTab]);

  const { isOnline, setIsOnline, canInstall, triggerInstall } = usePwa();
  const { location: gpsLocation, isLocating, captureGps } = useGps();

  // Live Backend Field Tasks Query & Mutation
  const { data: fieldData } = useFieldTasksQuery();
  const updateFieldTaskMutation = useUpdateFieldTaskMutation();

  // State
  const [tasks, setTasks] = useState<AssignedTask[]>(INITIAL_TASKS);
  const [selectedTask, setSelectedTask] = useState<AssignedTask>(INITIAL_TASKS[0]);

  useEffect(() => {
    const list = Array.isArray(fieldData) ? fieldData : (fieldData as any)?.tasks || (fieldData as any)?.data;
    if (Array.isArray(list) && list.length > 0) {
      const mappedTasks: AssignedTask[] = list.map((t: any) => ({
        id: String(t.id || t.task_id || `TASK-${Math.random().toString(36).slice(2, 6)}`),
        parcelId: String(t.parcelId || t.parcel_id || t.id || t.task_id || ""),
        ulpin: t.ulpin || t.parcel_ulpin || "",
        caseNo: t.caseNo || t.case_no || "",
        surveyNo: t.surveyNo || t.survey_no || "",
        village: t.village || "",
        taluk: t.taluk || "",
        district: t.district || "",
        recordedAreaHa: Number(t.recordedAreaHa ?? t.recorded_area_ha ?? 0),
        measuredAreaHa: (t.measuredAreaHa !== undefined || t.measured_area_ha !== undefined)
          ? Number(t.measuredAreaHa ?? t.measured_area_ha)
          : undefined,
        status: (t.status || "PENDING_SURVEY") as any,
        priority: (t.priority || "ROUTINE") as any,
        dueDate: t.dueDate || t.due_date || "15 September 2026",
        distanceKm: Number(t.distanceKm ?? t.distance_km ?? 0),
        bearingDeg: Number(t.bearingDeg ?? t.bearing_deg ?? 0),
        landholder: t.landholder || "",
        accessStatus: (t.accessStatus || t.access_status || "ACCESSIBLE") as any,
        correctionRemarks: t.correctionRemarks || t.correction_remarks || undefined,
      }));
      setTasks(mappedTasks);
      if (mappedTasks.length > 0) {
        setSelectedTask((prev) => {
          const match = mappedTasks.find((m) => m.id === prev.id);
          return match || mappedTasks[0];
        });
      }
    }
  }, [fieldData]);
  const [taskFilter, setTaskFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activePhotoCategory, setActivePhotoCategory] = useState("PARCEL_ENTRANCE");

  // Modals
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isAmbiguityModalOpen, setIsAmbiguityModalOpen] = useState(false);
  const [navTargetTask, setNavTargetTask] = useState<AssignedTask | null>(null);

  // Digital Survey Form State (for selectedTask)
  const [surveyStep, setSurveyStep] = useState<number>(1);
  const [surveyEquipment, setSurveyEquipment] = useState("GNSS_ROVER");
  const [boundaryConfirmed, setBoundaryConfirmed] = useState(true);
  const [boundaryNotes, setBoundaryNotes] = useState({
    north: "Adjacent Survey No. 44/1 (N. Ramesh Gowda), canal bund",
    south: "Adjacent Survey No. 45/3, PWD service road",
    east: "Adjacent Survey No. 46 (Gram Sabha common pasture)",
    west: "Adjacent Survey No. 45/1 (Muniyappa), stone wall",
  });
  const [boundaryPillars, setBoundaryPillars] = useState({
    p1: "INTACT",
    p2: "INTACT",
    p3: "RESTORED",
    p4: "INTACT",
  });
  const [cornerPoints, setCornerPoints] = useState<CornerPoint[]>([
    { id: "P1", pointNo: "P1 (NW Corner)", lat: 13.2941, lng: 77.5342, accuracy: 1.4, altitude: 914, timestamp: "10:15 AM", stoneStatus: "INTACT" },
    { id: "P2", pointNo: "P2 (NE Corner)", lat: 13.2949, lng: 77.5358, accuracy: 1.3, altitude: 915, timestamp: "10:28 AM", stoneStatus: "INTACT" },
    { id: "P3", pointNo: "P3 (SE Corner)", lat: 13.2938, lng: 77.5365, accuracy: 1.5, altitude: 913, timestamp: "10:42 AM", stoneStatus: "RESTORED" },
    { id: "P4", pointNo: "P4 (SW Corner)", lat: 13.2931, lng: 77.5348, accuracy: 1.4, altitude: 914, timestamp: "10:55 AM", stoneStatus: "INTACT" },
  ]);

  // Assets & Features
  const [landUseType, setLandUseType] = useState("AGRICULTURAL_IRRIGATED");
  const [assetCounts, setAssetCounts] = useState({
    rccHouses: 0,
    kutchaSheds: 1,
    pumpHouses: 1,
    borewells: 1,
    openWells: 0,
    timberTrees: 8,
    fruitTrees: 14,
    cropType: "Ragi & Mulberry",
    electricityPoles: 2,
    waterPipelines: 1,
    religiousStructures: 0,
    encroachmentsSqM: 0,
  });

  // Photo Evidence Gallery
  const [evidencePhotos, setEvidencePhotos] = useState<EvidencePhoto[]>([
    {
      id: "EV-01",
      category: "PARCEL_ENTRANCE",
      photoUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80",
      timestamp: "Today, 10:12 AM",
      coords: [13.2941, 77.5342],
      azimuth: 42,
      hash: "8f7b2c9a...e312",
      synced: true,
    },
    {
      id: "EV-02",
      category: "BOUNDARY_MARKER_NW",
      photoUrl: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=400&q=80",
      timestamp: "Today, 10:18 AM",
      coords: [13.2941, 77.5342],
      azimuth: 38,
      hash: "4a2c91df...99bc",
      synced: true,
    },
    {
      id: "EV-03",
      category: "BOREWELL_ASSET",
      photoUrl: "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=400&q=80",
      timestamp: "Today, 10:35 AM",
      coords: [13.2945, 77.5352],
      azimuth: 110,
      hash: "b7e21a4f...01dd",
      synced: false,
    },
  ]);

  // Observations & Statutory Declaration
  const [landholderPresence, setLandholderPresence] = useState("PRESENT_IN_PERSON");
  const [landholderConfirmation, setLandholderConfirmation] = useState("CONFIRMED");
  const [landholderObjection, setLandholderObjection] = useState("");
  const [witnessName, setWitnessName] = useState("Sarpanch Narayan Gowda (Doddaballapur Gram Panchayat)");
  const [witnessContact, setWitnessContact] = useState("98450-XXXXX");
  const [statutoryAgreed, setStatutoryAgreed] = useState(false);
  const [surveyorPin, setSurveyorPin] = useState("8921");

  // Ambiguity Referral Form State
  const [ambiguityNotes, setAmbiguityNotes] = useState("");
  const [referralTarget, setReferralTarget] = useState("TAHSILDAR_CALA");

  // Offline Queue
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setQueue(offlineSyncQueue.getQueue());
  }, []);

  const refreshQueue = () => {
    setQueue(offlineSyncQueue.getQueue());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const setTab = (tabId: string) => {
    router.push(`/field?tab=${tabId}`);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === "TODAY") return t.dueDate.includes("15 September");
    if (taskFilter === "HIGH") return t.priority === "HIGH";
    if (taskFilter === "IN_PROGRESS") return t.status === "IN_PROGRESS";
    if (taskFilter === "SUBMITTED") return t.status === "SUBMITTED" || t.status === "APPROVED";
    if (taskFilter === "CORRECTIONS") return t.status === "CORRECTION_REQUIRED";
    return true;
  }).filter((t) => {
    if (!searchQuery) return true;
    const q = (searchQuery || "").toLowerCase();
    return (
      (t.parcelId?.toLowerCase() || "").includes(q) ||
      (t.ulpin?.toLowerCase() || "").includes(q) ||
      (t.surveyNo?.toLowerCase() || "").includes(q) ||
      (t.village?.toLowerCase() || "").includes(q) ||
      (t.caseNo?.toLowerCase() || "").includes(q)
    );
  });

  // Handle GPS Corner Capture
  const handleCaptureCornerPoint = () => {
    const nextIdx = cornerPoints.length + 1;
    const newPt: CornerPoint = {
      id: `P${nextIdx}`,
      pointNo: `P${nextIdx} (Boundary Fix)`,
      lat: gpsLocation.latitude,
      lng: gpsLocation.longitude,
      accuracy: gpsLocation.accuracyMeters,
      altitude: gpsLocation.altitudeMeters || 914,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      stoneStatus: "INTACT",
    };
    setCornerPoints([...cornerPoints, newPt]);
    showToast(`Captured corner point P${nextIdx} at [${gpsLocation.latitude.toFixed(5)}, ${gpsLocation.longitude.toFixed(5)}] with ±${gpsLocation.accuracyMeters}m accuracy`);
  };

  // Handle Quick Boundary Lock
  const handleQuickBoundaryLock = () => {
    offlineSyncQueue.enqueue({
      type: "GPS_DEMARCATION",
      title: `Boundary Pillar Lock #${selectedTask.surveyNo}`,
      ulpin: selectedTask.ulpin,
      surveyNo: selectedTask.surveyNo,
      payload: {
        coords: [gpsLocation.latitude, gpsLocation.longitude],
        accuracyMeters: gpsLocation.accuracyMeters,
        azimuth: gpsLocation.headingDeg || 42,
        witness: witnessName,
      },
    });
    refreshQueue();
    showToast(`Boundary marker locked at [${gpsLocation.latitude.toFixed(5)}, ${gpsLocation.longitude.toFixed(5)}] and saved offline!`);
  };

  // Handle Camera Capture
  const handlePhotoCaptured = (photoDataUrl: string) => {
    const newPhoto: EvidencePhoto = {
      id: `EV-0${evidencePhotos.length + 1}`,
      category: activePhotoCategory,
      photoUrl: photoDataUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      coords: [gpsLocation.latitude, gpsLocation.longitude],
      azimuth: gpsLocation.headingDeg || 42,
      hash: Math.random().toString(36).substring(2, 10) + "...sha256",
      synced: isOnline,
    };

    setEvidencePhotos([newPhoto, ...evidencePhotos]);
    setIsCameraOpen(false);

    // Also enqueue to offline queue
    offlineSyncQueue.enqueue({
      type: "FIELD_PHOTO",
      title: `Evidence: ${String(activePhotoCategory || "").replace(/_/g, " ")} (#${selectedTask?.surveyNo || ""})`,
      ulpin: selectedTask?.ulpin || "",
      surveyNo: selectedTask.surveyNo,
      payload: {
        category: activePhotoCategory,
        coords: [gpsLocation.latitude, gpsLocation.longitude],
        hash: newPhoto.hash,
      },
    });
    refreshQueue();
    showToast(`Geo-tagged evidence photo saved with telemetry stamp!`);
  };

  // Handle Survey Submission
  const handleSubmitSurvey = () => {
    if (!statutoryAgreed) {
      showToast("Please sign the statutory declaration before submitting.");
      return;
    }

    const payload = {
      parcelId: selectedTask.parcelId,
      ulpin: selectedTask.ulpin,
      surveyNo: selectedTask.surveyNo,
      village: selectedTask.village,
      equipment: surveyEquipment,
      boundaryNotes,
      boundaryPillars,
      cornerPoints,
      measuredAreaHa: 2.44,
      varianceAreaHa: -0.04,
      landUseType,
      assetCounts,
      evidencePhotosCount: evidencePhotos.length,
      landholderPresence,
      landholderConfirmation,
      landholderObjection,
      witnessName,
      surveyor: "Abhishek Patil (Revenue Inspector / Field Surveyor, KA-REV-8921)",
      timestamp: new Date().toISOString(),
    };

    offlineSyncQueue.enqueue({
      type: "SURVEY_RECORD",
      title: `Digital Cadastral Survey: ${selectedTask.surveyNo} (${selectedTask.village})`,
      ulpin: selectedTask.ulpin,
      surveyNo: selectedTask.surveyNo,
      payload,
    });

    if (selectedTask?.id) {
      updateFieldTaskMutation.mutate({ id: selectedTask.id, status: "SUBMITTED" });
    }

    // Update task status locally
    setTasks(
      tasks.map((t) =>
        t.id === selectedTask.id ? { ...t, status: "SUBMITTED", measuredAreaHa: 2.44 } : t
      )
    );

    refreshQueue();
    showToast(
      isOnline
        ? "Survey dossier transmitted to District Collector / CALA review portal!"
        : "Survey dossier saved in local offline queue. Will auto-sync on connectivity."
    );
    setTab("tasks");
  };

  // Handle Sync All
  const handleSyncAll = async () => {
    setIsSyncing(true);
    await offlineSyncQueue.syncAll();
    refreshQueue();
    setIsSyncing(false);
    showToast("All offline survey items synchronized successfully with the Central Cadastre!");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#171716] text-[#fffdf8] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-[#d8d3c9] animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-5 w-5 text-[#ef5b2a]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Mobile-First Field PWA Top Header */}
      <div className="bg-[#fffdf8] text-[#171716] rounded-2xl p-5 shadow-sm border border-[#d8d3c9] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#ef5b2a]/15 text-[#ef5b2a] border border-[#ef5b2a]/30">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#171716]">Aarohan Field Surveyor PWA</h1>
                <Badge variant="outline" className="text-[10px] text-[#ef5b2a] border-[#ef5b2a]/30 font-mono">
                  v2.6-OFFLINE READY
                </Badge>
              </div>
              <p className="text-xs text-[#68655e]">
                Abhishek Patil (Revenue Inspector / Field Surveyor, KA-REV-8921) • Doddaballapur Taluk, Bengaluru Rural
              </p>
            </div>
          </div>

          {/* Sync Status & Offline Mode Toggle */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isOnline
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
              }`}
              title="Click to toggle offline simulation mode"
            >
              {isOnline ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Online (4G LTE)</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-amber-600" />
                  <span>Offline Mode</span>
                </>
              )}
            </button>

            {/* Offline Queue Badge */}
            <Link
              href="/field?tab=offline"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.history.pushState(null, "", "/field?tab=offline");
                  setActiveTab("offline");
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#f4f1ea] border border-[#d8d3c9] text-[#171716] hover:bg-[#eae6dc]"
            >
              <Database className="h-3.5 w-3.5 text-[#ef5b2a]" />
              <span>{queue.filter((q) => q.status === "QUEUED").length} Unsynced</span>
            </Link>
          </div>
        </div>

        {/* Live Satellite GPS/NavIC Telemetry Bar */}
        <div className="bg-[#f4f1ea] rounded-xl p-3.5 border border-[#d8d3c9] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#ef5b2a]/10 text-[#ef5b2a]">
              <Satellite className={`h-5 w-5 ${isLocating ? "animate-spin text-[#ef5b2a]" : ""}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#171716]">Live GNSS / NavIC Demarcation Fix:</span>
                <span className="font-mono font-bold text-[#171716] text-sm">
                  {gpsLocation.latitude.toFixed(5)}° N, {gpsLocation.longitude.toFixed(5)}° E
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#68655e] mt-0.5">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Accuracy: ±{gpsLocation.accuracyMeters}m
                </span>
                <span>Altitude: {gpsLocation.altitudeMeters || 914}m MSL</span>
                <span className="flex items-center gap-1">
                  <Compass className="h-3.5 w-3.5 text-[#ef5b2a]" />
                  Azimuth: {gpsLocation.headingDeg || 42}° NE
                </span>
                <span className="font-mono text-[10px] text-[#68655e]">
                  CRS: EPSG:4326 (WGS84) [{gpsLocation.source}]
                </span>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={captureGps}
            disabled={isLocating}
            className="h-8 text-xs bg-[#fffdf8] hover:bg-[#eae6dc] border-[#d8d3c9] text-[#171716] self-start md:self-auto flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLocating ? "animate-spin text-[#ef5b2a]" : ""}`} />
            <span>{isLocating ? "Acquiring NavIC Lock..." : "Recalibrate GPS"}</span>
          </Button>
        </div>
      </div>

      {/* Fast-Launch Field Action Launcher */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setActivePhotoCategory("PARCEL_ENTRANCE");
            setIsCameraOpen(true);
          }}
          className="h-14 flex items-center justify-start px-4 gap-3 border-2 border-dashed border-[#d8d3c9] hover:border-[#ef5b2a] hover:bg-[#fffdf8] text-[#171716] rounded-xl"
        >
          <div className="p-2 rounded-lg bg-[#ef5b2a]/10 text-[#ef5b2a]">
            <Camera className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold block">Take Geo-Tagged Photo</span>
            <span className="text-[10px] text-[#68655e]">Stamped with GPS, ULPIN & Azimuth</span>
          </div>
        </Button>

        <Button
          variant="outline"
          onClick={handleQuickBoundaryLock}
          className="h-14 flex items-center justify-start px-4 gap-3 border-2 border-dashed border-emerald-300 hover:border-emerald-600 hover:bg-emerald-50/50 text-[#171716] rounded-xl"
        >
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold block">Quick Boundary Pillar Lock</span>
            <span className="text-[10px] text-[#68655e]">Save pillar coordinate to offline queue</span>
          </div>
        </Button>

        <Button
          variant="outline"
          onClick={() => setTab("survey")}
          className="h-14 flex items-center justify-start px-4 gap-3 border-2 border-dashed border-[#171716]/30 hover:border-[#171716] hover:bg-[#fffdf8] text-[#171716] rounded-xl"
        >
          <div className="p-2 rounded-lg bg-[#171716]/10 text-[#171716]">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold block">Open Survey Workstation</span>
            <span className="text-[10px] text-[#68655e]">Demarcate parcel: #{selectedTask.surveyNo}</span>
          </div>
        </Button>
      </div>

      {/* Main Tab Switcher Ribbon */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#d8d3c9]">
        {[
          { id: "tasks", label: "Assigned Tasks", icon: LayoutDashboard, count: tasks.length },
          { id: "survey", label: "Digital Survey Form", icon: FileCheck2 },
          { id: "offline", label: "Offline Sync Queue", icon: Smartphone, count: queue.filter((q) => q.status === "QUEUED").length },
          { id: "corrections", label: "Correction Queue", icon: AlertTriangle, count: tasks.filter((t) => t.status === "CORRECTION_REQUIRED").length },
          { id: "guidelines", label: "Role SOP & Guidelines", icon: Compass },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`/field?tab=${tab.id}`}
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.history.pushState(null, "", `/field?tab=${tab.id}`);
                  setActiveTab(tab.id);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#fffdf8] text-[#171716] border-t-2 border-x border-[#d8d3c9] border-t-[#ef5b2a] shadow-sm -mb-[1px]"
                  : "text-[#68655e] hover:text-[#171716] hover:bg-[#fffdf8]/50"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-[#ef5b2a]" : "text-[#68655e]"}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isActive ? "bg-[#ef5b2a] text-white" : "bg-[#d8d3c9] text-[#171716]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB: CADASTRAL DELAY & SURVEY RISKS                                       */}
      {/* ========================================================================= */}
      {activeTab === "delay-risk" && <RoleBasedDelayIntelligence />}

      {/* ========================================================================= */}
      {/* TAB 1: ASSIGNED TASKS                                                     */}
      {/* ========================================================================= */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-[#fffdf8] p-4 rounded-xl border border-[#d8d3c9] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "ALL", label: "All Assigned" },
                { id: "TODAY", label: "Due Today" },
                { id: "HIGH", label: "High Priority" },
                { id: "IN_PROGRESS", label: "In Progress" },
                { id: "SUBMITTED", label: "Under Review" },
                { id: "CORRECTIONS", label: "Correction Required" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTaskFilter(f.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    taskFilter === f.id
                      ? "bg-[#171716] text-[#fffdf8] shadow-sm"
                      : "bg-[#f4f1ea] text-[#68655e] hover:bg-[#eae6dc] hover:text-[#171716]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#68655e]" />
              <Input
                placeholder="Search ULPIN, Khasra, Village..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9 bg-[#f4f1ea] border-[#d8d3c9] rounded-xl"
              />
            </div>
          </div>

          {/* Task Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((task) => {
              const isSelected = selectedTask.id === task.id;
              return (
                <Card
                  key={task.id}
                  className={`border transition-all ${
                    isSelected
                      ? "border-[#ef5b2a] bg-[#fffdf8] shadow-md ring-1 ring-[#ef5b2a]/30"
                      : "border-[#d8d3c9] bg-[#fffdf8] hover:border-[#171716]/40 shadow-sm"
                  }`}
                >
                  <CardHeader className="pb-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#171716]">
                            {task.surveyNo}
                          </span>
                          <span className="text-xs text-[#68655e]">({task.village})</span>
                          <Badge
                            variant={
                              task.priority === "HIGH"
                                ? "destructive"
                                : task.priority === "MEDIUM"
                                ? "warning"
                                : "outline"
                            }
                            className="text-[9px] uppercase px-1.5 py-0"
                          >
                            {task.priority}
                          </Badge>
                        </div>
                        <p className="text-[11px] font-mono text-[#68655e] mt-0.5">
                          ULPIN: {task.ulpin} • {task.parcelId}
                        </p>
                      </div>

                      <Badge
                        variant={
                          task.status === "APPROVED"
                            ? "success"
                            : task.status === "SUBMITTED"
                            ? "outline"
                            : task.status === "CORRECTION_REQUIRED"
                            ? "destructive"
                            : task.status === "IN_PROGRESS"
                            ? "secondary"
                            : "warning"
                        }
                        className="text-[10px]"
                      >
                        {String(task.status || "PENDING_SURVEY").replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 text-xs">
                    {/* Key Attributes */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#f4f1ea] border border-[#d8d3c9]">
                      <div>
                        <span className="text-[10px] text-[#68655e] block">Recorded Area</span>
                        <span className="font-semibold text-[#171716]">
                          {task.recordedAreaHa} Ha ({(task.recordedAreaHa * 2.471).toFixed(2)} Acres)
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#68655e] block">Landholder</span>
                        <span className="font-semibold text-[#171716] truncate block">
                          {task.landholder}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#68655e] block">Case Dossier</span>
                        <span className="font-mono text-[#171716] text-[11px]">{task.caseNo}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#68655e] block">Due Date & SLA</span>
                        <span className="font-semibold text-[#ef5b2a] flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.dueDate}
                        </span>
                      </div>
                    </div>

                    {/* Proximity & Bearing */}
                    <div className="flex items-center justify-between text-[11px] text-[#68655e] px-1">
                      <span className="flex items-center gap-1">
                        <Navigation className="h-3 w-3 text-[#ef5b2a]" />
                        Distance: <strong className="text-[#171716]">{task.distanceKm} km</strong> ({task.bearingDeg}° NE)
                      </span>
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        Access: <span className="font-medium text-[#171716]">{String(task.accessStatus || "ACCESSIBLE").replace(/_/g, " ")}</span>
                      </span>
                    </div>

                    {/* Correction Note Alert */}
                    {task.correctionRemarks && (
                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                          <span>Correction Required by District Officer</span>
                        </div>
                        <p className="text-[10px] leading-relaxed">{task.correctionRemarks}</p>
                      </div>
                    )}

                    {/* Action Buttons matching User Specification */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[#d8d3c9]/60">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setNavTargetTask(task);
                          setIsNavModalOpen(true);
                        }}
                        className="h-8 text-xs bg-[#fffdf8] hover:bg-[#eae6dc] border-[#d8d3c9] text-[#171716] flex items-center justify-center gap-1 rounded-full"
                      >
                        <Navigation className="h-3 w-3 text-[#ef5b2a]" />
                        <span>NAVIGATE</span>
                      </Button>

                      <Button
                        asChild
                        size="sm"
                        className="h-8 text-xs bg-[#ef5b2a] hover:bg-[#d94a1b] text-white font-bold flex items-center justify-center gap-1 rounded-full shadow-sm"
                      >
                        <Link
                          href={`/survey?taskId=${task.id}&surveyNo=${encodeURIComponent(
                            task.surveyNo
                          )}&village=${encodeURIComponent(task.village)}&landholder=${encodeURIComponent(
                            task.landholder
                          )}&ulpin=${encodeURIComponent(task.ulpin)}&recordedArea=${task.recordedAreaHa}&caseNo=${encodeURIComponent(
                            task.caseNo
                          )}`}
                        >
                          <Footprints className="h-3 w-3 text-white" />
                          <span>WALK SURVEY</span>
                        </Link>
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedTask(task);
                          setTab("survey");
                        }}
                        className="h-8 text-xs bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold flex items-center justify-center gap-1 rounded-full shadow-sm"
                      >
                        <FileCheck2 className="h-3 w-3 text-[#ef5b2a]" />
                        <span>FORM</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTask(task);
                          setIsMapModalOpen(true);
                        }}
                        className="h-8 text-xs bg-[#fffdf8] hover:bg-[#eae6dc] border-[#d8d3c9] text-[#171716] flex items-center justify-center gap-1 rounded-full"
                      >
                        <MapIcon className="h-3 w-3 text-[#68655e]" />
                        <span>VIEW MAP</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DIGITAL SURVEY FORM WORKSTATION                                    */}
      {/* ========================================================================= */}
      {activeTab === "survey" && (
        <div className="space-y-6">
          {/* Active Parcel Banner */}
          <div className="bg-[#fffdf8] p-4 rounded-xl border border-[#d8d3c9] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] bg-[#f4f1ea] border-[#d8d3c9]">
                  ACTIVE WORKSTATION
                </Badge>
                <h2 className="text-base font-bold text-[#171716]">
                  Survey Khasra #{selectedTask.surveyNo} • {selectedTask.village}
                </h2>
              </div>
              <p className="text-xs text-[#68655e] mt-0.5">
                ULPIN: {selectedTask.ulpin} • Case: {selectedTask.caseNo} • Landholder: {selectedTask.landholder}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAmbiguityModalOpen(true)}
                className="h-8 text-xs bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900 flex items-center gap-1.5 rounded-full"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span>Log Boundary Ambiguity</span>
              </Button>

              <Button
                asChild
                size="sm"
                className="h-8 text-xs bg-[#ef5b2a] hover:bg-[#d94a1b] text-white font-bold flex items-center gap-1.5 rounded-full shadow-sm"
              >
                <Link
                  href={`/survey?taskId=${selectedTask.id}&surveyNo=${encodeURIComponent(
                    selectedTask.surveyNo
                  )}&village=${encodeURIComponent(selectedTask.village)}&landholder=${encodeURIComponent(
                    selectedTask.landholder
                  )}&ulpin=${encodeURIComponent(selectedTask.ulpin)}&recordedArea=${selectedTask.recordedAreaHa}&caseNo=${encodeURIComponent(
                    selectedTask.caseNo
                  )}`}
                >
                  <Footprints className="h-3.5 w-3.5 text-white" />
                  <span>GPS Walking Survey</span>
                </Link>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsMapModalOpen(true)}
                className="h-8 text-xs bg-[#fffdf8] hover:bg-[#eae6dc] border-[#d8d3c9] text-[#171716] flex items-center gap-1.5 rounded-full"
              >
                <MapIcon className="h-3.5 w-3.5 text-[#ef5b2a]" />
                <span>Cadastral Map</span>
              </Button>
            </div>
          </div>

          {/* 5-Step Workflow Stepper Ribbon */}
          <div className="grid grid-cols-5 gap-1 bg-[#eae6dc] p-1 rounded-xl border border-[#d8d3c9] text-xs font-semibold">
            {[
              { num: 1, label: "1. Parcel Info" },
              { num: 2, label: "2. Boundaries & GPS" },
              { num: 3, label: "3. Land Use & Assets" },
              { num: 4, label: "4. Photo Evidence" },
              { num: 5, label: "5. Declaration" },
            ].map((step) => (
              <button
                key={step.num}
                onClick={() => setSurveyStep(step.num)}
                className={`py-2 rounded-lg text-center transition-all ${
                  surveyStep === step.num
                    ? "bg-[#fffdf8] text-[#171716] font-bold shadow-sm border border-[#d8d3c9]"
                    : "text-[#68655e] hover:text-[#171716]"
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>

          {/* STEP 1: PARCEL INFORMATION & ADMINISTRATIVE CHECK */}
          {surveyStep === 1 && (
            <Card className="border-[#d8d3c9] bg-[#fffdf8]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#171716]">
                  <FileText className="h-4 w-4 text-[#ef5b2a]" />
                  <span>Step 1: Parcel & Administrative Jurisdiction Verification</span>
                </CardTitle>
                <CardDescription className="text-xs text-[#68655e]">
                  Confirm the parcel identity against official cadastral records and check physical site accessibility.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#68655e] block mb-1">14-Digit ULPIN (Bhu-Aadhaar)</label>
                    <Input readOnly value={selectedTask.ulpin} className="bg-[#f4f1ea] border-[#d8d3c9] font-mono text-xs" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#68655e] block mb-1">Survey / Khasra Number</label>
                    <Input readOnly value={selectedTask.surveyNo} className="bg-[#f4f1ea] border-[#d8d3c9] font-mono text-xs" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#68655e] block mb-1">Recorded Area (Revenue Record)</label>
                    <Input readOnly value={`${selectedTask.recordedAreaHa} Hectares (${(selectedTask.recordedAreaHa * 2.471).toFixed(2)} Acres)`} className="bg-[#f4f1ea] border-[#d8d3c9] text-xs font-semibold" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#68655e] block mb-1">Village & Taluk</label>
                    <Input readOnly value={`${selectedTask.village}, ${selectedTask.taluk}`} className="bg-[#f4f1ea] border-[#d8d3c9] text-xs" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#68655e] block mb-1">District & State</label>
                    <Input readOnly value={`${selectedTask.district}, Karnataka`} className="bg-[#f4f1ea] border-[#d8d3c9] text-xs" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#68655e] block mb-1">Acquisition Case Dossier</label>
                    <Input readOnly value={selectedTask.caseNo} className="bg-[#f4f1ea] border-[#d8d3c9] font-mono text-xs" />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9] space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="boundaryCheck"
                      checked={boundaryConfirmed}
                      onChange={(e) => setBoundaryConfirmed(e.target.checked)}
                      className="rounded border-[#d8d3c9] text-[#ef5b2a] focus:ring-[#ef5b2a]"
                    />
                    <label htmlFor="boundaryCheck" className="text-xs font-bold text-[#171716]">
                      I confirm that the physical parcel matches the official revenue village map and adjacent khasra boundaries.
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[#68655e] block mb-1">Physical Access Condition</span>
                      <select className="w-full bg-[#fffdf8] border border-[#d8d3c9] rounded-lg p-2 text-xs text-[#171716]">
                        <option value="ACCESSIBLE">Full Physical Access (No Obstruction)</option>
                        <option value="GATED">Gated / Barbed Wire Fenced</option>
                        <option value="WATERLOGGED">Waterlogged / Swamp Terrain</option>
                        <option value="DISPUTED_ACCESS">Access Disputed by Adjacent Occupant</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#68655e] block mb-1">Approved Survey Equipment Used</span>
                      <select
                        value={surveyEquipment}
                        onChange={(e) => setSurveyEquipment(e.target.value)}
                        className="w-full bg-[#fffdf8] border border-[#d8d3c9] rounded-lg p-2 text-xs text-[#171716]"
                      >
                        <option value="GNSS_ROVER">High-Precision GNSS/GPS Rover (Sub-meter RTK)</option>
                        <option value="TOTAL_STATION">Electronic Total Station (ETS)</option>
                        <option value="MOBILE_GPS">Mobile GNSS / NavIC Receiver</option>
                        <option value="STEEL_TAPE">Steel Measuring Tape & Optical Square</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => setSurveyStep(2)}
                    className="h-9 px-5 bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold rounded-full flex items-center gap-1.5"
                  >
                    <span>Proceed to Boundaries & GPS</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: BOUNDARY DEMARCATION & GPS GEOMETRY */}
          {surveyStep === 2 && (
            <Card className="border-[#d8d3c9] bg-[#fffdf8]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#171716]">
                  <Compass className="h-4 w-4 text-[#ef5b2a]" />
                  <span>Step 2: Boundary Demarcation & Spatial Geometry Capture</span>
                </CardTitle>
                <CardDescription className="text-xs text-[#68655e]">
                  Record 4-side adjacent boundaries, monument condition, and capture high-accuracy corner points.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* 4 Boundary Quadrants */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[#f4f1ea] border border-[#d8d3c9]">
                    <span className="font-bold text-[#171716] block mb-1">North Boundary & Adjacent Khasra</span>
                    <Input
                      value={boundaryNotes.north}
                      onChange={(e) => setBoundaryNotes({ ...boundaryNotes, north: e.target.value })}
                      className="bg-[#fffdf8] border-[#d8d3c9] text-xs"
                    />
                  </div>
                  <div className="p-3 rounded-lg bg-[#f4f1ea] border border-[#d8d3c9]">
                    <span className="font-bold text-[#171716] block mb-1">South Boundary & Adjacent Khasra</span>
                    <Input
                      value={boundaryNotes.south}
                      onChange={(e) => setBoundaryNotes({ ...boundaryNotes, south: e.target.value })}
                      className="bg-[#fffdf8] border-[#d8d3c9] text-xs"
                    />
                  </div>
                  <div className="p-3 rounded-lg bg-[#f4f1ea] border border-[#d8d3c9]">
                    <span className="font-bold text-[#171716] block mb-1">East Boundary & Adjacent Khasra</span>
                    <Input
                      value={boundaryNotes.east}
                      onChange={(e) => setBoundaryNotes({ ...boundaryNotes, east: e.target.value })}
                      className="bg-[#fffdf8] border-[#d8d3c9] text-xs"
                    />
                  </div>
                  <div className="p-3 rounded-lg bg-[#f4f1ea] border border-[#d8d3c9]">
                    <span className="font-bold text-[#171716] block mb-1">West Boundary & Adjacent Khasra</span>
                    <Input
                      value={boundaryNotes.west}
                      onChange={(e) => setBoundaryNotes({ ...boundaryNotes, west: e.target.value })}
                      className="bg-[#fffdf8] border-[#d8d3c9] text-xs"
                    />
                  </div>
                </div>

                {/* Boundary Monument Stones Status */}
                <div className="p-3.5 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9] space-y-2">
                  <span className="font-bold text-[#171716] block">Existing Boundary Stones / Monuments Condition</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: "p1", name: "Pillar 1 (NW)" },
                      { key: "p2", name: "Pillar 2 (NE)" },
                      { key: "p3", name: "Pillar 3 (SE)" },
                      { key: "p4", name: "Pillar 4 (SW)" },
                    ].map((p) => (
                      <div key={p.key} className="p-2 rounded bg-[#fffdf8] border border-[#d8d3c9]">
                        <span className="text-[10px] text-[#68655e] block font-semibold">{p.name}</span>
                        <select
                          value={(boundaryPillars as any)[p.key]}
                          onChange={(e) => setBoundaryPillars({ ...boundaryPillars, [p.key]: e.target.value })}
                          className="w-full text-xs bg-transparent border-0 font-bold text-[#171716] focus:ring-0 p-0 mt-0.5"
                        >
                          <option value="INTACT">Intact & In Situ</option>
                          <option value="DAMAGED">Damaged / Broken</option>
                          <option value="MISSING">Missing / Removed</option>
                          <option value="RESTORED">Restored & Pinned</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* GPS Corner Points Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#171716] flex items-center gap-1.5">
                      <Crosshair className="h-4 w-4 text-[#ef5b2a]" />
                      Captured Corner Points Polygon ({cornerPoints.length} Points)
                    </span>

                    <Button
                      size="sm"
                      onClick={handleCaptureCornerPoint}
                      className="h-8 text-xs bg-[#ef5b2a] hover:bg-[#d94e20] text-white font-bold rounded-full flex items-center gap-1 shadow-sm"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      <span>Pin Current GPS Fix as Corner Point</span>
                    </Button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[#d8d3c9]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#eae6dc] text-[#171716] font-bold border-b border-[#d8d3c9]">
                        <tr>
                          <th className="p-2.5">Point ID</th>
                          <th className="p-2.5">Latitude</th>
                          <th className="p-2.5">Longitude</th>
                          <th className="p-2.5">Accuracy</th>
                          <th className="p-2.5">Altitude</th>
                          <th className="p-2.5">Time</th>
                          <th className="p-2.5">Monument</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d8d3c9]/60 bg-[#fffdf8]">
                        {cornerPoints.map((pt) => (
                          <tr key={pt.id} className="hover:bg-[#f4f1ea]/60">
                            <td className="p-2.5 font-bold font-mono text-[#171716]">{pt.pointNo}</td>
                            <td className="p-2.5 font-mono">{pt.lat.toFixed(5)}° N</td>
                            <td className="p-2.5 font-mono">{pt.lng.toFixed(5)}° E</td>
                            <td className="p-2.5 text-emerald-700 font-semibold">±{pt.accuracy}m</td>
                            <td className="p-2.5">{pt.altitude}m</td>
                            <td className="p-2.5 text-[#68655e]">{pt.timestamp}</td>
                            <td className="p-2.5">
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {pt.stoneStatus}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* System Calculated Geometry Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9]">
                  <div>
                    <span className="text-[10px] text-[#68655e] block">Calculated Measured Area</span>
                    <span className="text-sm font-bold text-[#171716]">2.44 Hectares</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#68655e] block">Recorded Revenue Area</span>
                    <span className="text-sm font-bold text-[#171716]">{selectedTask.recordedAreaHa} Hectares</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#68655e] block">Area Variance (Delta)</span>
                    <span className="text-sm font-bold text-emerald-700">
                      -0.04 Ha (-1.61%) <span className="text-[10px] text-[#68655e] font-normal">[Within 2% SLA]</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#68655e] block">Project RoW Overlap</span>
                    <span className="text-sm font-bold text-[#ef5b2a]">1.82 Ha (74.6% in RoW)</span>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setSurveyStep(1)}
                    className="h-9 px-4 border-[#d8d3c9] text-[#171716] rounded-full"
                  >
                    Back to Step 1
                  </Button>
                  <Button
                    onClick={() => setSurveyStep(3)}
                    className="h-9 px-5 bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold rounded-full flex items-center gap-1.5"
                  >
                    <span>Proceed to Land Use & Assets</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3: LAND USE & PHYSICAL FEATURES / ASSETS INVENTORY */}
          {surveyStep === 3 && (
            <Card className="border-[#d8d3c9] bg-[#fffdf8]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#171716]">
                  <Trees className="h-4 w-4 text-[#ef5b2a]" />
                  <span>Step 3: Actual Land Use & Physical Features Inventory</span>
                </CardTitle>
                <CardDescription className="text-xs text-[#68655e]">
                  Enumerate all physical assets, structures, borewells, horticulture, and public utilities for District CALA valuation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Land Use Selector */}
                <div>
                  <label className="text-[11px] font-semibold text-[#68655e] block mb-1">
                    Actual Ground Land-Use Classification
                  </label>
                  <select
                    value={landUseType}
                    onChange={(e) => setLandUseType(e.target.value)}
                    className="w-full bg-[#f4f1ea] border border-[#d8d3c9] rounded-lg p-2.5 text-xs text-[#171716] font-bold"
                  >
                    <option value="AGRICULTURAL_IRRIGATED">Agricultural (Irrigated - Borewell / Canal)</option>
                    <option value="AGRICULTURAL_DRY">Agricultural (Rainfed / Dry Land)</option>
                    <option value="RESIDENTIAL">Residential (Habitation / House Plot)</option>
                    <option value="COMMERCIAL">Commercial (Shop / Dhaba / Warehouse)</option>
                    <option value="INDUSTRIAL">Industrial (Factory / Workshop)</option>
                    <option value="FOREST">Forest Land (Protected / Reserved)</option>
                    <option value="WATER_BODY">Water Body (Kalyani / Pond / Nala)</option>
                    <option value="GOVT_LAND">Government / Gram Sabha Common Land</option>
                  </select>
                </div>

                {/* Asset Enumeration Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9]">
                    <span className="text-[10px] text-[#68655e] block font-semibold">RCC / Pucca Houses</span>
                    <Input
                      type="number"
                      value={assetCounts.rccHouses}
                      onChange={(e) => setAssetCounts({ ...assetCounts, rccHouses: Number(e.target.value) })}
                      className="bg-[#fffdf8] border-[#d8d3c9] text-xs font-bold mt-1"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9]">
                    <span className="text-[10px] text-[#68655e] block font-semibold">Kutcha / Farm Sheds</span>
                    <Input
                      type="number"
                      value={assetCounts.kutchaSheds}
                      onChange={(e) => setAssetCounts({ ...assetCounts, kutchaSheds: Number(e.target.value) })}
                      className="bg-[#fffdf8] border-[#d8d3c9] text-xs font-bold mt-1"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9]">
                    <span className="text-[10px] text-[#68655e] block font-semibold">Active Borewells</span>
                    <Input
                      type="number"
                      value={assetCounts.borewells}
                      onChange={(e) => setAssetCounts({ ...assetCounts, borewells: Number(e.target.value) })}
                      className="bg-[#fffdf8] border-[#d8d3c9] text-xs font-bold mt-1"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9]">
                    <span className="text-[10px] text-[#68655e] block font-semibold">Open Irrigation Wells</span>
                    <Input
                      type="number"
                      value={assetCounts.openWells}
                      onChange={(e) => setAssetCounts({ ...assetCounts, openWells: Number(e.target.value) })}
                      className="bg-[#fffdf8] border-[#d8d3c9] text-xs font-bold mt-1"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9]">
                    <span className="text-[10px] text-[#68655e] block font-semibold">Timber Trees (Teak/Eucalyptus)</span>
                    <Input
                      type="number"
                      value={assetCounts.timberTrees}
                      onChange={(e) => setAssetCounts({ ...assetCounts, timberTrees: Number(e.target.value) })}
                      className="bg-[#fffdf8] border-[#d8d3c9] text-xs font-bold mt-1"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9]">
                    <span className="text-[10px] text-[#68655e] block font-semibold">Horticulture (Coconut/Mango)</span>
                    <Input
                      type="number"
                      value={assetCounts.fruitTrees}
                      onChange={(e) => setAssetCounts({ ...assetCounts, fruitTrees: Number(e.target.value) })}
                      className="bg-[#fffdf8] border-[#d8d3c9] text-xs font-bold mt-1"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9]">
                    <span className="text-[10px] text-[#68655e] block font-semibold">Electricity / HT Poles</span>
                    <Input
                      type="number"
                      value={assetCounts.electricityPoles}
                      onChange={(e) => setAssetCounts({ ...assetCounts, electricityPoles: Number(e.target.value) })}
                      className="bg-[#fffdf8] border-[#d8d3c9] text-xs font-bold mt-1"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9]">
                    <span className="text-[10px] text-[#68655e] block font-semibold">Encroachments (Sq. Meters)</span>
                    <Input
                      type="number"
                      value={assetCounts.encroachmentsSqM}
                      onChange={(e) => setAssetCounts({ ...assetCounts, encroachmentsSqM: Number(e.target.value) })}
                      className="bg-[#fffdf8] border-[#d8d3c9] text-xs font-bold mt-1"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#f4f1ea] border border-[#d8d3c9]">
                  <span className="font-bold text-[#171716] block mb-1">Standing Crops & Harvest Status</span>
                  <Input
                    value={assetCounts.cropType}
                    onChange={(e) => setAssetCounts({ ...assetCounts, cropType: e.target.value })}
                    placeholder="e.g. Standing Ragi crop, 45 days to maturity"
                    className="bg-[#fffdf8] border-[#d8d3c9] text-xs"
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setSurveyStep(2)}
                    className="h-9 px-4 border-[#d8d3c9] text-[#171716] rounded-full"
                  >
                    Back to Step 2
                  </Button>
                  <Button
                    onClick={() => setSurveyStep(4)}
                    className="h-9 px-5 bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold rounded-full flex items-center gap-1.5"
                  >
                    <span>Proceed to Photo Evidence</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 4: GEO-TAGGED EVIDENCE & PHOTO GALLERY */}
          {surveyStep === 4 && (
            <Card className="border-[#d8d3c9] bg-[#fffdf8]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#171716]">
                      <Camera className="h-4 w-4 text-[#ef5b2a]" />
                      <span>Step 4: Tamper-Proof Geo-Tagged Photo Evidence</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-[#68655e]">
                      Every photo embeds satellite coordinates, azimuth, timestamp, and surveyor ID directly on the image canvas.
                    </CardDescription>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => setIsCameraOpen(true)}
                    className="h-8 bg-[#ef5b2a] hover:bg-[#d94e20] text-white font-bold rounded-full flex items-center gap-1.5 shadow-sm"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>Capture New Photo</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Required Categories Checklist */}
                <div className="p-3 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9] space-y-2">
                  <span className="font-bold text-[#171716] block">Statutory Evidence Checklist</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    {[
                      { cat: "PARCEL_ENTRANCE", label: "1. Parcel Entrance", done: true },
                      { cat: "BOUNDARY_MARKER_NW", label: "2. Boundary Markers", done: true },
                      { cat: "PERIMETER_NORTH", label: "3. North & South Views", done: false },
                      { cat: "PERIMETER_EAST", label: "4. East & West Views", done: false },
                      { cat: "EXISTING_STRUCTURES", label: "5. Structures & Sheds", done: false },
                      { cat: "BOREWELL_ASSET", label: "6. Borewells & Crops", done: true },
                      { cat: "PUBLIC_UTILITIES", label: "7. Public Utilities", done: false },
                      { cat: "LANDOWNER_PRESENCE", label: "8. Landowner on Site", done: false },
                    ].map((item) => (
                      <button
                        key={item.cat}
                        onClick={() => {
                          setActivePhotoCategory(item.cat);
                          setIsCameraOpen(true);
                        }}
                        className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                          item.done
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                            : "bg-[#fffdf8] border-[#d8d3c9] text-[#68655e] hover:border-[#171716]"
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                        {item.done ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Camera className="h-3.5 w-3.5 text-[#ef5b2a] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Evidence Photos Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {evidencePhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="rounded-xl border border-[#d8d3c9] bg-[#f4f1ea] overflow-hidden shadow-sm space-y-2"
                    >
                      <div className="relative aspect-video bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.photoUrl}
                          alt={photo.category}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded font-mono">
                          {photo.category}
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded font-mono">
                          {photo.coords[0].toFixed(5)}° N, {photo.coords[1].toFixed(5)}° E
                        </div>
                      </div>

                      <div className="p-2.5 pt-0 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#171716]">{photo.timestamp}</span>
                          <Badge variant={photo.synced ? "success" : "warning"} className="text-[9px]">
                            {photo.synced ? "Synced" : "Offline"}
                          </Badge>
                        </div>
                        <p className="font-mono text-[9px] text-[#68655e] truncate">
                          SHA-256: {photo.hash}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setSurveyStep(3)}
                    className="h-9 px-4 border-[#d8d3c9] text-[#171716] rounded-full"
                  >
                    Back to Step 3
                  </Button>
                  <Button
                    onClick={() => setSurveyStep(5)}
                    className="h-9 px-5 bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold rounded-full flex items-center gap-1.5"
                  >
                    <span>Proceed to Declaration</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 5: LANDHOLDER PRESENCE & STATUTORY DECLARATION */}
          {surveyStep === 5 && (
            <Card className="border-[#d8d3c9] bg-[#fffdf8]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#171716]">
                  <ShieldCheck className="h-4 w-4 text-[#ef5b2a]" />
                  <span>Step 5: Landholder Presence, Witness Records & Statutory Declaration</span>
                </CardTitle>
                <CardDescription className="text-xs text-[#68655e]">
                  Record landholder attendance, objections, village witnesses, and sign with surveyor authorization.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#68655e] block mb-1">Landholder Presence on Site</label>
                    <select
                      value={landholderPresence}
                      onChange={(e) => setLandholderPresence(e.target.value)}
                      className="w-full bg-[#f4f1ea] border border-[#d8d3c9] rounded-lg p-2.5 text-xs text-[#171716] font-semibold"
                    >
                      <option value="PRESENT_IN_PERSON">Present in Person on Site</option>
                      <option value="AUTHORIZED_REP">Represented by Authorized GPA Holder</option>
                      <option value="ABSENT_AFTER_NOTICE">Absent (Formal Survey Notice Was Served)</option>
                      <option value="REFUSED_PRESENCE">Refused to Attend Field Survey</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#68655e] block mb-1">Landholder Boundary Confirmation</label>
                    <select
                      value={landholderConfirmation}
                      onChange={(e) => setLandholderConfirmation(e.target.value)}
                      className="w-full bg-[#f4f1ea] border border-[#d8d3c9] rounded-lg p-2.5 text-xs text-[#171716] font-semibold"
                    >
                      <option value="CONFIRMED">Boundary Demarcation Confirmed Without Dispute</option>
                      <option value="OBJECTED">Raised Specific Objections / Disagreements</option>
                      <option value="PARTIALLY_AGREED">Agreed with Demarcation Except East Boundary</option>
                    </select>
                  </div>
                </div>

                {/* Objection Note */}
                {landholderConfirmation === "OBJECTED" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#ef5b2a] block">
                      Specific Objections Raised by Landholder
                    </label>
                    <Textarea
                      value={landholderObjection}
                      onChange={(e) => setLandholderObjection(e.target.value)}
                      placeholder="e.g. Landowner states borewell was dug in 2024 and must be valued under Schedule 1; disputes adjacent Survey 45/3 boundary fence."
                      className="bg-[#f4f1ea] border-[#d8d3c9] text-xs h-20"
                    />
                  </div>
                )}

                {/* Witnesses on Site */}
                <div className="p-3.5 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9] space-y-3">
                  <span className="font-bold text-[#171716] block">Witnesses & Local Revenue Officials Present</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-[#68655e] block mb-1">Witness / Village Authority Name</span>
                      <Input
                        value={witnessName}
                        onChange={(e) => setWitnessName(e.target.value)}
                        className="bg-[#fffdf8] border-[#d8d3c9] text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#68655e] block mb-1">Witness Contact / Masked Aadhaar</span>
                      <Input
                        value={witnessContact}
                        onChange={(e) => setWitnessContact(e.target.value)}
                        className="bg-[#fffdf8] border-[#d8d3c9] text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Statutory Oath & Declaration Box */}
                <div className="p-4 rounded-xl bg-amber-50/60 border-2 border-amber-300 space-y-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="statutoryAgreed"
                      checked={statutoryAgreed}
                      onChange={(e) => setStatutoryAgreed(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-amber-400 text-[#ef5b2a] focus:ring-[#ef5b2a]"
                    />
                    <label htmlFor="statutoryAgreed" className="text-xs text-[#171716] leading-relaxed">
                      <strong className="block text-amber-950 font-bold mb-0.5">
                        Statutory Field Demarcation Declaration (Karnataka Land Revenue Act, 1964):
                      </strong>
                      I, <strong>Abhishek Patil (Revenue Inspector / Field Surveyor, KA-REV-8921)</strong>, hereby solemnly declare that the survey, measurement, and demarcation of <strong>Parcel #{selectedTask.surveyNo} (ULPIN: {selectedTask.ulpin})</strong> was conducted physically on site in the presence of the recorded parties and witnesses. All measurements, asset counts, and geo-tagged coordinates represent actual ground conditions.
                    </label>
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-amber-200">
                    <span className="text-[11px] text-[#68655e] font-semibold">Surveyor Authorization PIN:</span>
                    <Input
                      type="password"
                      maxLength={4}
                      value={surveyorPin}
                      onChange={(e) => setSurveyorPin(e.target.value)}
                      className="w-24 bg-[#fffdf8] border-amber-300 font-mono text-center text-xs h-8"
                    />
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Digital Identity Verified
                    </span>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setSurveyStep(4)}
                    className="h-10 px-4 border-[#d8d3c9] text-[#171716] rounded-full"
                  >
                    Back to Step 4
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        offlineSyncQueue.enqueue({
                          type: "SURVEY_RECORD",
                          title: `Draft Survey: #${selectedTask.surveyNo}`,
                          ulpin: selectedTask.ulpin,
                          surveyNo: selectedTask.surveyNo,
                          payload: { status: "DRAFT", step: surveyStep },
                        });
                        refreshQueue();
                        showToast("Survey progress saved locally as draft!");
                      }}
                      className="h-10 px-5 border-[#d8d3c9] text-[#171716] hover:bg-[#eae6dc] rounded-full font-semibold"
                    >
                      Save Draft Locally
                    </Button>

                    <Button
                      onClick={handleSubmitSurvey}
                      disabled={!statutoryAgreed}
                      className="h-10 px-6 bg-[#ef5b2a] hover:bg-[#d94e20] text-white font-bold rounded-full shadow-md flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Submit for District Officer Review</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: OFFLINE SYNC QUEUE                                                 */}
      {/* ========================================================================= */}
      {activeTab === "offline" && (
        <div className="space-y-4">
          <div className="bg-[#fffdf8] p-5 rounded-xl border border-[#d8d3c9] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={isOnline ? "success" : "warning"} className="text-[10px]">
                  {isOnline ? "Network Connected" : "Operating Offline"}
                </Badge>
                <h2 className="text-base font-bold text-[#171716]">
                  Offline Survey Queue & Storage Cache
                </h2>
              </div>
              <p className="text-xs text-[#68655e] mt-1">
                Field surveys, boundary marker locks, and photos are stored securely in IndexedDB / LocalStorage until connectivity is restored.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSyncAll}
                disabled={isSyncing || queue.filter((q) => q.status === "QUEUED").length === 0}
                className="h-9 px-5 bg-[#ef5b2a] hover:bg-[#d94e20] text-white font-bold rounded-full shadow-sm flex items-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "Transmitting..." : "Sync All Enqueued Items"}</span>
              </Button>
            </div>
          </div>

          {/* Storage & Queue Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Card className="border-[#d8d3c9] bg-[#fffdf8]">
              <CardContent className="p-4 space-y-1 text-xs">
                <span className="text-[10px] text-[#68655e] block font-semibold">Total Queued Items</span>
                <span className="text-2xl font-mono font-bold text-[#171716]">
                  {queue.filter((q) => q.status === "QUEUED").length}
                </span>
                <p className="text-[10px] text-[#68655e]">Awaiting network transmission</p>
              </CardContent>
            </Card>

            <Card className="border-[#d8d3c9] bg-[#fffdf8]">
              <CardContent className="p-4 space-y-1 text-xs">
                <span className="text-[10px] text-[#68655e] block font-semibold">Synced Today</span>
                <span className="text-2xl font-mono font-bold text-emerald-700">
                  {queue.filter((q) => q.status === "SYNCED").length}
                </span>
                <p className="text-[10px] text-emerald-700">Successfully committed to ledger</p>
              </CardContent>
            </Card>

            <Card className="border-[#d8d3c9] bg-[#fffdf8]">
              <CardContent className="p-4 space-y-1 text-xs">
                <span className="text-[10px] text-[#68655e] block font-semibold">IndexedDB Storage</span>
                <span className="text-2xl font-mono font-bold text-[#171716]">
                  14.2 <span className="text-xs font-normal">/ 50 MB</span>
                </span>
                <p className="text-[10px] text-[#68655e]">Local storage quota 28% used</p>
              </CardContent>
            </Card>

            <Card className="border-[#d8d3c9] bg-[#fffdf8]">
              <CardContent className="p-4 space-y-1 text-xs">
                <span className="text-[10px] text-[#68655e] block font-semibold">Offline Cadastral Tiles</span>
                <span className="text-2xl font-mono font-bold text-[#ef5b2a]">48 MB</span>
                <p className="text-[10px] text-[#68655e]">Doddaballapur Taluk pre-cached</p>
              </CardContent>
            </Card>
          </div>

          {/* Queue Items Table */}
          <Card className="border-[#d8d3c9] bg-[#fffdf8]">
            <CardHeader className="pb-2.5">
              <CardTitle className="text-sm font-bold text-[#171716]">
                Enqueued Field Operations ({queue.length} Total)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {queue.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#68655e] space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                  <p className="font-bold text-[#171716]">Queue is Completely Clear</p>
                  <p>All field survey records have been transmitted and verified.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#d8d3c9]">
                  {queue.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#f4f1ea] border border-[#d8d3c9]">
                          {item.type === "GPS_DEMARCATION" ? (
                            <MapPin className="h-4 w-4 text-emerald-700" />
                          ) : item.type === "FIELD_PHOTO" ? (
                            <Camera className="h-4 w-4 text-[#ef5b2a]" />
                          ) : (
                            <FileCheck2 className="h-4 w-4 text-[#171716]" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-[#171716] block">{item.title}</span>
                          <span className="text-[11px] text-[#68655e] font-mono">
                            ULPIN: {item.ulpin} • Khasra: {item.surveyNo} • {item.timestamp}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            item.status === "SYNCED"
                              ? "success"
                              : item.status === "SYNCING"
                              ? "secondary"
                              : item.status === "FAILED"
                              ? "destructive"
                              : "warning"
                          }
                          className="text-[10px]"
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CORRECTIONS & RESUBMISSIONS                                        */}
      {/* ========================================================================= */}
      {activeTab === "corrections" && (
        <div className="space-y-4">
          <div className="bg-[#fffdf8] p-5 rounded-xl border border-[#d8d3c9] shadow-sm">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-[10px]">
                ACTION REQUIRED
              </Badge>
              <h2 className="text-base font-bold text-[#171716]">
                Survey Dossiers Returned for Clarification / Correction
              </h2>
            </div>
            <p className="text-xs text-[#68655e] mt-1">
              When the District Collector or CALA notes a discrepancy (e.g. missing marker photo, area variance &gt;2%, or unlisted asset), the survey is returned here for rectification while preserving full version history.
            </p>
          </div>

          <div className="space-y-3">
            {tasks
              .filter((t) => t.status === "CORRECTION_REQUIRED")
              .map((task) => (
                <Card key={task.id} className="border-2 border-rose-300 bg-[#fffdf8] shadow-sm">
                  <CardHeader className="pb-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-[#171716]">
                            Khasra #{task.surveyNo} • {task.village}
                          </span>
                          <Badge variant="destructive" className="text-[10px]">
                            Returned by CALA
                          </Badge>
                        </div>
                        <p className="text-xs font-mono text-[#68655e]">
                          ULPIN: {task.ulpin} • Case: {task.caseNo} • Landholder: {task.landholder}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1.5">
                      <span className="font-bold flex items-center gap-1.5 text-xs">
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                        District Officer Review Discrepancy Note:
                      </span>
                      <p className="text-xs leading-relaxed">{task.correctionRemarks}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[11px] text-[#68655e]">
                        Version Audit Trail: <strong>v1.0 (Rejected)</strong> → Next Submission will be logged as <strong>v1.1</strong>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedTask(task);
                          setTab("survey");
                        }}
                        className="h-8 px-5 bg-[#ef5b2a] hover:bg-[#d94e20] text-white font-bold rounded-full flex items-center gap-1.5 shadow-sm"
                      >
                        <FileCheck2 className="h-3.5 w-3.5" />
                        <span>Open Survey in Workstation to Correct</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ROLE SOP & STATUTORY GUIDELINES                                    */}
      {/* ========================================================================= */}
      {activeTab === "guidelines" && (
        <div className="space-y-6">
          <div className="bg-[#fffdf8] p-5 rounded-xl border border-[#d8d3c9] shadow-sm">
            <h2 className="text-base font-bold text-[#171716]">
              Field Surveyor Constitutional Mandate & Statutory SOP
            </h2>
            <p className="text-xs text-[#68655e] mt-1">
              The Field Surveyor is the ground-level spatial verification authority under the Karnataka Land Revenue Act, 1964 and RFCTLARR Act, 2013. The role strictly observes constitutional boundaries.
            </p>
          </div>

          {/* Two Column Boundary Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* What Field Surveyor CAN Do */}
            <Card className="border-emerald-300 bg-emerald-50/40 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>The Field Surveyor CAN (Authorized Powers)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-emerald-900">
                <ul className="space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>View assigned land parcels within their taluk / jurisdictional task list.</li>
                  <li>Navigate to field sites using GPS, compass, and cadastral maps.</li>
                  <li>Capture high-accuracy GNSS coordinates, corner points, and boundary polygons.</li>
                  <li>Measure physical boundary lengths and calculate ground surface area.</li>
                  <li>Inspect and document existing boundary stone markers (intact, damaged, missing).</li>
                  <li>Take tamper-proof, geo-tagged photographs with telemetry watermarks.</li>
                  <li>Enumerate physical land use, crops, trees, wells, borewells, and structures.</li>
                  <li>Record landholder presence, statements, and verbal or written objections.</li>
                  <li>Record boundary ambiguities and refer them to the authorized Tahsildar / CALA.</li>
                  <li>Submit completed digital survey dossiers to the District Officer for review.</li>
                  <li>Correct and resubmit rejected surveys while preserving audit history.</li>
                  <li>Work completely offline in remote areas and synchronize upon network return.</li>
                </ul>
              </CardContent>
            </Card>

            {/* What Field Surveyor CANNOT Do */}
            <Card className="border-rose-300 bg-rose-50/40 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-rose-950 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  <span>The Field Surveyor CANNOT (Strict Prohibitions)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-rose-900">
                <ul className="space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li><strong>CANNOT change official ownership records (RoR / RTC / Jamabandi).</strong></li>
                  <li><strong>CANNOT approve their own survey</strong> (approval belongs strictly to District Collector / CALA).</li>
                  <li><strong>CANNOT determine, calculate, or approve compensation awards.</strong></li>
                  <li><strong>CANNOT declare an award under Section 23 or Section 30.</strong></li>
                  <li><strong>CANNOT approve any statutory acquisition workflow stage.</strong></li>
                  <li><strong>CANNOT unilaterally adjudicate or settle legal title or boundary disputes.</strong></li>
                  <li><strong>CANNOT delete or purge submitted photographic or spatial evidence.</strong></li>
                  <li><strong>CANNOT alter historical survey audit versions.</strong></li>
                  <li><strong>CANNOT access or process cases outside their assigned taluk / district.</strong></li>
                  <li><strong>CANNOT execute physical possession or eviction without CALA warrant.</strong></li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* District Officer Review Criteria Checklist */}
          <Card className="border-[#d8d3c9] bg-[#fffdf8] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#171716] flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-[#ef5b2a]" />
                <span>What the District Officer / CALA Checks During Review</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-[#68655e]">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-[#f4f1ea] border border-[#d8d3c9]">
                  <strong className="text-[#171716] block mb-0.5">1. Parcel Identity & Match</strong>
                  <span>Whether the correct parcel and village boundary was surveyed.</span>
                </div>
                <div className="p-3 rounded-lg bg-[#f4f1ea] border border-[#d8d3c9]">
                  <strong className="text-[#171716] block mb-0.5">2. GPS Fix Accuracy</strong>
                  <span>GNSS horizontal accuracy must be within statutory threshold (±2m).</span>
                </div>
                <div className="p-3 rounded-lg bg-[#f4f1ea] border border-[#d8d3c9]">
                  <strong className="text-[#171716] block mb-0.5">3. Area Variance &lt; 2%</strong>
                  <span>Recorded vs. measured area difference must not exceed tolerance.</span>
                </div>
                <div className="p-3 rounded-lg bg-[#f4f1ea] border border-[#d8d3c9]">
                  <strong className="text-[#171716] block mb-0.5">4. Photo Completeness</strong>
                  <span>All 4 boundaries, entrance, assets, and landowner presence verified.</span>
                </div>
                <div className="p-3 rounded-lg bg-[#f4f1ea] border border-[#d8d3c9]">
                  <strong className="text-[#171716] block mb-0.5">5. Landholder Objections</strong>
                  <span>Every verbal or written objection recorded for Section 15 hearing.</span>
                </div>
                <div className="p-3 rounded-lg bg-[#f4f1ea] border border-[#d8d3c9]">
                  <strong className="text-[#171716] block mb-0.5">6. Asset Valuation Inputs</strong>
                  <span>Tree species, well capacity, and building classifications certified.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: GPS TURN-BY-TURN NAVIGATION HUD                                  */}
      {/* ========================================================================= */}
      {isNavModalOpen && navTargetTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fffdf8] text-[#171716] w-full max-w-md rounded-2xl border border-[#d8d3c9] shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#d8d3c9]">
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-[#ef5b2a]" />
                <h3 className="font-bold text-sm">Field GPS Compass & Navigation HUD</h3>
              </div>
              <button
                onClick={() => setIsNavModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#eae6dc] text-[#68655e]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Compass HUD Graphic */}
            <div className="text-center py-4 space-y-2">
              <div className="relative w-36 h-36 mx-auto rounded-full border-4 border-[#d8d3c9] bg-[#f4f1ea] flex items-center justify-center shadow-inner">
                <div
                  className="absolute w-1 h-14 bg-[#ef5b2a] origin-bottom -top-1 transform -translate-x-1/2"
                  style={{ transform: `rotate(${navTargetTask.bearingDeg}deg)` }}
                />
                <div className="text-center">
                  <span className="text-xs font-bold font-mono text-[#171716] block">
                    {navTargetTask.bearingDeg}° NE
                  </span>
                  <span className="text-[10px] text-[#68655e]">BEARING</span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-2xl font-bold font-mono text-[#171716]">
                  {navTargetTask.distanceKm} km
                </span>
                <span className="text-xs text-[#68655e] block">
                  Distance to Khasra #{navTargetTask.surveyNo} ({navTargetTask.village})
                </span>
              </div>
            </div>

            {/* Turn by Turn Guidance Steps */}
            <div className="p-3 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9] space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="p-1 rounded bg-[#ef5b2a] text-white font-bold text-[10px]">1</span>
                <div>
                  <strong className="text-[#171716] block">Head North-East on Taluk Road</strong>
                  <span className="text-[#68655e]">Travel 2.4 km towards Ramnagar village approach</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="p-1 rounded bg-[#171716] text-white font-bold text-[10px]">2</span>
                <div>
                  <strong className="text-[#171716] block">Turn Right onto PWD Canal Bund Road</strong>
                  <span className="text-[#68655e]">Continue 800m to Survey 45 North-West boundary pillar</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsNavModalOpen(false)}
                className="h-9 px-4 border-[#d8d3c9] text-[#171716] rounded-full text-xs"
              >
                Close HUD
              </Button>
              <Button
                onClick={() => {
                  setSelectedTask(navTargetTask);
                  setIsNavModalOpen(false);
                  setTab("survey");
                }}
                className="h-9 px-5 bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold rounded-full text-xs"
              >
                Start Survey on Arrival
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CADASTRAL MAP PREVIEW                                            */}
      {/* ========================================================================= */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fffdf8] text-[#171716] w-full max-w-2xl rounded-2xl border border-[#d8d3c9] shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#d8d3c9]">
              <div className="flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-[#ef5b2a]" />
                <h3 className="font-bold text-sm">
                  Cadastral Map: Khasra #{selectedTask.surveyNo} • {selectedTask.village}
                </h3>
              </div>
              <button
                onClick={() => setIsMapModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#eae6dc] text-[#68655e]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* SVG Cadastral Map Graphic with Alignment corridor overlay */}
            <div className="relative aspect-[16/9] bg-[#f4f1ea] rounded-xl border border-[#d8d3c9] overflow-hidden flex items-center justify-center">
              <svg viewBox="0 0 600 340" className="w-full h-full">
                {/* Cadastral Grid */}
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d8d3c9" strokeWidth="0.8" />
                </pattern>
                <rect width="600" height="340" fill="url(#grid)" />

                {/* Neighbor Khasra Plots */}
                <polygon points="40,40 240,30 220,160 30,150" fill="#eae6dc" stroke="#b0a99c" strokeWidth="1.5" />
                <text x="110" y="95" fontSize="11" fill="#68655e" fontFamily="monospace">Khasra 44/1</text>

                <polygon points="360,30 560,40 540,160 350,150" fill="#eae6dc" stroke="#b0a99c" strokeWidth="1.5" />
                <text x="430" y="95" fontSize="11" fill="#68655e" fontFamily="monospace">Khasra 46 (Gram)</text>

                <polygon points="200,240 400,245 390,320 190,315" fill="#eae6dc" stroke="#b0a99c" strokeWidth="1.5" />
                <text x="270" y="285" fontSize="11" fill="#68655e" fontFamily="monospace">Khasra 45/3 (PWD)</text>

                {/* Target Selected Parcel Polygon */}
                <polygon
                  points="230,50 370,60 350,230 210,220"
                  fill="#ef5b2a"
                  fillOpacity="0.15"
                  stroke="#ef5b2a"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
                <text x="250" y="140" fontSize="13" fontWeight="bold" fill="#171716">
                  {selectedTask.surveyNo} ({selectedTask.recordedAreaHa} Ha)
                </text>
                <text x="245" y="160" fontSize="10" fill="#ef5b2a" fontFamily="monospace">
                  {selectedTask.ulpin}
                </text>

                {/* Project Alignment Corridor Buffer Band */}
                <path
                  d="M 0,110 Q 300,140 600,100 L 600,190 Q 300,230 0,200 Z"
                  fill="#38bdf8"
                  fillOpacity="0.25"
                  stroke="#0284c7"
                  strokeWidth="2"
                />
                <text x="20" y="145" fontSize="11" fontWeight="bold" fill="#0369a1">
                  NHAI 6-Lane RoW Buffer (60m)
                </text>

                {/* Corner Point Markers */}
                <circle cx="230" cy="50" r="5" fill="#171716" />
                <text x="210" y="45" fontSize="9" fontWeight="bold" fill="#171716">P1</text>

                <circle cx="370" cy="60" r="5" fill="#171716" />
                <text x="375" y="55" fontSize="9" fontWeight="bold" fill="#171716">P2</text>

                <circle cx="350" cy="230" r="5" fill="#ef5b2a" />
                <text x="355" y="240" fontSize="9" fontWeight="bold" fill="#ef5b2a">P3 (Restored)</text>

                <circle cx="210" cy="220" r="5" fill="#171716" />
                <text x="190" y="230" fontSize="9" fontWeight="bold" fill="#171716">P4</text>
              </svg>
            </div>

            <div className="flex items-center justify-between text-xs text-[#68655e]">
              <span>Survey No: {selectedTask.surveyNo} • Cadastral Overlay: 74.6% in RoW Corridor</span>
              <Button
                variant="outline"
                onClick={() => setIsMapModalOpen(false)}
                className="h-8 text-xs border-[#d8d3c9] text-[#171716] rounded-full"
              >
                Close Map
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: BOUNDARY AMBIGUITY REFERRAL                                      */}
      {/* ========================================================================= */}
      {isAmbiguityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fffdf8] text-[#171716] w-full max-w-lg rounded-2xl border border-[#d8d3c9] shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#d8d3c9]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h3 className="font-bold text-sm">Formal Boundary Ambiguity Referral</h3>
              </div>
              <button
                onClick={() => setIsAmbiguityModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#eae6dc] text-[#68655e]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-1">
              <strong className="block font-bold">Statutory Limitation Notice:</strong>
              <p>
                The Field Surveyor is legally prohibited from resolving ownership or boundary disputes on site. If boundary stones are missing or contested, the ambiguity must be referred to the Tahsildar / District Revenue Officer.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-[#68655e] block mb-1">
                  Referral Target Authority
                </label>
                <select
                  value={referralTarget}
                  onChange={(e) => setReferralTarget(e.target.value)}
                  className="w-full bg-[#f4f1ea] border border-[#d8d3c9] rounded-lg p-2.5 text-xs text-[#171716] font-bold"
                >
                  <option value="TAHSILDAR_CALA">Tahsildar & CALA (Doddaballapur Taluk)</option>
                  <option value="ASSISTANT_DIRECTOR_LAND_RECORDS">Assistant Director of Land Records (ADLR)</option>
                  <option value="DISTRICT_COLLECTOR">District Collector / Deputy Commissioner</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#68655e] block mb-1">
                  Description of Boundary Ambiguity / Dispute on Ground
                </label>
                <Textarea
                  value={ambiguityNotes}
                  onChange={(e) => setAmbiguityNotes(e.target.value)}
                  placeholder="e.g. Discrepancy observed between 1972 tippani map and present physical fence on East boundary; neighbor in Survey 46 claims 8 meters of overlap. Requested joint survey under ADLR."
                  className="bg-[#f4f1ea] border-[#d8d3c9] text-xs h-24"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsAmbiguityModalOpen(false)}
                className="h-9 px-4 border-[#d8d3c9] text-[#171716] rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  offlineSyncQueue.enqueue({
                    type: "GPS_DEMARCATION",
                    title: `Boundary Ambiguity Referral: #${selectedTask.surveyNo}`,
                    ulpin: selectedTask.ulpin,
                    surveyNo: selectedTask.surveyNo,
                    payload: { target: referralTarget, notes: ambiguityNotes },
                  });
                  refreshQueue();
                  setIsAmbiguityModalOpen(false);
                  showToast("Boundary ambiguity referred to Tahsildar / ADLR dossier!");
                }}
                className="h-9 px-5 bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold rounded-full text-xs shadow-sm"
              >
                Transmit Referral
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CAMERA CAPTURE WITH TELEMETRY BURNER                             */}
      {/* ========================================================================= */}
      {isCameraOpen && (
        <CameraCapture
          ulpin={selectedTask.ulpin}
          surveyNo={selectedTask.surveyNo}
          gpsLocation={gpsLocation}
          surveyorName="Abhishek Patil (RI)"
          onPhotoCaptured={handlePhotoCaptured}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </div>
  );
}

export default function FieldOfficerPWAPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto p-8 text-center text-xs text-[#68655e] space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#ef5b2a]" />
          <p>Loading Aarohan Field Surveyor PWA Workstation...</p>
        </div>
      }
    >
      <FieldSurveyorDashboardContent />
    </Suspense>
  );
}
