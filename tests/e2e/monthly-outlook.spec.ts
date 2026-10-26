import { expect, test, type Page } from '@playwright/test';
import { homeDetail } from './home-navigation';

async function seed(page:Page, de:boolean) {
  await page.clock.setFixedTime(new Date('2026-10-24T12:00:00Z'));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(de ? '/de/zuhause' : '/home');
  await page.getByRole('button',{name:de?'Zuhause erstellen':'Create my home',exact:true}).click();
  await page.evaluate(()=>{
    const profile=JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
    Object.assign(profile,{incomeAmount:2400,incomeFrequency:'monthly',incomeDeferred:false,overviewReviewed:true,backupReminderDismissed:true,
      incomeExtras:[{id:'salary13',kind:'salary13',amount:2000,month:11},{id:'bonus',kind:'bonus',amount:500,month:11,year:2026},{id:'old',kind:'bonus',amount:200,month:11,year:2025}],
      planning:{actualPayments:[{costId:'energy',month:'2026-11',date:'2026-11-12',amount:95,plannedAmount:80,frequency:'monthly',anchor:'2026-10-12',updatedAt:'2026-10-24T12:00:00Z'}],
        paidPayments:[{costId:'rent',month:'2026-11',date:'2026-11-01',amount:900,frequency:'monthly',anchor:'2026-10-01',paidAt:'2026-10-24T12:00:00Z'}]}});
    localStorage.setItem('eavesence-home-profile-v1',JSON.stringify(profile));
    localStorage.setItem('eavesence-home-costs-v1',JSON.stringify([
      {id:'rent',name:'Rent',amount:900,frequency:'monthly',category:'housing',nextDueDate:'2026-10-01',updatedAt:'2026-10-24T12:00:00Z'},
      {id:'insurance',name:'Insurance',amount:600,frequency:'yearly',category:'insurance',nextDueDate:'2026-11-15',updatedAt:'2026-10-24T12:00:00Z'},
      {id:'energy',name:'Electricity',amount:80,variableAmount:true,frequency:'monthly',category:'energy',nextDueDate:'2026-10-12',updatedAt:'2026-10-24T12:00:00Z'},
      {id:'internet',name:'Internet',amount:40,frequency:'monthly',category:'subscriptions',nextDueDate:'',updatedAt:'2026-10-24T12:00:00Z'},
    ]));
  });
  await page.reload();await homeDetail(page,'upcoming');
}

for (const de of [false,true]) for (const width of [320,1365]) {
  test(`month outlook explains income, due bills and remaining money ${de?'de':'en'} ${width}`,async({page},info)=>{
    const t=(a:string,b:string)=>de?a:b;
    await page.setViewportSize({width,height:900});await seed(page,de);
    const panel=page.locator('[data-home-next-month]'), cards=panel.locator('[data-home-kpi]');
    await expect(panel.getByRole('heading',{level:2}).first()).toContainText('November 2026');

    await expect(cards).toHaveCount(3);
    await expect(panel.locator('[data-home-kpi=income]')).toContainText(t('4.900,00','4,900.00'));
    await expect(panel.locator('[data-home-kpi=income]')).toContainText(t('2.500,00','2,500.00'));
    await expect(panel.locator('[data-home-kpi=costs]')).toContainText(t('1.635,00','1,635.00'));
    await expect(panel.locator('[data-home-month-result]')).toContainText(t('3.265,00','3,265.00'));
    await expect(panel.locator('.home-month-context')).toHaveText(t('Für Alltag & Freizeit, nach erfassten Fixkosten. Kein Kontostand.','For everyday spending, after recorded fixed costs. Not your account balance.'));
    await expect(panel).toContainText(t('Monatliche Kosten ohne Zahlungstermin','Monthly costs without a payment date'));
    await expect(panel.locator('li').filter({hasText:'Electricity'})).toContainText(t('95,00','95.00'));
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({fullPage:true,path:info.outputPath(`month-outlook-${de?'de':'en'}-${width}.png`)});
    await homeDetail(page,'budget');
    await expect(page.locator('[data-home-monthly-budget] article').nth(2)).toContainText(t('3.265,00','3,265.00'));

    await page.evaluate(()=>{
      const costs=JSON.parse(localStorage.getItem('eavesence-home-costs-v1')!);
      costs.push({id:'missing',name:'Annual bill',amount:1200,frequency:'yearly',category:'other',nextDueDate:'',updatedAt:'2026-10-24T12:00:00Z'});
      localStorage.setItem('eavesence-home-costs-v1',JSON.stringify(costs));
    });
    await page.reload();await homeDetail(page,'upcoming');
    await expect(panel.locator('[data-home-kpi=costs]')).toContainText(t('Bekannte Kosten','Known costs'));
    await expect(panel.locator('[data-home-month-result]')).toContainText('—');
    await expect(panel).toContainText(t('Diese Kosten brauchen einen Termin','These costs need a date'));
    await panel.getByRole('button',{name:`Annual bill · ${t('Termin ergänzen','Add date')}`,exact:true}).click();
    await expect(page.locator('#household-cost-form')).toBeVisible();

    await page.evaluate(()=>{
      const profile=JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);profile.incomeAmount=33600;profile.incomeFrequency='yearly';
      localStorage.setItem('eavesence-home-profile-v1',JSON.stringify(profile));
      const costs=JSON.parse(localStorage.getItem('eavesence-home-costs-v1')!).filter((cost:{id:string})=>cost.id!=='missing');
      localStorage.setItem('eavesence-home-costs-v1',JSON.stringify(costs));
    });
    await page.reload();await homeDetail(page,'upcoming');
    await expect(panel.locator('[data-home-kpi=income]')).toContainText(t('2.800,00','2,800.00'));
    await expect(panel.locator('[data-home-month-result]')).toContainText(t('ca.','approx.'));
    await expect(panel.locator('[data-home-month-result]')).toContainText(t('1.165,00','1,165.00'));
    await expect(panel).toContainText(t('Einkommen ist ein Jahresdurchschnitt','income is an annual average'));

    await page.evaluate(()=>{
      const profile=JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);profile.incomeAmount=0;profile.incomeFrequency='monthly';profile.incomeExtras=[];
      localStorage.setItem('eavesence-home-profile-v1',JSON.stringify(profile));
      const costs=JSON.parse(localStorage.getItem('eavesence-home-costs-v1')!).filter((cost:{id:string})=>cost.id!=='missing');
      localStorage.setItem('eavesence-home-costs-v1',JSON.stringify(costs));
    });
    await page.reload();await homeDetail(page,'upcoming');
    await expect(panel.locator('[data-home-kpi=income]')).toContainText(t('0,00','0.00'));
    await expect(panel.locator('[data-home-month-result]')).toContainText(t('1.635,00','1,635.00'));
    await expect(panel.locator('[data-home-month-result]')).toContainText(t('fehlen','Shortfall'));
    await expect(panel.locator('[data-home-month-result]').locator('p').nth(1)).toHaveCSS('color','rgb(146, 64, 14)');

    await page.evaluate(()=>{
      const profile=JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);delete profile.incomeAmount;profile.incomeDeferred=true;
      localStorage.setItem('eavesence-home-profile-v1',JSON.stringify(profile));
    });
    await page.reload();await homeDetail(page,'upcoming');
    await expect(panel.locator('[data-home-kpi=income]')).toContainText('—');await expect(panel.locator('[data-home-month-result]')).toContainText('—');
    await page.getByRole('group',{name:t('Aktionen für dein Zuhause','Home actions'),exact:true}).getByRole('button',{name:t('Einkommen hinzufügen','Add income'),exact:true}).click();
    await expect(page.locator('#home-income-form')).toBeVisible();
  });
}
