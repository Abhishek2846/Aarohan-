"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GisMap } from "@/components/gis/gis-map";
import { GeotaggedPhotoViewer } from "@/components/gis/geotagged-photo-viewer";
import {
  SUPPORTED_CITIES,
  CityMapPreset,
  generateBufferPolygon,
  GisParcel,
  GeotaggedPhoto,
} from "@/lib/gis-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { formatINR, formatAreaHectares } from "@/lib/utils";
import { useProjectsQuery } from "@/hooks/queries/use-bhoomi-queries";
import {
  Layers,
  MapPin,
  Camera,
  CheckCircle2,
  ShieldCheck,
  Eye,
  Info,
  Coins,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Sliders,
  Sparkles,
  Building,
  RotateCcw,
  PenTool,
  Compass,
  ArrowLeft,
} from "lucide-react";

// Robust matcher between Database Projects, URL query params, and GIS Corridor Presets
function resolveActivePreset(
  dbProjects: any[],
  projectParam: string | null,
  cityParam: string | null,
): { preset: CityMapPreset; activeDbProject: any | null } {
  let matchedDbProject: any = null;

  // 1. Try matching database project first by ID, code, or title
  if (projectParam && dbProjects && dbProjects.length > 0) {
    matchedDbProject = dbProjects.find(
      (p: any) =>
        p.id === projectParam ||
        p.projectCode?.toLowerCase() === projectParam.toLowerCase() ||
        p.title?.toLowerCase() === projectParam.toLowerCase(),
    );
  }

  if (matchedDbProject) {
    const title = (matchedDbProject.title || "").toLowerCase();
    const code = (matchedDbProject.projectCode || "").toLowerCase();
    const state = (matchedDbProject.state || "").toLowerCase();

    let basePreset: CityMapPreset | undefined;

    // A. Bengaluru-Chennai Corridor
    if (
      title.includes("chennai") ||
      title.includes("malur") ||
      title.includes("hosakote") ||
      code.includes("blr-chn") ||
      code.includes("bce")
    ) {
      basePreset =
        SUPPORTED_CITIES.find((c) => c.id === "bengaluru-chennai") ||
        SUPPORTED_CITIES.find((c) => c.id === "chennai");
    }
    // B. Western Dedicated Freight Corridor
    else if (
      title.includes("freight") ||
      title.includes("wdfc") ||
      code.includes("wdfc")
    ) {
      basePreset =
        SUPPORTED_CITIES.find((c) => c.id === "western-dfc") ||
        SUPPORTED_CITIES.find((c) => c.id === "ahmedabad");
    }
    // C. Delhi-Mumbai Expressway & Vadodara
    else if (
      title.includes("delhi") ||
      title.includes("mumbai") ||
      code.includes("del-mum") ||
      title.includes("vadodara")
    ) {
      basePreset = SUPPORTED_CITIES.find((c) => c.id === "ahmedabad");
    }
    // D. Solar Park / Renewable Energy
    else if (title.includes("solar") || title.includes("tumakur")) {
      basePreset =
        SUPPORTED_CITIES.find((c) => c.id === "tumakuru") ||
        SUPPORTED_CITIES.find((c) => c.id === "mysuru");
    }
    // E. State-based matching fallback
    else if (state.includes("gujarat")) {
      basePreset = SUPPORTED_CITIES.find((c) => c.id === "ahmedabad");
    } else if (state.includes("tamil") || state.includes("chennai")) {
      basePreset = SUPPORTED_CITIES.find((c) => c.id === "chennai");
    } else if (state.includes("maharashtra") || state.includes("mumbai")) {
      basePreset = SUPPORTED_CITIES.find((c) => c.id === "mumbai");
    } else if (state.includes("telangana") || state.includes("hyderabad")) {
      basePreset = SUPPORTED_CITIES.find((c) => c.id === "hyderabad");
    } else if (state.includes("delhi") || state.includes("haryana")) {
      basePreset = SUPPORTED_CITIES.find((c) => c.id === "delhi");
    } else if (state.includes("karnataka")) {
      basePreset =
        SUPPORTED_CITIES.find((c) => c.id === "bengaluru-chennai") ||
        SUPPORTED_CITIES.find((c) => c.id === "bengaluru");
    }

    if (!basePreset) {
      basePreset = SUPPORTED_CITIES[0];
    }

    return {
      preset: {
        ...basePreset,
        corridorName: matchedDbProject.title,
        corridorNameHi: matchedDbProject.title,
        code: matchedDbProject.projectCode || basePreset.code,
      },
      activeDbProject: matchedDbProject,
    };
  }

  // 2. Direct projectParam match against preset IDs / codes
  if (projectParam) {
    const q = projectParam.toLowerCase().trim();
    const presetMatch = SUPPORTED_CITIES.find(
      (c) =>
        c.id.toLowerCase() === q ||
        c.code.toLowerCase() === q ||
        c.corridorName.toLowerCase().includes(q),
    );
    if (presetMatch) {
      return { preset: presetMatch, activeDbProject: null };
    }
  }

  // 3. Match by cityParam (name, id, state, corridor)
  if (cityParam) {
    const q = cityParam.toLowerCase().trim();
    const cityMatch = SUPPORTED_CITIES.find(
      (c) =>
        c.id.toLowerCase() === q ||
        c.name.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q) ||
        q.includes(c.state.toLowerCase()) ||
        c.corridorName.toLowerCase().includes(q),
    );
    if (cityMatch) {
      return { preset: cityMatch, activeDbProject: null };
    }
  }

  return { preset: SUPPORTED_CITIES[0], activeDbProject: null };
}

function GisContent() {
  const { user, activeRole, isAuthenticated } = useAuth();
  const { lang } = useI18n();
  const searchParams = useSearchParams();
  const isHi = lang === "hi";
  const isCitizen =
    activeRole === "CITIZEN" ||
    !isAuthenticated ||
    searchParams?.get("role") === "citizen" ||
    (typeof window !== "undefined" &&
      (localStorage.getItem("bhoomi_active_role") === "CITIZEN" ||
        document.cookie.includes("bhoomi_role=CITIZEN") ||
        document.referrer.includes("/citizen")));

  // Active Project & City URL params
  const projectParam = searchParams
    ? searchParams.get("project") || searchParams.get("projectId")
    : null;
  const cityParam = searchParams ? searchParams.get("city") : null;

  // Live database projects
  const { data: dbProjects = [] } = useProjectsQuery();

  const { preset: initialPreset, activeDbProject: initialDbProject } =
    useMemo(() => {
      return resolveActivePreset(dbProjects, projectParam, cityParam);
    }, [dbProjects, projectParam, cityParam]);

  const [selectedCity, setSelectedCity] =
    useState<CityMapPreset>(initialPreset);
  const [activeProject, setActiveProject] = useState<any | null>(
    initialDbProject,
  );
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [activeSideTab, setActiveSideTab] = useState<
    "parcels" | "photos" | "corridor"
  >("parcels");

  // Keep GIS map view dynamically synchronized with URL parameters & database projects
  useEffect(() => {
    const { preset: resolvedPreset, activeDbProject: resolvedProject } =
      resolveActivePreset(dbProjects, projectParam, cityParam);
    setSelectedCity(resolvedPreset);
    setActiveProject(resolvedProject);
    setCenter(
      isCitizen && resolvedPreset.id === "bengaluru"
        ? [13.294, 77.5335]
        : resolvedPreset.center,
    );
    setZoom(
      isCitizen && resolvedPreset.id === "bengaluru" ? 17 : resolvedPreset.zoom,
    );
    setCenterline(resolvedPreset.centerline);
    setSelectedParcel(null);
    setSelectedPhoto(null);
  }, [projectParam, cityParam, dbProjects, isCitizen]);

  // Citizen's personal parcel identifier
  const citizenUlpin = "KA-BLR-2026-0041";
  const citizenParcel = useMemo(() => {
    return (
      selectedCity.parcels.find((p) => p.ulpin === citizenUlpin) ||
      selectedCity.parcels[0] || {
        id: "PCL-KA-001",
        ulpin: citizenUlpin,
        khasra: "142/2A",
        village: "Doddaballapur",
        taluk: "Doddaballapur",
        district: "Bengaluru Rural",
        areaHa: 1.45,
        landCategory: "Agricultural",
        status: "AWARDED",
        ownerMasked: user?.name || "Rameshwar Sharma",
        estimatedAwardINR: 12522400,
        coordinates: [
          [13.292, 77.531],
          [13.295, 77.532],
          [13.296, 77.536],
          [13.293, 77.535],
        ],
      }
    );
  }, [selectedCity, citizenUlpin, user]);

  // Map View State
  const [center, setCenter] = useState<[number, number]>(
    isCitizen && selectedCity.id === "bengaluru"
      ? [13.294, 77.5335]
      : selectedCity.center,
  );
  const [zoom, setZoom] = useState(
    isCitizen && selectedCity.id === "bengaluru" ? 17 : selectedCity.zoom,
  );
  const [tileLayerType, setTileLayerType] = useState<"standard" | "satellite">(
    "standard",
  );

  // Alignment State
  const [centerline, setCenterline] = useState<[number, number][]>(
    selectedCity.centerline,
  );
  const [bufferMeters, setBufferMeters] = useState(60);

  // Layers Visibility
  const [showBuffer, setShowBuffer] = useState(true);
  const [showParcels, setShowParcels] = useState(true);
  const [showPhotos, setShowPhotos] = useState(true);

  // Selected Entities
  const [selectedParcel, setSelectedParcel] = useState<GisParcel | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<GeotaggedPhoto | null>(
    null,
  );

  // Switch City Handler
  const handleSelectCity = (city: CityMapPreset) => {
    setSelectedCity(city);
    setCenter(city.center);
    setZoom(city.zoom);
    setCenterline(city.centerline);
    setSelectedParcel(null);
    setSelectedPhoto(null);
    setIsCityModalOpen(false);
    sessionStorage.setItem("bhoomi_gis_city_chosen", "true");
  };

  // Dynamic Parcels & Photos List based on Role and City
  // CITIZEN receives role-shaped view: only their own masked parcel, no field photos
  const displayedParcels = useMemo(() => {
    if (isCitizen) {
      return [citizenParcel];
    }
    return selectedCity.parcels;
  }, [isCitizen, selectedCity, citizenParcel]);

  const displayedPhotos = useMemo(() => {
    if (isCitizen) {
      return [];
    }
    return selectedCity.photos;
  }, [isCitizen, selectedCity]);

  // Calculate Buffer Polygon dynamically
  const bufferPolygon = useMemo(() => {
    return generateBufferPolygon(centerline, bufferMeters);
  }, [centerline, bufferMeters]);

  const handlePhotoSelect = (photo: GeotaggedPhoto) => {
    setSelectedPhoto(photo);
    setCenter(photo.coordinates);
    setZoom(18);
  };

  // Filter cities in modal
  const filteredCities = useMemo(() => {
    if (!citySearchQuery.trim()) return SUPPORTED_CITIES;
    const q = citySearchQuery.toLowerCase();
    return SUPPORTED_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameHi.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q) ||
        c.stateHi.toLowerCase().includes(q) ||
        c.corridorName.toLowerCase().includes(q),
    );
  }, [citySearchQuery]);

  const totalAreaHa = displayedParcels.reduce((acc, p) => acc + p.areaHa, 0);
  const totalEstimatedCost = displayedParcels.reduce(
    (acc, p) => acc + p.estimatedAwardINR,
    0,
  );

  return (
    <div className="max-w-7xl mx-auto space-y-3">
      {/* --- SINGLE UNIFIED HEADER & CITY COMMAND BAR --- */}
      <div className="bg-[#fffdf8] border-[#d8d3c9] border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: City Selector & Corridor Info */}
        <div className="flex items-center gap-3">
          {isCitizen ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = "/citizen";
              }}
              className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold text-xs h-10 px-3.5 rounded-xl flex items-center gap-1.5 shadow-sm shrink-0"
              title={isHi ? "वापस नागरिक पोर्टल पर जाएं" : "Return to Citizen Portal"}
            >
              <ArrowLeft className="h-4 w-4 text-[#ef5b2a]" />
              <span>{isHi ? "वापस पोर्टल" : "Citizen Home"}</span>
            </Button>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#ef5b2a]/10 dark:bg-blue-950/60 border border-[#d8d3c9] dark:border-blue-800 flex items-center justify-center text-blue-600 shrink-0">
              <MapPin className="h-5 w-5 text-[#ef5b2a]" />
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {activeRole === "STATE_AUTHORITY" ? (
                <button
                  type="button"
                  onClick={() => setIsCityModalOpen(true)}
                  className="flex items-center gap-1.5 text-lg font-black text-[#171716] hover:text-[#ef5b2a] transition-colors group text-left"
                >
                  <span>
                    {activeProject
                      ? activeProject.title
                      : isHi
                        ? selectedCity.nameHi
                        : selectedCity.name}
                  </span>
                  <span className="text-xs font-normal text-[#68655e]">
                    (
                    {activeProject
                      ? `${activeProject.state}`
                      : isHi
                        ? selectedCity.stateHi
                        : selectedCity.state}
                    )
                  </span>
                  <ChevronDown className="h-4 w-4 text-[#68655e] group-hover:text-[#ef5b2a] transition-transform group-hover:translate-y-0.5" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5 text-lg font-black text-[#171716] text-left">
                  <span>
                    {activeProject
                      ? activeProject.title
                      : isHi
                        ? selectedCity.nameHi
                        : selectedCity.name}
                  </span>
                  <span className="text-xs font-normal text-[#68655e]">
                    (
                    {activeProject
                      ? `${activeProject.state}`
                      : isHi
                        ? selectedCity.stateHi
                        : selectedCity.state}
                    )
                  </span>
                </div>
              )}
              <Badge
                variant="outline"
                className="text-[10px] border-emerald-300 text-emerald-700 bg-emerald-50 font-bold"
              >
                {displayedParcels.length} {isHi ? "भूखंड" : "Plots"}
              </Badge>
              {activeProject && (
                <Badge className="bg-[#ef5b2a]/10 text-[#ef5b2a] border border-[#ef5b2a]/30 text-[10px] font-mono font-bold">
                  {activeProject.projectCode}
                </Badge>
              )}
            </div>
            <p className="text-xs text-[#68655e] line-clamp-1">
              {activeProject
                ? `${selectedCity.name} Corridor • ${activeProject.districts?.join(", ") || selectedCity.state} • ${selectedCity.corridorName}`
                : isHi
                  ? selectedCity.corridorNameHi
                  : selectedCity.corridorName}
            </p>
          </div>
        </div>

        {/* Right: Map Controls, Project Switcher & City Switcher */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Active Project Dropdown Switcher */}
          {activeRole === "STATE_AUTHORITY" &&
            dbProjects &&
            dbProjects.length > 0 && (
              <div className="flex items-center gap-1.5 bg-[#f4f1ea] border border-[#d8d3c9] rounded-xl px-2.5 py-1 text-xs">
                <Compass className="h-3.5 w-3.5 text-[#ef5b2a] shrink-0" />
                <span className="text-[#68655e] font-bold text-[11px] whitespace-nowrap">
                  {isHi ? "परियोजना:" : "Project:"}
                </span>
                <select
                  value={activeProject?.id || ""}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (selectedId) {
                      const { preset, activeDbProject } = resolveActivePreset(
                        dbProjects,
                        selectedId,
                        null,
                      );
                      setSelectedCity(preset);
                      setActiveProject(activeDbProject);
                      setCenter(preset.center);
                      setZoom(preset.zoom);
                      setCenterline(preset.centerline);
                      setSelectedParcel(null);
                      setSelectedPhoto(null);
                    }
                  }}
                  className="bg-transparent font-bold text-[#171716] focus:outline-none text-xs cursor-pointer max-w-[170px] sm:max-w-[240px] truncate"
                >
                  <option value="">
                    {isHi ? "-- सभी परियोजनाएं --" : "-- Select Project --"}
                  </option>
                  {dbProjects.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.projectCode})
                    </option>
                  ))}
                </select>
              </div>
            )}

          {/* Basemap Switcher */}
          <div className="flex items-center bg-[#f4f1ea] border-[#d8d3c9] rounded-lg p-0.5 border">
            <button
              onClick={() => setTileLayerType("standard")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                tileLayerType === "standard"
                  ? "bg-[#fffdf8] border-[#d8d3c9] text-blue-900 dark:text-[#171716] shadow-sm font-bold"
                  : "text-[#68655e] hover:text-slate-900 dark:hover:text-[#171716]"
              }`}
            >
              {isHi ? "नक्शा" : "Map"}
            </button>
            <button
              onClick={() => setTileLayerType("satellite")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                tileLayerType === "satellite"
                  ? "bg-[#fffdf8] border-[#d8d3c9] text-blue-900 dark:text-[#171716] shadow-sm font-bold"
                  : "text-[#68655e] hover:text-slate-900 dark:hover:text-[#171716]"
              }`}
            >
              {isHi ? "उपग्रह" : "Satellite"}
            </button>
          </div>

          {/* Layer Visibility Pills */}
          <div className="flex items-center gap-1.5 bg-[#f4f1ea] border-[#d8d3c9] rounded-lg p-1 border text-[11px]">
            <button
              type="button"
              onClick={() => setShowBuffer(!showBuffer)}
              className={`px-2 py-0.5 rounded transition-all font-medium ${
                showBuffer
                  ? "bg-[#ef5b2a]/10 text-[#ef5b2a] font-bold border border-amber-300"
                  : "text-[#68655e]"
              }`}
            >
              {isHi ? "कॉरिडोर बफर" : "Buffer"}
            </button>
            <button
              type="button"
              onClick={() => setShowParcels(!showParcels)}
              className={`px-2 py-0.5 rounded transition-all font-medium ${
                showParcels
                  ? "bg-[#ef5b2a]/10 text-[#ef5b2a] font-bold border border-[#d8d3c9]"
                  : "text-[#68655e]"
              }`}
            >
              {isHi ? "भूखंड" : "Plots"}
            </button>
            <button
              type="button"
              onClick={() => setShowPhotos(!showPhotos)}
              className={`px-2 py-0.5 rounded transition-all font-medium ${
                showPhotos
                  ? "bg-emerald-500/10 text-emerald-700 font-bold border border-emerald-300"
                  : "text-[#68655e]"
              }`}
            >
              {isHi ? "फ़ोटो" : "Photos"}
            </button>
          </div>

          {/* Change City Button */}
          {activeRole === "STATE_AUTHORITY" && (
            <Button
              size="sm"
              onClick={() => setIsCityModalOpen(true)}
              className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] text-xs font-bold h-8 px-3.5 rounded-full gap-1.5 shadow-sm"
            >
              <Search className="h-3.5 w-3.5 text-[#ef5b2a]" />
              <span>{isHi ? "शहर बदलें" : "Change City"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* --- QUICK SELECTION CHIPS --- */}
      {activeRole === "STATE_AUTHORITY" && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] text-[#68655e] uppercase font-bold tracking-wider shrink-0 pl-1 flex items-center gap-1">
            <Building className="h-3 w-3 text-[#ef5b2a]" />
            {isHi ? "त्वरित गलियारे:" : "Corridors & Cities:"}
          </span>
          {SUPPORTED_CITIES.map((c) => {
            const isCurrent = c.id === selectedCity.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectCity(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                  isCurrent
                    ? "bg-[#171716] text-[#fffdf8] border-[#171716] font-bold shadow-sm"
                    : "bg-[#f4f1ea] text-[#171716] border-[#d8d3c9] hover:border-[#ef5b2a]/40 hover:text-[#171716]"
                }`}
              >
                {isHi ? c.nameHi : c.name}
              </button>
            );
          })}
        </div>
      )}

      {/* --- MAIN GIS MAP & SIDE PANEL (2-COLUMN CLEAN GRID) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Leaflet Map Canvas */}
        <div className="lg:col-span-8 rounded-2xl overflow-hidden border shadow-sm h-[620px] relative bg-[#f4f1ea] dark:bg-[#fffdf8]">
          <GisMap
            center={center}
            zoom={zoom}
            centerline={centerline}
            bufferPolygon={bufferPolygon}
            parcels={displayedParcels}
            selectedParcel={selectedParcel}
            onSelectParcel={setSelectedParcel}
            photos={displayedPhotos}
            onSelectPhoto={setSelectedPhoto}
            isDrawing={false}
            onAddWaypoint={() => {}}
            tileLayerType={tileLayerType}
            showBuffer={showBuffer}
            showParcels={showParcels}
            showPhotos={isCitizen ? false : showPhotos}
          />

          {/* Minimal Floating Map Legend */}
          <div className="absolute bottom-4 left-4 z-[400] bg-white/95 dark:bg-[#fffdf8]/95 backdrop-blur-md rounded-xl p-2.5 border shadow-md text-[10px] space-y-1">
            <span className="font-bold text-[#171716] block uppercase tracking-wider text-[9px]">
              {selectedCity.name} {isHi ? "नक्शा संकेत" : "Legend"}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-blue-900 rounded" />
              <span>{isHi ? "कॉरिडोर मध्य रेखा" : "Alignment Centerline"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-amber-400/40 border border-amber-600 rounded-sm" />
              <span>
                {bufferMeters}m {isHi ? "सुरक्षा बफर" : "Buffer Zone"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#ef5b2a]/100/40 border border-blue-700 rounded-sm" />
              <span>{isHi ? "अधिग्रहित भूखंड" : "Cadastral Plot"}</span>
            </div>
            {!isCitizen && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-600 rounded-sm text-[#171716] flex items-center justify-center text-[7px]">
                  📷
                </span>
                <span>{isHi ? "सत्यापित फ़ोटो" : "GPS Survey Photo"}</span>
              </div>
            )}
          </div>
        </div>

        {/* Clean Side Inspector Panel */}
        <div className="lg:col-span-4 space-y-3">
          {/* Sub-tabs Header */}
          <div className="bg-[#fffdf8] p-1 rounded-xl border border-[#d8d3c9] flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveSideTab("parcels")}
              className={`flex-1 py-1.5 rounded-lg font-semibold text-center transition-all ${
                activeSideTab === "parcels"
                  ? "bg-[#ef5b2a]/10 text-[#ef5b2a] font-bold border border-[#ef5b2a]/30 shadow-sm"
                  : "text-[#68655e] hover:text-[#171716] hover:bg-[#f4f1ea]"
              }`}
            >
              {isHi ? "भूखंड सूची" : "Land Plots"} ({displayedParcels.length})
            </button>
            {!isCitizen && (
              <button
                onClick={() => setActiveSideTab("photos")}
                className={`flex-1 py-1.5 rounded-lg font-semibold text-center transition-all ${
                  activeSideTab === "photos"
                    ? "bg-[#ef5b2a]/10 text-[#ef5b2a] font-bold border border-[#ef5b2a]/30 shadow-sm"
                    : "text-[#68655e] hover:text-[#171716] hover:bg-[#f4f1ea]"
                }`}
              >
                {isHi ? "सर्वे फ़ोटो" : "Survey Photos"} ({displayedPhotos.length})
              </button>
            )}
            <button
              onClick={() => setActiveSideTab("corridor")}
              className={`flex-1 py-1.5 rounded-lg font-semibold text-center transition-all ${
                activeSideTab === "corridor"
                  ? "bg-[#ef5b2a]/10 text-[#ef5b2a] font-bold border border-[#ef5b2a]/30 shadow-sm"
                  : "text-[#68655e] hover:text-[#171716] hover:bg-[#f4f1ea]"
              }`}
            >
              {isHi ? "बफर नियंत्रण" : "Buffer"}
            </button>
          </div>

          {/* Tab 1: Parcels List */}
          {activeSideTab === "parcels" && (
            <Card className="border shadow-sm">
              <CardHeader className="p-3.5 pb-2 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold">
                    {selectedCity.name} —{" "}
                    {isHi ? "अधिसूचित भूखंड" : "Notified Land Plots"}
                  </CardTitle>
                  <span className="text-[11px] font-bold text-[#68655e]">
                    {formatAreaHectares(totalAreaHa)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-2 space-y-2 max-h-[520px] overflow-y-auto">
                {displayedParcels.map((parcel) => {
                  const isSelected = selectedParcel?.id === parcel.id;
                  return (
                    <div
                      key={parcel.id}
                      onClick={() => {
                        setSelectedParcel(parcel);
                        setCenter(parcel.coordinates[0]);
                        setZoom(16);
                      }}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[#ef5b2a]/10/80 border-blue-600 dark:bg-blue-950/40 ring-1 ring-blue-600 shadow-sm"
                          : "hover:bg-[#f4f1ea] dark:hover:bg-slate-800/40 bg-[#fffdf8] border-[#d8d3c9]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-[#ef5b2a] text-xs">
                          {parcel.ulpin}
                        </span>
                        <Badge
                          variant={
                            parcel.status === "ACQUIRED"
                              ? "success"
                              : parcel.status === "AWARDED"
                                ? "civic"
                                : "warning"
                          }
                          className="text-[9px] px-1.5 py-0"
                        >
                          {parcel.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#68655e]">
                        <span>
                          {isHi ? "खसरा:" : "Khasra:"}{" "}
                          <strong>{parcel.khasra}</strong> ({parcel.village})
                        </span>
                        <span className="font-bold text-[#171716]">
                          {parcel.areaHa} Ha
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#68655e] pt-1.5 mt-1.5 border-t">
                        <span className="truncate max-w-[150px]">
                          {parcel.ownerMasked}
                        </span>
                        <span className="font-semibold text-emerald-600">
                          {formatINR(parcel.estimatedAwardINR)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Tab 2: Geo-Tagged Survey Photos */}
          {activeSideTab === "photos" && (
            <Card className="border shadow-sm">
              <CardHeader className="p-3.5 pb-2 border-b">
                <CardTitle className="text-xs font-bold flex items-center justify-between">
                  <span>
                    {isHi
                      ? "फील्ड सर्वेक्षण फ़ोटो अभिलेख"
                      : "Field Survey Photo Evidence"}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {displayedPhotos.length} {isHi ? "चित्र" : "Photos"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-2 max-h-[520px] overflow-y-auto">
                {displayedPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => handlePhotoSelect(photo)}
                    className="p-3 rounded-xl border bg-[#fffdf8] border-[#d8d3c9] hover:border-blue-500 cursor-pointer transition-all flex items-center justify-between group shadow-sm text-xs"
                  >
                    <div className="space-y-1 pr-2">
                      <p className="font-bold text-[#171716] flex items-center gap-1.5 group-hover:text-[#ef5b2a] transition-colors">
                        <Camera className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{photo.title}</span>
                      </p>
                      <p className="text-[10px] text-[#68655e]">
                        {photo.capturedAt} • {photo.surveyor}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2.5 text-blue-700 bg-[#ef5b2a]/10 hover:bg-blue-100 border-[#d8d3c9]"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      <span>{isHi ? "देखें" : "View"}</span>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tab 3: Corridor & Buffer Configuration */}
          {activeSideTab === "corridor" && (
            <Card className="border shadow-sm">
              <CardHeader className="p-3.5 pb-2 border-b">
                <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-blue-600" />
                  <span>
                    {isHi
                      ? "कॉरिडोर चौड़ाई एवं RoW बफर"
                      : "Right-of-Way (RoW) Buffer"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                <div>
                  <div className="flex justify-between font-bold mb-1.5">
                    <span className="text-[#68655e]">
                      {isHi ? "बफर दूरी:" : "Buffer Width:"}
                    </span>
                    <span className="text-blue-700 font-mono font-bold text-sm">
                      {bufferMeters} meters
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="150"
                    step="10"
                    value={bufferMeters}
                    onChange={(e) => setBufferMeters(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-900"
                  />
                  <div className="flex justify-between text-[10px] text-[#68655e] mt-1">
                    <span>30m</span>
                    <span>60m (Standard)</span>
                    <span>150m</span>
                  </div>
                </div>

                <div className="p-3 bg-[#f4f1ea] border-[#d8d3c9] rounded-xl space-y-2 border text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#68655e]">
                      {isHi ? "कुल प्रभावित क्षेत्र:" : "Total Affected Area:"}
                    </span>
                    <span className="font-bold text-[#171716]">
                      {formatAreaHectares(totalAreaHa)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#68655e]">
                      {isHi
                        ? "अनुमानित मुआवजा राशि:"
                        : "Estimated Award Outlay:"}
                    </span>
                    <span className="font-bold text-emerald-600">
                      {formatINR(totalEstimatedCost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#68655e]">
                      {isHi ? "परियोजना कोड:" : "Statutory Project Code:"}
                    </span>
                    <span className="font-mono text-[#68655e]">
                      {selectedCity.code}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* --- PHOTO VIEWER MODAL --- */}
      <GeotaggedPhotoViewer
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onLocateOnMap={(ph) => {
          setCenter(ph.coordinates);
          setZoom(18);
        }}
      />

      {/* --- CITY SELECTION MODAL ("Which city do you want to see?") --- */}
      {isCityModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="city-dialog-title"
          className="fixed inset-0 z-50 bg-[#fffdf8]/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-[#fffdf8] border-[#d8d3c9] rounded-2xl max-w-2xl w-full border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Clean Modal Header */}
            <div className="p-5 pb-3 flex items-start justify-between border-b">
              <div>
                <h3
                  id="city-dialog-title"
                  className="text-lg font-black text-[#171716]"
                >
                  {isHi
                    ? "आप किस शहर या क्षेत्र का नक्शा देखना चाहते हैं?"
                    : "Which city or region do you want to see?"}
                </h3>
                <p className="text-xs text-[#68655e] mt-0.5">
                  {isHi
                    ? "किसी भी शहर का चयन करें और उसके भूखंड एवं सीमाएं देखें।"
                    : "Select a major urban or infrastructure corridor to load its boundary map."}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCityModalOpen(false)}
                className="h-8 w-8 p-0 text-[#68655e] hover:text-slate-900 dark:hover:text-[#171716]"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Filter Search */}
            <div className="p-3 border-b bg-[#f4f1ea] border-[#d8d3c9]/40">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#68655e]" />
                <Input
                  value={citySearchQuery}
                  onChange={(e) => setCitySearchQuery(e.target.value)}
                  placeholder={
                    isHi
                      ? "शहर खोजें (उदा. दिल्ली, मुंबई, बेंगलुरु, हैदराबाद)..."
                      : "Search city (e.g. Delhi, Mumbai, Bengaluru, Hyderabad)..."
                  }
                  className="pl-8 h-8 text-xs bg-[#fffdf8] border-[#d8d3c9]"
                />
              </div>
            </div>

            {/* Clean Grid of 8 Cities */}
            <div className="p-4 max-h-[50vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredCities.map((city) => {
                  const isCurrent = city.id === selectedCity.id;
                  return (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between group ${
                        isCurrent
                          ? "bg-[#ef5b2a]/10 border-blue-600 dark:bg-blue-950/40 ring-1 ring-blue-600"
                          : "hover:bg-[#f4f1ea] dark:hover:bg-slate-800/60 border-[#d8d3c9]"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-[#171716] group-hover:text-[#ef5b2a] transition-colors">
                            {isHi ? city.nameHi : city.name}
                          </span>
                          <span className="text-[10px] text-[#68655e]">
                            • {isHi ? city.stateHi : city.state}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#68655e] line-clamp-1">
                          {isHi ? city.corridorNameHi : city.corridorName}
                        </p>
                      </div>

                      <div className="shrink-0 pl-2">
                        {isCurrent ? (
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-[#171716] flex items-center justify-center text-xs">
                            <CheckCircle2 className="h-4 w-4" />
                          </span>
                        ) : (
                          <span className="text-[#68655e] group-hover:text-[#ef5b2a] group-hover:translate-x-0.5 transition-all">
                            <ChevronRight className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#f4f1ea] border-[#d8d3c9]/40 border-t flex items-center justify-between text-xs">
              <span className="text-[#68655e] text-[11px]">
                8 {isHi ? "शहर उपलब्ध" : "cities available"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCityModalOpen(false)}
                className="text-xs h-7 px-3"
              >
                {isHi ? "बंद करें" : "Close"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GisCommandCenterPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-12 text-center text-xs text-[#68655e]">
          Loading Land Boundary Map...
        </div>
      }
    >
      <GisContent />
    </Suspense>
  );
}
