import { UserRole } from "@/types/user";

export interface SessionData {
  token: string;
  role: UserRole;
  userId: string;
  expiresAt: number;
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;

  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const key = parts[0]?.trim();
    const value = parts.slice(1).join("=").trim();
    if (key) {
      list[key] = decodeURIComponent(value);
    }
  });

  return list;
}

export function getRoleLandingRoute(role: UserRole): string {
  switch (role) {
    case "PIA":
      return "/dashboard/pia";
    case "CENTRAL_MINISTRY":
      return "/dashboard/national";
    case "STATE_AUTHORITY":
      return "/dashboard/state";
    case "DISTRICT_OFFICER":
      return "/dashboard/district";
    case "FIELD_OFFICER":
      return "/field";
    case "AUDITOR":
      return "/dashboard/auditor";
    case "CITIZEN":
      return "/citizen";
    default:
      return "/";
  }
}
