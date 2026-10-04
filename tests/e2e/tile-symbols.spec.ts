import {test,expect} from '@playwright/test';

for(const de of [false,true])for(const width of [320,1365])test(`cost area icons stay optional, localized and persistent ${de?'de':'en'} ${width}px`,async({page},info)=>{
  await page.setViewportSize({width,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(de?'/de/zuhause':'/home');
  await page.getByRole('button',{name:de?'Zuhause erstellen':'Create my home',exact:true}).click();
  await page.evaluate(()=>{
    const p=JSON.parse(localStorage.getItem('eavesence-home-profile-v1')!);
    p.incomeAmount=2400;p.overviewReviewed=true;p.backupReminderDismissed=true;
    localStorage.setItem('eavesence-home-profile-v1',JSON.stringify(p));
    localStorage.setItem('eavesence-home-costs-v1',JSON.stringify([{id:'rent',name:'Rent',category:'housing',amount:900,frequency:'monthly',nextDueDate:'',updatedAt:new Date().toISOString()}]));
  });
  await page.reload();
  async function areas(){
    await page.locator('[data-cost-manager] > summary').click();
    await page.getByText(de?'Kostenbereiche organisieren':'Organize cost areas',{exact:true}).click();
  }
  await areas();
  await page.getByRole('button',{name:de?'Neue Kachel':'New tile',exact:false}).click();
  await page.getByLabel(de?'Name der Kachel':'Tile name',{exact:true}).fill('Travel');
  const form=page.locator('#home-tile-form');
  await expect(form.getByRole('group')).toHaveCount(0);
  await form.getByRole('button',{name:de?'Symbol: Ohne Symbol':'Icon: No icon',exact:true}).click();
  const picker=form.getByRole('group',{name:de?'Symbol auswählen':'Choose icon'});
  await expect(picker.getByRole('button')).toHaveCount(11);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const bounds=await form.boundingBox();
  for(const control of await form.locator('input, button').all()) {
    const box=await control.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(bounds!.x);
    expect(box!.x+box!.width).toBeLessThanOrEqual(bounds!.x+bounds!.width);
  }
  expect((await form.locator('button[type=submit]').boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await form.scrollIntoViewIfNeeded();
  await page.screenshot({path:info.outputPath(`tile-symbol-picker-${de?'de':'en'}-${width}.png`)});
  await picker.getByRole('button',{name:de?'Mobilität':'Transport',exact:true}).click();
  await expect(form.getByRole('button',{name:de?'Symbol: Mobilität':'Icon: Transport',exact:true})).toBeFocused();
  await form.getByRole('button',{name:de?'Kachel anlegen':'Create tile',exact:true}).click();
  const tile=page.locator('[data-home-tiles] article').filter({hasText:'Travel'});
  await expect(tile.locator('[data-tile-icon="mobility"]')).toBeVisible();
  await page.reload();await areas();
  await expect(tile.locator('[data-tile-icon="mobility"]')).toBeVisible();
  await tile.getByRole('button').first().click();
  await tile.getByRole('button',{name:de?'Umbenennen':'Rename',exact:true}).click();
  await form.getByRole('button',{name:de?'Symbol: Mobilität':'Icon: Transport',exact:true}).click();
  await form.getByRole('group').getByRole('button',{name:de?'Ohne Symbol':'No icon',exact:true}).click();
  await form.getByRole('button',{name:de?'Änderungen speichern':'Save changes',exact:true}).click();
  await expect(tile.locator('[data-tile-icon]')).toHaveCount(0);
  await page.reload();await areas();
  await expect(tile.locator('[data-tile-icon]')).toHaveCount(0);
});
