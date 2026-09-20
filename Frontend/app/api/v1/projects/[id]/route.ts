import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const project = dataStore.getProjectById(params.id);

  if (!project) {
    return NextResponse.json(
      { status: "NOT_FOUND", message: `Project ${params.id} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: "SUCCESS",
    data: project,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = dataStore.updateProject(params.id, body);

    if (!updated) {
      return NextResponse.json(
        { status: "NOT_FOUND", message: `Project ${params.id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "SUCCESS",
      message: "Project updated successfully",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", message: error.message || "Failed to update project" },
      { status: 500 }
    );
  }
}
