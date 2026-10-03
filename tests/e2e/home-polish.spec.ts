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
    await page.goto('/home');
    for (const [path, locale] of [['/de/zuhause', 'de'], ['/home', 'en']]) {
      await page.locator('[data-header-language]').click();
      await expect(page).toHaveURL(path);
      await expect(page.locator('header .eavesence-logo-load-animation')).toHaveCount(2);
      await expect.poll(() => page.locator('html').getAttribute('data-logo-animation-locale')).toBe(locale);
      if (width >= 1024) {
        await expect(page.locator('header a[aria-expanded]').first()).toHaveAttribute('aria-expanded', 'true', { timeout: 4000 });
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
  expect(await page.locator('header .eavesence-logo-load-animation').first().evaluate(el => el.getAnimations().length)).toBe(0);
});

for (const width of [1365, 390]) {
  for (const locale of ['de', 'en'] as const) {
    test(`home disclosures and Pro pill align in ${locale} at ${width}px`, async ({ page }, info) => {
      const de = locale === 'de';
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(de ? '/de/zuhause' : '/home');
      await page.getByRole('button', { name: de ? 'Zuhause erstellen' : 'Create my home', exact: true }).click();
      await page.locator('[data-home-setup]').getByRole('button').click();
      await page.locator('#home-income-form input').fill('2400');
      await page.locator('#home-income-form button[type="submit"]').click();
      await page.locator('[data-home-setup]').getByRole('button').click();
      await page.locator('#household-cost-name').fill('Internet');
      await page.locator('#household-costs').getByLabel(de ? 'Betrag' : 'Amount', { exact: true }).fill('40');
      await page.locator('#household-costs').getByRole('button', { name: de ? 'Speichern' : 'Save', exact: true }).click();
      const payments = page.getByRole('button', { name: de ? /Zahlungen im nächsten Monat/ : /Payments next month/ });
      const summary = page.locator('summary').filter({ hasText: de ? 'Kostenbereiche organisieren' : 'Organize cost areas' });
      const textLeft = await summary.evaluate(el => {
        const range = document.createRange();
        range.selectNode(el.firstChild!);
        return range.getBoundingClientRect().left;
      });
      const paymentText = await payments.locator(':scope > span').first().boundingBox();
      expect(Math.abs(textLeft - paymentText!.x)).toBeLessThanOrEqual(1);
      const plusRight = await summary.evaluate(el => {
        const css = getComputedStyle(el);
        return el.getBoundingClientRect().right - parseFloat(css.paddingRight) - parseFloat(css.borderRightWidth);
      });
      const paymentPlus = await payments.locator(':scope > span:last-child > span:last-child').boundingBox();
      expect(Math.abs(plusRight - (paymentPlus!.x + paymentPlus!.width))).toBeLessThanOrEqual(1);
      const pro = page.getByRole('navigation', { name: de ? 'Bereich wählen' : 'Choose workspace' }).getByRole('button', { name: /Plan & save|Planen & sparen/ });
      const action = page.getByRole('group', { name: de ? 'Aktionen für dein Zuhause' : 'Home actions' }).getByRole('button').first();
      for (const property of ['borderRadius', 'fontSize']) {
        const values = await Promise.all([pro, action].map(locator => locator.evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop === 'borderRadius' ? 'border-radius' : 'font-size'), property)));
        expect(values[0]).toBe(values[1]);
      }
      expect((await pro.boundingBox())!.height).toBe((await action.boundingBox())!.height);
      await pro.click();
      await expect(pro).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('[data-home-plan-content]')).toBeVisible();
      await page.getByRole('navigation', { name: de ? 'Bereich wählen' : 'Choose workspace' }).getByRole('button', { name: de ? 'Übersicht' : 'Overview', exact: true }).click();
      await summary.scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: info.outputPath(`home-polish-${locale}-${width}.png`) });
    });
  }
}
