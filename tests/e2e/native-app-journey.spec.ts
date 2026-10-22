import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
let script: string;
test.beforeAll(() => { script = JSON.parse(execFileSync('node', ['scripts/mobile-interaction-render.mjs', 'app'], { encoding: 'utf8', maxBuffer: 8_000_000 })).script; });
async function show(page: Page, locale: string, width: number, returning = false, incomeAmount = 2400) {
  await page.setViewportSize({ width, height: 852 });
  await page.goto('/calculator');
  await page.evaluate(({ locale, returning, incomeAmount }) => {
    const today = new Date().toISOString().slice(0, 10);
    if (returning) {
      localStorage.setItem('eavesence-mobile-profile-v1', JSON.stringify({ name: 'Test home', locale, currency: 'EUR', electricityPrice: .3, savingsGoalPercent: 10, incomeAmount, incomeFrequency: 'monthly', setupStep: 'complete', backupReminderDismissed: true, createdAt: new Date().toISOString() }));
      localStorage.setItem('eavesence-mobile-costs-v1', JSON.stringify(['Rent', 'Internet', 'Electricity', 'Streaming', 'Insurance', 'Phone'].map((name, i) => ({ id: `cost-${i}`, name, amount: i === 0 ? 900 : 40, category: i === 0 ? 'housing' : 'subscriptions', frequency: 'monthly', nextDueDate: today, updatedAt: new Date().toISOString() }))));
    }
  }, { locale, returning, incomeAmount });
  await mountApp(page, locale);
}
async function mountApp(page: Page, locale: string) {
  await page.setContent(`<!doctype html><html lang="${locale}"><style>*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,Arial;margin:0;background:#f6f7f2}button,input{font:inherit;background:none;border:0;text-align:left;color:inherit}#root>div{height:100dvh}</style><body><div id="root"></div><script>${script}</script></body></html>`);
}
for (const locale of ['de', 'en']) {
  const de = locale === 'de', t = (a: string, b: string) => de ? a : b;
  test(`full app guided setup saves income and first cost ${locale}`, async ({ page }, info) => {
    await show(page, locale, 390);
    if (de) await page.getByRole('button', { name: 'Deutsch', exact: true }).click();
    await page.getByRole('button', { name: t('Jetzt starten', 'Get started'), exact: true }).click();
    await expect(page.getByRole('tablist')).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: t('Name deines Zuhauses', 'Home name'), exact: true })).toHaveValue('');
    await page.getByRole('button', { name: t('Zuhause speichern & weiter', 'Save home & continue'), exact: true }).click();
    const income = page.getByRole('textbox', { name: t('Reguläres Monatsnetto (ohne Extras)', 'Regular monthly net income (excluding extras)'), exact: true });
    await income.fill('240');
    await page.getByRole('button', { name: t('Einkommen speichern & weiter', 'Save income & continue'), exact: true }).click();
    await page.getByRole('button', { name: t('Zurück zum Einkommen', 'Back to income'), exact: true }).click();
    await expect(income).toHaveValue('240');
    await income.fill('2400');
    await page.getByRole('button', { name: t('Einkommen speichern & weiter', 'Save income & continue'), exact: true }).click();
    await mountApp(page,locale);
    await expect(page.getByRole('tablist')).toHaveCount(0);
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-mobile-profile-v1')!).setupStep)).toBe('cost');
    await page.getByRole('textbox', { name: t('Bezeichnung', 'Name'), exact: true }).fill('Internet');
    await page.getByRole('textbox', { name: t('Betrag', 'Amount'), exact: true }).fill('40');
    await page.getByRole('button', { name: t('Kosten speichern & weiter', 'Save cost & continue'), exact: true }).click();
    await page.getByRole('button', { name: t('Meine Übersicht öffnen', 'Open my overview'), exact: true }).click();
    await expect(page.getByRole('tab', { name: t('Monat', 'Month'), exact: true })).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('eavesence-mobile-profile-v1')!).incomeAmount)).toBe(2400);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('eavesence-mobile-costs-v1')!)[0].name)).toBe('Internet');
    await page.screenshot({ path: info.outputPath(`app-first-month-${locale}.png`) });
  });
  test(`full app records zero income and protects clearing it ${locale}`,async({page})=>{
    await show(page,locale,390,true,0);
    await page.getByRole('button',{name:t('Monatsbudget & Kostenbereiche','Monthly budget & cost areas'),exact:true}).click();
    await expect(page.getByRole('alert')).toContainText(t('Fixkosten übersteigen dein Einkommen','fixed costs exceed your income'));
    await expect(page.getByText(t('1 · Einkommen eintragen','1 · Add your income'),{exact:true})).toHaveCount(0);
    await show(page,locale,390);
    await page.getByRole('button',{name:t('Monatsbudget & Kostenbereiche','Monthly budget & cost areas'),exact:true}).click();
    await page.getByRole('button',{name:t('Einkommen ändern','Edit income'),exact:true}).click();
    const income=page.getByRole('textbox',{name:t('Reguläres Monatsnetto (ohne Extras)','Regular monthly net income (excluding extras)'),exact:true});
    await expect(income).toHaveValue('0');
    await income.fill('');
    await page.getByRole('button',{name:t('Zur Kostenliste','Back to costs'),exact:true}).click();
    expect(await page.evaluate(() => (window as unknown as {reviewAlert:unknown[]}).reviewAlert[0])).toBe(t('Änderungen verwerfen?','Discard changes?'));
    await expect(income).toHaveValue('');
    await page.getByRole('button',{name:t('Einkommen speichern','Save income'),exact:true}).click();
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-mobile-profile-v1')!).incomeAmount)).toBeUndefined();
  });
  for (const width of [320, 390]) test(`full app navigation costs settings backup and Pro ${locale} ${width}`, async ({ page }, info) => {
    await show(page, locale, width, true);
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    await page.getByRole('button',{name:/Zahlungen abhaken|Check off payments/}).click();
    await expect(page.getByRole('checkbox')).toHaveCount(6);
    await page.getByRole('checkbox').first().click();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('eavesence-mobile-profile-v1')!).planning.paidPayments.length)).toBe(1);
    await page.getByRole('tab', { name: t('Kosten', 'Costs'), exact: true }).click();
    await page.screenshot({ path: info.outputPath(`app-costs-${locale}-${width}.png`) });
    const search = page.getByRole('textbox',{name:t('Kosten suchen','Search costs'),exact:true});
    await search.fill('internet');
    await expect(page.getByRole('button',{name:/^Internet ·/})).toHaveCount(1);
    await expect(page.getByRole('button',{name:/^Rent ·/})).toHaveCount(0);
    await search.fill('xyz-no-match');
    await expect(page.getByText(t('Keine passenden Kosten. Versuche einen anderen Namen oder eine Kategorie.','No matching costs. Try another name or category.'),{exact:true})).toBeVisible();
    await page.getByRole('button',{name:t('Suche löschen','Clear search'),exact:true}).click();
    await page.getByRole('button',{name:/^Internet ·/}).click();
    await page.getByRole('button',{name:t('Bearbeiten: Internet','Edit: Internet'),exact:true}).click();
    const editAmount=page.getByRole('textbox',{name:t('Betrag','Amount'),exact:true});
    await editAmount.fill('39');
    await page.getByRole('button',{name:t('Abbrechen','Cancel'),exact:true}).click();
    expect(await page.evaluate(() => (window as unknown as {reviewAlert:unknown[]}).reviewAlert[0])).toBe(t('Änderungen verwerfen?','Discard changes?'));
    await page.evaluate(() => ((window as unknown as {reviewAlert:[string,string,Array<{onPress?:()=>void}>]}).reviewAlert[2][0].onPress)?.());
    await expect(editAmount).toHaveValue('39');
    await page.getByRole('button',{name:t('Kosten speichern','Save cost'),exact:true}).click();
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-mobile-costs-v1')!).find((cost:{id:string})=>cost.id==='cost-1').amount)).toBe(39);
    await page.getByRole('button', { name: t('Kosten hinzufügen', 'Add cost'), exact: true }).click();
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('New internet');
    await page.getByRole('textbox', { name: t('Betrag', 'Amount'), exact: true }).fill('25');
    await page.getByRole('button', { name: t('Kosten speichern', 'Save cost'), exact: true }).click();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('eavesence-mobile-costs-v1')!).length)).toBe(7);
    await page.getByRole('button', { name: t('Einstellungen', 'Settings'), exact: true }).click();
    await page.screenshot({ path: info.outputPath(`app-settings-${locale}-${width}.png`) });
    await expect(page.getByRole('button',{name:t('Sicherung exportieren','Export backup'),exact:true})).toHaveCount(0);
    const homeName=page.getByRole('textbox',{name:'Name',exact:true});
    await homeName.fill('Changed home');
    await page.getByRole('button',{name:t('Zurück','Back'),exact:true}).click();
    expect(await page.evaluate(() => (window as unknown as {reviewAlert:unknown[]}).reviewAlert[0])).toBe(t('Änderungen verwerfen?','Discard changes?'));
    await expect(homeName).toHaveValue('Changed home');
    await page.getByRole('button',{name:t('Einstellungen speichern','Save settings'),exact:true}).click();
    await expect(page.getByRole('tablist',{name:/App-Navigation|App navigation/}).getByRole('tab',{name:t('Kosten','Costs'),exact:true})).toHaveAttribute('aria-selected','true');
    await page.getByRole('button',{name:t('Einstellungen','Settings'),exact:true}).click();
    await expect(page.getByRole('textbox',{name:/Strompreis|Electricity price/})).toHaveCount(0);
    await page.getByRole('button',{name:t('Sicherung & Daten','Backup & data'),exact:true}).click();
    await page.getByRole('button', { name: t('Sicherung exportieren', 'Export backup'), exact: true }).click();
    expect(await page.evaluate(() => (window as unknown as { reviewBackup: { costs: unknown[] } }).reviewBackup.costs.length)).toBe(7);
    await page.getByRole('tab', { name: 'Plan', exact: true }).click();
    await page.getByRole('tab', { name: t('Realistisch sparen', 'Find realistic savings'), exact: true }).click();
    await expect(page.getByText(t('Monatsbudget ergänzen (optional)', 'Add a monthly budget (optional)'), { exact: true })).toBeVisible();
    await page.getByRole('tab', { name: t('Erreichte Ersparnis', 'Savings achieved'), exact: true }).click();
    await page.getByRole('tab', { name: t('Rechner', 'Calculator'), exact: true }).click();
    await expect(page.getByText(t('Was kostet dein Gerät?', 'What does your device cost?'), { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

async function alertAction(page: Page, index: number) {
  await page.evaluate(index => {
    const state = window as unknown as {reviewAlert:[string,string,Array<{onPress?:()=>void}>]};
    state.reviewAlert[2][index].onPress?.();
  }, index);
}
for (const locale of ['de','en']) {
  const t=(a:string,b:string)=>locale==='de'?a:b;
  test(`native free month restores income extras invoices and notes after reset ${locale}`,async({page},info)=>{
    await page.clock.setFixedTime(new Date('2026-10-15T12:00:00Z'));
    await show(page,locale,320,true);
    await page.evaluate(()=>{
      const profile=JSON.parse(localStorage.getItem('eavesence-mobile-profile-v1')!);
      Object.assign(profile,{incomeAmount:2400,incomeExtras:[{id:'salary13',kind:'salary13',amount:2400,month:6},{id:'salary14',kind:'salary14',amount:2000,month:11},{id:'bonus',kind:'bonus',amount:600,month:12,year:2026}],planning:{goals:[],reserves:[],checks:[],memos:[{id:'memo',text:'Review annual plans',date:'2026-12-28',done:false,updatedAt:'2026-10-15T12:00:00Z'}]}});
      localStorage.setItem('eavesence-mobile-profile-v1',JSON.stringify(profile));
      const base={frequency:'monthly',updatedAt:'2026-10-15T12:00:00Z'};
      localStorage.setItem('eavesence-mobile-costs-v1',JSON.stringify([
        {...base,id:'rent',name:'Rent',category:'housing',amount:800,nextDueDate:'2026-10-15'},
        {...base,id:'internet',name:'Internet',category:'subscriptions',amount:40,nextDueDate:'2026-10-16'},
        {...base,id:'electric',name:'Electricity',category:'energy',amount:80,variableAmount:true,nextDueDate:'2026-10-17'},
        {...base,id:'insurance',name:'Insurance',category:'insurance',amount:240,frequency:'yearly',nextDueDate:'2026-10-20'},
      ]));
    });
    await mountApp(page,locale);
    await expect(page.getByRole('heading',{name:'Test home',exact:true})).toBeVisible();
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    await page.screenshot({path:info.outputPath(`native-free-home-${locale}-320.png`)});
    await page.getByRole('button',{name:t('Monatsbudget & Kostenbereiche','Monthly budget & cost areas'),exact:true}).click();
    await expect(page.getByText(t('1.460,00','1,460.00'),{exact:false})).toBeVisible();
    await page.getByRole('button',{name:t('Sonderzahlungen & Jahresüberblick','Extra income & annual overview'),exact:true}).click();
    await expect(page.getByText(t('kein heute verfügbares Geld','not money available today'),{exact:false})).toBeVisible();
    await page.getByRole('button',{name:t('Monatsbudget & Kostenbereiche','Monthly budget & cost areas'),exact:true}).click();
    await page.getByRole('button',{name:/Zahlungen abhaken|Check off payments/}).click();
    await page.getByRole('checkbox',{name:/^Electricity,/}).click();
    const invoice=page.getByRole('textbox',{name:t('Electricity · Rechnungsbetrag','Electricity · Invoice amount'),exact:true});
    await invoice.fill(locale==='de'?'76,40':'76.40');
    await page.getByRole('button',{name:t('Betrag speichern','Save amount'),exact:true}).click();
    await page.getByRole('checkbox',{name:/^Electricity,/}).click();
    await expect(page.getByRole('button',{name:/Zahlungen abhaken|Check off payments/})).toContainText('1/4');
    await page.getByRole('button',{name:t('Nächster Monat','Next month'),exact:true}).click();
    await expect(page.getByRole('checkbox',{name:/^Electricity,/})).toHaveAttribute('aria-label',/80[,.]00/);
    await expect(page.getByRole('checkbox',{name:/^Electricity,/})).toHaveAttribute('aria-checked','false');
    await page.getByRole('button',{name:t('Vorheriger Monat','Previous month'),exact:true}).click();
    await page.getByRole('button',{name:/Bezahlte Zahlungen|Paid payments/}).click();
    await expect(page.getByRole('checkbox',{name:/^Electricity,/})).toHaveAttribute('aria-checked','true');
    await page.getByRole('button',{name:t('Einstellungen','Settings'),exact:true}).click();
    await page.getByRole('button',{name:t('Sicherung & Daten','Backup & data'),exact:true}).click();
    await page.getByRole('button',{name:t('Sicherung exportieren','Export backup'),exact:true}).click();
    const backup=await page.evaluate(()=>(window as unknown as {reviewBackup:import('../../apps/mobile/src/backup').MobileBackup}).reviewBackup);
    expect(backup.costs.find(c=>c.id==='electric')!.amount).toBe(80);
    expect(backup.profile.planning!.actualPayments![0].amount).toBe(76.4);
    expect(backup.profile.planning!.paidPayments).toHaveLength(1);
    expect(backup.profile.incomeExtras).toHaveLength(3);
    // A rejected file and a cancelled valid replacement leave the saved home intact.
    await page.evaluate(()=>{(window as unknown as {reviewImport:string}).reviewImport='{"format":"broken"}';});
    await page.getByRole('button',{name:t('Sicherung importieren','Import backup'),exact:true}).click();
    expect(await page.evaluate(()=>(window as unknown as {reviewAlert:string[]}).reviewAlert[0])).toBe(t('Ungültige Sicherung','Invalid backup'));
    await page.evaluate(backup=>{(window as unknown as {reviewImport:string}).reviewImport=JSON.stringify(backup);},backup);
    await page.getByRole('button',{name:t('Sicherung importieren','Import backup'),exact:true}).click();
    await alertAction(page,0);
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-mobile-costs-v1')!).length)).toBe(4);
    await page.getByRole('button',{name:t('My Home zurücksetzen','Reset My Home'),exact:true}).click();
    await alertAction(page,1);
    await expect(page.getByRole('button',{name:t('Jetzt starten','Get started'),exact:true})).toBeVisible();
    await page.getByRole('button',{name:t('Sicherung wiederherstellen','Restore a backup'),exact:true}).click();
    await alertAction(page,1);
    await expect(page.getByRole('heading',{name:'Test home',exact:true})).toBeVisible();
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    await mountApp(page,locale); // New app process, same persistent platform store.
    await expect(page.getByRole('heading',{name:'Test home',exact:true})).toBeVisible();
    const restored=await page.evaluate(()=>({profile:JSON.parse(localStorage.getItem('eavesence-mobile-profile-v1')!),costs:JSON.parse(localStorage.getItem('eavesence-mobile-costs-v1')!)}));
    expect(restored.profile.incomeAmount).toBe(2400);
    expect(restored.profile.incomeExtras).toEqual(backup.profile.incomeExtras);
    expect(restored.profile.planning).toEqual(backup.profile.planning);
    expect(restored.costs).toEqual(backup.costs);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });

  test(`native electricity preferences save independently and preserve a failed draft ${locale}`,async({page},info)=>{
    await show(page,locale,320,true);
    await page.evaluate(()=>{
      const profile=JSON.parse(localStorage.getItem('eavesence-mobile-profile-v1')!);profile.savingsGoalPercent=42;
      localStorage.setItem('eavesence-mobile-profile-v1',JSON.stringify(profile));
      localStorage.setItem('eavesence-mobile-devices-v1',JSON.stringify([{id:'router',name:'Router',watts:12,minutesPerUse:1440,usesPerWeek:7,yearlyKwh:100,yearlyCost:30,monthlyCost:2.5,updatedAt:new Date().toISOString()}]));
    });
    await mountApp(page,locale);
    await page.getByRole('tab',{name:t('Rechner','Calculator'),exact:true}).click();
    await expect(page.getByText('42 %',{exact:true})).toBeVisible();
    const price=page.getByRole('textbox',{name:/Strompreis pro kWh|Electricity price per kWh/});
    await price.fill(locale==='de'?'0,42':'0.42');
    await page.getByRole('button',{name:'20 %',exact:true}).click();
    await expect(price).toHaveValue(locale==='de'?'0,42':'0.42');
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-mobile-profile-v1')!).electricityPrice)).toBe(.3);
    await page.getByRole('button',{name:t('Strompreis speichern','Save electricity price'),exact:true}).click();
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-mobile-profile-v1')!).electricityPrice)).toBe(.42);
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-mobile-devices-v1')!)[0].yearlyCost)).toBe(42);
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-mobile-costs-v1')!)[2].amount)).toBe(40);
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-mobile-profile-v1')!).savingsGoalPercent)).toBe(20);
    await expect(page.getByText(t('Strompreis gespeichert.','Electricity price saved.'),{exact:true})).toHaveCount(0,{timeout:5000});
    await price.fill('0.50');
    await page.evaluate(()=>{
      const original=Storage.prototype.setItem;
      Storage.prototype.setItem=function(key,value){if(key==='eavesence-mobile-profile-v1')throw new DOMException('Storage full','QuotaExceededError');return original.call(this,key,value);};
    });
    await page.getByRole('button',{name:t('Strompreis speichern','Save electricity price'),exact:true}).click();
    await expect(page.getByRole('alert')).toContainText(t('Speichern fehlgeschlagen','Could not save'));
    await expect(price).toHaveValue('0.50');
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-mobile-profile-v1')!).electricityPrice)).toBe(.42);
    await page.getByRole('heading',{name:t('Dein Strom-Sparziel','Your electricity savings target'),exact:true}).locator('..').screenshot({path:info.outputPath(`native-energy-settings-${locale}-320.png`)});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });

  test(`native corrupt saved data blocks replacement and allows a safe retry ${locale}`,async({page})=>{
    await show(page,locale,390,true);
    const saved=await page.evaluate(()=>localStorage.getItem('eavesence-mobile-costs-v1')!);
    await page.evaluate(()=>localStorage.setItem('eavesence-mobile-costs-v1','[{"broken":true}]'));
    await mountApp(page,locale);
    // Before profile loading, the system language is English in this review environment.
    await expect(page.getByText('Could not load your data',{exact:true})).toBeVisible();
    expect(await page.evaluate(()=>localStorage.getItem('eavesence-mobile-costs-v1'))).toBe('[{"broken":true}]');
    await expect(page.getByRole('button',{name:'Get started',exact:true})).toHaveCount(0);
    await page.evaluate(saved=>localStorage.setItem('eavesence-mobile-costs-v1',saved),saved);
    await page.getByRole('button',{name:'Try again',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Test home',exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:t('Einstellungen','Settings'),exact:true})).toBeVisible();
  });
}

for(const locale of ['de','en'])test(`native payday links open payments and require a fresh balance after a debit ${locale}`,async({page},info)=>{
 const t=(a:string,b:string)=>locale==='de'?a:b;
 await page.clock.setFixedTime(new Date('2026-10-15T12:00:00Z'));
 await show(page,locale,320,true);
 await page.evaluate(()=>{
  const p=JSON.parse(localStorage.getItem('eavesence-mobile-profile-v1')!);
  p.planning={goals:[],reserves:[],checks:[],cash:{balance:1000,asOf:'2026-10-15',payday:'2026-10-30',protected:0,everydayRemaining:75}};
  localStorage.setItem('eavesence-mobile-profile-v1',JSON.stringify(p));
  localStorage.setItem('eavesence-mobile-costs-v1',JSON.stringify([{id:'internet',name:'Internet',amount:40,category:'subscriptions',frequency:'monthly',nextDueDate:'2026-10-16',updatedAt:'2026-10-15T12:00:00Z'}]));
 });
 await mountApp(page,locale);
 await page.getByRole('tab',{name:'Plan',exact:true}).click();
 await expect(page.getByRole('heading',{name:t('Zusätzlich verfügbar','Extra money available'),exact:true})).toBeVisible();
 await expect(page.getByText(t('885,00','885.00'),{exact:false})).toBeVisible();
 await page.screenshot({path:info.outputPath(`native-payday-ready-${locale}-320.png`)});
 await page.getByRole('button',{name:t('Finanzplan prüfen','Review your money plan'),exact:true}).click();
 await page.getByRole('button',{name:t('Zahlungen ansehen und abhaken','View and check off payments'),exact:true}).click();
 await expect(page.getByRole('button',{name:/Zahlungen abhaken|Check off payments/})).toHaveAttribute('aria-expanded','true');
 await page.getByRole('checkbox',{name:/^Internet,/}).click();
 await page.getByRole('tab',{name:'Plan',exact:true}).click();
 await expect(page.getByRole('heading',{name:t('Kontostand bestätigen','Confirm account balance'),exact:true})).toBeVisible();
 await expect(page.getByText(t('885,00','885.00'),{exact:false})).toHaveCount(0);
 await page.screenshot({path:info.outputPath(`native-payday-stale-${locale}-320.png`)});
 await page.getByRole('button',{name:t('Kontostand aktualisieren','Update account balance'),exact:true}).click();
 const balance=page.getByRole('textbox',{name:t('Aktueller Kontostand','Current account balance'),exact:true});
 await expect(balance).toBeFocused();await expect(balance).toHaveAttribute('data-keyboard','decimal-pad');
 await balance.fill('960');
 await page.getByRole('button',{name:t('Verfügbares Geld anzeigen','Show available money'),exact:true}).click();
 await expect(page.getByText(t('885,00','885.00'),{exact:false})).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-mobile-profile-v1')!).planning.paidPayments.length)).toBe(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

for(const locale of ['de','en'])for(const width of [320,390])test(`native connected Pro journey ${locale} ${width}`,async({page},info)=>{
 const t=(a:string,b:string)=>locale==='de'?a:b;
 await page.clock.setFixedTime(new Date('2026-10-13T12:00:00Z'));
 await show(page,locale,width,true);
 await page.evaluate(()=>{
  const p=JSON.parse(localStorage.getItem('eavesence-mobile-profile-v1')!);
  p.planning={cash:{balance:1000,asOf:'2026-10-13',payday:'2026-10-31',protected:100,everydayRemaining:200}};
  localStorage.setItem('eavesence-mobile-profile-v1',JSON.stringify(p));
  localStorage.setItem('eavesence-mobile-costs-v1',JSON.stringify([{id:'internet',name:'Internet',amount:40,category:'subscriptions',frequency:'monthly',nextDueDate:'2026-10-19',updatedAt:'2026-10-13T08:00:00Z'}]));
 });await mountApp(page,locale);
 await page.getByRole('tab',{name:'Plan',exact:true}).click();
 await page.getByRole('button',{name:t('Nächster Schritt: Kosten senken','Next step: lower a cost'),exact:true}).click();
 await page.getByRole('button',{name:t('Änderung planen','Plan change'),exact:true}).click();
 await page.getByRole('textbox',{name:t('Neuer Betrag je Zahlung (0 = fällt weg)','New amount per payment (0 = ends)'),exact:true}).fill('30');
 await expect(page.getByText(/660.*670/)).toBeVisible();
 await page.screenshot({path:info.outputPath(`native-connected-preview-${locale}-${width}.png`)});
 await page.getByRole('button',{name:t('Änderung vormerken','Save this plan'),exact:true}).click();
 const disclosure=page.getByRole('button',{name:new RegExp('^'+t('Vorgemerkte Änderungen','Planned changes'))});
 await expect(disclosure).toHaveAttribute('aria-expanded','true');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-mobile-costs-v1')!)[0].amount)).toBe(40);
 await disclosure.click();await page.getByRole('button',{name:t('Vorgemerkte Änderung prüfen','Review planned change'),exact:true}).click();
 await expect(disclosure).toHaveAttribute('aria-expanded','true');
 await page.getByRole('button',{name:t('Umgesetzt – Kosten aktualisieren','Done — update costs'),exact:true}).click();
 await alertAction(page,1);
 await page.getByRole('button',{name:t('Ergebnis ansehen','See the result'),exact:true}).click();
 await expect(page.getByText(t('Nächste berechnete Ersparnis','Next calculated saving'),{exact:false})).toContainText(t('19. Oktober','19 October'));
 await page.screenshot({path:info.outputPath(`native-connected-result-${locale}-${width}.png`)});
 await page.getByRole('button',{name:t('Geld bis zum Gehalt neu prüfen','Review your money until payday'),exact:true}).click();
 await expect(page.getByText(t('Kontostand bestätigen','Confirm account balance'),{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-mobile-profile-v1')!).planning.cash.needsRefresh)).toBe(true);
});

for(const locale of ['de','en'])for(const width of [320,390])test(`native Pro forecasts invoice learning and switch costs ${locale} ${width}`,async({page},info)=>{
 const t=(a:string,b:string)=>locale==='de'?a:b;await page.clock.setFixedTime(new Date('2026-10-18T12:00:00Z'));await show(page,locale,width,true);
 await page.evaluate(()=>{
  const p=JSON.parse(localStorage.getItem('eavesence-mobile-profile-v1')!);
  p.variableMonthly=500;p.incomeExtras=[{id:'bonus',kind:'salary14',amount:2000,month:11}];p.planning={cash:{balance:1000,asOf:'2026-10-18',payday:'2026-10-25',protected:100,everydayRemaining:70},actualPayments:[100,120,140].map((amount,i)=>({costId:'electric',month:`2026-0${i+7}`,date:`2026-0${i+7}-20`,amount,plannedAmount:80,frequency:'monthly',anchor:'2026-01-20',updatedAt:'2026-10-18T12:00:00Z'})),paidPayments:[{costId:'electric',month:'2026-10',date:'2026-10-20',amount:80,frequency:'monthly',anchor:'2026-01-20',paidAt:'2026-10-18T12:00:00Z'}]};
  localStorage.setItem('eavesence-mobile-profile-v1',JSON.stringify(p));
  localStorage.setItem('eavesence-mobile-costs-v1',JSON.stringify([{id:'electric',name:'Electricity',amount:80,variableAmount:true,category:'energy',frequency:'monthly',nextDueDate:'2026-01-20',updatedAt:'2026-10-18T12:00:00Z'},{id:'internet',name:'Internet',amount:40,category:'subscriptions',frequency:'monthly',nextDueDate:'2026-10-20',updatedAt:'2026-10-18T12:00:00Z'},{id:'rent',name:'Rent',amount:900,category:'housing',frequency:'monthly',nextDueDate:'2026-10-20',updatedAt:'2026-10-18T12:00:00Z'}]));
 });await mountApp(page,locale);await page.getByRole('tab',{name:'Plan',exact:true}).click();
 const forecast=page.getByRole('button',{name:t('Die nächsten 90 Tage','The next 90 days'),exact:true});await expect(forecast).toHaveAttribute('aria-expanded','false');await forecast.click();
 await expect(page.getByText(new RegExp(t('Voraussichtlich knapp ab 20. Oktober','Potential shortfall from 20 October')))).toBeVisible();
 await page.getByRole('textbox',{name:t('Alltagsausgaben pro Monat (90-Tage-Plan)','Everyday spending per month (90-day plan)'),exact:true}).fill('600');await page.getByRole('button',{name:t('Alltagsschätzung speichern','Save everyday estimate'),exact:true}).click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-mobile-profile-v1')!).variableMonthly)).toBe(600);
 await forecast.scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath(`native-pro-90days-${locale}-${width}.png`)});
 await page.getByRole('tab',{name:t('Realistisch sparen','Find realistic savings'),exact:true}).click();
 await page.getByRole('button',{name:t('Ab wann lohnt sich ein Wechsel?','When does switching pay off?'),exact:true}).click();
 await page.getByRole('button',{name:t('Ausgabe für den Wechselvergleich','Cost for the switch comparison'),exact:true}).click();await page.getByRole('button',{name:/^Internet ·/}).click();
 await page.getByRole('textbox',{name:t('Neuer monatlicher Preis','New monthly price'),exact:true}).fill('20');await page.getByRole('textbox',{name:t('Erste neue Zahlung am (TT.MM.JJJJ)','First new payment on (DD.MM.YYYY)'),exact:true}).fill('20.10.2026');
 await page.getByRole('button',{name:t('Wechselgebühr & doppelte Monate (optional)','Switching fee & overlapping months (optional)'),exact:true}).click();
 await page.getByRole('textbox',{name:t('Einmalige Wechselgebühr','One-off switching fee'),exact:true}).fill('60');await page.getByRole('textbox',{name:t('Alten Vertrag noch so viele Monate bezahlen','Months still paying the old contract'),exact:true}).fill('1');
 await expect(page.getByText(new RegExp(t('Zusatzkosten ausgeglichen bis 20. Februar 2027','Additional costs recovered by 20 February 2027')))).toBeVisible();
 const result=page.getByText(new RegExp(t('Zusatzkosten ausgeglichen','Additional costs recovered')));await result.scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath(`native-pro-switch-${locale}-${width}.png`)});
 await page.getByRole('button',{name:t('Vergleich merken','Save comparison'),exact:true}).click();await expect(page.getByText(t('Vergleich gemerkt. Deine laufenden Kosten bleiben unverändert.','Comparison saved. Your recurring costs stay unchanged.'),{exact:true})).toBeVisible();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-mobile-profile-v1')!).planning.switchPlans[0].fee)).toBe(60);
 await page.getByRole('button',{name:t('Planbeträge aus deinen Rechnungen','Planning amounts from your invoices'),exact:true}).click();await page.getByRole('button',{name:t('Diesen Planbetrag übernehmen','Use this planning amount'),exact:true}).click();await expect(page.getByText(/Planbetrag angepasst|Planning amount updated/)).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-mobile-costs-v1')!).find((c:{id:string})=>c.id==='electric').amount)).toBe(120);
 await page.getByRole('button',{name:t('Rechnungsbeträge eintragen','Record invoice amounts'),exact:true}).click();await page.getByRole('button',{name:/^Bezahlte Zahlungen|^Paid payments/}).click();await expect(page.getByRole('checkbox',{name:/^Electricity,/})).toHaveAttribute('aria-checked','true');
 await mountApp(page,locale);await page.getByRole('tab',{name:'Plan',exact:true}).click();await page.getByRole('tab',{name:t('Realistisch sparen','Find realistic savings'),exact:true}).click();await page.getByRole('button',{name:t('Ab wann lohnt sich ein Wechsel?','When does switching pay off?'),exact:true}).click();await page.getByRole('button',{name:t('Gemerkte Wechselvergleiche','Saved switch comparisons'),exact:true}).click();await page.getByRole('button',{name:t('Vergleich öffnen','Open comparison'),exact:true}).click();
 await expect(page.getByRole('textbox',{name:t('Neuer monatlicher Preis','New monthly price'),exact:true})).toHaveValue('20');await expect(page.getByRole('textbox',{name:t('Neuer monatlicher Preis','New monthly price'),exact:true})).toBeFocused();await expect(page.getByRole('textbox',{name:t('Einmalige Wechselgebühr','One-off switching fee'),exact:true})).toHaveValue('60');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-mobile-profile-v1')!).savingsActions??[])).toHaveLength(0);
});

for (const locale of ['de','en']) for (const width of [320,390]) {
  test(`native planning keeps drafts across periods tools and app tabs ${locale} ${width}`, async ({page},info) => {
    const t=(a:string,b:string)=>locale==='de'?a:b;
    await show(page,locale,width,true);
    await page.getByRole('tab',{name:'Plan',exact:true}).click();
    const period=page.getByRole('tablist',{name:t('Planungszeitraum wählen','Choose planning period'),exact:true});
    const goal=page.getByRole('tablist',{name:t('Planungsfrage wählen','Choose planning question'),exact:true});
    await page.getByRole('button',{name:t('Verfügbares Geld berechnen','Calculate available money'),exact:true}).click();
    const balance=page.getByRole('textbox',{name:t('Aktueller Kontostand','Current account balance'),exact:true});
    await balance.fill('1250');
    await page.getByRole('textbox',{name:t('Alltagsausgaben bis zum Gehalt','Everyday spending until payday'),exact:true}).fill('180');
    await period.getByRole('tab',{name:t('90-Tage-Vorschau','90-day outlook'),exact:true}).click();
    await expect(page.getByRole('button',{name:t('Die nächsten 90 Tage','The next 90 days'),exact:true})).toHaveCount(0);
    await expect(page.getByRole('button',{name:t('Kontostand & Gehaltstag prüfen','Review balance & payday'),exact:true})).toBeVisible();
    await period.getByRole('tab',{name:t('Monatsbudget','Monthly budget'),exact:true}).click();
    const everyday=page.getByRole('textbox',{name:t('Alltagsausgaben pro Monat (geschätzt)','Everyday spending per month (estimate)'),exact:true});
    await everyday.fill('350');
    await expect(page.getByText(t('950,00','950.00'),{exact:false})).toBeVisible();
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-mobile-profile-v1')!).variableMonthly)).toBeUndefined();
    await goal.getByRole('tab',{name:t('Realistisch sparen','Find realistic savings'),exact:true}).click();
    const tools=page.getByRole('tablist',{name:t('Sparwerkzeug wählen','Choose savings tool'),exact:true});
    await tools.getByRole('tab',{name:t('Jahresabo','Annual plans'),exact:true}).click();
    await expect(page.getByRole('button',{name:t('Monatsabo oder Jahresabo?','Monthly or annual subscription?'),exact:true})).toHaveCount(0);
    await page.getByRole('button',{name:t('Abo auswählen','Choose subscription'),exact:true}).click();
    await page.getByRole('button',{name:/^Internet ·/}).click();
    const annual=page.getByRole('textbox',{name:t('Angebot: voller Jahrespreis','Offer: full annual price'),exact:true});
    await annual.fill('240');
    await tools.getByRole('tab',{name:t('Rücklagen','Bill reserves'),exact:true}).click();
    await expect(annual).toBeHidden();
    await tools.getByRole('tab',{name:t('Jahresabo','Annual plans'),exact:true}).click();
    await expect(annual).toHaveValue('240');
    await tools.getByRole('tab',{name:t('Tarifwechsel','Switch plans'),exact:true}).click();
    await page.getByRole('button',{name:t('Ausgabe für den Wechselvergleich','Cost for the switch comparison'),exact:true}).click();
    await page.getByRole('button',{name:/^Internet ·/}).click();
    const price=page.getByRole('textbox',{name:t('Neuer monatlicher Preis','New monthly price'),exact:true});
    await price.fill('20');
    await tools.getByRole('tab',{name:t('Planbeträge','Invoice amounts'),exact:true}).click();
    await expect(price).toBeHidden();
    await tools.getByRole('tab',{name:t('Tarifwechsel','Switch plans'),exact:true}).click();
    await expect(price).toHaveValue('20');
    await goal.getByRole('tab',{name:t('Bis zum Gehalt ausgeben','Spend until payday'),exact:true}).click();
    await expect(balance).toHaveValue('1250');
    await page.getByRole('tablist',{name:t('App-Navigation','App navigation'),exact:true}).getByRole('tab',{name:t('Kosten','Costs'),exact:true}).click();
    await page.getByRole('tab',{name:'Plan',exact:true}).click();
    await expect(balance).toHaveValue('1250');
    await period.getByRole('tab',{name:t('Monatsbudget','Monthly budget'),exact:true}).click();
    await expect(everyday).toHaveValue('350');
    await goal.getByRole('tab',{name:t('Erreichte Ersparnis','Savings achieved'),exact:true}).click();
    await expect(page.getByText(t('Bis heute eingespart','Saved so far'),{exact:true})).toBeVisible();
    await page.screenshot({path:info.outputPath(`native-plan-progress-${locale}-${width}.png`),fullPage:true});
    await goal.getByRole('tab',{name:t('Bis zum Gehalt ausgeben','Spend until payday'),exact:true}).click();
    await page.screenshot({path:info.outputPath(`native-plan-draft-${locale}-${width}.png`),fullPage:true});
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-mobile-profile-v1')!).planning?.cash)).toBeUndefined();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
}
