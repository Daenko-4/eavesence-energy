import { expect, test } from '@playwright/test';
import { homeDetail, homeWorkspace, planningPeriod } from './home-navigation';

for (const de of [false,true]) for (const width of [390,1365]) {
  test(`aligned form actions save with Enter ${de?'de':'en'} ${width}`,async({page},info)=>{
    test.setTimeout(45_000);
    const t=(a:string,b:string)=>de?a:b;
    await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto(de?'/de/zuhause':'/home');
    await page.getByRole('button',{name:t('Zuhause erstellen','Create my home'),exact:true}).click();
    await page.evaluate(()=>{
      const profile=JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
      Object.assign(profile,{incomeAmount:2400,incomeFrequency:'monthly',incomeDeferred:false,overviewReviewed:true,backupReminderDismissed:true});
      localStorage.setItem('eavesence-home-profile-v1',JSON.stringify(profile));
      localStorage.setItem('eavesence-home-costs-v1',JSON.stringify([{id:'internet',name:'Internet',amount:40,frequency:'monthly',category:'subscriptions',nextDueDate:'2026-10-25',updatedAt:'2026-10-24T12:00:00Z'}]));
    });
    await page.reload();
    await page.getByRole('group',{name:t('Aktionen für dein Zuhause','Home actions'),exact:true}).getByRole('button',{name:t('Einkommen ändern','Edit income'),exact:true}).click();
    const income=page.locator('#home-income-form'), period=income.getByLabel(t('Zeitraum','Period'),{exact:true}), summary=income.locator('.income-extras-editor > summary');
    const arrow=(await income.locator('.income-period-chevron').boundingBox())!;
    const disclosureCenter=await summary.evaluate(element=>{
      const box=element.getBoundingClientRect(),style=getComputedStyle(element,'::after');return box.right-parseFloat(style.width)/2;
    });
    expect(Math.abs(arrow.x+arrow.width/2-disclosureCenter)).toBeLessThan(1);
    const periodBox=(await period.boundingBox())!,saveBox=(await income.locator('button[type=submit]').boundingBox())!;
    expect(Math.abs(periodBox.x+periodBox.width-saveBox.x-saveBox.width)).toBeLessThan(1);
    await summary.click();
    await income.screenshot({path:info.outputPath(`income-actions-${de?'de':'en'}-${width}.png`)});
    await income.locator('input').first().fill('2450');await income.locator('input').first().press('Enter');
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).incomeAmount)).toBe(2450);

    await page.getByRole('group',{name:t('Aktionen für dein Zuhause','Home actions'),exact:true}).getByRole('button',{name:t('Kosten hinzufügen','Add cost'),exact:true}).click();
    const cost=page.locator('#household-cost-form'),name=cost.locator('#household-cost-name');
    await name.fill('Enter cost');const amount=cost.getByLabel(t('Betrag','Amount'),{exact:true});await amount.fill('25');
    const nameBox=(await name.boundingBox())!,costSave=(await cost.locator('button[type=submit]').boundingBox())!,cancel=(await cost.getByRole('button',{name:t('Abbrechen','Cancel'),exact:true}).boundingBox())!;
    expect(Math.abs(nameBox.x+nameBox.width-costSave.x-costSave.width)).toBeLessThan(1);expect(cancel.x).toBeLessThan(costSave.x);
    await amount.press('Enter');
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-costs-v1')!).some((c:{name:string;amount:number})=>c.name==='Enter cost'&&c.amount===25))).toBe(true);

    await homeWorkspace(page,'plan');await planningPeriod(page,'budget');
    const budget=page.locator('[data-planning-budget]'),everyday=budget.getByLabel(t('Alltagsausgaben pro Monat (geschätzt)','Everyday spending per month (estimate)'),{exact:true});
    await everyday.fill('350');await everyday.press('Enter');
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).variableMonthly)).toBe(350);

    await homeWorkspace(page,'overview');await homeDetail(page,'notes');
    const notes=page.locator('[data-home-memos]');await notes.getByRole('button',{name:t('Notiz hinzufügen','Add note'),exact:true}).click();
    const note=notes.getByLabel(t('Notiz','Note'),{exact:true});await note.fill('First line\nSecond line');await note.press('Enter');
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).planning?.memos?.length??0)).toBe(0);
    await note.press('Control+Enter');
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).planning?.memos?.length??0)).toBe(1);
    await expect(notes).toContainText('First line');

    await page.goto(de?'/de/rechner':'/calculator');
    const power=page.locator('[data-calculator-form] input[type=number]:visible').first();await power.fill('1800');
    await expect(page.locator('.calculator-save-action')).toBeEnabled();await power.press('Enter');
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-saved-devices-v1')??'[]').length)).toBe(1);
  });
}
