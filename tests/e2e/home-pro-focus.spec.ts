import { expect, test, type Page } from '@playwright/test';
import { homeWorkspace } from './home-navigation';

async function seed(page: Page, de: boolean) {
  await page.clock.setFixedTime(new Date('2026-10-13T12:00:00Z'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(de ? '/de/zuhause' : '/home');
  await page.getByRole('button', { name: de ? 'Zuhause erstellen' : 'Create my home', exact: true }).click();
  await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
    Object.assign(profile, { incomeAmount: 2400, overviewReviewed: true, backupReminderDismissed: true });
    localStorage.setItem('eavesence-home-profile-v1', JSON.stringify(profile));
    localStorage.setItem('eavesence-home-costs-v1', JSON.stringify([
      { id: 'internet', name: 'Internet', amount: 40, frequency: 'monthly', category: 'subscriptions', nextDueDate: '2026-10-19', updatedAt: '2026-10-13T12:00:00Z' },
    ]));
  });
  await page.reload();
}

for (const de of [false, true]) for (const width of [320, 390, 1365]) {
  test(`home focus, settings and quiet tools ${de ? 'de' : 'en'} ${width}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await seed(page, de);
    const heading = page.locator('[data-home-heading]');
    const box = (await heading.boundingBox())!;
    expect(Math.abs(box.x + box.width / 2 - width / 2)).toBeLessThan(2);
    await expect(heading.getByRole('group').getByRole('button')).toHaveCount(2);
    await expect(page.locator('[data-workspace]')).toHaveCount(0);
    await heading.locator('[data-home-identity]').getByRole('button').click();
    const settings = page.locator('[data-home-settings]');
    await expect(settings.locator('input').first()).toBeFocused();
    await settings.locator('input').first().fill(de ? 'Unser Zuhause' : 'Our home');
    await settings.getByRole('button', { name: de ? 'Einstellungen speichern' : 'Save settings', exact: true }).click();
    await expect(heading.getByRole('heading')).toHaveText(de ? 'Unser Zuhause' : 'Our home');
    const budget = page.locator('[data-home-monthly-budget]');
    await budget.locator('summary').click();
    await expect(budget.locator('article').nth(2)).toHaveCSS('background-color', 'rgb(36, 39, 44)');
    await expect(budget.locator('article').nth(2)).toContainText(de ? '2.360,00' : '2,360.00');
    await expect(page.locator('[data-cost-manager]')).not.toHaveAttribute('open', '');
    await expect(page.locator('[data-cost-manager]')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(page.locator('[data-home-memos]')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: info.outputPath(`focused-home-${de ? 'de' : 'en'}-${width}.png`), fullPage: true });
    await homeWorkspace(page, 'plan');
    await expect(heading).toBeHidden();
    const hero = page.locator('[data-payday-hero]');
    await expect(hero.getByRole('heading')).toHaveText(de ? 'Was bleibt bis zum Gehalt?' : 'What is left until payday?');
    await expect(hero.locator('[data-payday-result]')).toHaveCount(0);
    expect((await hero.innerText()).length).toBeLessThan(370);
    await page.screenshot({ path: info.outputPath(`focused-pro-empty-${de ? 'de' : 'en'}-${width}.png`) });
    await homeWorkspace(page, 'overview');
    await expect(heading.getByRole('heading')).toHaveText(de ? 'Unser Zuhause' : 'Our home');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

for (const de of [false, true]) {
  test(`payday result, checked payments, stale and expired states ${de ? 'de' : 'en'}`, async ({ page }, info) => {
    const t = (a: string, b: string) => de ? a : b;
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page, de); await homeWorkspace(page, 'plan');
    const panel = page.locator('[data-payday-state]');
    await panel.getByRole('button', { name: t('Verfügbares Geld berechnen', 'Calculate available money'), exact: true }).click();
    const balance = panel.getByLabel(t('Aktueller Kontostand', 'Current account balance'), { exact: true });
    await expect(balance).toBeFocused();
    await balance.fill('1000');
    await panel.getByLabel(t('Nächstes Gehalt am', 'Next payday'), { exact: true }).fill('2026-10-25');
    await panel.getByLabel(t('Alltagsausgaben bis zum Gehalt', 'Everyday spending until payday'), { exact: true }).fill('200');
    await panel.getByRole('button', { name: t('Verfügbares Geld anzeigen', 'Show available money'), exact: true }).click();
    await expect(panel).toHaveAttribute('data-payday-state', 'ready');
    await expect(panel.locator('[data-payday-result]')).toContainText(t('760,00', '760.00'));
    await expect(panel.locator('[data-payday-summary]')).toContainText(t('40,00', '40.00'));
    await page.screenshot({ path: info.outputPath(`focused-pro-result-${de ? 'de' : 'en'}.png`) });
    await panel.getByRole('button', { name: /Zahlungen bis zum Gehalt abhaken|Check off payments until payday/ }).click();
    await panel.getByRole('checkbox', { name: /^Internet ·/ }).check();
    await expect(panel).toHaveAttribute('data-payday-state', 'stale');
    await expect(panel.locator('[data-payday-result]')).toHaveCount(0);
    await expect(panel.locator('[data-payday-status]')).toContainText(t('Zahlungen wurden geändert', 'Payments changed'));
    await panel.getByRole('button', { name: t('Kontostand aktualisieren', 'Update account balance'), exact: true }).click();
    await balance.fill('960');
    await panel.getByRole('button', { name: t('Verfügbares Geld anzeigen', 'Show available money'), exact: true }).click();
    await expect(panel.locator('[data-payday-result]')).toContainText(t('760,00', '760.00'));
    await page.reload();
    await expect(panel).toHaveAttribute('data-payday-state', 'ready');
    await page.clock.setFixedTime(new Date('2026-10-14T12:00:00Z')); await page.reload();
    await expect(panel).toHaveAttribute('data-payday-state', 'stale');
    await expect(panel.locator('[data-payday-result]')).toHaveCount(0);
    await page.clock.setFixedTime(new Date('2026-10-25T12:00:00Z')); await page.reload();
    await expect(panel).toHaveAttribute('data-payday-state', 'expired');
    await panel.getByRole('button', { name: t('Kontostand aktualisieren', 'Update account balance'), exact: true }).click();
    await expect(panel.getByLabel(t('Nächstes Gehalt am', 'Next payday'), { exact: true })).toBeFocused();
  });

  test(`incomplete dates and everyday spending have actionable next steps ${de ? 'de' : 'en'}`, async ({ page }, info) => {
    const t = (a: string, b: string) => de ? a : b;
    await page.setViewportSize({ width: 320, height: 844 });
    await seed(page, de);
    await page.evaluate(() => {
      const profile = JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
      profile.planning = { cash: { balance: 1000, asOf: '2026-10-13', payday: '2026-10-25', protected: 0, everydayRemaining: 100 } };
      localStorage.setItem('eavesence-home-profile-v1', JSON.stringify(profile));
      const costs = JSON.parse(localStorage.getItem('eavesence-home-costs-v1')!); costs[0].nextDueDate = '';
      localStorage.setItem('eavesence-home-costs-v1', JSON.stringify(costs));
    });
    await page.reload(); await homeWorkspace(page, 'plan');
    const panel = page.locator('[data-payday-state]');
    await expect(panel).toHaveAttribute('data-payday-state', 'dates');
    await expect(panel.locator('[data-payday-result]')).toHaveCount(0);
    await panel.getByRole('button', { name: `Internet · ${t('Termin ergänzen', 'Add date')}`, exact: true }).click();
    await expect(page.locator('#household-cost-form')).toBeVisible();
    await expect(page.locator('#household-cost-form input[type="date"]').first()).toBeFocused();
    await expect(page.locator('[data-home-plan-content]')).toBeHidden();
    await page.evaluate(() => {
      const profile = JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!); profile.planning.cash.everydayRemaining = null;
      localStorage.setItem('eavesence-home-profile-v1', JSON.stringify(profile));
      const costs = JSON.parse(localStorage.getItem('eavesence-home-costs-v1')!); costs[0].nextDueDate = '2026-10-19';
      localStorage.setItem('eavesence-home-costs-v1', JSON.stringify(costs));
    });
    await page.reload(); await homeWorkspace(page, 'plan');
    await expect(panel).toHaveAttribute('data-payday-state', 'everyday');
    await panel.getByRole('button', { name: t('Kontostand aktualisieren', 'Update account balance'), exact: true }).click();
    const everyday = panel.getByLabel(t('Alltagsausgaben bis zum Gehalt', 'Everyday spending until payday'), { exact: true });
    await expect(everyday).toBeFocused(); await everyday.fill('0');
    await panel.getByLabel(t('Aktueller Kontostand', 'Current account balance'), { exact: true }).fill('-100');
    await panel.getByRole('button', { name: t('Verfügbares Geld anzeigen', 'Show available money'), exact: true }).click();
    await expect(panel.locator('h2')).toHaveText(t('Voraussichtlich fehlen', 'Estimated shortfall'));
    await expect(panel.locator('[data-payday-result]')).toContainText(t('140,00', '140.00'));
    await page.screenshot({ path: info.outputPath(`focused-pro-shortfall-${de ? 'de' : 'en'}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('standalone CSS and bottom navigation keep home, costs and Pro connected', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 }); await seed(page, false);
  // Activate the application's actual standalone media rules; this is not a physical iPhone install.
  await page.evaluate(() => {
    for (const sheet of document.styleSheets) for (const rule of sheet.cssRules) {
      if (rule instanceof CSSMediaRule && rule.conditionText.includes('display-mode:standalone')) rule.media.mediaText = rule.conditionText.replace('(display-mode:standalone)', '(min-width:0px)');
      else if (rule instanceof CSSMediaRule && rule.conditionText.includes('display-mode: standalone')) rule.media.mediaText = rule.conditionText.replace('(display-mode: standalone)', '(min-width:0px)');
    }
  });
  const nav = page.locator('[data-pwa-mobile-nav]'); await expect(nav).toBeVisible();
  await nav.getByRole('link', { name: 'Plan', exact: true }).click();
  await expect(page.locator('[data-home-plan-content]')).toBeVisible();
  await nav.getByRole('link', { name: 'Costs', exact: true }).click();
  await expect(page.locator('[data-cost-manager]')).toHaveAttribute('open', '');
  await expect(page.locator('#household-costs')).toBeVisible();
  await nav.getByRole('link', { name: 'Overview', exact: true }).click();
  await expect(page.locator('[data-home-heading]')).toBeVisible();
  await page.locator('[data-home-identity]').getByRole('button').click();
  await expect(page.locator('[data-home-settings]')).toBeVisible();
  await nav.getByRole('link', { name: 'Plan', exact: true }).click();
  await expect(page.locator('[data-home-settings]')).toBeHidden();
  await page.screenshot({ path: info.outputPath('focused-pro-standalone.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
