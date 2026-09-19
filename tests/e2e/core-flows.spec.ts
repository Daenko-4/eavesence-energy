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

test("calculator engagement is tracked only on the first interaction", async ({
  page,
}) => {
  await disableHeaderIntro(page);
  await page.goto("/");

  await page.evaluate(() => {
    const analyticsWindow = window as typeof window & {
      __trackedAnalytics: Array<{
        payload?: {
          data?: Record<string, string>;
          name?: string;
        };
        type: string;
      }>;
    };

    analyticsWindow.__trackedAnalytics = [];
    Object.defineProperty(window, "va", {
      configurable: true,
      value: (
        type: string,
        payload?: {
          data?: Record<string, string>;
          name?: string;
        },
      ) => {
        analyticsWindow.__trackedAnalytics.push({ type, payload });
      },
      writable: true,
    });
  });

  const numericInputs = page.locator('#rechner input[type="number"]');
  await numericInputs.nth(0).fill("600");
  await numericInputs.nth(1).fill("12");

  const engagementEvents = await page.evaluate(() => {
    const analyticsWindow = window as typeof window & {
      __trackedAnalytics: Array<{
        payload?: {
          data?: Record<string, string>;
          name?: string;
        };
        type: string;
      }>;
    };

    return analyticsWindow.__trackedAnalytics.filter(
      ({ payload, type }) =>
        type === "event" && payload?.name === "Calculator Engaged",
    );
  });

  expect(engagementEvents).toEqual([
    {
      payload: {
        data: {
          context: "home",
          interaction: "field_change",
          locale: "en",
        },
        name: "Calculator Engaged",
      },
      type: "event",
    },
  ]);
});

test("PWA metadata, service worker and offline fallback are available", async ({
  page,
  request,
}) => {
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({
    display: "standalone",
    id: "/home",
    scope: "/",
    start_url: "/home?source=pwa",
    theme_color: "#087a45",
  });
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        sizes: "192x192",
        src: "/brand/eavesence-icon-approved-final-192.png",
      }),
      expect.objectContaining({
        sizes: "512x512",
        src: "/brand/eavesence-icon-approved-final-512.png",
      }),
    ]),
  );

  const serviceWorkerResponse = await request.get("/sw.js");
  expect(serviceWorkerResponse.ok()).toBe(true);
  expect(serviceWorkerResponse.headers()["cache-control"]).toContain("no-cache");
  expect(await serviceWorkerResponse.text()).toContain('const OFFLINE_URL = "/offline"');

  await page.goto("/offline");
  await expect(page.getByRole("heading", { name: "Keine Verbindung" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Erneut versuchen · Try again" }),
  ).toHaveAttribute("href", "/home");
});

test("EAVESENCE Home onboarding builds a household and records a monthly check-in", async ({
  page,
}) => {
  await disableHeaderIntro(page);
  await page.goto("/home");

  await expect(
    page.getByRole("heading", { name: "Set up your home" }),
  ).toBeVisible();
  await page.getByLabel("Home name").fill("Test home");
  await page.getByLabel("Electricity price per kWh").fill("0.35");
  await page.getByRole("button", { name: "Create my home" }).click();

  await expect(
    page.getByRole("heading", { name: "Test home", exact: true }),
  ).toBeVisible();
  const installCard = page.getByRole("region", {
    name: "Install EAVESENCE as an app",
  });
  await expect(installCard).toBeVisible();
  await expect(
    installCard.getByText("Open My home directly from your home screen"),
  ).toBeVisible();
  await installCard.getByRole("button", { name: "Maybe later" }).click();
  await expect(installCard).toHaveCount(0);
  const nextStep = page.getByRole("region", { name: "Next step" });
  await expect(nextStep).toContainText("September 2026 still open");
  await nextStep.getByRole("button", { name: "Add monthly value" }).click();
  await expect(page.getByLabel("Consumption in kWh")).toBeFocused();
  const reminderDownload = page.waitForEvent("download");
  await nextStep.getByRole("button", { name: "Monthly reminder" }).click();
  expect((await reminderDownload).suggestedFilename()).toBe(
    "eavesence-monthly-reminder.ics",
  );
  await expect(
    page.getByText("The monthly calendar reminder was downloaded."),
  ).toBeVisible();
  await expect(
    page.getByText("0 of 3 devices for a meaningful overview", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add room" }),
  ).toHaveCSS("font-size", "11px");

  await page.getByText("Other rooms (5)", { exact: false }).click();
  await page.getByRole("button", { name: "Rename: Kitchen" }).click();
  await page.getByLabel("Room name").fill("Cooking");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Room renamed.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cooking" })).toBeVisible();
  const roomCards = page.locator("[data-room-card]");
  await page
    .getByTitle("Reorder room: Cooking")
    .dragTo(roomCards.nth(1));
  await expect(roomCards.nth(1).getByRole("heading", { name: "Cooking" })).toBeVisible();

  await page.evaluate(() => {
    const template = {
      customDeviceName: "",
      mode: "estimate",
      currency: "EUR",
      price: 0.35,
      watts: 100,
      minutesPerUse: 60,
      usesPerWeek: 7,
      estimatedKwhPerUse: 0.1,
      measuredKwhPerUse: 0,
      yearlyKwh: 36.4,
      yearlyCost: 12.74,
      monthlyCost: 1.0617,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(
      "eavesence-saved-devices-v1",
      JSON.stringify([
        { ...template, id: "one", device: "Kaffeemaschine" },
        { ...template, id: "two", device: "Fernseher" },
        { ...template, id: "three", device: "Wasserkocher" },
      ]),
    );
  });
  await page.reload();

  await expect(page.getByText("Foundation complete", { exact: true })).toBeVisible();
  const firstRoomAssignment = page.getByLabel("Assign room").first();
  await firstRoomAssignment.selectOption({ label: "Cooking" });
  await expect(
    page.getByText("Device assigned to the room.", { exact: true }),
  ).toBeVisible();
  await expect(firstRoomAssignment).toHaveValue(/.+/);
  const roomDeviceProportions = await page.evaluate(() => {
    const deviceName = document.querySelector("[data-room-device-name]");
    const assignment = document.querySelector("[data-room-assignment]");
    const actions = Array.from(document.querySelectorAll("[data-room-action]"));
    return {
      deviceNameFontSize: deviceName ? getComputedStyle(deviceName).fontSize : "",
      assignmentFontSize: assignment ? getComputedStyle(assignment).fontSize : "",
      assignmentHeight: assignment?.getBoundingClientRect().height ?? 0,
      actionHeights: actions.map((action) => action.getBoundingClientRect().height),
    };
  });
  expect(roomDeviceProportions.deviceNameFontSize).toBe("14px");
  expect(roomDeviceProportions.assignmentFontSize).toBe("11px");
  expect(roomDeviceProportions.assignmentHeight).toBeLessThanOrEqual(28);
  expect(Math.max(...roomDeviceProportions.actionHeights)).toBeLessThanOrEqual(24);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete: Cooking" }).click();
  await expect(firstRoomAssignment).toHaveValue("");
  await expect(page.getByRole("heading", { name: "Cooking" })).toHaveCount(0);

  await page.getByLabel("Month", { exact: true }).fill("2026-09");
  await page.getByRole("button", { name: "Save month" }).click();
  await expect(
    page.getByText("Enter a value greater than 0.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Consumption in kWh").fill("210");
  await expect(page.getByText("€73.50", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save month" }).click();
  await expect(page.getByText("Monthly value saved.", { exact: true })).toBeVisible();
  await expect(page.locator("[data-home-next-step]")).toHaveCount(0);
  const septemberEntry = page.locator('[data-monthly-history-entry="2026-09"]');
  await expect(septemberEntry.getByText("210 kWh", { exact: true })).toBeVisible();
  await expect(septemberEntry.getByText("€73.50", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Enter bill amount" }).click();
  await page.getByLabel("Month", { exact: true }).fill("2026-10");
  await page.getByLabel("Cost").fill("75");
  await page.getByRole("button", { name: "Save month" }).click();
  await expect(
    page
      .locator('[data-monthly-history-entry="2026-10"]')
      .getByText("214.3 kWh", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Monthly trend", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "12 months" }).click();
  await expect(page.getByRole("button", { name: "12 months" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-monthly-goal-progress]")).toBeVisible();
  await expect(page.getByText("kWh +2%", { exact: true })).toBeVisible();
  await expect(page.getByText("cost +2%", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Estimate and actual consumption" }),
  ).toBeVisible();
  await expect(page.getByText("Comparison month: October 2026", { exact: true })).toBeVisible();
  const consumptionInsight = page.locator("[data-consumption-insight]");
  await expect(consumptionInsight).toContainText(
    "96% of your actual consumption is not yet covered by your saved devices.",
  );
  await expect(consumptionInsight).toContainText(
    "Saved devices explain 4% of your actual monthly consumption.",
  );
  await expect(page.getByText("The estimate includes 3 saved devices. Consumers not yet saved appear as a difference.", { exact: true })).toBeVisible();
  await expect(
    consumptionInsight.getByRole("link", { name: "Add a missing device" }),
  ).toHaveAttribute("href", "/#rechner");
  const savingTip = page.locator("[data-saving-tip]");
  await expect(savingTip).toContainText("Review Coffee machine first");
  await expect(savingTip).toContainText("33% of calculated device consumption");
  await expect(savingTip.getByRole("link", { name: "Open device details" })).toHaveAttribute("href", "/en/devices/coffee-machine");
  for (const heading of [
    "Cost by room",
    "Monthly check-in",
    "History",
    "Estimate and actual consumption",
    "Review Coffee machine first",
  ]) {
    await expect(page.getByRole("heading", { name: heading })).toHaveCSS("font-size", "20px");
  }

  await septemberEntry.getByRole("button", { name: "Edit" }).click();
  await expect(page.getByLabel("Consumption in kWh")).toHaveValue("210");
  await page.getByLabel("Consumption in kWh").fill("205");
  await page.getByRole("button", { name: "Update monthly value" }).click();
  await expect(page.getByText("Monthly value updated.", { exact: true })).toBeVisible();
  await expect(septemberEntry.getByText("205 kWh", { exact: true })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await septemberEntry.getByRole("button", { name: "Delete" }).click();
  await expect(septemberEntry).toHaveCount(0);

  await page.getByRole("button", { name: "Reserve a beta place" }).click();
  await expect(
    page.getByRole("button", { name: "Beta interest saved" }),
  ).toBeDisabled();

  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "Manage data" })).toBeVisible();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(250);
  const compactActions = [
    { action: page.getByRole("button", { name: "Settings", exact: true }), fontSize: "11px" },
    { action: page.getByRole("button", { name: "Save settings" }), fontSize: "11px" },
    { action: page.getByRole("button", { name: "Import backup" }), fontSize: "11px" },
  ];
  for (const { action, fontSize } of compactActions) {
    const style = await action.evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        backgroundColor: computed.backgroundColor,
        borderRadius: Number.parseFloat(computed.borderRadius),
        fontSize: computed.fontSize,
      };
    });
    expect(style.backgroundColor).toBe("rgb(220, 252, 232)");
    expect(style.borderRadius).toBeGreaterThan(10);
    expect(style.fontSize).toBe(fontSize);
  }
  const manageDataTextTops = await page.evaluate(() => {
    const textTop = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) return null;

      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node && !node.textContent?.trim()) node = walker.nextNode();
      if (!node) return null;

      const range = document.createRange();
      range.selectNodeContents(node);
      return range.getBoundingClientRect().top;
    };

    return {
      action: textTop("[data-manage-data-import]"),
      description: textTop("[data-manage-data-description]"),
      exportAction: textTop("[data-manage-data-export]"),
      resetAction: textTop("[data-manage-data-reset]"),
    };
  });
  expect(manageDataTextTops.action).not.toBeNull();
  expect(manageDataTextTops.description).not.toBeNull();
  expect(
    Math.abs(manageDataTextTops.action! - manageDataTextTops.description!),
  ).toBeLessThanOrEqual(1);
  expect(manageDataTextTops.exportAction).toBe(manageDataTextTops.action);
  expect(manageDataTextTops.resetAction).toBe(manageDataTextTops.action);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export backup" }).click();
  await downloadPromise;
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset My home" }).click();
  await expect(
    page.getByRole("heading", { name: "Set up your home" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(
        window.localStorage.getItem("eavesence-saved-devices-v1") ?? "[]",
      ).length,
    ),
  ).toBe(3);
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

test("device search preserves measured-input mode and values", async ({
  page,
}) => {
  await disableHeaderIntro(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Enter measured consumption" }).click();
  await page.getByLabel("Actual consumption per use").fill("0.42");
  await page.getByRole("button", { name: "Search devices" }).click();
  await expect(page.getByRole("searchbox", { name: "Search devices" })).toBeVisible();
  await expect(page.getByLabel("Actual consumption per use")).toBeVisible();
  await expect(page.getByLabel("Actual consumption per use")).toHaveValue("0.42");
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

  test("My home onboarding and compact room layout fit on a phone", async ({
    page,
  }) => {
    await disableHeaderIntro(page);
    await page.goto("/home");
    await page.getByRole("button", { name: "Create my home" }).click();

    const appNavigation = page.getByRole("navigation", {
      name: "App navigation",
    });
    await expect(appNavigation).toBeHidden();
    await page.addStyleTag({
      content: ".pwa-mobile-navigation { display: grid !important; }",
    });
    await expect(appNavigation).toBeVisible();
    await expect(
      appNavigation.getByRole("link", { name: "Overview" }),
    ).toHaveAttribute("href", "#home-overview");
    await expect(
      appNavigation.getByRole("link", { name: "Monthly value" }),
    ).toHaveAttribute("href", "#monthly-check-in");
    await expect(
      appNavigation.getByRole("link", { name: "Device" }),
    ).toHaveAttribute("href", "/#rechner");
    await expect(
      appNavigation.getByRole("button", { name: "Settings" }),
    ).toHaveCSS("font-size", "11px");
    await appNavigation.getByRole("button", { name: "Settings" }).click();
    await expect(page.getByLabel("Home name")).toBeFocused();

    const navigationBounds = await appNavigation.boundingBox();
    expect(navigationBounds?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((navigationBounds?.x ?? 0) + (navigationBounds?.width ?? 0)).toBeLessThanOrEqual(390);

    await expect(
      page.getByRole("heading", { name: "Discover EAVESENCE Pro later" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Reserve a beta place" }),
    ).toHaveCount(0);
    await page.getByText("Other rooms (5)", { exact: false }).click();
    await expect(page.getByRole("heading", { name: "Kitchen" })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });

  test("My home history, comparison and edit controls fit on a small phone", async ({
    page,
  }) => {
    await disableHeaderIntro(page);
    await page.setViewportSize({ width: 320, height: 568 });
    await page.addInitScript(() => {
      const timestamp = "2026-09-19T12:00:00.000Z";
      window.localStorage.setItem(
        "eavesence-home-profile-v1",
        JSON.stringify({
          version: 1,
          name: "Mobile home",
          currency: "EUR",
          electricityPrice: 0.3,
          savingsGoalPercent: 10,
          rooms: [{ id: "kitchen-1", name: "Kitchen" }],
          deviceRooms: { fridge: "kitchen-1" },
          createdAt: timestamp,
          updatedAt: timestamp,
          onboardingCompletedAt: timestamp,
        }),
      );
      window.localStorage.setItem(
        "eavesence-saved-devices-v1",
        JSON.stringify([
          {
            id: "fridge",
            device: "Kühlschrank",
            customDeviceName: "",
            mode: "estimate",
            currency: "EUR",
            price: 0.3,
            watts: 100,
            minutesPerUse: 60,
            usesPerWeek: 168,
            estimatedKwhPerUse: 0.1,
            measuredKwhPerUse: 0,
            yearlyKwh: 180,
            yearlyCost: 54,
            monthlyCost: 4.5,
            updatedAt: timestamp,
          },
        ]),
      );
      window.localStorage.setItem(
        "eavesence-home-history-v1",
        JSON.stringify([
          { month: "2026-09", kwh: 210, cost: 63, updatedAt: timestamp },
          { month: "2026-08", kwh: 200, cost: 60, updatedAt: timestamp },
        ]),
      );
    });
    await page.goto("/home");

  await expect(page.getByRole("heading", { name: "Mobile home" })).toBeVisible();
  await expect(page.locator("[data-monthly-checkin-status]")).toBeVisible();
  await expect(page.getByText("2 consecutive months", { exact: true })).toBeVisible();
    await expect(page.getByText("Comparison month: September 2026", { exact: true })).toBeVisible();
    const septemberEntry = page.locator('[data-monthly-history-entry="2026-09"]');
    await septemberEntry.getByRole("button", { name: "Edit" }).click();
    await expect(page.getByRole("button", { name: "Update monthly value" })).toBeVisible();

    const mobileLayout = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth;
      const controls = Array.from(
        document.querySelectorAll(
          '[data-monthly-history-entry] button, [data-consumption-insight] a, #monthly-check-in input, #monthly-check-in button',
        ),
      );
      return {
        documentOverflows: document.documentElement.scrollWidth > viewportWidth,
        overflowingControls: controls
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.left < -0.5 || rect.right > viewportWidth + 0.5;
          })
          .map((element) => element.textContent?.trim() || element.tagName),
      };
    });

    expect(mobileLayout.documentOverflows).toBe(false);
    expect(mobileLayout.overflowingControls).toEqual([]);
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
