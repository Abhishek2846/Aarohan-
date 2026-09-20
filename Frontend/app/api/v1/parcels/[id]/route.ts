import { NextResponse } from "next/server";
import { SAMPLE_PARCELS } from "@/lib/gis-data";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const parcel = SAMPLE_PARCELS.find((p) => p.ulpin === params.id || p.id === params.id);

  if (!parcel) {
    return NextResponse.json(
      { status: "NOT_FOUND", message: `Parcel ${params.id} not found` },
      { status: 404 }
    );
  }

  // Generate complete 360 Digital Twin payload
  const digitalTwin = {
    ...parcel,
    geometry: {
      coordinates: parcel.coordinates,
      closureError: "0.002%",
      crs: "EPSG:4326 (WGS84)",
      boundaryPillarsCount: parcel.coordinates.length,
      unitConversions: {
        hectares: parcel.areaHa,
        acres: Number((parcel.areaHa * 2.471).toFixed(2)),
        gunthas: Math.round(parcel.areaHa * 98.84),
        bigha: Number((parcel.areaHa * 4.0).toFixed(2)),
      },
    },
    tenure: {
      pattadarName: parcel.ownerMasked,
      passbookRef: `KHT-${parcel.khasra.replace("/", "")}-2026`,
      npciAadhaarRef: "AADH-XXXX-XXXX-4819",
      aadhaarStatus: "VERIFIED_NPCI",
      ownershipSharePct: 100,
      encumbranceSearch30Yr: "NIL_ENCUMBRANCE_CERTIFIED",
      eCourtsLitigationSearch: parcel.status === "DISPUTED" ? "WP-812/2026 PENDING" : "CLEARED_NO_STAY",
    },
    assets: {
      fruitTimberTreesCount: 14,
      borewellsActiveCount: 1,
      structuresCount: 1,
      photoEvidenceRef: "SHA256:91b8a...c029",
      gpsStamped: true,
    },
    awardBreakdown: {
      baseMarketValueINR: Math.round(parcel.estimatedAwardINR * 0.42),
      multiplier: 1.25,
      solatium100PctINR: Math.round(parcel.estimatedAwardINR * 0.42),
      additionalInterestINR: Math.round(parcel.estimatedAwardINR * 0.16),
      totalAwardINR: parcel.estimatedAwardINR,
      pfmsBatchRef: "PFMS-2026-09-044",
      paymentStatus: parcel.status === "ACQUIRED" ? "CREDITED" : "ENACTED",
    },
  };

  return NextResponse.json({
    status: "SUCCESS",
    data: digitalTwin,
  });
}
