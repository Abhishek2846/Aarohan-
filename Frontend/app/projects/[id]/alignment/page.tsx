"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useProjectDetailQuery } from "@/hooks/queries/use-bhoomi-queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR, formatAreaHectares } from "@/lib/utils";
import {
  Map,
  ArrowLeft,
  UploadCloud,
  FileCheck2,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Maximize2,
} from "lucide-react";
import { Breadcrumbs } from "@/components/common/breadcrumbs";

export default function ProjectAlignmentUploadPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const { data: project, isLoading: projectLoading } = useProjectDetailQuery(projectId);
  const [fileName, setFileName] = useState("delhi_vadodara_spur_alignment.geojson");
  const [bufferMeters, setBufferMeters] = useState(60);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activePreset, setActivePreset] = useState("EXPRESSWAY_60M");

  // Real-time calculation based on buffer width
  const simulatedParcels = Math.round(312 * (bufferMeters / 60));
  const simulatedAreaHa = Number((142.4 * (bufferMeters / 60)).toFixed(2));
  const simulatedCompensationINR = Math.round(2850000000 * (bufferMeters / 60));
  const estimatedFamilies = Math.round(180 * (bufferMeters / 60));

  if (projectLoading) {
    return <div className="max-w-4xl mx-auto py-12 text-center text-xs text-[#68655e]">Loading project record from PostgreSQL...</div>;
  }

  const sampleIntersectedParcels = [
    {
      ulpin: "GJ-VAD-2026-0811",
      khasra: "214/1",
      village: "Channapatna",
      landType: "Agricultural",
      areaHa: 0.85,
      overlapPct: "100%",
      status: "Identified",
    },
    {
      ulpin: "GJ-VAD-2026-0812",
      khasra: "214/2",
      village: "Channapatna",
      landType: "Agricultural",
      areaHa: 1.2,
      overlapPct: "84%",
      status: "Identified",
    },
    {
      ulpin: "GJ-VAD-2026-0813",
      khasra: "215",
      village: "Channapatna",
      landType: "Commercial / Warehouse",
      areaHa: 0.45,
      overlapPct: "42%",
      status: "High Value",
    },
    {
      ulpin: "GJ-VAD-2026-0814",
      khasra: "216/A",
      village: "Channapatna",
      landType: "Forest Boundary Buffer",
      areaHa: 1.8,
      overlapPct: "65%",
      status: "Ecological Clearance Req",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <Breadcrumbs
        items={[
          { label: "Projects Portfolio", href: "/projects" },
          { label: project?.title || "Project", href: `/projects/${projectId}` },
          { label: "Corridor Simulation", isCurrent: true },
        ]}
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${projectId}`} aria-label="Back to project details">
            <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Back to project details">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-[#171716]">
                GIS Alignment Corridor Upload & Buffer Simulation
              </h1>
              <Badge variant="civic">Spatial Engine</Badge>
            </div>
            <p className="text-xs text-[#68655e] font-mono">
              Project: {project?.title || "Master Infrastructure Project"} ({project?.projectCode})
            </p>
          </div>
        </div>
      </div>

      {/* Upload Zone & Presets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Box */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-blue-600" />
              <span>Vector Alignment Ingestion (GeoJSON / KML / Shapefile)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Upload survey coordinates of the central centerline or right-of-way corridor to match with State Land Records & Maps.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-blue-200 dark:border-blue-900 rounded-2xl p-6 text-center space-y-3 bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/60 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 mx-auto">
                <Map className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-[#171716]">
                  {fileName}
                </p>
                <p className="text-xs text-[#68655e]">
                  Click or drag another corridor alignment file to recompute buffer
                </p>
              </div>
            </div>

            {/* Buffer Control Slider */}
            <div className="p-4 rounded-xl border bg-slate-50 dark:bg-[#fffdf8] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-[#68655e]" />
                  <span className="text-xs font-bold text-slate-800 dark:text-[#171716]">
                    Corridor Right-of-Way (RoW) Buffer Width
                  </span>
                </div>
                <Badge variant="outline" className="font-mono text-xs font-bold">
                  {bufferMeters} Meters Total
                </Badge>
              </div>

              <input
                type="range"
                min="20"
                max="150"
                step="5"
                value={bufferMeters}
                onChange={(e) => setBufferMeters(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-[#68655e] font-mono">
                <span>20m (Urban Metro)</span>
                <span>60m (National Highway 4/6 Lane)</span>
                <span>120m (Expressway + Rail Corridor)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Decision Support: Impact Simulation Summary */}
        <Card className="border-blue-200 bg-gradient-to-b from-blue-50/50 to-white dark:from-blue-950/20 dark:to-slate-900">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-blue-950 dark:text-blue-200">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Decision Support Simulation</span>
              </CardTitle>
              <Badge variant="civic" className="text-[10px]">
                Instant Compute
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Automated boundary matching against State Land Records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border flex items-center justify-between">
                <span className="text-[#68655e]">Affected Land Parcels:</span>
                <span className="font-bold font-mono text-sm text-blue-900 dark:text-blue-300">
                  {simulatedParcels} ULPINs
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border flex items-center justify-between">
                <span className="text-[#68655e]">Total Corridor Area:</span>
                <span className="font-bold text-slate-900 dark:text-[#171716]">
                  {formatAreaHectares(simulatedAreaHa)}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border flex items-center justify-between">
                <span className="text-[#68655e]">Estimated Families Impacted:</span>
                <span className="font-bold text-slate-900 dark:text-[#171716]">
                  ~{estimatedFamilies} Families
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border flex items-center justify-between">
                <span className="text-[#68655e]">Est. Compensation Outlay:</span>
                <span className="font-bold font-mono text-slate-900 dark:text-[#171716]">
                  {formatINR(simulatedCompensationINR)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t space-y-2">
              <p className="text-[11px] text-[#68655e]">
                Land classification breakdown for current buffer:
              </p>
              <div className="text-[11px] space-y-1 font-medium">
                <div className="flex justify-between">
                  <span>Agricultural:</span>
                  <span className="font-bold">78%</span>
                </div>
                <div className="flex justify-between">
                  <span>Commercial / Structures:</span>
                  <span className="font-bold">14%</span>
                </div>
                <div className="flex justify-between text-amber-700 dark:text-[#ef5b2a]">
                  <span>Forest / Eco-sensitive:</span>
                  <span className="font-bold">8% (Clearance Needed)</span>
                </div>
              </div>
            </div>

            <Link href="/cases/new">
              <Button className="w-full bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm text-xs h-9 mt-2 shadow-md shadow-amber-500/20">
                Generate Acquisition Case from Intersected Parcels
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Cadastral Intersected Parcels Table Preview */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">
              Identified Land Parcels Preview ({simulatedParcels} Total)
            </CardTitle>
            <CardDescription className="text-xs">
              Parcels identified via map boundary matching with 14-digit Land ID (ULPIN) registry.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            Tolerance: 0.05m
          </Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Land ID (ULPIN)</TableHead>
                <TableHead>Survey / Khasra</TableHead>
                <TableHead>Village / Taluk</TableHead>
                <TableHead>Land Category</TableHead>
                <TableHead>Affected Area</TableHead>
                <TableHead>Corridor Overlap %</TableHead>
                <TableHead className="text-right">Classification</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleIntersectedParcels.map((p) => (
                <TableRow key={p.ulpin}>
                  <TableCell className="font-mono text-xs font-bold text-blue-900 dark:text-blue-300">
                    {p.ulpin}
                  </TableCell>
                  <TableCell className="font-semibold text-xs">{p.khasra}</TableCell>
                  <TableCell className="text-xs">{p.village}</TableCell>
                  <TableCell className="text-xs">{p.landType}</TableCell>
                  <TableCell className="text-xs font-medium">{p.areaHa} Ha</TableCell>
                  <TableCell className="text-xs font-mono font-bold">{p.overlapPct}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={p.status.includes("High") || p.status.includes("Clearance") ? "warning" : "civic"} className="text-[10px]">
                      {p.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
