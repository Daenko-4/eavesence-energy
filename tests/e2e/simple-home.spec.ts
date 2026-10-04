import { test, expect } from '@playwright/test';

for (const locale of ['de', 'en'] as const) {
  test(`core setup follows income then costs and survives reload in ${locale}`, async ({ page }, info) => {
    const de = locale === 'de';
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(de ? '/de/zuhause' : '/home');
    await page.getByRole('button', { name: de ? 'Zuhause erstellen' : 'Create my home', exact: true }).click();
    const setup = page.locator('[data-home-setup]');
    const overview = page.getByRole('region', { name: de ? 'Finanzen im Überblick' : 'Your household at a glance' });
    await expect(setup).toContainText(de ? '1 · Einkommen eintragen' : '1 · Add your income');
    await expect(page.locator('[data-home-plan-content]')).toBeHidden();
    await expect(page.locator('#household-costs')).toHaveCount(0);
    await setup.getByRole('button').first().click();
    await page.locator('#home-income-form input').fill('2400');
    await page.locator('#home-income-form button[type="submit"]').click();
    await expect(setup).toContainText(de ? '2 · Erste Kosten hinzufügen' : '2 · Add your first cost');
    await expect(overview.locator('article').nth(2)).toContainText('—');
    await setup.getByRole('button').first().click();
    await page.locator('#household-cost-name').fill('Internet');
    await page.locator('#household-costs').getByLabel(de ? 'Betrag' : 'Amount', { exact: true }).fill('40');
    await page.locator('#household-costs').getByRole('button', { name: de ? 'Speichern' : 'Save', exact: true }).click();
    await expect(setup).toHaveCount(0);
    await expect(page.locator('[data-home-review]')).toContainText(de ? '3 · Deinen Überblick prüfen' : '3 · Check your overview');
    await page.reload();
    await page.locator('[data-cost-manager] > summary').click();
    await expect(page.locator('#household-costs')).toContainText('Internet');
    await expect(overview.locator('article').nth(2)).toContainText(de ? '2.360,00' : '2,360.00');
    await expect(overview).toContainText(de ? 'kein Kontostand' : 'not your account balance');
    await expect(page.locator('[data-home-plan-content]')).toBeHidden();
    await expect(page.locator('[data-home-review]')).toBeVisible();
    await page.locator('[data-home-review]').getByRole('button',{name:de ? 'Übersicht geprüft' : 'Overview checked',exact:true}).click();
    await expect(page.locator('[data-home-review]')).toHaveCount(0);
    const download = page.waitForEvent('download');
    await page.locator('[data-home-overview-content]').getByRole('button',{name:de ? 'Sicherung exportieren' : 'Export backup',exact:true}).click();
    expect((await download).suggestedFilename()).toMatch(/^eavesence-home-.*\.json$/);
    await page.reload();
    await expect(page.locator('[data-home-review]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ fullPage: true, path: info.outputPath(`simple-home-${locale}.png`) });
  });
}

test('editing income from a bookmarked plan stays in overview after saving', async ({ page }) => {
  await page.goto('/home');
  await page.getByRole('button', { name: 'Create my home', exact: true }).click();
  await page.goto('/home#home-plan');
  await expect(page.locator('[data-home-plan-content]')).toBeVisible();
  await page.getByRole('group', { name: 'Home actions' }).getByRole('button', { name: 'Add income', exact: true }).click();
  await page.locator('#home-income-form input').fill('2000');
  await page.locator('#home-income-form button[type="submit"]').click();
  await expect(page.locator('[data-home-overview-content]')).toBeVisible();
  await expect(page.locator('[data-home-plan-content]')).toBeHidden();
  await expect(page.getByRole('region', { name: 'Your household at a glance' })).toContainText('€2,000.00');
});
