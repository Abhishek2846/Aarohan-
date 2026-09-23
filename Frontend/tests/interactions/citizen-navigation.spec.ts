import { test, expect } from "../fixtures/test-base";

test.describe("Citizen Navigation & Sidebar from My Land Boundary", () => {
  test("Navigates from citizen portal to GIS and navigates out via sidebar and return button", async ({ page, isMobile }) => {
    test.skip(isMobile, "Desktop sidebar test");

    // 1. Visit Citizen Portal
    await page.goto("/citizen");
    await expect(page.locator("h1, h2, h3").filter({ hasText: /Compensation|Welcome|Direct|Land/i }).first()).toBeVisible();

    // 2. Open Full Screen GIS Map from Citizen Portal
    const openGisBtn = page.locator("main a[href='/gis']").first();
    await expect(openGisBtn).toBeVisible();
    await openGisBtn.click();
    await page.waitForURL("**/gis**");
    expect(page.url()).toContain("/gis");

    // 3. Verify on GIS page, the citizen sidebar is visible and shows citizen nav items
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();

    // 4. Click "Citizen Home" return button in header
    const returnBtn = page.locator("button:has-text('Citizen Home'), button:has-text('वापस पोर्टल')").first();
    await expect(returnBtn).toBeVisible();
    await returnBtn.click();
    await page.waitForURL("**/citizen**");
    expect(page.url()).toContain("/citizen");

    // 5. Navigate back to GIS
    await page.goto("/gis");
    await expect(page.locator("aside").first()).toBeVisible();

    // 6. Click "e-Gazette Notifications" in sidebar
    const gazetteLink = page.locator("aside a[href='/gazette']").first();
    await expect(gazetteLink).toBeVisible();
    await gazetteLink.click();
    await page.waitForURL("**/gazette**");
    expect(page.url()).toContain("/gazette");

    // 7. Navigate back to GIS
    await page.goto("/gis");
    await expect(page.locator("aside").first()).toBeVisible();

    // 8. Click "My Objections & Status" in sidebar
    const objLink = page.locator("aside a[href*='tab=objections']").first();
    await expect(objLink).toBeVisible();
    await objLink.click();
    await page.waitForURL("**/citizen?tab=objections**");
    expect(page.url()).toContain("/citizen?tab=objections");

    // 9. Navigate back to GIS
    await page.goto("/gis");
    await expect(page.locator("aside").first()).toBeVisible();

    // 10. Click "Government Notices & Orders" in sidebar
    const docLink = page.locator("aside a[href*='tab=documents']").first();
    await expect(docLink).toBeVisible();
    await docLink.click();
    await page.waitForURL("**/citizen?tab=documents**");
    expect(page.url()).toContain("/citizen?tab=documents");
  });

  test("Mobile drawer and return button navigate cleanly on mobile screens", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile specific test");

    await page.goto("/gis");
    // Return button works on mobile
    const returnBtn = page.locator("button:has-text('Citizen Home'), button:has-text('वापस पोर्टल')").first();
    await expect(returnBtn).toBeVisible();
    await returnBtn.click();
    await page.waitForURL("**/citizen**");
    expect(page.url()).toContain("/citizen");

    // Re-enter GIS
    await page.goto("/gis");
    // Open hamburger menu
    const menuBtn = page.locator("button[aria-label='Toggle navigation menu']");
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // Drawer links visible and clickable
    const drawerLink = page.locator(".civic-mobile-drawer a[href='/gazette']").first();
    await expect(drawerLink).toBeVisible();
    await drawerLink.click();
    await page.waitForURL("**/gazette**");
    expect(page.url()).toContain("/gazette");
  });
});
