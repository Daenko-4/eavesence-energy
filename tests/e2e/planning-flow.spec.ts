import { openPayday, paydayStep } from './home-navigation';
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
    await expect.poll(()=>page.locator(".planning-workspace-content").evaluate(panel=>panel.getBoundingClientRect().top-document.querySelector(".pro-question-navigation")!.getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(8);
    expect(Math.abs(navigation.x-surface.x)).toBeLessThan(1);
    expect(Math.abs(navigation.width-surface.width)).toBeLessThan(1);
    const title=(await page.locator('[data-home-plan-content] h1').boundingBox())!;
    expect(Math.abs(title.x+title.width/2-(navigation.x+navigation.width/2))).toBeLessThan(1);
    const primaryChoices=page.locator('.pro-question-navigation');
    await expect(primaryChoices.locator('.site-disclosure-icon')).toHaveCount(3);
    const styles=await page.locator('[data-home-section-navigation] > button, .pro-question-navigation > button').evaluateAll(buttons=>buttons.map(button=>{const style=getComputedStyle(button);return [style.fontSize,style.fontWeight,style.minHeight,style.borderRadius];}));
    for(const style of styles)expect(style).toEqual(styles[0]);
    const moneyHeading=page.locator('[data-plan-money-heading]');
    await expect(moneyHeading).toHaveText(t('Dein Geld planen','Plan your money'));
    await expect(page.locator('[data-pro-overview]')).toContainText(t('Aus My Home übernommen', 'Already included from My Home'));
    await expect(page.locator('[data-pro-overview]')).toContainText(t('2.400,00', '2,400.00'));
    await expect(page.locator('[data-pro-overview]')).toContainText(t('90,00', '90.00'));
    await expect(page.locator('[data-planning-navigation="period"]')).toBeHidden();
    await expect(page.locator('[data-planning-options="period"]')).not.toHaveAttribute('open');
    const savedBudgetBefore = await page.evaluate(() => JSON.parse(localStorage.getItem("eavesence-home-profile-v1")!).variableMonthly);
    const costsBefore = await page.evaluate(() => localStorage.getItem('eavesence-home-costs-v1'));
    const payday = page.locator('[data-payday-state]');
    await openPayday(page);
    await payday.getByLabel(t('Aktueller Kontostand', 'Current account balance'), { exact: true }).fill('1250');
    await paydayStep(page,1);await payday.getByRole('button',{name:t('In 14 Tagen','In 14 days'),exact:true}).click();
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
    await expect(budget.locator('[data-budget-live-preview]')).toContainText(t('1.960,00','1,960.00'));
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).variableMonthly)).toBe(savedBudgetBefore);
    await expect(budget.getByLabel(t('Freiwillige Reserve pro Monat', 'Optional reserve per month'), { exact: true })).toBeVisible();
    await expect(forecast).toBeHidden();
    await page.screenshot({ fullPage: true, path: info.outputPath(`planning-monthly-${de ? 'de' : 'en'}-${width}.png`) });

    await savingsTool(page, 'change');
    await expect(primaryChoices.getByRole('button',{name:t('Realistisch sparen','Find realistic savings')}).locator('.site-disclosure-icon')).toHaveCSS('transform','matrix(0.707107, -0.707107, 0.707107, 0.707107, 0, 0)');
    await expect(primaryChoices.getByRole('button',{name:t('Geld planen','Plan money')}).locator('.site-disclosure-icon')).toHaveCSS('transform','matrix(1, 0, 0, 1, 0, 0)');
    await expect(page.locator('[data-planning-navigation="tool"]')).toBeHidden();
    const coach = page.getByRole('region', { name: /02 ·/ });
    await coach.getByLabel(t('Kostenänderung testen · Kosten auswählen', 'Test a cost change · choose a cost')).selectOption('internet');
    await coach.getByLabel(t('Neuer Betrag je Zahlung (0 = fällt weg)', 'New amount per payment (0 = ends)')).fill('30');
    const costReview = (await page.locator('#savings-plan').boundingBox())!;
    expect(Math.abs(costReview.x + costReview.width / 2 - (surface.x + surface.width / 2))).toBeLessThan(1);
    const contentWidth = await page.locator('.planning-workspace-content').evaluate(element => {
      const style = getComputedStyle(element);
      return element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    });
    expect(Math.abs(costReview.width - contentWidth)).toBeLessThan(1);
    const costChoice = (await coach.locator('.savings-choice').boundingBox())!;
    const costEditor = (await coach.locator('.savings-edit').boundingBox())!;
    if (width >= 1024) {
      expect(Math.abs(costChoice.y - costEditor.y)).toBeLessThan(1);
      expect(costEditor.x).toBeGreaterThan(costChoice.x + costChoice.width);
    } else {
      expect(costEditor.y).toBeGreaterThanOrEqual(costChoice.y + costChoice.height);
    }

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
    await expect(page.locator('[data-planning-options="period"]')).not.toHaveAttribute("open");
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
