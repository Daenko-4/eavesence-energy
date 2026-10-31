import { expect, type Page } from '@playwright/test';

export async function closeSettings(page:Page) {
  const dialog=page.getByRole('dialog',{name:/^(Settings|Einstellungen)$/});
  if(await dialog.isVisible()) {
    await dialog.getByRole('button',{name:/^(Close|Schließen)$/,exact:true}).click();
    await expect(dialog).toHaveCount(0);
  }
}

/** Wait for the deep-link scroll and layout to settle before typing or clicking. */
async function settleWorkspace(page: Page, selector: string) {
  await page.locator(selector).evaluate(element => new Promise<void>(resolve => {
    let previous = "", stableFrames = 0;
    function check() {
      const rect = element.getBoundingClientRect();
      const position = [window.scrollX, window.scrollY, rect.top, rect.height].join(":");
      stableFrames = position === previous ? stableFrames + 1 : 0;
      previous = position;
      if (stableFrames >= 4) resolve();
      else requestAnimationFrame(check);
    }
    requestAnimationFrame(check);
  }));
}

/** Use the navigation users actually see, including the mobile menu. */
export async function homeWorkspace(page: Page, destination: 'overview' | 'plan') {
  await closeSettings(page);
  const header = page.locator('header');
  const hash = destination === 'plan' ? '#home-plan' : '#home-overview';
  const content = page.locator(destination === 'plan' ? '[data-home-plan-content]' : '[data-home-overview-content]');
  const initialHash = new URL(page.url()).hash;
  const linkedView = ['#home-plan', '#payday-plan', '#savings-plan'].includes(initialHash) ? 'plan' : initialHash === '#home-overview' ? 'overview' : null;
  // On reload the initial render can precede the bookmarked workspace effect.
  if (linkedView) {
    await expect(page.locator(linkedView === 'plan' ? '[data-home-plan-content]' : '[data-home-overview-content]')).toBeVisible();
    if (linkedView === destination) { await settleWorkspace(page, destination === 'plan' ? '[data-home-plan-content]' : '[data-home-overview-content]'); return; }
  } else if (await content.isVisible()) return;
  const link = header.locator(`.header-navigation-link[href$="${hash}"]:visible`).first();
  if (!await link.isVisible()) {
    const menu = header.locator('[data-header-menu-button]');
    if (await menu.isVisible()) await menu.click();
    else await header.locator('a[aria-expanded]').focus();
  }
  await link.click();
  await expect(page.locator(destination === 'plan' ? '[data-home-plan-content]' : '[data-home-overview-content]')).toBeVisible();
  await settleWorkspace(page, destination === 'plan' ? '[data-home-plan-content]' : '[data-home-overview-content]');
}

/** Open a detail through the visible section row, or the setup action before it exists. */
export async function homeDetail(page: Page, section: 'budget' | 'upcoming' | 'costs' | 'notes') {
  if(section === 'upcoming') {
    const month=page.getByRole('group',{name:/^(Choose month|Monat wählen)$/});
    await expect(month).toBeVisible();
    const reset=month.getByRole('button',{name:/^(This month|Dieser Monat)$/});
    if(await reset.isVisible() && await reset.isEnabled())await reset.click();
    await month.getByRole('button',{name:/^(Next month|Nächster Monat)$/}).click();
    await expect(page.locator('[data-home-next-month]')).toBeVisible();
    return;
  }
  if(section === 'budget'){
    const panel=page.locator('[data-home-monthly-budget]');
    await expect(panel).toBeVisible();
    if(await panel.evaluate(el=>el.tagName==='DETAILS') && await panel.getAttribute('open')===null)await panel.locator(':scope > summary').click();
    return;
  }
  const panel = page.locator(section === 'costs' ? '[data-cost-manager]' : '[data-home-memos]');
  if(await panel.isVisible()){await closeSettings(page);return;}
  if(section === 'costs' && !await page.locator('.home-month-workspace').count()) {
    await page.getByRole('group', { name: /^(Home actions|Aktionen für dein Zuhause)$/ }).getByRole('button', { name: /^(Add cost|Kosten hinzufügen)$/ }).click();
    return;
  }
  const settings=page.locator('[data-header-settings]');
  await expect(settings).toBeVisible();
  if(await settings.getAttribute('aria-expanded')!=='true')await settings.click();
  const button = page.locator(`[data-home-section="${section}"]`);
  await expect(button).toBeVisible();
  await button.click();
  return;
}

export async function planningPeriod(page: Page, period: 'payday' | 'forecast' | 'budget') {
  const question = page.getByRole('group', { name: /Choose planning question|Planungsfrage wählen/ }).getByRole('button', { name: /Until payday|Bis zum Gehalt/ });
  if (await question.getAttribute('aria-pressed') !== 'true') await question.click();
  await page.locator('[data-planning-options="period"] > summary').click();
  await page.locator(`[data-planning-navigation=period] [data-planning-choice=${period}]`).click();
  await expect(page.locator('[data-planning-options="period"]')).not.toHaveAttribute("open");
  await expect(page.locator(".planning-workspace-content :is(h2,h3):focus")).toHaveCount(1);
}

export async function savingsTool(page: Page, tool: 'change' | 'switch' | 'annual' | 'reserves' | 'invoices') {
  const question = page.getByRole('group', { name: /Choose planning question|Planungsfrage wählen/ }).getByRole('button', { name: /Find realistic savings|Realistisch sparen/ });
  if (await question.getAttribute('aria-pressed') !== 'true') await question.click();
  await page.locator('[data-planning-options="tool"] > summary').click();
  await page.locator(`[data-planning-navigation=tool] [data-planning-choice=${tool}]`).click();
  await expect(page.locator('[data-planning-options="tool"]')).not.toHaveAttribute("open");
  await expect(page.locator(".planning-workspace-content :is(h2,h3):focus")).toHaveCount(1);
}

/** Follow the same progressive form as a user; never fill a hidden step. */
export async function openPayday(page:Page){
  const panel=page.locator('[data-payday-state]:visible');
  await expect(panel).toBeVisible();
  if(await panel.getAttribute('data-editor-open')!=='true')await panel.locator('[data-payday-edit-action]').click();
}
export async function paydayStep(page:Page,target:number){
  const panel=page.locator('[data-payday-state]:visible');
  for(let attempts=0;attempts<3;attempts++){
    await settleWorkspace(page, '[data-payday-state]:visible');
    const step=Number(await panel.getAttribute('data-payday-step'));
    if(step===target)return;
    if(step>target)await panel.getByRole('button',{name:/^(Back|Zurück)$/}).click();
    else {const next=panel.getByRole('button',{name:/^(Continue|Weiter)$/});if(step===0 && !await next.isVisible())await panel.getByRole('button',{name:/^(Change dates or everyday spending|Zeitraum oder Alltag ändern)$/}).click();else await next.click();}
    await expect(panel).toHaveAttribute('data-payday-step',String(step+(step>target?-1:1)));
  }
}

export async function openCostOrganization(page:Page){
  const details=page.locator('details').filter({has:page.locator('[data-cost-area-overview]')});
  await expect(details).toBeVisible();
  if(await details.getAttribute('open')===null)await details.locator(':scope > summary').click();
}

export async function openPaydayPayments(page:Page) {
  await expect(page.locator('[data-payday-state]:visible [data-payday-payments-heading]')).toBeVisible();
}
