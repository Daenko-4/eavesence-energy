import {test,expect} from '@playwright/test';
for(const locale of ['de','en'] as const)for(const width of [320,1365])test(`one-off income quick entry, monthly attribution, editing and persistence ${locale} ${width}`,async({page},info)=>{
 const de=locale==='de',t=(a:string,b:string)=>de?a:b;
 await page.clock.setFixedTime(new Date('2026-11-01T12:00:00Z'));await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(de?'/de/zuhause':'/home');
 await page.getByRole('button',{name:t('Zuhause erstellen','Create my home'),exact:true}).click();
 await page.locator('[data-home-setup]').getByRole('button').first().click();
 const income=page.locator('#home-income-form');await income.locator('input').first().fill('2400');await income.locator('button[type=submit]').click();
 await page.locator('[data-home-setup]').getByRole('button').first().click();await page.locator('#household-cost-name').fill('Internet');
 await page.locator('#household-costs').getByLabel(t('Betrag','Amount'),{exact:true}).fill('40');await page.locator('#household-costs').getByRole('button',{name:t('Speichern','Save'),exact:true}).click();
 const open=()=>page.getByRole('button',{name:t('Zusätzliche Einnahme erfassen','Record additional income'),exact:true}).click();
 await open();const dialog=page.getByRole('dialog');await expect(dialog.getByLabel(t('Datum','Date'),{exact:true})).toHaveValue('2026-11-01');
 await dialog.getByLabel(t('Betrag','Amount')+' (EUR)',{exact:true}).fill('500');
 if(!de&&width===1365){
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='eavesence-home-profile-v1')throw new DOMException('Full','QuotaExceededError');original.call(this,key,value);};(window as unknown as {restoreIncomeStorage:()=>void}).restoreIncomeStorage=()=>{Storage.prototype.setItem=original;};});
  await dialog.getByRole('button',{name:'Save income entry',exact:true}).click();await expect(dialog.getByRole('alert')).toContainText('Your entries have been kept');await expect(dialog.getByLabel('Amount (EUR)',{exact:true})).toHaveValue('500');
  await page.evaluate(()=>(window as unknown as {restoreIncomeStorage:()=>void}).restoreIncomeStorage());
 }
 await dialog.getByRole('button',{name:t('Einnahme speichern','Save income entry'),exact:true}).click();
 await expect(dialog).not.toBeVisible();const cards=page.locator('[data-home-monthly-budget]');await expect(cards.locator('[data-home-kpi=income]')).toContainText(de?'2.900,00':'2,900.00');await expect(cards.locator('[data-home-kpi=remaining]')).toContainText(de?'2.860,00':'2,860.00');
 await page.reload();await open();await dialog.getByRole('button',{name:t('Bearbeiten','Edit'),exact:true}).click();
 await dialog.getByLabel(t('Bezeichnung (optional)','Description (optional)'),{exact:true}).fill('Verkauf auf eBay');await dialog.getByLabel(t('Datum','Date'),{exact:true}).fill('2026-12-02');await expect(dialog.getByRole('checkbox')).toBeChecked();await dialog.getByRole('button',{name:t('Einnahme speichern','Save income entry'),exact:true}).click();
 await expect(cards.locator('[data-home-kpi=income]')).toContainText(de?'2.900,00':'2,900.00');
 await page.getByRole('button',{name:t('Vorheriger Monat','Previous month'),exact:true}).click();await expect(cards.locator('[data-home-kpi=income]')).toContainText(de?'2.400,00':'2,400.00');
 await open();await dialog.getByRole('button',{name:t('Heute erhalten','Received today'),exact:true}).click();await expect(dialog.getByText('Verkauf auf eBay',{exact:true})).toBeVisible();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!));expect(saved.incomeAmount).toBe(2400);expect(saved.additionalIncome).toHaveLength(1);expect(saved.additionalIncome[0]).toMatchObject({name:'Verkauf auf eBay',date:'2026-11-01',status:'received',amount:500});
 await page.screenshot({path:info.outputPath(`additional-income-${locale}-${width}.png`)});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await dialog.getByRole('button',{name:t('Schließen','Close'),exact:true}).click();await expect(cards.locator('[data-home-kpi=remaining]')).toContainText(de?'2.860,00':'2,860.00');
 await page.getByRole('button',{name:t('Reguläres Einkommen ändern','Edit regular income'),exact:true}).click();await income.locator('input').first().fill('2450');await income.locator('button[type=submit]').click();await expect(cards.locator('[data-home-kpi=remaining]')).toContainText(de?'2.910,00':'2,910.00');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).additionalIncome.length)).toBe(1);
 await open();page.once('dialog',d=>d.accept());await dialog.getByRole('button',{name:t('Entfernen','Remove'),exact:true}).click();await expect(dialog.getByText('Verkauf auf eBay',{exact:true})).toHaveCount(0);await dialog.getByRole('button',{name:t('Schließen','Close'),exact:true}).click();await expect(cards.locator('[data-home-kpi=remaining]')).toContainText(de?'2.410,00':'2,410.00');
});
