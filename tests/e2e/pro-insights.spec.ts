import {expect,test,type Page} from '@playwright/test';
import {homeWorkspace} from './home-navigation';
async function seed(page:Page,de:boolean){
 await page.clock.setFixedTime(new Date('2026-10-18T12:00:00Z'));await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(de?'/de/zuhause':'/home');await page.getByRole('button',{name:de?'Zuhause erstellen':'Create my home',exact:true}).click();
 await page.evaluate(()=>{
  const profile=JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
  const costs=[{id:'electric',name:'Electricity',amount:80,variableAmount:true,category:'energy',frequency:'monthly',nextDueDate:'2026-01-20',updatedAt:'2026-10-18T12:00:00Z'},{id:'internet',name:'Internet',amount:40,category:'subscriptions',frequency:'monthly',nextDueDate:'2026-10-20',updatedAt:'2026-10-18T12:00:00Z'},{id:'rent',name:'Rent',amount:900,category:'housing',frequency:'monthly',nextDueDate:'2026-10-20',updatedAt:'2026-10-18T12:00:00Z'}];
  Object.assign(profile,{incomeAmount:2400,incomeFrequency:'monthly',incomeExtras:[{id:'bonus',kind:'salary14',amount:2000,month:11}],overviewReviewed:true,backupReminderDismissed:true,variableMonthly:500,planning:{cash:{balance:1000,asOf:'2026-10-18',payday:'2026-10-25',protected:100,everydayRemaining:70},actualPayments:[100,120,140].map((amount,i)=>({costId:'electric',month:`2026-0${i+7}`,date:`2026-0${i+7}-20`,amount,plannedAmount:80,frequency:'monthly',anchor:'2026-01-20',updatedAt:'2026-10-18T12:00:00Z'})),paidPayments:[{costId:'electric',month:'2026-10',date:'2026-10-20',amount:80,frequency:'monthly',anchor:'2026-01-20',paidAt:'2026-10-18T12:00:00Z'}]}});
  localStorage.setItem('eavesence-home-profile-v1',JSON.stringify(profile));localStorage.setItem('eavesence-home-costs-v1',JSON.stringify(costs));
 });await page.reload();await homeWorkspace(page,'plan');
}
for(const de of [false,true])for(const width of [320,390,1365])test(`Pro invoice suggestions, 90-day cash flow and honest switch ${de?'de':'en'} ${width}`,async({page},info)=>{
 const t=(a:string,b:string)=>de?a:b;await page.setViewportSize({width,height:900});await seed(page,de);
 const forecast=page.locator('[data-pro-forecast]');await expect(forecast).not.toHaveAttribute('open','');await forecast.locator('summary').first().click();
 await expect(forecast.locator('[data-forecast-result]')).toContainText(t('knapp ab 20. Oktober','shortfall from 20 October'));
 await expect(forecast.locator('[data-forecast-month]')).toHaveCount(4);await expect(forecast).toContainText(t('Davon Sonderzahlungen','Including extra income'));
 await forecast.getByLabel(t('Alltagsausgaben pro Monat (90-Tage-Plan)','Everyday spending per month (90-day plan)')).fill('600');
 await forecast.getByRole('button',{name:t('Alltagsschätzung speichern','Save everyday estimate'),exact:true}).click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).variableMonthly)).toBe(600);
 await forecast.scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath(`pro-90days-${de?'de':'en'}-${width}.png`)});
 await page.getByRole('group',{name:/Choose planning question|Planungsfrage wählen/}).getByRole('button',{name:/Find realistic savings|Realistisch sparen/}).click();
 const proposals=page.locator('[data-variable-suggestions]');await proposals.locator('summary').first().click();
 await expect(proposals.locator('[data-variable-proposal]')).toContainText(t('120,00','120.00'));
 const comparison=page.locator('[data-switch-comparison]');await comparison.locator('summary').first().click();
 await comparison.getByLabel(t('Ausgabe für den Wechselvergleich','Cost for the switch comparison')).selectOption('internet');
 await comparison.getByLabel(t('Neuer monatlicher Preis','New monthly price'),{exact:true}).fill('20');await comparison.getByLabel(t('Erste neue Zahlung am','First new payment on'),{exact:true}).fill('2026-10-20');
 await comparison.getByText(t('Wechselgebühr & doppelte Monate (optional)','Switching fee & overlapping months (optional)'),{exact:true}).click();
 await comparison.getByLabel(t('Einmalige Wechselgebühr','One-off switching fee'),{exact:true}).fill('60');await comparison.getByLabel(t('Alten Vertrag noch so viele Monate bezahlen','Months still paying the old contract'),{exact:true}).fill('1');
 await expect(comparison.locator('[data-switch-result]')).toContainText(t('140,00','140.00'));await expect(comparison.locator('[data-switch-result]')).toContainText(t('20. Februar 2027','20 February 2027'));
 await comparison.locator('[data-switch-result]').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath(`pro-switch-${de?'de':'en'}-${width}.png`)});
 await comparison.getByRole('button',{name:t('Vergleich merken','Save comparison'),exact:true}).click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).planning.switchPlans[0].fee)).toBe(60);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-costs-v1')!).find((c:{id:string})=>c.id==='internet').amount)).toBe(40);
 await proposals.getByRole('button',{name:t('Diesen Planbetrag übernehmen','Use this planning amount'),exact:true}).click();await expect(proposals).toContainText(t('entspricht bereits','already matches'));
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-costs-v1')!).find((c:{id:string})=>c.id==='electric').amount)).toBe(120);
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!));expect(stored.planning.actualPayments.filter((a:{estimated?:boolean})=>!a.estimated).length).toBe(3);expect(stored.savingsActions??[]).toHaveLength(0);
 await proposals.getByRole('button',{name:t('Rechnungsbeträge eintragen','Record invoice amounts'),exact:true}).click();await expect(page.locator('[data-month-checklist]').getByRole('checkbox',{name:/^Electricity ·/})).toBeChecked();
 await page.reload();await homeWorkspace(page,'plan');await page.getByRole('group',{name:/Choose planning question|Planungsfrage wählen/}).getByRole('button',{name:/Find realistic savings|Realistisch sparen/}).click();
 await comparison.locator('summary').first().click();await comparison.getByText(t('Gemerkte Wechselvergleiche','Saved switch comparisons'),{exact:false}).click();await comparison.getByRole('button',{name:t('Vergleich öffnen','Open comparison'),exact:true}).click();
 await expect(comparison.getByLabel(t('Neuer monatlicher Preis','New monthly price'),{exact:true})).toHaveValue('20');await expect(comparison.getByLabel(t('Neuer monatlicher Preis','New monthly price'),{exact:true})).toBeFocused();await expect(comparison.getByLabel(t('Einmalige Wechselgebühr','One-off switching fee'),{exact:true})).toHaveValue('60');await expect(comparison.locator('[data-switch-result]')).toContainText(t('zuerst „Bis zum Gehalt“ aktualisieren','Update Until payday first'));
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('incomplete forecasts guide to existing inputs and failed comparison writes keep the offer',async({page})=>{
 await seed(page,false);await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);p.variableMonthly=null;localStorage.setItem('eavesence-home-profile-v1',JSON.stringify(p));});await page.reload();await homeWorkspace(page,'plan');
 const f=page.locator('[data-pro-forecast]');await f.locator('summary').first().click();await expect(f.locator('[data-forecast-result]')).toHaveCount(0);
 await f.getByLabel('Everyday spending per month (90-day plan)').fill('0');await f.getByRole('button',{name:'Save everyday estimate',exact:true}).click();await expect(f.locator('[data-forecast-result]')).toBeVisible();
 await page.getByRole('group',{name:'Choose planning question'}).getByRole('button',{name:'Find realistic savings'}).click();const c=page.locator('[data-switch-comparison]');await c.locator('summary').first().click();await c.getByLabel('Cost for the switch comparison').selectOption('internet');await c.getByLabel('New monthly price',{exact:true}).fill('20');
 await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='eavesence-home-profile-v1')throw new DOMException('full','QuotaExceededError');return original.call(this,k,v);};});
 await c.getByRole('button',{name:'Save comparison',exact:true}).click();await expect(page.locator('[data-pro-insights="costs"]').getByRole('alert')).toContainText('Could not save');await expect(c.getByLabel('New monthly price',{exact:true})).toHaveValue('20');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).planning.switchPlans??[])).toHaveLength(0);
});
