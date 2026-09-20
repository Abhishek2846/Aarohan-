import { NextResponse } from "next/server";

export async function GET() {
  const analyticsData = {
    overview: {
      totalCorridors: 48,
      gatiShaktiPriorityCorridors: 12,
      avgAcquisitionCycleDays: 124,
      timelineImprovementPct: 23,
      highDelayRiskProjectsCount: 7,
      totalCompensationDisbursedINR: 48200000000,
      totalBeneficiaries: 62400,
    },
    stateBenchmarks: [
      { state: "Gujarat", activeCases: 42, totalLandHa: 3420, avgDaysToAward: 114, slaCompliance: "94%" },
      { state: "Karnataka", activeCases: 38, totalLandHa: 2890, avgDaysToAward: 128, slaCompliance: "88%" },
      { state: "Maharashtra", activeCases: 56, totalLandHa: 4610, avgDaysToAward: 142, slaCompliance: "79%" },
      { state: "Haryana", activeCases: 29, totalLandHa: 2150, avgDaysToAward: 108, slaCompliance: "96%" },
    ],
    bottlenecks: [
      {
        stage: "Section 15 (Public Objections & SDM Hearings)",
        avgDelay: "+28 Days Over SLA",
        impactedProjects: 14,
        mitigation: "Deploy Additional Land Acquisition Hearing Officers",
      },
      {
        stage: "Joint Demarcation & Khasra Boundary Verification",
        avgDelay: "+19 Days Over SLA",
        impactedProjects: 9,
        mitigation: "Mandate Field Surveyor PWA with GPS Auto-Logging",
      },
      {
        stage: "PFMS Beneficiary Bank Account Validation",
        avgDelay: "+9 Days Over SLA",
        impactedProjects: 6,
        mitigation: "Enable NPCI Aadhaar-Bridge Mock Verification Adapter",
      },
    ],
  };

  return NextResponse.json({
    status: "SUCCESS",
    data: analyticsData,
  });
}
