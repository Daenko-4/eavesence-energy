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

  await expect(page.getByText("€25.48", { exact: true }).first()).toBeVisible();

  const numericInputs = page.locator('#rechner input[type="number"]');
  await numericInputs.nth(0).fill("600");
  await expect(page.getByText("€12.74", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Save calculation" }).click();
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
      .toBeLessThanOrEqual(2);

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

  await page.mouse.move(10, 180);
  await page.waitForTimeout(380);
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
