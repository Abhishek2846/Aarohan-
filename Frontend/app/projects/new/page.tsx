"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateProjectMutation } from "@/hooks/queries/use-bhoomi-queries";
import { SECTOR_TYPES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Building, MapPin, Calendar, IndianRupee } from "lucide-react";

export default function CreateProjectPage() {
  const router = useRouter();
  const [projectCode, setProjectCode] = useState("NHAI/EXP/BLR-CHN/PKG-01");
  const [title, setTitle] = useState("Bengaluru-Chennai Expressway (Hosakote-Malur Stretch)");
  const [sector, setSector] = useState(SECTOR_TYPES[0]);
  const [piaName, setPiaName] = useState("National Highways Authority of India (NHAI)");
  const [state, setState] = useState("Karnataka");
  const [districts, setDistricts] = useState("Bengaluru Rural, Kolar");
  const [estimatedBudgetCr, setEstimatedBudgetCr] = useState("3200");
  const [totalAreaHa, setTotalAreaHa] = useState("240.5");
  const [startDate, setStartDate] = useState("2026-10-01");
  const [targetDate, setTargetDate] = useState("2029-03-31");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const createProjectMutation = useCreateProjectMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    try {
      const newProject = await createProjectMutation.mutateAsync({
        projectCode,
        title,
        sector,
        piaName,
        state,
        districts: districts.split(",").map((d) => d.trim()).filter(Boolean),
        estimatedBudgetINR: parseFloat(estimatedBudgetCr) * 10000000,
        totalAcquisitionAreaHa: parseFloat(totalAreaHa),
        startDate,
        targetCompletionDate: targetDate,
        status: "PLANNING",
      } as any);
      setSubmitting(false);
      const targetId = newProject?.id || (newProject as any)?.project_id;
      if (targetId) {
        router.push(`/projects/${targetId}`);
      } else {
        router.push("/dashboard/pia");
      }
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err?.message || "Failed to create project. Please verify your permissions and details.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/projects">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#171716]">
            Register Infrastructure Project
          </h1>
          <p className="text-xs text-[#68655e]">
            Define project parameters, executing authority, and statutory spatial boundary.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-600" />
              <span>Project Identity & Sanction Details</span>
            </CardTitle>
            <CardDescription className="text-xs">
              All land acquisition cases and gazette notifications will be nested under this master project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#171716]">
                  Statutory Project Code
                </label>
                <Input
                  value={projectCode}
                  onChange={(e) => setProjectCode(e.target.value)}
                  required
                  placeholder="e.g. NHAI/EXP/2026/01"
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#171716]">
                  Infrastructure Sector
                </label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value as any)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
                >
                  {SECTOR_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-[#171716]">
                Official Project Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Full official designation of the project"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-[#171716]">
                Project Implementing Agency (PIA)
              </label>
              <Input
                value={piaName}
                onChange={(e) => setPiaName(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#171716]">
                  Primary State Territory
                </label>
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#171716]">
                  Impacted Districts (Comma separated)
                </label>
                <Input
                  value={districts}
                  onChange={(e) => setDistricts(e.target.value)}
                  required
                  placeholder="District 1, District 2"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#171716]">
                  Estimated Acquisition Outlay (₹ in Crores)
                </label>
                <Input
                  type="number"
                  value={estimatedBudgetCr}
                  onChange={(e) => setEstimatedBudgetCr(e.target.value)}
                  required
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#171716]">
                  Estimated Land Extent (Hectares)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={totalAreaHa}
                  onChange={(e) => setTotalAreaHa(e.target.value)}
                  required
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#171716]">
                  Target Commencement Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#171716]">
                  Statutory Completion Target
                </label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <Link href="/projects">
                <Button variant="outline" type="button" size="sm" className="text-xs">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm font-bold text-xs h-9 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span>{submitting ? "Registering..." : "Create Master Project"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
