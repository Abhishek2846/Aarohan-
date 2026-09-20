import { NextResponse } from "next/server";

const MOCK_AFFECTED_FAMILIES = [
  {
    familyId: "FAM-KA-001",
    headOfFamily: "Narayan Gowda",
    membersCount: 5,
    village: "Doddaballapur",
    category: "Small Farmer (SC/ST)",
    homesteadAllotted: true,
    resettlementAllowanceINR: 500000,
    subsistenceGrantINR: 36000,
    status: "R&R Package Disbursed",
  },
  {
    familyId: "FAM-KA-002",
    headOfFamily: "Anusuya Bai",
    membersCount: 3,
    village: "Doddaballapur",
    category: "Marginal Landholder",
    homesteadAllotted: true,
    resettlementAllowanceINR: 500000,
    subsistenceGrantINR: 36000,
    status: "Verification In Progress",
  },
];

const MOCK_GRIEVANCES = [
  {
    ticketId: "GRV-2026-081",
    complainantName: "Venkatesh Murthy",
    surveyNo: "142/1",
    category: "Valuation Discrepancy (Solatium)",
    status: "UNDER_SDM_HEARING",
    lodgedDate: "04 Sep 2026",
    hearingDate: "14 Sep 2026",
  },
];

export async function GET() {
  return NextResponse.json({
    status: "SUCCESS",
    statutoryAct: "RFCTLARR Act 2013 (Second & Third Schedules)",
    summary: {
      totalAffectedFamiliesRegistered: 342,
      resettledFamilies: 289,
      grievancesLogged: 24,
      grievancesResolved: 21,
    },
    affectedFamilies: MOCK_AFFECTED_FAMILIES,
    grievances: MOCK_GRIEVANCES,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.complainantName || !body.surveyNo) {
      return NextResponse.json(
        { status: "ERROR", message: "complainantName and surveyNo are required." },
        { status: 400 }
      );
    }

    const ticket = {
      ticketId: `GRV-2026-${Date.now().toString().slice(-4)}`,
      complainantName: body.complainantName,
      surveyNo: body.surveyNo,
      category: body.category || "Boundary Demarcation / Compensation Discrepancy",
      description: body.description || "",
      status: "LODGED_PENDING_HEARING",
      lodgedDate: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      hearingOfficerAssigned: "SDM Doddaballapur Sub-Division",
      slaNoticePeriodDays: 60,
    };

    return NextResponse.json({
      status: "SUCCESS",
      message: "Section 15 statutory objection recorded. Hearing notice issued.",
      data: ticket,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", message: error.message || "Grievance registration failed" },
      { status: 500 }
    );
  }
}
