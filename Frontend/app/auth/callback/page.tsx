"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getRoleLandingRoute } from "@/lib/auth";
import { UserRole } from "@/types/user";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Verifying Jan Parichay Cryptographic Token...");
  const [officerName, setOfficerName] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refresh_token");
    const role = (searchParams.get("role") || "CENTRAL_MINISTRY") as UserRole;
    const name = searchParams.get("name") || "Government Officer";
    const redirectParam = searchParams.get("redirect") || "";

    setOfficerName(name);

    if (token) {
      // Save tokens and session cookies
      localStorage.setItem("bhoomi_token", token);
      localStorage.setItem("bhoomi_active_role", role);
      if (refreshToken) {
        localStorage.setItem("bhoomi_refresh_token", refreshToken);
      }
      document.cookie = `bhoomi_token=${token}; path=/; max-age=86400`;
      document.cookie = `bhoomi_role=${role}; path=/; max-age=86400`;

      setStatus("Jan Parichay Credentials Verified! Launching Authorized Workspace...");

      setTimeout(() => {
        const targetRoute =
          redirectParam && redirectParam !== "/" && redirectParam !== "/login" && !redirectParam.startsWith("/auth/")
            ? redirectParam
            : getRoleLandingRoute(role);
        
        window.location.href = targetRoute;
      }, 1000);
    } else {
      setStatus("Error: No authentication token received from identity gateway.");
      setTimeout(() => {
        router.push("/login?error=sso_failed");
      }, 2500);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#f7f6f2] flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md border border-[#d8d3c9] bg-[#fffdf8] shadow-xl rounded-2xl overflow-hidden text-center">
        <div className="h-1.5 bg-gradient-to-r from-[#ef5b2a] via-white to-[#059669]" />
        <CardContent className="p-8 space-y-4">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
              <CheckCircle2 className="h-7 w-7" />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#171716]">
              Jan Parichay Government SSO Verified
            </h2>
            {officerName && (
              <p className="text-xs font-semibold text-[#ef5b2a]">
                Welcome, {officerName}
              </p>
            )}
            <p className="text-xs text-[#68655e]">
              National Informatics Centre (NIC) • MeitY
            </p>
          </div>

          <div className="p-3 bg-[#f5efe6] rounded-xl border border-[#d8d3c9] flex items-center justify-center gap-2 text-xs text-[#171716] font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-[#ef5b2a]" />
            <span>{status}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ParichayCallbackPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#68655e]">Processing SSO callback...</div>}>
      <CallbackHandler />
    </Suspense>
  );
}
