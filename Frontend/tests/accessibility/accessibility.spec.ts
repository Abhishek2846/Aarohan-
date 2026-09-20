import { test, expect } from "../fixtures/test-base";
import { authenticateAsRole } from "../fixtures/auth.fixture";

test.describe("Accessibility WCAG 2.1 AA Audit", () => {
  test("Public landing page passes accessibility scan", async ({ page, makeAxeBuilder }) => {
    await page.goto("/");
    const results = await makeAxeBuilder().analyze();

    // Critical accessibility violations must be 0
    const criticalViolations = results.violations.filter((v) => v.impact === "critical");
    expect(criticalViolations).toEqual([]);
  });

  test("Officer login portal passes accessibility scan", async ({ page, makeAxeBuilder }) => {
    await page.goto("/login");
    const results = await makeAxeBuilder().analyze();

    const criticalViolations = results.violations.filter((v) => v.impact === "critical");
    expect(criticalViolations).toEqual([]);
  });

  test("Central Ministry dashboard passes accessibility scan", async ({ page, baseURL, makeAxeBuilder }) => {
    await authenticateAsRole(page, "CENTRAL_MINISTRY", baseURL);
    await page.goto("/dashboard/national");
    const results = await makeAxeBuilder().analyze();

    const criticalViolations = results.violations.filter((v) => v.impact === "critical");
    expect(criticalViolations).toEqual([]);
  });
});
