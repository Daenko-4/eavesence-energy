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
    await setup.getByRole('button').click();
    await page.locator('#home-income-form input').fill('2400');
    await page.locator('#home-income-form button[type="submit"]').click();
    await expect(setup).toContainText(de ? '2 · Erste Kosten hinzufügen' : '2 · Add your first cost');
    await expect(overview.locator('article').nth(2)).toContainText('—');
    await setup.getByRole('button').click();
    await page.locator('#household-cost-name').fill('Internet');
    await page.locator('#household-costs').getByLabel(de ? 'Betrag' : 'Amount', { exact: true }).fill('40');
    await page.locator('#household-costs').getByRole('button', { name: de ? 'Speichern' : 'Save', exact: true }).click();
    await expect(setup).toHaveCount(0);
    await page.reload();
    await expect(page.locator('#household-costs')).toContainText('Internet');
    await expect(overview.locator('article').nth(2)).toContainText(de ? '2.360,00' : '2,360.00');
    await expect(overview).toContainText(de ? 'kein Kontostand' : 'not your account balance');
    await expect(page.locator('[data-home-plan-content]')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ fullPage: true, path: info.outputPath(`simple-home-${locale}.png`) });
  });
}
