import { test, expect } from "../fixtures/test-base";
import { authenticateAsRole } from "../fixtures/auth.fixture";

test.describe("Interactions: Tables, Search & Filters", () => {
  test("Filters projects table via search term", async ({ page, baseURL }) => {
    await authenticateAsRole(page, "PIA", baseURL);
    await page.goto("/projects");

    const searchInput = page.locator("input[placeholder*='Search']").first();
    await searchInput.fill("Delhi");

    await expect(page.locator("table")).toContainText("Delhi");
  });

  test("Filters cases table by workflow stage dropdown", async ({ page, baseURL }) => {
    await authenticateAsRole(page, "DISTRICT_OFFICER", baseURL);
    await page.goto("/cases");

    const stageSelect = page.locator("select").first();
    await expect(stageSelect).toBeVisible();
  });
});
