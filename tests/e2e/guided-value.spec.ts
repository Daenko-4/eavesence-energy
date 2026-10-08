import {test, expect} from '@playwright/test';

test('missing dates identify the cost and open its existing edit form', async ({page}) => {
  await page.clock.setFixedTime(new Date('2026-10-03T12:00:00Z'));
  await page.goto('/home');
  await page.getByRole('button',{name:'Create my home',exact:true}).click();
  await page.evaluate(() => {
    const profile=JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
    profile.incomeAmount=2400;
    profile.planning={cash:{balance:1200,asOf:'2026-10-03',payday:'2026-10-30',protected:100,everydayRemaining:300}};
    localStorage.setItem('eavesence-home-profile-v1',JSON.stringify(profile));
    localStorage.setItem('eavesence-home-costs-v1',JSON.stringify([{id:'insurance',name:'Insurance',category:'insurance',amount:600,frequency:'yearly',nextDueDate:'',updatedAt:'2026-10-03T12:00:00Z'}]));
  });
  await page.reload();
  await page.getByRole('button',{name:/Plan & save/}).click();
  const payday=page.getByRole('region',{name:'Your available budget',exact:true});
  await expect(payday).toContainText('Your balance is recorded');
  await expect(payday).not.toContainText('planning basics');
  await expect(payday).toContainText('Still missing: payment dates.');
  await expect(payday).not.toContainText('everyday-spending estimate');
  await payday.getByRole('button',{name:'Insurance · Add date',exact:true}).click();
  await expect(page.locator('[data-home-overview-content]')).toBeVisible();
  await expect(page.locator('#household-cost-name')).toHaveValue('Insurance');
  await expect(page.locator('#household-costs')).toContainText('Edit');
});

test('calculator uses the home tariff and area navigation stays available when organizer is closed', async ({page}) => {
  await page.goto('/home');
  await page.getByRole('button',{name:'Create my home',exact:true}).click();
  await page.evaluate(() => {
    const profile=JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
    profile.electricityPrice=.27;
    localStorage.setItem('eavesence-home-profile-v1',JSON.stringify(profile));
    localStorage.setItem('eavesence-home-tiles-v1',JSON.stringify([{id:'default-costs',kind:'costs',title:'Household costs'},{id:'default-energy',kind:'energy',title:'Electricity'}]));
  });
  await page.reload();
  await page.locator('[data-cost-manager] > summary').click();
  const areas=page.getByRole('navigation',{name:'Choose cost area',exact:true});
  await expect(areas).toBeVisible();
  await areas.getByRole('button',{name:'Electricity',exact:true}).click();
  await expect(areas.getByRole('button',{name:'Electricity',exact:true})).toHaveAttribute('aria-pressed','true');
  await areas.getByRole('button',{name:'Household costs',exact:true}).click();
  await expect(areas.getByRole('button',{name:'Household costs',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.goto('/calculator');
  await expect(page.getByLabel('Electricity price',{exact:true})).toHaveValue('0.27');
});


test('income can be deferred without inventing a remainder or blocking setup', async ({page}) => {
  await page.goto('/home');
  await page.getByRole('button',{name:'Create my home',exact:true}).click();
  const setup=page.locator('[data-home-setup]');
  await setup.getByRole('button',{name:'Add income later',exact:true}).click();
  await expect(setup).toContainText('2 · Add your first cost');
  await setup.getByRole('button',{name:'Add first cost',exact:true}).click();
  await page.locator('#household-cost-name').fill('Rent');
  await page.locator('#household-costs').getByLabel('Amount',{exact:true}).fill('800');
  await page.locator('#household-costs').getByRole('button',{name:'Save',exact:true}).click();
  await page.locator('[data-home-review]').getByRole('button',{name:'Overview checked',exact:true}).click();
  await expect(page.locator('[data-home-monthly-budget]')).not.toHaveAttribute('open','');
  await page.reload();
  await expect(page.locator('[data-home-setup]')).toHaveCount(0);
  await expect(page.getByRole('region',{name:'Your household at a glance'}).locator('article').nth(2)).toContainText('—');
});
