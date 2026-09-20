"use client";

import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Polygon,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { SpatialConflictPolygon, GatiShaktiLayer } from "@/types/gati-shakti";

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface GatiShaktiMapClientProps {
  center: [number, number];
  zoom: number;
  centerline: [number, number][];
  conflicts: SpatialConflictPolygon[];
  selectedConflict: SpatialConflictPolygon | null;
  onSelectConflict: (conflict: SpatialConflictPolygon | null) => void;
  activeLayers: string[];
  tileType: "satellite" | "standard";
}

export default function GatiShaktiMapClient({
  center,
  zoom,
  centerline,
  conflicts,
  selectedConflict,
  onSelectConflict,
  activeLayers,
  tileType,
}: GatiShaktiMapClientProps) {
  const tileUrl =
    tileType === "satellite"
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const tileAttribution =
    tileType === "satellite"
      ? "&copy; Esri &mdash; National Geographic, ISRO Bhuvan"
      : "&copy; OpenStreetMap contributors";

  const visibleConflicts = (conflicts || []).filter((c) => (activeLayers || []).includes(c.layerCode));

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
      >
        <MapUpdater center={center} zoom={zoom} />
        <TileLayer url={tileUrl} attribution={tileAttribution} />

        {/* 1. Corridor Centerline Alignment */}
        {centerline && centerline.length > 1 && (
          <Polyline
            positions={centerline}
            pathOptions={{
              color: "#2563eb",
              weight: 5,
              opacity: 0.9,
              dashArray: undefined,
            }}
          >
            <Tooltip permanent={false} direction="top">
              <span className="font-semibold text-xs">National Infrastructure Corridor Alignment</span>
            </Tooltip>
          </Polyline>
        )}

        {/* 2. Gati Shakti Conflict Polygons & Crossings */}
        {visibleConflicts.map((conflict) => {
          const isSelected = selectedConflict?.conflictId === conflict.conflictId;
          return (
            <React.Fragment key={conflict.conflictId}>
              <Polygon
                positions={conflict.coordinates}
                eventHandlers={{
                  click: () => onSelectConflict(conflict),
                }}
                pathOptions={{
                  color: isSelected ? "#f59e0b" : conflict.colorHex,
                  fillColor: conflict.colorHex,
                  fillOpacity: isSelected ? 0.6 : 0.35,
                  weight: isSelected ? 4 : 2.5,
                  dashArray: conflict.layerCode === 'PETROLEUM_PIPELINE' ? "6, 6" : undefined,
                }}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-slate-900 min-w-[220px]">
                    <div className="flex items-center justify-between gap-2 border-b pb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                        {conflict.ministry}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        conflict.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {conflict.severity}
                      </span>
                    </div>
                    <p className="font-bold text-xs text-slate-950 mt-1">{conflict.layerName}</p>
                    <p className="text-[11px] text-slate-600 font-medium">Chainage: {conflict.chainage}</p>
                    <p className="text-[11px] text-slate-600">Affected Area: <strong className="text-slate-900">{conflict.affectedAreaHa} Ha</strong></p>
                    <p className="text-[10px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200 mt-1">
                      <strong>Statute:</strong> {conflict.statutoryAct}
                    </p>
                    <p className="text-[10px] text-slate-500 italic mt-0.5">
                      Remedy: {conflict.remedyAction}
                    </p>
                  </div>
                </Popup>
              </Polygon>

              {/* Conflict Centroid Pulsing Marker */}
              {conflict.coordinates.length > 0 && (
                <CircleMarker
                  center={conflict.coordinates[0]}
                  radius={isSelected ? 8 : 6}
                  pathOptions={{
                    color: "#ffffff",
                    fillColor: conflict.colorHex,
                    fillOpacity: 1,
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => onSelectConflict(conflict),
                  }}
                >
                  <Tooltip direction="right" offset={[10, 0]} opacity={0.9}>
                    <span className="text-[11px] font-bold">{conflict.layerName}</span>
                  </Tooltip>
                </CircleMarker>
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}
