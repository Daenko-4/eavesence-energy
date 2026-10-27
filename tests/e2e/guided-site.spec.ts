import {test,expect} from '@playwright/test';
import {homeWorkspace,paydayStep} from './home-navigation';

for(const de of [false,true]) for(const width of [320,1365]) {
  const t=(a:string,b:string)=>de?a:b;
  test(`income first and settings preserve the Pro draft ${de?'de':'en'} ${width}`,async({page},info)=>{
    await page.setViewportSize({width,height:900});
    await page.goto(de?'/de/zuhause':'/home');
    await expect(page.getByLabel(t('Name des Zuhauses','Home name'),{exact:true})).toBeHidden();
    await page.getByLabel(t('Dein monatliches Nettoeinkommen','Your monthly net income'),{exact:true}).fill(de?'2.400,50':'2,400.50');
    await page.getByRole('button',{name:t('Weiter zur ersten Fixausgabe','Continue to first fixed cost'),exact:true}).click();
    await page.getByRole('button',{name:t('Kosten später ergänzen','Add costs later'),exact:true}).click();
    await page.getByRole('button',{name:t('Übersicht speichern und öffnen','Save and open overview'),exact:true}).click();
    await expect(page.getByRole('button',{name:t('Erste Kosten hinzufügen','Add first cost'),exact:true})).toBeVisible();
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).incomeAmount)).toBe(2400.5);
    await homeWorkspace(page,'plan');
    const balance=page.getByLabel(t('Aktueller Kontostand','Current account balance'),{exact:true});
    await expect(balance).toBeFocused();
    await page.getByRole('group',{name:t('Planungsfrage wählen','Choose planning question')}).getByRole('button',{name:t('Bis zum Gehalt','Until payday'),exact:true}).click();
    await balance.fill('1234');
    await expect(balance).toHaveValue('1234');
    const hash=new URL(page.url()).hash;
    await page.locator('[data-header-settings]').click();
    const dialog=page.getByRole('dialog',{name:t('Einstellungen','Settings'),exact:true});
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel(t('Name des Zuhauses','Home name'),{exact:true})).toBeFocused();
    expect(new URL(page.url()).hash).toBe(hash);
    await expect(page.locator('[data-pwa-shell]')).toHaveAttribute('data-home-workspace','plan');
    await dialog.screenshot({path:info.outputPath(`settings-${de?'de':'en'}-${width}.png`)});
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('[data-header-settings]')).toBeFocused();
    await expect(page.getByLabel(t('Aktueller Kontostand','Current account balance'),{exact:true})).toHaveValue('1234');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
}
for(const de of [false,true]) {
 const t=(a:string,b:string)=>de?a:b;
 test(`missing dates allow a draft but never a misleading result ${de?'de':'en'}`,async({page})=>{
  await page.clock.setFixedTime(new Date('2026-10-26T12:00:00Z'));
  await page.goto(de?'/de/zuhause':'/home');
  await page.getByRole('button',{name:t('Zuhause erstellen','Create my home'),exact:true}).click();
  await page.evaluate(()=>localStorage.setItem('eavesence-home-costs-v1',JSON.stringify([{id:'rent',name:'Rent',amount:860,frequency:'monthly',category:'housing',nextDueDate:'',updatedAt:'2026-10-26T00:00:00Z'}])));
  await page.reload();await homeWorkspace(page,'plan');
  const panel=page.locator('[data-payday-state]');
  await panel.getByLabel(t('Aktueller Kontostand','Current account balance'),{exact:true}).fill('1800');
  await paydayStep(page,1);
  await panel.getByRole('button',{name:t('In 7 Tagen','In 7 days'),exact:true}).click();
  await expect(panel).toContainText(t('Du kannst weiterplanen.','You can continue planning.'));
  await paydayStep(page,2);
  await panel.getByLabel(t('Alltagsausgaben bis zum Gehalt','Everyday spending until payday'),{exact:true}).fill('250');
  await panel.getByRole('button',{name:t('Verfügbares Geld anzeigen','Show available money'),exact:true}).click();
  await expect(panel).toHaveAttribute('data-payday-state','dates');
  await expect(panel.locator('[data-payday-result]')).toHaveCount(0);
  await panel.getByLabel(t('Rent · Zahlungstermin','Rent · Payment date'),{exact:true}).fill('2026-10-28');
  await panel.getByRole('button',{name:t('Termin speichern','Save date'),exact:true}).click();
  await expect(panel).toHaveAttribute('data-payday-state','ready');
  await expect(panel.locator('[data-payday-result]')).toContainText(t('690,00','690.00'));
 });
 test(`device comparison uses one tariff and handles invalid input ${de?'de':'en'}`,async({page},info)=>{
  await page.setViewportSize({width:320,height:900});
  await page.goto(de?'/geraete':'/en/devices');
  const price=page.getByLabel(t('Strompreis für den Vergleich (€/kWh)','Comparison electricity price (€/kWh)'),{exact:true});
  const fridge=page.locator('.device-cost-card').filter({has:page.getByRole('heading',{name:t('Kühlschrank','Refrigerator'),exact:true})});
  await expect(fridge.locator('.device-cost-estimate')).toContainText(t('5,83','5.83'));
  await price.fill(de?'0,70':'0.70');
  await expect(fridge.locator('.device-cost-estimate')).toContainText(t('11,67','11.67'));
  await expect(fridge.locator('.device-cost-estimate')).toContainText(t('140,00','140.00'));
  await price.fill('-1');await expect(page.getByRole('alert').filter({hasText:t('Bitte einen gültigen Strompreis','Enter a valid electricity price')})).toBeVisible();
  await expect(fridge.locator('dd').first()).toHaveText('—');
  await price.fill('0');await expect(fridge.locator('dd').first()).toContainText(t('0,00','0.00'));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath(`devices-${de?'de':'en'}-320.png`)});
 });
}

for(const de of [false,true]) test(`offline page uses one language ${de?'de':'en'}`,async({browser})=>{
 const context=await browser.newContext({locale:de?'de-AT':'en-GB'});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:3100/offline');
 await expect(page.getByRole('heading',{name:de?'Keine Verbindung':'No connection',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:de?'No connection':'Keine Verbindung',exact:true})).toHaveCount(0);
 await expect(page.getByRole('link',{name:de?'Erneut versuchen':'Try again',exact:true})).toHaveAttribute('href',de?'/de/zuhause':'/home');
 await context.close();
});

for (const de of [false, true]) for (const width of [320, 1365]) {
 const t = (a:string,b:string) => de ? a : b;
 test(`first month guides income cost and provisional result ${de?'de':'en'} ${width}`, async ({page},info) => {
  await page.setViewportSize({width,height:900});
  await page.goto(de?'/de/zuhause':'/home');
  const income=page.getByLabel(t('Dein monatliches Nettoeinkommen','Your monthly net income'),{exact:true});
  await page.getByRole('button',{name:t('Weiter zur ersten Fixausgabe','Continue to first fixed cost'),exact:true}).click();
  await expect(page.getByRole('alert').filter({hasText:t('Trage dein Monatsnetto','Enter your monthly net income')})).toBeVisible();
  await income.fill('-1');
  await page.getByRole('button',{name:t('Weiter zur ersten Fixausgabe','Continue to first fixed cost'),exact:true}).click();
  await expect(page.getByRole('alert').filter({hasText:t('Betrag ab 0','amount of 0')})).toBeVisible();
  await income.fill(de?'2.400,50':'2,400.50');
  await page.getByRole('button',{name:t('Weiter zur ersten Fixausgabe','Continue to first fixed cost'),exact:true}).click();
  const setup=page.locator('[data-first-month-setup]:visible');
  await expect(setup.getByRole('heading')).toBeFocused();
  await expect(page.locator('[data-home-overview-content]')).toHaveCount(0);
  await setup.getByRole('button',{name:t('Vorläufiges Ergebnis anzeigen','Show provisional result'),exact:true}).click();
  await expect(setup.getByRole('alert')).toBeVisible();
  await setup.getByLabel(t('Bezeichnung','Cost name'),{exact:true}).fill(t('Versicherung','Insurance'));
  const amount=setup.getByLabel(t('Betrag','Amount')+' (EUR)',{exact:true});
  await amount.fill('1200');
  await setup.getByLabel(t('Wie oft?','How often?'),{exact:true}).selectOption('yearly');
  await setup.getByRole('button',{name:t('Zurück zum Einkommen','Back to income'),exact:true}).click();
  await expect(income).toBeFocused();
  await expect(income).toHaveValue(de?'2.400,50':'2,400.50');
  await page.getByRole('button',{name:t('Weiter zur ersten Fixausgabe','Continue to first fixed cost'),exact:true}).click();
  await expect(amount).toHaveValue('1200');
  await setup.getByRole('button',{name:t('Vorläufiges Ergebnis anzeigen','Show provisional result'),exact:true}).click();
  const result=setup.locator('[data-setup-result]');
  await expect(result.locator('dd').nth(1)).toContainText(t('100,00','100.00'));
  await expect(result.locator('dd').nth(2)).toContainText(t('2.300,50','2,300.50'));
  await expect(setup).toContainText(t('noch kein frei verfügbares Budget','not yet your spending budget'));
  expect(await page.evaluate(()=>localStorage.getItem('eavesence-home-profile-v1'))).toBeNull();
  const boxes=await result.locator(':scope > div').evaluateAll(elements=>elements.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right};}));
  if(width===320){expect(Math.abs(boxes[0].y-boxes[1].y)).toBeLessThan(1);expect(boxes[2].y).toBeGreaterThan(boxes[0].y);}
  else {expect(boxes[2].x).toBeGreaterThan(boxes[1].x);expect(Math.abs(boxes[0].y-boxes[2].y)).toBeLessThan(1);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await setup.screenshot({path:info.outputPath(`first-month-${de?'de':'en'}-${width}.png`)});
  await setup.getByRole('button',{name:t('Kosten ändern','Change cost'),exact:true}).click();
  await expect(amount).toHaveValue('1200');
  await setup.getByRole('button',{name:t('Vorläufiges Ergebnis anzeigen','Show provisional result'),exact:true}).click();
  await setup.getByRole('button',{name:t('Übersicht speichern und öffnen','Save and open overview'),exact:true}).click();
  await expect(page.locator('[data-home-overview-content]')).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-home-overview-content]')).toBeVisible();
  const stored=await page.evaluate(()=>({profile:JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!),costs:JSON.parse(localStorage.getItem('eavesence-home-costs-v1')!)}));
  expect(stored.profile.incomeAmount).toBe(2400.5);
  expect(stored.costs).toHaveLength(1);
  expect(stored.costs[0]).toMatchObject({amount:1200,frequency:'yearly',nextDueDate:''});
 });
}

for (const de of [false,true]) {
 const t=(a:string,b:string)=>de?a:b;
 test(`zero income shows a shortfall and saving can be retried ${de?'de':'en'}`,async({page})=>{
  await page.goto(de?'/de/zuhause':'/home');
  await page.getByLabel(t('Dein monatliches Nettoeinkommen','Your monthly net income'),{exact:true}).fill('0');
  await page.getByRole('button',{name:t('Weiter zur ersten Fixausgabe','Continue to first fixed cost'),exact:true}).click();
  const setup=page.locator('[data-first-month-setup]:visible');
  await setup.getByLabel(t('Bezeichnung','Cost name'),{exact:true}).fill('Rent');
  await setup.getByLabel(t('Betrag','Amount')+' (EUR)',{exact:true}).fill('850');
  await setup.getByRole('button',{name:t('Vorläufiges Ergebnis anzeigen','Show provisional result'),exact:true}).click();
  await expect(setup.locator('[data-setup-result]')).toContainText(t('Fehlbetrag / Monat','Monthly shortfall'));
  await expect(setup.locator('[data-setup-result] dd').last()).toContainText(t('-850,00','-€850.00'));
  await page.evaluate(()=>{
   const original=Storage.prototype.setItem;
   Storage.prototype.setItem=function(key,value){if(key==='eavesence-home-costs-v1'){Storage.prototype.setItem=original;throw new DOMException('Full','QuotaExceededError');}return original.call(this,key,value);};
  });
  const save=setup.getByRole('button',{name:t('Übersicht speichern und öffnen','Save and open overview'),exact:true});
  await save.click();
  await expect(setup.getByRole('alert')).toContainText(t('Eingaben bleiben erhalten','entries have been kept'));
  expect(await page.evaluate(()=>localStorage.getItem('eavesence-home-profile-v1'))).toBeNull();
  await expect(setup.locator('[data-setup-result]')).toContainText(t('850,00','850.00'));
  await save.click();
  await page.reload();
  await expect(page.locator('[data-home-overview-content]')).toBeVisible();
  const stored=await page.evaluate(()=>({profile:JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!),costs:JSON.parse(localStorage.getItem('eavesence-home-costs-v1')!)}));
  expect(stored.profile.incomeAmount).toBe(0);
  expect(stored.profile.incomeDeferred).toBe(false);
  expect(stored.costs).toHaveLength(1);
 });
}
