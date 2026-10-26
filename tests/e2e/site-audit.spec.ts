import { openCostOrganization } from './home-navigation';
import { homeDetail } from './home-navigation';
import { test, expect } from '@playwright/test';

test('all published sitemap routes respond and missing routes stay 404', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const paths = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname);
  expect(paths.length).toBeGreaterThan(60);
  for (let i = 0; i < paths.length; i += 8) {
    await Promise.all(paths.slice(i, i + 8).map(async path => {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
    }));
  }
  expect((await request.get('/not-a-real-eavesence-page')).status()).toBe(404);
});

const routes = ['/', '/de', '/calculator', '/de/rechner', '/en/devices', '/geraete', '/en/devices/kettle', '/geraete/wasserkocher', '/en/privacy', '/datenschutz', '/en/imprint', '/impressum', '/offline'];
for (const width of [390, 1365]) {
  test(`public page layouts, navigation and console at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
      await expect(page.locator('main')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBe(true);
      for (const link of await page.locator('header a, footer a').all()) {
        const href = await link.getAttribute('href');
        expect(href, `navigation at ${route}`).toBeTruthy();
      }
      await testInfo.attach(`${route.replaceAll('/', '_') || 'home'}-${width}`, { body: await page.screenshot({ fullPage: true, path: testInfo.outputPath(`audit-${width}-${route.replaceAll('/', '_') || 'root'}.png`) }), contentType: 'image/png' });
    }
    expect(errors).toEqual([]);
  });
}

for (const locale of ['en', 'de'] as const) for (const width of [320, 390, 1365]) {
  test(`home forms, shared actions and planning disclosures in ${locale} at ${width}px`, async ({ page }, testInfo) => {
    const de = locale === 'de', errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto(de ? '/de/zuhause' : '/home');
    await page.getByRole('button', { name: de ? 'Zuhause erstellen' : 'Create my home', exact: true }).click();
    const actions = page.getByRole('group', { name: de ? 'Aktionen für dein Zuhause' : 'Home actions', exact: true });
    const styles = await actions.locator('button').evaluateAll(buttons => buttons.map(button => {
      const css = getComputedStyle(button);
      return [css.fontSize, css.fontWeight, css.lineHeight, css.padding, css.borderTopWidth, css.borderRadius, button.getBoundingClientRect().height];
    }));
    expect(styles).toHaveLength(2);
    expect(styles[1]).toEqual(styles[0]);
    await page.locator('[data-header-settings]').click();
    const settings = page.locator('[data-home-settings]');
    await expect(settings.locator('input').first()).toBeFocused();
    await expect.poll(() => settings.evaluate(el => el.getBoundingClientRect().top)).toBeLessThan(300);
    await page.locator('[data-header-settings]').click();
    await expect(settings).toHaveCount(0);
    const overview = page.getByRole('region', { name: de ? 'Finanzen im Überblick' : 'Your household at a glance' });
    await expect(overview.locator('[data-home-monthly-budget] article')).toHaveCount(0);
    await expect(page.locator('[data-home-setup]')).toBeVisible();
    await expect(page.locator('[data-home-plan-content]')).toBeHidden();
    await homeDetail(page, 'costs');
    await openCostOrganization(page);await expect(page.locator('[data-home-tiles]')).toBeVisible();
    await expect(page.locator('[data-cost-area-overview] nav')).toHaveCount(0);
    const importer = page.getByRole('button', { name: de ? 'Kosten übernehmen statt abtippen' : 'Import costs instead of typing', exact: true });
    await importer.click();
    const icon = importer.locator('.site-disclosure-icon');
    await expect.poll(() => icon.evaluate(el => getComputedStyle(el).rotate)).toBe('-45deg');
    await importer.press('Enter');
    await expect.poll(() => icon.evaluate(el => getComputedStyle(el).rotate)).toBe('0deg');
    await actions.getByRole('button', { name: de ? 'Kosten hinzufügen' : 'Add cost', exact: true }).click();
    await expect(page.locator('#household-cost-name')).toBeFocused();
    const costPanel = page.locator('#household-costs');
    await costPanel.getByRole('button', { name: de ? 'Formular einklappen' : 'Collapse', exact: true }).click();
    await expect(page.locator('#household-cost-form')).toHaveCount(0);
    await page.locator('h1').click();
    await page.screenshot({ path: testInfo.outputPath(`my-home-header-${locale}-${width}.png`) });
    await testInfo.attach(`my-home-${locale}-${width}`, { body: await page.screenshot({ fullPage: true, path: testInfo.outputPath(`my-home-${locale}-${width}.png`) }), contentType: 'image/png' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}


test('language switches keep the current overview or legal page', async ({ page }) => {
  for (const [from, to] of [['/en/devices', '/geraete'], ['/geraete', '/en/devices'], ['/en/privacy', '/datenschutz'], ['/datenschutz', '/en/privacy'], ['/en/imprint', '/impressum'], ['/impressum', '/en/imprint']]) {
    await page.goto(from);
    const switcher = page.locator('[data-header-language]');
    await expect(switcher).toHaveAttribute('href', to);
    await switcher.click();
    await expect(page).toHaveURL(new RegExp(`${to}$`));
    await expect(page.locator('main h1')).toBeVisible();
  }
});
