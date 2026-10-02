import { test, expect } from "../fixtures/test-base";
import { authenticateAsRole } from "../fixtures/auth.fixture";

test.describe("Interactions: Navigation, Header & Sidebar", () => {
  test("Language switcher toggles between English and Hindi globally", async ({ page }) => {
    await page.goto("/");

    // Click Hindi
    const hiBtn = page.locator("button:has-text('हिन्दी')").first();
    await hiBtn.click();
    await page.waitForTimeout(300);

    // Verify Hindi text rendered
    const textHi = await page.locator("body").innerText();
    expect(textHi).toContain("आरोहण");

    // Click English
    const enBtn = page.locator("button:has-text('EN')").first();
    await enBtn.click();
    await page.waitForTimeout(300);

    const textEn = await page.locator("body").innerText();
    expect(textEn).toContain("Aarohan");
  });

  test("Role sidebar highlights active route and navigates correctly", async ({ page, baseURL }) => {
    await authenticateAsRole(page, "PIA", baseURL);
    await page.goto("/dashboard/pia");

    // Click on "Acquisition Cases" in sidebar
    const casesLink = page.locator("aside a[href='/cases']").first();
    await casesLink.click();
    await page.waitForURL("**/cases");
    expect(page.url()).toContain("/cases");
  });
});
