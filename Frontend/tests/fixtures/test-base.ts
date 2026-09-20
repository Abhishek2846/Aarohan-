import { test as base, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

type TestFixtures = {
  makeAxeBuilder: () => AxeBuilder;
  consoleErrors: string[];
};

export const test = base.extend<TestFixtures>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        // Exclude common known harmless dev warnings or simulated tile network errors
        const text = msg.text();
        if (
          !text.includes("favicon") &&
          !text.includes("tile.openstreetmap.org") &&
          !text.includes("arcgisonline.com")
        ) {
          errors.push(text);
        }
      }
    });

    page.on("pageerror", (err) => {
      errors.push(`Uncaught page exception: ${err.message}`);
    });

    await use(errors);
  },

  makeAxeBuilder: async ({ page }, use) => {
    const makeAxeBuilder = () =>
      new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .disableRules(["color-contrast"]); // Separate test for color contrast

    await use(makeAxeBuilder);
  },
});

export { expect };
