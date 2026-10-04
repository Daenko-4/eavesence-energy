import { test, expect } from '@playwright/test';

for (const locale of ['de', 'en'] as const) {
  test(`extra income preserves regular monthly room, editing and annual totals in ${locale}`, async ({ page }, info) => {
    const de = locale === 'de';
    await page.clock.setFixedTime(new Date('2026-10-03T12:00:00Z'));
    await page.setViewportSize({ width: de ? 390 : 1365, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(de ? '/de/zuhause' : '/home');
    await page.getByRole('button', { name: de ? 'Zuhause erstellen' : 'Create my home', exact: true }).click();
    await page.locator('[data-home-setup]').getByRole('button').first().click();
    const form = page.locator('#home-income-form');
    await form.locator('input').first().fill(de ? '2.400' : '2,400');
    await form.locator('summary').click();
    for (const [name, amount, month] of [[de ? '13. Gehalt' : '13th salary', '2400', '6'], [de ? '14. Gehalt' : '14th salary', '2000', '11'], ['Bonus', '600', '12']]) {
      await form.getByRole('button', { name: `+ ${name}`, exact: true }).click();
      const row = form.getByRole('group', { name, exact: true });
      await row.getByLabel(de ? 'Zusätzlicher Nettobetrag' : 'Extra net amount').fill(amount);
      await row.getByLabel(de ? 'Auszahlungsmonat' : 'Payment month').selectOption(month);
    }
    await expect(form.getByRole('group', { name: 'Bonus', exact: true }).getByLabel(de ? 'Jedes Jahr' : 'Every year')).not.toBeChecked();
    await form.locator('button[type="submit"]').click();
    await page.locator('[data-home-setup]').getByRole('button').first().click();
    await page.locator('#household-cost-name').fill('Internet');
    await page.locator('#household-costs').getByLabel(de ? 'Betrag' : 'Amount', { exact: true }).fill('40');
    await page.locator('#household-costs').getByRole('button', { name: de ? 'Speichern' : 'Save', exact: true }).click();
    await page.reload();
    const overview = page.getByRole('region', { name: de ? 'Finanzen im Überblick' : 'Your household at a glance' });
    await expect(overview.locator('article').first()).toContainText(de ? '2.400,00' : '2,400.00');
    await expect(overview.locator('article').nth(2)).toContainText(de ? '2.360,00' : '2,360.00');
    const summary = page.locator('[data-income-extras-summary]');
    await summary.locator('summary').click();
    await expect(summary).toContainText(de ? '33.800,00' : '33,800.00');
    await expect(summary).toContainText(de ? '2.816,67' : '2,816.67');
    await expect(summary).toContainText(de ? 'kein heute verfügbares Geld' : 'not money available today');
    const actions = page.getByRole('group', { name: de ? 'Aktionen für dein Zuhause' : 'Home actions' });
    await actions.getByRole('button', { name: de ? 'Einkommen ändern' : 'Edit income', exact: true }).click();
    if (await form.locator('details').getAttribute('open') !== null) await form.locator('summary').click();
    await form.locator('input').first().fill('2450');
    await form.locator('button[type="submit"]').click();
    await expect(overview.locator('article').nth(2)).toContainText(de ? '2.410,00' : '2,410.00');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).incomeExtras.length)).toBe(3);
    await actions.getByRole('button', { name: de ? 'Einkommen ändern' : 'Edit income', exact: true }).click();
    await form.locator('summary').click();
    await form.getByRole('button', { name: '+ Bonus', exact: true }).click();
    await form.locator('button[type="submit"]').click();
    await expect(form.getByRole('alert')).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).incomeExtras.length)).toBe(3);
    const rows = form.getByRole('group', { name: 'Bonus', exact: true });
    await rows.last().getByRole('button', { name: de ? 'Bonus entfernen' : 'Remove Bonus', exact: true }).click();
    await form.locator('button[type="submit"]').click();
    if (!de) {
      const workspace = page.getByRole('navigation', { name: 'Choose workspace' });
      await workspace.getByRole('button', { name: /Plan & save/ }).click();
      await page.getByRole('button', { name: 'Find realistic savings', exact: true }).click();
      await page.getByRole('button', { name: 'Add a monthly budget (optional)', exact: true }).click();
      await page.getByLabel('Everyday spending per month (estimate)', { exact: true }).fill('500');
      await page.getByRole('button', { name: 'Save plan', exact: true }).click();
      await page.getByText('View 12 months', { exact: true }).click();
      await expect(page.getByText('Includes €2,000.00 planned extra income', { exact: true })).toBeVisible();
      await expect(page.getByText('Includes €600.00 planned extra income', { exact: true })).toBeVisible();
      await expect(page.getByText('€3,910.00', { exact: true })).toBeVisible();
      await workspace.getByRole('button', { name: 'Overview', exact: true }).click();
    }
    await actions.getByRole('button', { name: de ? 'Einkommen ändern' : 'Edit income', exact: true }).click();
    await page.screenshot({ fullPage: true, path: info.outputPath(`income-extras-editor-${locale}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('legacy annual net stays labelled as average and switching requires actual monthly income', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/home');
  await page.getByRole('button', { name: 'Create my home', exact: true }).click();
  await page.locator('[data-home-setup]').getByRole('button').first().click();
  const form = page.locator('#home-income-form');
  await form.getByLabel('Period', { exact: true }).selectOption('yearly');
  await form.locator('input').first().fill('33600');
  await form.locator('button[type="submit"]').click();
  await page.reload();
  const overview = page.getByRole('region', { name: 'Your household at a glance' });
  await expect(overview.locator('article').first()).toContainText('Net income · monthly average');
  await expect(overview.locator('article').first()).toContainText('2,800.00');
  await expect(page.locator('[data-income-average-note]')).toHaveCount(0);
  await page.getByRole('group', { name: 'Home actions' }).getByRole('button', { name: 'Edit income', exact: true }).click();
  await expect(page.locator('[data-income-average-note]')).toContainText('not your actual monthly salary');
  await form.locator('summary').click();
  await expect(form).toContainText('not added again');
  await expect(form.getByRole('button', { name: '+ Bonus', exact: true })).toHaveCount(0);
  await form.getByLabel('Period', { exact: true }).selectOption('monthly');
  await expect(form.locator('input').first()).toHaveValue('');
  await form.locator('button[type="submit"]').click();
  await expect(form.getByRole('alert')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).incomeAmount)).toBe(33600);
  await form.locator('input').first().fill('2400');
  await form.locator('button[type="submit"]').click();
  await expect(page.locator('[data-income-average-note]')).toHaveCount(0);
  await expect(overview.locator('article').first()).toContainText('2,400.00');
});
