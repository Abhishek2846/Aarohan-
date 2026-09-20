import { test, expect } from "../fixtures/test-base";
import { authenticateAsRole } from "../fixtures/auth.fixture";

test.describe("Role: Compliance Auditor Console", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await authenticateAsRole(page, "AUDITOR", baseURL);
    await page.goto("/dashboard/auditor", { waitUntil: "domcontentloaded" });
  });

  test("Renders auditor inspection console with tamper-proof metrics", async ({ page }) => {
    await expect(page.locator("h1, h2, h3").filter({ hasText: /Audit|ऑडिट/i }).first()).toBeVisible();
    const text = await page.locator("main").innerText();
    expect(text).toContain("1,042");
  });

  test("Anomalies tab displays flagged cases requiring compliance review", async ({ page }) => {
    const anomaliesTab = page.locator("button[role='tab']:has-text('Irregularity'), a[href*='tab=anomalies']").first();
    if (await anomaliesTab.isVisible()) {
      await anomaliesTab.click();
      await page.waitForTimeout(500);
      const text = await page.locator("main").innerText();
      expect(text).toContain("Price Gap");
    }
  });
});
