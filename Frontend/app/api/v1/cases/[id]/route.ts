import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const c = dataStore.getCaseById(params.id);

  if (!c) {
    return NextResponse.json(
      { status: "NOT_FOUND", message: `Case docket ${params.id} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: "SUCCESS",
    data: c,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    if (body.stageId && body.stageName) {
      const updated = dataStore.updateCaseStage(params.id, body.stageId, body.stageName);
      if (!updated) {
        return NextResponse.json(
          { status: "NOT_FOUND", message: `Case ${params.id} not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        status: "SUCCESS",
        message: `Case advanced to ${body.stageName}`,
        data: updated,
      });
    }

    const current = dataStore.getCaseById(params.id);
    if (!current) {
      return NextResponse.json(
        { status: "NOT_FOUND", message: `Case ${params.id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "SUCCESS",
      data: current,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", message: error.message || "Failed to update case docket" },
      { status: 500 }
    );
  }
}
