import { test, expect } from '@playwright/test';
for (const de of [false, true]) for (const width of [390, 1365]) {
  test(`Pro reserves, subscription preview and quick check survive reload ${de ? 'de' : 'en'} ${width}`, async ({ page }, info) => {
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
    const workspace = page.getByRole('navigation', { name: /Choose workspace|Bereich wählen/ });
    const plan = () => workspace.getByRole('button', { name: /Plan & save|Planen & sparen/ }).click();
    const questions = page.getByRole('group', { name: /Choose planning question|Planungsfrage wählen/ });
    await plan();
    const payday = page.getByRole('region', { name: /Your available budget|Dein verfügbarer Spielraum/ });
    await payday.getByRole('button', { name: /^(Quick check|Kurzer Check)/ }).click();
    await payday.getByRole('button', { name: t('Kontostand und Alltag prüfen', 'Review balance and everyday spending') }).click();
    await expect(payday.getByLabel(t('Aktueller Kontostand', 'Current account balance'), { exact: true })).toBeFocused();
    await payday.getByRole('button', { name: t('Einklappen', 'Collapse'), exact: true }).click();
    await payday.getByRole('button', { name: t('Zahlungen ansehen und abhaken', 'View and check off payments') }).click();
    await expect(payday.getByRole('checkbox', { name: /^Streaming ·/ })).toBeVisible();
    await payday.getByRole('checkbox', { name: t('Offene und bezahlte Zahlungen geprüft', 'Reviewed unpaid and paid payments'), exact: true }).check();
    await payday.getByRole('button', { name: t('Check abschließen', 'Complete check') }).click();
    await expect(payday).toContainText(t('Heute geprüft.', 'Reviewed today.'));
    await page.reload(); await plan();
    await expect(payday.getByRole('button', { name: /^(Quick check|Kurzer Check)/ })).toContainText(t('heute erledigt', 'done today'));
    await questions.getByRole('button', { name: /Find realistic savings|Realistisch sparen/ }).click();
    const tools = page.getByRole('region', { name: t('Rechnungen und Abos planen', 'Plan bills and subscriptions') });
    await tools.getByText(t('Jahreskosten rechtzeitig vorbereiten', 'Prepare for annual bills'), { exact: true }).click();
    await tools.getByLabel(t('Für diese Rechnung reserviertes Geld', 'Money reserved for this bill')).fill('200');
    await tools.getByRole('button', { name: t('Rücklage speichern', 'Save reserve') }).click();
    await expect(tools).toContainText(t('133,34', '133.34'));
    await tools.getByText(t('Monatsabo oder Jahresabo?', 'Monthly or annual subscription?'), { exact: true }).click();
    await tools.getByLabel(t('Abo auswählen', 'Choose subscription')).selectOption('stream');
    await tools.getByLabel(t('Angebot: voller Jahrespreis', 'Offer: full annual price')).fill('180');
    await tools.getByLabel(t('Jahreszahlung am', 'Annual payment on')).fill('2026-10-07');
    await expect(tools).toContainText(t('Pro Jahr günstiger um', 'Costs less per year by'));
    await expect(tools).toContainText(t('120,00', '120.00'));
    await tools.getByRole('button', { name: t('Vergleich in My Home merken', 'Save comparison to My Home') }).click();
    await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).planning.memos?.length)).toBe(1);
    await tools.screenshot({ path: info.outputPath(`pro-tools-${de ? 'de' : 'en'}-${width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.reload(); await plan();
    await questions.getByRole('button', { name: /Find realistic savings|Realistisch sparen/ }).click();
    await tools.getByText(t('Jahreskosten rechtzeitig vorbereiten', 'Prepare for annual bills'), { exact: true }).click();
    await expect(tools.getByLabel(t('Für diese Rechnung reserviertes Geld', 'Money reserved for this bill'))).toHaveValue('200');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).planning);
    expect(saved.reserves[0].dueDate).toBe('2026-12-10'); expect(saved.memos).toHaveLength(1);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('eavesence-home-costs-v1')!)[0].frequency)).toBe('monthly');
  });
}
