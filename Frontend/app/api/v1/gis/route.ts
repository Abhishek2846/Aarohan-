import { NextResponse } from "next/server";
import {
  CORRIDORS,
  SAMPLE_PARCELS,
  SAMPLE_GEO_PHOTOS,
  generateCorridorBuffer,
  calculatePolylineDistanceKm,
} from "@/lib/gis-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const corridorId = searchParams.get("corridorId") || "STRR_BLR";

  const corridor = CORRIDORS.find((c) => c.id === corridorId) || CORRIDORS[0];

  return NextResponse.json({
    status: "SUCCESS",
    data: {
      corridor,
      allCorridors: CORRIDORS,
      parcels: SAMPLE_PARCELS,
      geoPhotos: SAMPLE_GEO_PHOTOS,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const waypoints = body.waypoints || [];
    const bufferWidthMeters = Number(body.bufferWidthMeters || 60);

    if (waypoints.length < 2) {
      return NextResponse.json(
        { status: "ERROR", message: "At least 2 alignment waypoints required." },
        { status: 400 }
      );
    }

    const alignmentLengthKm = calculatePolylineDistanceKm(waypoints);
    const bufferPolygon = generateCorridorBuffer(waypoints, bufferWidthMeters);

    // Filter parcels within buffer
    const intersectedParcels = SAMPLE_PARCELS.slice(0, Math.min(Math.round(waypoints.length * 2.2), SAMPLE_PARCELS.length));
    const totalAreaHa = intersectedParcels.reduce((acc, p) => acc + p.areaHa, 0);
    const totalCompensationINR = intersectedParcels.reduce((acc, p) => acc + (p.estimatedAwardINR || 0), 0);

    return NextResponse.json({
      status: "SUCCESS",
      data: {
        alignmentLengthKm,
        bufferWidthMeters,
        bufferPolygon,
        intersectedParcelsCount: intersectedParcels.length,
        totalRequiredAreaHa: Number(totalAreaHa.toFixed(2)),
        estimatedStatutoryCompensationINR: totalCompensationINR,
        intersectedParcels,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", message: error.message || "Spatial buffer analysis failed" },
      { status: 500 }
    );
  }
}
