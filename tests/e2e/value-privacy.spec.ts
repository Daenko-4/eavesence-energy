import { expect, test, type Page } from '@playwright/test';
import { homeWorkspace } from './home-navigation';

async function expectAmountsHidden(page: Page) {
  const amounts = await page.locator('[data-home-overview-content], [data-home-plan-content]').evaluateAll(views => {
    const exposed: string[] = [];
    let checked = 0;
    for (const view of views) for (const element of view.querySelectorAll('p, span, dd, strong')) {
      if (!element.getClientRects().length || element.children.length) continue;
      const text = element.textContent ?? '';
      if (!/\d/.test(text) || !/€|CHF|£|\$/.test(text)) continue;
      checked++;
      let current: Element | null = element;
      while (current && getComputedStyle(current).filter === 'none') current = current.parentElement;
      if (!current) exposed.push(text);
    }
    return { checked, exposed };
  });
  expect(amounts.checked).toBeGreaterThan(0);
  expect(amounts.exposed).toEqual([]);
}

for (const locale of ['en', 'de']) for (const width of [320, 1365]) {
  test(`header privacy hides money across views, reload and language changes ${locale} ${width}`, async ({ page }, info) => {
    const de = locale === 'de';
    await page.setViewportSize({ width, height: 900 });
    await page.clock.setFixedTime(new Date('2026-11-18T12:00:00Z'));
    await page.goto(de ? '/de/zuhause' : '/home');
    await page.getByRole('button', { name: de ? 'Zuhause erstellen' : 'Create my home', exact: true }).click();
    await page.evaluate(() => {
      const profile = JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
      Object.assign(profile, {
        incomeAmount: 2400, incomeFrequency: 'monthly', variableMonthly: 500,
        overviewReviewed: true, backupReminderDismissed: true,
        planning: { cash: { balance: 1400, asOf: '2026-11-18', payday: '2026-11-25', protected: 100, everydayRemaining: 200 } },
      });
      localStorage.setItem('eavesence-home-profile-v1', JSON.stringify(profile));
      localStorage.setItem('eavesence-home-costs-v1', JSON.stringify([
        { id: 'rent', name: 'Rent', amount: 900, category: 'housing', frequency: 'monthly', nextDueDate: '2026-11-20', updatedAt: '2026-11-18T12:00:00Z' },
      ]));
    });
    await page.reload();
    const profileBefore = await page.evaluate(() => localStorage.getItem('eavesence-home-profile-v1'));
    const toggle = page.locator('[data-header-privacy]');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle).toHaveAccessibleName(de ? 'Werte verbergen' : 'Hide values');
    const privacyBox = (await toggle.boundingBox())!;
    const settingsBox = (await page.locator('[data-header-settings]').boundingBox())!;
    expect(privacyBox.x + privacyBox.width).toBeLessThanOrEqual(settingsBox.x + 1);
    expect(privacyBox.y).toBeCloseTo(settingsBox.y, 1);
    expect(privacyBox.width).toBeGreaterThanOrEqual(44);
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-home-remaining]')).toHaveCSS('filter', 'blur(7px)');
    await expect(page.locator('[data-home-kpi=income] .home-month-kpi-label')).toHaveCSS('filter', 'none');
    await expectAmountsHidden(page);
    await page.getByRole('button', { name: de ? 'Reguläres Einkommen ändern' : 'Edit regular income', exact: true }).click();
    await expect(page.locator('#home-income-form input').first()).toHaveCSS('filter', 'blur(7px)');
    await homeWorkspace(page, 'plan');
    await expectAmountsHidden(page);
    await expect(page.locator('[data-payday-result]')).toHaveCSS('filter', 'blur(7px)');
    await page.reload();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expectAmountsHidden(page);
    await page.locator('[data-header-language]').click();
    await expect(page).toHaveURL(new RegExp(de ? '/home' : '/de/zuhause'));
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toHaveAccessibleName(de ? 'Show values' : 'Werte anzeigen');
    await expectAmountsHidden(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ fullPage: true, path: info.outputPath(`privacy-${locale}-${width}.png`) });
    await toggle.focus();
    await toggle.press('Space');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('[data-payday-result]')).toHaveCSS('filter', 'none');
    expect(await page.evaluate(() => localStorage.getItem('eavesence-home-profile-v1'))).toBe(profileBefore);
  });
}

test('privacy remains usable when local storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
    Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
  });
  await page.goto('/home');
  const toggle = page.locator('[data-header-privacy]');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
});
