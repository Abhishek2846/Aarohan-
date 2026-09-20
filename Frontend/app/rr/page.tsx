"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatINR } from "@/lib/utils";
import {
  Users,
  Home,
  Briefcase,
  Plus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  HeartHandshake,
  ShieldCheck,
} from "lucide-react";

interface AffectedFamily {
  id: string;
  familyHead: string;
  vulnerability: "SC" | "ST" | "BPL" | "WOMAN_HEADED" | "GENERAL";
  membersCount: number;
  village: string;
  housingGrantINR: number;
  housingStatus: "SANCTIONED" | "CONSTRUCTED" | "DISBURSED";
  subsistenceAllowanceINR: number;
  subsistenceStatus: "ACTIVE" | "COMPLETED";
  totalEntitlementINR: number;
}

interface GrievanceEntry {
  id: string;
  ref: string;
  citizenName: string;
  ulpin: string;
  category: string;
  slaDaysRemaining: number;
  status: "HEARING_SCHEDULED" | "INVESTIGATING" | "RESOLVED";
}

import { useI18n } from "@/hooks/use-i18n";
import { useRrQuery } from "@/hooks/queries/use-bhoomi-queries";

export default function RehabilitationAndResettlementPage() {
  const { lang } = useI18n();
  const isHi = lang === "hi";
  const { data: rrData, isLoading } = useRrQuery();

  const [families, setFamilies] = useState<AffectedFamily[]>([
    {
      id: "fam_01",
      familyHead: "Govindappa Narayana",
      vulnerability: "SC",
      membersCount: 5,
      village: "Doddaballapur",
      housingGrantINR: 350000,
      housingStatus: "DISBURSED",
      subsistenceAllowanceINR: 360000, // 30,000/mo for 12 months under 2nd Schedule
      subsistenceStatus: "ACTIVE",
      totalEntitlementINR: 710000,
    },
    {
      id: "fam_02",
      familyHead: "Smt. Manjula (Widow)",
      vulnerability: "WOMAN_HEADED",
      membersCount: 3,
      village: "Doddaballapur",
      housingGrantINR: 350000,
      housingStatus: "DISBURSED",
      subsistenceAllowanceINR: 360000,
      subsistenceStatus: "ACTIVE",
      totalEntitlementINR: 710000,
    },
    {
      id: "fam_03",
      familyHead: "Kishan Lal",
      vulnerability: "BPL",
      membersCount: 4,
      village: "Channapatna",
      housingGrantINR: 350000,
      housingStatus: "SANCTIONED",
      subsistenceAllowanceINR: 360000,
      subsistenceStatus: "ACTIVE",
      totalEntitlementINR: 710000,
    },
  ]);

  const [grievances, setGrievances] = useState<GrievanceEntry[]>([
    {
      id: "grv_01",
      ref: "GRV-2026-KA-109",
      citizenName: "Narayan Rao",
      ulpin: "KA-BLR-2026-0041",
      category: "Housing Site Allotment Proximity",
      slaDaysRemaining: 6,
      status: "HEARING_SCHEDULED",
    },
    {
      id: "grv_02",
      ref: "GRV-2026-GJ-044",
      citizenName: "Bhikhu Bhai",
      ulpin: "GJ-VAD-2026-0813",
      category: "Cattle Shed Allowance Omission",
      slaDaysRemaining: 14,
      status: "INVESTIGATING",
    },
  ]);

  // Synchronize with database seeded affected families and grievances
  React.useEffect(() => {
    if (rrData?.affectedFamilies && rrData.affectedFamilies.length > 0) {
      setFamilies(
        rrData.affectedFamilies.map((f: any) => ({
          id: f.id,
          familyHead: f.headName,
          vulnerability: (f.category || "GENERAL") as AffectedFamily["vulnerability"],
          membersCount: f.membersCount || 4,
          village: f.village || "Doddaballapur",
          housingGrantINR: 350000,
          housingStatus: (f.status || "DISBURSED") as AffectedFamily["housingStatus"],
          subsistenceAllowanceINR: 360000,
          subsistenceStatus: "ACTIVE",
          totalEntitlementINR: f.entitlementINR || 710000,
        }))
      );
    }
    if (rrData?.grievances && rrData.grievances.length > 0) {
      setGrievances(
        rrData.grievances.map((g: any, idx: number) => ({
          id: g.id,
          ref: g.reference,
          citizenName: g.citizenName,
          ulpin: `KA-BLR-SEED-000${(idx % 5) + 1}`,
          category: g.category,
          slaDaysRemaining: 10 + idx * 2,
          status: (g.status === "RESOLVED"
            ? "RESOLVED"
            : g.status === "HEARING_SCHEDULED"
            ? "HEARING_SCHEDULED"
            : "INVESTIGATING") as GrievanceEntry["status"],
        }))
      );
    }
  }, [rrData]);

  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [newHeadName, setNewHeadName] = useState("");
  const [newVulnerability, setNewVulnerability] = useState<AffectedFamily["vulnerability"]>("BPL");
  const [newMembers, setNewMembers] = useState("4");
  const [newVillage, setNewVillage] = useState("Doddaballapur");

  // Grievance Form State
  const [newGrievanceUlpin, setNewGrievanceUlpin] = useState("KA-BLR-2026-0042");
  const [newGrievanceCategory, setNewGrievanceCategory] = useState("Livelihood Training & Skill Grant");
  const [newGrievanceDetails, setNewGrievanceDetails] = useState("");
  const [grievanceSubmitted, setGrievanceSubmitted] = useState(false);

  const handleRegisterFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHeadName) return;

    const newFam: AffectedFamily = {
      id: `fam_${Date.now()}`,
      familyHead: newHeadName,
      vulnerability: newVulnerability,
      membersCount: Number(newMembers),
      village: newVillage,
      housingGrantINR: 350000,
      housingStatus: "SANCTIONED",
      subsistenceAllowanceINR: 360000,
      subsistenceStatus: "ACTIVE",
      totalEntitlementINR: 710000,
    };

    setFamilies((prev) => [newFam, ...prev]);
    setFamilyModalOpen(false);
    setNewHeadName("");
  };

  const handleLodgeGrievance = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: GrievanceEntry = {
      id: `grv_${Date.now()}`,
      ref: `GRV-2026-KA-${Math.floor(100 + Math.random() * 900)}`,
      citizenName: "Citizen Applicant",
      ulpin: newGrievanceUlpin,
      category: newGrievanceCategory,
      slaDaysRemaining: 30,
      status: "INVESTIGATING",
    };
    setGrievances((prev) => [entry, ...prev]);
    setGrievanceSubmitted(true);
    setTimeout(() => setGrievanceSubmitted(false), 3000);
    setNewGrievanceDetails("");
  };

  const totalHousingDisbursed = families.reduce((acc, f) => acc + f.housingGrantINR, 0);
  const totalSubsistenceDisbursed = families.reduce((acc, f) => acc + f.subsistenceAllowanceINR, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#171716]">
            {isHi ? "किसान परिवार पुनर्वास एवं सरकारी सहायता (R&R)" : "Farmer Family Rehabilitation & Support (R&R)"}
          </h1>
          <p className="text-xs text-[#68655e]">
            {isHi
              ? "भूमि कानून 2013 के तहत पक्के मकान का अनुदान (₹3.5 लाख), 12 महीने का परिवार निर्वाह भत्ता (₹30,000/माह), और शिकायतों का त्वरित समाधान।"
              : "Ensuring new housing grants (₹3.5 Lakh), 12-month family living allowance (₹30,000/month), and complaint resolution under Land Acquisition Act 2013."}
          </p>
        </div>

        <Button
          onClick={() => setFamilyModalOpen(true)}
          className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm font-bold text-xs h-9 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>{isHi ? "विस्थापित परिवार का नाम दर्ज करें" : "Register Displaced Family"}</span>
        </Button>
      </div>

      {/* R&R Entitlement Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-[#68655e] text-[10px] uppercase font-bold">
              <Users className="h-4 w-4 text-blue-600" />
              <span>{isHi ? "दर्ज प्रभावित परिवार" : "Registered Affected Families"}</span>
            </div>
            <p className="text-2xl font-black text-[#171716]">
              {families.length} {isHi ? "परिवार" : "Families"}
            </p>
            <p className="text-[11px] text-[#68655e]">{isHi ? "100% सामाजिक-आर्थिक सर्वे पूर्ण" : "100% Socio-Economic Survey Complete"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-[#68655e] text-[10px] uppercase font-bold">
              <Home className="h-4 w-4 text-emerald-600" />
              <span>{isHi ? "मकान निर्माण सरकारी अनुदान" : "Constructed Housing Grants"}</span>
            </div>
            <p className="text-2xl font-black text-emerald-700 font-mono">
              {formatINR(totalHousingDisbursed)}
            </p>
            <p className="text-[11px] text-[#68655e]">{isHi ? "₹3,50,000 प्रति विस्थापित ग्रामीण परिवार" : "₹3,50,000 per displaced rural family"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-[#68655e] text-[10px] uppercase font-bold">
              <Briefcase className="h-4 w-4 text-amber-600" />
              <span>{isHi ? "परिवार निर्वाह भत्ता (12 माह)" : "Livelihood Subsistence Fund"}</span>
            </div>
            <p className="text-2xl font-black text-amber-700 font-mono">
              {formatINR(totalSubsistenceDisbursed)}
            </p>
            <p className="text-[11px] text-[#68655e]">{isHi ? "₹30,000 / माह (12 महीने तक)" : "₹30,000 / month for 12 months"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Affected Family Register Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">
            {isHi ? "प्रभावित परिवारों की आधिकारिक सूची (दूसरी अनुसूची)" : "Affected Families Roster (Second Schedule)"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isHi
              ? "अनुसूचित जाति (SC), अनुसूचित जनजाति (ST), बीपीएल और महिला मुखिया परिवारों को प्राथमिकता।"
              : "Vulnerability categories prioritizing SC, ST, BPL, and female-headed households for resettlement."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isHi ? "परिवार का मुखिया" : "Family Head"}</TableHead>
                <TableHead>{isHi ? "श्रेणी / वर्ग" : "Vulnerability Category"}</TableHead>
                <TableHead>{isHi ? "सदस्य संख्या" : "Members"}</TableHead>
                <TableHead>{isHi ? "गांव" : "Village"}</TableHead>
                <TableHead>{isHi ? "मकान अनुदान" : "Housing Grant"}</TableHead>
                <TableHead>{isHi ? "निर्वाह भत्ता" : "Subsistence Allowance"}</TableHead>
                <TableHead>{isHi ? "कुल सरकारी सहायता" : "Total Entitlement"}</TableHead>
                <TableHead className="text-right">{isHi ? "स्थिति" : "Status"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {families.map((fam) => (
                <TableRow key={fam.id}>
                  <TableCell className="font-bold text-xs">{fam.familyHead}</TableCell>
                  <TableCell>
                    <Badge variant={fam.vulnerability === "GENERAL" ? "outline" : "civic"} className="text-[10px]">
                      {fam.vulnerability.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{fam.membersCount} Persons</TableCell>
                  <TableCell className="text-xs">{fam.village}</TableCell>
                  <TableCell className="text-xs font-mono">
                    {formatINR(fam.housingGrantINR)}
                    <span className="block text-[9px] text-emerald-600 font-bold">{fam.housingStatus}</span>
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {formatINR(fam.subsistenceAllowanceINR)}
                    <span className="block text-[9px] text-blue-600 font-bold">{fam.subsistenceStatus}</span>
                  </TableCell>
                  <TableCell className="text-xs font-mono font-bold">
                    {formatINR(fam.totalEntitlementINR)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Sanctioned</span>
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Statutory R&R Grievance Submission & Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lodged Grievances Queue */}
        <Card className="lg:col-span-7">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-amber-500" />
              <span>{isHi ? "पुनर्वास शिकायतें एवं अपील कतार" : "R&R Grievances & Appeals Queue"}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {isHi ? "कानूनी 30-दिवसीय समाधान समयसीमा के तहत निगरानी।" : "Monitored under statutory 30-day resolution SLA."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isHi ? "संदर्भ संख्या" : "Reference"}</TableHead>
                  <TableHead>{isHi ? "भू-आधार (ULPIN)" : "ULPIN"}</TableHead>
                  <TableHead>{isHi ? "शिकायत श्रेणी" : "Category"}</TableHead>
                  <TableHead>{isHi ? "समय सीमा" : "SLA Timer"}</TableHead>
                  <TableHead className="text-right">{isHi ? "स्थिति" : "Status"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grievances.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-mono text-xs font-bold text-[#ef5b2a]">
                      {g.ref}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#68655e]">{g.ulpin}</TableCell>
                    <TableCell className="text-xs font-medium">{g.category}</TableCell>
                    <TableCell className="text-xs">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        <Clock className="h-3 w-3" />
                        <span>{g.slaDaysRemaining}{isHi ? " दिन शेष" : "d remaining"}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="warning" className="text-[10px]">
                        {isHi ? "सुनवाई तय" : g.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Lodge Grievance Box */}
        <Card className="lg:col-span-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">
              {isHi ? "पुनर्वास शिकायत दर्ज करें" : "Lodge R&R Grievance"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isHi
                ? "पुनर्वास स्थल आवंटन या निर्वाह भत्ते से संबंधित औपचारिक शिकायत दर्ज करें।"
                : "File a formal grievance regarding resettlement site or allowance calculations."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {grievanceSubmitted ? (
              <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-center space-y-1 text-xs">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <p className="font-bold">{isHi ? "शिकायत सफलतापूर्वक दर्ज हुई" : "Grievance Registered"}</p>
                <p className="text-[11px]">{isHi ? "उप-विभागीय दंडाधिकारी (SDM) को नोटिस प्रेषित।" : "Notice dispatched to Sub-Divisional Magistrate."}</p>
              </div>
            ) : (
              <form onSubmit={handleLodgeGrievance} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-[#171716]">
                    {isHi ? "भू-आधार संदर्भ संख्या (ULPIN)" : "ULPIN Reference"}
                  </label>
                  <Input
                    value={newGrievanceUlpin}
                    onChange={(e) => setNewGrievanceUlpin(e.target.value)}
                    required
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#171716]">
                    {isHi ? "शिकायत का प्रकार" : "Grievance Classification"}
                  </label>
                  <select
                    value={newGrievanceCategory}
                    onChange={(e) => setNewGrievanceCategory(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
                  >
                    <option>{isHi ? "मकान स्थल आवंटन दूरी" : "Housing Site Allotment Proximity"}</option>
                    <option>{isHi ? "आजीविका प्रशिक्षण व कौशल अनुदान" : "Livelihood Training & Skill Grant"}</option>
                    <option>{isHi ? "पशु शेड अनुदान में छूट" : "Cattle Shed Allowance Omission"}</option>
                    <option>{isHi ? "विस्थापित परिवार परिवहन खर्च" : "Transportation Cost for Displaced Family"}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#171716]">
                    {isHi ? "शिकायत का विवरण" : "Grounds of Grievance"}
                  </label>
                  <textarea
                    rows={2}
                    value={newGrievanceDetails}
                    onChange={(e) => setNewGrievanceDetails(e.target.value)}
                    placeholder={isHi ? "अपनी शिकायत का पूरा विवरण यहाँ लिखें..." : "Provide details of grievance..."}
                    required
                    className="w-full rounded-md border border-input bg-transparent p-2 text-xs shadow-sm"
                  />
                </div>

                <Button type="submit" className="w-full bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm font-bold text-xs h-9">
                  {isHi ? "शिकायत दर्ज करें" : "Register Grievance"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Register Displaced Family Modal */}
      {familyModalOpen && (
        <Dialog open={familyModalOpen} onOpenChange={setFamilyModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Register Displaced Affected Family</DialogTitle>
              <DialogDescription className="text-xs">
                Record family census for Second Schedule R&R entitlement allocation.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleRegisterFamily} className="space-y-3 text-xs pt-2">
              <div className="space-y-1">
                <label className="font-semibold text-[#171716]">Head of Family Name</label>
                <Input
                  value={newHeadName}
                  onChange={(e) => setNewHeadName(e.target.value)}
                  placeholder="e.g. Suresh Gowda"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#171716]">Vulnerability Category</label>
                  <select
                    value={newVulnerability}
                    onChange={(e) => setNewVulnerability(e.target.value as any)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm"
                  >
                    <option value="SC">Scheduled Caste (SC)</option>
                    <option value="ST">Scheduled Tribe (ST)</option>
                    <option value="BPL">Below Poverty Line (BPL)</option>
                    <option value="WOMAN_HEADED">Woman-Headed Household</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#171716]">Family Members</label>
                  <Input
                    type="number"
                    value={newMembers}
                    onChange={(e) => setNewMembers(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#171716]">Original Village</label>
                <Input
                  value={newVillage}
                  onChange={(e) => setNewVillage(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setFamilyModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm font-bold text-xs h-8">
                  Register in R&R Ledger
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
