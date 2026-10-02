import { test, expect } from "../fixtures/test-base";

test.describe("PWA and Offline Capabilities", () => {
  test("App manifest exists and specifies required PWA fields", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.status()).toBe(200);

    const manifest = await response?.json();
    expect(manifest.name).toBe("Aarohan Field Surveyor PWA");
    expect(manifest.start_url).toBe("/field");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons.length).toBeGreaterThanOrEqual(1);
  });

  test("Service worker script exists and is reachable", async ({ page }) => {
    const response = await page.goto("/sw.js");
    expect(response?.status()).toBe(200);
    const content = await response?.text();
    expect(content).toContain("aarohan-field");
  });
});
