import { test, expect } from '@playwright/test';

for (const de of [false, true]) for (const width of [320, 1365]) test(`minimal header and clear payday setup ${de ? 'de' : 'en'} ${width}`, async ({ page }, info) => {
  const t = (a: string, b: string) => de ? a : b;
  await page.setViewportSize({ width, height: 940 });
  await page.clock.setFixedTime(new Date('2026-10-11T12:00:00Z'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(de ? '/de/zuhause' : '/home');
  await page.getByRole('button', { name: t('Zuhause erstellen', 'Create my home'), exact: true }).click();
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
    Object.assign(p, { incomeAmount: 2400, variableMonthly: 500, overviewReviewed: true, backupReminderDismissed: true });
    localStorage.setItem('eavesence-home-profile-v1', JSON.stringify(p));
    localStorage.setItem('eavesence-home-costs-v1', JSON.stringify([
      { id: 'rent', name: 'Rent', amount: 900, category: 'housing', frequency: 'monthly', nextDueDate: '2026-10-15', updatedAt: '2026-10-11T00:00:00Z' },
      { id: 'stream', name: 'Streaming', amount: 20, category: 'subscriptions', frequency: 'monthly', nextDueDate: '2026-10-18', updatedAt: '2026-10-11T00:00:00Z' },
    ]));
  });
  await page.reload();
  const header = page.locator('header');
  if (width < 1024) await header.getByRole('button', { name: t('Navigation öffnen', 'Open navigation') }).click();
  await header.getByRole('link', { name: /Planen & sparen|Plan & save/ }).click();
  await expect(page.locator('[data-home-plan-content]')).toBeVisible();
  if (width >= 1024) await expect(header.getByRole('link', { name: /Planen & sparen|Plan & save/ })).toHaveAttribute('aria-current', 'location');
  if (width >= 1024) {
    // The hidden animated wordmark must not intercept the first navigation link.
    await header.locator('[data-navigation-key="household"]').click({ position: { x: 22, y: 19 } });
    await expect(page.locator('[data-home-plan-content]')).toBeHidden();
    await header.getByRole('link', { name: /Planen & sparen|Plan & save/ }).click();
    await expect(page.locator('[data-home-plan-content]')).toBeVisible();
  }
  const language = header.locator('[data-header-language]');
  await expect(language).toHaveAttribute('data-active-language', de ? 'de' : 'en');
  await expect(language.locator('[data-active="true"]')).toHaveText(de ? 'DE' : 'EN');
  await expect(language.locator('svg')).toHaveCount(0);
  await expect(language).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  if (width >= 1024) await expect(header.locator('.header-navigation-links')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  if (width < 1024) {
    await header.getByRole('button', { name: t('Navigation öffnen', 'Open navigation') }).click();
    const menu = header.locator('.header-navigation-links-mobile');
    await expect(menu.locator('.navigation-indicator')).toHaveCount(4);
    await expect(menu.locator('.navigation-indicator')).toHaveText(['+', '+', '+', '+']);
    await expect(menu.locator('[aria-current] .navigation-indicator')).toHaveCSS('rotate', '-45deg');
    await expect(menu.getByRole('link', { name: /Stromkosten-Rechner|Electricity Calculator/ }).locator('.navigation-indicator')).toHaveCSS('rotate', '0deg');
    await page.screenshot({ path: info.outputPath(`header-menu-${de ? 'de' : 'en'}-${width}.png`) });
    await header.getByRole('button', { name: t('Navigation schließen', 'Close navigation') }).click();
  }
  await header.screenshot({ path: info.outputPath(`header-minimal-${de ? 'de' : 'en'}-${width}.png`) });
  if (width === 320) {
    const boxes = await header.evaluate(el => ['[data-header-menu-button]', '[data-header-mobile-logo]', '[data-header-language]'].map(s => { const r = el.querySelector(s)!.getBoundingClientRect(); return { left: r.left, right: r.right }; }));
    expect(boxes[0].right).toBeLessThan(boxes[1].left);
    expect(boxes[1].right).toBeLessThan(boxes[2].left);
  }
  const panel = page.getByRole('region', { name: t('Dein verfügbarer Spielraum', 'Your available budget'), exact: true });
  await panel.getByRole('button', { name: t('Verfügbares Geld berechnen', 'Calculate available money'), exact: true }).click();
  await panel.getByLabel(t('Aktueller Kontostand', 'Current account balance'), { exact: true }).fill('1500');
  await panel.getByLabel(t('Nächstes Gehalt am', 'Next payday'), { exact: true }).fill('2026-10-25');
  await expect(panel.locator('[data-payday-preview-bills]')).toContainText(t('920,00', '920.00'));
  await panel.getByRole('button', { name: t('Verfügbares Geld anzeigen', 'Show available money'), exact: true }).click();
  await expect(panel.getByRole('alert')).toContainText(t('Alltagsbudget', 'everyday budget'));
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).planning?.cash)).toBeUndefined();
  await panel.getByRole('button', { name: t('Vorschlag übernehmen', 'Use suggestion'), exact: true }).click();
  await expect(panel.getByLabel(t('Alltagsausgaben bis zum Gehalt', 'Everyday spending until payday'), { exact: true })).toHaveValue(t('229,98', '229.98'));
  await expect(panel.getByRole('alert')).toHaveCount(0);
  await panel.getByLabel(t('Alltagsausgaben bis zum Gehalt', 'Everyday spending until payday'), { exact: true }).fill('200');
  await panel.getByText(t('Geld als Reserve behalten (optional)', 'Keep some money in reserve (optional)'), { exact: true }).click();
  await panel.getByLabel(t('Reserve, die übrig bleiben soll (optional)', 'Money to keep in reserve (optional)'), { exact: true }).fill('100');
  const screenshotStyle = await page.addStyleTag({ content: "header{position:static!important}" });
  await panel.screenshot({ path: info.outputPath(`payday-three-steps-${de ? 'de' : 'en'}-${width}.png`) });
  await panel.getByRole('button', { name: t('Verfügbares Geld anzeigen', 'Show available money'), exact: true }).click();
  await expect(panel.locator('[data-payday-result]')).toContainText(t('280,00', '280.00'));
  await expect(panel.locator('[data-payday-form]')).toHaveCount(0);
  await expect(panel).toContainText(t('200,00', '200.00'));
  await panel.screenshot({ path: info.outputPath(`payday-simple-result-${de ? 'de' : 'en'}-${width}.png`) });
  // A cancelled date edit must not change the bill window under the saved result.
  await panel.getByRole('button', { name: t('Kontostand aktualisieren', 'Update account balance'), exact: true }).click();
  await panel.getByLabel(t('Nächstes Gehalt am', 'Next payday'), { exact: true }).fill('2026-10-17');
  await expect(panel.locator('[data-payday-preview-bills]')).toContainText(t('900,00', '900.00'));
  await panel.getByRole('button', { name: t('Einklappen', 'Collapse'), exact: true }).click();
  await panel.getByRole('button', { name: /Zahlungen bis zum Gehalt abhaken|Check off payments until payday/ }).click();
  await expect(panel.getByRole('checkbox', { name: /^Streaming ·/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await screenshotStyle.evaluate(el => { el.parentNode?.removeChild(el); });
  await header.locator('[data-header-language]').click();
  await expect(page).toHaveURL(new RegExp(`${de ? '/home' : '/de/zuhause'}#home-plan$`));
  await expect(page.locator('[data-home-plan-content]')).toBeVisible();
  await expect(language).toHaveAttribute('data-active-language', de ? 'en' : 'de');
  await expect(language.locator('[data-active="true"]')).toHaveText(de ? 'EN' : 'DE');
});

test('search and Apple icons use the current brand with crawlable canonical pages', async ({ page, request }) => {
  for (const path of ['/', '/de', '/home', '/de/zuhause', '/calculator', '/de/rechner']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(`rel="canonical" href="https://eavesence.com${path === '/' ? '' : path}"`);
    expect(html).not.toMatch(/name="robots" content="[^"]*noindex/);
    expect(html).toContain('/brand/eavesence-mark-180.png');
    expect(html).not.toContain('eavesence-icon-approved-final');
  }
  const sitemap = await request.get('/sitemap.xml');
  const xml = await sitemap.text();
  expect((xml.match(/<loc>/g) || []).length).toBe(76);
  expect(xml).not.toContain('<lastmod>');
  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toContain('Allow: /');
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest.icons.map((i: { src: string }) => i.src)).toEqual(['/brand/eavesence-mark-192.png', '/brand/eavesence-mark-512.png']);
  for (const path of ['/favicon.ico', '/icon.png', '/apple-touch-icon.png', '/brand/eavesence-mark-96.png', '/brand/eavesence-mark-180.png']) expect((await request.get(path)).status()).toBe(200);
  await page.goto('/');
  const brand = JSON.parse(await page.locator('script[type="application/ld+json"]').first().textContent() || '{}');
  expect(brand['@graph'].find((v: { '@type': string }) => v['@type'] === 'Organization').logo.url).toBe('https://eavesence.com/brand/eavesence-mark-512.png');
});
