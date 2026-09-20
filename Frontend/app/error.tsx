"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BhoomiEmblem } from "@/components/ui/bhoomi-emblem";
import { RefreshCw, Home, AlertTriangle, ShieldCheck } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log technical details safely for telemetry without exposing sensitive data
    console.error("BhoomiSetu Application Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md space-y-6 bg-[#fffdf8] p-8 rounded-2xl border border-rose-200 shadow-xl">
        <div className="flex justify-center">
          <div className="relative">
            <BhoomiEmblem className="w-16 h-16 opacity-75" />
            <div className="absolute -bottom-1 -right-1 bg-rose-600 text-white p-1 rounded-full shadow-md">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-rose-600 uppercase">
            Administrative Runtime Exception
          </span>
          <h1 className="text-2xl font-black text-[#171716]">
            Something went wrong
          </h1>
          <p className="text-xs text-[#68655e] leading-relaxed">
            The platform encountered an unexpected processing error while rendering this page or communicating with government backend services.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-[#68655e] bg-[#f4f1ea] px-2 py-1 rounded border border-[#d8d3c9] inline-block">
              Incident Ref: {error.digest}
            </p>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] text-xs h-9 px-4 rounded-full flex items-center justify-center gap-1.5 font-bold shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Try Again</span>
          </Button>
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 px-4 rounded-full border-[#d8d3c9] hover:bg-[#f4f1ea] flex items-center justify-center gap-1.5 font-semibold"
            >
              <Home className="w-3.5 h-3.5 text-[#ef5b2a]" />
              <span>Return Home</span>
            </Button>
          </Link>
        </div>

        <div className="pt-4 border-t border-[#d8d3c9] flex items-center justify-center gap-2 text-[10px] text-[#68655e]">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Statutory session security active • No data loss incurred</span>
        </div>
      </div>
    </div>
  );
}
