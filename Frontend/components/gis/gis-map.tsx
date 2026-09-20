"use client";

import dynamic from "next/dynamic";
import React from "react";
import { GisParcel, GeotaggedPhoto } from "@/lib/gis-data";

interface GisMapProps {
  center: [number, number];
  zoom: number;
  centerline: [number, number][];
  bufferPolygon: [number, number][];
  parcels: GisParcel[];
  selectedParcel: GisParcel | null;
  onSelectParcel: (parcel: GisParcel | null) => void;
  photos: GeotaggedPhoto[];
  onSelectPhoto: (photo: GeotaggedPhoto) => void;
  isDrawing: boolean;
  onAddWaypoint: (point: [number, number]) => void;
  tileLayerType: "standard" | "satellite";
  showBuffer: boolean;
  showParcels: boolean;
  showPhotos: boolean;
}

const GisMapDynamic = dynamic(() => import("./gis-map-client"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] rounded-xl bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center text-slate-400 space-y-2 border">
      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      <p className="text-xs font-semibold">
        Initializing BhoomiSetu Spatial GIS Engine...
      </p>
      <p className="text-[11px] text-slate-500">
        Connecting to Cadastral Tile Services & ISRO Bhuvan
      </p>
    </div>
  ),
});

export function GisMap(props: GisMapProps) {
  return <GisMapDynamic {...props} />;
}
