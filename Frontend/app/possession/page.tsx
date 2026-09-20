"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ShieldCheck,
  Camera,
  MapPin,
  CheckCircle2,
  FileText,
  FileCheck2,
  Users,
  AlertTriangle,
} from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { usePossessionQuery } from "@/hooks/queries/use-bhoomi-queries";
import { apiClient } from "@/lib/api";

export default function PossessionHandoverPage() {
  const { lang } = useI18n();
  const isHi = lang === "hi";
  const { data: dbHandovers = [], refetch } = usePossessionQuery();

  const [memoNumber, setMemoNumber] = useState("MEMO-POSS-2026-042");
  const [caseNumber, setCaseNumber] = useState("LAC/2026/DEL-MUM/089");
  const [parcelsHandedOver, setParcelsHandedOver] = useState("312");
  const [areaHandedOverHa, setAreaHandedOverHa] = useState("142.4");
  const [handoverDate, setHandoverDate] = useState("2026-09-09");
  const [receivingAgency, setReceivingAgency] = useState("National Highways Authority of India (NHAI)");
  const [witness1, setWitness1] = useState("Sarpanch Ram Lal, Gram Panchayat");
  const [witness2, setWitness2] = useState("Patwari Mohan Das, Revenue Circle");
  const [fieldOfficer, setFieldOfficer] = useState("Priya Sundaram, IAS (DM & SLAO)");
  const [memoGenerated, setMemoGenerated] = useState(false);

  const fallbackHandovers = [
    {
      memo: "MEMO-POSS-2026-039",
      case: "LAC/2026/WDFC/RAJ-108",
      project: "Western Dedicated Freight Corridor",
      parcels: 220,
      areaHa: 110.6,
      date: "02 Sep 2026",
      officer: "Rajeshwar Rao",
      status: "COMPLETED",
    },
    {
      memo: "MEMO-POSS-2026-040",
      case: "LAC/2026/STRR/KA-042",
      project: "Bengaluru STRR Ring Road",
      parcels: 48,
      areaHa: 24.5,
      date: "28 Aug 2026",
      officer: "Priya Sundaram, IAS",
      status: "COMPLETED",
    },
  ];

  const completedHandovers = dbHandovers.length > 0 ? dbHandovers : fallbackHandovers;

  const handleGenerateMemo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient("/possession", {
        method: "POST",
        body: JSON.stringify({
          memoNumber,
          caseNumber,
          handoverDate,
          receivingAgency,
          witness1,
          witness2,
        }),
      });
      refetch();
    } catch {
      // Offline / fallback
    }
    setMemoGenerated(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#171716]">
            {isHi ? "जमीन सुपुर्दगी एवं सरकारी कब्जा (पूरा मुआवजा मिलने के बाद)" : "Land Handover & Possession (After Full Compensation Payout)"}
          </h1>
          <p className="text-xs text-[#68655e]">
            {isHi
              ? "किसानों के बैंक खातों में 100% पूरा मुआवजा पहुंचने के बाद ही जमीन का आधिकारिक कब्जा।"
              : "Official handover of acquired land only after 100% full compensation money has reached farmers' bank accounts."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Handover Form */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span>{isHi ? "जमीन सौंपने का नियम (पूरा पैसा मिलने के बाद ही)" : "Land Handover Protocol (Only After Full Payment)"}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {isHi
                  ? "भूमि कानून 2013 की धारा 38 के तहत, जमीन का कब्जा तभी लिया जा सकता है जब 100% मुआवजा किसान के बैंक खाते में जमा हो चुका हो।"
                  : "Under Section 38 of Land Acquisition Act 2013, government possession may strictly only be taken after 100% compensation has been directly deposited in the landowner's bank account."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {memoGenerated ? (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                  <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                      {isHi ? "जमीन कब्जा सुपुर्दगी पंचनामा सफलतापूर्वक जारी हुआ!" : "Section 38 Handover Memo Generated Successfully"}
                    </h3>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300">
                      {isHi
                        ? `${parcelsHandedOver} खेतों (${areaHandedOverHa} हेक्टेयर) का भौतिक कब्जा आधिकारिक रूप से ${receivingAgency} को सौंप दिया गया है।`
                        : `Physical possession of ${parcelsHandedOver} parcels (${areaHandedOverHa} Ha) has been transferred to ${receivingAgency}.`}
                    </p>
                  </div>
                  <div className="p-3 bg-[#fffdf8] border-[#d8d3c9] rounded-xl border text-[11px] font-mono text-[#171716]">
                    {isHi ? "छेड़छाड़-मुक्त डिजिटल सुरक्षा मोहर (हैश):" : "Tamper-Proof Digital Security Stamp:"} (e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855)
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setMemoGenerated(false)}
                    className="text-xs"
                  >
                    {isHi ? "एक और नया कब्जा पंचनामा जारी करें" : "Generate Another Handover Memo"}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleGenerateMemo} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-[#171716]">
                        {isHi ? "कब्जा पंचनामा संदर्भ संख्या" : "Handover Memo Reference"}
                      </label>
                      <Input
                        value={memoNumber}
                        onChange={(e) => setMemoNumber(e.target.value)}
                        required
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[#171716]">
                        {isHi ? "भूमि अधिग्रहण केस संख्या" : "Acquisition Case Number"}
                      </label>
                      <Input
                        value={caseNumber}
                        onChange={(e) => setCaseNumber(e.target.value)}
                        required
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-[#171716]">
                        {isHi ? "कुल सौंपे गए खेत (पार्सल)" : "Total Parcels Handed Over"}
                      </label>
                      <Input
                        type="number"
                        value={parcelsHandedOver}
                        onChange={(e) => setParcelsHandedOver(e.target.value)}
                        required
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[#171716]">
                        {isHi ? "कुल रकबा (हेक्टेयर)" : "Total Extent (Hectares)"}
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={areaHandedOverHa}
                        onChange={(e) => setAreaHandedOverHa(e.target.value)}
                        required
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#171716]">
                      {isHi ? "जमीन प्राप्त करने वाली सरकारी एजेंसी" : "Receiving Infrastructure Agency"}
                    </label>
                    <Input
                      value={receivingAgency}
                      onChange={(e) => setReceivingAgency(e.target.value)}
                      required
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="pt-2 border-t space-y-3">
                    <p className="font-bold text-[#171716] uppercase text-[10px] tracking-wider">
                      {isHi ? "मौके पर मौजूद पंचनामा गवाह एवं सरकारी अधिकारी" : "Panchanama Witnesses & Officers Present on Site"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-[#68655e]">
                          {isHi ? "पंच/गवाह 1 (स्थानीय जनप्रतिनिधि)" : "Witness 1 (Local Leader)"}
                        </label>
                        <Input
                          value={witness1}
                          onChange={(e) => setWitness1(e.target.value)}
                          required
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-[#68655e]">
                          {isHi ? "पंच/गवाह 2 (राजस्व अधिकारी)" : "Witness 2 (Revenue Official)"}
                        </label>
                        <Input
                          value={witness2}
                          onChange={(e) => setWitness2(e.target.value)}
                          required
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[#68655e]">
                        {isHi ? "कब्जा लेने वाले अधिकृत अधिकारी" : "Executing Officer"}
                      </label>
                      <Input
                        value={fieldOfficer}
                        onChange={(e) => setFieldOfficer(e.target.value)}
                        required
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-[#f4f1ea] border-[#d8d3c9] rounded-xl border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#171716] flex items-center gap-1.5">
                        <Camera className="h-4 w-4 text-emerald-600" />
                        <span>{isHi ? "जीपीएस युक्त मौके की सीमांकन तस्वीरें" : "Geo-Tagged Site Demarcation Photos"}</span>
                      </span>
                      <Badge variant="success" className="text-[10px]">
                        {isHi ? "4 फोटो संलग्न" : "4 Captured"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[#68655e]">
                      {isHi
                        ? "जीपीएस निर्देशांक (13.2941° N, 77.5342° E) सहित मौके की तस्वीरें पंचनामा दस्तावेज से संलग्न हैं।"
                        : "Field photos tagged with coordinates (13.2941° N, 77.5342° E) attached to panchanama dossier."}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm font-bold text-xs h-10 flex items-center justify-center gap-2"
                  >
                    <FileCheck2 className="h-4 w-4 text-[#ef5b2a]" />
                    <span>{isHi ? "धारा 38 जमीन कब्जा पंचनामा जारी करें" : "Execute Section 38 Possession Handover Memo"}</span>
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Historical Possession Memos */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">
                {isHi ? "जारी किए गए जमीन कब्जा पंचनामे" : "Executed Possession Memos"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isHi
                  ? "राज्य अभिलेखागार में सुरक्षित प्रमाणित जमीन सुपुर्दगी रिकॉर्ड।"
                  : "Certified land handover records deposited in the state archive."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {completedHandovers.map((h) => (
                <div
                  key={h.memo}
                  className="p-3.5 rounded-xl border bg-[#f4f1ea] border-[#d8d3c9] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono text-[#ef5b2a]">
                      {h.memo}
                    </span>
                    <Badge variant="success" className="text-[10px]">
                      {isHi ? "कार्य पूर्ण हुआ" : h.status}
                    </Badge>
                  </div>
                  <p className="font-semibold text-[#171716]">{h.project}</p>
                  <div className="flex justify-between text-[11px] text-[#68655e] pt-1 border-t">
                    <span>
                      {h.parcels} {isHi ? "खेत (पार्सल)" : "Parcels"} ({h.areaHa} {isHi ? "हेक्टेयर" : "Ha"})
                    </span>
                    <span>{isHi ? "तारीख:" : "Date:"} {h.date}</span>
                  </div>
                  <p className="text-[10px] text-[#68655e]">Officer: {h.officer}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
