import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase() || "";
  const stageId = searchParams.get("stageId");
  const projectId = searchParams.get("projectId");

  let cases = dataStore.getCases();

  if (search) {
    cases = cases.filter(
      (c) =>
        c.caseNumber.toLowerCase().includes(search) ||
        c.projectName.toLowerCase().includes(search) ||
        c.district.toLowerCase().includes(search)
    );
  }

  if (stageId && stageId !== "ALL") {
    cases = cases.filter((c) => c.currentStageId === stageId);
  }

  if (projectId) {
    cases = cases.filter((c) => c.projectId === projectId);
  }

  return NextResponse.json({
    status: "SUCCESS",
    count: cases.length,
    data: cases,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.projectId || !body.caseNumber) {
      return NextResponse.json(
        { status: "ERROR", message: "projectId and caseNumber are mandatory." },
        { status: 400 }
      );
    }

    const created = dataStore.addCase({
      caseNumber: body.caseNumber,
      projectId: body.projectId,
      projectName: body.projectName || "Corridor Acquisition Docket",
      state: body.state || "Karnataka",
      district: body.district || "Bengaluru Rural",
      currentStageId: body.currentStageId || "SEC_11_NOTIFICATION",
      currentStageName: body.currentStageName || "Section 11 Preliminary Notification",
      parcelsCount: Number(body.parcelsCount || 12),
      totalAcquisitionAreaHa: Number(body.totalAcquisitionAreaHa || 8.4),
      totalBeneficiariesCount: Number(body.affectedFamiliesCount || body.totalBeneficiariesCount || 14),
      estimatedCompensationINR: Number(body.estimatedCompensationINR || 42000000),
      disbursedCompensationINR: 0,
      daysRemainingInSla: 45,
      delayRisk: {
        level: "MEDIUM",
        score: 55,
        reasons: ["Initial Section 11 gazette notification published"],
        recommendedActions: ["Commence Joint Demarcation & Survey"],
        calculatedAt: new Date().toISOString(),
      },
      dataQuality: {
        score: 90,
        passedChecks: 16,
        totalChecks: 18,
        missingItems: ["Panchayat hearing transcripts awaited"],
      },
      assignedOfficer: {
        id: "usr_cala_01",
        name: body.assignedOfficerName || "Priya Sundaram, IAS",
        designation: body.assignedOfficerDesignation || "Competent Authority for Land Acquisition (CALA)",
      },
    });

    return NextResponse.json(
      { status: "SUCCESS", message: "Case created successfully", data: created },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", message: error.message || "Failed to create case" },
      { status: 500 }
    );
  }
}
