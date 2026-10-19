import { expect, test, type Page } from '@playwright/test';
import { homeWorkspace, homeDetail } from './home-navigation';

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
    await homeDetail(page, 'budget');
    await expect(budget.locator('article').nth(2)).toHaveCSS('background-color', 'rgb(36, 39, 44)');
    await expect(budget.locator('article').nth(2)).toContainText(de ? '2.360,00' : '2,360.00');
    await expect(page.locator('[data-cost-manager]')).toBeHidden();
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
  await expect(page.locator('[data-cost-manager]')).toBeVisible();
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

for (const de of [false, true]) {
  test(`settings confirmation expires, resets on another save and keeps errors visible ${de ? 'de' : 'en'}`, async ({ page }) => {
    await seed(page, de);
    await page.clock.install({ time: new Date('2026-10-13T12:00:00Z') });
    const settingsButton = page.locator('[data-home-identity]').getByRole('button');
    const settings = page.locator('[data-home-settings]');
    const save = settings.getByRole('button', { name: de ? 'Einstellungen speichern' : 'Save settings', exact: true });
    const notice = page.locator('[data-home-notice]');
    await settingsButton.click();
    await expect(settings.getByRole('slider')).toHaveCount(0);
    await settings.locator('input').first().fill('First home');
    await save.click();
    await expect(notice).toHaveText(de ? 'Gespeichert' : 'Saved');
    await page.clock.fastForward(2000);
    await settingsButton.click();
    await settings.locator('input').first().fill('Second home');
    await save.click();
    await page.clock.fastForward(1500);
    await expect(notice).toBeVisible();
    await page.clock.fastForward(2000);
    await expect(notice).toHaveCount(0);
    await page.reload();
    await expect(page.locator('[data-home-heading] h1')).toHaveText('Second home');
    await settingsButton.click();
    await settings.locator('input').first().fill('Failed home');
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'eavesence-home-profile-v1') throw new DOMException('Storage full', 'QuotaExceededError');
        original.call(this, key, value);
      };
      Reflect.set(window, 'restoreTestStorage', () => { Storage.prototype.setItem = original; });
    });
    await save.click();
    await expect(notice).toHaveAttribute('role', 'alert');
    await page.clock.fastForward(5000);
    await expect(notice).toBeVisible();
    await expect(settings).toBeVisible();
    await expect(page.locator('[data-home-heading] h1')).toHaveText('Second home');
    await page.evaluate(() => { const restore = Reflect.get(window, 'restoreTestStorage') as () => void; restore(); });
    await save.click();
    await expect(page.locator('[data-home-heading] h1')).toHaveText('Failed home');
    await expect(notice).toHaveAttribute('role', 'status');
    await page.clock.fastForward(3100);
    await expect(notice).toHaveCount(0);
  });

  for (const width of [320, 1365]) {
    test(`cost and device panels have breathing room and the electricity goal saves independently ${de ? 'de' : 'en'} ${width}`, async ({ page }, info) => {
      const t = (a: string, b: string) => de ? a : b;
      await page.setViewportSize({ width, height: 900 });
      await seed(page, de);
      await page.evaluate(() => {
        const profile = JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
        profile.savingsGoalPercent = 42;
        localStorage.setItem('eavesence-home-profile-v1', JSON.stringify(profile));
        localStorage.setItem('eavesence-home-tiles-v1', JSON.stringify([
          { id: 'default-costs', kind: 'costs', title: null },
          { id: 'energy', kind: 'energy', title: null },
        ]));
        localStorage.setItem('eavesence-saved-devices-v1', JSON.stringify([
          { id: 'fridge', device: 'Kühlschrank', customDeviceName: '', mode: 'estimate', currency: 'EUR', price: .3, watts: 80, minutesPerUse: 1440, usesPerWeek: 7, estimatedKwhPerUse: 1, measuredKwhPerUse: 0, yearlyKwh: 360, yearlyCost: 108, monthlyCost: 9, updatedAt: '2026-10-13T12:00:00Z' },
          { id: 'washer', device: 'Waschmaschine', customDeviceName: '', mode: 'estimate', currency: 'EUR', price: .3, watts: 2000, minutesPerUse: 60, usesPerWeek: 3, estimatedKwhPerUse: 1, measuredKwhPerUse: 0, yearlyKwh: 240, yearlyCost: 72, monthlyCost: 6, updatedAt: '2026-10-13T12:00:00Z' },
        ]));
        localStorage.setItem('eavesence-home-history-v1', JSON.stringify([
          { month: '2026-10', kwh: 210, cost: 63, updatedAt: '2026-10-13T12:00:00Z' },
          { month: '2026-09', kwh: 200, cost: 60, updatedAt: '2026-10-13T12:00:00Z' },
        ]));
      });
      await page.reload();
      await page.clock.install({ time: new Date('2026-10-13T12:00:00Z') });
      const costsBefore = await page.evaluate(() => localStorage.getItem('eavesence-home-costs-v1'));
      const manager = page.locator('[data-cost-manager]');
      await homeDetail(page, 'costs');
      const assertInset = async (selector: string) => {
        const outer = (await manager.boundingBox())!;
        const inner = (await page.locator(selector).boundingBox())!;
        expect(inner.x - outer.x).toBeGreaterThanOrEqual(16);
        expect(outer.x + outer.width - inner.x - inner.width).toBeGreaterThanOrEqual(16);
      };
      await assertInset('#household-costs');
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: info.outputPath(`inset-costs-${de ? 'de' : 'en'}-${width}.png`), fullPage: true });
      const energyButton = page.locator('[data-cost-area-overview] nav').getByRole('button', { name: t('Strom & Geräte', 'Electricity & devices'), exact: true });
      await energyButton.click();
      await assertInset('#home-devices');
      const goal = page.locator('[data-electricity-goal]');
      const slider = goal.getByRole('slider');
      await expect(slider).toBeVisible();
      await expect(slider).toHaveValue('42');
      const calculator = page.getByRole('button', { name: /Stromkosten-Rechner|Electricity Calculator/ });
      await expect(calculator).toHaveAttribute('aria-expanded', 'false');
      await slider.focus();
      for (let i = 0; i < 17; i++) await slider.press('ArrowLeft');
      await expect(slider).toHaveValue('25');
      await expect(goal).toContainText(t('3,75', '3.75'));
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).savingsGoalPercent)).toBe(25);
      await page.locator('[data-home-identity]').getByRole('button').click();
      const settings = page.locator('[data-home-settings]');
      await settings.locator('input').first().fill('Pending home');
      await settings.locator('select').selectOption('CHF');
      await calculator.click();
      await page.getByRole('button', { name: t('Jahresrechnung', 'Yearly bill'), exact: true }).click();
      const annualBill = page.getByLabel(t('Bezahlter Jahresbetrag', 'Total paid for the year'), { exact: true });
      const annualKwh = page.getByLabel(t('Verbrauch laut Rechnung', 'Consumption on the bill'), { exact: true });
      await annualBill.fill('1200');
      await annualKwh.fill('4000');
      const priceEstimate = page.locator('[aria-labelledby="electricity-basis-title"]').getByText(/Persönlicher Gesamtpreis|Your all-in price/);
      await expect(priceEstimate).toContainText('€');
      await expect(priceEstimate).not.toContainText('CHF');
      await annualKwh.fill('');
      await slider.press('ArrowRight');
      await expect(settings.locator('input').first()).toHaveValue('Pending home');
      await expect(settings.locator('select')).toHaveValue('CHF');
      await expect(annualBill).toHaveValue('1200');
      await expect(annualKwh).toHaveValue('');
      const saveEnergy = page.getByRole('button', { name: t('Strombasis speichern', 'Save electricity basis'), exact: true });
      await saveEnergy.click();
      const energyNotice = page.locator('[data-energy-notice]');
      await expect(energyNotice).toHaveAttribute('role', 'alert');
      await page.clock.fastForward(5000);
      await expect(energyNotice).toBeVisible();
      await settings.getByRole('button', { name: t('Einstellungen speichern', 'Save settings'), exact: true }).click();
      await expect(page.locator('[data-home-heading] h1')).toHaveText('Pending home');
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).electricityInputMode)).toBe('price');
      await annualKwh.fill('4000');
      await saveEnergy.click();
      await expect(energyNotice).toHaveAttribute('role', 'status');
      await page.clock.fastForward(3100);
      await expect(energyNotice).toHaveCount(0);
      await page.reload();
      await homeDetail(page, 'costs');
      await energyButton.click();
      await expect(slider).toHaveValue('26');
      const profile = await page.evaluate(() => JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!));
      expect(profile.name).toBe('Pending home');
      expect(profile.currency).toBe('CHF');
      expect(profile.electricityPrice).toBe(.3);
      expect(profile.electricityInputMode).toBe('annual-bill');
      expect(await page.evaluate(() => localStorage.getItem('eavesence-home-costs-v1'))).toBe(costsBefore);
      await assertInset('#home-devices');
      await assertInset('[aria-labelledby="energy-details-title"]');
      for (const total of await page.locator('#home-devices [data-device-total]').all()) {
        const readable = await total.evaluate(el => {
          const label = el.querySelector('span')!;
          const value = el.querySelector('.text-right span')!;
          const textBox = (node: Element) => { const range = document.createRange(); range.selectNodeContents(node); return range.getBoundingClientRect(); };
          const a = textBox(label), b = textBox(value);
          return a.right <= b.left || a.bottom <= b.top || b.bottom <= a.top;
        });
        expect(readable).toBe(true);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: info.outputPath(`inset-energy-${de ? 'de' : 'en'}-${width}.png`), fullPage: true });
      await page.getByRole('button', { name: /Monatswerte & Verlauf|Monthly values & history/ }).click();
      await expect(page.locator('[data-monthly-history-entry]')).toHaveCount(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: info.outputPath(`inset-history-${de ? 'de' : 'en'}-${width}.png`), fullPage: true });
    });
  }
}

for (const de of [false, true]) for (const width of [320,390,1365]) test(`connected Pro journey preserves proposals and counts savings on payment dates ${de?'de':'en'} ${width}`, async({page},info)=>{
  const t=(a:string,b:string)=>de?a:b;
  await page.setViewportSize({width,height:900});await seed(page,de);
  await page.evaluate(()=>{
    const p=JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
    p.planning={cash:{balance:1000,asOf:'2026-10-13',payday:'2026-10-31',protected:100,everydayRemaining:200}};
    localStorage.setItem('eavesence-home-profile-v1',JSON.stringify(p));
  });await page.reload();await homeWorkspace(page,'plan');
  await page.getByRole('button',{name:t('Nächster Schritt: Kosten senken','Next step: lower a cost'),exact:true}).click();
  const coach=page.getByRole('region',{name:t('02 · Wo kann ich realistisch sparen?','02 · Where can I realistically save?')});
  await coach.getByLabel(t('Kostenänderung testen · Kosten auswählen','Test a cost change · choose a cost')).selectOption('internet');
  await coach.getByLabel(t('Neuer Betrag je Zahlung (0 = fällt weg)','New amount per payment (0 = ends)')).fill('30');
  await expect(coach.locator('[data-pro-payday-impact]')).toContainText(t('660,00','660.00'));
  await expect(coach.locator('[data-pro-payday-impact]')).toContainText(t('670,00','670.00'));
  await coach.locator('[data-pro-payday-impact]').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath(`connected-pro-preview-${de?'de':'en'}-${width}.png`)});
  await coach.getByRole('button',{name:t('Änderung vormerken','Save this plan'),exact:true}).click();
  const plans=coach.locator('[data-savings-changes]');
  await expect(plans).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-costs-v1')!)[0].amount)).toBe(40);
  await coach.getByRole('button',{name:t('Vorgemerkte Änderung prüfen','Review planned change'),exact:true}).click();
  await expect(plans).toBeVisible();
  await page.screenshot({path:info.outputPath(`connected-pro-action-${de?'de':'en'}-${width}.png`)});
  page.once('dialog',d=>void d.accept());await plans.getByRole('button',{name:t('Umgesetzt – Kosten aktualisieren','Done — update costs'),exact:true}).click();
  await coach.getByRole('button',{name:t('Ergebnis ansehen','See the result'),exact:true}).click();
  await expect(page.locator('#home-plan h1')).toBeFocused();
  const progress=page.getByRole('region',{name:t('03 · Was habe ich tatsächlich eingespart?','03 · What have I actually saved?')});
  await expect(progress).toContainText(t('0,00','0.00'));await expect(progress).toContainText(t('19. Oktober','19 October'));
  await progress.getByRole('button',{name:t('Geld bis zum Gehalt neu prüfen','Review your money until payday'),exact:true}).click();
  await expect(page.locator('[data-payday-state]')).toHaveAttribute('data-payday-state','stale');
  await expect(page.locator('[data-payday-result]')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
