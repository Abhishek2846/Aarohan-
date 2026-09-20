import { test, expect } from "../fixtures/test-base";
import { authenticateAsRole } from "../fixtures/auth.fixture";

test.describe("Responsive Viewport Tests", () => {
  test("Mobile viewport (390x844) hides desktop sidebar and provides hamburger drawer", async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await authenticateAsRole(page, "PIA", baseURL);
    await page.goto("/dashboard/pia");

    // Desktop sidebar should be hidden
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeHidden();

    // Mobile menu toggle should be visible
    const hamburgerBtn = page.locator("button[aria-label*='navigation menu'], header button:has(svg.lucide-menu)").first();
    await expect(hamburgerBtn).toBeVisible();

    // Open mobile menu
    await hamburgerBtn.click();
    const mobileDrawer = page.locator(".civic-mobile-drawer");
    await expect(mobileDrawer).toBeVisible();
  });

  test("No horizontal page overflow on mobile viewports", async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // allowance for fractional pixels
  });
});
