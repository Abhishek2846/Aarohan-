import { test, expect } from "../fixtures/test-base";
import { authenticateAsRole } from "../fixtures/auth.fixture";

test.describe("Interactions: GIS Map Workstation", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await authenticateAsRole(page, "PIA", baseURL);
    await page.goto("/gis");
  });

  test("GIS map container loads and renders leaflet pane", async ({ page }) => {
    const mapContainer = page.locator(".leaflet-container");
    await expect(mapContainer).toBeVisible({ timeout: 15000 });
  });

  test("Switches tile basemap between Standard and Satellite", async ({
    page,
  }) => {
    const satBtn = page
      .locator("button:has-text('Satellite'), button:has-text('उपग्रह')")
      .first();
    await satBtn.click();
    await page.waitForTimeout(300);
    const mapBtn = page
      .locator("button:has-text('Map'), button:has-text('नक्शा')")
      .first();
    await mapBtn.click();
    await page.waitForTimeout(300);
  });
});
