import {test,expect,type Page} from '@playwright/test';
const fixed=new Date('2026-11-30T10:00:00+08:00');
const member={id:31,name:'Designer Test',role:'Designer',email:'designer@local.invalid',active:true};
const space={id:50,name:member.name,owner_user_id:31,sort_order:1};
const job={id:991,name:'Stability job',invoice_id:'TEST-991',date_in:'2026-11-27',due_date:'2026-11-30',status:'Confirmed',priority:'Normal',space_id:50,assigned_to:31,confirmed_at:fixed.toISOString(),created_at:fixed.toISOString(),version:1};
type Job=typeof job;
async function setup(page:Page,getJobs:()=>Job[],activity:any[]=[]){
 await page.clock.setFixedTime(fixed);
 await page.route('**/api/bootstrap*',r=>{const month=new URL(r.request().url()).searchParams.get('month');const all=getJobs();return r.fulfill({json:{me:member,users:[member],spaces:[space],jobs:month&&month!=='all'?all.filter(j=>j.due_date.startsWith(month)):all,activity,devices:[],available_months:['2026-10','2026-11','2026-12'],overdue_total:all.filter(j=>j.due_date<'2026-11-30'&&j.status!=='Completed').length,csrf:'',hosted:true}})});
 await page.route('**/api/jobs/991',r=>r.fulfill({json:{job:getJobs().find(j=>j.id===991),activity:[]}}));
 await page.goto('/');
}
test('cross-month focus counts and click open matching records',async({page})=>{
 const jobs=[job,{...job,id:992,name:'Last month overdue',due_date:'2026-10-30',date_in:'2026-10-25'},{...job,id:993,name:'Tomorrow next month',due_date:'2026-12-01'}];
 await setup(page,()=>jobs);
 const month=page.getByRole('combobox',{name:'Filter jobs by due month'});
 await expect(month).toHaveValue('all');
 await month.selectOption('2026-11');
 const focus=page.locator('.v30-focus');
 await expect(focus.locator('.focus-late strong')).toHaveText('1');
 await expect(focus.locator('.focus-tomorrow strong')).toHaveText('1');
 await focus.locator('.focus-late').click();
 await expect(page.locator('.job-panel .job-link')).toHaveText('Last month overdue');
});
test('server returning another writer version suppresses unsafe undo',async({page})=>{
 let current=job;
 await setup(page,()=>[current]);
 await page.route('**/api/jobs/991/progress',r=>{expect(r.request().postDataJSON().version).toBe(1);current={...job,status:'Master Files Ready',version:3};return r.fulfill({json:{job:current}})});
 await page.locator('.v30-focus .focus-today').click();
 await page.getByRole('button',{name:'Advance Stability job'}).click();
 await expect(page.locator('.job-save-feedback')).toContainText('Progress updated');
 await expect(page.locator('.v30-toast-undo')).toHaveCount(0);
 await expect(page.locator('.ticket-progress')).toContainText('Master Files Ready');
});
test('closing details during save never reopens the modal',async({page})=>{
 let current=job,release!:()=>void;
 const pending=new Promise<void>(r=>release=r);
 await setup(page,()=>[current]);
 await page.route('**/api/jobs/991/progress',async r=>{await pending;current={...job,status:'Preparing Master Files',version:2};await r.fulfill({json:{job:current}})});
 await page.locator('.v30-focus .focus-today').click();
 await page.locator('.job-panel .job-link').click();
 await page.getByRole('button',{name:'Start master files',exact:true}).click();
 await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).click();
 release();
 await expect(page.locator('.job-save-feedback')).toContainText('Jobsheet updated');
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect(page.locator('.ticket-progress')).toContainText('Preparing Master Files');
});
test('board totals include nonrendered matching jobs and empty stages can hide',async({page})=>{
 const jobs=Array.from({length:25},(_,i)=>({...job,id:991+i,name:'Board job '+i}));
 await setup(page,()=>jobs);
 await page.locator('.v30-focus .focus-today').click();
 await page.getByRole('button',{name:'Board',exact:true}).click();
 await expect(page.locator('.v36-board-toolbar')).toContainText('20 of 25 jobs shown');
 await expect(page.locator('.v30-board-column h3').filter({hasText:'Confirmed'})).toContainText('25');
 await page.getByRole('checkbox',{name:'Hide empty stages'}).check();
 await expect(page.locator('.v30-board-column')).toHaveCount(1);
});
test('notification read status persists for this browser and actor',async({page})=>{
 await setup(page,()=>[job],[{id:123,job_id:991,job_name:job.name,user_name:member.name,action:'Job confirmed',created_at:fixed.toISOString()}]);
 await page.getByRole('button',{name:'Notifications',exact:true}).click();
 await expect(page.locator('.v36-notification-tools')).toContainText('2 unread');
 await page.getByRole('button',{name:'Mark all as read'}).click();
 await expect(page.locator('.v36-notification-tools')).toContainText('0 unread');
 await page.getByRole('button',{name:'Unread',exact:true}).click();
 await expect(page.getByText('No matching reminders.')).toBeVisible();
 await page.getByRole('button',{name:'Close dialog'}).click();
 await page.reload();
 await page.getByRole('button',{name:'Notifications',exact:true}).click();
 await expect(page.locator('.v36-notification-tools')).toContainText('0 unread');
});
