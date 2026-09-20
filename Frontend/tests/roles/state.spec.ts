import { test, expect } from "../fixtures/test-base";
import { authenticateAsRole } from "../fixtures/auth.fixture";

test.describe("Role: State Revenue Authority Dashboard", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await authenticateAsRole(page, "STATE_AUTHORITY", baseURL);
    await page.goto("/dashboard/state", { waitUntil: "domcontentloaded" });
  });

  test("Renders state command console and district performance matrix", async ({ page }) => {
    await expect(page.locator("h1, h2, h3").filter({ hasText: /State|राज्य/i }).first()).toBeVisible();

    const text = await page.locator("main").innerText();
    expect(text).toContain("Bengaluru Rural");
  });

  test("Approvals pending tab displays cases awaiting state sanction", async ({ page }) => {
    const approvalsTab = page.locator("a[href*='tab=approvals'], button:has-text('Approval')").first();
    if (await approvalsTab.isVisible()) {
      await approvalsTab.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain("tab=approvals");
    }

    // Check for approve action buttons
    const approveBtn = page.locator("button:has-text('Approve'), button:has-text('अनुमोदित')").first();
    await expect(approveBtn).toBeVisible();
  });
});
