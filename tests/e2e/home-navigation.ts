import { expect, type Page } from '@playwright/test';

/** Use the navigation users actually see, including the mobile menu. */
export async function homeWorkspace(page: Page, destination: 'overview' | 'plan') {
  const header = page.locator('header');
  const hash = destination === 'plan' ? '#home-plan' : '#home-overview';
  const link = header.locator(`a[href$="${hash}"]:visible`).first();
  if (!await link.isVisible()) {
    const menu = header.locator('[data-header-menu-button]');
    if (await menu.isVisible()) await menu.click();
    else await header.locator('a[aria-expanded]').focus();
  }
  await link.click();
  await expect(page.locator(destination === 'plan' ? '[data-home-plan-content]' : '[data-home-overview-content]')).toBeVisible();
}
