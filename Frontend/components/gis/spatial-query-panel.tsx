"use client";

import React from "react";
import Link from "next/link";
import { GisParcel } from "@/lib/gis-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatAreaHectares } from "@/lib/utils";
import {
  Layers,
  Sparkles,
  MapPin,
  AlertTriangle,
  Coins,
  ArrowRight,
  CheckCircle2,
  Sliders,
  ExternalLink,
} from "lucide-react";

interface SpatialQueryPanelProps {
  intersectedParcels: GisParcel[];
  selectedParcel: GisParcel | null;
  bufferMeters: number;
  onBufferChange: (val: number) => void;
  onSelectParcel: (parcel: GisParcel | null) => void;
}

export function SpatialQueryPanel({
  intersectedParcels,
  selectedParcel,
  bufferMeters,
  onBufferChange,
  onSelectParcel,
}: SpatialQueryPanelProps) {
  const totalAreaHa = intersectedParcels.reduce((acc, p) => acc + p.areaHa, 0);
  const totalEstimatedCost = intersectedParcels.reduce((acc, p) => acc + p.estimatedAwardINR, 0);
  const hasDisputedParcels = intersectedParcels.some((p) => p.status === "DISPUTED");
  const hasForestOverlap = intersectedParcels.some((p) => p.landCategory === "Forest/Water");

  return (
    <div className="space-y-4 text-xs">
      {/* Buffer Distance Controller */}
      <Card className="border-blue-200 shadow-sm">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-blue-950 dark:text-blue-200">
              <Sliders className="h-3.5 w-3.5 text-blue-600" />
              <span>Right-of-Way (RoW) Buffer</span>
            </CardTitle>
            <Badge variant="civic" className="font-mono text-xs font-bold">
              {bufferMeters}m Corridor
            </Badge>
          </div>
          <CardDescription className="text-[11px]">
            Adjust buffer distance around alignment centerline to recalculate affected cadastral extents.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-1 space-y-2">
          <input
            type="range"
            min="20"
            max="150"
            step="5"
            value={bufferMeters}
            onChange={(e) => onBufferChange(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>20m (Urban)</span>
            <span>60m (National Highway)</span>
            <span>120m (Expressway)</span>
          </div>
        </CardContent>
      </Card>

      {/* Spatial Query Metrics Summary */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Spatial Intersection Query Results</span>
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">
              {intersectedParcels.length} Intersected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Affected Extent</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {formatAreaHectares(Number(totalAreaHa.toFixed(2)))}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Est. Compensation</span>
              <p className="font-bold text-emerald-700 font-mono text-[11px] truncate">
                {formatINR(totalEstimatedCost)}
              </p>
            </div>
          </div>

          {/* Environmental / Litigation Warnings */}
          {(hasForestOverlap || hasDisputedParcels) && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 space-y-1 text-[11px]">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span>Spatial Anomaly Detected</span>
              </div>
              {hasForestOverlap && (
                <p className="text-amber-700 dark:text-amber-400">
                  • 1 or more parcels overlap Eco-Sensitive / State Forest boundaries.
                </p>
              )}
              {hasDisputedParcels && (
                <p className="text-amber-700 dark:text-amber-400">
                  • Boundary litigation flagged in State e-Courts database.
                </p>
              )}
            </div>
          )}

          {/* Intersected Parcels Mini List */}
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] uppercase font-bold text-slate-400">
              Intersected Cadastral Parcels:
            </p>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {intersectedParcels.map((p) => {
                const isSelected = selectedParcel?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectParcel(isSelected ? null : p)}
                    className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200"
                        : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="font-mono font-bold text-[11px] block">{p.ulpin}</span>
                      <span className="text-[10px] text-slate-500">
                        Khasra #{p.khasra} • {p.areaHa} Ha • {p.landCategory}
                      </span>
                    </div>
                    <Badge
                      variant={p.status === "ACQUIRED" ? "success" : p.status === "DISPUTED" ? "danger" : "outline"}
                      className="text-[9px] px-1.5"
                    >
                      {p.status.replace("_", " ")}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          <Link href="/cases/new">
            <Button className="w-full bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold text-xs h-9 flex items-center justify-center gap-1.5 rounded-full shadow-sm mt-2">
              <span>Form Acquisition Case from Query</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
