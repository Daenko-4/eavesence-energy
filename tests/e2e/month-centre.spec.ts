import { expect, test } from '@playwright/test';
import { homeWorkspace, paydayStep } from './home-navigation';

for(const de of [false,true]) for(const width of [320,768,1365]) {
  test(`month centre edits in context and connects the matching Pro workspace ${de?'de':'en'} ${width}`,async({page},info)=>{
    const t=(a:string,b:string)=>de?a:b;
    await page.setViewportSize({width,height:900});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.clock.setFixedTime(new Date('2026-10-25T12:00:00Z'));
    await page.goto(de?'/de/zuhause':'/home');
    await page.getByRole('button',{name:t('Zuhause erstellen','Create my home'),exact:true}).click();
    await page.evaluate(()=>{
      const p=JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
      Object.assign(p,{incomeAmount:2800,incomeFrequency:'monthly',incomeDeferred:false,overviewReviewed:true,backupReminderDismissed:true});
      localStorage.setItem('eavesence-home-profile-v1',JSON.stringify(p));
      localStorage.setItem('eavesence-home-costs-v1',JSON.stringify([
        {id:'rent',name:'Rent',amount:980,category:'housing',frequency:'monthly',nextDueDate:'2026-10-01',updatedAt:'2026-10-01T12:00:00Z'},
        {id:'internet',name:'Internet',amount:40,category:'subscriptions',frequency:'monthly',nextDueDate:'2026-10-28',updatedAt:'2026-10-01T12:00:00Z'},
        {id:'power',name:'Power',amount:95,variableAmount:true,category:'energy',frequency:'monthly',nextDueDate:'2026-10-26',updatedAt:'2026-10-01T12:00:00Z'},
      ]));
    });
    await page.reload();
    const workspace=page.locator('.home-month-workspace');
    const checklist=page.locator('[data-month-checklist]');
    const remaining=await page.locator('[data-home-remaining]').innerText();
    await checklist.getByRole('checkbox',{name:/^Rent ·/}).check();
    await expect(checklist.getByRole('button',{name:t('Rückgängig','Undo'),exact:true})).toBeVisible();
    await checklist.getByRole('button',{name:t('Rückgängig','Undo'),exact:true}).click();
    await expect(checklist.getByRole('checkbox',{name:/^Rent ·/})).not.toBeChecked();
    await expect(page.locator('[data-home-remaining]')).toHaveText(remaining);
    await page.evaluate(()=>{
      const original=Storage.prototype.setItem;
      (window as unknown as {restoreCentreStorage:()=>void}).restoreCentreStorage=()=>{Storage.prototype.setItem=original;};
      Storage.prototype.setItem=function(key,value){if(key==='eavesence-home-profile-v1')throw new DOMException('Storage full','QuotaExceededError');return original.call(this,key,value);};
    });
    await checklist.getByRole('checkbox',{name:/^Rent ·/}).click();
    await expect(checklist.getByRole('alert')).toContainText(t('Häkchen konnte nicht gespeichert','Could not save this checkmark'));
    await expect(checklist.getByRole('checkbox',{name:/^Rent ·/})).not.toBeChecked();
    await expect(checklist.getByRole('button',{name:t('Rückgängig','Undo'),exact:true})).toHaveCount(0);
    await page.evaluate(()=>(window as unknown as {restoreCentreStorage:()=>void}).restoreCentreStorage());

    await checklist.getByRole('button',{name:'Internet · Details',exact:true}).click();
    const context=page.locator('[data-home-payment-context]');
    await expect(context).toContainText('Internet');
    if(width < 900){
      await expect(context.locator('[data-home-context-heading]')).toBeFocused();
      const heading=(await context.locator('[data-home-context-heading]').boundingBox())!;
      expect(heading.y).toBeGreaterThanOrEqual((await page.locator('header').boundingBox())!.height);
    }
    await context.getByRole('button',{name:t('Details schließen','Close details'),exact:true}).click();
    await expect(checklist.getByRole('button',{name:'Internet · Details',exact:true})).toBeFocused();
    await checklist.getByRole('button',{name:'Internet · Details',exact:true}).click();
    await context.getByRole('button',{name:t('Kosten bearbeiten','Edit cost'),exact:true}).click();
    const editor=page.locator('[data-home-context-editor]');
    await expect(editor).toBeVisible();
    await expect(page.locator('[data-cost-manager]')).toBeHidden();
    await expect(page.locator('#household-cost-amount')).toHaveValue('40');
    await page.locator('#household-cost-amount').fill('35');
    await page.locator('#household-cost-amount').press('Enter');
    await expect(editor).toHaveCount(0);
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-costs-v1')!).find((c:{id:string})=>c.id==='internet').amount)).toBe(35);
    const actions=page.getByRole('group',{name:t('Aktionen für dein Zuhause','Home actions'),exact:true});
    await actions.getByRole('button',{name:t('Kosten hinzufügen','Add cost'),exact:true}).click();
    await page.locator('#household-cost-name').fill('Phone');
    await page.locator('#household-cost-amount').fill('20');
    await page.locator('#household-cost-form input[type=date]').first().fill('2026-10-28');
    await page.locator('#household-cost-form').getByRole('button',{name:t('Speichern','Save'),exact:true}).click();
    await expect(checklist.getByRole('checkbox',{name:/^Phone ·/})).toBeVisible();
    await checklist.getByRole('button',{name:t('Power · Rechnungsbetrag','Power · Invoice amount'),exact:true}).click();
    const invoice=checklist.getByRole('textbox',{name:t('Power · Rechnungsbetrag','Power · Invoice amount'),exact:true});
    await invoice.fill('85');await invoice.press('Enter');
    // Invoice edits must not overwrite the recurring planning amount.
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-costs-v1')!).find((c:{id:string})=>c.id==='power').amount)).toBe(95);
    await checklist.getByRole('button',{name:'Power · Details',exact:true}).click();
    await context.getByRole('button',{name:t('Kosten bearbeiten','Edit cost'),exact:true}).click();
    await expect(page.locator('#household-cost-amount')).toHaveValue('95');
    await editor.getByRole('button',{name:t('Bearbeitung schließen','Close editor'),exact:true}).click();
    await actions.getByRole('button',{name:t('Einkommen ändern','Edit income'),exact:true}).click();
    const income=page.locator('#home-income-form input').first();
    await income.fill('2900');
    await checklist.getByRole('checkbox',{name:/^Rent ·/}).check();
    await expect(income).toHaveValue('2900');
    await income.press('Enter');
    await expect(income).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await page.screenshot({fullPage:true,path:info.outputPath(`centre-home-${de?'de':'en'}-${width}.png`)});
    await homeWorkspace(page,'plan');
    const cash=page.locator('[data-payday-state]');
    await cash.getByLabel(t('Aktueller Kontostand','Current account balance'),{exact:true}).fill('1500');
    await paydayStep(page,1);
    await cash.getByLabel(t('Nächstes Gehalt am','Next payday'),{exact:true}).fill('2026-11-05');
    await paydayStep(page,2);
    await cash.getByLabel(t('Alltagsausgaben bis zum Gehalt','Everyday spending until payday'),{exact:true}).fill('200');
    await cash.getByRole('button',{name:t('Verfügbares Geld anzeigen','Show available money'),exact:true}).click();
    await expect(cash.locator('[data-payday-result]')).toBeVisible();
    await expect(cash.locator('[data-payday-calculation]')).toHaveAttribute('open','');
    if(width>=1180) {
      const left=(await cash.locator('.centre-cash-summary').boundingBox())!,middle=(await cash.locator('.centre-cash-main').boundingBox())!,right=(await cash.locator('.centre-cash-tools').boundingBox())!;
      expect(left.x+left.width).toBeLessThan(middle.x);expect(middle.x+middle.width).toBeLessThan(right.x);
    }
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await page.screenshot({fullPage:true,path:info.outputPath(`centre-payday-${de?'de':'en'}-${width}.png`)});
    const questions=page.getByRole('group',{name:t('Planungsfrage wählen','Choose planning question'),exact:true});
    await questions.getByRole('button',{name:t('Realistisch sparen','Find realistic savings'),exact:true}).click();
    const savings=page.locator('[data-savings-coach=opportunities]');
    await savings.locator('.savings-choice select').selectOption('internet');
    await expect(savings.locator('.savings-edit')).toBeVisible();
    await savings.locator('.savings-edit input[inputmode=decimal]').fill('20');
    await expect(savings.locator('[data-savings-centre-result]')).toContainText(t('Geplant, noch nicht eingespart.','Planned, not saved yet.'));
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await page.screenshot({fullPage:true,path:info.outputPath(`centre-savings-${de?'de':'en'}-${width}.png`)});
    await questions.getByRole('button',{name:t('Erreichte Ersparnis','Savings achieved'),exact:true}).click();
    await expect(page.locator('[data-savings-coach=progress] .planning-card-amount')).toContainText(t('0,00','0.00'));
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(workspace).toBeHidden();
  });
}
