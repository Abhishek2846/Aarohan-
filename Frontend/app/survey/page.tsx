"use client";

import React, { useState, useEffect, useRef, Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { area as turfArea } from "@turf/area";
import { polygon as turfPolygon } from "@turf/helpers";
import {
  useFieldTasksQuery,
  useSaveFieldSurveyMutation,
} from "@/hooks/queries/use-bhoomi-queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Navigation,
  Play,
  Square,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  FileCheck2,
  ShieldCheck,
  Save,
  ArrowLeft,
  Layers,
  Compass,
  Satellite,
  Info,
  ExternalLink,
  Map as MapIcon,
  Footprints,
  Sparkles,
} from "lucide-react";

interface SurveyMapProps {
  positions: [number, number][];
  isTracking: boolean;
  currentPosition?: [number, number] | null;
  mapType?: "satellite" | "standard";
  height?: string;
  calculatedArea?: number | null;
}

// Dynamically import SurveyMap to prevent SSR leaflet window errors
const SurveyMap = dynamic<SurveyMapProps>(
  () => import("@/components/surveyMap").then((mod) => mod.default || mod.SurveyMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[420px] rounded-xl bg-[#f4f1ea] border border-[#d8d3c9] flex flex-col items-center justify-center space-y-2 text-[#68655e]">
        <div className="w-8 h-8 rounded-full border-2 border-[#ef5b2a] border-t-transparent animate-spin" />
        <p className="text-xs font-bold text-[#171716]">Loading GPS Walking Survey Map...</p>
        <p className="text-[11px] text-[#68655e]">Acquiring High-Accuracy Cadastral Satellite Imagery</p>
      </div>
    ),
  }
);

// Geodesic polygon area fallback calculation (WGS84 ellipsoidal model approximation)
function calculateGeodesicArea(coords: [number, number][]): number {
  if (!coords || coords.length < 3) return 0;
  try {
    // Turf expects coordinates in [longitude, latitude]
    const closed = coords[0][0] === coords[coords.length - 1][0] && coords[0][1] === coords[coords.length - 1][1]
      ? coords
      : [...coords, coords[0]];
    const ring = closed.map((pt) => [pt[1], pt[0]]);
    const poly = turfPolygon([ring]);
    return turfArea(poly);
  } catch (err) {
    // Fallback Shoelace formula on spherical projection
    const R = 6378137; // Earth radius in meters
    let totalArea = 0;
    const n = coords.length;
    for (let i = 0; i < n; i++) {
      const p1 = coords[i];
      const p2 = coords[(i + 1) % n];
      const radLat1 = (p1[0] * Math.PI) / 180;
      const radLat2 = (p2[0] * Math.PI) / 180;
      const radLng1 = (p1[1] * Math.PI) / 180;
      const radLng2 = (p2[1] * Math.PI) / 180;
      totalArea += (radLng2 - radLng1) * (2 + Math.sin(radLat1) + Math.sin(radLat2));
    }
    return Math.abs((totalArea * R * R) / 4.0);
  }
}

function SurveyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL parameters for task context
  const paramTaskId = searchParams.get("taskId") || "";
  const paramSurveyNo = searchParams.get("surveyNo") || "";
  const paramVillage = searchParams.get("village") || "";
  const paramLandholder = searchParams.get("landholder") || "";
  const paramUlpin = searchParams.get("ulpin") || "";
  const paramRecordedArea = searchParams.get("recordedArea") ? parseFloat(searchParams.get("recordedArea")!) : null;
  const paramCaseNo = searchParams.get("caseNo") || "";

  // Fetch assigned tasks in case surveyor arrived directly without query params
  const { data: assignedTasks = [] } = useFieldTasksQuery();
  const saveSurveyMutation = useSaveFieldSurveyMutation();

  const [selectedTaskId, setSelectedTaskId] = useState<string>(paramTaskId);
  const [activeTask, setActiveTask] = useState<any>(null);

  // Sync selected task with URL or list
  useEffect(() => {
    if (paramTaskId) {
      setSelectedTaskId(paramTaskId);
    }
  }, [paramTaskId]);

  useEffect(() => {
    if (selectedTaskId && assignedTasks.length > 0) {
      const found = assignedTasks.find((t: any) => t.id === selectedTaskId);
      if (found) {
        setActiveTask(found);
        return;
      }
    }
    if (paramSurveyNo || paramLandholder) {
      setActiveTask({
        id: paramTaskId || "TASK-WALK",
        surveyNo: paramSurveyNo || "N/A",
        village: paramVillage || "Assigned Village",
        landholder: paramLandholder || "Landholder",
        ulpin: paramUlpin || "ULPIN-PENDING",
        recordedAreaHa: paramRecordedArea ?? 0,
        caseNo: paramCaseNo || "AC-2026",
      });
    }
  }, [selectedTaskId, assignedTasks, paramTaskId, paramSurveyNo, paramVillage, paramLandholder, paramUlpin, paramRecordedArea, paramCaseNo]);

  // GPS Tracking State
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [positions, setPositions] = useState<[number, number][]>([]);
  const [currentGps, setCurrentGps] = useState<[number, number] | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [calculatedAreaSqM, setCalculatedAreaSqM] = useState<number | null>(null);
  const [mapType, setMapType] = useState<"satellite" | "standard">("satellite");
  const [surveyNotes, setSurveyNotes] = useState<string>("");
  const [demarcationConfirmed, setDemarcationConfirmed] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [savedDataResult, setSavedDataResult] = useState<any>(null);

  const watchIdRef = useRef<number | null>(null);

  // Handle Geolocation Watch
  const startTracking = () => {
    if (!("geolocation" in navigator)) {
      alert("GPS Tracking is not supported on this device/browser.");
      return;
    }

    setIsTracking(true);
    setIsPaused(false);
    setPositions([]);
    setCalculatedAreaSqM(null);
    setSaveSuccess(false);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = pos.coords.accuracy;
        setCurrentGps([lat, lng]);
        setGpsAccuracy(acc);

        // Add coordinate to walk trail
        setPositions((prev) => {
          // Avoid logging duplicate identical points within 1 meter
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const dist = Math.hypot(lat - last[0], lng - last[1]) * 111000;
            if (dist < 1.2) return prev;
          }
          return [...prev, [lat, lng]];
        });
      },
      (error) => {
        console.warn("GPS tracking error:", error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );
  };

  const addManualCornerPoint = () => {
    if (currentGps) {
      setPositions((prev) => [...prev, currentGps]);
    } else if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setCurrentGps(newPos);
          setGpsAccuracy(pos.coords.accuracy);
          setPositions((prev) => [...prev, newPos]);
        },
        (err) => alert("Could not fetch GPS point: " + err.message),
        { enableHighAccuracy: true }
      );
    }
  };

  const pauseTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsPaused(true);
  };

  const resumeTracking = () => {
    setIsPaused(false);
    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentGps([lat, lng]);
          setGpsAccuracy(pos.coords.accuracy);
          setPositions((prev) => [...prev, [lat, lng]]);
        },
        (error) => console.warn("GPS error:", error.message),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
    setIsPaused(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (positions.length >= 3) {
      const computed = calculateGeodesicArea(positions);
      setCalculatedAreaSqM(computed);
    } else {
      alert("At least 3 corner points are required to measure a closed parcel area. Walk around the perimeter.");
    }
  };

  const resetSurvey = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setIsPaused(false);
    setPositions([]);
    setCalculatedAreaSqM(null);
    setSaveSuccess(false);
  };

  // Conversions
  const areaHa = useMemo(() => {
    if (calculatedAreaSqM === null) return null;
    return calculatedAreaSqM / 10000;
  }, [calculatedAreaSqM]);

  const areaAcres = useMemo(() => {
    if (calculatedAreaSqM === null) return null;
    return calculatedAreaSqM / 4046.8564;
  }, [calculatedAreaSqM]);

  const areaVigha = useMemo(() => {
    if (areaAcres === null) return null;
    return areaAcres * 1.6; // Standard Gujarat/North Indian Vigha conversion (approx 1 Acre = 1.6 Vigha)
  }, [areaAcres]);

  // Discrepancy comparison against official recorded area
  const recordedHa = activeTask?.recordedAreaHa || paramRecordedArea || 0;
  const areaVariancePct = useMemo(() => {
    if (!areaHa || !recordedHa || recordedHa === 0) return null;
    return ((areaHa - recordedHa) / recordedHa) * 100;
  }, [areaHa, recordedHa]);

  // Save to Backend Database
  const handleSaveToBackend = async () => {
    if (!calculatedAreaSqM || positions.length < 3) {
      alert("Please complete the survey and record at least 3 perimeter vertices.");
      return;
    }

    const taskId = activeTask?.id || selectedTaskId || undefined;
    const notes =
      surveyNotes.trim() ||
      `GPS Walking Survey: ${positions.length} boundary vertices. Measured ${areaHa?.toFixed(4)} Ha (${areaAcres?.toFixed(3)} Acres).`;

    try {
      const result = await saveSurveyMutation.mutateAsync({
        taskId,
        measuredAreaSqM: calculatedAreaSqM,
        measuredAreaHa: areaHa ? Number(areaHa.toFixed(4)) : undefined,
        measuredAreaAcres: areaAcres ? Number(areaAcres.toFixed(3)) : undefined,
        positions,
        surveyType: "GPS_WALKING_DEMARCATION",
        observations: notes,
        demarcationConfirmed,
      });

      setSaveSuccess(true);
      setSavedDataResult(result);
    } catch (err: any) {
      console.error("Failed to save survey to backend:", err);
      alert("Failed to save survey to backend: " + (err.message || "Unknown error"));
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea] py-6 px-3 sm:px-6 space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d8d3c9] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/field?tab=tasks"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ef5b2a] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Assigned Tasks</span>
            </Link>
            <span className="text-[#d8d3c9]">•</span>
            <span className="text-xs text-[#68655e]">Field Officer Demarcation Module</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171716] flex items-center gap-2">
            <Footprints className="h-7 w-7 text-[#ef5b2a]" />
            <span>GPS Walking Survey & Area Calculator</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#68655e] mt-1">
            Walk along the boundary stones to record high-precision perimeter points and auto-compute legal parcel area.
          </p>
        </div>

        {/* Action Header Controls */}
        <div className="flex items-center gap-2">
          <Link href="/gis">
            <Button
              variant="outline"
              size="sm"
              className="bg-[#fffdf8] border-[#d8d3c9] text-[#171716] text-xs flex items-center gap-1.5"
            >
              <MapIcon className="h-3.5 w-3.5 text-[#ef5b2a]" />
              <span>GIS Map</span>
            </Button>
          </Link>
          <Link href="/field?tab=survey">
            <Button
              variant="outline"
              size="sm"
              className="bg-[#fffdf8] border-[#d8d3c9] text-[#171716] text-xs flex items-center gap-1.5"
            >
              <FileCheck2 className="h-3.5 w-3.5 text-[#171716]" />
              <span>Digital Form</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Prominent Task Name & Details Banner */}
      <Card className="border-2 border-[#ef5b2a]/40 bg-[#fffdf8] shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#171716] to-[#2d2d2c] text-[#fffdf8] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#ef5b2a] text-[#fffdf8] font-mono font-bold text-xs uppercase px-2 py-0.5">
              {activeTask?.id || selectedTaskId || "CUSTOM SURVEY"}
            </Badge>
            <span className="font-bold text-sm sm:text-base">
              {activeTask ? `Survey No. ${activeTask.surveyNo} • ${activeTask.village}` : "Demarcation Task"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-300">ULPIN:</span>
            <span className="font-mono font-semibold text-[#fffdf8]">{activeTask?.ulpin || "KA-BLR-2026-DEMO"}</span>
          </div>
        </div>

        <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-[#f4f1ea] border border-[#d8d3c9]">
            <span className="text-[10px] text-[#68655e] block uppercase font-bold">Landholder</span>
            <span className="font-semibold text-[#171716] truncate block mt-0.5" title={activeTask?.landholder}>
              {activeTask?.landholder || "Government Land / General Survey"}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#f4f1ea] border border-[#d8d3c9]">
            <span className="text-[10px] text-[#68655e] block uppercase font-bold">Official Recorded Area</span>
            <span className="font-semibold text-[#171716] block mt-0.5">
              {recordedHa ? `${recordedHa} Ha (${(recordedHa * 2.471).toFixed(2)} Acres)` : "Pending Demarcation"}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#f4f1ea] border border-[#d8d3c9]">
            <span className="text-[10px] text-[#68655e] block uppercase font-bold">Location & Taluk</span>
            <span className="font-semibold text-[#171716] block mt-0.5">
              {activeTask?.taluk ? `${activeTask.village}, ${activeTask.taluk}` : activeTask?.village || "Bengaluru Rural"}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#f4f1ea] border border-[#d8d3c9]">
            <span className="text-[10px] text-[#68655e] block uppercase font-bold">Case Dossier No.</span>
            <span className="font-mono text-[#171716] block mt-0.5">{activeTask?.caseNo || "AC-2026-KA-001234"}</span>
          </div>
        </CardContent>

        {/* Task Switcher Dropdown if multiple tasks are available */}
        {assignedTasks.length > 1 && (
          <div className="px-4 pb-3 flex items-center justify-between border-t border-[#d8d3c9]/60 pt-2.5 text-xs">
            <span className="text-[#68655e] flex items-center gap-1">
              <Info className="h-3 w-3 text-[#ef5b2a]" />
              Need to survey a different assigned parcel?
            </span>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="px-2.5 py-1 text-xs rounded border border-[#d8d3c9] bg-[#fffdf8] font-medium text-[#171716]"
            >
              {assignedTasks.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.id} - Survey No. {t.surveyNo} ({t.village}) - {t.landholder}
                </option>
              ))}
            </select>
          </div>
        )}
      </Card>

      {/* Main Interactive Map & Walking Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Leaflet GPS Map */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#171716] uppercase tracking-wider flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isTracking ? "bg-emerald-500 animate-ping" : "bg-[#68655e]"}`} />
                {isTracking ? "Live GPS Walking Track Active" : "Demarcation Map"}
              </span>
              {positions.length > 0 && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  {positions.length} Points Logged
                </Badge>
              )}
            </div>

            {/* Map Style Toggle */}
            <div className="flex items-center gap-1 bg-[#eae6dc] p-0.5 rounded-lg border border-[#d8d3c9] text-[11px]">
              <button
                type="button"
                onClick={() => setMapType("satellite")}
                className={`px-2 py-0.5 rounded font-bold transition-all ${
                  mapType === "satellite" ? "bg-[#171716] text-[#fffdf8]" : "text-[#68655e]"
                }`}
              >
                Satellite
              </button>
              <button
                type="button"
                onClick={() => setMapType("standard")}
                className={`px-2 py-0.5 rounded font-bold transition-all ${
                  mapType === "standard" ? "bg-[#171716] text-[#fffdf8]" : "text-[#68655e]"
                }`}
              >
                Street Map
              </button>
            </div>
          </div>

          <SurveyMap
            positions={positions}
            isTracking={isTracking}
            currentPosition={currentGps}
            mapType={mapType}
            height="440px"
            calculatedArea={calculatedAreaSqM}
          />

          {/* GPS Diagnostics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-[#fffdf8] border border-[#d8d3c9]">
              <span className="text-[10px] text-[#68655e] block">GPS Accuracy</span>
              <span className="font-semibold text-[#171716] flex items-center gap-1 mt-0.5">
                <Compass className="h-3 w-3 text-[#ef5b2a]" />
                {gpsAccuracy ? `± ${gpsAccuracy.toFixed(1)} m` : "Waiting GPS..."}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-[#fffdf8] border border-[#d8d3c9]">
              <span className="text-[10px] text-[#68655e] block">Current Latitude</span>
              <span className="font-mono text-[#171716] font-semibold block mt-0.5">
                {currentGps ? currentGps[0].toFixed(6) : "13.294100"}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-[#fffdf8] border border-[#d8d3c9]">
              <span className="text-[10px] text-[#68655e] block">Current Longitude</span>
              <span className="font-mono text-[#171716] font-semibold block mt-0.5">
                {currentGps ? currentGps[1].toFixed(6) : "77.534200"}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-[#fffdf8] border border-[#d8d3c9]">
              <span className="text-[10px] text-[#68655e] block">Logged Vertices</span>
              <span className="font-semibold text-[#171716] block mt-0.5">
                {positions.length} coordinates
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Surveyor Walk Controls & Calculation HUD */}
        <div className="space-y-4">
          <Card className="border border-[#d8d3c9] bg-[#fffdf8] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-1.5 text-[#171716]">
                <Footprints className="h-4 w-4 text-[#ef5b2a]" />
                <span>Survey Walk Controls</span>
              </CardTitle>
              <CardDescription className="text-xs text-[#68655e]">
                Walk the boundary line from stone to stone.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {!isTracking ? (
                <Button
                  onClick={startTracking}
                  className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-[#fffdf8] font-bold text-sm flex items-center justify-center gap-2 rounded-lg shadow-sm transition-all"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>START WALKING SURVEY</span>
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button
                    onClick={stopTracking}
                    className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-[#fffdf8] font-bold text-sm flex items-center justify-center gap-2 rounded-lg shadow-sm"
                  >
                    <Square className="h-4 w-4 fill-white" />
                    <span>STOP & CALCULATE AREA</span>
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    {!isPaused ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={pauseTracking}
                        className="text-xs border-[#d8d3c9] flex items-center gap-1 text-[#171716]"
                      >
                        <Pause className="h-3.5 w-3.5 text-amber-600" />
                        <span>Pause</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resumeTracking}
                        className="text-xs border-[#d8d3c9] flex items-center gap-1 text-[#171716]"
                      >
                        <Play className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Resume</span>
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addManualCornerPoint}
                      className="text-xs border-[#d8d3c9] flex items-center gap-1 text-[#171716]"
                    >
                      <MapPin className="h-3.5 w-3.5 text-[#ef5b2a]" />
                      <span>Add Corner</span>
                    </Button>
                  </div>
                </div>
              )}

              {positions.length > 0 && !isTracking && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetSurvey}
                  className="w-full text-xs text-[#68655e] hover:text-[#171716] flex items-center justify-center gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset & Start Over</span>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Real-time Calculation Result Card */}
          {calculatedAreaSqM !== null && (
            <Card className="border-2 border-blue-500 bg-gradient-to-br from-blue-50/70 to-indigo-50/50 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-blue-950 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span>Calculated Land Area</span>
                  </CardTitle>
                  <Badge className="bg-blue-600 text-[#fffdf8] text-[10px]">WGS84 Turf Geodesic</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-white/80 border border-blue-200 text-center">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-blue-900">
                    {calculatedAreaSqM.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[11px] text-blue-600 font-medium">Square Meters (m²)</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded bg-white/80 border border-blue-200">
                    <div className="font-mono font-bold text-sm text-[#171716]">
                      {areaHa?.toFixed(4)} Ha
                    </div>
                    <span className="text-[10px] text-[#68655e]">Hectares</span>
                  </div>

                  <div className="p-2 rounded bg-white/80 border border-blue-200">
                    <div className="font-mono font-bold text-sm text-[#171716]">
                      {areaAcres?.toFixed(3)} Acres
                    </div>
                    <span className="text-[10px] text-[#68655e]">(~ {areaVigha?.toFixed(2)} Vigha)</span>
                  </div>
                </div>

                {/* Variance vs Official Record */}
                {areaVariancePct !== null && (
                  <div
                    className={`p-2.5 rounded-lg border text-[11px] flex items-center justify-between ${
                      Math.abs(areaVariancePct) <= 2.5
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                        : Math.abs(areaVariancePct) <= 5
                        ? "bg-amber-50 border-amber-300 text-amber-900"
                        : "bg-rose-50 border-rose-300 text-rose-900"
                    }`}
                  >
                    <span>Variance vs Recorded ({recordedHa} Ha):</span>
                    <strong className="font-mono font-bold text-xs">
                      {areaVariancePct >= 0 ? `+${areaVariancePct.toFixed(2)}%` : `${areaVariancePct.toFixed(2)}%`}
                    </strong>
                  </div>
                )}

                {/* Observation Notes & Demarcation */}
                <div className="space-y-2 pt-1 border-t border-blue-200">
                  <label className="text-[11px] font-bold text-blue-950 block">
                    Surveyor Field Observations:
                  </label>
                  <Textarea
                    rows={2}
                    value={surveyNotes}
                    onChange={(e) => setSurveyNotes(e.target.value)}
                    placeholder="E.g., North stone intact, south canal bund walked, demarcation agreed with farmer."
                    className="text-xs bg-white border-blue-200"
                  />

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="confirmDemarc"
                      checked={demarcationConfirmed}
                      onChange={(e) => setDemarcationConfirmed(e.target.checked)}
                      className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <label htmlFor="confirmDemarc" className="text-[11px] text-blue-950 font-medium cursor-pointer">
                      Boundary demarcation verified on ground with landholder
                    </label>
                  </div>
                </div>

                {/* Save to Backend Database Button */}
                <Button
                  onClick={handleSaveToBackend}
                  disabled={saveSurveyMutation.isPending || saveSuccess}
                  className={`w-full h-10 font-bold text-xs flex items-center justify-center gap-2 rounded-lg transition-all ${
                    saveSuccess
                      ? "bg-emerald-700 text-white cursor-default"
                      : "bg-[#ef5b2a] hover:bg-[#d94a1b] text-white shadow-sm"
                  }`}
                >
                  {saveSurveyMutation.isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Saving to PostgreSQL Backend...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>SURVEY SAVED TO DATABASE</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>SAVE SURVEY TO BACKEND</span>
                    </>
                  )}
                </Button>

                {saveSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Saved & Submitted Successfully!</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-emerald-800">
                      Task <strong>{activeTask?.id || selectedTaskId}</strong> has been updated in the database with status{" "}
                      <strong>SUBMITTED</strong> and measured area <strong>{areaHa?.toFixed(4)} Ha</strong>.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <Link href="/field?tab=tasks" className="flex-1">
                        <Button size="sm" variant="outline" className="w-full text-[11px] h-7 bg-white border-emerald-300 text-emerald-900">
                          Return to Tasks
                        </Button>
                      </Link>
                      <Link href="/gis" className="flex-1">
                        <Button size="sm" variant="outline" className="w-full text-[11px] h-7 bg-white border-emerald-300 text-emerald-900">
                          View in GIS
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SurveyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4f1ea] flex items-center justify-center p-6 text-[#171716]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-3 border-[#ef5b2a] border-t-transparent animate-spin" />
            <p className="text-sm font-semibold">Loading BhoomiSetu Walking Survey...</p>
          </div>
        </div>
      }
    >
      <SurveyContent />
    </Suspense>
  );
}
