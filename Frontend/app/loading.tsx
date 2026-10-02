import React from "react";
import { BhoomiEmblem } from "@/components/ui/bhoomi-emblem";

export default function Loading() {
  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center p-6 space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-[#d8d3c9] border-t-[#ef5b2a] animate-spin" />
        <BhoomiEmblem className="w-8 h-8 absolute opacity-90" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs font-bold text-[#171716] uppercase tracking-wider">
          Loading Statutory Workspace...
        </p>
        <p className="text-[11px] text-[#68655e]">
          Connecting to Aarohan Cadastral Records & GIS Engine
        </p>
      </div>
    </div>
  );
}
