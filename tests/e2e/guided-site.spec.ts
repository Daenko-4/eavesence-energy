import {test,expect} from '@playwright/test';
import {homeWorkspace,paydayStep} from './home-navigation';

for(const de of [false,true]) for(const width of [320,1365]) {
  const t=(a:string,b:string)=>de?a:b;
  test(`income first and settings preserve the Pro draft ${de?'de':'en'} ${width}`,async({page},info)=>{
    await page.setViewportSize({width,height:900});
    await page.goto(de?'/de/zuhause':'/home');
    await expect(page.getByLabel(t('Name des Zuhauses','Home name'),{exact:true})).toBeHidden();
    await page.getByLabel(t('Dein monatliches Nettoeinkommen','Your monthly net income'),{exact:true}).fill(de?'2.400,50':'2,400.50');
    await page.getByRole('button',{name:t('Zuhause erstellen','Create my home'),exact:true}).click();
    await expect(page.getByRole('button',{name:t('Erste Kosten hinzufügen','Add first cost'),exact:true})).toBeVisible();
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).incomeAmount)).toBe(2400.5);
    await homeWorkspace(page,'plan');
    await page.getByRole('group',{name:t('Planungsfrage wählen','Choose planning question')}).getByRole('button',{name:t('Bis zum Gehalt','Until payday'),exact:true}).click();
    await page.getByLabel(t('Aktueller Kontostand','Current account balance'),{exact:true}).fill('1234');
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
