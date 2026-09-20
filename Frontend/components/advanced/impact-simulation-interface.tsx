"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR, formatAreaHectares } from "@/lib/utils";
import {
  Sliders,
  Sparkles,
  Layers,
  Users,
  Trees,
  Coins,
  Clock,
  CheckCircle2,
  Download,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Compass,
} from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { useSimulationScenariosQuery } from "@/hooks/queries/use-bhoomi-queries";

interface AlignmentOption {
  id: "OPTION_A" | "OPTION_B" | "OPTION_C" | string;
  name: string;
  tagline: string;
  baseLengthKm: number;
  baseParcelsPerKm: number;
  baseFamiliesPerKm: number;
  baseForestHa: number;
  baseCostPerKmCr: number;
  baseMonths: number;
  description: string;
}

const ALIGNMENT_OPTIONS: AlignmentOption[] = [
  {
    id: "OPTION_A",
    name: "Option A: Direct Greenfield Alignment",
    tagline: "Shortest geometric distance, traverses agrarian settlements",
    baseLengthKm: 42.4,
    baseParcelsPerKm: 4.8,
    baseFamiliesPerKm: 1.4,
    baseForestHa: 8.5,
    baseCostPerKmCr: 5.2,
    baseMonths: 14,
    description: "Direct linear corridor minimizing vehicle travel time, but intersects fertile agricultural holdings.",
  },
  {
    id: "OPTION_B",
    name: "Option B: River Valley & Village Bypass",
    tagline: "Bypasses dense habitation, minimal family displacement (Recommended)",
    baseLengthKm: 46.2,
    baseParcelsPerKm: 3.6,
    baseFamiliesPerKm: 0.6,
    baseForestHa: 3.2,
    baseCostPerKmCr: 4.6,
    baseMonths: 12,
    description: "Curves along semi-arid scrub land and river embankments. Reduces rehabilitation displacement by 57%.",
  },
  {
    id: "OPTION_C",
    name: "Option C: Eco-Avoidance Northern Loop",
    tagline: "Zero forest encroachment, higher civil engineering cost",
    baseLengthKm: 51.0,
    baseParcelsPerKm: 3.2,
    baseFamiliesPerKm: 0.8,
    baseForestHa: 0.0,
    baseCostPerKmCr: 5.8,
    baseMonths: 18,
    description: "Completely circumnavigates eco-sensitive reserve forests. Eliminates MoEFCC Stage-II clearance bottlenecks.",
  },
];

export function ImpactSimulationInterface() {
  const { lang } = useI18n();
  const isHi = lang === "hi";
  const [selectedOptionId, setSelectedOptionId] = useState<string>("OPTION_B");
  const [rowBufferMeters, setRowBufferMeters] = useState<number>(60);
  const [ruralMultiplier, setRuralMultiplier] = useState<number>(1.25);
  const [solatiumPct, setSolatiumPct] = useState<number>(100);

  // Live Backend Simulation Scenarios Query
  const { data: scenariosData } = useSimulationScenariosQuery();

  const alignmentOptions = useMemo<AlignmentOption[]>(() => {
    const list = Array.isArray(scenariosData) ? scenariosData : (scenariosData as any)?.scenarios;
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }
    return ALIGNMENT_OPTIONS;
  }, [scenariosData]);

  // Real-time calculation based on sliders
  const currentOption = alignmentOptions.find((o) => o.id === selectedOptionId) || alignmentOptions[0];

  const bufferScale = rowBufferMeters / 60; // 1.0 at 60m

  const simulatedStats = useMemo(() => {
    return alignmentOptions.map((opt) => {
      const scale = rowBufferMeters / 60;
      const totalParcels = Math.round(opt.baseLengthKm * opt.baseParcelsPerKm * scale);
      const totalAreaHa = Number((opt.baseLengthKm * (rowBufferMeters / 1000) * 100).toFixed(1));
      const affectedFamilies = Math.round(opt.baseLengthKm * opt.baseFamiliesPerKm * scale);
      const forestHa = Number((opt.baseForestHa * scale).toFixed(1));
      const baseOutlayCr = opt.baseLengthKm * opt.baseCostPerKmCr * scale;
      const compensationCr = Number(
        (baseOutlayCr * ruralMultiplier * (1 + solatiumPct / 100) * 0.45).toFixed(1)
      );
      const totalBudgetCr = Number((baseOutlayCr + compensationCr).toFixed(1));
      const timelineMonths = Math.round(opt.baseMonths + (scale - 1) * 4);

      return {
        ...opt,
        totalParcels,
        totalAreaHa,
        affectedFamilies,
        forestHa,
        compensationCr,
        totalBudgetCr,
        timelineMonths,
      };
    });
  }, [alignmentOptions, rowBufferMeters, ruralMultiplier, solatiumPct]);

  const activeStats = simulatedStats.find((s) => s.id === selectedOptionId) || simulatedStats[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#171716]">
              {isHi ? "परियोजना मार्ग एवं जमीन असर अनुमान" : "Corridor Impact & What-If Simulation"}
            </h1>
            <Badge variant="outline" className="text-[#ef5b2a] border-[#ef5b2a]/30 bg-[#ef5b2a]/10 font-mono text-[10px] font-bold">
              {isHi ? "एआई निर्णय सहायता" : "AI Decision Support"}
            </Badge>
          </div>
          <p className="text-xs text-[#68655e]">
            {isHi
              ? "प्रोजेक्ट का मार्ग, आवश्यक जमीन, प्रभावित परिवार एवं कुल मुआवजा लागत का वास्तविक समय में अनुमान।"
              : "Dynamically model Right-of-Way buffer, route alignment options, and statutory solatium outlays."}
          </p>
        </div>

        <Button
          onClick={() => alert(isHi ? "कैबिनेट नोट डाउनलोड हो रहा है..." : "Generating Inter-Ministerial Cabinet Note with simulated corridor alternatives...")}
          className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold text-xs h-9 flex items-center gap-1.5 rounded-full shadow-sm"
        >
          <Download className="h-4 w-4" />
          <span>{isHi ? "कैबिनेट व्यवहार्यता नोट डाउनलोड करें" : "Export Cabinet Feasibility Note"}</span>
        </Button>
      </div>

      {/* Control Workstation: Sliders & Parameter Configuration */}
      <Card className="border-[#d8d3c9] bg-[#fffdf8] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#171716]">
            <Sliders className="h-4 w-4 text-[#ef5b2a]" />
            <span>{isHi ? "अनुमान मापदंड एवं प्रोजेक्ट सीमाएं" : "Simulation Parameters & Corridor Constraints"}</span>
          </CardTitle>
          <CardDescription className="text-xs text-[#68655e]">
            {isHi
              ? "प्रोजेक्ट मार्ग की चौड़ाई और मुआवजा गुणांक बदलकर वास्तविक प्रभाव देखें।"
              : "Adjust statutory compensation factors and Right-of-Way physical width to observe impact in real time."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Right-of-Way Buffer Slider */}
            <div className="space-y-2 bg-[#f4f1ea] p-4 rounded-xl border border-[#d8d3c9]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#171716]">
                  {isHi ? "प्रोजेक्ट मार्ग की चौड़ाई" : "Corridor RoW Width"}
                </span>
                <span className="font-mono font-bold text-[#ef5b2a] text-sm">
                  {rowBufferMeters} {isHi ? "मीटर" : "Meters"}
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="120"
                step="5"
                value={rowBufferMeters}
                onChange={(e) => setRowBufferMeters(Number(e.target.value))}
                className="w-full accent-[#ef5b2a] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#68655e]">
                <span>{isHi ? "30 मी (राज्य मार्ग)" : "30m (State Hwy)"}</span>
                <span>{isHi ? "60 मी (राष्ट्रीय मार्ग)" : "60m (National Hwy)"}</span>
                <span>{isHi ? "120 मी (एक्सप्रेसवे)" : "120m (Expressway)"}</span>
              </div>
            </div>

            {/* Rural Land Multiplier Slider */}
            <div className="space-y-2 bg-[#f4f1ea] p-4 rounded-xl border border-[#d8d3c9]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#171716]">
                  {isHi ? "भूमि कानून 2013 गुणांक" : "RFCTLARR Multiplier"}
                </span>
                <span className="font-mono font-bold text-[#15803d] text-sm">
                  {ruralMultiplier.toFixed(2)}x {isHi ? "बाज़ार भाव" : "Market Value"}
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.0"
                step="0.05"
                value={ruralMultiplier}
                onChange={(e) => setRuralMultiplier(Number(e.target.value))}
                className="w-full accent-[#15803d] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#68655e]">
                <span>{isHi ? "1.0x (शहरी)" : "1.0x (Urban)"}</span>
                <span>{isHi ? "1.25x (अर्ध-ग्रामीण)" : "1.25x (Semi-Rural)"}</span>
                <span>{isHi ? "2.0x (दूरस्थ ग्रामीण)" : "2.0x (Deep Rural)"}</span>
              </div>
            </div>

            {/* Solatium Guarantee Toggle */}
            <div className="space-y-2 bg-[#f4f1ea] p-4 rounded-xl border border-[#d8d3c9]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#171716]">
                  {isHi ? "अनिवार्य सरकारी बोनस (सोलेशियम)" : "Statutory Solatium"}
                </span>
                <span className="font-mono font-bold text-[#ef5b2a] text-sm">
                  +{solatiumPct}% ({isHi ? "धारा 30" : "Section 30"})
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  size="sm"
                  variant={solatiumPct === 100 ? "default" : "outline"}
                  onClick={() => setSolatiumPct(100)}
                  className={`h-8 text-xs font-bold rounded-full ${
                    solatiumPct === 100
                      ? "bg-[#171716] text-[#fffdf8]"
                      : "border-[#d8d3c9] bg-[#fffdf8] text-[#171716] hover:bg-[#f4f1ea]"
                  }`}
                >
                  {isHi ? "100% अनिवार्य बोनस" : "100% Statutory"}
                </Button>
                <Button
                  size="sm"
                  variant={solatiumPct === 125 ? "default" : "outline"}
                  onClick={() => setSolatiumPct(125)}
                  className={`h-8 text-xs font-bold rounded-full ${
                    solatiumPct === 125
                      ? "bg-[#171716] text-[#fffdf8]"
                      : "border-[#d8d3c9] bg-[#fffdf8] text-[#171716] hover:bg-[#f4f1ea]"
                  }`}
                >
                  {isHi ? "125% राज्य विशेष" : "125% State Ex-Gratia"}
                </Button>
              </div>
              <span className="text-[10px] text-[#68655e] block text-center">
                {isHi ? "भूमि अधिग्रहण कानून 2013 की पहली अनुसूची द्वारा अनिवार्य" : "Guaranteed by First Schedule of RFCTLARR Act 2013"}
              </span>
            </div>
          </div>

          {/* Alignment Route Selector */}
          <div className="space-y-2 pt-2">
            <span className="text-[10px] uppercase font-bold text-[#68655e] block">
              {isHi ? "परियोजना मार्ग विकल्प चुनें" : "Select Corridor Alignment Route"}
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {alignmentOptions.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedOptionId(opt.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#171716] text-[#fffdf8] border-[#171716] shadow-md ring-2 ring-[#ef5b2a]"
                        : "bg-[#fffdf8] border-[#d8d3c9] hover:border-[#171716]/40 text-[#171716]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold">{opt.name.split(":")[0]}</span>
                      {opt.id === "OPTION_B" && (
                        <Badge variant="success" className="text-[9px] px-1.5 py-0 font-bold">
                          {isHi ? "अनुशंसित" : "Recommended"}
                        </Badge>
                      )}
                    </div>
                    <p className={`text-[11px] line-clamp-2 ${isSelected ? "text-[#fffdf8]/80" : "text-[#68655e]"}`}>
                      {opt.tagline}
                    </p>
                    <div className="flex items-center justify-between text-[10px] mt-2 pt-2 border-t border-[#d8d3c9]/30">
                      <span>{isHi ? "लंबाई:" : "Length:"} <strong>{opt.baseLengthKm} {isHi ? "किमी" : "Km"}</strong></span>
                      <span>{isHi ? "समय:" : "Delivery:"} <strong>{opt.baseMonths} {isHi ? "महीने" : "Mos"}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulated Outcomes HUD for Active Option */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl border border-[#d8d3c9] bg-[#fffdf8] shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#68655e] flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-[#ef5b2a]" />
            {isHi ? "अधिग्रहित खेत (पार्सल)" : "Parcels Intersected"}
          </span>
          <p className="text-xl font-black text-[#171716] font-mono">
            {activeStats.totalParcels}
          </p>
          <span className="text-[10px] text-[#68655e]">
            {activeStats.totalAreaHa} {isHi ? "हेक्टेयर आवश्यक" : "Hectares required"}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-[#d8d3c9] bg-[#fffdf8] shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#68655e] flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-[#ef5b2a]" />
            {isHi ? "प्रभावित परिवार" : "Affected Families"}
          </span>
          <p className="text-xl font-black text-[#171716] font-mono">
            {activeStats.affectedFamilies}
          </p>
          <span className="text-[10px] text-[#68655e]">
            {isHi ? "पुनर्वास सहायता कोटा" : "R&R resettlement quota"}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-[#d8d3c9] bg-[#fffdf8] shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#68655e] flex items-center gap-1">
            <Trees className="h-3.5 w-3.5 text-[#15803d]" />
            {isHi ? "वन भूमि (पर्यावरण)" : "Forest Encroachment"}
          </span>
          <p className="text-xl font-black text-[#171716] font-mono">
            {activeStats.forestHa} Ha
          </p>
          <span className="text-[10px] text-[#68655e]">
            {activeStats.forestHa === 0
              ? (isHi ? "शून्य वन कटाई (क्लीयरेंस मुक्त)" : "Zero Eco-Clearance")
              : (isHi ? "पर्यावरण मंत्रालय स्टेज-2 जरूरी" : "MoEFCC Stage-II required")}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-[#d8d3c9] bg-[#fffdf8] shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#68655e] flex items-center gap-1">
            <Coins className="h-3.5 w-3.5 text-[#15803d]" />
            {isHi ? "कुल मुआवजा बजट" : "Compensation Outlay"}
          </span>
          <p className="text-xl font-black text-[#15803d] font-mono">
            ₹{activeStats.compensationCr} Cr
          </p>
          <span className="text-[10px] text-[#68655e]">
            {isHi ? "कुल प्रोजेक्ट बजट:" : "Total Project:"} ₹{activeStats.totalBudgetCr} Cr
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-[#d8d3c9] bg-[#fffdf8] shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#68655e] flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-[#171716]" />
            {isHi ? "कार्य पूर्ण होने का लक्ष्य" : "Target Completion"}
          </span>
          <p className="text-xl font-black text-[#171716] font-mono">
            {activeStats.timelineMonths} {isHi ? "महीने" : "Mos"}
          </p>
          <span className="text-[10px] text-[#68655e]">
            {isHi ? "मार्ग शुरू होने की समयसीमा" : "Corridor commission date"}
          </span>
        </div>
      </div>

      {/* Comparative Scenario Analysis Table */}
      <Card className="border-[#d8d3c9] bg-[#fffdf8] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-[#171716]">
            {isHi ? "मार्ग विकल्पों का तुलनात्मक विश्लेषण" : "Cross-Corridor Multi-Scenario Comparison Matrix"}
          </CardTitle>
          <CardDescription className="text-xs text-[#68655e]">
            {isHi
              ? `मार्ग चौड़ाई (${rowBufferMeters} मी) के आधार पर 3 विकल्पों की सीधी तुलना।`
              : `Direct comparison of the 3 alignment alternatives calibrated to the ${rowBufferMeters}m RoW width.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isHi ? "मार्ग का विकल्प" : "Corridor Alternative"}</TableHead>
                <TableHead>{isHi ? "लंबाई (किमी)" : "Length (Km)"}</TableHead>
                <TableHead>{isHi ? "आवश्यक जमीन" : "Land Required"}</TableHead>
                <TableHead>{isHi ? "प्रभावित परिवार" : "Displaced Families"}</TableHead>
                <TableHead>{isHi ? "वन क्षेत्र" : "Forest Area"}</TableHead>
                <TableHead>{isHi ? "अनुमानित कुल मुआवजा" : "Statutory Compensation"}</TableHead>
                <TableHead>{isHi ? "समयसीमा" : "Timeline"}</TableHead>
                <TableHead className="text-right">{isHi ? "सिफारिश" : "Recommendation"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {simulatedStats.map((st) => {
                const isSelected = st.id === selectedOptionId;
                return (
                  <TableRow
                    key={st.id}
                    className={`text-xs ${
                      isSelected ? "bg-[#eae6dc]/60 font-semibold" : ""
                    }`}
                  >
                    <TableCell>
                      <div className="font-bold text-[#171716]">{st.name}</div>
                      <span className="text-[10px] text-[#68655e] block">{st.tagline}</span>
                    </TableCell>
                    <TableCell className="font-mono text-[#171716]">{st.baseLengthKm} Km</TableCell>
                    <TableCell className="font-mono text-[#171716]">
                      {st.totalAreaHa} Ha ({st.totalParcels} Parcels)
                    </TableCell>
                    <TableCell className="font-mono text-[#ef5b2a] font-semibold">
                      {st.affectedFamilies} Families
                    </TableCell>
                    <TableCell className="font-mono text-[#171716]">
                      {st.forestHa === 0 ? (
                        <span className="text-[#15803d] font-bold">0.0 Ha (Clean)</span>
                      ) : (
                        `${st.forestHa} Ha`
                      )}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-[#15803d]">
                      ₹{st.compensationCr} Cr
                    </TableCell>
                    <TableCell className="font-mono text-[#171716]">{st.timelineMonths} Mos</TableCell>
                    <TableCell className="text-right">
                      {st.id === "OPTION_B" ? (
                        <Badge variant="success" className="text-[10px] font-bold">
                          Optimal Choice
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedOptionId(st.id)}
                          className="h-6 text-[11px] text-[#ef5b2a] hover:text-[#d94e20] font-bold rounded-full"
                        >
                          Select
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
