import {test,expect,type Page} from '@playwright/test';
async function seed(page:Page,de:boolean){
 await page.clock.install({time:new Date('2026-10-04T12:00:00Z')});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(de?'/de/zuhause':'/home');
 await page.getByRole('button',{name:de?'Zuhause erstellen':'Create my home',exact:true}).click();
 await page.evaluate(()=>{
  const p=JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
  p.incomeAmount=2400;p.incomeFrequency='monthly';p.variableMonthly=500;p.overviewReviewed=true;p.backupReminderDismissed=true;
  p.planning={cash:{balance:1400,asOf:'2026-10-04',payday:'2026-10-25',protected:100,everydayRemaining:200}};
  localStorage.setItem('eavesence-home-profile-v1',JSON.stringify(p));
  const base={frequency:'monthly',updatedAt:'2026-10-04T08:00:00Z'};
  localStorage.setItem('eavesence-home-costs-v1',JSON.stringify([{...base,id:'rent',name:'Rent',amount:900,category:'housing',nextDueDate:'2026-10-01'},{...base,id:'stream',name:'Streaming',amount:18,category:'subscriptions',nextDueDate:'2026-10-04'}]));
 });await page.reload();
}
async function pro(page:Page){await page.getByRole('navigation',{name:/Choose workspace|Bereich wählen/}).getByRole('button',{name:/Plan & save|Planen & sparen/}).click();}
for(const de of [false,true])for(const width of [390,1365])test(`free overview to useful Pro answers ${de?'de':'en'} ${width}`,async({page},info)=>{
 await page.setViewportSize({width,height:900});await seed(page,de);await pro(page);
 const payday=page.getByRole('region',{name:de?'Dein verfügbarer Spielraum':'Your available budget'});
 await expect(payday).toContainText(de?'182,00':'182.00');await expect(payday).toContainText(de?'frühere Zahlungen':'earlier payments');await expect(payday).toContainText(de?'pro Tag':'per day');
 const questions=page.getByRole('group',{name:/Planungsfrage wählen|Choose planning question/});
 await questions.getByRole('button',{name:/Realistisch sparen|Find realistic savings/}).click();
 const coach=page.getByRole('region',{name:de?'02 · Wo kann ich realistisch sparen?':'02 · Where can I realistically save?'});
 await coach.getByLabel(de?'Kostenänderung testen · Kosten auswählen':'Test a cost change · choose a cost').selectOption('stream');
 await coach.getByLabel(de?'Neuer Betrag je Zahlung (0 = fällt weg)':'New amount per payment (0 = ends)').fill('0');
 await coach.getByRole('button',{name:de?'Änderung vormerken':'Save this plan',exact:true}).click();
 await expect(coach).toContainText(de?'Vorgemerktes Sparpotenzial':'Planned savings potential');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-costs-v1')!).find((c:{id:string})=>c.id==='stream').amount)).toBe(18);
 await coach.getByRole('button',{name:de?'Erreichte Ersparnis ansehen':'View achieved savings',exact:true}).click();
 const progress=page.getByRole('region',{name:de?'03 · Was habe ich tatsächlich eingespart?':'03 · What have I actually saved?'});
 await expect(progress).toContainText(de?'Noch keine bestätigte Ersparnis':'No confirmed savings yet');
 await progress.getByRole('button',{name:de?'Eine Sparmöglichkeit prüfen':'Review a savings opportunity'}).click();
 page.once('dialog',d=>void d.accept());await coach.getByRole('button',{name:de?'Umgesetzt – Kosten aktualisieren':'Done — update costs'}).click();
 await expect(coach).toContainText(de?'Umsetzung bestätigt':'Change confirmed');
 await coach.getByRole('button',{name:de?'Erreichte Ersparnis ansehen':'View achieved savings',exact:true}).click();
 await expect(progress).toContainText(de?'18,00':'18.00');await expect(progress).toContainText(de?'Zahlungstermine':'payment dates');
 await page.reload();await pro(page);await questions.getByRole('button',{name:/Erreichte Ersparnis|Savings achieved/}).click();await expect(progress).toContainText(de?'Bestätigt, Kosten aktualisiert':'Confirmed, costs updated');
 await progress.scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath(`release-pro-${de?'de':'en'}-${width}.png`)});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
for(const de of [false,true])test(`failed monthly budget write keeps draft and shows no false success ${de?'de':'en'}`,async({page})=>{
 await seed(page,de);await pro(page);await page.getByRole('group',{name:/Planungsfrage wählen|Choose planning question/}).getByRole('button',{name:/Realistisch sparen|Find realistic savings/}).click();
 await page.getByRole('button',{name:/Monatsbudget ergänzen|Add a monthly budget/}).click();
 const input=page.getByLabel(de?'Alltagsausgaben pro Monat (geschätzt)':'Everyday spending per month (estimate)',{exact:true});await input.fill(de?'1.234,50':'1,234.50');
 await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='eavesence-home-profile-v1')throw new DOMException('Storage full','QuotaExceededError');return original.call(this,key,value);};});
 await page.getByRole('button',{name:de?'Plan speichern':'Save plan',exact:true}).click();await expect(page.locator('#savings-plan').getByRole('alert')).toContainText(de?'Speichern fehlgeschlagen':'Could not save');await expect(input).toHaveValue(de?'1.234,50':'1,234.50');await expect(page.getByText(de?'Sparplan gespeichert.':'Savings plan saved.',{exact:true})).toHaveCount(0);
});
