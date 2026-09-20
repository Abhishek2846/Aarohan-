"use client";

import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Polygon, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Create custom DOM markers to avoid leaflet default png asset loading issues in Next.js
const createCurrentLocationIcon = () =>
  L.divIcon({
    className: "current-gps-marker",
    html: `
      <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:28px;height:28px;background:rgba(37,99,235,0.35);border-radius:50%;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="position:relative;width:14px;height:14px;background:#2563eb;border:2.5px solid #ffffff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const createWaypointIcon = (index) =>
  L.divIcon({
    className: "survey-waypoint-marker",
    html: `
      <div style="background:#ef5b2a;color:#ffffff;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;border:2px solid #ffffff;box-shadow:0 2px 4px rgba(0,0,0,0.35);">
        ${index + 1}
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

function MapRecenter({ center, isTracking }) {
  const map = useMap();
  useEffect(() => {
    if (center && isTracking) {
      map.panTo(center, { animate: true });
    }
  }, [center, isTracking, map]);
  return null;
}

/**
 * @param {{
 *   positions?: [number, number][];
 *   isTracking?: boolean;
 *   currentPosition?: [number, number] | null;
 *   mapType?: "satellite" | "standard" | string;
 *   height?: string;
 *   calculatedArea?: number | null;
 * }} props
 */
export default function SurveyMap(props) {
  const {
    positions = [],
    isTracking = false,
    currentPosition = null,
    mapType = "satellite",
    height = "420px",
    calculatedArea = null,
  } = props;
  // Center is the last recorded position, currentPosition, or default central India coordinates
  const activeCenter = useMemo(() => {
    if (currentPosition) return currentPosition;
    if (positions && positions.length > 0) return positions[positions.length - 1];
    return [13.2941, 77.5342]; // Doddaballapur / Bengaluru Rural project area
  }, [currentPosition, positions]);

  const tileUrl =
    mapType === "satellite"
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const tileAttribution =
    mapType === "satellite"
      ? "&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
      : "&copy; OpenStreetMap contributors";

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-[#d8d3c9] shadow-inner" style={{ height }}>
      <MapContainer
        center={activeCenter}
        zoom={18}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer url={tileUrl} attribution={tileAttribution} maxZoom={20} />

        <MapRecenter center={activeCenter} isTracking={isTracking} />

        {/* Start Point Marker */}
        {positions.length > 0 && (
          <Marker position={positions[0]} icon={createWaypointIcon(0)}>
            <Popup>
              <div className="p-1 text-xs">
                <strong className="text-emerald-700">Starting Corner #1</strong>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Lat: {positions[0][0].toFixed(6)}, Lng: {positions[0][1].toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Intermediate Waypoints */}
        {positions.slice(1, positions.length - 1).map((pos, idx) => (
          <Marker key={`wp-${idx + 1}`} position={pos} icon={createWaypointIcon(idx + 1)}>
            <Popup>
              <div className="p-1 text-xs">
                <strong>Corner Point #{idx + 2}</strong>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Lat: {pos[0].toFixed(6)}, Lng: {pos[1].toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Current Live Location Pulse Marker */}
        {activeCenter && (
          <Marker position={activeCenter} icon={createCurrentLocationIcon()}>
            <Popup>
              <div className="p-1 text-xs">
                <strong className="text-blue-600">Current Surveyor GPS Position</strong>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {isTracking ? "Tracking Live Walk..." : "Survey Paused / Idle"}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Live Walking Path Polyline */}
        {isTracking && positions.length > 1 && (
          <Polyline
            positions={positions}
            pathOptions={{
              color: "#ef5b2a",
              weight: 5,
              opacity: 0.9,
              dashArray: "8, 8",
            }}
          />
        )}

        {/* Finished Demarcated Polygon */}
        {!isTracking && positions.length > 2 && (
          <Polygon
            positions={positions}
            pathOptions={{
              color: "#ef5b2a",
              weight: 3,
              fillColor: "#2563eb",
              fillOpacity: 0.35,
            }}
          >
            {calculatedArea && (
              <Popup>
                <div className="p-1 text-xs space-y-1">
                  <strong className="text-blue-700 block border-b pb-1">Demarcated Parcel Boundary</strong>
                  <p className="text-[11px]">
                    Area: <strong>{calculatedArea.toFixed(2)} m²</strong>
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    (~ {(calculatedArea / 10000).toFixed(4)} Ha / {(calculatedArea / 4046.86).toFixed(3)} Acres)
                  </p>
                  <p className="text-[10px] text-slate-500">Vertices: {positions.length} boundary points</p>
                </div>
              </Popup>
            )}
          </Polygon>
        )}
      </MapContainer>
    </div>
  );
}

export { SurveyMap };
