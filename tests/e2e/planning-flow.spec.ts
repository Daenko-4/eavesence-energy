import { expect, test, type Page } from '@playwright/test';
import { homeWorkspace, planningPeriod, savingsTool } from './home-navigation';

async function seed(page: Page, de: boolean) {
  await page.clock.setFixedTime(new Date('2026-10-19T12:00:00Z'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(de ? '/de/zuhause' : '/home');
  await page.getByRole('button', { name: de ? 'Zuhause erstellen' : 'Create my home', exact: true }).click();
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
    Object.assign(p, { incomeAmount: 2400, incomeFrequency: 'monthly', overviewReviewed: true, backupReminderDismissed: true });
    localStorage.setItem('eavesence-home-profile-v1', JSON.stringify(p));
    localStorage.setItem('eavesence-home-costs-v1', JSON.stringify([
      { id: 'internet', name: 'Internet', amount: 40, category: 'subscriptions', frequency: 'monthly', nextDueDate: '2026-10-25', updatedAt: '2026-10-19T12:00:00Z' },
      { id: 'insurance', name: 'Insurance', amount: 600, category: 'insurance', frequency: 'yearly', nextDueDate: '2026-12-20', updatedAt: '2026-10-19T12:00:00Z' },
    ]));
  });
  await page.reload(); await homeWorkspace(page, 'plan');
}

for (const de of [false, true]) for (const width of [320, 390, 1365]) {
  test(`planning periods and direct tools keep drafts ${de ? 'de' : 'en'} ${width}`, async ({ page }, info) => {
    const t = (a: string, b: string) => de ? a : b;
    await page.setViewportSize({ width, height: 900 });
    await seed(page, de);
    const navigation=(await page.locator('.pro-question-navigation').boundingBox())!;
    const surface=(await page.locator('.planning-workspace-content').boundingBox())!;
    if(width>=1024)expect(navigation.x+navigation.width).toBeLessThanOrEqual(surface.x-12);
    else expect(navigation.y+navigation.height).toBeLessThanOrEqual(surface.y-8);
    const costsBefore = await page.evaluate(() => localStorage.getItem('eavesence-home-costs-v1'));
    const payday = page.locator('[data-payday-state]');
    await payday.getByRole('button', { name: t('Verfügbares Geld berechnen', 'Calculate available money'), exact: true }).click();
    await payday.getByLabel(t('Aktueller Kontostand', 'Current account balance'), { exact: true }).fill('1250');
    await payday.getByRole('button',{name:t('In 14 Tagen','In 14 days'),exact:true}).click();
    await expect(payday.getByLabel(t('Nächstes Gehalt am','Next payday'),{exact:true})).toHaveValue('2026-11-02');
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await page.screenshot({fullPage:true,path:info.outputPath(`planning-money-${de?'de':'en'}-${width}.png`)});
    await planningPeriod(page, 'forecast');
    const forecast = page.locator('[data-pro-forecast]');
    await expect(forecast).toBeVisible();
    await expect(forecast.getByRole('button', { name: t('Kontostand & Gehaltstag prüfen', 'Review balance & payday'), exact: true })).toBeVisible();
    await expect(forecast.locator(':scope > summary')).toHaveCount(0);
    await expect(payday).toBeHidden();
    await planningPeriod(page, 'budget');
    const budget = page.locator('[data-planning-budget]');
    await budget.getByLabel(t('Alltagsausgaben pro Monat (geschätzt)', 'Everyday spending per month (estimate)'), { exact: true }).fill('350');
    await expect(budget.getByLabel(t('Freiwillige Reserve pro Monat', 'Optional reserve per month'), { exact: true })).toBeVisible();
    await expect(forecast).toBeHidden();
    await page.screenshot({ fullPage: true, path: info.outputPath(`planning-monthly-${de ? 'de' : 'en'}-${width}.png`) });

    await savingsTool(page, 'change');
    const coach = page.getByRole('region', { name: /02 ·/ });
    await coach.getByLabel(t('Kostenänderung testen · Kosten auswählen', 'Test a cost change · choose a cost')).selectOption('internet');
    await coach.getByLabel(t('Neuer Betrag je Zahlung (0 = fällt weg)', 'New amount per payment (0 = ends)')).fill('30');
    await savingsTool(page, 'switch');
    const comparison = page.locator('[data-switch-comparison]');
    await expect(coach).toBeHidden();
    await expect(comparison.locator(':scope > summary')).toHaveCount(0);
    await comparison.getByLabel(t('Ausgabe für den Wechselvergleich', 'Cost for the switch comparison')).selectOption('internet');
    await comparison.getByLabel(t('Neuer monatlicher Preis', 'New monthly price'), { exact: true }).fill('20');
    await comparison.getByLabel(t('Einmalige Wechselgebühr', 'One-off switching fee'), { exact: true }).fill('15');
    await expect(comparison.locator('[data-switch-result]')).toBeVisible();
    await page.screenshot({ fullPage: true, path: info.outputPath(`planning-switch-${de ? 'de' : 'en'}-${width}.png`) });

    await savingsTool(page, 'annual');
    await expect(comparison).toBeHidden();
    const annual = page.locator('[data-pro-annual]');
    await annual.getByLabel(t('Abo auswählen', 'Choose subscription')).selectOption('internet');
    await annual.getByLabel(t('Angebot: voller Jahrespreis', 'Offer: full annual price')).fill('240');
    await savingsTool(page, 'reserves');
    await expect(annual).toBeHidden();
    await expect(page.locator('[data-pro-reserves]')).toContainText('Insurance');
    await savingsTool(page, 'invoices');
    await expect(page.locator('[data-pro-reserves]')).toBeHidden();
    await expect(page.locator('[data-variable-suggestions]')).toContainText(t('Noch nicht genug passende Rechnungen', 'Not enough matching invoices'));
    await savingsTool(page, 'annual');
    await expect(annual.getByLabel(t('Angebot: voller Jahrespreis', 'Offer: full annual price'))).toHaveValue('240');
    await savingsTool(page, 'switch');
    await expect(comparison.getByLabel(t('Einmalige Wechselgebühr', 'One-off switching fee'), { exact: true })).toHaveValue('15');
    await page.getByRole('group', { name: /Choose planning question|Planungsfrage wählen/ }).getByRole('button', { name: /Erreichte Ersparnis|Savings achieved/ }).click();
    await expect(page.getByRole('region', { name: /03 ·/ })).toContainText(t('Noch keine bestätigte Ersparnis', 'No confirmed savings yet'));
    await planningPeriod(page, 'forecast');
    await page.evaluate(() => { window.location.hash = 'payday-plan'; });
    await expect(page.locator('[data-planning-navigation=period] [data-planning-choice=payday]')).toHaveAttribute('aria-pressed', 'true');
    await expect(payday).toBeVisible();
    await expect(payday.getByLabel(t('Aktueller Kontostand', 'Current account balance'), { exact: true })).toHaveValue('1250');
    await planningPeriod(page, 'budget');
    await expect(budget.getByLabel(t('Alltagsausgaben pro Monat (geschätzt)', 'Everyday spending per month (estimate)'), { exact: true })).toHaveValue('350');
    await savingsTool(page, 'change');
    await expect(coach.getByLabel(t('Neuer Betrag je Zahlung (0 = fällt weg)', 'New amount per payment (0 = ends)'))).toHaveValue('30');
    expect(await page.evaluate(() => localStorage.getItem('eavesence-home-costs-v1'))).toBe(costsBefore);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ fullPage: true, path: info.outputPath(`planning-costs-${de ? 'de' : 'en'}-${width}.png`) });
  });
}
