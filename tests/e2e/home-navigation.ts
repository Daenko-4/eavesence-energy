import { expect, type Page } from '@playwright/test';

/** Use the navigation users actually see, including the mobile menu. */
export async function homeWorkspace(page: Page, destination: 'overview' | 'plan') {
  const header = page.locator('header');
  const hash = destination === 'plan' ? '#home-plan' : '#home-overview';
  const link = header.locator(`.header-navigation-link[href$="${hash}"]:visible`).first();
  if (!await link.isVisible()) {
    const menu = header.locator('[data-header-menu-button]');
    if (await menu.isVisible()) await menu.click();
    else await header.locator('a[aria-expanded]').focus();
  }
  await link.click();
  await expect(page.locator(destination === 'plan' ? '[data-home-plan-content]' : '[data-home-overview-content]')).toBeVisible();
}

/** Open a detail through the visible section row, or the setup action before it exists. */
export async function homeDetail(page: Page, section: 'budget' | 'upcoming' | 'extras' | 'costs' | 'notes') {
  const button = page.locator(`[data-home-section="${section}"]`);
  if (await button.isVisible()) {
    if (await button.getAttribute('aria-expanded') !== 'true') await button.click();
    return;
  }
  if (section === 'costs') {
    if (!await page.locator('[data-cost-manager]').isVisible()) await page.getByRole('group', { name: /^(Home actions|Aktionen für dein Zuhause)$/ }).getByRole('button', { name: /^(Add cost|Kosten hinzufügen)$/ }).click();
    return;
  }
  if (section === 'budget' && await page.locator('[data-home-monthly-budget]').isVisible()) return;
  throw new Error(`No visible navigation for My Home section: ${section}`);
}
