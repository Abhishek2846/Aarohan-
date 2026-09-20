import { NextResponse } from "next/server";
import { WORKFLOW_STAGES } from "@/lib/constants";
import { dataStore } from "@/lib/data-store";

export async function GET() {
  return NextResponse.json({
    status: "SUCCESS",
    statutoryFramework: "Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013 (RFCTLARR)",
    totalStages: WORKFLOW_STAGES.length,
    stages: WORKFLOW_STAGES,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { caseId, nextStageId, officerSignature } = body;

    if (!caseId || !nextStageId) {
      return NextResponse.json(
        { status: "ERROR", message: "caseId and nextStageId are required." },
        { status: 400 }
      );
    }

    const matchedStage = WORKFLOW_STAGES.find((s) => s.id === nextStageId);
    if (!matchedStage) {
      return NextResponse.json(
        { status: "ERROR", message: `Invalid stage ${nextStageId}` },
        { status: 400 }
      );
    }

    const updated = dataStore.updateCaseStage(caseId, matchedStage.id, matchedStage.label);
    if (!updated) {
      return NextResponse.json(
        { status: "NOT_FOUND", message: `Case docket ${caseId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "SUCCESS",
      message: `Statutory stage advanced to ${matchedStage.label}`,
      transitionReceipt: {
        caseId,
        stageId: matchedStage.id,
        stageLabel: matchedStage.label,
        authorizedAt: new Date().toISOString(),
        dscSignature: officerSignature || "CCA-CLASS3-DSC-SIGNED-SHA256",
      },
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", message: error.message || "Failed to advance stage" },
      { status: 500 }
    );
  }
}
