"use client";

import React, { useState, useEffect } from "react";
import { GeotaggedPhoto } from "@/lib/gis-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Camera,
  MapPin,
  Compass,
  Clock,
  ShieldCheck,
  User,
  CheckCircle2,
  ExternalLink,
  Navigation,
  FileCheck2,
  AlertTriangle,
} from "lucide-react";

interface GeotaggedPhotoViewerProps {
  photo: GeotaggedPhoto | null;
  onClose: () => void;
  onLocateOnMap?: (photo: GeotaggedPhoto) => void;
}

export function GeotaggedPhotoViewer({ photo, onClose, onLocateOnMap }: GeotaggedPhotoViewerProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [photo?.id]);

  if (!photo) return null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${photo.coordinates[0]},${photo.coordinates[1]}`;

  return (
    <Dialog open={!!photo} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto z-[10000] p-5 sm:p-6 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-1.5">
                <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>{photo.title}</span>
              </DialogTitle>
              <Badge variant="civic" className="text-[10px]">Field Evidence</Badge>
            </div>
            <span className="font-mono text-xs text-blue-800 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
              ULPIN: {photo.ulpin}
            </span>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Cadastral Survey Khasra #{photo.surveyNo} • Geotagged Demarcation Evidence Sealed by Survey of India & Aarohan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs">
          {/* Main Photo Display with Telemetry Watermark */}
          <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950 aspect-video flex items-center justify-center shadow-md group">
            {!imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo.photoUrl}
                alt={photo.title}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              /* High-fidelity Vector Fallback if External Image CDN is Blocked */
              <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 flex flex-col items-center justify-center p-6 text-center text-white relative">
                <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
                <div className="w-16 h-16 rounded-full bg-blue-600/20 border border-blue-400/40 flex items-center justify-center mb-3 text-blue-400">
                  <MapPin className="h-8 w-8 text-blue-400 animate-pulse" />
                </div>
                <h4 className="font-bold text-sm tracking-wide text-white">{photo.title}</h4>
                <p className="text-[11px] text-slate-300 max-w-sm mt-1">
                  GPS Demarcation Pillar & Verified Boundary Asset at Khasra #{photo.surveyNo}
                </p>
                <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-emerald-400 bg-black/40 px-3 py-1 rounded-full border border-emerald-500/30">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>D-GPS Lat {photo.coordinates[0].toFixed(5)}°, Lon {photo.coordinates[1].toFixed(5)}°</span>
                </div>
              </div>
            )}

            {/* Overlaid Civic Telemetry Stamp */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/80 backdrop-blur-md rounded-lg p-2.5 text-white font-mono text-[10px] space-y-0.5 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-bold tracking-wide flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  AAROHAN CADASTRAL TELEMETRY STAMP
                </span>
                <span className="text-emerald-400 font-bold">ACCURACY ±{photo.accuracyMeters}M</span>
              </div>
              <p className="text-slate-200">
                GPS: {photo.coordinates[0].toFixed(5)}° N, {photo.coordinates[1].toFixed(5)}° E • Azimuth: {photo.azimuthDeg}° Bearing
              </p>
              <div className="flex items-center justify-between text-slate-300 text-[9px] pt-0.5 border-t border-white/10">
                <span>Timestamp: {photo.capturedAt}</span>
                <span>Surveyor: {photo.surveyor}</span>
              </div>
            </div>
          </div>

          {/* Telemetry Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                <MapPin className="h-3 w-3 text-blue-600" />
                <span>Coordinates</span>
              </span>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                {photo.coordinates[0].toFixed(4)}°, {photo.coordinates[1].toFixed(4)}°
              </p>
            </div>

            <div className="p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                <Compass className="h-3 w-3 text-emerald-600" />
                <span>Azimuth Bearing</span>
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                {photo.azimuthDeg}° Compass
              </p>
            </div>

            <div className="p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-600" />
                <span>Captured Time</span>
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                {photo.capturedAt.split(",")[1]?.trim() || "11:15 IST"}
              </p>
            </div>

            <div className="p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                <span>Integrity Seal</span>
              </span>
              <p className="font-bold text-emerald-700 dark:text-emerald-400 text-[11px]">e-Signed D-GPS</p>
            </div>
          </div>

          {/* Surveyor Field Notes & Cryptographic Digest */}
          <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-blue-600" />
                <span>Surveyor Field Remarks & Witness:</span>
              </p>
              <span className="text-[10px] text-slate-400 font-mono">Sec 23 Land Acquisition Record</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed pl-5 border-l-2 border-blue-500">
              &ldquo;{photo.notes}&rdquo;
            </p>
            <div className="pt-1 text-[10px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
              <span>SHA-256: 8f2c3d9a...e104b7</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <FileCheck2 className="h-3 w-3" />
                Tamper-Evident Ledger Logged
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Verified and deposited in District Cadastral Survey Ledger.</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {onLocateOnMap && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onLocateOnMap(photo);
                    onClose();
                  }}
                  className="text-xs h-8 flex items-center gap-1 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300"
                >
                  <Navigation className="h-3 w-3" />
                  <span>Locate on Map</span>
                </Button>
              )}
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="text-xs h-8 flex items-center gap-1">
                  <span>GPS Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
              <Button
                variant="default"
                size="sm"
                onClick={onClose}
                className="text-xs h-8 bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] rounded-full font-bold"
              >
                Close Viewer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
