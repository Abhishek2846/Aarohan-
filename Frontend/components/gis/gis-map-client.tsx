"use client";

import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Polygon,
  Marker,
  Popup,
  Tooltip,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { GisParcel, GeotaggedPhoto } from "@/lib/gis-data";
import { formatINR, formatAreaHectares } from "@/lib/utils";

const createWaypointIcon = (index: number) =>
  L.divIcon({
    className: "custom-waypoint-marker",
    html: `<div style="background-color:#1e3a8a;color:white;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.4);">${index + 1}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

const createCameraIcon = () =>
  L.divIcon({
    className: "custom-camera-marker",
    html: `<div style="background-color:#059669;color:white;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

function MapClickHandler({
  isDrawing,
  onAddWaypoint,
}: {
  isDrawing: boolean;
  onAddWaypoint: (point: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      if (isDrawing) {
        onAddWaypoint([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

function ChangeMapView({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    try {
      if (map && typeof map.setView === "function") {
        map.setView(center, zoom);
      }
    } catch {
      // Safe no-op if map is unmounting
    }
  }, [center, zoom, map]);
  return null;
}

interface GisMapClientProps {
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

export default function GisMapClient({
  center,
  zoom,
  centerline,
  bufferPolygon,
  parcels,
  selectedParcel,
  onSelectParcel,
  photos,
  onSelectPhoto,
  isDrawing,
  onAddWaypoint,
  tileLayerType,
  showBuffer,
  showParcels,
  showPhotos,
}: GisMapClientProps) {
  const getTileUrl = () => {
    switch (tileLayerType) {
      case "satellite":
        // ESRI World Imagery (Simulation for ISRO Bhuvan satellite layer)
        return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

      case "standard":
      default:
        // OpenStreetMap Standard
        return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    }
  };

  const getParcelStyle = (parcel: GisParcel) => {
    const isSelected = selectedParcel?.id === parcel.id;
    if (isSelected) {
      return {
        color: "#2563eb",
        weight: 3,
        fillColor: "#3b82f6",
        fillOpacity: 0.65,
      };
    }

    switch (parcel.status) {
      case "ACQUIRED":
        return {
          color: "#15803d",
          weight: 2,
          fillColor: "#16a34a",
          fillOpacity: 0.4,
        };
      case "AWARDED":
        return {
          color: "#1d4ed8",
          weight: 2,
          fillColor: "#2563eb",
          fillOpacity: 0.35,
        };
      case "OBJECTION_FILED":
        return {
          color: "#d97706",
          weight: 2,
          fillColor: "#f59e0b",
          fillOpacity: 0.35,
        };
      case "DISPUTED":
        return {
          color: "#b91c1c",
          weight: 2,
          fillColor: "#dc2626",
          fillOpacity: 0.45,
        };
      case "SURVEY_PENDING":
      default:
        return {
          color: "#6b7280",
          weight: 2,
          fillColor: "#9ca3af",
          fillOpacity: 0.3,
        };
    }
  };

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: "100%", height: "100%", minHeight: "520px" }}
        className="rounded-xl overflow-hidden shadow-inner"
      >
        <ChangeMapView center={center} zoom={zoom} />
        <MapClickHandler isDrawing={isDrawing} onAddWaypoint={onAddWaypoint} />

        <TileLayer
          url={getTileUrl()}
          attribution='&copy; <a href="https://osm.org">OpenStreetMap</a> | ISRO Bhuvan GIS Services | BhoomiSetu'
        />

        {/* 1. Dynamic Corridor Right-of-Way Buffer Polygon */}
        {showBuffer && bufferPolygon.length > 2 && (
          <Polygon
            positions={bufferPolygon}
            pathOptions={{
              color: "#f59e0b",
              weight: 2,
              fillColor: "#fbbf24",
              fillOpacity: 0.25,
              dashArray: "6 4",
            }}
          >
            <Tooltip sticky>
              <div className="text-xs font-semibold p-1">
                Right-of-Way (RoW) Requisition Corridor Buffer
              </div>
            </Tooltip>
          </Polygon>
        )}

        {/* 2. Alignment Centerline Polyline */}
        {centerline.length > 1 && (
          <Polyline
            positions={centerline}
            pathOptions={{
              color: "#1e3a8a",
              weight: 4,
              opacity: 0.9,
            }}
          >
            <Tooltip sticky>
              <div className="text-xs font-bold text-blue-900 p-1">
                Proposed Infrastructure Alignment Centerline
              </div>
            </Tooltip>
          </Polyline>
        )}

        {/* 3. Alignment Waypoint Markers */}
        {centerline.map((pt, idx) => (
          <Marker
            key={`waypoint-${idx}`}
            position={pt}
            icon={createWaypointIcon(idx)}
          >
            <Popup>
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-blue-900">
                  Corridor Waypoint #{idx + 1}
                </p>
                <p className="font-mono text-[11px] text-slate-500">
                  {pt[0].toFixed(5)}° N, {pt[1].toFixed(5)}° E
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 4. Cadastral Land Parcels Layer */}
        {showParcels &&
          parcels.map((parcel) => (
            <Polygon
              key={parcel.id}
              positions={parcel.coordinates}
              pathOptions={getParcelStyle(parcel)}
              eventHandlers={{
                click: () => onSelectParcel(parcel),
              }}
            >
              <Tooltip sticky>
                <div className="text-xs p-1 space-y-0.5">
                  <p className="font-bold font-mono text-blue-900">
                    {parcel.ulpin}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Khasra #{parcel.khasra} • {parcel.village}
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-700">
                    {formatAreaHectares(parcel.areaHa)} ({parcel.landCategory})
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Click to inspect Digital Twin
                  </p>
                </div>
              </Tooltip>
            </Polygon>
          ))}

        {/* 5. Geo-Tagged Field Survey Photo Markers */}
        {showPhotos &&
          photos.map((photo) => (
            <Marker
              key={photo.id}
              position={photo.coordinates}
              icon={createCameraIcon()}
              eventHandlers={{
                click: () => onSelectPhoto(photo),
              }}
            >
              <Tooltip sticky>
                <div className="text-xs p-1 space-y-0.5">
                  <p className="font-bold text-emerald-900">{photo.title}</p>
                  <p className="font-mono text-[10px] text-slate-500">
                    {photo.ulpin}
                  </p>
                  <p className="text-[10px] text-blue-700">
                    Click to inspect field photo
                  </p>
                </div>
              </Tooltip>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
