import { test, expect } from "../fixtures/test-base";
import { authenticateAsRole } from "../fixtures/auth.fixture";

test.describe("Role: District Magistrate & SLAO Dashboard", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await authenticateAsRole(page, "DISTRICT_OFFICER", baseURL);
    await page.goto("/dashboard/district", { waitUntil: "domcontentloaded" });
  });

  test("Renders district command console with jurisdiction details", async ({ page }) => {
    await expect(page.locator("h1, h2, h3").filter({ hasText: /District|जिला/i }).first()).toBeVisible();
    const text = await page.locator("main").innerText();
    expect(text).toContain("Bengaluru Rural");
  });

  test("Surveys to approve tab displays joint measurement submissions", async ({ page }) => {
    const surveysTab = page.locator("a[href*='tab=surveys'], button:has-text('Survey')").first();
    if (await surveysTab.isVisible()) {
      await surveysTab.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain("tab=surveys");
    }

    const approveBtn = page.locator("button:has-text('Approve'), button:has-text('अनुमोदन')").first();
    await expect(approveBtn).toBeVisible();
  });

  test("Awards to sign tab displays awards awaiting DSC signature", async ({ page }) => {
    const awardsTab = page.locator("a[href*='tab=awards'], button:has-text('Award')").first();
    if (await awardsTab.isVisible()) {
      await awardsTab.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain("tab=awards");
    }

    const signBtn = page.locator("button:has-text('Sign'), button:has-text('हस्ताक्षर')").first();
    await expect(signBtn).toBeVisible();
  });
});
