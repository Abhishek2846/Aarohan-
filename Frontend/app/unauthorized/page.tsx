"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getRoleLandingRoute } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { BhoomiEmblem } from "@/components/ui/bhoomi-emblem";
import { ShieldX, ArrowLeft, LayoutDashboard, KeyRound } from "lucide-react";

export default function UnauthorizedPage() {
  const { user, activeRole, isAuthenticated } = useAuth();
  const designatedDashboard = getRoleLandingRoute(activeRole);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md space-y-6 bg-[#fffdf8] p-8 rounded-2xl border border-amber-300 shadow-xl">
        <div className="flex justify-center">
          <div className="relative">
            <BhoomiEmblem className="w-16 h-16 opacity-75" />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black p-1.5 rounded-full shadow-md">
              <ShieldX className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-amber-700 dark:text-[#ef5b2a] uppercase">
            Access Restricted • 403 Forbidden
          </span>
          <h1 className="text-2xl font-black text-[#171716]">
            Unauthorized Jurisdiction Access
          </h1>
          <p className="text-xs text-[#68655e] leading-relaxed">
            Your current statutory role{" "}
            <strong className="text-[#171716] font-mono bg-[#f4f1ea] px-2 py-0.5 rounded border border-[#d8d3c9]">
              {activeRole}
            </strong>{" "}
            is not authorized to access this executive command workspace or perform this statutory action.
          </p>
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left text-xs space-y-1">
          <p className="font-bold text-[#171716]">Official Security Protocol:</p>
          <p className="text-[11px] text-[#68655e]">
            Official records and approval actions are partitioned strictly by constitutional mandate under the RFCTLARR Act 2013.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          {isAuthenticated ? (
            <Link href={designatedDashboard}>
              <Button className="w-full sm:w-auto bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] text-xs h-9 px-4 rounded-full flex items-center justify-center gap-1.5 font-bold shadow-sm">
                <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
                <span>Go to My Dedicated Dashboard</span>
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button className="w-full sm:w-auto bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] text-xs h-9 px-4 rounded-full flex items-center justify-center gap-1.5 font-bold shadow-sm">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Officer Sign In</span>
              </Button>
            </Link>
          )}

          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto text-xs h-9 px-4 rounded-full border-[#d8d3c9] hover:bg-[#f4f1ea] flex items-center justify-center gap-1.5 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Portal Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
