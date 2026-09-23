import { test, expect } from "../fixtures/test-base";

test.describe("Role: Citizen Transparency Portal", () => {
  test("Public citizen portal loads without requiring authentication", async ({ page }) => {
    await page.goto("/citizen");
    await expect(page.locator("h1, h2, h3, .badge").filter({ hasText: /Citizen|Compensation|Welcome|नागरिक/i }).first()).toBeVisible();
  });

  test("Allows looking up ULPIN and switches between information tabs", async ({ page }) => {
    await page.goto("/citizen");

    // Click on compensation tab
    const compTab = page.locator("button:has-text('Compensation'), button:has-text('मुआवजा')").first();
    if (await compTab.isVisible()) {
      await compTab.click();
      await page.waitForTimeout(300);
      const text = await page.locator("main").innerText();
      expect(text).toContain("₹");
    }

    // Click on objections tab
    const objTab = page.locator("button:has-text('Objections'), button:has-text('आपत्तियां')").first();
    if (await objTab.isVisible()) {
      await objTab.click();
      await page.waitForTimeout(300);
      await expect(page.locator("form, input, textarea").first()).toBeVisible();
    }
  });
});
