import { test, expect } from "../fixtures/test-base";
import { authenticateAsRole } from "../fixtures/auth.fixture";

test.describe("BhoomiSetu Route Smoke Tests", () => {
  const publicRoutes = [
    { path: "/", title: "BhoomiSetu" },
    { path: "/login", title: "Role-Based Officer Authentication" },
    { path: "/unauthorized", title: "Unauthorized Jurisdiction Access" },
    { path: "/citizen", title: "Citizen Transparency" },
  ];

  for (const r of publicRoutes) {
    test(`Public route ${r.path} loads successfully without blank screen`, async ({ page }) => {
      const response = await page.goto(r.path, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBeLessThan(400);

      // Verify page is not blank
      const body = await page.locator("body").innerText();
      expect(body.trim().length).toBeGreaterThan(50);
    });
  }

  const authenticatedRoutes = [
    { path: "/dashboard/national", role: "CENTRAL_MINISTRY" as const },
    { path: "/dashboard/state", role: "STATE_AUTHORITY" as const },
    { path: "/dashboard/district", role: "DISTRICT_OFFICER" as const },
    { path: "/dashboard/pia", role: "PIA" as const },
    { path: "/dashboard/auditor", role: "AUDITOR" as const },
    { path: "/field", role: "FIELD_OFFICER" as const },
    { path: "/projects", role: "PIA" as const },
    { path: "/projects/new", role: "PIA" as const },
    { path: "/cases", role: "DISTRICT_OFFICER" as const },
    { path: "/cases/new", role: "PIA" as const },
    { path: "/documents", role: "PIA" as const },
    { path: "/compensation", role: "DISTRICT_OFFICER" as const },
    { path: "/possession", role: "DISTRICT_OFFICER" as const },
    { path: "/rr", role: "STATE_AUTHORITY" as const },
    { path: "/gis", role: "PIA" as const },
    { path: "/analytics", role: "CENTRAL_MINISTRY" as const },
    { path: "/audit", role: "AUDITOR" as const },
    { path: "/simulation", role: "PIA" as const },
    { path: "/settings", role: "PIA" as const },
    { path: "/profile", role: "CENTRAL_MINISTRY" as const },
  ];

  for (const r of authenticatedRoutes) {
    test(`Authenticated route ${r.path} renders for ${r.role}`, async ({ page, baseURL }) => {
      await authenticateAsRole(page, r.role, baseURL);
      const response = await page.goto(r.path, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBeLessThan(400);

      const content = await page.locator("main").innerText();
      expect(content.trim().length).toBeGreaterThan(30);
    });
  }
});
