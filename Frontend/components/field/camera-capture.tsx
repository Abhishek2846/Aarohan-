"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GpsLocation } from "@/hooks/use-gps";
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  X,
  UploadCloud,
  ShieldCheck,
  Compass,
} from "lucide-react";

interface CameraCaptureProps {
  ulpin: string;
  surveyNo: string;
  gpsLocation: GpsLocation;
  surveyorName: string;
  onPhotoCaptured: (photoDataUrl: string) => void;
  onClose: () => void;
}

export function CameraCapture({
  ulpin,
  surveyNo,
  gpsLocation,
  surveyorName,
  onPhotoCaptured,
  onClose,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setStreamActive(true);
        }
      } catch (err) {
        console.warn("Camera access denied or unavailable, using canvas simulation", err);
        setCameraError("Camera unavailable or permission denied. Use sample evidence capture.");
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const captureWithTelemetry = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1280;
    const height = 720;
    canvas.width = width;
    canvas.height = height;

    if (streamActive && videoRef.current) {
      // Draw actual camera video frame
      ctx.drawImage(videoRef.current, 0, 0, width, height);
    } else {
      // Draw realistic field landscape simulation
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, "#38bdf8");
      grad.addColorStop(0.5, "#bae6fd");
      grad.addColorStop(0.51, "#15803d");
      grad.addColorStop(1, "#14532d");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw boundary stone marker
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(width / 2 - 40, height / 2 - 20, 80, 160);
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("AAROHAN", width / 2 - 32, height / 2 + 40);
      ctx.fillText(surveyNo, width / 2 - 20, height / 2 + 70);
    }

    // Burn Civic Telemetry Watermark directly onto the photo
    const bannerHeight = 110;
    ctx.fillStyle = "rgba(10, 37, 64, 0.88)";
    ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

    // Gold civic stripe
    ctx.fillStyle = "#ea580c";
    ctx.fillRect(0, height - bannerHeight, width, 4);

    // Text Overlay
    ctx.fillStyle = "#facc15";
    ctx.font = "bold 18px monospace";
    ctx.fillText("AAROHAN STATUTORY FIELD EVIDENCE • GOVT OF INDIA", 24, height - 75);

    ctx.fillStyle = "#ffffff";
    ctx.font = "14px monospace";
    ctx.fillText(
      `ULPIN: ${ulpin} | SURVEY/KHASRA: #${surveyNo} | ACCURACY: ±${gpsLocation.accuracyMeters}M`,
      24,
      height - 50
    );

    ctx.fillStyle = "#93c5fd";
    ctx.font = "13px monospace";
    ctx.fillText(
      `GPS: ${gpsLocation.latitude.toFixed(5)}° N, ${gpsLocation.longitude.toFixed(5)}° E | AZIMUTH: ${gpsLocation.headingDeg || 42}° | ${new Date().toLocaleString()}`,
      24,
      height - 25
    );

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedPreview(dataUrl);
  };

  const handleConfirmPhoto = () => {
    if (capturedPreview) {
      onPhotoCaptured(capturedPreview);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-4 text-white space-y-3 relative shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-amber-400" />
            <span className="font-bold text-sm">Geo-Tagged Field Camera</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-800 text-slate-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Viewfinder / Preview */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
          {capturedPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={capturedPreview} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${streamActive ? "block" : "hidden"}`}
              />
              {!streamActive && (
                <div className="p-6 text-center space-y-2 text-slate-400">
                  <Camera className="h-10 w-10 mx-auto text-slate-600 animate-pulse" />
                  <p className="text-xs font-semibold">Simulated High-Precision Viewfinder</p>
                  <p className="text-[10px] text-slate-500">
                    GPS Coordinates will be burned into the evidence banner upon capture.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Crosshair Overlay */}
          {!capturedPreview && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-16 h-16 border-2 border-white/40 rounded-full border-dashed" />
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Telemetry Preview Pills */}
        <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-300">
          <span>
            GPS: <strong className="text-white">{gpsLocation.latitude.toFixed(4)}° N, {gpsLocation.longitude.toFixed(4)}° E</strong>
          </span>
          <span className="text-emerald-400 font-bold">±{gpsLocation.accuracyMeters}m lock</span>
          <span>ULPIN: <strong className="text-amber-300">{ulpin}</strong></span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-2 pt-1">
          {capturedPreview ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCapturedPreview(null)}
                className="text-xs text-slate-300 border-slate-700 hover:bg-slate-800"
              >
                Retake
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmPhoto}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Attach Geo-Tagged Evidence</span>
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={captureWithTelemetry}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-10 px-5 flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              <span>Capture with Civic Telemetry</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
