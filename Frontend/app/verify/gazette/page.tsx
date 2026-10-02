"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building,
  Calendar,
  Layers,
  Scale,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGazetteVerificationQuery } from "@/hooks/queries/use-bhoomi-queries";

function GazetteVerifyContent() {
  const searchParams = useSearchParams();
  const ref = searchParams?.get("ref") || searchParams?.get("hash") || "DL-ND-01-2026-48921";
  const { data: result, isLoading } = useGazetteVerificationQuery(ref);

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      {/* Top Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mb-2">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold font-serif tracking-tight text-slate-900 dark:text-white">
          Official e-Gazette Cryptographic Verification
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Public verification portal for statutory land acquisition notifications published under the RFCTLARR Act 2013.
        </p>
      </div>

      {isLoading ? (
        <Card className="p-12 text-center text-slate-500">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Querying Aarohan Blockchain / eGazette Ledger...</p>
        </Card>
      ) : result ? (
        <Card className={`border-2 shadow-lg ${
          result.verified
            ? "border-emerald-500/80 bg-white dark:bg-slate-900"
            : "border-rose-500/80 bg-white dark:bg-slate-900"
        }`}>
          <CardHeader className={`p-6 pb-4 border-b ${
            result.verified ? "bg-emerald-50/50 dark:bg-emerald-950/20" : "bg-rose-50/50 dark:bg-rose-950/20"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {result.verified ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-rose-600" />
                )}
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    {result.status}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                    Queried Reference: <span className="font-mono font-medium">{ref}</span>
                  </CardDescription>
                </div>
              </div>
              <Badge className={result.verified ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}>
                {result.verified ? "OFFICIAL AUTHENTIC" : "UNVERIFIED"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5 text-xs">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {result.message}
            </p>

            {result.verified && (
              <div className="space-y-4">
                {/* Notice Core Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[11px]">e-Gazette Registration No</span>
                    <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                      {result.gazetteReference}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Notice Identifier</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {result.noticeNumber}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Statutory Milestone</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {result.sectionReference} (RFCTLARR Act 2013)
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Publication Volume / Issue</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {result.gazetteVolumeIssue}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Project Title</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {result.projectTitle}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Issuing Authority</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {result.issuingAuthority}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Parcels Schedule Extent</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {result.parcelCount} Cadastral Plots ({Number(result.totalAreaHa || 0).toFixed(2)} Ha)
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Publication Date</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {result.publishedOn || "Recorded"}
                    </span>
                  </div>
                </div>

                {/* Statutory Shield Clause */}
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded text-emerald-900 dark:text-emerald-300">
                  <div className="font-semibold flex items-center gap-1.5 mb-1">
                    <Scale className="h-4 w-4 text-emerald-600" />
                    Statutory Conclusive Proof Certificate
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-400">
                    This statutory notification is deemed conclusive evidence of land acquisition under Section 19(3)
                    of the RFCTLARR Act 2013. The digital cryptographic SHA-256 seal is legally admissible in Revenue Courts
                    under Section 4 of the Information Technology Act, 2000.
                  </p>
                </div>

                {/* Cryptographic SHA-256 Hash Digest */}
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px] space-y-1 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-sans text-[10px] font-semibold">
                    TAMPER-EVIDENT SHA-256 LEDGER HASH
                  </span>
                  <div className="text-slate-700 dark:text-slate-300 break-all">
                    {result.sha256Hash}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
              <Link href="/gazette">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Official Gazette Publisher
                </Button>
              </Link>
              <span className="text-[10px] text-slate-400">
                Verified at: {result.verifiedAt ? new Date(result.verifiedAt).toLocaleString() : ""}
              </span>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export default function GazetteVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-xs text-slate-500">
          Loading verification audit proof...
        </div>
      }
    >
      <GazetteVerifyContent />
    </Suspense>
  );
}
