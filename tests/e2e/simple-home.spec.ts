import { homeWorkspace, homeDetail } from './home-navigation';
import { test, expect } from '@playwright/test';

for (const locale of ['de', 'en'] as const) {
  test(`core setup follows income then costs and survives reload in ${locale}`, async ({ page }, info) => {
    const de = locale === 'de';
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(de ? '/de/zuhause' : '/home');
    await page.getByRole('button', { name: de ? 'Zuhause erstellen' : 'Create my home', exact: true }).click();
    const setup = page.locator('[data-home-setup]');
    const overview = page.getByRole('region', { name: de ? 'Finanzen im Überblick' : 'Your household at a glance' });
    await expect(setup).toContainText(de ? '1 · Einkommen eintragen' : '1 · Add your income');
    await expect(page.locator('[data-home-plan-content]')).toBeHidden();
    await expect(page.locator('#household-costs')).toHaveCount(0);
    await setup.getByRole('button').first().click();
    await page.locator('#home-income-form input').fill('2400');
    await page.locator('#home-income-form button[type="submit"]').click();
    await expect(setup).toContainText(de ? '2 · Erste Kosten hinzufügen' : '2 · Add your first cost');
    await expect(overview.locator('article').nth(2)).toContainText('—');
    await setup.getByRole('button').first().click();
    await page.locator('#household-cost-name').fill('Internet');
    await page.locator('#household-costs').getByLabel(de ? 'Betrag' : 'Amount', { exact: true }).fill('40');
    await page.locator('#household-costs').getByRole('button', { name: de ? 'Speichern' : 'Save', exact: true }).click();
    await expect(setup).toHaveCount(0);
    await expect(page.locator('[data-home-review]')).toContainText(de ? '3 · Deinen Überblick prüfen' : '3 · Check your overview');
    await page.reload();
    await homeDetail(page, 'costs');
    await expect(page.locator('#household-costs')).toContainText('Internet');
    await expect(overview.locator('article').nth(2)).toContainText(de ? '2.360,00' : '2,360.00');
    await expect(overview).toContainText(de ? 'kein Kontostand' : 'not your account balance');
    await expect(page.locator('[data-home-plan-content]')).toBeHidden();
    await expect(page.locator('[data-home-review]')).toBeVisible();
    await page.locator('[data-home-review]').getByRole('button',{name:de ? 'Übersicht geprüft' : 'Overview checked',exact:true}).click();
    await expect(page.locator('[data-home-review]')).toHaveCount(0);
    const download = page.waitForEvent('download');
    await page.locator('[data-home-overview-content]').getByRole('button',{name:de ? 'Sicherung exportieren' : 'Export backup',exact:true}).click();
    expect((await download).suggestedFilename()).toMatch(/^eavesence-home-.*\.json$/);
    await page.reload();
    await expect(page.locator('[data-home-review]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ fullPage: true, path: info.outputPath(`simple-home-${locale}.png`) });
  });
}

test('editing income from a bookmarked plan stays in overview after saving', async ({ page }) => {
  await page.goto('/home');
  await page.getByRole('button', { name: 'Create my home', exact: true }).click();
  await page.goto('/home#home-plan');
  await expect(page.locator('[data-home-plan-content]')).toBeVisible();
  await homeWorkspace(page, 'overview');
  await page.getByRole('group', { name: 'Home actions' }).getByRole('button', { name: 'Add income', exact: true }).click();
  await page.locator('#home-income-form input').fill('2000');
  await page.locator('#home-income-form button[type="submit"]').click();
  await expect(page.locator('[data-home-overview-content]')).toBeVisible();
  await expect(page.locator('[data-home-plan-content]')).toBeHidden();
  await expect(page.getByRole('region', { name: 'Your household at a glance' })).toContainText('€2,000.00');
});

for(const locale of ['de','en'])test(`website backup replacement preserves the original home on cancellation and write failure ${locale}`,async({page})=>{
 const de=locale==='de';await page.goto(de?'/de/zuhause':'/home');
 await page.getByRole('button',{name:de?'Zuhause erstellen':'Create my home',exact:true}).click();
 await page.evaluate(()=>{
  const p=JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
  Object.assign(p,{incomeAmount:2400,incomeDeferred:false,overviewReviewed:true,backupReminderDismissed:true});
  localStorage.setItem('eavesence-home-profile-v1',JSON.stringify(p));
  localStorage.setItem('eavesence-home-costs-v1',JSON.stringify([{id:'internet',name:'Internet',amount:40,category:'subscriptions',frequency:'monthly',nextDueDate:'2026-10-20',updatedAt:'2026-10-15T12:00:00Z'}]));
 });await page.reload();
 await page.getByRole('button',{name:de?'Einstellungen':'Settings',exact:true}).click();
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:de?'Sicherung exportieren':'Export backup',exact:true}).click();
 const {readFile}=await import('node:fs/promises');
 const backup=JSON.parse(await readFile((await (await download).path())!,'utf8'));
 backup.profile.name='Imported home';backup.profile.incomeAmount=3000;backup.costs[0].amount=50;
 const upload=page.locator('#home-settings input[type="file"]');
 const file={name:'eavesence-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))};
 const cancelled=page.waitForEvent('dialog');await upload.setInputFiles(file);await (await cancelled).dismiss();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).incomeAmount)).toBe(2400);
 await page.evaluate(()=>{
  const original=Storage.prototype.setItem;
  (window as unknown as {restoreStorageWrite:()=>void}).restoreStorageWrite=()=>{Storage.prototype.setItem=original;};
  Storage.prototype.setItem=function(key,value){if(key==='eavesence-home-costs-v1'&&JSON.parse(value)[0]?.amount===50)throw new DOMException('Storage full','QuotaExceededError');return original.call(this,key,value);};
 });
 page.once('dialog',dialog=>void dialog.accept());await upload.setInputFiles(file);
 await expect(page.locator('[data-home-notice]')).toContainText(de?'Import konnte nicht gespeichert':'Could not save the import');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).incomeAmount)).toBe(2400);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-costs-v1')!)[0].amount)).toBe(40);
 expect(await page.evaluate(()=>localStorage.getItem('eavesence-home-transaction-v1'))).toBeNull();
 await page.evaluate(()=>(window as unknown as {restoreStorageWrite:()=>void}).restoreStorageWrite());
 page.once('dialog',dialog=>void dialog.accept());await upload.setInputFiles(file);
 await expect(page.getByRole('heading',{name:'Imported home',exact:true})).toBeVisible();
 await page.reload();
 const overview=page.getByRole('region',{name:de?'Finanzen im Überblick':'Your household at a glance'});
 await expect(overview.locator('article').nth(2)).toContainText(de?'2.950,00':'2,950.00');
});
