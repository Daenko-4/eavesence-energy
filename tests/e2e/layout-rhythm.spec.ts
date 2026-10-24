import { expect, test, type Locator } from '@playwright/test';
import { homeWorkspace } from './home-navigation';

// Catch spatial regressions that functional save tests cannot detect.
for (const de of [false, true]) for (const width of [320, 390, 768, 1365]) {
  test(`guided layout and scroll continuity ${de ? 'de' : 'en'} ${width}`, async ({ page }, info) => {
    const t = (a: string, b: string) => de ? a : b;
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.setFixedTime(new Date('2026-10-24T12:00:00Z'));
    await page.goto(de ? '/de/zuhause' : '/home');
    await page.getByRole('button', { name: t('Zuhause erstellen', 'Create my home'), exact: true }).click();
    await page.evaluate(() => {
      const profile = JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
      Object.assign(profile, { incomeAmount: 2400, incomeFrequency: 'monthly', incomeDeferred: false, overviewReviewed: true, backupReminderDismissed: true });
      localStorage.setItem('eavesence-home-profile-v1', JSON.stringify(profile));
      localStorage.setItem('eavesence-home-costs-v1', JSON.stringify([{ id: 'rent', name: 'Rent', amount: 900, category: 'housing', frequency: 'monthly', nextDueDate: '2026-10-30', updatedAt: '2026-10-24T12:00:00Z' }]));
    });
    await page.reload();
    const month = page.getByRole('group', { name: t('Monat wählen', 'Choose month'), exact: true });
    const height = (await month.boundingBox())!.height;
    await month.getByRole('button', { name: t('Nächster Monat', 'Next month'), exact: true }).click();
    expect((await month.boundingBox())!.height).toBe(height);
    await month.getByRole('button', { name: t('Dieser Monat', 'This month'), exact: true }).click();
    const result = page.locator('[data-home-next-month]');
    const checklist = page.locator('[data-month-checklist]');
    const a = (await result.boundingBox())!, b = (await checklist.boundingBox())!;
    expect(Math.abs(a.x - b.x)).toBeLessThan(1);
    expect(Math.abs(a.width - b.width)).toBeLessThan(1);
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: info.outputPath(`rhythm-home-${width}.png`), fullPage: true });

    await homeWorkspace(page, 'plan');
    const plan = page.locator('[data-payday-state]');
    const balance = plan.getByLabel(t('Aktueller Kontostand', 'Current account balance'), { exact: true });
    const progress = plan.locator('[data-payday-form] > p').first();
    const aligned = async (field: Locator) => {
      const p = (await progress.boundingBox())!, f = (await field.boundingBox())!;
      expect(Math.abs(p.x - f.x)).toBeLessThan(1);
    };
    const unobscured = async (field: Locator) => {
      const f = (await field.boundingBox())!, header = (await page.locator('header').boundingBox())!;
      expect(f.y).toBeGreaterThanOrEqual(header.y + header.height);
      expect(f.y + f.height).toBeLessThanOrEqual(900);
    };
    await aligned(balance);
    await balance.fill('1200');
    const before = await page.evaluate(() => scrollY);
    await balance.press('Enter');
    const payday = plan.getByLabel(t('Nächstes Gehalt am', 'Next payday'), { exact: true });
    await expect(payday).toBeFocused();
    await aligned(payday); await unobscured(payday);
    // A visible next field should keep its place instead of being centered again.
    expect(Math.abs(await page.evaluate(() => scrollY) - before)).toBeLessThan(2);
    await plan.getByRole('button', { name: t('In 14 Tagen', 'In 14 days'), exact: true }).click();
    await page.screenshot({ path: info.outputPath(`rhythm-payday-${width}.png`), fullPage: true });
    await plan.getByRole('button', { name: t('Weiter', 'Continue'), exact: true }).click();
    const everyday = plan.getByLabel(t('Alltagsausgaben bis zum Gehalt', 'Everyday spending until payday'), { exact: true });
    await expect(everyday).toBeFocused(); await aligned(everyday); await unobscured(everyday);
    await everyday.fill('200');
    await plan.getByRole('button', { name: t('Zurück', 'Back'), exact: true }).click();
    await expect(payday).toBeFocused(); await unobscured(payday);
    await plan.getByRole('button', { name: t('Weiter', 'Continue'), exact: true }).click();
    await expect(everyday).toHaveValue('200');
    await everyday.press('Enter');
    await expect(plan.locator('[data-payday-result]')).toContainText(t('100,00', '100.00'));
    await page.screenshot({ path: info.outputPath(`rhythm-result-${width}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await homeWorkspace(page, 'overview');
    await page.getByRole('group', { name: t('Aktionen für dein Zuhause', 'Home actions'), exact: true }).getByRole('button', { name: t('Einkommen ändern', 'Edit income'), exact: true }).click();
    await expect(page.locator('[data-home-overview-content]')).toHaveCSS('padding-bottom', '0px');
    const input = page.locator('#home-income-form input').first();
    await input.fill('2500'); await input.press('Enter');
    await expect(page.locator('[data-home-remaining]')).toContainText(t('1.600,00', '1,600.00'));

    await page.getByRole('group', { name: t('Aktionen für dein Zuhause', 'Home actions'), exact: true }).getByRole('button', { name: t('Kosten hinzufügen', 'Add cost'), exact: true }).click();
    const cost = page.locator('#household-cost-form');
    const costName = cost.locator('#household-cost-name');
    await expect(costName).toBeFocused(); await unobscured(costName);
    await costName.fill('New subscription');
    const amount = cost.getByLabel(t('Betrag', 'Amount'), { exact: true });
    await amount.fill('25'); await amount.press('Enter');
    const feedback = page.locator('[data-cost-feedback]');
    await expect(feedback).toBeFocused(); await unobscured(feedback);
    await expect(feedback).toContainText(t('Haushaltskosten gespeichert.', 'Household cost saved.'));
  });
}
