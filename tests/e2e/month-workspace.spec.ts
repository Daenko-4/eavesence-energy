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
    const annualSummary=workspace.locator('[data-income-extras-summary]');
    await expect(annualSummary.locator('.income-annual-metrics dd')).toHaveCount(2);
    const annualHierarchy=await annualSummary.evaluate(el=>{
      const metrics=Array.from(el.querySelectorAll('.income-annual-metrics dd'));
      const extras=Array.from(el.querySelectorAll('.income-extra-payments li > span:last-child'));
      return {metrics:metrics.map(n=>({size:parseFloat(getComputedStyle(n).fontSize),y:n.getBoundingClientRect().y,bottom:n.getBoundingClientRect().bottom})),extras:extras.map(n=>({size:parseFloat(getComputedStyle(n).fontSize),y:n.getBoundingClientRect().y}))};
    });
    expect(Math.abs(annualHierarchy.metrics[0].y-annualHierarchy.metrics[1].y)).toBeLessThanOrEqual(1);
    expect(Math.min(...annualHierarchy.metrics.map(n=>n.size))).toBeGreaterThan(Math.max(...annualHierarchy.extras.map(n=>n.size)));
    expect(Math.max(...annualHierarchy.metrics.map(n=>n.bottom))).toBeLessThan(Math.min(...annualHierarchy.extras.map(n=>n.y)));

    const open=workspace.locator('[data-payment-group=open]'),paid=workspace.locator('[data-payment-group=paid]');
    await expect(open.getByRole('checkbox')).toHaveCount(20);
    await expect(paid).toHaveCount(0);
    await expect(workspace.locator('[data-home-remaining]')).toContainText(t('2.000,00','2,000.00'));
    // The first payment should be reachable without scrolling a full screen.
    const firstRow=(await open.getByRole('checkbox').first().boundingBox())!;
    expect(firstRow.y+firstRow.height).toBeLessThan(width < 900 ? 700 : 620);
    const alignedFigures=async()=>{
      const figures=workspace.locator(width<640?'[data-home-kpi]:not([data-home-kpi=remaining])':'[data-home-kpi]');
      const boxes=await figures.evaluateAll(cards=>cards.map(card=>{const a=card.querySelector('.home-month-kpi-amount')!.getBoundingClientRect(),l=card.querySelector('.home-month-kpi-label')!.getBoundingClientRect(),b=card.getBoundingClientRect();return {amount:a.y,label:l.y,labelBottom:l.bottom,width:b.width,center:a.x+a.width/2-(b.x+b.width/2)};}));
      expect(Math.max(...boxes.map(b=>b.amount))-Math.min(...boxes.map(b=>b.amount))).toBeLessThanOrEqual(1);
      if(width>=640) {
        expect(Math.max(...boxes.map(b=>b.label))-Math.min(...boxes.map(b=>b.label))).toBeLessThanOrEqual(1);
        expect(Math.max(...boxes.map(b=>b.width))-Math.min(...boxes.map(b=>b.width))).toBeLessThanOrEqual(1);
      }
      for(const b of boxes){expect(Math.abs(b.center)).toBeLessThanOrEqual(1);expect(b.amount).toBeGreaterThanOrEqual(b.labelBottom);}
    };
    await alignedFigures();
    const incomeBox=(await workspace.locator('[data-home-kpi=income]').boundingBox())!,costBox=(await workspace.locator('[data-home-kpi=costs]').boundingBox())!,resultBox=(await workspace.locator('[data-home-kpi=remaining]').boundingBox())!;
    expect(incomeBox.x).toBeLessThan(costBox.x);
    if(width>=640)expect(costBox.x+costBox.width).toBeLessThanOrEqual(resultBox.x+1);
    else expect(costBox.y+costBox.height).toBeLessThanOrEqual(resultBox.y+1);
    await expect(workspace.locator('[data-home-month-result]')).toHaveCSS('background-color','rgb(224, 241, 228)');
    await expect(workspace.locator('[data-home-remaining]')).toHaveCSS('color','rgb(8, 122, 69)');
    if(width>=640 && width<1180) {
      const cards=await workspace.locator('[data-home-kpi]').evaluateAll(nodes=>nodes.map(node=>{const b=node.getBoundingClientRect();return {top:b.top,left:b.left};}));
      expect(new Set(cards.map(card=>card.top)).size).toBe(1);
      expect(cards[0].left).toBeLessThan(cards[1].left);
      expect(cards[1].left).toBeLessThan(cards[2].left);
      expect((await workspace.locator('[data-home-monthly-budget]').boundingBox())!.height).toBeLessThan(135);
    }
    const next=workspace.getByRole('button',{name:t('Nächster Monat','Next month'),exact:true});
    await next.click();
    await expect(workspace.locator('[data-home-kpi=income]')).toContainText(t('4.400,00','4,400.00'));
    await expect(workspace.locator('[data-checklist-month]')).toContainText('November 2026');
    await alignedFigures();
    await workspace.getByRole('button',{name:t('Dieser Monat','This month'),exact:true}).click();
    const name=/^Bill 1 ·/;
    await workspace.getByRole('checkbox',{name}).check();
    await expect(paid.getByRole('checkbox',{name})).toBeChecked();
    await expect(open.getByRole('checkbox')).toHaveCount(19);
    await expect(workspace.locator('[data-checklist-paid]')).toContainText(t('20,00','20.00'));
    // Payment status affects unpaid money, never the month's scheduled fixed costs.
    await expect(workspace.locator('[data-home-remaining]')).toContainText(t('2.000,00','2,000.00'));
    const summary=workspace.locator('.home-month-summary');
    const monthBox=(await workspace.locator('.home-month-toolbar').boundingBox())!, summaryBox=(await summary.boundingBox())!, listBox=(await workspace.locator('.home-month-payments').boundingBox())!;
    expect(monthBox.y+monthBox.height).toBeLessThanOrEqual(summaryBox.y);
    expect(summaryBox.y+summaryBox.height).toBeLessThanOrEqual(listBox.y);
    expect(Math.abs(summaryBox.x+summaryBox.width/2-width/2)).toBeLessThan(2);
    await expect(summary).toHaveCSS('position','static');
    await expect(workspace.locator('.home-month-tools')).toHaveCount(0);
    await page.evaluate(()=>scrollTo({top:450,behavior:'instant'}));
    expect((await summary.boundingBox())!.y).toBeLessThan(summaryBox.y-400);
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
    expect(shortList.y-shortSummary.y-shortSummary.height).toBeLessThanOrEqual(12);
    await page.screenshot({fullPage:true,path:info.outputPath(`workspace-short-${de?'de':'en'}-${width}.png`)});
    await workspace.getByRole('checkbox',{name:/^Bill 1 ·/}).check();
    const paymentSummary=workspace.locator('.centre-payments-summary');
    await expect(paymentSummary.locator('[data-checklist-open]')).toContainText(t('0,00','0.00'));
    await expect(paymentSummary.locator('[data-checklist-progress]')).toHaveText(t('1 von 1 bezahlt','1 of 1 paid'));
    const textBoxes=await paymentSummary.locator('[data-checklist-open], [data-checklist-progress], [data-checklist-paid], [data-checklist-paid-label]').evaluateAll(elements=>elements.map(el=>{
      const range=document.createRange();range.selectNodeContents(el);const r=range.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};
    }));
    const [unpaidAmount,progress,paidAmount,paidLabel]=textBoxes;
    expect(progress.y).toBeGreaterThanOrEqual(unpaidAmount.bottom);
    expect(paidLabel.y).toBeGreaterThanOrEqual(paidAmount.bottom);
    expect(Math.abs(unpaidAmount.y-paidAmount.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(progress.y-paidLabel.y)).toBeLessThanOrEqual(1);
    for(const [amount,label] of [[unpaidAmount,progress],[paidAmount,paidLabel]])expect(Math.abs(width<640 ? amount.x-label.x : amount.right-label.right)).toBeLessThanOrEqual(1);
    await paymentSummary.screenshot({path:info.outputPath(`payment-summary-${de?'de':'en'}-${width}.png`)});
  });
}
