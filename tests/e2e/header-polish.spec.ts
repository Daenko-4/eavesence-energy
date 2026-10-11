import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

test('five header proposals retain the original logo',async({page},info)=>{
 await page.setViewportSize({width:1120,height:1400});await page.goto('/home');await page.evaluate(async()=>document.fonts.ready);
 const html=readFileSync(resolve('docs/design/header-proposals.html'),'utf8');
 await page.evaluate(html=>{const doc=new DOMParser().parseFromString(html,'text/html');document.head.append(doc.querySelector('style')!);document.body.replaceChildren(doc.querySelector('main')!);},html);
 await expect(page.locator('.proposal')).toHaveCount(5);await expect(page.locator('.proposal-brand path')).toHaveCount(45);
 await page.locator('#header-proposals').screenshot({path:info.outputPath('eavesence-header-five-proposals.png')});
});

for(const de of [false,true])test(`FAQ rotation is visible in both directions ${de?'de':'en'}`,async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(de?'/de/rechner':'/calculator');const button=page.locator('#faq > div > button');const icon=button.locator('.site-disclosure-icon');
 await expect(icon).toHaveCSS('transition-duration','0.36s');await button.click();await expect(button).toHaveAttribute('aria-expanded','true');await expect.poll(()=>icon.evaluate(el=>getComputedStyle(el).rotate)).toBe('-45deg');
 const question=page.locator('#faq details summary').first();await question.click();await expect.poll(()=>question.locator('.site-disclosure-icon').evaluate(el=>getComputedStyle(el).rotate)).toBe('-45deg');await question.click();await expect.poll(()=>question.locator('.site-disclosure-icon').evaluate(el=>getComputedStyle(el).rotate)).toBe('0deg');
 await button.click();await expect.poll(()=>icon.evaluate(el=>getComputedStyle(el).rotate)).toBe('0deg');await page.emulateMedia({reducedMotion:'reduce'});await expect(icon).toHaveCSS('transition-duration','0s');
});
for(const width of [320,768,1365])test(`calculator explanation uses the full aligned width ${width}`,async({page},info)=>{
 await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/calculator');
 const result=page.locator('[data-calculator-result]');await result.getByRole('button',{name:'How this was calculated',exact:true}).click();const formula=result.locator('[data-calculation-formula]');await expect(formula).toBeVisible();
 const edges=await result.evaluate(el=>{const heading=el.querySelector('p')!.getBoundingClientRect(),formula=el.querySelector('[data-calculation-formula]')!.getBoundingClientRect();return {left:Math.abs(heading.left-formula.left),right:Math.abs(heading.right-formula.right)};});expect(edges.left).toBeLessThan(1);expect(edges.right).toBeLessThan(1);await expect(formula).toHaveCSS('text-overflow','clip');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await result.scrollIntoViewIfNeeded();await page.evaluate(()=>window.scrollBy(0,-90));await result.screenshot({path:info.outputPath(`calculator-explanation-${width}.png`)});
});
