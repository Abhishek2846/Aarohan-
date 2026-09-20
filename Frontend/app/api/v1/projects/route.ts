import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase() || "";
  const status = searchParams.get("status");

  let projects = dataStore.getProjects();

  if (search) {
    projects = projects.filter(
      (p) =>
        p.title.toLowerCase().includes(search) ||
        p.projectCode.toLowerCase().includes(search) ||
        p.piaName.toLowerCase().includes(search) ||
        p.state.toLowerCase().includes(search) ||
        p.districts.some((d) => d.toLowerCase().includes(search))
    );
  }

  if (status && status !== "ALL") {
    projects = projects.filter((p) => p.status === status);
  }

  return NextResponse.json({
    status: "SUCCESS",
    count: projects.length,
    data: projects,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const title = body.title || body.name;
    if (!title) {
      return NextResponse.json(
        { status: "ERROR", message: "Project title is mandatory." },
        { status: 400 }
      );
    }

    const created = dataStore.addProject({
      projectCode: body.projectCode || body.code || `PRJ-NHAI-${Date.now().toString().slice(-4)}`,
      title,
      sector: body.sector || "HIGHWAYS",
      piaName: body.piaName || body.sponsoringAgency || "National Highways Authority of India (NHAI)",
      state: (body.states && body.states[0]) || body.state || "Karnataka",
      districts: body.districts || ["Bengaluru Rural"],
      estimatedBudgetINR: Number(body.totalBudgetINR || body.estimatedBudgetINR || 4500000000),
      totalAcquisitionAreaHa: Number(body.estimatedLandHectares || body.totalAcquisitionAreaHa || 120),
      startDate: new Date().toISOString().split("T")[0],
      targetCompletionDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
      status: body.status || "PLANNING",
    });

    return NextResponse.json({
      status: "SUCCESS",
      message: "Project created successfully.",
      data: created,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", message: error.message || "Failed to create project" },
      { status: 500 }
    );
  }
}
