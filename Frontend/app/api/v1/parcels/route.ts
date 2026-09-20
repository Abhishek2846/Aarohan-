import { NextResponse } from "next/server";
import { SAMPLE_PARCELS } from "@/lib/gis-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase() || "";
  const status = searchParams.get("status");

  let parcels = SAMPLE_PARCELS;

  if (search) {
    parcels = parcels.filter(
      (p) =>
        p.ulpin.toLowerCase().includes(search) ||
        p.khasra.toLowerCase().includes(search) ||
        p.village.toLowerCase().includes(search) ||
        p.ownerMasked.toLowerCase().includes(search)
    );
  }

  if (status && status !== "ALL") {
    parcels = parcels.filter((p) => p.status === status);
  }

  return NextResponse.json({
    status: "SUCCESS",
    count: parcels.length,
    data: parcels,
  });
}
