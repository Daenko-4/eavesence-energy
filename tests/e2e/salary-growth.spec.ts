import { expect, test } from '@playwright/test';
import { homeWorkspace, planningPeriod } from './home-navigation';

for (const locale of ['de','en']) test(`annual net salary assumptions persist, compound in forecasts and pause on salary changes ${locale}`,async({page},info)=>{
  const de=locale==='de',t=(a:string,b:string)=>de?a:b;
  await page.clock.setFixedTime(new Date('2026-11-18T12:00:00Z'));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(de?'/de/zuhause':'/home');
  await page.getByRole('button',{name:t('Zuhause erstellen','Create my home'),exact:true}).click();
  await page.evaluate(()=>{
    const p=JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
    Object.assign(p,{incomeAmount:3450,incomeFrequency:'monthly',variableMonthly:0,overviewReviewed:true,backupReminderDismissed:true,
      incomeExtras:[{id:'bonus',kind:'bonus',amount:2871,month:12}],
      planning:{cash:{balance:1000,asOf:'2026-11-18',payday:'2026-11-26',protected:0,everydayRemaining:0}}});
    localStorage.setItem('eavesence-home-profile-v1',JSON.stringify(p));
    localStorage.setItem('eavesence-home-costs-v1',JSON.stringify([{id:'rent',name:'Rent',amount:100,category:'housing',frequency:'monthly',nextDueDate:'2026-11-19',updatedAt:'2026-11-18T12:00:00Z'}]));
  });
  await page.reload();
  await homeWorkspace(page,'plan');
  await planningPeriod(page,'budget');
  const editor=page.locator('[data-salary-growth]:visible');
  await editor.locator('summary').click();
  const percent=editor.getByLabel(t('Geschätzte jährliche Netto-Erhöhung (%)','Estimated annual net salary growth (%)'));
  await expect(percent).toHaveValue('0');
  await percent.fill('101');
  const save=editor.getByRole('button',{name:t('Zukunftsannahme speichern','Save future assumption')});
  await save.click();
  await expect(editor.getByRole('alert')).toBeVisible();
  await percent.fill(de?'3,0':'3');
  await editor.getByLabel(t('Erste Erhöhung ab','First increase from'),{exact:true}).fill('2026-12');
  await expect(editor.locator('[data-salary-growth-preview]')).toContainText(de?'3.553,50':'3,553.50');
  await save.click();
  await expect(editor.locator('[data-salary-growth-active]')).toBeVisible();
  const profile=await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!));
  expect(profile.incomeAmount).toBe(3450);
  expect(profile.planning.cash.balance).toBe(1000);
  expect(profile.incomeExtras[0].amount).toBe(2871);
  expect(profile.planning.salaryGrowth).toEqual({annualPercent:3,firstMonth:'2026-12',baseIncomeMonthly:3450});
  await expect(page.locator('[data-budget-live-preview] .planning-budget-total')).toContainText(de?'3.350,00':'3,350.00');
  await page.getByText(t('12 Monate ansehen','View 12 months'),{exact:true}).click();
  await expect(page.locator('[data-projected-salary]').first()).toContainText(de?'3.553,50':'3,553.50');
  await expect(page.locator('[data-planning-budget]')).toContainText(de?'2.871,00':'2,871.00');
  await page.reload();
  await planningPeriod(page,'forecast');
  await expect(page.locator('[data-salary-growth-active]:visible')).toBeVisible();
  await expect(page.locator('[data-forecast-month]').nth(1)).toContainText(de?'6.424,50':'6,424.50');
  await page.screenshot({fullPage:true,path:info.outputPath(`salary-growth-active-${locale}.png`)});
  await page.locator('[data-header-privacy]').click();
  await expect(page.locator('[data-salary-growth-active]:visible [data-private-value]')).toHaveCSS('filter','blur(7px)');
  await page.locator('[data-header-privacy]').click();
  // A newly confirmed salary must not get the old assumed increase a second time.
  await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);p.incomeAmount=3553.5;localStorage.setItem('eavesence-home-profile-v1',JSON.stringify(p));});
  await page.reload();
  await planningPeriod(page,'forecast');
  await expect(editor).toContainText(t('Die Erhöhungsannahme pausiert','The growth assumption is paused'));
  await expect(editor.locator('[data-salary-growth-active]')).toHaveCount(0);
  await editor.locator('summary').click();
  await percent.fill('0');
  await save.click();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).planning.salaryGrowth)).toBeUndefined();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({fullPage:true,path:info.outputPath(`salary-growth-${locale}.png`)});
});
