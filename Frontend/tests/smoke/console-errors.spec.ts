import { test, expect } from "../fixtures/test-base";
import { authenticateAsRole } from "../fixtures/auth.fixture";

test.describe("Aarohan Zero Console Errors Audit", () => {
  const routesToTest = [
    { path: "/", role: null },
    { path: "/login", role: null },
    { path: "/citizen", role: null },
    { path: "/dashboard/national", role: "CENTRAL_MINISTRY" as const },
    { path: "/dashboard/state", role: "STATE_AUTHORITY" as const },
    { path: "/dashboard/district", role: "DISTRICT_OFFICER" as const },
    { path: "/dashboard/pia", role: "PIA" as const },
    { path: "/dashboard/auditor", role: "AUDITOR" as const },
    { path: "/field", role: "FIELD_OFFICER" as const },
    { path: "/projects", role: "PIA" as const },
    { path: "/cases", role: "DISTRICT_OFFICER" as const },
    { path: "/documents", role: "PIA" as const },
    { path: "/compensation", role: "DISTRICT_OFFICER" as const },
    { path: "/possession", role: "DISTRICT_OFFICER" as const },
    { path: "/rr", role: "STATE_AUTHORITY" as const },
    { path: "/gis", role: "PIA" as const },
  ];

  for (const { path, role } of routesToTest) {
    test(`Zero console errors on ${path}`, async ({ page, baseURL, consoleErrors }) => {
      if (role) {
        await authenticateAsRole(page, role, baseURL);
      }
      await page.goto(path, { waitUntil: "networkidle" });
      expect(consoleErrors).toEqual([]);
    });
  }
});
