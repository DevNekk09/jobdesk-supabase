import {test,expect} from '@playwright/test';
const me={id:31,name:'Designer Test',role:'Designer',email:'designer@local.invalid',active:true};
const desk={id:50,name:me.name,owner_user_id:31,sort_order:1};
test('create a job due next month, reset filters and reveal saved record even past page limit',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-11-25T14:15:00+08:00'));
 const records=Array.from({length:25},(_,i)=>({id:100+i,name:'Earlier job '+i,invoice_id:'TEST-'+i,date_in:'2026-11-25',due_date:'2026-12-01',status:'Awaiting Sales',priority:'Normal',space_id:50,assigned_to:31,created_at:'2026-11-25T06:00:00Z',version:1}));
 let writes=0;
 await page.route('**/api/bootstrap*',r=>{const month=new URL(r.request().url()).searchParams.get('month');return r.fulfill({json:{me,users:[me],spaces:[desk],jobs:month==='all'?records:records.filter(j=>j.due_date.startsWith(month||'')),activity:[],devices:[],available_months:['2026-11','2026-12'],overdue_total:0,csrf:'',hosted:true}})});
 await page.route('**/api/jobs',r=>{expect(r.request().method()).toBe('POST');writes++;const b=r.request().postDataJSON();expect(b).toMatchObject({name:'Next month new job',due_date:'2026-12-10',space_id:50});const job={...records[0],...b,id:999,invoice_id:'TEST-999'};records.push(job);return r.fulfill({status:201,json:{job}})});
 await page.goto('/');
 await expect(page.getByRole('combobox',{name:'Filter jobs by due month'})).toHaveValue('all');
 await page.locator('.ksl-dock .dock-create').click();
 // The active designer owns a desk; the dock opens Add Job directly.
 await expect(page.getByRole('dialog')).toContainText('Add a job.');
 await page.getByPlaceholder('Enter job sheet name').fill('Next month new job');
 await page.locator('input[name="date_in"]').fill('2026-11-25');
 await page.locator('input[name="due_date"]').fill('2026-12-10');
 await page.getByRole('dialog').getByRole('button',{name:'Add job'}).click();
 await expect(page.getByText('Jobsheet created')).toBeVisible();
 await expect(page.locator('.job-panel .job-link').filter({hasText:'Next month new job'})).toBeVisible();
 await expect(page.locator('.job-panel .job-link')).toHaveCount(26);
 await expect(page.getByRole('combobox',{name:'Filter jobs by due month'})).toHaveValue('all');
 expect(writes).toBe(1);
 await page.reload();
 await expect(page.locator('.v30-focus')).toBeVisible();
 await expect(page.getByRole('combobox',{name:'Filter jobs by due month'})).toHaveValue('all');
 expect(writes).toBe(1);
});
