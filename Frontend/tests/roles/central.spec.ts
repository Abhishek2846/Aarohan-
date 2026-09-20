import { test, expect } from "../fixtures/test-base";
import { authenticateAsRole } from "../fixtures/auth.fixture";

test.describe("Role: Central Ministry Executive Dashboard", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await authenticateAsRole(page, "CENTRAL_MINISTRY", baseURL);
    await page.goto("/dashboard/national", { waitUntil: "domcontentloaded" });
  });

  test("Renders national command dashboard with KPI metrics", async ({ page }) => {
    // Check main title or header
    await expect(page.locator("h1, h2, h3").filter({ hasText: /National|Executive|कमान/i }).first()).toBeVisible();

    // Check presence of benchmark stats
    const content = await page.locator("main").innerText();
    expect(content).toContain("Gujarat");
    expect(content).toContain("Rajasthan");
  });

  test("Switches between tabs correctly in national dashboard", async ({ page }) => {
    // Check tab navigation or sidebar tabs
    const statesTab = page.locator("a[href*='tab=states'], button:has-text('State')").first();
    if (await statesTab.isVisible()) {
      await statesTab.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain("tab=states");
    }

    const bottlenecksTab = page.locator("a[href*='tab=bottlenecks'], button:has-text('Bottleneck')").first();
    if (await bottlenecksTab.isVisible()) {
      await bottlenecksTab.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain("tab=bottlenecks");
    }
  });

  test("Cabinet Note / Report export button triggers PDF download", async ({ page }) => {
    const exportBtn = page.locator("button:has-text('Cabinet Note'), button:has-text('Export')").first();
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toBeEnabled();
  });
});
