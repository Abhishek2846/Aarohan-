"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCasesQuery, useProjectDetailQuery } from "@/hooks/queries/use-bhoomi-queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { formatINR, formatAreaHectares } from "@/lib/utils";
import {
  Building2,
  MapPin,
  Calendar,
  Layers,
  ArrowLeft,
  Map,
  Plus,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ProjectDelayRiskCard } from "@/components/ai/project-delay-risk-card";
import { LifecycleRiskTrajectory } from "@/components/ai/lifecycle-risk-trajectory";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const { data: project, isLoading: projectLoading } = useProjectDetailQuery(projectId);
  const { data: cases = [], isLoading: casesLoading } = useCasesQuery("", "", projectId);

  if (projectLoading || casesLoading) {
    return <div className="max-w-4xl mx-auto py-12 text-center text-xs text-[#68655e]">Loading project record from PostgreSQL...</div>;
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-bold">Project Record Not Found</h2>
        <p className="text-xs text-[#68655e]">The requested project reference does not exist.</p>
        <Link href="/projects">
          <Button variant="outline" size="sm">
            Back to Projects Portfolio
          </Button>
        </Link>
      </div>
    );
  }

  const milestones = [
    { title: "DPR & Linear Alignment Approved", date: "15 Mar 2024", done: true },
    { title: "Spatial Buffer & ULPIN Identification", date: "22 May 2024", done: true },
    { title: "Section 11 Preliminary Notification", date: "12 May 2026", done: true },
    { title: "Section 15 Objections & SDM Hearings", date: "Current Stage", inProgress: true },
    { title: "Section 19 Declaration of Acquisition", date: "Target Oct 2026", scheduled: true },
    { title: "Section 23 Award & Solatium Payout", date: "Target Dec 2026", scheduled: true },
    { title: "Section 38 Possession Handover", date: "Target Feb 2027", scheduled: true },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions */}
      <Breadcrumbs
        items={[
          { label: "Projects Portfolio", href: "/projects" },
          { label: project.title, isCurrent: true },
        ]}
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/projects" aria-label="Back to projects portfolio">
            <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Back to projects portfolio">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-[#171716]">
                {project.title}
              </h1>
              <Badge variant="civic">{project.status}</Badge>
            </div>
            <p className="text-xs text-[#68655e] font-mono">
              Code: {project.projectCode} • Sector: {project.sector}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/gati-shakti?project=${project.id}`}>
            <Button
              variant="outline"
              className="border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold text-xs h-9 flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>PM Gati Shakti NMP</span>
            </Button>
          </Link>
          <Link href={`/projects/${project.id}/alignment`}>
            <Button className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm text-xs h-9 flex items-center gap-1.5 shadow-md shadow-amber-500/20">
              <Map className="h-4 w-4 text-amber-400" />
              <span>GIS Alignment Corridor</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] uppercase font-bold text-[#68655e]">Total Sanctioned Outlay</p>
            <p className="text-xl font-black text-slate-900 dark:text-[#171716] font-mono">
              {formatINR(project.estimatedBudgetINR)}
            </p>
            <p className="text-[11px] text-[#68655e]">{project.piaName}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] uppercase font-bold text-[#68655e]">Required Land Extent</p>
            <p className="text-xl font-black text-slate-900 dark:text-[#171716]">
              {formatAreaHectares(project.totalAcquisitionAreaHa)}
            </p>
            <p className="text-[11px] text-[#68655e]">
              {project.state} ({project.districts.join(", ")})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] uppercase font-bold text-[#68655e]">Acquisition Cases</p>
            <p className="text-xl font-black text-slate-900 dark:text-[#171716]">
              {cases.length} Packages
            </p>
            <p className="text-[11px] text-[#68655e]">{project.affectedParcelsCount || 1240} Intersected Parcels</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] uppercase font-bold text-[#68655e]">Target Completion</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {project.targetCompletionDate}
            </p>
            <p className="text-[11px] text-[#68655e]">Commenced: {project.startDate}</p>
          </CardContent>
        </Card>
      </div>

      {/* Explainable AI 90-Day Delay Prediction & TreeSHAP Attribution */}
      <ProjectDelayRiskCard projectId={project.id} />

      {/* Longitudinal Lifecycle Risk Trajectory */}
      <LifecycleRiskTrajectory projectId={project.id} />

      {/* Progress & Milestone Stepper */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Statutory Acquisition Milestones</CardTitle>
              <CardDescription className="text-xs">
                Sequential compliance progression under RFCTLARR Act 2013 and GatiShakti standards.
              </CardDescription>
            </div>
            <span className="text-xs font-bold text-blue-900 dark:text-blue-300">Overall Progress: 62%</span>
          </div>
          <div className="w-full pt-2">
            <Progress value={62} indicatorClassName="bg-blue-800" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 pt-3">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  m.done
                    ? "bg-emerald-50/60 border-emerald-200 text-emerald-950 dark:bg-emerald-950/20"
                    : m.inProgress
                    ? "bg-blue-50 border-blue-300 ring-1 ring-blue-500 text-blue-950 dark:bg-blue-950/30"
                    : "bg-slate-50 border-slate-200 text-[#68655e] dark:bg-[#fffdf8]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[10px] uppercase">Step {idx + 1}</span>
                  {m.done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : m.inProgress ? (
                    <Clock className="h-3.5 w-3.5 text-blue-600 animate-spin" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </div>
                <p className="font-semibold text-[11px] leading-tight line-clamp-2">{m.title}</p>
                <p className="text-[10px] text-[#68655e]">{m.date}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Linked Acquisition Cases */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">Linked Acquisition Packages & Cases</CardTitle>
            <CardDescription className="text-xs">
              Administrative district-level acquisition dockets linked to this corridor.
            </CardDescription>
          </div>
          <Link href="/cases/new">
            <Button variant="outline" size="sm" className="h-8 text-xs flex items-center gap-1">
              <Plus className="h-3.5 w-3.5 text-blue-600" />
              <span>Create Acquisition Case</span>
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case Number</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Workflow Stage</TableHead>
                <TableHead>Parcels</TableHead>
                <TableHead>SLA Status</TableHead>
                <TableHead>Disbursed Compensation</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-xs text-[#68655e]">
                    No acquisition packages created yet. Click above to create one.
                  </TableCell>
                </TableRow>
              ) : (
                cases.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs font-bold text-blue-900 dark:text-blue-300">
                      {c.caseNumber}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{c.district}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-900">
                        {c.currentStageName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {c.parcelsCount} ({formatAreaHectares(c.totalAcquisitionAreaHa)})
                    </TableCell>
                    <TableCell>
                      {c.isSlaBreached ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          Overdue {Math.abs(c.daysRemainingInSla)}d
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {c.daysRemainingInSla}d SLA
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-semibold">
                      {formatINR(c.disbursedCompensationINR)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/cases/${c.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          <span>Inspect</span>
                          <ArrowUpRight className="h-3 w-3 ml-0.5" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
