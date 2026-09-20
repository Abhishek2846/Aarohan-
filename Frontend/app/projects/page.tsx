"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useProjectsQuery } from "@/hooks/queries/use-bhoomi-queries";
import { useI18n } from "@/hooks/use-i18n";
import { SECTOR_TYPES } from "@/lib/constants";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR, formatAreaHectares } from "@/lib/utils";
import {
  Plus,
  Map,
  Search,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

export default function ProjectsPage() {
  const { t, lang } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const { data: projects = [], isLoading, isError, error, refetch } = useProjectsQuery(
    searchTerm,
    selectedStatus
  );

  const filteredProjects = projects.filter((prj) => {
    const matchesSector = selectedSector === "ALL" || prj.sector === selectedSector;
    const matchesSearch =
      !searchTerm.trim() ||
      prj.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prj.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prj.state && prj.state.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSector && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#171716]">
            {lang === "hi" ? "बुनियादी ढांचा परियोजना पोर्टफोलियो" : "Infrastructure Projects Portfolio"}
          </h1>
          <p className="text-xs text-[#68655e]">
            {lang === "hi"
              ? "पीआईए प्रबंधन के अधीन पंजीकृत रैखिक संरेखण, स्थानिक बफर एवं भूमि अधिग्रहण प्रस्ताव।"
              : "Registered linear alignments, spatial buffers, and acquisition proposals under PIA management."}
          </p>
        </div>

        <Link href="/projects/new">
          <Button className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm font-bold text-xs h-9 flex items-center gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            <span>{t.createProject}</span>
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#68655e]" />
              <Input
                placeholder={lang === "hi" ? "परियोजना कोड, नाम, राज्य खोजें..." : "Search project code, title, state..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
              >
                <option value="ALL">{lang === "hi" ? "सभी क्षेत्र" : "All Sectors"}</option>
                {SECTOR_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
              >
                <option value="ALL">{lang === "hi" ? "सभी स्थितियां" : "All Statuses"}</option>
                <option value="IN_PROGRESS">{lang === "hi" ? "प्रगति पर" : "In Progress"}</option>
                <option value="PLANNING">{lang === "hi" ? "योजना चरण" : "Planning"}</option>
                <option value="COMPLETED">{lang === "hi" ? "पूर्ण" : "Completed"}</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isError ? (
            <div className="p-8 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
              <p className="text-sm font-semibold text-rose-900 dark:text-rose-300">
                {lang === "hi" ? "परियोजनाएं लोड करने में त्रुटि: " : "Failed to load projects: "}
                {(error as any)?.message || "API error"}
              </p>
              <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs">
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                {lang === "hi" ? "पुनः प्रयास करें" : "Retry Query"}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{lang === "hi" ? "परियोजना कोड" : "Project Code"}</TableHead>
                  <TableHead>{lang === "hi" ? "परियोजना का नाम एवं क्षेत्र" : "Project Title & Sector"}</TableHead>
                  <TableHead>{lang === "hi" ? "भूगोल" : "Geography"}</TableHead>
                  <TableHead>{lang === "hi" ? "आवश्यक भूमि" : "Required Land"}</TableHead>
                  <TableHead>{lang === "hi" ? "अनुमानित व्यय" : "Estimated Outlay"}</TableHead>
                  <TableHead>{lang === "hi" ? "पार्सल / मामले" : "Parcels / Cases"}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead className="text-right">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" /></TableCell>
                      <TableCell><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48 mb-1" /><div className="h-3 bg-[#f4f1ea] dark:bg-[#fffdf8] rounded w-24" /></TableCell>
                      <TableCell><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" /></TableCell>
                      <TableCell><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" /></TableCell>
                      <TableCell><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" /></TableCell>
                      <TableCell><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" /></TableCell>
                      <TableCell><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" /></TableCell>
                      <TableCell><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <EmptyState compact>
                      {lang === "hi"
                        ? "कोई मेल खाती बुनियादी ढांचा परियोजना नहीं मिली।"
                        : "No matching infrastructure projects found."}
                      </EmptyState>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects.map((prj) => (
                    <TableRow key={prj.id}>
                      <TableCell className="font-mono text-xs font-bold text-[#ef5b2a]">
                        {prj.projectCode}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/projects/${prj.id}`}
                          className="font-bold text-xs text-[#171716] hover:text-[#ef5b2a] hover:underline"
                        >
                          {prj.title}
                        </Link>
                        <p className="text-[11px] text-[#68655e]">{prj.sector}</p>
                      </TableCell>
                      <TableCell className="text-xs">
                        <p className="font-semibold">{prj.state}</p>
                        <p className="text-[10px] text-[#68655e]">{prj.districts.join(", ")}</p>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {formatAreaHectares(prj.totalAcquisitionAreaHa)}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-semibold">
                        {formatINR(prj.estimatedBudgetINR)}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-bold">{prj.affectedParcelsCount}</span>{" "}
                        {lang === "hi" ? "पार्सल" : "parcels"} •{" "}
                        <span className="font-bold">{prj.casesCount}</span>{" "}
                        {lang === "hi" ? "केस" : "cases"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            prj.status === "COMPLETED"
                              ? "success"
                              : prj.status === "IN_PROGRESS"
                              ? "default"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {prj.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/projects/${prj.id}/alignment`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs flex items-center gap-1 border-[#d8d3c9] text-blue-900 hover:bg-[#ef5b2a]/10"
                            >
                              <Map className="h-3 w-3 text-blue-600" />
                              <span>{lang === "hi" ? "संरेखण" : "Alignment"}</span>
                            </Button>
                          </Link>
                          <Link href={`/projects/${prj.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs flex items-center gap-1"
                            >
                              <span>{lang === "hi" ? "केस फाइलें" : "Cases"}</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
