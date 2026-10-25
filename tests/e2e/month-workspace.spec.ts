import { expect, test } from '@playwright/test';

for (const de of [false, true]) for (const width of [320, 768, 1024, 1365]) {
  test(`month workspace keeps payments visible and side information in place ${de ? 'de' : 'en'} ${width}`, async ({ page }, info) => {
    const t = (a:string,b:string) => de ? a : b;
    await page.setViewportSize({width,height:900});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.clock.setFixedTime(new Date('2026-10-25T12:00:00Z'));
    await page.goto(de ? '/de/zuhause' : '/home');
    await page.getByRole('button',{name:t('Zuhause erstellen','Create my home'),exact:true}).click();
    await page.evaluate(()=>{
      const profile=JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
      Object.assign(profile,{incomeAmount:2400,incomeFrequency:'monthly',incomeDeferred:false,overviewReviewed:true,backupReminderDismissed:true,incomeExtras:[{id:'extra',kind:'salary14',month:11,amount:2000},{id:'summer',kind:'salary13',month:6,amount:2000},{id:'bonus',kind:'bonus',month:12,amount:500}]});
      localStorage.setItem('eavesence-home-profile-v1',JSON.stringify(profile));
      localStorage.setItem('eavesence-home-costs-v1',JSON.stringify(Array.from({length:20},(_,index)=>({id:`cost-${index}`,name:`Bill ${index+1}`,amount:20,frequency:'monthly',category:'other',nextDueDate:`2026-10-${String(index+1).padStart(2,'0')}`,updatedAt:'2026-10-25T12:00:00Z'}))));
    });
    await page.reload();
    const workspace=page.locator('.home-month-workspace');
    const open=workspace.locator('[data-payment-group=open]'),paid=workspace.locator('[data-payment-group=paid]');
    await expect(open.getByRole('checkbox')).toHaveCount(20);
    await expect(paid).toContainText(t('Noch keine Zahlungen abgehakt.','No payments checked off yet.'));
    await expect(workspace.locator('[data-home-remaining]')).toContainText(t('2.000,00','2,000.00'));
    // The first payment should be reachable without scrolling a full screen.
    const firstRow=(await open.getByRole('checkbox').first().boundingBox())!;
    expect(firstRow.y+firstRow.height).toBeLessThan(width < 900 ? 700 : 620);
    const next=workspace.getByRole('button',{name:t('Nächster Monat','Next month'),exact:true});
    await next.click();
    await expect(workspace.locator('[data-home-kpi=income]')).toContainText(t('4.400,00','4,400.00'));
    await expect(workspace.locator('[data-checklist-month]')).toContainText('November 2026');
    await workspace.getByRole('button',{name:t('Dieser Monat','This month'),exact:true}).click();
    const name=/^Bill 1 ·/;
    await workspace.getByRole('checkbox',{name}).check();
    await expect(paid.getByRole('checkbox',{name})).toBeChecked();
    await expect(open.getByRole('checkbox')).toHaveCount(19);
    await expect(workspace.locator('[data-checklist-paid]')).toContainText(t('20,00','20.00'));
    // Payment status affects unpaid money, never the month's scheduled fixed costs.
    await expect(workspace.locator('[data-home-remaining]')).toContainText(t('2.000,00','2,000.00'));
    if(width>=1180){
      const left=(await workspace.locator('.home-month-summary').boundingBox())!,middle=(await workspace.locator('.home-month-payments').boundingBox())!,right=(await workspace.locator('.home-month-tools').boundingBox())!;
      for(const card of await workspace.locator('[data-home-kpi]').all()) {
        const box=(await card.boundingBox())!;
        expect(Math.abs(box.width-left.width)).toBeLessThan(1);
      }
      expect(left.x+left.width).toBeLessThan(middle.x);
      expect(middle.x+middle.width).toBeLessThan(right.x);
      await page.evaluate(()=>scrollTo({top:450,behavior:'instant'}));
      for(const selector of ['.home-month-summary','.home-month-tools'])expect((await workspace.locator(selector).boundingBox())!.y).toBeGreaterThanOrEqual(90);
      const tools=workspace.locator('.home-month-tools');
      expect((await tools.boundingBox())!.height).toBeLessThanOrEqual(788);
      await tools.evaluate(el=>{el.scrollTop=el.scrollHeight;});
      expect((await tools.locator('[data-income-extras-summary] li').last().boundingBox())!.y+(await tools.locator('[data-income-extras-summary] li').last().boundingBox())!.height).toBeLessThanOrEqual(900);
      await tools.evaluate(el=>{el.scrollTop=0;});
      await page.screenshot({path:info.outputPath(`workspace-scrolled-${de?'de':'en'}-${width}.png`)});
    } else {
      const month=(await workspace.locator('.home-month-toolbar').boundingBox())!,summary=(await workspace.locator('.home-month-summary').boundingBox())!,list=(await workspace.locator('.home-month-payments').boundingBox())!;
      expect(month.y+month.height).toBeLessThanOrEqual(summary.y);
      expect(summary.y+summary.height).toBeLessThanOrEqual(list.y);
    }
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await page.screenshot({fullPage:true,path:info.outputPath(`workspace-${de?'de':'en'}-${width}.png`)});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.reload();
    await expect(paid.getByRole('checkbox',{name})).toBeChecked();
    await workspace.getByRole('checkbox',{name}).uncheck();
    await expect(open.getByRole('checkbox',{name})).not.toBeChecked();
    await page.getByRole('group',{name:t('Aktionen für dein Zuhause','Home actions'),exact:true}).getByRole('button',{name:t('Einkommen ändern','Edit income'),exact:true}).click();
    await expect(open.getByRole('checkbox')).toHaveCount(20);
    const input=page.locator('#home-income-form input').first();await expect(input).toBeFocused();
    await input.fill('2500');await input.press('Enter');
    await expect(workspace.locator('[data-home-remaining]')).toContainText(t('2.100,00','2,100.00'));
    // A tall information rail must not stretch the month rows when few bills exist.
    await page.evaluate(()=>{
      const costs=JSON.parse(localStorage.getItem('eavesence-home-costs-v1')!);
      localStorage.setItem('eavesence-home-costs-v1',JSON.stringify(costs.slice(0,1)));
    });
    await page.reload();
    await expect(open.getByRole('checkbox')).toHaveCount(1);
    const shortToolbar=(await workspace.locator('.home-month-toolbar').boundingBox())!;
    const shortSummary=(await workspace.locator('.home-month-summary').boundingBox())!;
    const shortList=(await workspace.locator('.home-month-payments').boundingBox())!;
    expect(shortToolbar.height).toBeLessThan(100);
    if(width>=1180) expect(Math.abs(shortList.y-shortToolbar.y-shortToolbar.height)).toBeLessThanOrEqual(1);
    else expect(shortList.y-shortSummary.y-shortSummary.height).toBeLessThanOrEqual(12);
    await page.screenshot({fullPage:true,path:info.outputPath(`workspace-short-${de?'de':'en'}-${width}.png`)});
  });
}
