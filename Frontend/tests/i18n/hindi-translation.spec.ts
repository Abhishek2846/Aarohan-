import { test, expect } from "@playwright/test";

test.describe("BhoomiSetu Comprehensive Hindi Translation Verification", () => {
  test.beforeEach(async ({ context }) => {
    // Set authenticated PIA officer session with Hindi as active language
    await context.addCookies([
      { name: "bhoomi_token", value: "jwt_mock_pia_1001", domain: "localhost", path: "/" },
      { name: "bhoomi_role", value: "PIA", domain: "localhost", path: "/" },
    ]);

    await context.addInitScript(() => {
      localStorage.setItem("bhoomi_lang", "hi");
      localStorage.setItem("bhoomi_token", "jwt_mock_pia_1001");
      localStorage.setItem("bhoomi_active_role", "PIA");
    });
  });

  test("1. Landing Page translates to Hindi and toggles back cleanly to English", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForLoadState("networkidle");

    // Header and meta bar verification
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toContain("भारत सरकार");

    // Click English button
    const enButton = page.locator("button", { hasText: "EN" }).first();
    await enButton.click();
    await page.waitForTimeout(300);

    // Verify English restored
    const enBodyText = await page.locator("body").innerText();
    expect(enBodyText).toContain("GOVERNMENT OF INDIA");

    // Click Hindi button again
    const hiButton = page.locator("button", { hasText: "हिन्दी" }).first();
    await hiButton.click();
    await page.waitForTimeout(300);

    const hiBodyText = await page.locator("body").innerText();
    expect(hiBodyText).toContain("भारत सरकार");
  });

  test("2. Compensation Page translates to farmer-friendly Hindi", async ({ page }) => {
    await page.goto("http://localhost:3000/compensation");
    await page.waitForLoadState("networkidle");

    const h1 = page.locator("h1");
    await expect(h1).toContainText("भूमि मुआवजा निर्धारण एवं सीधे बैंक खाते में भुगतान");

    const dispatchBtn = page.locator("button", { hasText: "सीधे बैंक खाते में मुआवजा भेजें" });
    await expect(dispatchBtn).toBeVisible();

    const tableText = await page.locator("table").innerText();
    expect(tableText).toContain("लाभार्थी (किसान)");
    expect(tableText).toContain("भू-आधार");
    expect(tableText).toContain("तय मुआवजा राशि");
  });

  test("3. Possession Handover Page translates correctly", async ({ page }) => {
    await page.goto("http://localhost:3000/possession");
    await page.waitForLoadState("networkidle");

    const h1 = page.locator("h1");
    await expect(h1).toContainText("जमीन सुपुर्दगी एवं सरकारी कब्जा");

    const submitBtn = page.locator("button", { hasText: "धारा 38 जमीन कब्जा पंचनामा जारी करें" });
    await expect(submitBtn).toBeVisible();
  });

  test("4. Rehabilitation & Resettlement (R&R) Page translates correctly", async ({ page }) => {
    await page.goto("http://localhost:3000/rr");
    await page.waitForLoadState("networkidle");

    const h1 = page.locator("h1");
    await expect(h1).toContainText("किसान परिवार पुनर्वास एवं सरकारी सहायता (R&R)");

    const regBtn = page.locator("button", { hasText: "विस्थापित परिवार का नाम दर्ज करें" });
    await expect(regBtn).toBeVisible();

    const tableText = await page.locator("table").first().innerText();
    expect(tableText).toContain("परिवार का मुखिया");
    expect(tableText).toContain("मकान अनुदान");
  });

  test("5. Document Repository translates correctly", async ({ page }) => {
    await page.goto("http://localhost:3000/documents");
    await page.waitForLoadState("networkidle");

    const h1 = page.locator("h1");
    await expect(h1).toContainText("सरकारी गजट एवं आधिकारिक दस्तावेज संग्रह");

    const uploadBtn = page.locator("button", { hasText: "सरकारी दस्तावेज अपलोड करें" });
    await expect(uploadBtn).toBeVisible();

    const tableText = await page.locator("table").innerText();
    expect(tableText).toContain("दस्तावेज संख्या");
    expect(tableText).toContain("दस्तावेज का नाम");
  });

  test("6. Simulation Page translates correctly", async ({ page }) => {
    await page.goto("http://localhost:3000/simulation");
    await page.waitForLoadState("networkidle");

    const h1 = page.locator("h1");
    await expect(h1).toContainText("परियोजना मार्ग एवं जमीन असर अनुमान");

    const exportBtn = page.locator("button", { hasText: "कैबिनेट व्यवहार्यता नोट डाउनलोड करें" });
    await expect(exportBtn).toBeVisible();

    const tableText = await page.locator("table").innerText();
    expect(tableText).toContain("मार्ग का विकल्प");
    expect(tableText).toContain("आवश्यक जमीन");
  });

  test("7. Cases and Projects Rosters translate correctly", async ({ page }) => {
    await page.goto("http://localhost:3000/cases");
    await page.waitForLoadState("networkidle");

    const casesH1 = page.locator("h1");
    await expect(casesH1).toContainText("भूमि अधिग्रहण मामला रोस्टर");

    await page.goto("http://localhost:3000/projects");
    await page.waitForLoadState("networkidle");

    const projectsH1 = page.locator("h1");
    await expect(projectsH1).toContainText("बुनियादी ढांचा परियोजना पोर्टफोलियो");
  });

  test("8. PIA Dashboard and Sidebar navigation translate correctly", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/pia");
    await page.waitForLoadState("networkidle");

    const h1 = page.locator("h1");
    await expect(h1).toContainText("पीआईए अवसंरचना परियोजना एवं भूमि अधिग्रहण कमान केंद्र");

    // Sidebar navigation in Hindi
    const sidebar = page.locator("aside");
    await expect(sidebar).toContainText("प्रोजेक्ट कमान केंद्र");
    await expect(sidebar).toContainText("मेरी विकास परियोजनाएं");
  });

  test("9. Central Ministry National Dashboard and Analytics translate correctly", async ({ browser }) => {
    const context = await browser.newContext();
    await context.addCookies([
      { name: "bhoomi_token", value: "jwt_mock_min_1001", domain: "localhost", path: "/" },
      { name: "bhoomi_role", value: "CENTRAL_MINISTRY", domain: "localhost", path: "/" },
    ]);
    await context.addInitScript(() => {
      localStorage.setItem("bhoomi_lang", "hi");
      localStorage.setItem("bhoomi_token", "jwt_mock_min_1001");
      localStorage.setItem("bhoomi_active_role", "CENTRAL_MINISTRY");
    });
    const page = await context.newPage();

    await page.goto("http://localhost:3000/dashboard/national");
    await page.waitForLoadState("networkidle");
    const natH1 = page.locator("h1");
    await expect(natH1).toContainText("राष्ट्रीय भूमि अधिग्रहण");
    await expect(natH1).toContainText("कमान केंद्र");

    await page.goto("http://localhost:3000/analytics");
    await page.waitForLoadState("networkidle");
    const anaH1 = page.locator("h1");
    await expect(anaH1).toContainText("केंद्रीय मंत्रालय राष्ट्रीय डैशबोर्ड");
    await context.close();
  });

  test("10. District Officer Dashboard translates correctly", async ({ browser }) => {
    const context = await browser.newContext();
    await context.addCookies([
      { name: "bhoomi_token", value: "jwt_mock_dist_1001", domain: "localhost", path: "/" },
      { name: "bhoomi_role", value: "DISTRICT_OFFICER", domain: "localhost", path: "/" },
    ]);
    await context.addInitScript(() => {
      localStorage.setItem("bhoomi_lang", "hi");
      localStorage.setItem("bhoomi_token", "jwt_mock_dist_1001");
      localStorage.setItem("bhoomi_active_role", "DISTRICT_OFFICER");
    });
    const page = await context.newPage();

    await page.goto("http://localhost:3000/dashboard/district");
    await page.waitForLoadState("networkidle");
    const distH1 = page.locator("h1");
    await expect(distH1).toContainText("श्री मंजुनाथ आर., आईएएस");
    const distH2 = page.locator("h2").first();
    await expect(distH2).toContainText("जिला कलेक्टर एवं दंडाधिकारी");
    await context.close();
  });

  test("11. Auditor Console and Audit Trail translate correctly", async ({ browser }) => {
    const context = await browser.newContext();
    await context.addCookies([
      { name: "bhoomi_token", value: "jwt_mock_aud_1001", domain: "localhost", path: "/" },
      { name: "bhoomi_role", value: "AUDITOR", domain: "localhost", path: "/" },
    ]);
    await context.addInitScript(() => {
      localStorage.setItem("bhoomi_lang", "hi");
      localStorage.setItem("bhoomi_token", "jwt_mock_aud_1001");
      localStorage.setItem("bhoomi_active_role", "AUDITOR");
    });
    const page = await context.newPage();

    await page.goto("http://localhost:3000/dashboard/auditor");
    await page.waitForLoadState("networkidle");
    const audH1 = page.locator("h1");
    await expect(audH1).toContainText("ऑडिट एवं निरीक्षण कंसोल");

    await page.goto("http://localhost:3000/audit");
    await page.waitForLoadState("networkidle");
    const trailH1 = page.locator("h1");
    await expect(trailH1).toContainText("गतिविधि एवं सुरक्षा रिकॉर्ड कंसोल");
    await context.close();
  });

  test("12. Citizen Portal translates to farmer-friendly Hindi", async ({ browser }) => {
    const context = await browser.newContext();
    await context.addCookies([
      { name: "bhoomi_token", value: "jwt_mock_cit_1001", domain: "localhost", path: "/" },
      { name: "bhoomi_role", value: "CITIZEN", domain: "localhost", path: "/" },
    ]);
    await context.addInitScript(() => {
      localStorage.setItem("bhoomi_lang", "hi");
      localStorage.setItem("bhoomi_token", "jwt_mock_cit_1001");
      localStorage.setItem("bhoomi_active_role", "CITIZEN");
    });
    const page = await context.newPage();

    await page.goto("http://localhost:3000/citizen");
    await page.waitForLoadState("networkidle");
    const citH1 = page.locator("h1");
    await expect(citH1).toContainText("राम-राम / नमस्ते");
    await context.close();
  });
});
