import { homeWorkspace, openPaydayPayments, savingsTool } from './home-navigation';
import { test, expect } from '@playwright/test';
for (const de of [false, true]) for (const width of [320, 390, 768, 1024, 1365]) {
  test(`Pro reserves, subscription preview and balance updates survive reload ${de ? 'de' : 'en'} ${width}`, async ({ page }, info) => {
    const t = (a: string, b: string) => de ? a : b;
    await page.setViewportSize({ width, height: 900 });
    await page.clock.setFixedTime(new Date('2026-10-07T12:00:00Z'));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(de ? '/de/zuhause' : '/home');
    await page.getByRole('button', { name: t('Zuhause erstellen', 'Create my home'), exact: true }).click();
    await page.evaluate(() => {
      const p = JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
      Object.assign(p, { incomeAmount: 2400, variableMonthly: 500, overviewReviewed: true, backupReminderDismissed: true, planning: { cash: { balance: 500, asOf: '2026-10-07', payday: '2026-10-31', protected: 100, everydayRemaining: 100 } } });
      localStorage.setItem('eavesence-home-profile-v1', JSON.stringify(p));
      localStorage.setItem('eavesence-home-costs-v1', JSON.stringify([
        { id: 'stream', name: 'Streaming', amount: 20, frequency: 'monthly', category: 'subscriptions', nextDueDate: '2026-10-10', updatedAt: '2026-10-07T00:00:00Z' },
        { id: 'insurance', name: 'Insurance', amount: 600, frequency: 'yearly', category: 'insurance', nextDueDate: '2026-12-10', updatedAt: '2026-10-07T00:00:00Z' },
      ]));
    });
    await page.reload();

    const plan = () => homeWorkspace(page, 'plan');
    const questions = page.getByRole('group', { name: /Choose planning question|Planungsfrage wählen/ });
    await plan();
    const payday = page.getByRole('region', { name: /Your available budget|Dein verfügbarer Spielraum/ });
    await expect(payday.locator('[data-payday-result]')).toContainText(t('280,00', '280.00'));
    await expect(payday.locator('[data-payday-calculation] dd')).toHaveCount(4);
    await expect(payday.locator('[data-quick-check]')).toHaveCount(0);
    const editAction=payday.locator('[data-payday-edit-action]');
    await expect(editAction).toHaveAttribute('aria-expanded','false');
    await expect(editAction).toHaveCSS('font-size','12px');
    expect((await editAction.boundingBox())!.height).toBeLessThanOrEqual(32);
    await expect(editAction.locator('.site-disclosure-icon')).toHaveCount(0);
    await editAction.click();
    await expect(payday.getByLabel(t('Aktueller Kontostand', 'Current account balance'), { exact: true })).toBeFocused();
    await expect(editAction).toHaveAttribute('aria-expanded','true');
    await expect(editAction).toHaveCSS('font-size','12px');
    expect((await editAction.boundingBox())!.height).toBeLessThanOrEqual(32);
    await expect(editAction).toHaveText(t('Einklappen','Collapse'));
    await expect(editAction.locator('.site-disclosure-icon')).toHaveCount(0);

    await payday.getByRole('button', { name: t('Einklappen', 'Collapse'), exact: true }).click();
    await expect(editAction).toHaveAttribute('aria-expanded','false');
    await expect(payday.locator('[data-payday-editor]')).toHaveCount(0);
    await openPaydayPayments(page);
    await payday.getByRole('checkbox', { name: /^Streaming ·/ }).check();
    await expect(payday.locator('[data-payday-result]')).toHaveCount(0);
    await editAction.click();
    await payday.getByLabel(t('Aktueller Kontostand', 'Current account balance'), { exact: true }).fill('480');
    await payday.getByRole('button', { name: t('Verfügbares Geld anzeigen', 'Show available money') }).click();
    await expect(payday.locator('[data-payday-result]')).toContainText(t('280,00', '280.00'));
    await page.reload(); await plan();
    await expect(payday.locator('[data-payday-result]')).toContainText(t('280,00', '280.00'));
    await openPaydayPayments(page);
    await expect(payday.getByRole('checkbox', { name: /^Streaming ·/ })).toBeChecked();
    await questions.getByRole('button', { name: /Lower costs|Kosten senken/ }).click();
    const tools = page.getByRole('region', { name: t('Rechnungen und Abos planen', 'Plan bills and subscriptions') });
    await savingsTool(page, 'reserves');
    await tools.getByLabel(t('Für diese Rechnung reserviertes Geld', 'Money reserved for this bill')).fill('200');
    await tools.getByRole('button', { name: t('Rücklage speichern', 'Save reserve') }).click();
    await expect(tools).toContainText(t('133,34', '133.34'));
    await savingsTool(page, 'annual');
    await tools.getByLabel(t('Abo auswählen', 'Choose subscription')).selectOption('stream');
    await tools.getByLabel(t('Angebot: voller Jahrespreis', 'Offer: full annual price')).fill('180');
    await tools.getByLabel(t('Jahreszahlung am', 'Annual payment on')).fill('2026-10-07');
    await expect(tools).toContainText(t('Pro Jahr günstiger um', 'Costs less per year by'));
    await expect(tools.getByText(t('Pro Jahr günstiger um', 'Costs less per year by'), { exact: false })).toContainText(t('60,00', '60.00'));
    // The already paid monthly charge cannot offset the annual payment.
    await expect(tools.getByText(t('Nach der Umstellung bis zum nächsten Gehalt verfügbar', 'Available until next payday after switching'), { exact: false })).toContainText(t('100,00', '100.00'));
    await tools.getByRole('button', { name: t('Prüfung vormerken', 'Save review reminder') }).click();
    await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).planning.memos?.length)).toBe(1);
    await tools.screenshot({ path: info.outputPath(`pro-tools-${de ? 'de' : 'en'}-${width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.reload(); await plan();
    await questions.getByRole('button', { name: /Lower costs|Kosten senken/ }).click();
    await savingsTool(page, 'reserves');
    await expect(tools.getByLabel(t('Für diese Rechnung reserviertes Geld', 'Money reserved for this bill'))).toHaveValue('200');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).planning);
    expect(saved.reserves[0].dueDate).toBe('2026-12-10'); expect(saved.memos).toHaveLength(1);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('eavesence-home-costs-v1')!)[0].frequency)).toBe('monthly');
  });
}
