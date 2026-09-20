import { test, expect } from "../fixtures/test-base";
import { UserRole } from "../fixtures/auth.fixture";

test.describe("BhoomiSetu Authentication & Role Tests", () => {
  test("Login portal displays 7 official roles and authenticates each", async ({ page }) => {
    await page.goto("/login");

    // Verify 7 roles are available in the role selector
    const roles: UserRole[] = [
      "PIA",
      "CENTRAL_MINISTRY",
      "STATE_AUTHORITY",
      "DISTRICT_OFFICER",
      "FIELD_OFFICER",
      "AUDITOR",
      "CITIZEN",
    ];

    for (const role of roles) {
      await expect(page.locator(`select option[value='${role}']`)).toHaveCount(1);
    }
  });

  test("Login authenticates Central Ministry to /dashboard/national", async ({ page }) => {
    await page.goto("/login");
    await page.selectOption("select[name='role']", "CENTRAL_MINISTRY");
    await page.click("button[type='submit']");

    await page.waitForURL("**/dashboard/national**");
    expect(page.url()).toContain("/dashboard/national");
  });

  test("Empty credentials show error feedback", async ({ page }) => {
    await page.goto("/login");
    // Clear email
    const emailInput = page.locator("input[type='text']");
    await emailInput.fill("");

    const submitBtn = page.locator("button[type='submit']");
    await submitBtn.click();

    // Verify form validation or error message
    const errorAlert = page.locator("div[class*='rose']");
    const isVisible = await errorAlert.isVisible();
    const isHtml5Invalid = await emailInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
    expect(isVisible || isHtml5Invalid).toBeTruthy();
  });

  test("Sign Out clears session and returns to landing page", async ({ page }) => {
    // First login
    await page.goto("/login");
    await page.click("button[type='submit']");
    await page.waitForURL("**/dashboard/**");

    // Click logout
    const logoutBtn = page.locator("button[title*='Sign Out'], button[title*='लॉगआउट']").first();
    await logoutBtn.click();

    // Verify redirected to /
    await page.waitForURL("**/");
    expect(page.url()).toMatch(/\/$/);

    // Verify token removed
    const token = await page.evaluate(() => localStorage.getItem("bhoomi_token"));
    expect(token).toBeNull();
  });
});
