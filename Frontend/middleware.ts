import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRoleLandingRoute } from "@/lib/auth";
import type { UserRole } from "@/types/user";

const PUBLIC_PATHS = ["/login", "/citizen", "/unauthorized", "/auth", "/verify", "/gazette", "/gis"];

// Statutory role-to-route permissions — enforced at the Edge before any page renders.
// CITIZEN: allowed on /gis, /gazette, /documents, /citizen, /verify only.
// All officer dashboards, /cases, /compensation, /possession, /rr, /audit, /analytics,
// /gati-shakti, /simulation, /survey, /settings, /projects/new block CITIZEN.
const ROLE_ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // ── Exclusive home dashboards ──────────────────────────────────────────────
  "/dashboard/national":  ["CENTRAL_MINISTRY"],
  "/dashboard/state":     ["STATE_AUTHORITY"],
  "/dashboard/district":  ["DISTRICT_OFFICER"],
  "/dashboard/pia":       ["PIA"],
  "/dashboard/auditor":   ["AUDITOR"],
  "/field":               ["FIELD_OFFICER"],

  // ── Officer-only modules (CITIZEN explicitly excluded) ─────────────────────
  "/audit":       ["AUDITOR"],
  "/analytics":   ["CENTRAL_MINISTRY"],
  "/simulation":  ["CENTRAL_MINISTRY", "STATE_AUTHORITY", "DISTRICT_OFFICER", "PIA"],
  "/cases":       ["PIA", "CENTRAL_MINISTRY", "STATE_AUTHORITY", "DISTRICT_OFFICER", "FIELD_OFFICER", "AUDITOR"],
  "/compensation":["PIA", "CENTRAL_MINISTRY", "STATE_AUTHORITY", "DISTRICT_OFFICER", "AUDITOR"],
  "/possession":  ["PIA", "CENTRAL_MINISTRY", "STATE_AUTHORITY", "DISTRICT_OFFICER", "FIELD_OFFICER"],
  "/rr":          ["PIA", "STATE_AUTHORITY", "DISTRICT_OFFICER"],
  "/survey":      ["FIELD_OFFICER", "DISTRICT_OFFICER"],
  "/settings":    ["CENTRAL_MINISTRY", "STATE_AUTHORITY"],
  "/projects/new":["PIA"],
  "/projects":    ["PIA", "CENTRAL_MINISTRY", "STATE_AUTHORITY", "DISTRICT_OFFICER", "AUDITOR"],
  "/gati-shakti": ["CENTRAL_MINISTRY", "STATE_AUTHORITY", "DISTRICT_OFFICER", "PIA", "AUDITOR"],

  // ── Shared access (CITIZEN included) ──────────────────────────────────────
  // /gis, /gazette, /documents are NOT listed here — they are allowed for all
  // authenticated users including CITIZEN. In-page RoleGate handles write actions.
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass through system, static, and root landing paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/v1") ||
    pathname.includes(".") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Check if public path
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  if (isPublic) {
    return NextResponse.next();
  }

  // Check auth token and role in cookie
  const token = request.cookies.get("aarohan_token")?.value;
  const role = request.cookies.get("aarohan_role")?.value as UserRole | undefined;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated user visits /dashboard, route directly to their specific dashboard
  if (pathname === "/dashboard") {
    const targetDashboard = role ? getRoleLandingRoute(role) : "/dashboard/national";
    return NextResponse.redirect(new URL(targetDashboard, request.url));
  }

  // Enforce role-based access control (RBAC) to prevent cross-role unauthorized access
  for (const [routePrefix, allowedRoles] of Object.entries(ROLE_ROUTE_PERMISSIONS)) {
    if (pathname === routePrefix || pathname.startsWith(`${routePrefix}/`)) {
      if (!role || !allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|v1|_next/static|_next/image|favicon.ico).*)"],
};
