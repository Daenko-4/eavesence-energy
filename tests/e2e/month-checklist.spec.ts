import { test, expect } from '@playwright/test';

async function seed(page: import('@playwright/test').Page, de=false, mixed=true) {
  await page.clock.setFixedTime(new Date('2026-10-04T12:00:00Z'));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(de?'/de/zuhause':'/home');
  await page.getByRole('button',{name:de?'Zuhause erstellen':'Create my home',exact:true}).click();
  await page.evaluate(({mixed})=>{
    const p=JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
    p.incomeAmount=2400;p.overviewReviewed=true;p.backupReminderDismissed=true;
    p.planning={cash:{balance:1600,asOf:'2026-10-04',payday:'2026-10-30',protected:100,everydayRemaining:200}};
    localStorage.setItem('eavesence-home-profile-v1',JSON.stringify(p));
    const base={category:'housing',updatedAt:'2026-10-01T00:00:00Z'};
    const costs=[{...base,id:'rent',name:'Rent',amount:900,frequency:'monthly',nextDueDate:'2026-10-05'}];
    if(mixed)costs.push(...[
      {...base,id:'internet',name:'Internet',amount:40,frequency:'monthly',nextDueDate:''},
      {...base,id:'weekly',name:'Weekly',amount:20,frequency:'weekly',nextDueDate:'2026-10-02'},
      {...base,id:'insurance',name:'Insurance',amount:600,frequency:'yearly',nextDueDate:'2026-10-15'},
      {...base,id:'tax',name:'Tax',amount:300,frequency:'yearly',nextDueDate:''},
    ]);
    localStorage.setItem('eavesence-home-costs-v1',JSON.stringify(costs));
  },{mixed});
  await page.reload();
}
for(const de of [false,true])for(const width of [320,390,1365])test(`month-first checklist, persistence and missing dates ${de?'de':'en'} ${width}px`,async({page},info)=>{
  await page.setViewportSize({width,height:844});await seed(page,de);
  const list=page.getByRole('region',{name:de?'Monatscheckliste':'Monthly checklist'});
  await expect(list).toBeVisible();await expect(list.locator('[data-checklist-open]')).toContainText(de?'1.640,00':'1,640.00');
  await expect(list.getByRole('checkbox')).toHaveCount(8);
  await expect(page.locator('[data-cost-manager]')).not.toHaveAttribute('open','');
  await expect(page.locator('#household-costs')).toBeHidden();
  const rent=list.getByRole('checkbox',{name:/^Rent ·/});await rent.check();
  await expect(rent).toBeChecked();await expect(list.locator('[data-checklist-open]')).toContainText(de?'740,00':'740.00');
  await expect(list.locator('[data-checklist-progress]')).toContainText(de?'1 von 8 bezahlt':'1 of 8 paid');
  await list.getByRole('button',{name:de?'Nächster Monat':'Next month',exact:true}).click();
  await expect(list.locator('[data-checklist-month]')).toContainText('November');
  await expect(rent).not.toBeChecked();await expect(list.locator('[data-checklist-open]')).toContainText(de?'1.020,00':'1,020.00');
  await list.getByRole('button',{name:de?'Vorheriger Monat':'Previous month',exact:true}).click();await expect(rent).toBeChecked();
  await page.reload();await expect(rent).toBeChecked();
  await expect(list).toContainText(de?'Monatlich · Termin fehlt':'Monthly · date missing');
  await expect(list).toContainText(de?'Sie fehlen im Betrag oben':'excluded from the amount above');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({fullPage:true,path:info.outputPath(`monthly-checklist-${de?'de':'en'}-${width}.png`)});
  await list.getByRole('button',{name:de?'Tax · Termin ergänzen':'Tax · Add date',exact:true}).click();
  await expect(page.locator('#household-cost-name')).toHaveValue('Tax');await expect(page.locator('#household-cost-name')).toBeFocused();
});

test('payment changes invalidate the old balance and a fresh payday calculation excludes the paid bill',async({page})=>{
  await seed(page,false,false);
  await page.getByRole('checkbox',{name:/^Rent ·/}).check();
  await page.getByRole('navigation',{name:'Choose workspace'}).getByRole('button',{name:/Plan & save/}).click();
  const payday=page.getByRole('region',{name:'Your available budget',exact:true});
  await expect(payday).toContainText('Please confirm your current balance');
  await payday.getByRole('button',{name:'Update balance / see calculation',exact:true}).click();
  await payday.getByLabel('Balance available today',{exact:true}).fill('700');
  await payday.getByRole('button',{name:'Confirm balance & calculate',exact:true}).click();
  await expect(payday).toContainText('€400.00');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!).planning.cash.needsRefresh)).toBeUndefined();
});

test('failed checkmark persistence leaves the payment open with a visible retry message',async({page})=>{
  await seed(page,false,false);
  await page.evaluate(()=>{
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){if(key==='eavesence-home-profile-v1')throw new DOMException('Quota exceeded','QuotaExceededError');original.call(this,key,value);};
  });
  const rent=page.getByRole('checkbox',{name:/^Rent ·/});await rent.click();await expect(rent).not.toBeChecked();
  await expect(page.getByRole('region',{name:'Monthly checklist'}).getByRole('alert')).toContainText('Could not save this checkmark');
});
