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
import { getLegalLandTaxRate, getLegalTaxLawReference } from "@/lib/tax-rates";
import {
  Coins,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  Building2,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Users,
} from "lucide-react";

import { useI18n } from "@/hooks/use-i18n";
import { useCompensationQuery, usePfmsDispatchMutation } from "@/hooks/queries/use-bhoomi-queries";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Beneficiary {
  id: string;
  nameMasked: string;
  ulpin: string;
  sharePct: number;
  grossAwardINR: number;
  bankMasked: string;
  ifscMasked: string;
  aadhaarStatus: "VERIFIED" | "PENDING";
  pfmsStatus: "INITIATED" | "TREASURY_ACK" | "CREDITED" | "FAILED";
}

export default function CompensationPaymentPage() {
  const { lang } = useI18n();
  const isHi = lang === "hi";
  const { data: compData, isLoading: isCompLoading } = useCompensationQuery();
  const pfmsMutation = usePfmsDispatchMutation();

  // RFCTLARR Act 2013 Statutory Calculator State
  const [baseMarketRate, setBaseMarketRate] = useState(2500); // INR per sqm
  const [acquiredAreaSqm, setAcquiredAreaSqm] = useState(8500); // 0.85 Ha
  const [multiplier, setMultiplier] = useState(1.5); // Rural multiplier (1.0 to 2.0)
  const [interestYears, setInterestYears] = useState(1.5); // 12% per annum from Section 11 to award
  const [structuresTreesINR, setStructuresTreesINR] = useState(1500000); // value of assets on land
  const [landCategory, setLandCategory] = useState<string>("AGRICULTURAL"); // AGRICULTURAL (0%), RESIDENTIAL (10%), COMMERCIAL (30%)

  // Mathematical RFCTLARR 2013 Formula Breakdown
  const marketValue = baseMarketRate * acquiredAreaSqm * multiplier;
  const solatium = marketValue; // 100% Solatium under Section 30(1)
  const additionalInterest = (marketValue * 0.12) * interestYears; // 12% per annum under Section 30(3)
  const totalStatutoryAward = marketValue + solatium + additionalInterest + structuresTreesINR; // Gross Total
  const taxRatePercent = getLegalLandTaxRate(landCategory);
  const taxDeductionINR = Math.round(totalStatutoryAward * (taxRatePercent / 100));
  const netCompensationINR = totalStatutoryAward - taxDeductionINR;

  // Beneficiaries State (initialized from DB or fallback)
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([
    {
      id: "ben_01",
      nameMasked: "Rameshwar K****",
      ulpin: "GJ-VAD-2026-0811",
      sharePct: 60,
      grossAwardINR: Math.round(totalStatutoryAward * 0.6),
      bankMasked: "SBI •••• 4892",
      ifscMasked: "SBIN0001248",
      aadhaarStatus: "VERIFIED",
      pfmsStatus: "CREDITED",
    },
    {
      id: "ben_02",
      nameMasked: "Smt. Shanti K****",
      ulpin: "GJ-VAD-2026-0811",
      sharePct: 40,
      grossAwardINR: Math.round(totalStatutoryAward * 0.4),
      bankMasked: "BOB •••• 9104",
      ifscMasked: "BARB0VADOD",
      aadhaarStatus: "VERIFIED",
      pfmsStatus: "CREDITED",
    },
  ]);

  // Synchronize with database seeded beneficiaries when loaded
  React.useEffect(() => {
    if (compData?.beneficiaries && compData.beneficiaries.length > 0) {
      setBeneficiaries(compData.beneficiaries);
    }
  }, [compData]);

  // PFMS Batch Trigger State
  const [pfmsBatchStatus, setPfmsBatchStatus] = useState<"IDLE" | "TRANSMITTING" | "DISBURSED">("IDLE");
  const [addBenModalOpen, setAddBenModalOpen] = useState(false);
  const [newBenName, setNewBenName] = useState("");
  const [newBenShare, setNewBenShare] = useState("100");
  const [newBenBank, setNewBenBank] = useState("HDFC Bank •••• 7712");

  const handleDispatchPFMS = async () => {
    setPfmsBatchStatus("TRANSMITTING");
    toast.info(
      "PFMS Batch Initiated",
      `Dispatching Direct Benefit Transfer batch of ${formatINR(totalStatutoryAward)} for ${beneficiaries.length} verified beneficiaries...`
    );
    try {
      await pfmsMutation.mutateAsync({
        projectRef: "Bengaluru STRR Expressway",
        amountINR: totalStatutoryAward,
        beneficiariesCount: beneficiaries.length,
      });
      setPfmsBatchStatus("DISBURSED");
      setBeneficiaries((prev) =>
        prev.map((b) => ({ ...b, pfmsStatus: "CREDITED" }))
      );
      toast.success(
        "PFMS DBT Batch Disbursed",
        `Statutory compensation of ${formatINR(totalStatutoryAward)} credited across ${beneficiaries.length} beneficiary bank accounts.`
      );
    } catch (err: any) {
      setPfmsBatchStatus("IDLE");
      toast.error(
        "PFMS Transmission Failed",
        err?.message || "Failed to transmit DBT disbursement to treasury gateway."
      );
    }
  };

  const handleAddBeneficiary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBenName) return;

    const newBen: Beneficiary = {
      id: `ben_${Date.now()}`,
      nameMasked: newBenName,
      ulpin: "GJ-VAD-2026-0813",
      sharePct: Number(newBenShare),
      grossAwardINR: Math.round((totalStatutoryAward * Number(newBenShare)) / 100),
      bankMasked: newBenBank,
      ifscMasked: "HDFC0001890",
      aadhaarStatus: "VERIFIED",
      pfmsStatus: "INITIATED",
    };

    setBeneficiaries((prev) => [newBen, ...prev]);
    setAddBenModalOpen(false);
    setNewBenName("");
    toast.success(
      "Beneficiary Registered",
      `${newBenName} added with ${newBenShare}% titleholder entitlement.`
    );
  };

  const totalDisbursed = beneficiaries
    .filter((b) => b.pfmsStatus === "CREDITED")
    .reduce((acc, b) => acc + b.grossAwardINR, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#171716]">
            {isHi ? "भूमि मुआवजा निर्धारण एवं सीधे बैंक खाते में भुगतान" : "Land Compensation Assessment & Direct Bank Payments"}
          </h1>
          <p className="text-xs text-[#68655e]">
            {isHi
              ? "भूमि अधिग्रहण कानून 2013 के तहत निष्पक्ष मुआवजा गणना एवं सीधे बैंक खाते में भुगतान।"
              : "Official compensation determination under Land Acquisition Act 2013 and direct transfer to bank accounts."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleDispatchPFMS}
            disabled={pfmsBatchStatus === "TRANSMITTING"}
            className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm text-xs h-9 flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${pfmsBatchStatus === "TRANSMITTING" ? "animate-spin" : ""}`} />
            <span>
              {pfmsBatchStatus === "TRANSMITTING"
                ? (isHi ? "बैंक खाते में पैसा भेजा जा रहा है..." : "Processing Bank Transfer...")
                : pfmsBatchStatus === "DISBURSED"
                ? (isHi ? "बैंक खाते में मुआवजा भेजा जा चुका है" : "Direct Bank Payments Sent")
                : (isHi ? "सीधे बैंक खाते में मुआवजा भेजें" : "Send Direct Bank Payments")}
            </span>
          </Button>
        </div>
      </div>

      {/* RFCTLARR 2013 Statutory Compensation Calculator */}
      <Card className="border-[#ef5b2a]/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Calculator className="h-5 w-5 text-[#ef5b2a]" />
              <span>Official Compensation & Award Calculator</span>
            </CardTitle>
            <Badge variant="civic" className="text-[10px]">
              Official Formula
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Formula: <code>(Base Land Rate × Multiplier) + 100% Legal Bonus (Solatium) + 12% Annual Interest + Assets</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#171716]">
                Base Govt Land Rate (₹/sq.m)
              </label>
              <Input
                type="number"
                value={baseMarketRate}
                onChange={(e) => setBaseMarketRate(Number(e.target.value))}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#171716]">
                Acquired Land Area (sq.m)
              </label>
              <Input
                type="number"
                value={acquiredAreaSqm}
                onChange={(e) => setAcquiredAreaSqm(Number(e.target.value))}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#171716]">
                Rural Area Multiplier
              </label>
              <select
                value={multiplier}
                onChange={(e) => setMultiplier(Number(e.target.value))}
                className="w-full h-9 rounded-md border border-[#d8d3c9] bg-[#fffdf8] text-[#171716] px-3 py-1 text-xs shadow-sm font-mono"
              >
                <option value={1.0}>1.00 (Urban Area)</option>
                <option value={1.25}>1.25 (Semi-Urban)</option>
                <option value={1.5}>1.50 (Rural &gt;10km)</option>
                <option value={2.0}>2.00 (Remote Rural &gt;30km)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#171716]">
                Land Classification & Tax
              </label>
              <select
                value={landCategory}
                onChange={(e) => setLandCategory(e.target.value)}
                className="w-full h-9 rounded-md border border-[#d8d3c9] bg-[#fffdf8] text-[#171716] px-3 py-1 text-xs shadow-sm font-mono font-semibold"
              >
                <option value="AGRICULTURAL">Agricultural (0% Tax - Sec 10(37))</option>
                <option value="RESIDENTIAL">Residential (10% Tax - Sec 194LA)</option>
                <option value="COMMERCIAL">Commercial / Industrial (30% Tax)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#171716]">
                Annual Interest (Years @ 12%)
              </label>
              <Input
                type="number"
                step="0.1"
                value={interestYears}
                onChange={(e) => setInterestYears(Number(e.target.value))}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#171716]">
                Assets / Trees / Buildings (₹)
              </label>
              <Input
                type="number"
                value={structuresTreesINR}
                onChange={(e) => setStructuresTreesINR(Number(e.target.value))}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          {/* Computed Statutory Award Display */}
          <div className="p-4 rounded-xl bg-[#f4f1ea] border border-[#d8d3c9] space-y-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[#68655e] text-[10px] uppercase font-bold">1. Market Value</p>
                <p className="font-bold font-mono text-sm text-[#171716]">
                  {formatINR(marketValue)}
                </p>
                <p className="text-[10px] text-[#68655e]">Rate × Area × Multiplier</p>
              </div>

              <div>
                <p className="text-[#68655e] text-[10px] uppercase font-bold">2. 100% Legal Bonus (Solatium)</p>
                <p className="font-bold font-mono text-sm text-[#171716]">
                  {formatINR(solatium)}
                </p>
                <p className="text-[10px] text-[#68655e]">Mandatory under Land Acquisition Act</p>
              </div>

              <div>
                <p className="text-[#68655e] text-[10px] uppercase font-bold">3. 12% Annual Interest</p>
                <p className="font-bold font-mono text-sm text-[#171716]">
                  {formatINR(additionalInterest)}
                </p>
                <p className="text-[10px] text-[#68655e]">From Preliminary Notice Date</p>
              </div>

              <div>
                <p className="text-[#68655e] text-[10px] uppercase font-bold">4. Assets & Structures</p>
                <p className="font-bold font-mono text-sm text-[#171716]">
                  {formatINR(structuresTreesINR)}
                </p>
                <p className="text-[10px] text-[#68655e]">Valuation of On-Land Assets</p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#d8d3c9] grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/30">
                <p className="text-amber-900 text-[10px] uppercase font-bold">Gross Total Compensation</p>
                <p className="font-bold font-mono text-sm text-amber-950">{formatINR(totalStatutoryAward)}</p>
                <p className="text-[10px] text-amber-800">Sum of All Compensation Items</p>
              </div>

              <div className="bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/30">
                <p className="text-rose-900 text-[10px] uppercase font-bold">Tax Deduction ({taxRatePercent}%)</p>
                <p className="font-bold font-mono text-sm text-rose-950">-{formatINR(taxDeductionINR)}</p>
                <p className="text-[10px] text-rose-800">{getLegalTaxLawReference(landCategory)}</p>
              </div>

              <div className="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/30">
                <p className="text-emerald-900 text-[10px] uppercase font-bold">Net Amount (After Tax)</p>
                <p className="font-black font-mono text-base text-emerald-950">{formatINR(netCompensationINR)}</p>
                <p className="text-[10px] text-emerald-800">Final Net Payable to Land Owner</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Beneficiary Management & Mock PFMS Section */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Beneficiary List & Direct Bank Payment Record</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Direct transfer to Aadhaar-linked bank accounts through government payment system.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAddBenModalOpen(true)}
            className="text-xs flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Beneficiary</span>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isHi ? "लाभार्थी (किसान)" : "Beneficiary"}</TableHead>
                <TableHead>{isHi ? "भू-आधार (ULPIN)" : "Land ID (ULPIN)"}</TableHead>
                <TableHead>{isHi ? "स्वामित्व हिस्सा" : "Share"}</TableHead>
                <TableHead>{isHi ? "कुल मुआवजा (Gross)" : "Gross Total"}</TableHead>
                <TableHead>{isHi ? `कर कटौती (${taxRatePercent}%)` : `Tax (${taxRatePercent}%)`}</TableHead>
                <TableHead>{isHi ? "शुद्ध भुगतान (Net)" : "Net Payable"}</TableHead>
                <TableHead>{isHi ? "आधार लिंक" : "Aadhaar"}</TableHead>
                <TableHead>{isHi ? "बैंक खाता" : "Bank Account"}</TableHead>
                <TableHead>{isHi ? "भुगतान स्थिति" : "Payment Status"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isCompLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : (
                beneficiaries.map((b) => {
                  const benGross = b.grossAwardINR;
                  const benTax = Math.round(benGross * (taxRatePercent / 100));
                  const benNet = benGross - benTax;
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-bold text-xs">{b.nameMasked}</TableCell>
                    <TableCell className="font-mono text-xs text-[#ef5b2a] font-semibold">
                      {b.ulpin}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{b.sharePct}%</TableCell>
                    <TableCell className="text-xs font-mono font-medium text-amber-900">
                      {formatINR(benGross)}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium text-rose-700">
                      -{formatINR(benTax)}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-emerald-800">
                      {formatINR(benNet)}
                    </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
                      <ShieldCheck className="h-3 w-3" />
                      <span>{b.aadhaarStatus === "VERIFIED" ? (isHi ? "सत्यापित" : "VERIFIED") : (isHi ? "लंबित" : "PENDING")}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-[#68655e]">
                    {b.bankMasked} ({b.ifscMasked})
                  </TableCell>
                  <TableCell>
                    {b.pfmsStatus === "CREDITED" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{isHi ? "बैंक खाते में जमा" : "Credited to Bank"}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        <span>{isHi ? "प्रक्रिया में" : "Processing"}</span>
                      </span>
                    )}
                  </TableCell>
                </TableRow>
                );
              })
            )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Beneficiary Modal */}
      {addBenModalOpen && (
        <Dialog open={addBenModalOpen} onOpenChange={setAddBenModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Add Entitled Beneficiary</DialogTitle>
              <DialogDescription className="text-xs">
                Enter landholder entitlement share and verified bank particulars.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddBeneficiary} className="space-y-4 text-xs pt-2">
              <div className="space-y-1">
                <label className="font-semibold text-[#171716]">
                  Beneficiary Legal Name
                </label>
                <Input
                  value={newBenName}
                  onChange={(e) => setNewBenName(e.target.value)}
                  placeholder="e.g. Anand Kumar Verma"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#171716]">
                  Land Ownership Share Percentage (%)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={newBenShare}
                  onChange={(e) => setNewBenShare(e.target.value)}
                  required
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#171716]">
                  Bank Account Reference
                </label>
                <Input
                  value={newBenBank}
                  onChange={(e) => setNewBenBank(e.target.value)}
                  required
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setAddBenModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#171716] hover:bg-[#2d2d2c] text-[#fffdf8] font-bold shadow-sm font-bold text-xs h-8">
                  Register Beneficiary
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
