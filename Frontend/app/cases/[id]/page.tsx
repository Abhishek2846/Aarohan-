"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AcquisitionCase } from "@/types/case";
import { WORKFLOW_STAGES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataQualityWidget } from "@/components/common/data-quality-widget";
import { RiskIndicator } from "@/components/common/risk-indicator";
import { ParcelDigitalTwinViewer } from "@/components/advanced/parcel-digital-twin-viewer";
import { useCaseDetailQuery, useAdvanceStageMutation } from "@/hooks/queries/use-bhoomi-queries";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatINR, formatAreaHectares } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  MapPin,
  ShieldCheck,
  Building,
  Coins,
  Scale,
  Sparkles,
  ArrowRight,
  Send,
  Eye,
  Gavel,
  Lock,
} from "lucide-react";
import { Breadcrumbs } from "@/components/common/breadcrumbs";

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = params?.id as string;
  const { user, activeRole } = useAuth();
  const [digitalTwinParcel, setDigitalTwinParcel] = useState<any | null>(null);
  const [advanceStageModalOpen, setAdvanceStageModalOpen] = useState(false);

  const { data: caseData, isLoading, isError, error, refetch } = useCaseDetailQuery(caseId);
  const advanceStageMutation = useAdvanceStageMutation();

  // District Jurisdiction ABAC Verification
  const isDistrictOfficer = activeRole === "DISTRICT_OFFICER" || activeRole === "FIELD_OFFICER";
  const officerDistrict = user?.jurisdiction?.districtName;
  const isWithinJurisdiction =
    !isDistrictOfficer ||
    !officerDistrict ||
    !caseData?.district ||
    officerDistrict.toLowerCase().includes(caseData.district.toLowerCase()) ||
    caseData.district.toLowerCase().includes(officerDistrict.toLowerCase());

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-9 w-44 rounded-full" />
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !caseData) {
    const errorMsg = error ? (error as any).message || String(error) : "";
    const isJurisdictionError =
      errorMsg.toLowerCase().includes("jurisdiction") || (error as any)?.status === 403;

    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="bg-[#fffdf8] p-8 rounded-2xl border border-amber-300 shadow-xl space-y-5">
          <div className="h-14 w-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
            <Gavel className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold tracking-widest text-amber-700 uppercase">
              {isJurisdictionError ? "Statutory Jurisdiction Scoping • 403 Forbidden" : "Case File Unavailable"}
            </span>
            <h2 className="text-xl font-black text-[#171716]">
              {isJurisdictionError
                ? "Restricted Revenue District File"
                : "Unable to Retrieve Acquisition Docket"}
            </h2>
            <p className="text-xs text-[#68655e] max-w-md mx-auto leading-relaxed">
              {isJurisdictionError
                ? `This case file belongs to a revenue district outside your assigned administrative jurisdiction. Under Section 3(g) of the RFCTLARR Act 2013, case files are strictly demarcated. Your statutory scope is limited to: ${officerDistrict || activeRole}.`
                : (errorMsg || "The requested acquisition case could not be located in authoritative records.")}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap gap-3 justify-center">
            <Link href="/cases">
              <Button size="sm" className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] text-xs h-9 px-4 rounded-full font-bold">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Return to Case Registry
              </Button>
            </Link>
            <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs h-9 px-4 rounded-full border-[#d8d3c9]">
              Retry Query
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentStageIndex = WORKFLOW_STAGES.findIndex(
    (s) => s.id === caseData.currentStageId
  );
  const nextStage =
    currentStageIndex >= 0 && currentStageIndex < WORKFLOW_STAGES.length - 1
      ? WORKFLOW_STAGES[currentStageIndex + 1]
      : null;

  const handleAdvanceStage = async () => {
    if (!nextStage) return;

    if (!isWithinJurisdiction) {
      toast.jurisdiction(
        "Out of Statutory District Jurisdiction",
        `Officers assigned to ${officerDistrict || "other districts"} cannot advance stage for cases in ${caseData.district}. Please log in as the appointed District Magistrate or Central Ministry.`
      );
      return;
    }

    setAdvanceStageModalOpen(false);
    try {
      await advanceStageMutation.mutateAsync({
        caseId: caseData.id,
        nextStageId: nextStage.id,
        nextStageName: nextStage.label,
        officerSignature: "CCA-CLASS3-DSC-SIGNED-SHA256",
      });
      toast.success(
        "Workflow Stage Advanced",
        `Case docket ${caseData.caseNumber} advanced to Stage ${nextStage.order}: ${nextStage.label}`
      );
    } catch (err: any) {
      toast.error(
        "Failed to Advance Stage",
        err?.message || "Statutory workflow progression error"
      );
    }
  };

  const sampleParcels = [
    {
      ulpin: "GJ-VAD-2026-0811",
      khasra: "214/1",
      village: "Channapatna",
      areaHa: 0.85,
      ownerRef: "OWN-VAD-4412",
      maskedOwner: "K**** P****",
      awardINR: 17000000,
      status: "Award Enacted",
      dispute: false,
    },
    {
      ulpin: "GJ-VAD-2026-0812",
      khasra: "214/2",
      village: "Channapatna",
      areaHa: 1.2,
      ownerRef: "OWN-VAD-4413",
      maskedOwner: "S**** M****",
      awardINR: 24000000,
      status: "Compensation Credited",
      dispute: false,
    },
    {
      ulpin: "GJ-VAD-2026-0813",
      khasra: "215",
      village: "Channapatna",
      areaHa: 0.45,
      ownerRef: "OWN-VAD-4414",
      maskedOwner: "A**** B****",
      awardINR: 13500000,
      status: "Litigation Disputed",
      dispute: true,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Breadcrumbs
        items={[
          { label: "Acquisition Cases", href: "/cases" },
          { label: caseData.caseNumber, isCurrent: true },
        ]}
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/cases" aria-label="Back to acquisition cases">
            <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Back to acquisition cases">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-[#171716] font-mono">
                {caseData.caseNumber}
              </h1>
              <Badge variant="civic">{caseData.currentStageName}</Badge>
              {isWithinJurisdiction ? (
                <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 text-[11px] gap-1 font-medium">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  In-Jurisdiction ({caseData.district})
                </Badge>
              ) : (
                <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 text-[11px] gap-1 font-medium">
                  <Gavel className="h-3 w-3 text-amber-600" />
                  Read-Only (Out-of-District: {caseData.district})
                </Badge>
              )}
            </div>
            <p className="text-xs text-[#68655e]">
              Project: {caseData.projectName} • District: {caseData.district}, {caseData.state}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {nextStage && (
            <Button
              onClick={() => {
                if (!isWithinJurisdiction) {
                  toast.jurisdiction(
                    "Out of Statutory District Jurisdiction",
                    `Officers assigned to ${officerDistrict || "other districts"} cannot advance stage for cases in ${caseData.district}. Under RFCTLARR § 3(g), docket mutation is restricted to the appointed district magistrate.`
                  );
                  return;
                }
                setAdvanceStageModalOpen(true);
              }}
              className={
                isWithinJurisdiction
                  ? "bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm text-xs h-9 px-4 rounded-full flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                  : "bg-[#eae6dc] text-[#68655e] hover:bg-[#ded9cd] font-semibold text-xs h-9 px-4 rounded-full flex items-center gap-1.5 border border-[#d8d3c9]"
              }
            >
              {!isWithinJurisdiction ? (
                <>
                  <Lock className="h-3.5 w-3.5 text-amber-600" />
                  <span>Restricted Jurisdiction</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 text-amber-400" />
                  <span>Advance to: {nextStage.label}</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* SLA & Progression Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#ef5b2a]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#68655e]">
                Statutory Timeline Progress
              </span>
            </div>
            <span className="text-xs font-bold text-[#171716]">
              {caseData.daysRemainingInSla} days remaining (Statutory SLA Deadline: {caseData.slaDeadline})
            </span>
          </div>

          {/* Stepper bar across all workflow stages */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {WORKFLOW_STAGES.map((stg, i) => {
              const isPast = i < currentStageIndex;
              const isCurrent = i === currentStageIndex;
              return (
                <div
                  key={stg.id}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? "bg-[#ef5b2a]/10 border-amber-500 text-[#ef5b2a] font-bold shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                      : isPast
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-[#f4f1ea] border-[#d8d3c9] text-[#68655e]"
                  }`}
                >
                  <div className="text-[10px] font-mono mb-1">
                    {isPast ? "✓ DONE" : isCurrent ? "● ACTIVE" : `STAGE ${i + 1}`}
                  </div>
                  <div className="text-xs truncate font-medium">{stg.label}</div>
                  <div className="text-[10px] text-[#68655e] mt-1">Stage {stg.order} of 12</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Analytics & Decision Support Cards: Explainable Risk + Data Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskIndicator
          delayRisk={caseData.delayRisk}
          onActionClick={(act) => toast.info("Decision Support Action", `Executing statutory action: ${act}`)}
        />
        <DataQualityWidget score={caseData.dataQuality} />
      </div>

      {/* Linked Land Parcels Table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">
              Land Parcels Linked to Case ({caseData.parcelsCount})
            </CardTitle>
            <CardDescription className="text-xs">
              Click any parcel to view its complete land and owner profile.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Total Extent: {formatAreaHectares(caseData.totalAcquisitionAreaHa)}
          </Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Land ID (ULPIN)</TableHead>
                <TableHead>Survey / Khasra</TableHead>
                <TableHead>Village</TableHead>
                <TableHead>Area (Ha)</TableHead>
                <TableHead>Owner Reference</TableHead>
                <TableHead>Compensation Award</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Land Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleParcels.map((p) => (
                <TableRow key={p.ulpin} className="hover:bg-[#f4f1ea] dark:hover:bg-[#fffdf8]/50">
                  <TableCell className="font-mono text-xs font-bold text-[#ef5b2a]">
                    {p.ulpin}
                  </TableCell>
                  <TableCell className="font-semibold text-xs">{p.khasra}</TableCell>
                  <TableCell className="text-xs">{p.village}</TableCell>
                  <TableCell className="text-xs font-medium">{p.areaHa} Ha</TableCell>
                  <TableCell className="font-mono text-xs text-[#68655e]">
                    {p.ownerRef} ({p.maskedOwner})
                  </TableCell>
                  <TableCell className="text-xs font-mono font-semibold">
                    {formatINR(p.awardINR)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.dispute ? "danger" : "civic"} className="text-[10px]">
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDigitalTwinParcel(p)}
                      className="h-7 px-2 text-xs flex items-center gap-1 border-[#d8d3c9] text-blue-900 hover:bg-[#ef5b2a]/10"
                    >
                      <Eye className="h-3.5 w-3.5 text-blue-600" />
                      <span>View Details</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Parcel-Level 360° Digital Twin Viewer Modal */}
      {digitalTwinParcel && (
        <ParcelDigitalTwinViewer
          parcel={{
            ulpin: digitalTwinParcel.ulpin,
            surveyNo: digitalTwinParcel.khasra,
            village: digitalTwinParcel.village,
            areaHa: digitalTwinParcel.areaHa,
            maskedOwner: digitalTwinParcel.maskedOwner,
            awardINR: digitalTwinParcel.awardINR,
            dispute: digitalTwinParcel.dispute,
          }}
          isOpen={!!digitalTwinParcel}
          onClose={() => setDigitalTwinParcel(null)}
        />
      )}

      {/* Stage Advance Confirmation Modal */}
      {advanceStageModalOpen && nextStage && (
        <Dialog open={advanceStageModalOpen} onOpenChange={setAdvanceStageModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Authorize Stage Transition
              </DialogTitle>
              <DialogDescription className="text-xs">
                Advance this case from <strong>{caseData.currentStageName}</strong> to{" "}
                <strong className="text-blue-600">{nextStage.label}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs pt-2">
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-bold">Statutory Signoff Declaration</p>
                <p className="text-[11px]">
                  By confirming, you certify that all required gazette filings, hearing transcripts, and survey demarcations for Stage {currentStageIndex + 1} have been scrutinized.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdvanceStageModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={advanceStageMutation.isPending}
                  onClick={handleAdvanceStage}
                  className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm font-bold text-xs"
                >
                  {advanceStageMutation.isPending ? "Authorizing with DSC..." : "Sign with DSC & Advance"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
