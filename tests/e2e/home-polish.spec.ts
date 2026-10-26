import { openCostOrganization } from './home-navigation';
import { homeWorkspace } from './home-navigation';
import { test, expect } from '@playwright/test';

for (const width of [1365, 390]) {
  test(`language switch replays the header logo in both directions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      document.addEventListener('animationstart', event => {
        if (event instanceof AnimationEvent && event.animationName === 'eavesence-logo-load') {
          document.documentElement.dataset.logoAnimationLocale = document.documentElement.lang;
        }
      });
    });
    for (const [start, destinations] of [
      ['/home', [['/de/zuhause', 'de'], ['/home', 'en']]],
      ['/calculator', [['/de/rechner', 'de'], ['/calculator', 'en']]],
    ] as const) {
      await page.goto(start);
      await expect(page.locator('header .eavesence-logo-load-animation')).toHaveCount(0);
      for (const [path, locale] of destinations) {
        await page.locator('[data-header-language]').click();
        await expect(page).toHaveURL(path);
        await expect(page.locator('header .eavesence-logo-load-animation')).toHaveCount(2);
        await expect.poll(() => page.locator('html').getAttribute('data-logo-animation-locale')).toBe(locale);
        await expect(page.locator('header .navigation-indicator, header .site-disclosure-icon')).toHaveCount(0);
        await expect(page.locator('[data-header-language] [data-active="true"]')).toHaveText(locale.toUpperCase());
        if (width >= 1024) {
          await expect(page.locator('header a[aria-expanded]').first()).toHaveAttribute('aria-expanded', 'true', { timeout: 4000 });
        }
      }
    }
    // Ordinary visits still show subpage navigation immediately.
    await page.goto('/en/privacy');
    await expect(page.locator('header .eavesence-logo-load-animation')).toHaveCount(0);
  });
}

test('language intro respects reduced motion and keeps navigation available', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/home');
  await page.locator('[data-header-language]').click();
  await expect(page).toHaveURL('/de/zuhause');
  await expect(page.locator('header a[aria-expanded]').first()).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('header .eavesence-logo-load-animation')).toHaveCount(2);
  expect(await page.locator('[data-header-language]').evaluate(el=>el.getAnimations().length)).toBe(0);
  expect(await page.locator('header .eavesence-logo-load-animation').first().evaluate(el => el.getAnimations().length)).toBe(0);
});

for (const width of [1365, 390]) {
  for (const locale of ['de', 'en'] as const) {
    test(`home identity and single cost-area grid align in ${locale} at ${width}px`, async ({ page }, info) => {
      const de = locale === 'de';
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(de ? '/de/zuhause' : '/home');
      await page.getByRole('button', { name: de ? 'Zuhause erstellen' : 'Create my home', exact: true }).click();
      await page.locator('[data-home-setup]').getByRole('button').first().click();
      await page.locator('#home-income-form input').fill('2400');
      await page.locator('#home-income-form button[type="submit"]').click();
      await page.locator('[data-home-setup]').getByRole('button').first().click();
      await page.locator('#household-cost-name').fill('Internet');
      await page.locator('#household-costs').getByLabel(de ? 'Betrag' : 'Amount', { exact: true }).fill('40');
      await page.locator('#household-costs').getByRole('button', { name: de ? 'Speichern' : 'Save', exact: true }).click();
      await expect(page.getByRole('navigation', { name: /Choose workspace|Bereich wählen/ })).toHaveCount(0);
      const heading = page.locator('[data-home-heading]');
      const headingBox = (await heading.boundingBox())!;
      expect(Math.abs(headingBox.x + headingBox.width / 2 - width / 2)).toBeLessThan(2);
      await expect(page.locator('[data-header-settings]')).toHaveAccessibleName(de ? 'Einstellungen' : 'Settings');
      await expect(page.getByRole('group',{name:de?'Aktionen für dein Zuhause':'Home actions',exact:true}).getByRole('button')).toHaveCount(2);
      const settings=(await page.locator('[data-header-settings]').boundingBox())!;
      const language=(await page.locator('[data-header-language]').boundingBox())!;
      const name=(await heading.locator('h1').boundingBox())!;
      expect(settings.x+settings.width).toBeLessThanOrEqual(language.x);
      expect(Math.abs(name.x+name.width/2-width/2)).toBeLessThan(2);
      expect(headingBox.height).toBeLessThan(170);
      expect(await heading.locator('h1').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeLessThanOrEqual(32);

      await heading.screenshot({ path: info.outputPath(`home-heading-${locale}-${width}.png`) });
      await homeWorkspace(page, 'plan');
      await expect(page.locator('[data-home-heading]')).toBeHidden();
      await expect(page.locator('[data-home-plan-content]')).toBeVisible();
      await homeWorkspace(page, 'overview');
      const areaBar = page.locator('[data-cost-area-overview]');
      const tiles = areaBar.locator('[data-home-tiles]');
      await openCostOrganization(page);await expect(tiles).toBeVisible();
      await expect(areaBar.locator('nav, details')).toHaveCount(0);
      await expect(tiles.getByRole('button', { name: de ? /Neue Kachel/ : /New tile/ })).toBeVisible();
      const manager = (await page.locator('[data-cost-manager]').boundingBox())!;
      const grid = (await tiles.boundingBox())!;
      expect(grid.x - manager.x).toBeGreaterThanOrEqual(16);
      expect(manager.x + manager.width - grid.x - grid.width).toBeGreaterThanOrEqual(16);
      await tiles.scrollIntoViewIfNeeded();
      await page.screenshot({ path: info.outputPath(`cost-areas-${locale}-${width}.png`) });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: info.outputPath(`home-polish-${locale}-${width}.png`) });
    });
  }
}
