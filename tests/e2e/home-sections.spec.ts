import { expect, test, type Page } from '@playwright/test';
import { homeDetail } from './home-navigation';

async function seed(page: Page, de: boolean) {
  await page.clock.setFixedTime(new Date('2026-10-19T12:00:00Z'));
  await page.goto(de ? '/de/zuhause' : '/home');
  await page.getByRole('button', { name: de ? 'Zuhause erstellen' : 'Create my home', exact: true }).click();
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
    Object.assign(p, {
      incomeAmount: 2400, incomeFrequency: 'monthly', overviewReviewed: true, backupReminderDismissed: true,
      incomeExtras: [{ id: 'salary13', kind: 'salary13', amount: 2000, month: 11 }],
      planning: { memos: [{ id: 'review', text: 'Review annual subscriptions', date: '2026-10-19', done: false, updatedAt: '2026-10-19T12:00:00Z' }] },
    });
    localStorage.setItem('eavesence-home-profile-v1', JSON.stringify(p));
    localStorage.setItem('eavesence-home-costs-v1', JSON.stringify([
      { id: 'internet', name: 'Internet', amount: 40, frequency: 'monthly', category: 'subscriptions', nextDueDate: '2026-10-19', updatedAt: '2026-10-19T12:00:00Z' },
    ]));
  });
  await page.reload();
}

for (const de of [false, true]) for (const width of [320, 390, 1365]) {
  test(`one home detail at a time and shared monthly review ${de ? 'de' : 'en'} ${width}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seed(page, de);
    const nav = page.locator('[data-home-section-navigation]');
    const panels = page.locator('[id^="home-detail-"]:visible');
    await expect(nav.getByRole('button')).toHaveCount(5);
    await expect(nav.locator('[aria-expanded=true]')).toHaveCount(0);
    await expect(panels).toHaveCount(0);
    await expect(nav.locator('[data-home-section=notes]')).toContainText('1');
    await page.screenshot({ fullPage: true, path: info.outputPath(`home-row-closed-${de ? 'de' : 'en'}-${width}.png`) });

    await homeDetail(page, 'budget');
    await expect(panels).toHaveCount(1);
    await expect(page.locator('[data-home-monthly-budget] article').last()).toContainText(de ? '2.360,00' : '2,360.00');
    await homeDetail(page, 'upcoming');
    await expect(page.locator('[data-home-monthly-budget]')).toBeHidden();
    await expect(panels).toHaveCount(1);
    await expect(page.locator('#home-detail-upcoming')).toContainText('Internet');
    await homeDetail(page, 'extras');
    await expect(panels).toHaveCount(1);
    await expect(page.locator('#home-detail-extras')).toContainText(de ? '30.800,00' : '30,800.00');
    await expect(page.locator('#home-detail-upcoming')).toBeHidden();

    const notes = page.locator('[data-home-memos]');
    await homeDetail(page, 'notes');
    await notes.getByRole('button', { name: de ? 'Notiz hinzufügen' : 'Add note', exact: true }).click();
    const draft = notes.getByLabel(de ? 'Notiz' : 'Note', { exact: true });
    await draft.fill('Keep this draft while reviewing costs');
    await homeDetail(page, 'costs');
    await expect(notes).toBeHidden();
    await expect(panels).toHaveCount(1);
    await expect(page.locator('#household-costs')).toContainText('Internet');
    await homeDetail(page, 'notes');
    await expect(draft).toHaveValue('Keep this draft while reviewing costs');
    await nav.locator('[data-home-section=notes]').press('Enter');
    await expect(panels).toHaveCount(0);
    const budgetButton = nav.locator('[data-home-section=budget]');
    await budgetButton.focus(); await budgetButton.press('Space');
    await expect(budgetButton).toHaveAttribute('aria-expanded', 'true');
    await expect(panels).toHaveCount(1);
    await page.screenshot({ fullPage: true, path: info.outputPath(`home-row-budget-${de ? 'de' : 'en'}-${width}.png`) });

    const list = page.locator('[data-month-checklist]');
    const toggle = list.getByRole('button', { name: de ? 'Zahlungen & Monatsrückblick' : 'Payments & monthly review', exact: true });
    const review = list.locator('[data-month-review]');
    await expect(review).toBeHidden();
    await toggle.click();
    await expect(review).toBeVisible();
    await list.getByRole('checkbox', { name: /^Internet ·/ }).check();
    await expect(review.getByRole('button', { name: de ? 'Monat abschließen' : 'Close month', exact: true })).toBeEnabled();
    await toggle.click(); await expect(review).toBeHidden();
    await toggle.click(); await expect(list.getByRole('checkbox', { name: /^Internet ·/ })).toBeChecked();
    await list.screenshot({ path: info.outputPath(`payments-and-review-${de ? 'de' : 'en'}-${width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('header .navigation-pro-label')).toHaveCount(0);
    await page.reload();
    await expect(nav.locator('[aria-expanded=true]')).toHaveCount(0);
    await expect(review).toBeHidden();
    await toggle.click(); await expect(list.getByRole('checkbox', { name: /^Internet ·/ })).toBeChecked();
  });
}

test('section indicators animate in both directions and respect reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await seed(page, false);
  const button = page.locator('[data-home-section=budget]');
  const icon = button.locator('.site-disclosure-icon');
  const duration = await icon.evaluate(el => parseFloat(getComputedStyle(el).transitionDuration));
  expect(duration).toBeGreaterThanOrEqual(.3);
  await button.click();
  await expect(icon).toHaveCSS('transform', 'matrix(0.707107, -0.707107, 0.707107, 0.707107, 0, 0)');
  await button.click();
  await expect(icon).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(icon).toHaveCSS('transition-duration', '0s');
});
