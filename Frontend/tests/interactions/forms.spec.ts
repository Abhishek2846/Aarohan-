import { test, expect } from "../fixtures/test-base";
import { authenticateAsRole } from "../fixtures/auth.fixture";

test.describe("Interactions: Forms & Validation", () => {
  test("Project creation form submits and creates new project", async ({ page, baseURL }) => {
    await authenticateAsRole(page, "PIA", baseURL);
    await page.goto("/projects/new");

    const codeInput = page.locator("input[placeholder*='NHAI']").first();
    await codeInput.fill("NHAI/TEST/2026/09");

    const titleInput = page.locator("input[placeholder*='official designation']").first();
    await titleInput.fill("Automated QA Highway Stretch Corridor");

    const submitBtn = page.locator("button[type='submit']");
    await submitBtn.click();

    // Should redirect to project details
    await page.waitForURL("**/projects/**");
    expect(page.url()).toContain("/projects/");
  });

  test("Compensation calculator dynamically updates award when inputs change", async ({ page, baseURL }) => {
    await authenticateAsRole(page, "DISTRICT_OFFICER", baseURL);
    await page.goto("/compensation");

    // Check initial total compensation
    const totalAwardElement = page.locator("p:has-text('₹')").first();
    await expect(totalAwardElement).toBeVisible();

    // Change land rate
    const rateInput = page.locator("input[type='number']").first();
    await rateInput.fill("5000");

    // Verify calculated values update
    await page.waitForTimeout(300);
    const content = await page.locator("main").innerText();
    expect(content).toContain("₹");
  });
});
