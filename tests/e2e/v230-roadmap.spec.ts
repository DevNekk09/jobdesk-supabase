import {test,expect} from '@playwright/test';
const localDate=(offset:number)=>{
 const d=new Date(Date.now()+offset*86400000);
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
 const val=(name:string)=>parts.find(p=>p.type===name)!.value;
 return val('year')+'-'+val('month')+'-'+val('day');
};
const user={id:31,name:'Designer Staff',role:'Designer',email:'designer@local.invalid',active:true};
const desk={id:50,name:'Designer Staff',owner_user_id:31,sort_order:1};
const makeJob=(id:number,name:string,due:string,status='Confirmed',production_status?:string)=>({
 id,invoice_id:'INV-TEST-'+id,name,date_in:localDate(-2),due_date:due,
 priority:'Normal',status,production_status:production_status||null,
 assigned_to:31,space_id:50,confirmed_at:new Date().toISOString(),
 created_at:new Date().toISOString(),version:1
});
const bootstrap=(jobs:ReturnType<typeof makeJob>[])=>({
 me:{...user},users:[user],spaces:[desk],jobs,activity:[],devices:[],
 available_months:[localDate(0).slice(0,7)],overdue_total:0,overdue_by_space:[],csrf:'',hosted:true
});
async function openAllJobs(page:any){
 await expect(page.locator('nav.ksl-dock')).toBeVisible();
 const mobile=page.getByRole('button',{name:'Open job spaces'});
 if(await mobile.isVisible())await mobile.click();
 await page.locator('aside.sidebar').getByRole('button',{name:/All jobs/}).click();
}
test('V2.3 compact cards and quick filters fit responsive screens',async({page})=>{
 const jobs=[makeJob(901,'Due today job',localDate(0)),makeJob(902,'Due later job',localDate(2)),makeJob(903,'Overdue job',localDate(-2))];
 await page.route('**/api/bootstrap*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(bootstrap(jobs))}));
 await page.goto('/');await openAllJobs(page);
 const list=page.locator('.job-panel.v23-job-list');
 await expect(list.locator('tbody tr')).toHaveCount(3);
 await expect(list.locator('tbody tr .job-schedule')).toHaveCount(3);
 await expect(list.locator('tbody tr').first().locator('td')).toHaveCount(4);
 await expect(list.getByRole('group',{name:'Designer quick deadline filters'})).toBeVisible();
 for(const width of [320,390,768,1024,1366]){
  await page.setViewportSize({width,height:850});
  const widths=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:window.innerWidth}));
  expect(widths.document,'overflow at '+width).toBeLessThanOrEqual(width+1);
  await expect(list.locator('tbody tr').first()).toHaveCSS('display',width<=900?'grid':'table-row');
 }
 await list.getByRole('button',{name:/^Today/}).click();
 await expect(list.locator('tbody tr')).toHaveCount(1);
 await expect(list.locator('tbody')).toContainText('Due today job');
 await list.getByRole('button',{name:/^Overdue/}).click();
 await expect(list.locator('tbody tr')).toHaveCount(1);
 await expect(list.locator('tbody')).toContainText('Overdue job');
 await expect(list.locator('.job-schedule.schedule-late .schedule-detail')).toContainText('overdue');
 await list.getByRole('button',{name:/^All/}).click();
 await list.getByRole('textbox',{name:'Search jobs'}).fill('INV-TEST-902');
 await expect(list.locator('tbody tr')).toHaveCount(1);
 await expect(list.locator('tbody')).toContainText('Due later job');
});
test('V2.3 one-tap next progress saves a versioned request only once',async({page})=>{
 let job=makeJob(911,'Advance this file',localDate(1));
 let calls=0;
 await page.route('**/api/bootstrap*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(bootstrap([job]))}));
 await page.route('**/api/jobs/911/progress',r=>{
  calls++;expect(r.request().method()).toBe('POST');
  expect(r.request().postDataJSON()).toMatchObject({version:1,status:'Preparing Master Files'});
  job={...job,status:'Preparing Master Files',version:2};
  return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({job})});
 });
 await page.goto('/');await openAllJobs(page);
 const row=page.locator('.job-panel tbody tr').filter({hasText:'Advance this file'});
 const next=row.getByRole('button',{name:'Advance Advance this file'});
 await expect(next).toBeVisible();
 await next.evaluate(el=>{(el as HTMLButtonElement).click();(el as HTMLButtonElement).click()});
 await expect(row).toContainText('Preparing Master Files');
 await expect(page.getByText('Progress updated')).toBeVisible();
 expect(calls).toBe(1);
});
test('V2.3 version conflict reports and refreshes instead of overwriting another staff update',async({page})=>{
 let job=makeJob(912,'Conflict example',localDate(1));
 let count=0;
 await page.route('**/api/bootstrap*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(bootstrap([job]))}));
 await page.route('**/api/jobs/912/progress',r=>{
  count++;job={...job,status:'Master Files Ready',version:3};
  return r.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'Job version conflict; another browser changed this job.'})});
 });
 await page.goto('/');await openAllJobs(page);
 await page.getByRole('button',{name:'Advance Conflict example'}).click();
 await expect(page.getByText(/updated in another browser/)).toBeVisible();
 await expect(page.locator('.job-panel tbody tr').filter({hasText:'Conflict example'})).toContainText('Master Files Ready');
 expect(count).toBe(1);
});
test('V2.3 production handover retains source desk and updates without duplicates',async({page})=>{
 let ready=makeJob(920,'Artwork ready for printing',localDate(0),'Set Files - Ready to Print');
 const production=makeJob(921,'Packing queue item',localDate(2),'Set Files - Ready to Print','Packing');
 let count=0;
 await page.route('**/api/bootstrap*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(bootstrap([ready,production]))}));
 await page.route('**/api/jobs/920/production',r=>{
  count++;expect(r.request().postDataJSON()).toMatchObject({version:1,status:'Review Files'});
  ready={...ready,production_status:'Review Files',version:2};
  return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({job:ready})});
 });
 await page.goto('/');
 await expect(page.locator('nav.ksl-dock')).toBeVisible();
 const toggle=page.getByRole('button',{name:'Open job spaces'});
 if(await toggle.isVisible())await toggle.click();
 await page.locator('aside.sidebar').getByRole('navigation',{name:'Shared production space'}).locator('button').click();
 const handover=page.getByRole('region',{name:'Production handover queue'});
 await expect(handover).toContainText('Artwork ready for printing');
 await expect(handover).toContainText('Designer Staff');
 await handover.getByRole('button',{name:'Send to production'}).click();
 await expect(page.getByText('Production updated')).toBeVisible();
 await expect(handover).not.toContainText('Artwork ready for printing');
 await expect(page.locator('.production-job-panel tbody tr')).toHaveCount(2);
 expect(count).toBe(1);
});
test('V2.3 offline state blocks new changes while preserving loaded jobs',async({page,context})=>{
 await page.route('**/api/bootstrap*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(bootstrap([makeJob(925,'Offline visible job',localDate(0))]))}));
 await page.goto('/');await openAllJobs(page);
 await context.setOffline(true);
 await expect(page.getByText(/Offline — Jobs remain visible/)).toBeVisible();
 await expect(page.locator('.job-panel tbody')).toContainText('Offline visible job');
 await expect(page.getByRole('button',{name:'Advance Offline visible job'})).toBeDisabled();
 await context.setOffline(false);
 await expect(page.getByText(/Offline — Jobs remain visible/)).toHaveCount(0);
});

test('undo progress uses the current version and keeps invoice reference hidden',async({page})=>{
 let job=makeJob(940,'Undo design example',localDate(1),'Master Files Ready');
 let calls=0;
 await page.route('**/api/bootstrap*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(bootstrap([job]))}));
 await page.route('**/api/jobs/940',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({job,activity:[]})}));
 await page.route('**/api/jobs/940/undo-progress',r=>{
  calls++;expect(r.request().postDataJSON()).toMatchObject({version:1});
  job={...job,status:'Preparing Master Files',version:2};
  return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({job})});
 });
 await page.goto('/');await openAllJobs(page);
 await expect(page.locator('.job-panel tbody')).not.toContainText('INV-TEST-940');
 await page.getByRole('button',{name:'Open Undo design example'}).click();
 await expect(page.locator('[role="dialog"]')).not.toContainText('INV-TEST-940');
 await page.getByRole('button',{name:'Undo progress',exact:true}).click();
 await page.getByRole('button',{name:'Confirm',exact:true}).click();
 await expect(page.getByRole('button',{name:'Undo progress',exact:true})).toBeVisible();
 await expect.poll(()=>calls).toBe(1);
 await expect(page.locator('.job-panel tbody')).toContainText('Preparing Master Files');
});

test('Trash has a dedicated review state with no active deadline controls',async({page})=>{
 const deleted=makeJob(955,'Deleted review example',localDate(-2),'Deleted');
 await page.route('**/api/bootstrap*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(bootstrap([deleted]))}));
 await page.goto('/');await openAllJobs(page);
 await page.getByRole('tab',{name:/^Trash/}).click();
 const list=page.locator('.job-panel.is-trash-list');
 await expect(list).toBeVisible();
 await expect(list.getByText('Deleted jobs',{exact:false}).first()).toBeVisible();
 await expect(list.getByRole('combobox',{name:'Filter by deadline'})).toHaveCount(0);
 await expect(list.locator('tbody')).toContainText('In trash');
 await expect(list.locator('tbody')).not.toContainText('days overdue');
 await expect(list.getByRole('button',{name:'Open Deleted review example'})).toBeVisible();
 await expect(list.getByRole('button',{name:/Clear all Trash/})).toHaveCount(0);
});
