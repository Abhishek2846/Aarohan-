import { Page, test as base } from "@playwright/test";

export type UserRole =
  | "PIA"
  | "CENTRAL_MINISTRY"
  | "STATE_AUTHORITY"
  | "DISTRICT_OFFICER"
  | "FIELD_OFFICER"
  | "AUDITOR"
  | "CITIZEN";

export const ROLE_DESTINATIONS: Record<UserRole, string> = {
  PIA: "/dashboard/pia",
  CENTRAL_MINISTRY: "/dashboard/national",
  STATE_AUTHORITY: "/dashboard/state",
  DISTRICT_OFFICER: "/dashboard/district",
  FIELD_OFFICER: "/field",
  AUDITOR: "/dashboard/auditor",
  CITIZEN: "/citizen",
};

/**
 * Sets cookies and localStorage for a specific role to establish a trusted session.
 */
export async function authenticateAsRole(page: Page, role: UserRole, baseURL?: string) {
  const targetBase = baseURL || "http://127.0.0.1:3000";
  const mockToken = `jwt_mock_${role.toLowerCase()}_${Date.now()}`;

  // Add cookies to browser context
  await page.context().addCookies([
    {
      name: "bhoomi_token",
      value: mockToken,
      domain: new URL(targetBase).hostname,
      path: "/",
    },
    {
      name: "bhoomi_role",
      value: role,
      domain: new URL(targetBase).hostname,
      path: "/",
    },
  ]);

  // Pre-seed localStorage before page scripts execute via init script
  await page.addInitScript(
    ({ r, t }) => {
      localStorage.setItem("bhoomi_token", t);
      localStorage.setItem("bhoomi_auth_token", t);
      localStorage.setItem("bhoomi_active_role", r);
    },
    { r: role, t: mockToken }
  );
}

export { base };
