import {expect,test,type Page} from '@playwright/test';

// Production registers service workers; use CI=1 with a production server locally.
test.skip(!process.env.CI, 'Service workers are registered only in production.');

type WorkerScenario = 'first-waiting' | 'first-install' | 'update-waiting' | 'update-install';
async function mockLifecycle(page:Page, scenario:WorkerScenario) {
 await page.addInitScript((scenario) => {
  const messages:unknown[]=[];
  const isUpdate=scenario.startsWith('update');
  const isWaiting=scenario.endsWith('waiting');
  const previousWorker=new EventTarget();
  const installingWorker=Object.assign(new EventTarget(),{state:isWaiting?'installed':'installing',postMessage:(message:unknown)=>messages.push(message)});
  const registration=Object.assign(new EventTarget(),{active:isUpdate?previousWorker:null,waiting:isWaiting?installingWorker:null,installing:isWaiting?null:installingWorker});
  let watching=false;
  const original=registration.addEventListener.bind(registration);
  registration.addEventListener=((type:string,listener:EventListenerOrEventListenerObject,options?:boolean|AddEventListenerOptions)=>{if(type==='updatefound')watching=true;original(type,listener,options);}) as typeof registration.addEventListener;
  const serviceWorker=Object.assign(new EventTarget(),{controller:isUpdate?previousWorker:null,register:async()=>registration});
  Object.defineProperty(navigator,'serviceWorker',{configurable:true,value:serviceWorker});
  Reflect.set(window,'pwaTest',{ready:()=>watching,messages,finishInstall:()=>{
   registration.dispatchEvent(new Event('updatefound'));
   installingWorker.state='installed';
   if(isUpdate) registration.waiting=installingWorker;
   else {registration.active=installingWorker;serviceWorker.controller=installingWorker;}
   installingWorker.dispatchEvent(new Event('statechange'));
   return new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
  }});
 },scenario);
}

for(const de of [false,true]) for(const scenario of ['first-waiting','first-install','update-waiting','update-install'] as const) {
 test(`PWA ${scenario} ${de?'de':'en'}`,async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await mockLifecycle(page,scenario);
  await page.goto(de?'/de/zuhause':'/home');
  await expect.poll(()=>page.evaluate(()=>Reflect.get(window,'pwaTest').ready())).toBe(true);
  const banner=page.getByRole('status').filter({hasText:de?'Eine neue Version von EAVESENCE':'A new version of EAVESENCE'});
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  if(scenario.endsWith('install')) await page.evaluate(()=>Reflect.get(window,'pwaTest').finishInstall());
  if(scenario.startsWith('first')) {
   await expect(banner).toHaveCount(0);
   await page.getByRole('button',{name:de?'Zuhause erstellen':'Create my home',exact:true}).click();
   await expect(page.locator('[data-home-overview-content]')).toBeVisible();
  } else {
   await expect(banner).toBeVisible();
   await banner.getByRole('button',{name:de?'Jetzt aktualisieren':'Update now',exact:true}).click();
   expect(await page.evaluate(()=>Reflect.get(window,'pwaTest').messages)).toEqual([{type:'SKIP_WAITING'}]);
  }
 });
}
