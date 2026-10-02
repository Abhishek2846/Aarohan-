"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BhoomiEmblem } from "@/components/ui/bhoomi-emblem";
import { Home, ArrowLeft, KeyRound, ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md space-y-6 bg-[#fffdf8] p-8 rounded-2xl border border-[#d8d3c9] shadow-lg">
        <div className="flex justify-center">
          <div className="relative">
            <BhoomiEmblem className="w-16 h-16 opacity-80" />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black p-1 rounded-full shadow-md">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-[#ef5b2a] uppercase">
            Error 404 • Resource Not Found
          </span>
          <h1 className="text-2xl font-black text-[#171716]">
            Page Not Found
          </h1>
          <p className="text-xs text-[#68655e] leading-relaxed">
            The requested statutory page, case docket, or land parcel record does not exist or has been moved to a different administrative section.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button
              variant="default"
              size="sm"
              className="w-full sm:w-auto bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] text-xs h-9 px-4 rounded-full flex items-center justify-center gap-1.5 font-bold shadow-sm"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return Home</span>
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto text-xs h-9 px-4 rounded-full border-[#d8d3c9] hover:bg-[#f4f1ea] flex items-center justify-center gap-1.5 font-semibold"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#ef5b2a]" />
              <span>Officer Login</span>
            </Button>
          </Link>
        </div>

        <div className="pt-4 border-t border-[#d8d3c9] text-[10px] text-[#68655e] font-mono">
          Aarohan National Land Acquisition Management System • SIH26016
        </div>
      </div>
    </div>
  );
}
