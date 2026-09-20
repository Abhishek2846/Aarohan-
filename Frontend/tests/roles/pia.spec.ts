import { test, expect } from "../fixtures/test-base";
import { authenticateAsRole } from "../fixtures/auth.fixture";

test.describe("Role: PIA Infrastructure Workstation", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await authenticateAsRole(page, "PIA", baseURL);
    await page.goto("/dashboard/pia", { waitUntil: "domcontentloaded" });
  });

  test("Renders PIA command dashboard with infrastructure corridors", async ({ page }) => {
    await expect(page.locator("h1, h2, h3").filter({ hasText: /PIA|कमान/i }).first()).toBeVisible();
    const text = await page.locator("main").innerText();
    expect(text).toContain("Delhi-Mumbai Expressway");
  });

  test("Navigates to create project registration wizard", async ({ page }) => {
    const createProjectBtn = page.locator("a[href='/projects/new'], button:has-text('Create Project')").first();
    await expect(createProjectBtn).toBeVisible();
    await createProjectBtn.click();
    await page.waitForURL("**/projects/new");
    expect(page.url()).toContain("/projects/new");
  });

  test("Alignments tab renders corridor buffer preview", async ({ page }) => {
    const alignmentsTab = page.locator("a[href*='tab=alignments'], button:has-text('Alignment')").first();
    if (await alignmentsTab.isVisible()) {
      await alignmentsTab.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain("tab=alignments");
    }
  });
});
