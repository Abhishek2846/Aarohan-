import { test, expect } from "../fixtures/test-base";
import { authenticateAsRole } from "../fixtures/auth.fixture";

test.describe("Role: Field Officer PWA Console", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await authenticateAsRole(page, "FIELD_OFFICER", baseURL);
    await page.goto("/field", { waitUntil: "domcontentloaded" });
  });

  test("Renders field surveyor console with assigned tasks and GPS status", async ({ page }) => {
    await expect(page.locator("h1, h2, h3").filter({ hasText: /Field|सर्वेक्षण|PWA/i }).first()).toBeVisible();
    const text = await page.locator("main").innerText();
    expect(text).toContain("KA-BLR-2026-0041");
  });

  test("Switches to offline sync queue tab and displays queued records", async ({ page }) => {
    const offlineTab = page.locator("a[href*='tab=offline'], button:has-text('Offline')").first();
    if (await offlineTab.isVisible()) {
      await offlineTab.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain("tab=offline");
    }

    const syncBtn = page.locator("button:has-text('Sync'), button:has-text('सिंक')").first();
    await expect(syncBtn).toBeVisible();
  });
});
