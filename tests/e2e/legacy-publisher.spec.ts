import {test,expect} from '@playwright/test';
import {readFileSync,existsSync} from 'node:fs';

test('legacy GitHub Pages Jekyll publisher boots the real React UI instead of an inert preview',async({page})=>{
 const source=new URL('../../',import.meta.url);
 const path=(p:string)=>new URL(p,source);
 for(const file of ['assets/jobdesk-compiled.js','assets/jobdesk-compiled.css','icon.svg']){
  expect(existsSync(path(file)),'Compiled fallback asset exists: '+file).toBeTruthy();
 }
 const rawHtml=readFileSync(path('index.html'),'utf8');
 const bundle=readFileSync(path('assets/jobdesk-compiled.js'));
 const stylesheet=readFileSync(path('assets/jobdesk-compiled.css'));
 const icon=readFileSync(path('icon.svg'));
 await page.route('**/jobdesk-supabase/',route=>route.fulfill({status:200,contentType:'text/html',body:rawHtml}));
 await page.route('**/jobdesk-supabase/assets/jobdesk-compiled.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:bundle}));
 await page.route('**/jobdesk-supabase/assets/jobdesk-compiled.css',route=>route.fulfill({status:200,contentType:'text/css',body:stylesheet}));
 await page.route('**/jobdesk-supabase/icon.svg',route=>route.fulfill({status:200,contentType:'image/svg+xml',body:icon}));
 await page.route('**/frontend/main.tsx',route=>route.fulfill({status:404,contentType:'text/plain',body:'Not Found'}));
 await page.route('**/api/bootstrap*',route=>route.fulfill({
  status:200,
  contentType:'application/json',
  body:JSON.stringify({
   me:{id:1,name:'Team member',email:'shared-team@system.invalid',role:'Designer',active:true},
   users:[],jobs:[],activity:[],spaces:[],devices:[],available_months:[],
   overdue_total:0,overdue_by_space:[],csrf:'',hosted:true
  })
 }));
 await page.goto('/jobdesk-supabase/');
 await expect(page.locator('nav.ksl-dock')).toBeVisible({timeout:12000});
 await expect(page.locator('[data-preboot]')).toHaveCount(0);
 await expect(page.locator('.sidebar .brand')).toContainText('Jobdesk');
 await expect(page.getByText('KSL Job Management').first()).toBeVisible();
 await expect(page.locator('.sidebar .brand img')).toHaveJSProperty('complete',true);
 const iconOk=await page.locator('.sidebar .brand img').evaluate(image=>(image as HTMLImageElement).naturalWidth>0);
 expect(iconOk).toBe(true);
});
