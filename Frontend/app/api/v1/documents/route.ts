import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || searchParams.get("category");
  const search = searchParams.get("search")?.toLowerCase() || "";

  let docs = dataStore.getDocuments();

  if (type && type !== "ALL") {
    docs = docs.filter((d) => d.category === type);
  }

  if (search) {
    docs = docs.filter(
      (d) =>
        d.title.toLowerCase().includes(search) ||
        d.documentNumber.toLowerCase().includes(search) ||
        d.sha256Hash.toLowerCase().includes(search)
    );
  }

  return NextResponse.json({
    status: "SUCCESS",
    count: docs.length,
    data: docs,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json(
        { status: "ERROR", message: "Document title is required." },
        { status: 400 }
      );
    }

    const created = dataStore.addDocument({
      documentNumber: body.documentNumber || `DOC-2026-${Date.now().toString().slice(-4)}`,
      title: body.title,
      category: (body.category || body.type || "GAZETTE") as any,
      projectId: body.projectId || "PRJ-NHAI-01",
      projectName: body.projectName || "Delhi-Mumbai Expressway",
      uploadedBy: body.uploadedBy || "Priya Sundaram, IAS",
      fileSize: body.fileSize || "2.4 MB (PDF)",
      sha256Hash: body.sha256Hash || `sha256_${Date.now()}_signed`,
    });

    return NextResponse.json(
      { status: "SUCCESS", message: "Document sealed and archived in vault", data: created },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", message: error.message || "Failed to archive document" },
      { status: 500 }
    );
  }
}
