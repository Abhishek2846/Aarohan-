import { NextResponse } from "next/server";

const MOCK_PFMS_BATCHES = [
  {
    batchId: "PFMS-2026-09-044",
    projectRef: "PRJ-NHAI-01 (STRR)",
    totalAmountINR: 142000000,
    beneficiariesCount: 18,
    dispatchedDate: "09 Sep 2026",
    status: "SETTLED_NPCI",
    ackRef: "ACK-RBI-NEFT-9912401",
  },
  {
    batchId: "PFMS-2026-09-043",
    projectRef: "PRJ-NHAI-02 (Vadodara)",
    totalAmountINR: 98000000,
    beneficiariesCount: 12,
    dispatchedDate: "06 Sep 2026",
    status: "SETTLED_NPCI",
    ackRef: "ACK-RBI-NEFT-9912388",
  },
];

export async function GET() {
  return NextResponse.json({
    status: "SUCCESS",
    statutoryAct: "RFCTLARR Act 2013 (First Schedule)",
    summary: {
      totalSanctionedOutlayINR: 48200000000,
      totalDisbursedINR: 34100000000,
      pendingDisbursementINR: 14100000000,
      totalBeneficiariesPaid: 42150,
      disbursementRatePct: 70.7,
    },
    pfmsBatches: MOCK_PFMS_BATCHES,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Mode 1: Calculate Statutory Award
    if (body.action === "CALCULATE_AWARD" || body.marketValueINR !== undefined) {
      const marketValue = Number(body.marketValueINR || 5000000);
      const multiplier = Number(body.multiplier || 1.25);
      const solatiumPct = Number(body.solatiumPct || 100);
      const interestDays = Number(body.interestDays || 180);

      const multipliedValue = marketValue * multiplier;
      const solatiumAmount = multipliedValue * (solatiumPct / 100);
      const additionalInterest = (marketValue * 0.12 * interestDays) / 365;
      const totalStatutoryAward = multipliedValue + solatiumAmount + additionalInterest;

      return NextResponse.json({
        status: "SUCCESS",
        calculation: {
          baseMarketValueINR: marketValue,
          multiplierApplied: multiplier,
          multipliedValueINR: multipliedValue,
          solatiumPercent: solatiumPct,
          solatiumAmountINR: Math.round(solatiumAmount),
          additionalInterest12PctINR: Math.round(additionalInterest),
          totalStatutoryAwardINR: Math.round(totalStatutoryAward),
        },
      });
    }

    // Mode 2: Dispatch Mock PFMS Batch
    const newBatch = {
      batchId: `PFMS-2026-${Date.now().toString().slice(-6)}`,
      projectRef: body.projectRef || "PRJ-NHAI-01",
      totalAmountINR: Number(body.amountINR || 25000000),
      beneficiariesCount: Number(body.beneficiariesCount || 5),
      dispatchedDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      status: "DISPATCHED_TO_PFMS",
      ackRef: `ACK-NPCI-${Date.now().toString().slice(-8)}`,
    };

    return NextResponse.json({
      status: "SUCCESS",
      message: "Batch dispatched to Public Financial Management System (PFMS)",
      data: newBatch,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", message: error.message || "Compensation calculation failed" },
      { status: 500 }
    );
  }
}
