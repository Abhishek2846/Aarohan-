import { NextResponse } from "next/server";
import { USER_ROLES } from "@/lib/constants";

export async function GET() {
  return NextResponse.json({
    status: "SUCCESS",
    availableRoles: USER_ROLES,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const roleId = body.role || "PIA";
    const matchedRole = USER_ROLES.find((r) => r.id === roleId) || USER_ROLES[0];

    const token = `jwt_aarohan_${roleId.toLowerCase()}_${Date.now()}`;

    return NextResponse.json({
      status: "SUCCESS",
      token,
      user: {
        id: `USR-${roleId}-01`,
        name: roleId === "CITIZEN" ? "Ramesh Kumar" : "Abhishek Patil",
        email: `${roleId.toLowerCase()}@aarohan.gov.in`,
        role: roleId,
        designation: matchedRole.label,
        department: "Land Acquisition Directorate",
        jurisdiction: {
          stateCode: "KA",
          stateName: "Karnataka",
          districtCode: "BLR-R",
          districtName: "Bengaluru Rural",
        },
      },
      expiresIn: "8h",
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", message: error.message || "Authentication failed" },
      { status: 400 }
    );
  }
}
