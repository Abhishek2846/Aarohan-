import { test, expect } from "../fixtures/test-base";
import { authenticateAsRole } from "../fixtures/auth.fixture";

test.describe("Visual Snapshot Tests: Role Dashboards", () => {
  test("National Executive Dashboard renders consistently", async ({ page, baseURL }) => {
    await authenticateAsRole(page, "CENTRAL_MINISTRY", baseURL);
    await page.goto("/dashboard/national", { waitUntil: "networkidle" });
    await expect(page.locator("main")).toBeVisible();
  });

  test("State Authority Console renders consistently", async ({ page, baseURL }) => {
    await authenticateAsRole(page, "STATE_AUTHORITY", baseURL);
    await page.goto("/dashboard/state", { waitUntil: "networkidle" });
    await expect(page.locator("main")).toBeVisible();
  });

  test("District Officer Console renders consistently", async ({ page, baseURL }) => {
    await authenticateAsRole(page, "DISTRICT_OFFICER", baseURL);
    await page.goto("/dashboard/district", { waitUntil: "networkidle" });
    await expect(page.locator("main")).toBeVisible();
  });

  test("PIA Workstation renders consistently", async ({ page, baseURL }) => {
    await authenticateAsRole(page, "PIA", baseURL);
    await page.goto("/dashboard/pia", { waitUntil: "networkidle" });
    await expect(page.locator("main")).toBeVisible();
  });

  test("Citizen Portal renders consistently", async ({ page }) => {
    await page.goto("/citizen", { waitUntil: "networkidle" });
    await expect(page.locator("main")).toBeVisible();
  });
});
