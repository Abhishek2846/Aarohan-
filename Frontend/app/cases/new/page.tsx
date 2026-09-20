"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateCaseMutation, useProjectsQuery } from "@/hooks/queries/use-bhoomi-queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR, formatAreaHectares } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building,
  MapPin,
  Save,
  Layers,
  Sparkles,
} from "lucide-react";
import { Breadcrumbs } from "@/components/common/breadcrumbs";

interface CandidateParcel {
  id: string;
  ulpin: string;
  surveyNo: string;
  village: string;
  areaHa: number;
  estCostINR: number;
  selected: boolean;
}

export default function CreateCaseFromParcelsPage() {
  const router = useRouter();
  const { data: projects = [], isLoading: projectsLoading } = useProjectsQuery();
  const createCaseMutation = useCreateCaseMutation();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [district, setDistrict] = useState("Vadodara");
  const [state, setState] = useState("Gujarat");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [parcels, setParcels] = useState<CandidateParcel[]>([
    {
      id: "pcl_01",
      ulpin: "GJ-VAD-2026-0811",
      surveyNo: "214/1",
      village: "Channapatna",
      areaHa: 0.85,
      estCostINR: 17000000,
      selected: true,
    },
    {
      id: "pcl_02",
      ulpin: "GJ-VAD-2026-0812",
      surveyNo: "214/2",
      village: "Channapatna",
      areaHa: 1.2,
      estCostINR: 24000000,
      selected: true,
    },
    {
      id: "pcl_03",
      ulpin: "GJ-VAD-2026-0813",
      surveyNo: "215",
      village: "Channapatna",
      areaHa: 0.45,
      estCostINR: 13500000,
      selected: false,
    },
    {
      id: "pcl_04",
      ulpin: "GJ-VAD-2026-0814",
      surveyNo: "216/A",
      village: "Channapatna",
      areaHa: 1.8,
      estCostINR: 36000000,
      selected: false,
    },
    {
      id: "pcl_05",
      ulpin: "GJ-VAD-2026-0815",
      surveyNo: "217",
      village: "Channapatna",
      areaHa: 0.95,
      estCostINR: 19000000,
      selected: false,
    },
  ]);

  useEffect(() => {
    if (!selectedProjectId && projects[0]?.id) setSelectedProjectId(projects[0].id);
  }, [projects, selectedProjectId]);

  const toggleParcel = (id: string) => {
    setParcels((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const selectedParcels = parcels.filter((p) => p.selected);
  const totalSelectedArea = selectedParcels.reduce((acc, p) => acc + p.areaHa, 0);
  const totalEstimatedCost = selectedParcels.reduce((acc, p) => acc + p.estCostINR, 0);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedParcels.length === 0) {
      setErrorMsg("Please select at least one parcel to form an acquisition case.");
      return;
    }
    if (!selectedProjectId) {
      setErrorMsg("Select a PostgreSQL-backed master project before creating the case.");
      return;
    }
    setErrorMsg(null);

    setSubmitting(true);
    try {
      const created = await createCaseMutation.mutateAsync({
        projectId: selectedProjectId,
        state,
        district,
        parcelsCount: selectedParcels.length,
        totalAcquisitionAreaHa: Number(totalSelectedArea.toFixed(2)),
        totalBeneficiariesCount: selectedParcels.length * 2,
        estimatedCompensationINR: totalEstimatedCost,
      } as any);
      setSubmitting(false);
      router.push(`/cases/${created.id}`);
    } catch (error: any) {
      setSubmitting(false);
      setErrorMsg(error?.message || "Unable to create the acquisition case in PostgreSQL.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl p-3.5 flex items-center justify-between text-xs text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      <Breadcrumbs
        items={[
          { label: "Acquisition Cases", href: "/cases" },
          { label: "New Acquisition Case", isCurrent: true },
        ]}
      />
      <div className="flex items-center gap-3">
        <Link href="/cases" aria-label="Back to acquisition cases">
          <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Back to acquisition cases">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#171716]">
            Create Acquisition Case from Surveyed Parcels
          </h1>
          <p className="text-xs text-[#68655e]">
            Bundle surveyed land parcels into an official District Land Acquisition Case file.
          </p>
        </div>
      </div>

      <form onSubmit={handleCreateCase} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-600" />
              <span>Acquisition Case Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-[#171716]">
                  Master Project Link
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectCode} - {p.title.slice(0, 30)}...
                    </option>
                  ))}
                </select>
                {projectsLoading && <p className="text-[10px] text-[#68655e] mt-1">Loading projects from backend...</p>}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#171716]">
                  District Jurisdiction
                </label>
                <Input
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#171716]">
                  State Territory
                </label>
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parcel Selection Table */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Select Available Cadastral Parcels</CardTitle>
              <CardDescription className="text-xs">
                Check the parcels to include in this acquisition docket.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs bg-[#ef5b2a]/10 dark:bg-blue-950/40 px-3 py-1.5 rounded-lg border border-[#d8d3c9]">
              <span>
                Selected: <strong className="text-blue-900 dark:text-blue-200">{selectedParcels.length}</strong> Parcels
              </span>
              <span>•</span>
              <span>
                Total Area: <strong className="text-blue-900 dark:text-blue-200">{formatAreaHectares(totalSelectedArea)}</strong>
              </span>
              <span>•</span>
              <span>
                Est. Cost: <strong className="text-blue-900 dark:text-blue-200">{formatINR(totalEstimatedCost)}</strong>
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">Include</TableHead>
                  <TableHead>ULPIN (Bhu-Aadhaar)</TableHead>
                  <TableHead>Survey / Khasra</TableHead>
                  <TableHead>Village</TableHead>
                  <TableHead>Land Extent</TableHead>
                  <TableHead>Estimated Base Outlay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parcels.map((p) => (
                  <TableRow
                    key={p.id}
                    onClick={() => toggleParcel(p.id)}
                    className="cursor-pointer hover:bg-[#f4f1ea] dark:hover:bg-[#fffdf8]/50"
                  >
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={p.selected}
                        onChange={() => toggleParcel(p.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-[#ef5b2a]">
                      {p.ulpin}
                    </TableCell>
                    <TableCell className="font-semibold text-xs">{p.surveyNo}</TableCell>
                    <TableCell className="text-xs">{p.village}</TableCell>
                    <TableCell className="text-xs font-medium">{formatAreaHectares(p.areaHa)}</TableCell>
                    <TableCell className="text-xs font-mono">{formatINR(p.estCostINR)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/cases">
            <Button variant="outline" type="button" size="sm" className="text-xs">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting || selectedParcels.length === 0}
            className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm font-bold text-xs h-9 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            <span>{submitting ? "Creating Docket..." : "Generate Official Acquisition Case"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
