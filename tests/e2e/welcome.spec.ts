import { expect, test } from "@playwright/test";

for (const de of [false, true]) {
  test(`welcome leads to My Home and preserves calculator access (${de ? "de" : "en"})`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(de ? "/de" : "/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(de ? "Damit aus Überblick ein Plan wird." : "Turn clarity into a plan.");
    const start = page.getByRole("link", { name: de ? "Meinen Überblick starten" : "Start my overview", exact: true });
    await expect(start).toHaveAttribute("href", de ? "/de/zuhause" : "/home");
    await expect(start).toBeInViewport();
    expect((await start.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole("link", { name: de ? "Zum kostenlosen Stromrechner" : "Open the free electricity calculator", exact: true })).toHaveAttribute("href", de ? "/de/rechner#rechner" : "/calculator#rechner");
    await expect(page.locator("#rechner")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ fullPage: true, path: testInfo.outputPath(`welcome-${de ? "de" : "en"}-375.png`) });
    await start.click();
    await expect(page).toHaveURL(de ? "/de/zuhause" : "/home");
    await expect(page.getByRole("heading", { name: de ? "Richte dein Zuhause ein" : "Set up your home" })).toBeVisible();
  });

  test(`returning households land in My Home, explicit calculator and old bookmarks remain usable (${de ? "de" : "en"})`, async ({ page }) => {
    await page.addInitScript(() => {
      const stamp = new Date().toISOString();
      localStorage.setItem("eavesence-home-profile-v1", JSON.stringify({ version: 1, name: "Saved home", currency: "EUR", electricityPrice: .3, savingsGoalPercent: 10, rooms: [], deviceRooms: {}, createdAt: stamp, updatedAt: stamp, onboardingCompletedAt: stamp }));
    });
    await page.goto(de ? "/de" : "/");
    await expect(page).toHaveURL(de ? "/de/zuhause" : "/home");
    await expect(page.getByRole("heading", { name: "Saved home", exact: true })).toBeVisible();
    await page.goto(de ? "/de/rechner" : "/calculator");
    await expect(page.locator("#rechner")).toBeVisible();
    await page.goto(de ? "/de#faq" : "/#faq");
    await expect(page).toHaveURL(de ? "/de/rechner#faq" : "/calculator#faq");
    await expect(page.locator("#faq").getByRole("button").first()).toHaveAttribute("aria-expanded", "true");
  });
}

test("welcome language switch stays on welcome; damaged storage does not prevent starting", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("eavesence-home-profile-v1", "broken json"));
  await page.goto("/");
  await page.getByRole("link", { name: "Current language: English. Switch to German." }).click();
  await expect(page).toHaveURL("/de");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Damit aus Überblick ein Plan wird.");
  await page.getByRole("link", { name: "Aktuelle Sprache: Deutsch. Zu Englisch wechseln." }).click();
  await expect(page).toHaveURL("/");
});
