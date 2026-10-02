"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR, formatAreaHectares } from "@/lib/utils";
import {
  Layers,
  MapPin,
  ShieldCheck,
  Building,
  Coins,
  Scale,
  Camera,
  CheckCircle2,
  FileText,
  UserCheck,
  ExternalLink,
  Trees,
  Compass,
  Landmark,
  QrCode,
  X,
  Lock,
} from "lucide-react";

export interface ParcelTwinData {
  ulpin: string;
  surveyNo: string;
  village: string;
  taluk?: string;
  district?: string;
  state?: string;
  areaHa: number;
  ownerName: string;
  maskedOwner: string;
  ownerAadhaarRef: string;
  soilType: string;
  landClassification: string;
  awardINR: number;
  pfmsStatus: string;
  dispute: boolean;
  disputeDetails?: string;
}

interface ParcelDigitalTwinViewerProps {
  parcel?: Partial<ParcelTwinData>;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_PARCEL: ParcelTwinData = {
  ulpin: "KA-BLR-2026-0041",
  surveyNo: "142/2A",
  village: "Doddaballapur",
  taluk: "Doddaballapur",
  district: "Bengaluru Rural",
  state: "Karnataka",
  areaHa: 0.85,
  ownerName: "Kumaraswamy Patil",
  maskedOwner: "K**** P****",
  ownerAadhaarRef: "AADH-XXXX-XXXX-4819",
  soilType: "Red Sandy Loam",
  landClassification: "Dry Crop Agricultural (Unirrigated)",
  awardINR: 17000000,
  pfmsStatus: "PFMS Batch Dispatched - Credit Awaited",
  dispute: false,
};

export function ParcelDigitalTwinViewer({
  parcel = DEFAULT_PARCEL,
  isOpen,
  onClose,
}: ParcelDigitalTwinViewerProps) {
  const [activeTab, setActiveTab] = useState("geometry");
  const p: ParcelTwinData = { ...DEFAULT_PARCEL, ...parcel };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        {/* Header */}
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                    {p.ulpin}
                  </DialogTitle>
                  <Badge variant="civic" className="text-[10px]">
                    360° Digital Twin
                  </Badge>
                  {p.dispute ? (
                    <Badge variant="danger" className="text-[10px]">Disputed</Badge>
                  ) : (
                    <Badge variant="success" className="text-[10px]">Clear Title</Badge>
                  )}
                </div>
                <DialogDescription className="text-xs text-slate-500">
                  Survey Khasra #{p.surveyNo} • Village: {p.village}, {p.taluk} • Bhu-Aadhaar Certified
                </DialogDescription>
              </div>
            </div>

            <div className="text-right font-mono text-xs hidden sm:block">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Acquired Extent</span>
              <strong className="text-blue-900 dark:text-blue-300 text-sm">
                {p.areaHa} Hectares
              </strong>
            </div>
          </div>
        </DialogHeader>

        {/* 4 Multi-Dimension Digital Twin Tabs */}
        <Tabs defaultValue="geometry" className="space-y-4 pt-2">
          <TabsList className="grid grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs h-9">
            <TabsTrigger value="geometry" className="text-xs">
              Cadastral
            </TabsTrigger>
            <TabsTrigger value="tenure" className="text-xs">
              Tenure & KYC
            </TabsTrigger>
            <TabsTrigger value="assets" className="text-xs">
              Assets & Photo
            </TabsTrigger>
            <TabsTrigger value="award" className="text-xs">
              Statutory Award
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Cadastral & Geometry */}
          <TabsContent value="geometry" className="space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Interactive Cadastral SVG Polygon Visualizer */}
              <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center relative min-h-[220px]">
                <span className="absolute top-2 left-3 text-[10px] uppercase font-bold text-slate-400">
                  Cadastral Polygon Demarcation
                </span>
                <svg viewBox="0 0 200 160" className="w-44 h-36 drop-shadow-md">
                  {/* Cadastral Parcel Polygon */}
                  <polygon
                    points="30,40 160,30 175,130 50,140"
                    fill="rgba(37, 99, 235, 0.15)"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeDasharray="4 2"
                  />
                  {/* Boundary Corner Pillars */}
                  <circle cx="30" cy="40" r="5" fill="#ea580c" />
                  <circle cx="160" cy="30" r="5" fill="#ea580c" />
                  <circle cx="175" cy="130" r="5" fill="#ea580c" />
                  <circle cx="50" cy="140" r="5" fill="#ea580c" />
                  <text x="80" y="85" fill="#0A2540" fontSize="12" fontWeight="bold">
                    #{p.surveyNo}
                  </text>
                  <text x="75" y="100" fill="#2563eb" fontSize="9" fontWeight="600">
                    {p.areaHa} Ha
                  </text>
                </svg>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-600 inline-block" />
                    Boundary Pillar (DGPS)
                  </span>
                  <span>• DILRMP Closure Error: 0.002%</span>
                </div>
              </div>

              {/* Cadastral Attributes & Multi-unit conversion */}
              <div className="space-y-2">
                <div className="p-3 rounded-xl border bg-white dark:bg-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Unit Conversions</span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                      <span className="text-slate-400 text-[10px] block">Hectares</span>
                      <strong className="text-xs font-mono">{p.areaHa}</strong>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                      <span className="text-slate-400 text-[10px] block">Acres</span>
                      <strong className="text-xs font-mono">{(p.areaHa * 2.471).toFixed(2)}</strong>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                      <span className="text-slate-400 text-[10px] block">Gunthas</span>
                      <strong className="text-xs font-mono">{(p.areaHa * 98.84).toFixed(0)}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border bg-white dark:bg-slate-800 space-y-1 text-[11px]">
                  <p>
                    <span className="text-slate-400">Soil Classification:</span>{" "}
                    <strong>{p.soilType}</strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Land Revenue Classification:</span>{" "}
                    <strong>{p.landClassification}</strong>
                  </p>
                  <p>
                    <span className="text-slate-400">DILRMP Map Sheet Ref:</span>{" "}
                    <span className="font-mono text-blue-600">KA-BLR-MAP-2026-F14</span>
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: Tenure & Ownership */}
          <TabsContent value="tenure" className="space-y-3 text-xs">
            <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Authoritative Title & Jamabandi Record
                </span>
                <Badge variant="success" className="text-[10px]">
                  Aadhaar KYC Verified
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Pattadar Name</span>
                  <strong>{p.maskedOwner}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Passbook / Khata</span>
                  <span className="font-mono font-bold text-blue-600">KHT-88210</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">NPCI Bridge UID</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">{p.ownerAadhaarRef}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Ownership Share</span>
                  <strong>100% Sole Title</strong>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>30-Year Encumbrance Search (EC)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Sub-Registrar Doddaballapur: Certified NIL encumbrance or registered mortgage.
                </p>
              </div>

              <div className="p-3 rounded-xl border space-y-1">
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold">
                  <Scale className="h-4 w-4" />
                  <span>e-Courts Judicial Search</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  No active stay or litigation pending across Karnataka High Court or District Munsiff.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: Assets & Photos */}
          <TabsContent value="assets" className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-center">
                <Trees className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                <span className="text-slate-400 text-[10px] block">Fruit/Timber Trees</span>
                <strong className="text-sm font-mono">14 Trees</strong>
                <span className="text-[9px] text-slate-500 block">Teak & Mango</span>
              </div>
              <div className="p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-center">
                <Building className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <span className="text-slate-400 text-[10px] block">Farm Sheds</span>
                <strong className="text-sm font-mono">1 Shed</strong>
                <span className="text-[9px] text-slate-500 block">450 sq.ft GI Sheet</span>
              </div>
              <div className="p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-center">
                <Coins className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                <span className="text-slate-400 text-[10px] block">Active Borewell</span>
                <strong className="text-sm font-mono">1 Borewell</strong>
                <span className="text-[9px] text-slate-500 block">5 HP Submersible</span>
              </div>
            </div>

            {/* Geo-Tagged Photographic Evidence with burnt watermark preview */}
            <div className="p-3 rounded-xl border bg-slate-900 text-white space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold flex items-center gap-1.5 text-amber-400">
                  <Camera className="h-4 w-4" />
                  Watermarked Cadastral Field Photo Evidence
                </span>
                <Badge variant="outline" className="text-[9px] text-slate-300 border-slate-700">
                  SHA256-VERIFIED
                </Badge>
              </div>

              <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-end">
                <div className="w-full bg-[#171716]/95 p-2.5 text-[10px] font-mono space-y-0.5 border-t-2 border-[#ef5b2a]">
                  <p className="text-[#ef5b2a] font-bold">
                    AAROHAN STATUTORY FIELD EVIDENCE • GOVT OF INDIA
                  </p>
                  <p className="text-slate-200">
                    ULPIN: {p.ulpin} | SURVEY: #{p.surveyNo} | ACCURACY: ±1.4M
                  </p>
                  <p className="text-slate-400">
                    GPS: 13.2941° N, 77.5342° E | AZIMUTH: 42° | TIMESTAMP: 09 Sep 2026, 11:20 IST
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: Statutory Financial Award */}
          <TabsContent value="award" className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-emerald-950 dark:text-emerald-200 block">
                    Statutory RFCTLARR Award: {formatINR(p.awardINR)}
                  </span>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    Section 23 statutory determination including 100% Solatium
                  </p>
                </div>
                <Badge variant="success">Enacted</Badge>
              </div>

              <div className="space-y-1 text-[11px] bg-[#fffdf8] p-2.5 rounded-lg border border-[#d8d3c9]">
                <div className="flex justify-between">
                  <span className="text-[#68655e]">Market Value (Base)</span>
                  <span className="font-mono">{formatINR(7200000)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#68655e]">Rural Multiplier (1.25x)</span>
                  <span className="font-mono">{formatINR(1800000)}</span>
                </div>
                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>100% Statutory Solatium</span>
                  <span className="font-mono">{formatINR(7200000)}</span>
                </div>
                <div className="flex justify-between text-[#ef5b2a] font-semibold">
                  <span>12% Additional Interest from Sec 11</span>
                  <span className="font-mono">{formatINR(800000)}</span>
                </div>
                <div className="border-t border-[#d8d3c9] pt-1 flex justify-between font-bold text-[#171716]">
                  <span>Total Payable Entitlement</span>
                  <span className="font-mono">{formatINR(p.awardINR)}</span>
                </div>
              </div>

              <div className="p-2 bg-emerald-100/60 rounded text-[11px] text-emerald-900 flex items-center justify-between">
                <span>PFMS Status: <strong>{p.pfmsStatus}</strong></span>
                <span className="font-mono text-[10px]">SBI A/c: ••••4821</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="pt-3 border-t border-[#d8d3c9] flex justify-end">
          <Button size="sm" onClick={onClose} className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] text-xs font-bold rounded-full shadow-sm">
            Close Digital Twin
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
