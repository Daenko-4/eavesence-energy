import {test,expect,type Page} from '@playwright/test';
async function seed(page:Page,de=false){
 await page.clock.setFixedTime(new Date('2026-10-04T12:00:00Z'));await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto(de?'/de/zuhause':'/home');await page.getByRole('button',{name:de?'Zuhause erstellen':'Create my home',exact:true}).click();
 await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);p.incomeAmount=2400;p.overviewReviewed=true;p.backupReminderDismissed=true;localStorage.setItem('eavesence-home-profile-v1',JSON.stringify(p));localStorage.setItem('eavesence-home-costs-v1',JSON.stringify([{id:'rent',name:'Rent',category:'housing',amount:900,frequency:'monthly',nextDueDate:'',updatedAt:'2026-10-01T00:00:00Z'}]));});await page.reload();
}
for(const de of [false,true])for(const width of [320,390,1365])test(`memos and collapsible checklist in ${de?'de':'en'} at ${width}px`,async({page},info)=>{
 await page.setViewportSize({width,height:844});await seed(page,de);
 const list=page.getByRole('region',{name:de?'Monatscheckliste':'Monthly checklist'}),toggle=list.getByRole('button',{name:de?'Zahlungen abhaken':'Check off payments',exact:true});
 const payment=list.getByRole('checkbox',{name:/^Rent ·/});await payment.check();await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded','false');await expect(payment).toBeHidden();await expect(list.locator('[data-checklist-open]')).toBeVisible();await expect(list.locator('[data-checklist-progress]')).toContainText(de?'1 von 1 bezahlt':'1 of 1 paid');
 await list.scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath(`checklist-collapsed-${de?'de':'en'}-${width}.png`)});
 await toggle.click();await expect(payment).toBeChecked();expect(await toggle.locator('span').last().evaluate(el=>getComputedStyle(el).rotate)).toBe('-45deg');
 const memos=page.getByRole('region',{name:de?'Merken & erinnern':'Notes & reminders'}),summary=memos.getByRole('button').first();
 await expect(summary).toHaveAttribute('aria-expanded','false');await summary.click();await memos.getByRole('button',{name:de?'Notiz hinzufügen':'Add note',exact:true}).click();
 const form=memos.getByRole('form',{name:de?'Notiz bearbeiten':'Edit note'});
 await form.getByLabel(de?'Notiz':'Note',{exact:true}).fill('Review annual billing for three subscriptions');await form.getByRole('button',{name:de?'Jahresende':'Year end',exact:true}).click();await form.getByRole('button',{name:de?'Notiz speichern':'Save note',exact:true}).click();
 await expect(memos.getByText(de?'Später (1)':'Later (1)',{exact:true})).toBeVisible();const note=memos.getByRole('checkbox',{name:/Review annual billing/});await expect(note).toBeHidden();
 await page.reload();await memos.getByRole('button').first().click();await memos.getByText(de?'Später (1)':'Later (1)',{exact:true}).click();await expect(note).toBeVisible();
 await memos.getByRole('button',{name:/Review annual billing.* · (Bearbeiten|Edit)$/}).click();await form.getByLabel(de?'Erinnern am (optional)':'Reminder date (optional)',{exact:true}).fill('2026-10-04');await form.getByRole('button',{name:de?'Notiz speichern':'Save note',exact:true}).click();await expect(memos).toContainText(de?'Fällig':'Due');
 await memos.getByRole('button',{name:de?'Notiz hinzufügen':'Add note',exact:true}).click();await form.getByLabel(de?'Notiz':'Note',{exact:true}).fill('Ask the insurance provider about a cheaper rate');
 const bounds=await form.boundingBox();for(const control of await form.locator('input, textarea, button').all()){const box=await control.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(bounds!.x);expect(box!.x+box!.width).toBeLessThanOrEqual(bounds!.x+bounds!.width);}
 await form.scrollIntoViewIfNeeded();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:info.outputPath(`memos-${de?'de':'en'}-${width}.png`)});
 await form.getByRole('button',{name:de?'Notiz speichern':'Save note',exact:true}).click();await note.click();await memos.getByText(de?'Erledigt (1)':'Done (1)',{exact:true}).click();await expect(note).toBeChecked();
 await page.reload();await memos.getByRole('button').first().click();await memos.getByText(de?'Erledigt (1)':'Done (1)',{exact:true}).click();await expect(note).toBeChecked();
 page.once('dialog',dialog=>dialog.accept());await memos.getByRole('button',{name:/Review annual billing.* · (Entfernen|Remove)$/}).click();await expect(note).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).planning.memos.length)).toBe(1);
});
test('failed memo write retains the draft and reports an error instead of success',async({page})=>{
 await seed(page);const memos=page.getByRole('region',{name:'Notes & reminders'});await memos.getByRole('button').first().click();await memos.getByRole('button',{name:'Add note',exact:true}).click();await memos.getByLabel('Note',{exact:true}).fill('Keep this draft');
 await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='eavesence-home-profile-v1')throw new DOMException('Full','QuotaExceededError');original.call(this,key,value);};});
 await memos.getByRole('button',{name:'Save note',exact:true}).click();await expect(memos.getByRole('alert')).toContainText('Could not save the note');await expect(memos.getByLabel('Note',{exact:true})).toHaveValue('Keep this draft');await expect(memos.getByRole('status')).toHaveCount(0);
});
