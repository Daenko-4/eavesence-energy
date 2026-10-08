import {expect,test} from '@playwright/test';
for(const de of [false,true])for(const width of [320,1365])test(`monthly focus and payday result states ${de?'de':'en'} ${width}`,async({page},info)=>{
 const t=(a:string,b:string)=>de?a:b;
 await page.setViewportSize({width,height:900});await page.clock.setFixedTime(new Date('2026-10-08T12:00:00Z'));await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(de?'/de/zuhause':'/home');await page.getByRole('button',{name:t('Zuhause erstellen','Create my home'),exact:true}).click();
 await page.evaluate(()=>{
  const p=JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);Object.assign(p,{incomeAmount:2400,overviewReviewed:true,backupReminderDismissed:true,planning:{cash:{balance:100,asOf:'2026-10-08',payday:'2026-10-30',protected:50,everydayRemaining:100}}});
  localStorage.setItem('eavesence-home-profile-v1',JSON.stringify(p));localStorage.setItem('eavesence-home-costs-v1',JSON.stringify([{id:'rent',name:'Rent',amount:900,category:'housing',frequency:'monthly',nextDueDate:'2026-10-10',updatedAt:'2026-10-08T00:00:00Z'},{id:'net',name:'Internet',amount:40,category:'subscriptions',frequency:'monthly',nextDueDate:'2026-10-12',updatedAt:'2026-10-08T00:00:00Z'}]));
 });await page.reload();
 const month=page.getByRole('region',{name:t('Monatscheckliste','Monthly checklist')});await expect(month.locator('[data-checklist-next]')).toContainText('Rent');await expect(page.locator('[data-home-monthly-budget]')).not.toHaveAttribute('open','');
 await month.getByRole('checkbox',{name:/^Rent ·/}).check();await expect(month.locator('[data-checklist-next]')).toContainText('Internet');await expect(month.locator('[data-checklist-paid]')).toContainText(t('900,00','900.00'));await expect(month.locator('[data-checklist-open]')).toContainText(t('40,00','40.00'));
 await expect(month).toContainText(t('1 Zahlung','1 payment'));
 await month.screenshot({path:info.outputPath(`month-focus-${de?'de':'en'}-${width}.png`)});
 await page.getByRole('navigation',{name:t('Bereich wählen','Choose workspace')}).getByRole('button',{name:/Planen & sparen|Plan & save/}).click();
 const payday=page.getByRole('region',{name:t('Dein verfügbarer Spielraum','Your available budget'),exact:true});await expect(payday.locator('[data-payday-result]')).toHaveText('—');
 await payday.getByRole('button',{name:t('Kontostand aktualisieren','Update account balance'),exact:true}).click();await expect(payday.getByLabel(t('Aktueller Kontostand','Current account balance'),{exact:true})).toBeFocused();await payday.getByRole('button',{name:t('Spielraum berechnen','Calculate available money'),exact:true}).click();
 await expect(payday.locator('h2')).toContainText(t('fehlen dir voraussichtlich','Estimated shortfall'));await expect(payday.locator('[data-payday-result]')).toContainText(t('90,00','90.00'));
 await payday.getByLabel(t('Aktueller Kontostand','Current account balance'),{exact:true}).fill('500');await payday.getByRole('button',{name:t('Spielraum berechnen','Calculate available money'),exact:true}).click();await expect(payday.locator('h2')).toContainText(t('kannst du zusätzlich ausgeben','You can spend this extra'));await expect(payday.locator('[data-payday-result]')).toContainText(t('310,00','310.00'));
 await payday.getByRole('button',{name:t('Einklappen','Collapse'),exact:true}).click();await expect(payday).toContainText(t('= Zusätzlicher Spielraum','= Extra available'));
 await payday.screenshot({path:info.outputPath(`payday-clear-${de?'de':'en'}-${width}.png`)});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
