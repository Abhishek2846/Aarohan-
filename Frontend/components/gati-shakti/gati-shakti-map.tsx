"use client";

import dynamic from "next/dynamic";
import React from "react";
import { SpatialConflictPolygon } from "@/types/gati-shakti";

interface GatiShaktiMapProps {
  center: [number, number];
  zoom: number;
  centerline: [number, number][];
  conflicts: SpatialConflictPolygon[];
  selectedConflict: SpatialConflictPolygon | null;
  onSelectConflict: (conflict: SpatialConflictPolygon | null) => void;
  activeLayers: string[];
  tileType: "satellite" | "standard";
}

const GatiShaktiMapDynamic = dynamic(() => import("./gati-shakti-map-client"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] rounded-xl bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center text-slate-400 space-y-3 border border-slate-200 dark:border-slate-800">
      <div className="w-10 h-10 rounded-full border-3 border-emerald-600 border-t-transparent animate-spin" />
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        Loading PM Gati Shakti National Master Plan GIS Layers...
      </p>
      <p className="text-xs text-slate-500">
        Overlaying MoEFCC Parivesh Forests, Indian Railways GAD & Defence Perimeters
      </p>
    </div>
  ),
});

export function GatiShaktiMap(props: GatiShaktiMapProps) {
  return <GatiShaktiMapDynamic {...props} />;
}
