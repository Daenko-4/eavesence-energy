import { expect, test, type Page } from "@playwright/test";

const headerPreviewKey = "eavesence-header-intro-seen-v3";

async function disableHeaderIntro(page: Page) {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, "true");
  }, headerPreviewKey);
}

async function openDesktopNavigation(page: Page) {
  const logo = page.locator('a[aria-expanded]').first();
  await logo.hover();
  await expect(logo).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("navigation", { name: "Open navigation" }),
  ).toBeVisible();
}

test("calculator updates live and a saved calculation can be deleted", async ({
  page,
}) => {
  await disableHeaderIntro(page);
  await page.goto("/");

  await expect(
    page.getByText(
      "Typical values are prefilled – adjust if needed.",
      { exact: true },
    ),
  ).toBeVisible();

  const calculatorForm = page.locator("[data-calculator-form]");
  const heightBeforeHelp =
    (await calculatorForm.boundingBox())?.height ?? 0;
  const prefilledDetails = page.locator("[data-prefilled-help]");
  const helpTrigger = prefilledDetails.locator(
    'summary[aria-label="Information about typical values"]',
  );
  await expect(prefilledDetails).not.toHaveAttribute("open", "");
  await helpTrigger.click();
  await expect(prefilledDetails).toHaveAttribute("open", "");

  const helpPanel = prefilledDetails.locator(
    "[data-prefilled-help-panel]",
  );
  await expect(
    helpPanel.getByText(
      "Typical values are estimates. Actual consumption varies by model, settings and usage.",
      { exact: true },
    ),
  ).toBeVisible();

  const heightAfterHelp =
    (await calculatorForm.boundingBox())?.height ?? 0;
  expect(Math.abs(heightAfterHelp - heightBeforeHelp)).toBeLessThanOrEqual(1);

  const deviceField = page.locator("#rechner select").first();
  const [helpBox, deviceBox] = await Promise.all([
    helpPanel.boundingBox(),
    deviceField.boundingBox(),
  ]);
  if (!helpBox || !deviceBox) {
    throw new Error("Help panel or device field is not visible");
  }
  expect(Math.abs(helpBox.x - deviceBox.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(helpBox.width - deviceBox.width)).toBeLessThanOrEqual(1);
  expect(helpBox.y).toBeLessThan(deviceBox.y + deviceBox.height);

  await expect(page.getByText("€25.48", { exact: true }).first()).toBeVisible();

  const numericInputs = page.locator('#rechner input[type="number"]');
  await numericInputs.nth(0).fill("600");
  await expect(page.getByText("€12.74", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Save to My devices" }).click();
  const savedDevices = page.locator("#meine-geraete");
  await expect(
    savedDevices.getByText("Coffee machine", { exact: true }),
  ).toBeVisible();
  await expect(
    savedDevices.getByText("€12.74", { exact: true }).first(),
  ).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Delete: Coffee machine" })
    .click();
  await expect(
    page.getByRole("button", { name: "Delete: Coffee machine" }),
  ).toHaveCount(0);
});

test("annual and continuous devices show the right usage inputs", async ({
  page,
}) => {
  await disableHeaderIntro(page);
  await page.goto("/");

  const deviceSelect = page.locator("#rechner select").first();

  await deviceSelect.selectOption({ label: "Refrigerator" });
  await expect(
    page.getByText("Consumption per year", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("€70.00", { exact: true }).first()).toBeVisible();

  await deviceSelect.selectOption({ label: "Wi-Fi router" });
  await expect(page.getByText("Hours per day", { exact: true })).toBeVisible();
  await expect(page.getByText("Days per week", { exact: true })).toBeVisible();
  await expect(page.getByText("€30.58", { exact: true }).first()).toBeVisible();
});

test("FAQ navigation opens the answers and reaches one stable position", async ({
  page,
}) => {
  await disableHeaderIntro(page);
  await page.goto("/");

  let firstFaqTop: number | null = null;
  for (const startAt of [350, 1500]) {
    await page.evaluate((top) => window.scrollTo(0, top), startAt);
    await openDesktopNavigation(page);
    await page.getByRole("link", { name: "FAQ", exact: true }).click();

    await expect(page).toHaveURL(/#faq$/);
    await expect(
      page.getByRole("button", { name: /Answers about your calculator/ }),
    ).toHaveAttribute("aria-expanded", "true");

    await expect
      .poll(async () => {
        return page.locator("#faq").evaluate((element) => {
          const requestedTop =
            element.getBoundingClientRect().top + window.scrollY - 84;
          const maximumTop = Math.max(
            0,
            document.documentElement.scrollHeight - window.innerHeight,
          );
          const expectedScrollTop = Math.min(
            Math.max(0, requestedTop),
            maximumTop,
          );
          return Math.abs(window.scrollY - expectedScrollTop);
        });
      })
      .toBeLessThanOrEqual(4);

    const currentFaqTop = await page.locator("#faq").evaluate((element) =>
      element.getBoundingClientRect().top,
    );
    if (firstFaqTop === null) {
      firstFaqTop = currentFaqTop;
    } else {
      expect(Math.abs(currentFaqTop - firstFaqTop)).toBeLessThanOrEqual(2);
    }
  }
});

test("the first desktop visit previews the navigation exactly once", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    window.localStorage.removeItem(key);
  }, headerPreviewKey);
  await page.goto("/");

  const logo = page.locator('a[aria-expanded]').first();
  await expect(logo).toHaveAttribute("aria-expanded", "false");
  await expect(logo).toHaveAttribute("aria-expanded", "true", {
    timeout: 2_500,
  });
  await expect(logo).toHaveAttribute("aria-expanded", "false", {
    timeout: 5_000,
  });

  await page.reload();
  await page.waitForTimeout(1_500);
  await expect(logo).toHaveAttribute("aria-expanded", "false");
});

test("header labels keep a fixed horizontal axis while closing", async ({
  page,
}) => {
  await disableHeaderIntro(page);
  await page.goto("/");
  await openDesktopNavigation(page);

  const calculatorLink = page.locator('[data-navigation-key="calculator"]');
  const xBefore = await calculatorLink.evaluate((element) =>
    element.getBoundingClientRect().x,
  );

  // Leave the link hover state before comparing the navigation colors.
  // The menu remains open during its short close delay.
  await page.mouse.move(10, 180);
  await page.waitForTimeout(200);

  const navigationStyles = await page
    .locator("[data-navigation-key]")
    .evaluateAll((links) =>
      links.map((link) => {
        const style = getComputedStyle(link);
        return { color: style.color, fontWeight: style.fontWeight };
      }),
    );
  expect(new Set(navigationStyles.map(({ color }) => color)).size).toBe(1);
  expect(
    new Set(navigationStyles.map(({ fontWeight }) => fontWeight)).size,
  ).toBe(1);

  await page.waitForTimeout(180);
  const xWhileClosing = await calculatorLink.evaluate((element) =>
    element.getBoundingClientRect().x,
  );

  expect(Math.abs(xBefore - xWhileClosing)).toBeLessThan(0.5);

  const logo = page.locator('a[aria-expanded]').first();
  await expect(logo).toHaveAttribute("aria-expanded", "false");
  expect(
    await logo.evaluate((element) => getComputedStyle(element).overflowX),
  ).toBe("visible");
});

test("device overview and detail heroes share the content axis below", async ({
  page,
}) => {
  await disableHeaderIntro(page);

  for (const path of ["/en/devices", "/en/devices/refrigerator"]) {
    await page.goto(path);
    const positions = await page.locator("main").evaluate((main) => {
      const sections = main.querySelectorAll(":scope > section");
      const heading = sections[0]?.querySelector("h1");
      const lowerContainer = sections[1]?.querySelector(":scope > div");
      return {
        heading: heading?.getBoundingClientRect().x ?? -1,
        lower: lowerContainer?.getBoundingClientRect().x ?? -2,
      };
    });

    expect(Math.abs(positions.heading - positions.lower)).toBeLessThan(0.5);
  }
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("menu, FAQ and calculator fit without horizontal overflow", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("link", { name: "FAQ", exact: true }).click();

    await expect(page).toHaveURL(/#faq$/);
    await expect(
      page.getByRole("button", { name: /Answers about your calculator/ }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
});

const responsiveCalculatorViewports = [
  { name: "small phone portrait", width: 320, height: 568 },
  { name: "phone portrait", width: 390, height: 844 },
  { name: "phone landscape", width: 844, height: 390 },
  { name: "iPad portrait", width: 768, height: 1024 },
  { name: "iPad landscape", width: 1024, height: 768 },
] as const;

test.describe("responsive calculator layout", () => {
  for (const viewport of responsiveCalculatorViewports) {
    test(`fits ${viewport.name} without overflow or overlap`, async ({
      page,
    }) => {
      await disableHeaderIntro(page);
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/");

      const layout = await page.locator("#rechner").evaluate((calculator) => {
        const viewportWidth = document.documentElement.clientWidth;
        const candidates = Array.from(
          calculator.querySelectorAll(
            ".calculator-form input, .calculator-form select, .calculator-form button, .calculator-form [role='group'], .calculator-form .rounded-xl",
          ),
        );
        const overflowing = candidates
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return (
              rect.width > 0 &&
              rect.height > 0 &&
              (rect.left < -0.5 || rect.right > viewportWidth + 0.5)
            );
          })
          .map(
            (element) =>
              element.getAttribute("aria-label") ||
              element.textContent?.trim().slice(0, 60) ||
              element.tagName,
          );

        const form = calculator.querySelector("[data-calculator-form]");
        const result = calculator.querySelector("[data-calculator-result]");
        const formRect = form?.getBoundingClientRect();
        const resultRect = result?.getBoundingClientRect();
        const panelsOverlap = Boolean(
          formRect &&
            resultRect &&
            Math.min(formRect.right, resultRect.right) -
              Math.max(formRect.left, resultRect.left) >
              0.5 &&
            Math.min(formRect.bottom, resultRect.bottom) -
              Math.max(formRect.top, resultRect.top) >
              0.5,
        );

        return {
          documentOverflows:
            document.documentElement.scrollWidth > viewportWidth,
          overflowing,
          panelsOverlap,
        };
      });

      expect(layout.documentOverflows).toBe(false);
      expect(layout.overflowing).toEqual([]);
      expect(layout.panelsOverlap).toBe(false);
    });
  }
});
