import {test,expect,type Page} from '@playwright/test';
import {execFileSync} from 'node:child_process';
const baseline=execFileSync('git',['show','506cda84728e4a78016717bd64f5cfc74f52abbb:assets/jobdesk-compiled.css'],{encoding:'utf8',maxBuffer:8*1024*1024});
const fixed=new Date('2026-11-25T10:00:00+08:00');
const me={id:31,name:'Designer Test',role:'Designer',email:'designer@local.invalid',active:true};
const space={id:50,name:me.name,owner_user_id:31,sort_order:1};
const job={id:991,name:'Visual regression job',invoice_id:'TEST-991',date_in:'2026-11-21',due_date:'2026-11-25',status:'Confirmed',priority:'Normal',space_id:50,assigned_to:31,confirmed_at:fixed.toISOString(),created_at:fixed.toISOString(),version:1};
const jobs=[job,{...job,id:992,name:'Overdue job',due_date:'2026-11-24'},{...job,id:993,name:'Production job',status:'Completed',production_status:'Printing'},{...job,id:994,name:'Trashed job',status:'Deleted'}];
async function compare(page:Page,label:string){
 await page.evaluate(()=>document.fonts.ready);
 const current=await page.screenshot({animations:'disabled',caret:'hide',fullPage:true});
 await page.evaluate(css=>{
  const links=Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
  if(!links.length)throw Error('No compiled stylesheet');
  for(const link of links){link.dataset.v37Compare='1';link.disabled=true}
  const style=document.createElement('style');style.id='v37-baseline';style.textContent=css;document.head.append(style);
 },baseline);
 await page.evaluate(()=>document.fonts.ready);
 const before=await page.screenshot({animations:'disabled',caret:'hide',fullPage:true});
 await page.evaluate(()=>{document.getElementById('v37-baseline')?.remove();document.querySelectorAll<HTMLLinkElement>('link[data-v37-compare]').forEach(l=>{l.disabled=false;delete l.dataset.v37Compare})});
 if(!current.equals(before)){await test.info().attach(label+'-V36',{body:before,contentType:'image/png'});await test.info().attach(label+'-V37',{body:current,contentType:'image/png'})}
 expect(current.equals(before),label+' must match pinned V3.6 pixels').toBe(true);
}
test('V3.7 visual parity with pinned V3.6 compiled CSS',async({page})=>{
 test.setTimeout(90000);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.clock.setFixedTime(fixed);
 await page.route('**/api/bootstrap*',r=>r.fulfill({json:{me,users:[me],spaces:[space],jobs,activity:[],devices:[],available_months:['2026-11'],overdue_total:1,csrf:'',hosted:true}}));
 await page.route('**/api/jobs/991',r=>r.fulfill({json:{job,activity:[]}}));
 await page.goto('/');
 await expect(page.locator('.v30-focus')).toBeVisible();
 await compare(page,'overview');
 await page.locator('.v30-focus .focus-today').click();
 await expect(page.locator('.job-panel .job-link').first()).toBeVisible();
 await compare(page,'ticket');
 await page.getByRole('button',{name:'List',exact:true}).click();
 await compare(page,'list');
 await page.getByRole('button',{name:'Board',exact:true}).click();
 await compare(page,'board');
 await page.getByRole('button',{name:'Ticket',exact:true}).click();
 await page.locator('.job-panel .job-link').filter({hasText:'Visual regression job'}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await compare(page,'job-details');
 await page.getByRole('button',{name:'Close dialog'}).click();
 await page.getByRole('button',{name:'Notifications',exact:true}).click();
 await expect(page.locator('.v36-notification-tools')).toBeVisible();
 await compare(page,'notifications');
 await page.getByRole('button',{name:'Close dialog'}).click();
 const toggle=page.locator('.mobile-sidebar-toggle');
 if(await toggle.isVisible())await toggle.click();
 await page.locator('aside.sidebar').getByRole('navigation',{name:'Shared production space'}).locator('button').click();
 await expect(page.locator('.production-job-panel')).toBeVisible();
 await compare(page,'production');
});
