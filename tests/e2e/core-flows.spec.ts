import { expect, test, type Page } from "@playwright/test";

async function disableHeaderIntro(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
}

async function openDesktopNavigation(page: Page) {
  const logo = page.locator('a[aria-expanded]').first();
  await expect(logo).toHaveAttribute("aria-expanded", "true", {
    timeout: 3_000,
  });
  await expect(
    page.getByRole("navigation", { name: "Open navigation" }),
  ).toBeVisible();
}

test("app interest can be answered once without leaving the page", async ({
  page,
}) => {
  await disableHeaderIntro(page);
  await page.goto("/");

  const prompt = page.getByRole("region", { name: "EAVESENCE as an app" });
  await expect(prompt).toBeVisible();
  await prompt.getByRole("button", { name: "Yes, I would" }).click();
  await expect(
    prompt.getByRole("status"),
  ).toHaveText("Thank you – this helps us make the next decision.");

  await page.reload();
  await expect(prompt).toHaveCount(0);
});

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
  const helpTrigger = page.locator("[data-prefilled-help-trigger]");
  await expect(helpTrigger).toHaveAttribute("aria-expanded", "false");
  await expect(helpTrigger).toHaveAttribute(
    "aria-label",
    "Information about typical values",
  );
  await helpTrigger.click();
  await expect(helpTrigger).toHaveAttribute("aria-expanded", "true");

  const helpPanel = page.locator("[data-prefilled-help-panel]");
  await expect(
    helpPanel.getByText(
      "Typical values are estimates and may vary by model and usage.",
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
  expect(Math.abs(helpBox.y - deviceBox.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(helpBox.width - deviceBox.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(helpBox.height - deviceBox.height)).toBeLessThanOrEqual(1);

  await helpTrigger.click();
  await expect(helpTrigger).toHaveAttribute("aria-expanded", "false");
  await expect(helpPanel).toHaveCount(0);

  await helpTrigger.click();
  await expect(helpTrigger).toHaveAttribute("aria-expanded", "true");
  await expect(helpPanel).toBeVisible();

  await page.mouse.click(
    helpBox.x + helpBox.width / 2,
    helpBox.y + helpBox.height / 2,
  );
  await expect(helpTrigger).toHaveAttribute("aria-expanded", "false");
  await expect(helpPanel).toHaveCount(0);

  await expect(page.getByText("€25.48", { exact: true }).first()).toBeVisible();

  const numericInputs = page.locator('#rechner input[type="number"]');
  await numericInputs.nth(0).fill("600");
  await expect(page.getByText("€12.74", { exact: true }).first()).toBeVisible();

  const saveButton = page.getByRole("button", { name: "Save to My devices" });
  await expect(saveButton.locator("[data-save-action-icon]")).toBeVisible();
  await saveButton.click();
  await expect(
    page.getByRole("button", { name: "Device saved locally." }),
  ).toBeVisible();
  await expect(
    page.locator("[data-save-status-icon]"),
  ).toBeVisible();
  await expect(page.locator("[data-save-action-icon]")).toHaveCount(0);
  const savedDevices = page.locator("#meine-geraete");
  await expect(
    savedDevices.getByText("Coffee machine", { exact: true }),
  ).toBeVisible();
  await expect(
    savedDevices.getByText("€12.74", { exact: true }).first(),
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Update saved device" }),
  ).toBeVisible({ timeout: 4_000 });
  await expect(page.locator("[data-save-action-icon]")).toBeVisible();
  await page.getByRole("button", { name: "Update saved device" }).click();
  await expect(
    page.getByRole("button", { name: "Changes saved locally." }),
  ).toBeVisible();
  await expect(page.locator("[data-save-status-icon]")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Update saved device" }),
  ).toBeVisible({ timeout: 4_000 });
  await expect(
    page.getByRole("button", { name: "Delete: Coffee machine" }),
  ).toHaveCount(1);

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

test("language switching keeps an open FAQ expanded and preserves its position", async ({
  page,
}) => {
  await disableHeaderIntro(page);
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, 400));
  const regularScrollBefore = await page.evaluate(() => window.scrollY);
  await page
    .getByRole("link", { name: "Zur deutschen Version wechseln" })
    .click();
  await expect(page).toHaveURL("/de");
  await expect(
    page.getByRole("button", { name: /Antworten rund um deinen Rechner/ }),
  ).toHaveAttribute("aria-expanded", "false");
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - regularScrollBefore),
  ).toBeLessThanOrEqual(8);

  await page.goto("/#faq");

  const englishFaq = page.getByRole("button", {
    name: /Answers about your calculator/,
  });
  await expect(englishFaq).toHaveAttribute("aria-expanded", "true");

  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page
    .getByRole("link", { name: "Zur deutschen Version wechseln" })
    .click();

  await expect(page).toHaveURL("/de");
  await expect(
    page.getByRole("button", { name: /Antworten rund um deinen Rechner/ }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(scrollBefore - 8);

  await page.getByRole("link", { name: "Switch to English" }).click();
  await expect(page).toHaveURL("/");
  await expect(englishFaq).toHaveAttribute("aria-expanded", "true");
});

test("footer FAQ navigation opens the answers from the page end", async ({
  page,
}) => {
  await disableHeaderIntro(page);
  await page.goto("/");
  await page.locator("footer").scrollIntoViewIfNeeded();

  await page
    .locator("footer")
    .getByRole("link", { name: "Frequently asked questions", exact: true })
    .click();

  await expect(page).toHaveURL(/#faq$/);
  await expect(
    page.getByRole("button", { name: /Answers about your calculator/ }),
  ).toHaveAttribute("aria-expanded", "true");
});

test("legal-page footer links open and correctly position the FAQ", async ({
  page,
}) => {
  await disableHeaderIntro(page);

  for (const { path, linkName, title, homePath } of [
    {
      path: "/en/imprint",
      linkName: "Frequently asked questions",
      title: /Answers about your calculator/,
      homePath: "/",
    },
    {
      path: "/en/privacy",
      linkName: "Frequently asked questions",
      title: /Answers about your calculator/,
      homePath: "/",
    },
    {
      path: "/impressum",
      linkName: "Häufige Fragen",
      title: /Antworten rund um deinen Rechner/,
      homePath: "/de",
    },
    {
      path: "/datenschutz",
      linkName: "Häufige Fragen",
      title: /Antworten rund um deinen Rechner/,
      homePath: "/de",
    },
  ]) {
    await page.goto(path);
    await page
      .locator("footer")
      .getByRole("link", { name: linkName, exact: true })
      .click();

    await expect(page).toHaveURL(`${homePath}#faq`);
    await expect(page.getByRole("button", { name: title })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect
      .poll(() =>
        page.locator("#faq").evaluate((element) => {
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
        }),
      )
      .toBeLessThanOrEqual(4);
  }
});

test("desktop navigation opens after the logo intro and stays open", async ({
  page,
}) => {
  await page.goto("/");

  const logo = page.locator('a[aria-expanded]').first();
  await expect(logo).toHaveAttribute("aria-expanded", "false");
  await expect(logo).toHaveAttribute("aria-expanded", "true", {
    timeout: 3_000,
  });
  await page.waitForTimeout(2_500);
  await expect(logo).toHaveAttribute("aria-expanded", "true");

  await page.reload();
  await expect(logo).toHaveAttribute("aria-expanded", "true", {
    timeout: 3_000,
  });
});

test("subpages show the open header immediately without replaying the logo intro", async ({
  page,
}) => {
  for (const path of [
    "/en/devices",
    "/en/devices/refrigerator",
    "/en/privacy",
    "/en/imprint",
    "/datenschutz",
    "/impressum",
  ]) {
    await page.goto(path);

    const header = page.locator("header");
    await expect(header.locator('a[aria-expanded]').first()).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(
      header.locator(".eavesence-logo-load-animation"),
    ).toHaveCount(0);
    await expect(header.locator("nav").first()).toBeVisible();
  }
});

test("all feedback links use the eavesence address", async ({ page }) => {
  for (const { path, homeHref } of [
    { path: "/", homeHref: "/" },
    { path: "/en/privacy", homeHref: "/" },
    { path: "/en/imprint", homeHref: "/" },
    { path: "/datenschutz", homeHref: "/de" },
    { path: "/impressum", homeHref: "/de" },
  ]) {
    await page.goto(path);
    const emailLinks = page.locator('a[href^="mailto:"]');
    await expect(emailLinks.first()).toBeVisible();
    await expect(emailLinks).toHaveAttribute(
      "href",
      /^mailto:feedback@eavesence\.com(?:\?|$)/,
    );

    if (path !== "/") {
      await expect(page.locator(`main a[href="${homeHref}"]`)).toHaveCount(1);
    }
  }
});

test("header labels keep a fixed horizontal axis while staying open", async ({
  page,
}) => {
  await disableHeaderIntro(page);
  await page.goto("/");
  await openDesktopNavigation(page);

  const calculatorLink = page.locator('[data-navigation-key="calculator"]');
  const xBefore = await calculatorLink.evaluate((element) =>
    element.getBoundingClientRect().x,
  );

  await page.mouse.move(10, 180);
  await page.waitForTimeout(500);

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

  const xAfterPointerLeave = await calculatorLink.evaluate((element) =>
    element.getBoundingClientRect().x,
  );

  expect(Math.abs(xBefore - xAfterPointerLeave)).toBeLessThan(0.5);

  const logo = page.locator('a[aria-expanded]').first();
  await expect(logo).toHaveAttribute("aria-expanded", "true");
  expect(
    await logo.evaluate((element) => getComputedStyle(element).overflowX),
  ).toBe("visible");
});

test("reset keeps the current scroll position", async ({ page }) => {
  await disableHeaderIntro(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, 0));

  const before = await page.evaluate(() => window.scrollY);
  await page.getByRole("button", { name: "Reset values" }).click();
  await page.waitForTimeout(150);
  const after = await page.evaluate(() => window.scrollY);

  expect(after).toBe(before);
});

test("device search never shows a different device than the calculation", async ({
  page,
}) => {
  await disableHeaderIntro(page);
  await page.goto("/");

  const deviceSelect = page.getByLabel("Device", { exact: true });
  await page.getByRole("button", { name: "Search devices" }).click();
  await page.getByRole("searchbox", { name: "Search devices" }).fill("tele");

  await expect(deviceSelect).toHaveValue("Kaffeemaschine");
  await deviceSelect.selectOption({ label: "Television" });
  await expect(deviceSelect).toHaveValue("Fernseher");
  await expect(page.getByText(/coffee machine off/i)).toHaveCount(0);
});

test("search and measured-input states do not stay open together", async ({
  page,
}) => {
  await disableHeaderIntro(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Enter measured consumption" }).click();
  await page.getByRole("button", { name: "Search devices" }).click();
  await expect(page.getByRole("searchbox", { name: "Search devices" })).toBeVisible();
  await expect(page.getByLabel("Power", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Enter measured consumption" }).click();
  await expect(page.getByRole("searchbox", { name: "Search devices" })).toHaveCount(0);
  await expect(page.getByLabel("Actual consumption per use")).toBeVisible();
});

test("German pages expose German as the document language", async ({ page }) => {
  await disableHeaderIntro(page);

  for (const path of ["/de", "/geraete", "/datenschutz", "/impressum"]) {
    await page.goto(path);
    await expect.poll(() => page.locator("html").getAttribute("lang")).toBe("de");
  }
});

test("unknown routes show a branded localized 404 page", async ({ page }) => {
  await disableHeaderIntro(page);
  await page.goto("/de/diese-seite-gibt-es-nicht");

  await expect(page.getByRole("heading", { name: "Hier ist leider nichts." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Zur Startseite" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Geräte ansehen" })).toBeVisible();
});

test("annual reference values use the full two-column row", async ({ page }) => {
  await disableHeaderIntro(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/en/devices/refrigerator");

  const values = page.getByRole("heading", { name: /Typical values for Refrigerator/ })
    .locator("xpath=following::div[contains(@class,'grid')][1]");
  await expect(values.locator(":scope > div")).toHaveCount(2);
  expect(
    await values.evaluate((element) =>
      getComputedStyle(element).gridTemplateColumns.split(" ").length,
    ),
  ).toBe(2);
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
