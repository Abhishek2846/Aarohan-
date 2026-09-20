"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PenTool,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Layers,
  Map,
  Sparkles,
} from "lucide-react";

interface AlignmentDrawerProps {
  isDrawing: boolean;
  onToggleDrawing: () => void;
  onUndo: () => void;
  onClear: () => void;
  waypointsCount: number;
  totalLengthKm: number;
  onSelectPreset: (presetId: "STRR" | "DEL_MUM") => void;
}

export function AlignmentDrawer({
  isDrawing,
  onToggleDrawing,
  onUndo,
  onClear,
  waypointsCount,
  totalLengthKm,
  onSelectPreset,
}: AlignmentDrawerProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#fffdf8] border border-[#d8d3c9] shadow-sm text-xs text-[#171716]">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onToggleDrawing}
          className={`h-8 text-xs font-bold flex items-center gap-1.5 rounded-full ${
            isDrawing
              ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
              : "bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8]"
          }`}
        >
          <PenTool className="h-3.5 w-3.5" />
          <span>{isDrawing ? "Click Map to Add Points (Drawing Active)" : "Draw Alignment"}</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={waypointsCount === 0}
          onClick={onUndo}
          className="h-8 text-xs flex items-center gap-1 border-[#d8d3c9] bg-[#fffdf8] text-[#171716] hover:bg-[#f4f1ea] rounded-full"
        >
          <RotateCcw className="h-3.5 w-3.5 text-[#68655e]" />
          <span>Undo Point</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={waypointsCount === 0}
          onClick={onClear}
          className="h-8 text-xs flex items-center gap-1 text-rose-600 border-[#d8d3c9] hover:bg-rose-50 rounded-full"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear</span>
        </Button>
      </div>

      {/* Alignment Distance & Preset Switchers */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[#68655e] text-[11px]">Length:</span>
          <span className="font-mono font-bold text-[#171716]">
            {totalLengthKm.toFixed(2)} Km ({waypointsCount} Vertices)
          </span>
        </div>

        <div className="flex items-center gap-1 border-l border-[#d8d3c9] pl-3">
          <span className="text-[#68655e] text-[10px] uppercase font-bold mr-1">Corridors:</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSelectPreset("STRR")}
            className="h-7 px-2 text-[11px] font-semibold hover:bg-[#f4f1ea] text-[#171716] rounded-full"
          >
            Bengaluru STRR
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSelectPreset("DEL_MUM")}
            className="h-7 px-2 text-[11px] font-semibold hover:bg-[#f4f1ea] text-[#171716] rounded-full"
          >
            Delhi-Vadodara Spur
          </Button>
        </div>
      </div>
    </div>
  );
}
