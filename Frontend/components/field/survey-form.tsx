"use client";

import React, { useState } from "react";
import { GpsLocation } from "@/hooks/use-gps";
import { offlineSyncQueue } from "@/lib/offline-sync-queue";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Camera,
  CheckCircle2,
  Save,
  Trees,
  Home,
  RefreshCw,
  AlertCircle,
  FileCheck2,
} from "lucide-react";

interface SurveyFormProps {
  gpsLocation: GpsLocation;
  onRefreshGps: () => void;
  isOnline: boolean;
  onOpenCamera: () => void;
  attachedPhotoUrl: string | null;
  onSurveySubmitted: () => void;
}

export default function SurveyForm({
  gpsLocation,
  onRefreshGps,
  isOnline,
  onOpenCamera,
  attachedPhotoUrl,
  onSurveySubmitted,
}: SurveyFormProps) {
  const [ulpin, setUlpin] = useState("KA-BLR-2026-0045");
  const [khasra, setKhasra] = useState("145/2");
  const [village, setVillage] = useState("Doddaballapur");
  const [boundaryConfirmed, setBoundaryConfirmed] = useState(true);
  const [treesCount, setTreesCount] = useState("12");
  const [borewellsCount, setBorewellsCount] = useState("1");
  const [structuresCount, setStructuresCount] = useState("0");
  const [witnessName, setWitnessName] = useState("Sarpanch Narayan Gowda");
  const [remarks, setRemarks] = useState("Boundary pillars verified. No encroached structures observed.");
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ulpin,
      khasra,
      village,
      boundaryConfirmed,
      assets: {
        trees: Number(treesCount),
        borewells: Number(borewellsCount),
        structures: Number(structuresCount),
      },
      gps: {
        lat: gpsLocation.latitude,
        lng: gpsLocation.longitude,
        accuracy: gpsLocation.accuracyMeters,
      },
      photoAttached: !!attachedPhotoUrl,
      witness: witnessName,
      remarks,
    };

    // Save into Offline Sync Queue
    offlineSyncQueue.enqueue({
      type: "SURVEY_RECORD",
      title: `Cadastral Demarcation #${khasra}`,
      ulpin,
      surveyNo: khasra,
      payload,
    });

    setSubmittedMessage(
      isOnline
        ? "Record saved and transmitted to State Cadastral Ledger!"
        : "Record saved to Offline Queue! Will auto-sync when cellular signal returns."
    );

    setTimeout(() => {
      setSubmittedMessage(null);
      onSurveySubmitted();
    }, 2500);
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-blue-600" />
            <span>Joint Cadastral Survey & Demarcation</span>
          </CardTitle>
          <Badge variant={isOnline ? "success" : "warning"} className="text-[10px]">
            {isOnline ? "Online Upload" : "Offline Storage"}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Record boundary measurements, tree/borewell asset counts, and geo-tagged photographs on site.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {submittedMessage ? (
          <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-center space-y-2 text-xs">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <p className="font-bold text-base text-emerald-950 dark:text-emerald-200">
              Survey Record Logged
            </p>
            <p className="text-emerald-800 dark:text-emerald-300">{submittedMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* GPS Lock Banner */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <div>
                  <span className="font-bold font-mono text-[11px] text-slate-800 dark:text-slate-200">
                    {gpsLocation.latitude.toFixed(5)}° N, {gpsLocation.longitude.toFixed(5)}° E
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Satellite Accuracy: <strong className="text-emerald-600">±{gpsLocation.accuracyMeters}m</strong> ({gpsLocation.source})
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRefreshGps}
                className="h-7 text-xs flex items-center gap-1 self-start sm:self-auto"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Refresh GPS</span>
              </Button>
            </div>

            {/* Parcel Identifiers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Authoritative ULPIN
                </label>
                <Input
                  value={ulpin}
                  onChange={(e) => setUlpin(e.target.value)}
                  required
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Survey / Khasra No.
                </label>
                <Input
                  value={khasra}
                  onChange={(e) => setKhasra(e.target.value)}
                  required
                  className="h-9 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Revenue Village
                </label>
                <Input
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Assets on Land */}
            <div className="pt-2 border-t space-y-2">
              <p className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                Section 23 Asset Enumeration (Trees & Structures)
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500">Fruit/Timber Trees</label>
                  <Input
                    type="number"
                    value={treesCount}
                    onChange={(e) => setTreesCount(e.target.value)}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500">Active Borewells</label>
                  <Input
                    type="number"
                    value={borewellsCount}
                    onChange={(e) => setBorewellsCount(e.target.value)}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500">Farm Sheds / Buildings</label>
                  <Input
                    type="number"
                    value={structuresCount}
                    onChange={(e) => setStructuresCount(e.target.value)}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Geo-Tagged Camera Attachment */}
            <div className="pt-2 border-t space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                  Geo-Tagged Field Photo Evidence
                </p>
                {attachedPhotoUrl && (
                  <Badge variant="success" className="text-[10px]">
                    Photo Attached
                  </Badge>
                )}
              </div>

              {attachedPhotoUrl ? (
                <div className="relative aspect-video max-w-xs rounded-xl overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={attachedPhotoUrl} alt="Attached" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={onOpenCamera}
                    className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-md text-[10px]"
                  >
                    Retake
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onOpenCamera}
                  className="w-full h-16 border-dashed border-2 flex items-center justify-center gap-2 text-slate-600 hover:border-blue-500 hover:bg-blue-50/50 text-xs"
                >
                  <Camera className="h-5 w-5 text-blue-600" />
                  <span>Launch Camera & Burn Telemetry Watermark</span>
                </Button>
              )}
            </div>

            {/* Witness & Remarks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Local Panchayat Witness
                </label>
                <Input
                  value={witnessName}
                  onChange={(e) => setWitnessName(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Surveyor Field Remarks
                </label>
                <Input
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold text-xs h-10 flex items-center justify-center gap-2 rounded-full shadow-sm"
            >
              <Save className="h-4 w-4 text-[#ef5b2a]" />
              <span>{isOnline ? "Save & Upload Survey Record" : "Save to Offline Queue (No Internet)"}</span>
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
