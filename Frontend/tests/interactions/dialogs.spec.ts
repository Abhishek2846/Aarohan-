import { test, expect } from "../fixtures/test-base";
import { authenticateAsRole } from "../fixtures/auth.fixture";

test.describe("Interactions: Modals, Drawers & Dialogs", () => {
  test("Opens and closes statutory upload document dialog", async ({ page, baseURL }) => {
    await authenticateAsRole(page, "PIA", baseURL);
    await page.goto("/documents");

    const uploadBtn = page.locator("button:has-text('Upload Statutory Document')").first();
    await uploadBtn.click();

    // Dialog should be open
    const dialog = page.locator("div[role='dialog']");
    await expect(dialog).toBeVisible();

    // Close via Cancel button
    const cancelBtn = dialog.locator("button:has-text('Cancel')");
    await cancelBtn.click();
    await expect(dialog).not.toBeVisible();
  });

  test("Opens and closes city switcher dialog on GIS workstation", async ({ page, baseURL }) => {
    await authenticateAsRole(page, "PIA", baseURL);
    await page.goto("/gis");

    const changeCityBtn = page.locator("button:has-text('Change City'), button:has-text('शहर बदलें')").first();
    await changeCityBtn.click();

    const dialog = page.locator("div:has-text('Which city or region do you want to see?'), div:has-text('आप किस शहर')").first();
    await expect(dialog).toBeVisible();

    // Close via Close button
    const closeBtn = page.locator("button:has-text('Close'), button:has-text('बंद करें')").first();
    await closeBtn.click();
  });
});
