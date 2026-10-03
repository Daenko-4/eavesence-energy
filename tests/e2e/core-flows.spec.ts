import { expect, test, type Page } from "@playwright/test";

async function disableHeaderIntro(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
}

async function openPlan(page: Page, question: "payday" | "savings" | "progress" = "savings", budget = false) {
  await page.getByRole("navigation", { name: /Choose workspace|Bereich wählen/ }).getByRole("button", { name: /Plan & save|Planen & sparen/ }).click();
  await page.getByRole("group", { name: /Choose planning question|Planungsfrage wählen/ }).getByRole("button", { name: question === "payday" ? /Spend until payday|Bis zum Gehalt ausgeben/ : question === "savings" ? /Find realistic savings|Realistisch sparen/ : /Savings achieved|Erreichte Ersparnis/ }).click();
  if (budget && !await page.getByLabel(/Everyday spending per month|Alltagsausgaben pro Monat/).isVisible()) await page.getByRole("button", { name: /Add a monthly budget|Monatsbudget ergänzen/ }).click();
}
async function openCostAreas(page: Page) {
  await page.getByRole("navigation", { name: /Choose workspace|Bereich wählen/ }).getByRole("button", { name: /^(Overview|Übersicht)$/ }).click();
  if (!await page.locator("[data-home-tiles]").isVisible()) await page.getByText(/^(Organize cost areas|Kostenbereiche organisieren)$/).click();
}

async function openEnergyTile(page: Page) {
  await openCostAreas(page);
  const tile = page.locator("[data-home-tiles] article").filter({ hasText: "Electricity & devices" }).first().getByRole("button").first();
  if (await tile.count()) {
    if (await tile.getAttribute("aria-expanded") === "false") await tile.click();
  } else await page.evaluate(() => { window.location.hash = "home-devices"; });
  await expect(page.locator("#home-devices")).toBeVisible();
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

test("calculator shows a relevant tip and keeps further guidance optional", async ({ page }) => {
  await disableHeaderIntro(page);
  await page.goto("/calculator");

  const tip = page.getByText("Energy-saving tip", { exact: true });
  const instructions = page.locator("#so-funktionierts");
  await expect(tip).toBeVisible();
  const viewAllDevices = instructions.getByRole("link", { name: "See all devices" });
  await expect(viewAllDevices)
    .toHaveAttribute("href", "/en/devices");
  const tipBox = await tip.boundingBox();
  const actionBox = await viewAllDevices.boundingBox();
  expect(tipBox).not.toBeNull();
  expect(actionBox).not.toBeNull();
  expect(actionBox!.x).toBeGreaterThan(tipBox!.x);
  expect(Math.abs(actionBox!.y - tipBox!.y)).toBeLessThan(30);
  await expect(page.getByRole("region", { name: "EAVESENCE as an app" })).toHaveCount(0);
  await expect(page.getByText("No sign-up", { exact: true })).toHaveCount(0);

  const howItWorks = instructions.getByRole("button", { name: "How it works" });
  await expect(howItWorks).toHaveAttribute("aria-expanded", "false");
  await expect(instructions.getByRole("heading", { name: "Choose a device" })).toBeHidden();
  await howItWorks.click();
  await expect(howItWorks).toHaveAttribute("aria-expanded", "true");
  await expect(instructions.getByRole("heading", { name: "Choose a device" })).toBeVisible();
});

test("footer How it works link reveals the steps on the homepage", async ({ page }) => {
  await disableHeaderIntro(page);
  await page.goto("/calculator");

  const instructions = page.locator("#so-funktionierts");
  await expect(instructions.getByRole("button", { name: "How it works" }))
    .toHaveAttribute("aria-expanded", "false");
  await page.getByRole("contentinfo").getByRole("link", { name: "How it works" }).click();
  await expect(page).toHaveURL(/#so-funktionierts$/);
  await expect(instructions.getByRole("heading", { name: "Choose a device" })).toBeVisible();
});

test("calculator engagement is tracked only on the first interaction", async ({
  page,
}) => {
  await disableHeaderIntro(page);
  await page.goto("/calculator");

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
  context,
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
  const serviceWorker = await serviceWorkerResponse.text();
  expect(serviceWorker).toContain('const OFFLINE_URL = "/offline"');
  expect(serviceWorker).toContain('"/home"');
  expect(serviceWorker).toContain('"/de/zuhause"');

  await page.goto("/home");
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => caches.match("/home").then(Boolean)))
    .toBe(true);
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Set up your home" }),
  ).toBeVisible();
  await context.setOffline(false);

  await page.goto("/offline");
  await expect(page.getByRole("heading", { name: "Keine Verbindung" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Erneut versuchen · Try again" }),
  ).toHaveAttribute("href", "/home");
});

test("savings scenarios persist and ask for confirmation when the effective month arrives", async ({ page }) => {
  await page.goto("/home");
  await page.evaluate(() => {
    const now = new Date();
    const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const due = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
    const stamp = now.toISOString();
    localStorage.setItem("eavesence-home-profile-v1", JSON.stringify({ version: 1, name: "Test home", currency: "EUR", electricityPrice: .3,
      incomeAmount: 2000, incomeFrequency: "monthly", variableMonthly: null, bufferMonthly: 100, goalMonthly: 200,
      savingsGoalPercent: 10, rooms: [], deviceRooms: {}, createdAt: stamp, updatedAt: stamp, onboardingCompletedAt: stamp }));
    localStorage.setItem("eavesence-home-costs-v1", JSON.stringify([{ id: "internet", name: "Internet", category: "subscriptions", amount: 40,
      frequency: "monthly", nextDueDate: due, updatedAt: stamp }]));
    sessionStorage.setItem("test-current-month", current);
  });
  await page.reload();
  await openPlan(page, "savings", true);
  const panel = page.locator("#savings-plan");
  await expect(panel).toContainText("Left after fixed costs and reserve");
  await expect(panel).toContainText("It is not a savings amount yet");
  await expect(panel.getByLabel("Optional reserve per month")).toHaveValue("100");
  await panel.getByLabel("Everyday spending per month (estimate)").fill("500");
  await panel.getByRole("button", { name: "Save plan", exact: true }).click();
  await expect(panel).toContainText("Estimated amount left");
  await expect(panel).toContainText("€1,360.00");

  await panel.getByLabel("Test a cost change · choose a cost").selectOption("internet");
  await panel.getByLabel("New amount per payment (0 = ends)").fill("25");
  await expect(panel).toContainText("Estimated over the next 12 planning months");
  await expect(panel).toContainText("€180.00");
  await panel.getByRole("button", { name: "Save this plan" }).click();
  await page.reload();
  await openPlan(page);
  await expect(panel).toContainText("Planned, no confirmed saving yet");
  await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem("eavesence-home-profile-v1")!);
    profile.savingsActions[0].effectiveMonth = sessionStorage.getItem("test-current-month");
    localStorage.setItem("eavesence-home-profile-v1", JSON.stringify(profile));
  });
  await page.reload();
  await openPlan(page);
  await expect(panel).toContainText("Planned changes");

  page.once("dialog", dialog=>void dialog.accept());
  await panel.getByRole("button", { name: "Done — update costs" }).click();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("eavesence-home-costs-v1")!)[0].amount)).toBe(25);
  await page.getByRole("button", {name:"3 · Saved",exact:true}).click();
  await expect(page.getByRole("region", {name:"03 · What have I actually saved?",exact:true})).toContainText("Confirmed, costs updated");
});

test("EAVESENCE Home onboarding builds a household and records a monthly check-in", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-09-15T12:00:00Z"));
  await disableHeaderIntro(page);
  await page.goto("/home");

  await expect(
    page.getByRole("heading", { name: "Set up your home" }),
  ).toBeVisible();
  await page.getByLabel("Home name").fill("Test home");
  await page.getByLabel("Home name").press("Enter");
  await openEnergyTile(page);
  await page.getByRole("button", { name: /Electricity Calculator/ }).click();
  await page.getByLabel("Electricity price per kWh").fill("0.35");
  await page.getByLabel("Electricity price per kWh").press("Enter");

  await expect(
    page.getByRole("heading", { name: "Test home", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sections in your home" }))
    .toBeVisible();
  const householdOverview = page.getByRole("region", { name: "Your household at a glance" });
  await householdOverview.getByRole("button", { name: "Add income" }).click();
  await householdOverview.getByLabel(/Regular monthly net income|Total annual net income/).fill("24000");
  await householdOverview.getByLabel("Period").selectOption("yearly");
  await householdOverview.getByLabel(/Regular monthly net income|Total annual net income/).press("Enter");
  await expect(householdOverview).toContainText("€2,000.00");
  const financeCards = householdOverview.locator("article");
  await expect(financeCards.nth(0)).toContainText("Net income · monthly average");
  await expect(financeCards.nth(1)).toContainText("Recurring costs / month");
  await expect(financeCards.nth(2)).toContainText("Left after fixed costs");
  const collapsedHeights = await financeCards.evaluateAll(cards => cards.map(card => card.getBoundingClientRect().height));
  expect(new Set(collapsedHeights).size).toBe(1);
  await page.getByRole("group", { name: "Home actions" }).getByRole("button", { name: "Edit income" }).click();
  expect(await financeCards.evaluateAll(cards => cards.map(card => card.getBoundingClientRect().height))).toEqual(collapsedHeights);
  await householdOverview.getByLabel(/Regular monthly net income|Total annual net income/).press("Enter");
  await openEnergyTile(page);
  await expect(page.getByRole("button", { name: /Monthly values & history/ })).toBeVisible();
  await openCostAreas(page);
  await page.getByRole("button", { name: /New tile/ }).click();
  await page.getByLabel("Tile name").fill("Insurance");
  await page.getByLabel("Tile name").press("Enter");
  const insuranceTile = page.locator("[data-home-tiles] article").filter({ hasText: "Insurance" });
  await expect(insuranceTile).toBeVisible();
  await insuranceTile.getByRole("button", { name: "Rename" }).click();
  await page.getByLabel("Tile name").fill("Insurance & contracts");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(insuranceTile.getByText("Insurance & contracts", { exact: true })).toBeVisible();
  const installCard = page.getByRole("region", {
    name: "Install EAVESENCE as an app",
  });
  await expect(installCard).toBeVisible();
  await expect(
    installCard.getByText("Open My home directly from your home screen"),
  ).toBeVisible();
  await installCard.getByRole("button", { name: "Maybe later" }).click();
  await expect(installCard).toHaveCount(0);
  const householdCosts = page.locator("#household-costs");
  await expect(
    householdCosts.getByRole("heading", { name: "Insurance & contracts", exact: true }),
  ).toBeVisible();
  await householdCosts
    .getByRole("button", { name: "Rent or mortgage payment" })
    .click();
  await householdCosts.getByLabel("Amount").fill("900");
  if (!await householdCosts.getByLabel("Next payment (optional)").isVisible()) await householdCosts.getByText("More details: category and dates", { exact: true }).click();
  await householdCosts.getByLabel("Next payment (optional)").fill("2026-10-01");
  await householdCosts.getByLabel("Amount").press("Enter");
  await expect(householdCosts.getByText("Household cost saved.")).toBeVisible();
  await householdOverview.getByRole("button", { name: /Payments next month/ }).click();
  await expect(householdOverview).toContainText("All recorded costs have a payment date.");
  await expect(page.getByText("Recurring costs / month")).toBeVisible();
  await expect(householdCosts.getByText("€900.00", { exact: true }).filter({ visible: true }).first()).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem("eavesence-home-costs-v1") ?? "[]"),
    ),
  ).toHaveLength(1);
  await openCostAreas(page);
  await page.getByRole("button", { name: /New tile/ }).click();
  await page.getByLabel("Tile name").fill("Car");
  await page.getByRole("button", { name: "Create tile", exact: true }).click();
  await expect(householdCosts.getByRole("heading", { name: "Quick setup" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Monthly values & history/ })).toHaveCount(0);
  await expect(householdCosts.getByText("€900.00", { exact: true })).toHaveCount(0);
  await expect(householdCosts.getByRole("button", { name: "Add cost", exact: true })).toBeVisible();
  await insuranceTile.getByRole("button").first().click();
  await expect(householdCosts.getByText("€900.00", { exact: true }).filter({ visible: true }).first()).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await insuranceTile.getByRole("button", { name: "Remove" }).click();
  await expect(insuranceTile).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem("eavesence-home-costs-v1") ?? "[]"),
    ),
  ).toHaveLength(0);
  await openEnergyTile(page);
  await page.getByRole("button", { name: /Monthly values & history/ }).click();
  const nextStep = page.getByRole("region", { name: "Next step" });
  await expect(nextStep).toContainText("September 2026 still open");
  const addMonthlyValue = nextStep.getByRole("button", {
    name: "Add monthly value",
  });
  const monthlyReminder = nextStep.getByRole("button", {
    name: "Monthly reminder",
  });
  await expect(addMonthlyValue).toHaveCSS("height", "24px");
  await expect(monthlyReminder).toHaveCSS("height", "24px");
  await addMonthlyValue.click();
  const consumptionMode = page.getByRole("button", { name: "Enter consumption" });
  await expect(consumptionMode).toHaveAttribute("aria-pressed", "true");
  await expect(consumptionMode).toHaveCSS("background-color", "rgb(8, 122, 69)");
  await expect(consumptionMode).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.getByLabel("Consumption in kWh")).toBeFocused();
  const reminderDownload = page.waitForEvent("download");
  await monthlyReminder.click();
  expect((await reminderDownload).suggestedFilename()).toBe(
    "eavesence-monthly-reminder.ics",
  );
  await expect(
    page.getByText("The monthly calendar reminder was downloaded."),
  ).toBeVisible();
  await openEnergyTile(page);
  const devicesTile = page.locator("[data-home-tiles] article").filter({ hasText: "Electricity & devices" }).first();
  if (await devicesTile.getByRole("button").first().getAttribute("aria-expanded") === "false") {
    await devicesTile.getByRole("button").first().click();
  }
  await expect(page.getByRole("heading", { name: "All household devices" })).toBeVisible();
  await expect(page.getByText("Calculate your first device above and save it here."))
    .toBeVisible();
  await expect(page.getByRole("button", { name: "Add room" })).toHaveCount(0);

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

  await openEnergyTile(page);
  const householdDevices = page.locator("#home-devices");
  await expect(householdDevices).toContainText("3 saved devices");
  await expect(householdDevices.getByText("Coffee machine", { exact: true })).toBeVisible();
  await expect(householdDevices.getByText("Television", { exact: true })).toBeVisible();
  await expect(householdDevices.getByText("Kettle", { exact: true })).toBeVisible();
  await expect(householdDevices.getByRole("link", { name: "Add device" }))
    .toHaveAttribute("href", "/calculator#rechner");
  await expect(page.locator("[data-room-assignment]")).toHaveCount(0);
  await expect(householdDevices.locator("summary")).toBeHidden();

  const monthlyDetails = page.getByRole("button", { name: /Monthly values & history/ });
  await expect(monthlyDetails).toHaveAttribute("aria-expanded", "false");
  await monthlyDetails.click();
  await expect(monthlyDetails).toHaveAttribute("aria-expanded", "true");
  await page.getByLabel("Month", { exact: true }).fill("2026-09");
  await page.getByRole("button", { name: "Save month" }).click();
  await expect(
    page.getByText("Enter a value greater than 0.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Consumption in kWh").fill("210");
  await expect(page.getByText("€73.50", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save month" }).click();
  await expect(page.getByText("Monthly value saved.", { exact: true })).toBeVisible();
  const monthlyPulse = page.getByRole("region", { name: "Monthly overview" });
  await expect(monthlyPulse).toBeVisible();
  await expect(monthlyPulse).toContainText("Your first monthly baseline is ready");
  await expect(monthlyPulse).toContainText("Largest calculated consumer");
  await expect(monthlyPulse.getByRole("link", { name: "Review consumer" }))
    .toHaveAttribute("href", "#home-devices");
  const septemberEntry = page.locator('[data-monthly-history-entry="2026-09"]');
  await expect(septemberEntry.getByText("210 kWh", { exact: true })).toBeVisible();
  await expect(septemberEntry.getByText("€73.50", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Enter bill amount" }).click();
  await page.getByLabel("Month", { exact: true }).fill("2026-10");
  await page.getByLabel("Cost", { exact: true }).fill("75");
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
  await page.getByRole("button", { name: /Compare consumption/ }).click();
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
  ).toHaveAttribute("href", "/calculator#rechner");
  await page.getByRole("button", { name: /Device tip/ }).click();
  const savingTip = page.locator("[data-saving-tip]");
  await expect(savingTip).toContainText("Review Coffee machine first");
  await expect(savingTip).toContainText("33% of calculated device consumption");
  await expect(savingTip.getByRole("link", { name: "Open device details" })).toHaveAttribute("href", "/en/devices/coffee-machine");
  await expect(page.getByRole("heading", { name: "Review Coffee machine first" })).toHaveCSS("font-size", "20px");

  await monthlyDetails.click();
  for (const heading of ["Monthly check-in", "History"]) {
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

  await openPlan(page, "savings", true);
  const savingsPlan = page.locator("#savings-plan");
  await expect(savingsPlan.getByRole("heading", { name: "Your monthly planning basics" })).toBeVisible();
  await savingsPlan.getByLabel("Everyday spending per month (estimate)").fill("500");
  await savingsPlan.getByText("More options: optional reserve", { exact: true }).click();
  await savingsPlan.getByLabel("Optional reserve per month").fill("100");
  await savingsPlan.getByLabel("Desired savings per month (optional)").fill("200");
  await savingsPlan.getByRole("button", { name: "Save plan" }).click();
  await expect(savingsPlan).toContainText("€1,400.00");
  await expect(
    page.getByRole("button", { name: "Reserve a beta place" }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Manage data" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Settings", exact: true }),
  ).toHaveCSS("height", "24px");
  await expect(page.getByRole("button", { name: "Save settings" })).toHaveCSS(
    "height",
    "24px",
  );
  await page.mouse.move(0, 0);
  await page.waitForTimeout(250);
  const compactActions = [
    { action: page.getByRole("button", { name: "Settings", exact: true }), fontSize: "11px", background: "rgba(0, 0, 0, 0)" },
    { action: page.getByRole("button", { name: "Save settings" }), fontSize: "11px", background: "rgb(221, 248, 233)" },
    { action: page.locator("[data-manage-data-import]"), fontSize: "11px", background: "rgb(221, 248, 233)" },
  ];
  for (const { action, fontSize, background } of compactActions) {
    const style = await action.evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        backgroundColor: computed.backgroundColor,
        borderRadius: Number.parseFloat(computed.borderRadius),
        fontSize: computed.fontSize,
      };
    });
    expect(style.backgroundColor).toBe(background);
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
  await openEnergyTile(page);
  const electricityTileButton = page.locator("[data-home-tiles] article").filter({ hasText: "Electricity & devices" }).first().getByRole("button").first();
  if (await electricityTileButton.getAttribute("aria-expanded") === "false") await electricityTileButton.click();
  const electricityCalculator = page.getByRole("button", { name: /Electricity Calculator/ });
  if (await electricityCalculator.getAttribute("aria-expanded") === "false") await electricityCalculator.click();
  await page.getByRole("button", { name: "Yearly bill", exact: true }).click();
  await page.getByLabel("Total paid for the year").fill("1200");
  await page.getByLabel("Consumption on the bill").fill("4000");
  await expect(page.getByText("Your all-in price: €0.30 per kWh", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("[data-manage-data-export]").click();
  await downloadPromise;
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset My home" }).click();
  await expect(
    page.getByRole("heading", { name: "Set up your home" }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem("eavesence-home-costs-v1"))).toBeNull();
  expect(await page.evaluate(() => window.localStorage.getItem("eavesence-home-tiles-v1"))).toBeNull();
  expect(
    await page.evaluate(() =>
      JSON.parse(
        window.localStorage.getItem("eavesence-saved-devices-v1") ?? "[]",
      ).length,
    ),
  ).toBe(3);
});

test("My home distinguishes annual monthly averages from dated payment forecasts", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-09-20T12:00:00Z") });
  await page.goto("/home"); await page.getByRole("button", { name: "Create my home" }).click();
  await page.getByRole("group", { name: "Home actions" }).getByRole("button", { name: "Add cost" }).click();
  const costs = page.locator("#household-costs");
  await costs.getByLabel("Name", { exact: true }).fill("Insurance");
  await costs.getByLabel("Amount", { exact: true }).fill("600");
  await costs.getByLabel("How often?").selectOption("yearly");
  await costs.getByText("More details: category and dates", { exact: true }).click();
  await costs.getByLabel("Next payment (optional)").fill("2026-10-15");
  await costs.getByLabel("Cancellation deadline (optional, enter yourself)").fill("2026-09-28");
  await costs.getByRole("button", { name: "Save", exact: true }).click();
  const overview = page.getByRole("region", { name: "Your household at a glance" });
  await expect(overview.locator("article").nth(1)).toContainText("€50.00");
  await overview.getByRole("button", { name: /Payments next month/ }).click();
  await expect(overview).toContainText("€600.00"); await expect(overview).toContainText("15 Oct");
  await page.reload(); await expect(page.locator("#household-costs")).toContainText("Insurance");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("eavesence-home-costs-v1")!)[0].cancellationDeadline)).toBe("2026-09-28");
});

test("calculator updates live and a saved calculation can be deleted", async ({
  page,
}) => {
  await disableHeaderIntro(page);
  await page.goto("/calculator");

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
  await expect(
    page.getByRole("link", { name: /Your cost overview in My Home/ }),
  ).toHaveAttribute("href", "/home");
  await expect(page.getByText("planned from €5.99 / month", { exact: true }))
    .toHaveCount(0);

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
    savedDevices.getByText("1 saved device", { exact: true }),
  ).toBeVisible();
  await expect(
    savedDevices.getByRole("link", { name: "Add an energy tile to My Home" }),
  ).toHaveAttribute("href", "/home#home-devices");
  await expect(savedDevices.getByText("Coffee machine", { exact: true }))
    .toHaveCount(0);

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
  await page.evaluate(() => {
    const timestamp = new Date().toISOString();
    window.localStorage.setItem(
      "eavesence-home-profile-v1",
      JSON.stringify({
        version: 1,
        name: "My home",
        currency: "EUR",
        electricityPrice: 0.3,
        savingsGoalPercent: 10,
        rooms: [],
        deviceRooms: {},
        createdAt: timestamp,
        updatedAt: timestamp,
        onboardingCompletedAt: timestamp,
      }),
    );
  });
  await savedDevices.getByRole("link", { name: "Add an energy tile to My Home" }).click();
  await expect(page).toHaveURL(/\/home#home-devices$/);
  const householdDevices = page.locator("#home-devices");
  await expect(householdDevices.getByText("Coffee machine", { exact: true }))
    .toBeVisible();
  await expect(householdDevices.getByText("€10.92", { exact: true }).first())
    .toBeVisible();
  await expect(householdDevices.getByText("€0.91", { exact: true }))
    .toBeVisible();
  await expect(householdDevices.locator("summary")).toBeHidden();
  await expect(
    householdDevices.getByRole("button", { name: "Delete: Coffee machine" }),
  ).toHaveCount(1);

  page.once("dialog", (dialog) => dialog.accept());
  await householdDevices
    .getByRole("button", { name: "Delete: Coffee machine" })
    .click();
  await expect(
    householdDevices.getByRole("button", { name: "Delete: Coffee machine" }),
  ).toHaveCount(0);
});

test("annual and continuous devices show the right usage inputs", async ({
  page,
}) => {
  await disableHeaderIntro(page);
  await page.goto("/calculator");

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
  await page.goto("/calculator");

  let firstFaqTop: number | null = null;
  for (const startAt of [350, 1500]) {
    await page.evaluate((top) => window.scrollTo(0, top), startAt);
    await openDesktopNavigation(page);
    await page.getByRole("link", { name: "FAQ", exact: true }).click();

    await expect(page).toHaveURL(/#faq$/);
    await expect(
      page.getByRole("button", { name: /Frequently asked questions about EAVESENCE/ }),
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
      expect(Math.abs(currentFaqTop - firstFaqTop)).toBeLessThanOrEqual(4);
    }
  }
  await expect(page.getByRole("heading", { name: "My Home", exact: true })).toBeVisible();
  await page.getByText("How are the monthly average and payment forecast calculated?").click();
  await expect(page.getByText("Costs without dates are excluded and counted separately.", { exact: false })).toBeVisible();
});

test("language switching keeps an open FAQ expanded and preserves its position", async ({
  page,
}) => {
  await disableHeaderIntro(page);
  await page.goto("/calculator");
  await page.evaluate(() => window.scrollTo(0, 400));
  const regularScrollBefore = await page.evaluate(() => window.scrollY);
  await page
    .getByRole("link", { name: "Zur deutschen Version wechseln" })
    .click();
  await expect(page).toHaveURL("/de/rechner");
  await expect(
    page.getByRole("button", { name: /Häufige Fragen zu EAVESENCE/ }),
  ).toHaveAttribute("aria-expanded", "false");
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - regularScrollBefore),
  ).toBeLessThanOrEqual(8);

  await page.goto("/#faq");

  const englishFaq = page.getByRole("button", {
    name: /Frequently asked questions about EAVESENCE/,
  });
  await expect(englishFaq).toHaveAttribute("aria-expanded", "true");

  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page
    .getByRole("link", { name: "Zur deutschen Version wechseln" })
    .click();

  await expect(page).toHaveURL("/de/rechner");
  await expect(
    page.getByRole("button", { name: /Häufige Fragen zu EAVESENCE/ }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(scrollBefore - 8);

  await page.getByRole("link", { name: "Switch to English" }).click();
  await expect(page).toHaveURL("/calculator");
  await expect(englishFaq).toHaveAttribute("aria-expanded", "true");
});

test("footer FAQ navigation opens the answers from the page end", async ({
  page,
}) => {
  await disableHeaderIntro(page);
  await page.goto("/calculator");
  await page.locator("footer").scrollIntoViewIfNeeded();

  await page
    .locator("footer")
    .getByRole("link", { name: "Frequently asked questions", exact: true })
    .click();

  await expect(page).toHaveURL(/#faq$/);
  await expect(
    page.getByRole("button", { name: /Frequently asked questions about EAVESENCE/ }),
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
      title: /Frequently asked questions about EAVESENCE/,
      homePath: "/calculator",
    },
    {
      path: "/en/privacy",
      linkName: "Frequently asked questions",
      title: /Frequently asked questions about EAVESENCE/,
      homePath: "/calculator",
    },
    {
      path: "/impressum",
      linkName: "Häufige Fragen",
      title: /Häufige Fragen zu EAVESENCE/,
      homePath: "/de/rechner",
    },
    {
      path: "/datenschutz",
      linkName: "Häufige Fragen",
      title: /Häufige Fragen zu EAVESENCE/,
      homePath: "/de/rechner",
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
  await page.goto("/calculator");

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
    { path: "/calculator", homeHref: "/" },
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

    if (path !== "/calculator") {
      await expect(page.locator(`main a[href="${homeHref}"]`)).toHaveCount(1);
    }
  }
});

test("header labels keep a fixed horizontal axis while staying open", async ({
  page,
}) => {
  await disableHeaderIntro(page);
  await page.goto("/calculator");
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
  expect(
    new Set(navigationStyles.slice(1).map(({ color }) => color)).size,
  ).toBe(1);
  expect(
    new Set(navigationStyles.map(({ fontWeight }) => fontWeight)).size,
  ).toBe(1);
  await expect(page.locator('[data-navigation-key="household"]')).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );

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
  await page.goto("/calculator");
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
  await page.goto("/calculator");

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
  await page.goto("/calculator");

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
    await page.goto("/calculator");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("link", { name: "FAQ", exact: true }).click();

    await expect(page).toHaveURL(/#faq$/);
    await expect(
      page.getByRole("button", { name: /Frequently asked questions about EAVESENCE/ }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });

  test("My home onboarding and household device area fit on a phone", async ({
    context,
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
    ).toHaveAttribute("aria-current", "location");
    await expect(
      appNavigation.getByRole("link", { name: "Costs" }),
    ).toHaveAttribute("href", "#household-costs");
    const planDestination = appNavigation.getByRole("link", { name: "Plan" });
    await expect(planDestination).toHaveAttribute("href", "#home-plan");
    await planDestination.click();
    await expect(planDestination).toHaveAttribute("aria-current", "location");
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await expect(page.getByLabel("Home name")).toBeFocused();

    await context.setOffline(true);
    await expect(
      page.getByRole("status").filter({ hasText: "Offline" }),
    ).toContainText("Your local data remains available");
    await context.setOffline(false);
    await expect(
      page.getByRole("status").filter({ hasText: "Back online" }),
    ).toBeVisible();

    const navigationBounds = await appNavigation.boundingBox();
    expect(navigationBounds?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((navigationBounds?.x ?? 0) + (navigationBounds?.width ?? 0)).toBeLessThanOrEqual(390);

    await openPlan(page, "savings", true);
    await expect(
      page.getByRole("heading", { name: "Your monthly planning basics" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Reserve a beta place" }),
    ).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "All household devices" })).toBeHidden();
    await openEnergyTile(page);
    await expect(page.getByRole("heading", { name: "All household devices" })).toBeVisible();
    await expect(page.getByText("Calculate your first device above and save it here."))
      .toBeVisible();
    await expect(page.getByText("Other rooms", { exact: false })).toHaveCount(0);
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
  await openEnergyTile(page);
  await expect(page.locator("#home-devices").getByText("Refrigerator", { exact: true }))
    .toBeVisible();
  await expect(page.getByRole("heading", { name: "Kitchen" })).toHaveCount(0);
  await page.getByRole("button", { name: /Compare consumption/ }).click();
  await expect(page.getByText("The estimate includes 1 saved device. Consumers not yet saved appear as a difference.", { exact: true }))
    .toBeVisible();
  await expect(page.getByText("Comparison month: September 2026", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Monthly values & history/ }).click();
  await expect(page.locator("[data-monthly-checkin-status]")).toBeVisible();
  await expect(page.getByText("2 consecutive months", { exact: true })).toBeVisible();
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
      await page.goto("/calculator");

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

test("hidden advanced plans survive core edits and export", async ({ page }) => {
  await page.goto("/home"); await page.getByRole("button", { name: "Create my home" }).click();
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem("eavesence-home-profile-v1")!);
    p.planning = { goals: [{ id: "holiday", name: "Holiday", target: 1200, saved: 400, targetMonth: "2027-06" }], reserves: [{ costId: "insurance", saved: 200 }], checks: [], reviews: [] };
    localStorage.setItem("eavesence-home-profile-v1", JSON.stringify(p));
  });
  await page.reload(); await openPlan(page);
  await expect(page.getByRole("region", { name: "Plan ahead" })).toHaveCount(0);
  await page.getByRole("group", { name: "Home actions" }).getByRole("button", { name: "Add income", exact: true }).click();
  await page.locator("#home-income-form").getByLabel(/Regular monthly net income|Total annual net income/).fill("2400");
  await page.locator("#home-income-form").getByRole("button", { name: "Save", exact: true }).click();
  const planning = await page.evaluate(() => JSON.parse(localStorage.getItem("eavesence-home-profile-v1")!).planning);
  expect(planning.goals[0].saved).toBe(400); expect(planning.reserves[0].saved).toBe(200);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const downloaded = page.waitForEvent("download"); await page.getByRole("button", { name: "Export backup", exact: true }).click();
  const { readFile } = await import("node:fs/promises");
  const file = await (await downloaded).path();
  expect(JSON.parse(await readFile(file!, "utf8")).profile.planning).toEqual(planning);
});
for (const width of [320, 390, 1365]) {
  test(`Pro questions are separate and fit at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 }); await page.goto("/home"); await page.getByRole("button", { name: "Create my home" }).click();
    await expect(page.getByRole("heading", { name: "What can I spend until my next payday?", exact: true })).toBeHidden();
    await openPlan(page, "payday");
    await expect(page.getByRole("heading", { name: "What can I spend until my next payday?", exact: true })).toBeVisible();
    await openPlan(page, "savings");
    await expect(page.getByRole("region", { name: "02 · Where can I realistically save?", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What can I spend until my next payday?", exact: true })).toBeHidden();
    await expect(page.getByRole("region", { name: "03 · What have I actually saved?", exact: true })).toHaveCount(0);
    await openPlan(page, "progress");
    await expect(page.getByRole("region", { name: "03 · What have I actually saved?", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`pro-progress-${width}.png`) });
  });
}

test('invoice and bank import require review, persist costs and explicitly update duplicates',async({page})=>{
 await page.goto('/home');await page.getByRole('button',{name:'Create my home'}).click();
 const panel=page.getByRole('region',{name:'Import costs',exact:true});
 const toggle=panel.getByRole('button',{name:'Import costs instead of typing'}),icon=toggle.locator('[aria-hidden="true"]');
 await expect(toggle).toHaveAttribute('aria-expanded','false');
 await toggle.click();
 await expect.poll(()=>icon.evaluate(el=>getComputedStyle(el).rotate)).toBe('-45deg');
 await toggle.click();
 await expect.poll(()=>icon.evaluate(el=>getComputedStyle(el).rotate)).toBe('0deg');
 await toggle.click();
 await panel.getByText('Paste text / CSV example',{exact:true}).click();
 await panel.getByLabel('Invoice text',{exact:true}).fill('Internet Provider\nTotal due: 39.90 EUR\nMonthly\nPayment due: 2026-11-05');
 await panel.getByRole('button',{name:'Create suggestion'}).click();
 await expect(panel.getByLabel('Amount',{exact:true})).toHaveValue('39.90');
 await panel.getByRole('button',{name:'Import reviewed costs'}).click();
 await expect(panel.getByRole('status')).toContainText('Costs imported');
 await page.reload();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-costs-v1')!));expect(stored[0].amount).toBe(39.9);
 await panel.getByRole('button',{name:'Import costs instead of typing'}).click();
 await panel.getByLabel('Choose files').setInputFiles({name:'bank.csv',mimeType:'text/csv',buffer:Buffer.from('name;amount;date;frequency;currency\nInternet Provider;-35;2026-10-05;monthly;EUR')});
 await panel.getByRole('button',{name:'Import reviewed costs'}).click();await expect(panel.getByRole('alert')).toBeVisible();
 await panel.getByLabel('Update existing cost instead of adding a duplicate').check();
 await panel.getByRole('button',{name:'Import reviewed costs'}).click();
 const updated=await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-costs-v1')!));expect(updated).toHaveLength(1);expect(updated[0].amount).toBe(35);
});

test('photo recognition runs locally and proposes the labelled invoice total',async({page})=>{
 test.setTimeout(120000);
 await page.goto('/home');await page.getByRole('button',{name:'Create my home'}).click();
 const panel=page.getByRole('region',{name:'Import costs',exact:true});await panel.getByRole('button',{name:'Import costs instead of typing'}).click();
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="500"><rect width="100%" height="100%" fill="white"/><g font-family="Arial" font-size="40" fill="black"><text x="50" y="80">Internet Provider</text><text x="50" y="160">Total due: 39.90 EUR</text><text x="50" y="240">Monthly</text><text x="50" y="320">Payment due: 05.11.2026</text></g></svg>';
 await panel.getByLabel('Choose files').setInputFiles({name:'invoice.svg',mimeType:'image/svg+xml',buffer:Buffer.from(svg)});
 await expect(panel.getByLabel('Amount',{exact:true})).toHaveValue('39.90',{timeout:90000});
 await expect(panel.getByLabel('Frequency — confirm')).toHaveValue('monthly');
 await expect(panel.getByLabel('Next payment (optional)')).toHaveValue('2026-11-05');
});

for(const width of [320,1365])test(`payday overview stays readable and recalculates at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/home');await page.getByRole('button',{name:'Create my home'}).click();
 await openPlan(page, 'payday');const panel=page.getByRole('region',{name:'Your available budget',exact:true});await panel.getByRole('button',{name:'Plan until next payday'}).click();
 const fields=await panel.locator('form input').evaluateAll(inputs=>inputs.map(input=>{const box=input.getBoundingClientRect();return {top:box.top,height:box.height,fontSize:getComputedStyle(input).fontSize};}));
 expect(fields).toHaveLength(4);
 for(const field of fields){expect(field.height).toBe(44);expect(field.fontSize).toBe(width<768?'16px':'13px');}
 if(width>=640){expect(Math.abs(fields[0].top-fields[1].top)).toBeLessThan(1);expect(Math.abs(fields[2].top-fields[3].top)).toBeLessThan(1);}
 const today=new Date(),later=new Date(today);later.setDate(later.getDate()+14);const day=`${later.getFullYear()}-${String(later.getMonth()+1).padStart(2,'0')}-${String(later.getDate()).padStart(2,'0')}`;
 await panel.getByLabel('Balance available today',{exact:true}).fill('1000');await panel.getByLabel('Next payday',{exact:true}).fill(day);await panel.getByLabel('Keep untouched from this balance',{exact:true}).fill('200');await panel.getByLabel('Everyday spending until payday (optional)',{exact:true}).fill('150');await panel.getByRole('button',{name:'Confirm balance & calculate'}).click();
 await expect(panel).toHaveCount(1);await expect(panel).toContainText('€650.00');await expect(panel).toContainText('UNTIL YOUR NEXT PAYDAY');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.reload();await openPlan(page, 'payday');await expect(panel).toContainText('€650.00');
});

test('savings assistant plans a cancellation, confirms it and updates recurring costs',async({page})=>{
 await page.goto('/home');await page.getByRole('button',{name:'Create my home'}).click();
 await page.evaluate(()=>{const today=new Date(),day=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;localStorage.setItem('eavesence-home-costs-v1',JSON.stringify([{id:'streaming',name:'Streaming',amount:18,category:'subscriptions',frequency:'monthly',nextDueDate:day,updatedAt:today.toISOString()}]));});await page.reload();
 await openPlan(page);const coach=page.getByRole('region',{name:'02 · Where can I realistically save?',exact:true});const progress=page.getByRole('region',{name:'03 · What have I actually saved?',exact:true});await coach.getByRole('button',{name:'Plan change',exact:true}).click();await coach.getByLabel('New amount per payment (0 = ends)').fill('0');await coach.getByRole('button',{name:'Save this plan',exact:true}).click();await expect(coach).toContainText('Planned, no confirmed saving yet');
 page.once('dialog',dialog=>void dialog.accept());await coach.getByRole('button',{name:'Done — update costs'}).click();await openPlan(page,'progress');await expect(progress).toContainText('€18.00');await expect(progress).toContainText('Confirmed, costs updated');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-costs-v1')!))).toHaveLength(0);await page.reload();await openPlan(page,'progress');await expect(progress).toContainText('Confirmed, costs updated');
});

test('PDF text extraction proposes the invoice without uploading it',async({page})=>{
 await page.goto('/home');await page.getByRole('button',{name:'Create my home'}).click();
 const panel=page.getByRole('region',{name:'Import costs',exact:true});await panel.getByRole('button',{name:'Import costs instead of typing'}).click();
 const stream='BT /F1 16 Tf 50 750 Td (Internet Provider) Tj 0 -30 Td (Total due: 39.90 EUR) Tj 0 -30 Td (Monthly) Tj ET';
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
 let pdf='%PDF-1.4\n';const offsets=[0];objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${o}\nendobj\n`;});const xref=Buffer.byteLength(pdf);pdf+=`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n=>`${String(n).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
 await panel.getByLabel('Choose files').setInputFiles({name:'invoice.pdf',mimeType:'application/pdf',buffer:Buffer.from(pdf)});
 await expect(panel.getByLabel('Amount',{exact:true})).toHaveValue('39.90',{timeout:20000});
 await expect(panel.getByLabel('Frequency — confirm')).toHaveValue('monthly');
});

test('native document reader waits for app context and returns reviewed costs through its bridge',async({page})=>{
 await page.addInitScript(()=>{
  const bridgeWindow=window as unknown as Window&{ReactNativeWebView:{postMessage:(value:string)=>void};importResult?:unknown};
  bridgeWindow.ReactNativeWebView={postMessage:(value:string)=>{const message=JSON.parse(value);if(message.type==='ready')window.dispatchEvent(new CustomEvent('eavesence-import-context',{detail:{costs:[],currency:'EUR',locale:'de'}}));if(message.type==='costs')bridgeWindow.importResult=message.costs;}};
 });
 await page.goto('/import');
 await page.getByRole('button',{name:'Kosten übernehmen statt abtippen'}).click();await page.getByText('Text einfügen / CSV-Beispiel',{exact:true}).click();await page.getByLabel('Rechnungstext',{exact:true}).fill('Internet\nGesamtbetrag 39,90 EUR\nmonatlich');await page.getByRole('button',{name:'Vorschlag erstellen'}).click();await page.getByRole('button',{name:'Geprüfte Kosten übernehmen'}).click();
 const result=await page.evaluate(()=>(window as Window&{importResult?:unknown}).importResult);expect(result).toEqual([expect.objectContaining({name:'Internet',amount:39.9,frequency:'monthly'})]);
 expect(await page.evaluate(()=>localStorage.getItem('eavesence-home-costs-v1'))).toBeNull();
});


for (const width of [320, 1365]) test(`home actions reveal their editor and keep saved costs visible at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/home');
  await page.getByRole('button', { name: 'Create my home' }).click();
  const actions = page.getByRole('group', { name: 'Home actions', exact: true });
  await actions.getByRole('button', { name: 'Add income', exact: true }).click();
  const income = page.locator('#home-income-form');
  await expect(income.getByLabel('Regular monthly net income (excluding extras)', { exact: true })).toBeFocused();
  await expect.poll(() => income.evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(80);
  await expect.poll(() => income.evaluate(el => el.getBoundingClientRect().top)).toBeLessThan(300);
  await income.getByLabel('Regular monthly net income (excluding extras)', { exact: true }).fill('2500');
  await income.getByRole('button', { name: 'Save', exact: true }).click();
  await actions.getByRole('button', { name: 'Edit income', exact: true }).click();
  await expect(income.getByLabel('Regular monthly net income (excluding extras)', { exact: true })).toBeFocused();
  await expect.poll(() => income.evaluate(el => el.getBoundingClientRect().top)).toBeLessThan(300);
  await actions.getByRole('button', { name: 'Add cost', exact: true }).click();
  const costs = page.locator('#household-costs');
  await expect(costs.getByRole('heading', { name: 'Household costs', exact: true })).toBeVisible();
  await costs.getByLabel('Name', { exact: true }).fill('Test internet');
  await costs.getByLabel('Amount', { exact: true }).fill('39');
  await costs.getByRole('button', { name: 'Save', exact: true }).click();
  await costs.locator('button[aria-controls="household-cost-form"]').click();
  await costs.getByRole('button', { name: 'Hide form', exact: true }).click();
  await expect(page.locator('#household-cost-form')).toHaveCount(0);
  await expect(costs).toContainText('Test internet');
  await expect(page.locator('[data-home-tiles] button[aria-expanded="true"]').first()).toContainText('Household costs');
  const style = await actions.getByRole('button', { name: 'Add cost', exact: true }).evaluate(el => ({ background: getComputedStyle(el).backgroundColor, border: getComputedStyle(el).borderTopWidth }));
  expect(style.background).toBe('rgba(0, 0, 0, 0)');
  expect(style.border).toBe('1px');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});


for (const width of [320, 1365]) test(`new tile creation dismisses only empty drafts and keeps cost areas separate at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/home');
  await page.getByRole('button', { name: 'Create my home' }).click();
  await openCostAreas(page);
  const newTile = page.getByRole('button', { name: /New tile/ });
  const form = page.locator('[data-home-tile-form]');
  await newTile.click();
  await expect(newTile).toHaveAttribute('aria-expanded', 'true');
  await expect(form.getByLabel('Tile name')).toBeFocused();
  await expect.poll(() => newTile.evaluate(el => getComputedStyle(el).borderTopColor)).toBe('rgb(114, 220, 163)');
  await page.keyboard.press('Escape');
  await expect(form).toHaveCount(0);
  await expect(newTile).toBeFocused();
  await newTile.click();
  await form.getByLabel('Tile name').fill('   ');
  await page.getByRole('heading', { name: 'Sections in your home', exact: true }).click();
  await expect(form).toHaveCount(0);
  await newTile.click();
  await form.getByLabel('Tile name').fill('Insurance');
  await page.keyboard.press('Escape');
  await expect(form.getByLabel('Tile name')).toHaveValue('Insurance');
  await page.getByRole('heading', { name: 'Sections in your home', exact: true }).click();
  await expect(form.getByLabel('Tile name')).toHaveValue('Insurance');
  await newTile.click();
  await expect(form.getByLabel('Tile name')).toHaveValue('Insurance');
  await form.getByRole('button', { name: 'Create tile', exact: true }).click();
  await expect(form).toHaveCount(0);
  await expect(newTile).toHaveAttribute('aria-expanded', 'false');
  const customTile = page.locator('[data-home-tiles] article').filter({ hasText: 'Insurance' });
  await expect(customTile).not.toContainText('Household costs');
  const costs = page.locator('#household-costs');
  await costs.getByRole('button', { name: 'Rent or mortgage payment', exact: true }).click();
  await costs.getByLabel('Name', { exact: true }).fill('Private insurance');
  await costs.getByLabel('Amount', { exact: true }).fill('29');
  await costs.getByRole('button', { name: 'Save', exact: true }).click();
  await page.locator('[data-home-tiles] article').filter({ hasText: 'Household costs' }).getByRole('button').first().click();
  await expect(costs.getByRole('heading', { name: 'Household costs', exact: true })).toBeVisible();
  await expect(costs).not.toContainText('Private insurance');
  await page.reload();
  await openCostAreas(page);
  await customTile.getByRole('button').first().click();
  await expect(costs).toContainText('Private insurance');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

 test("new homes start with costs only and add energy when explicitly requested", async ({ page }) => {
  await page.goto("/home");
  await page.getByLabel("Home name").fill("Simple home");
  await page.getByLabel("Home name").press("Enter");
  const tiles = page.locator("[data-home-tiles] article");
  await expect(tiles).toHaveCount(1);
  await expect(tiles.first()).toContainText("Household costs");
  await openCostAreas(page);
  await expect(page.getByRole("link", { name: "Open energy calculator", exact: true })).toBeVisible();
  await openEnergyTile(page);
  await expect(tiles).toHaveCount(2);
  const costsTile = tiles.filter({ hasText: "Household costs" }).first().getByRole("button").first();
  await costsTile.click();
  await page.getByRole("button", { name: "Add income", exact: true }).first().click();
  await page.getByLabel("Regular monthly net income (excluding extras)", { exact: true }).first().fill("2500");
  await page.getByLabel("Regular monthly net income (excluding extras)", { exact: true }).first().press("Enter");
  await expect(costsTile).toHaveAttribute("aria-expanded", "true");
  await page.reload();
  await expect(tiles).toHaveCount(2);
  await openCostAreas(page);
  await page.getByRole("button", { name: /New tile/ }).click();
  await page.getByLabel("Tile name", { exact: true }).fill("Insurance");
  await page.locator("#home-tile-form").getByRole("button", { name: "Create tile", exact: true }).click();
  await expect(tiles).toHaveCount(3);
  await page.reload();
  await expect(tiles).toHaveCount(3);
  await expect(tiles.filter({ hasText: "Insurance" })).toHaveCount(1);
});

for (const locale of ['de', 'en'] as const) {
  test(`monthly plan stays readable on a narrow phone in ${locale}`, async ({page}, info) => {
    await page.setViewportSize({width:375,height:812});
    await disableHeaderIntro(page);
    await page.goto(locale === 'de' ? '/de/zuhause' : '/home');
    await page.evaluate(() => {
      const stamp = new Date().toISOString();
      localStorage.setItem('eavesence-home-profile-v1',JSON.stringify({version:1,name:'Beta home',currency:'EUR',electricityPrice:.3,incomeAmount:2400,incomeFrequency:'monthly',variableMonthly:500,bufferMonthly:0,goalMonthly:0,savingsGoalPercent:10,rooms:[],deviceRooms:{},createdAt:stamp,updatedAt:stamp,onboardingCompletedAt:stamp}));
      localStorage.setItem('eavesence-home-costs-v1',JSON.stringify([{id:'internet',name:'Internet',amount:35,category:'subscriptions',frequency:'monthly',nextDueDate:'',updatedAt:stamp}]));
    });
    await page.reload();
    await openPlan(page, 'payday');
    const question = page.getByRole('heading',{name:locale==='de'?'Was kann ich bis zum nächsten Gehalt ausgeben?':'What can I spend until my next payday?',exact:true});
    await expect(question).toBeVisible();
    await question.scrollIntoViewIfNeeded();
    await page.screenshot({path:info.outputPath(`cash-window-${locale}.png`)});
    await openPlan(page, 'savings');
    const plan = page.locator('#savings-plan');
    await expect(plan.getByRole('heading',{name:locale==='de'?'02 · Wo kann ich realistisch sparen?':'02 · Where can I realistically save?',exact:true})).toBeVisible();
    await openPlan(page, 'progress');
    const progress = page.getByRole('heading',{name:locale==='de'?'03 · Was habe ich tatsächlich eingespart?':'03 · What have I actually saved?',exact:true});
    await expect(progress).toBeVisible();
    await expect(page.locator('[data-home-plan-content]')).toContainText(locale==='de'?'Noch keine bestätigte Ersparnis':'No confirmed savings yet');
    await progress.scrollIntoViewIfNeeded();
    await page.screenshot({path:info.outputPath(`confirmed-savings-${locale}.png`)});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  });
}
