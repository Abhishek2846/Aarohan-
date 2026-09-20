"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCasesQuery } from "@/hooks/queries/use-bhoomi-queries";
import { useI18n } from "@/hooks/use-i18n";
import { WORKFLOW_STAGES } from "@/lib/constants";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR, formatAreaHectares } from "@/lib/utils";
import {
  Search,
  Plus,
  Clock,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

export default function AcquisitionCasesPage() {
  const { t, lang } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState("ALL");
  const [selectedRisk, setSelectedRisk] = useState("ALL");

  const { data: cases = [], isLoading, isError, error, refetch } = useCasesQuery(
    searchTerm,
    selectedStage
  );

  const filteredCases = cases.filter((c) => {
    const matchesRisk = selectedRisk === "ALL" || c.delayRisk?.level === selectedRisk;
    return matchesRisk;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#171716]">
            {lang === "hi" ? "भूमि अधिग्रहण मामला रोस्टर" : "Acquisition Cases Roster"}
          </h1>
          <p className="text-xs text-[#68655e]">
            {lang === "hi"
              ? "12 सरकारी कार्यप्रवाह चरणों के माध्यम से भूमि अधिग्रहण मामलों की आधिकारिक ट्रैकिंग।"
              : "Authoritative tracking of land acquisition cases through 12 official government workflow stages."}
          </p>
        </div>

        <Link href="/cases/new">
          <Button className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm text-xs h-9 px-4 flex items-center gap-1.5 shadow-md shadow-amber-500/20 rounded-full">
            <Plus className="h-4 w-4 text-black" />
            <span>{t.createCase}</span>
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#68655e]" />
              <Input
                placeholder={lang === "hi" ? "मामला संख्या, परियोजना, जिला खोजें..." : "Search case #, project, district..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm max-w-xs truncate"
              >
                <option value="ALL">
                  {lang === "hi" ? "समस्त 12 वैधानिक चरण" : "All Statutory Stages (12)"}
                </option>
                {WORKFLOW_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {lang === "hi" ? `चरण ${s.order}: ${s.label}` : `Stage ${s.order}: ${s.label}`}
                  </option>
                ))}
              </select>

              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
              >
                <option value="ALL">{lang === "hi" ? "सभी जोखिम स्तर" : "All Risk Levels"}</option>
                <option value="LOW">{lang === "hi" ? "कम जोखिम" : "Low Risk"}</option>
                <option value="MEDIUM">{lang === "hi" ? "मध्यम जोखिम" : "Medium Risk"}</option>
                <option value="HIGH">{lang === "hi" ? "उच्च विलंब जोखिम" : "High Delay Risk"}</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isError ? (
            <div className="p-8 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
              <p className="text-sm font-semibold text-rose-300">
                {lang === "hi" ? "मामले लोड करने में त्रुटि: " : "Failed to load cases: "}
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
                  <TableHead>{lang === "hi" ? "मामला संदर्भ (डॉकेट)" : "Case Reference"}</TableHead>
                  <TableHead>{lang === "hi" ? "परियोजना एवं जिला" : "Project & District"}</TableHead>
                  <TableHead>{lang === "hi" ? "कार्यप्रवाह चरण" : "Workflow Stage"}</TableHead>
                  <TableHead>{lang === "hi" ? "एसएलए स्थिति" : "SLA Status"}</TableHead>
                  <TableHead>{t.dataQuality}</TableHead>
                  <TableHead>{t.delayRisk}</TableHead>
                  <TableHead>{lang === "hi" ? "पीएफएमएस मुआवजा" : "PFMS Compensation"}</TableHead>
                  <TableHead className="text-right">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell><div className="h-4 bg-[#eae6dc] animate-pulse rounded w-24" /></TableCell>
                      <TableCell><div className="h-4 bg-[#eae6dc] animate-pulse rounded w-48 mb-1" /><div className="h-3 bg-[#eae6dc] animate-pulse rounded w-24" /></TableCell>
                      <TableCell><div className="h-4 bg-[#eae6dc] animate-pulse rounded w-20" /></TableCell>
                      <TableCell><div className="h-4 bg-[#eae6dc] animate-pulse rounded w-16" /></TableCell>
                      <TableCell><div className="h-4 bg-[#eae6dc] animate-pulse rounded w-12" /></TableCell>
                      <TableCell><div className="h-4 bg-[#eae6dc] animate-pulse rounded w-16" /></TableCell>
                      <TableCell><div className="h-4 bg-[#eae6dc] animate-pulse rounded w-20" /></TableCell>
                      <TableCell><div className="h-4 bg-[#eae6dc] animate-pulse rounded w-12 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredCases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <EmptyState compact>
                      {lang === "hi"
                        ? "कोई अधिग्रहण मामला नहीं मिला।"
                        : "No matching acquisition cases found."}
                      </EmptyState>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCases.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs font-bold text-[#ef5b2a]">
                        {c.caseNumber}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/cases/${c.id}`}
                          className="font-bold text-xs text-[#171716] hover:text-[#ef5b2a] hover:underline"
                        >
                          {c.projectName}
                        </Link>
                        <p className="text-[11px] text-[#68655e]">
                          {c.district}, {c.state} • {formatAreaHectares(c.totalAcquisitionAreaHa)} ({c.parcelsCount} {lang === "hi" ? "पार्सल" : "parcels"})
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] border-[#d8d3c9] text-[#ef5b2a]">
                          {c.currentStageName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {c.isSlaBreached ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            <Clock className="h-3 w-3" />
                            <span>
                              {lang === "hi"
                                ? `${Math.abs(c.daysRemainingInSla)} दिन विलंबित`
                                : `Overdue ${Math.abs(c.daysRemainingInSla)}d`}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <Clock className="h-3 w-3" />
                            <span>
                              {lang === "hi"
                                ? `${c.daysRemainingInSla} दिन शेष`
                                : `${c.daysRemainingInSla}d remaining`}
                            </span>
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs">
                            {c.dataQuality?.score || 85}%
                          </span>
                          <span className="text-[10px] text-[#68655e]">
                            ({c.dataQuality?.passedChecks || 9}/{c.dataQuality?.totalChecks || 11})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            c.delayRisk?.level === "HIGH"
                              ? "danger"
                              : c.delayRisk?.level === "MEDIUM"
                              ? "warning"
                              : "success"
                          }
                          className="text-[10px]"
                        >
                          {c.delayRisk?.level === "HIGH"
                            ? lang === "hi" ? "उच्च" : "HIGH"
                            : c.delayRisk?.level === "MEDIUM"
                            ? lang === "hi" ? "मध्यम" : "MEDIUM"
                            : lang === "hi" ? "निम्न" : "LOW"}{" "}
                          ({c.delayRisk?.score || 25})
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        <div className="font-bold text-[#171716]">
                          {formatINR(c.estimatedCompensationINR)}
                        </div>
                        <div className="text-[10px] text-emerald-400">
                          {lang === "hi" ? "संवितरित: " : "Disbursed: "}
                          {formatINR(c.disbursedCompensationINR)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/cases/${c.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-xs flex items-center gap-1"
                          >
                            <span>{lang === "hi" ? "खोलें" : "Open"}</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Button>
                        </Link>
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
