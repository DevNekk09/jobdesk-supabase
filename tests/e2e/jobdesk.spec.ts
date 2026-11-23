import {test,expect} from '@playwright/test';

const emptyWorkspace={
 me:{id:1,name:'Team member',email:'shared-team@system.invalid',role:'Designer',active:true},
 users:[],jobs:[],activity:[],spaces:[],devices:[],available_months:[],overdue_total:0,overdue_by_space:[],csrf:'',hosted:true
};
test.beforeEach(async({page})=>{
 await page.route('**/api/bootstrap*',async route=>{
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(emptyWorkspace)});
 });
 await page.goto('/');
});

test('original green dock has three actions and saved branding is visible',async({page})=>{
 const dock=page.locator('nav.ksl-dock');
 await expect(dock).toBeVisible();
 await expect(dock.locator('button')).toHaveCount(3);
 await expect(dock.getByText('Overview')).toBeVisible();
 await expect(dock.getByText('Spaces')).toBeVisible();
 await expect(page.getByText('APPLE SPORT SDN BHD')).toBeVisible();
 await expect(page.getByText('KSL Team Job Management').first()).toBeVisible();
 await expect(page.locator('.open-test-strip')).toHaveCount(0);
});

test('unchanged Admin PIN modal requires six-digit PIN and can be closed',async({page})=>{
 await page.locator('.device-switch').click();
 await expect(page.getByText('Enter Admin mode')).toBeVisible();
 await page.locator('.admin-entry').click();
 await expect(page.getByRole('dialog')).toBeVisible();
 const pin=page.locator('input[aria-label="Six-digit admin PIN"]');
 await expect(pin).toBeVisible();
 await pin.fill('123');
 await expect(page.getByRole('button',{name:'Unlock Admin'})).toBeDisabled();
 await pin.fill('123456');
 await expect(page.getByRole('button',{name:'Unlock Admin'})).toBeEnabled();
});

test('no horizontal viewport overflow on responsive screens',async({page})=>{
 await expect(page.locator('nav.ksl-dock')).toBeVisible();
 const size=await page.evaluate(()=>({html:document.documentElement.scrollWidth,width:window.innerWidth}));
 expect(size.html).toBeLessThanOrEqual(size.width+1);
});


test('ordinary URL opens without a private token and anonymous team can add jobs',async({page})=>{
 let created=false;
 const member={id:22,name:'Team Designer',role:'Designer',email:'member@profiles.invalid',active:true};
 const desk={id:200,name:'Team Designer',owner_user_id:22,sort_order:1};
 await page.route('**/api/bootstrap*',async route=>{
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
   ...emptyWorkspace,users:[member],spaces:[desk],
   jobs:created?[{id:501,invoice_id:'INV-2026-00501',name:'Test shared jobsheet',date_in:'2026-11-23',due_date:'2026-11-25',priority:'Normal',status:'Awaiting Sales',space_id:200,assigned_to:22,created_at:'2026-11-23T01:00:00Z',version:1}]:[]
  })});
 });
 await page.route('**/api/jobs',async route=>{
  expect(route.request().method()).toBe('POST');
  expect(route.request().headers()['x-workspace-token']).toBeUndefined();
  expect(route.request().headers()['x-jobdesk-staff-session']).toBeUndefined();
  expect(route.request().postDataJSON()).toMatchObject({name:'Test shared jobsheet',space_id:200});
  created=true;
  await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({job:{id:501,invoice_id:'INV-2026-00501',name:'Test shared jobsheet',date_in:'2026-11-23',due_date:'2026-11-25',priority:'Normal',status:'Awaiting Sales',space_id:200,assigned_to:22,created_at:'2026-11-23T01:00:00Z',version:1}})});
 });
 await page.goto('/');
 await expect(page.locator('nav.ksl-dock')).toBeVisible();
 await page.locator('.ksl-dock .dock-create').click();
 await page.getByRole('dialog').getByRole('button',{name:/Team Designer/}).click();
 await expect(page.getByRole('dialog')).toContainText('Add a job.');
 await page.getByPlaceholder('Enter job sheet name').fill('Test shared jobsheet');
 await page.locator('input[name="date_in"]').fill('2026-11-23');
 await page.locator('input[name="due_date"]').fill('2026-11-25');
 await page.getByRole('dialog').getByRole('button',{name:'Add job'}).click();
 await expect(page.getByText('Jobsheet created')).toBeVisible();
 expect(created).toBe(true);
});

test('Delete user removes their Jobdesk from sidebar while preserving other spaces',async({page})=>{
 let removed=false;
 const bob={id:22,name:'Removed Designer',role:'Designer',email:'member22@profiles.invalid',active:true};
 const alice={id:33,name:'Active Designer',role:'Designer',email:'member33@profiles.invalid',active:true};
 const removedDesk={id:200,name:'Removed Designer',owner_user_id:22,sort_order:1};
 const activeDesk={id:300,name:'Active Designer',owner_user_id:33,sort_order:2};
 const manualDesk={id:400,name:'General Projects',owner_user_id:null,sort_order:3};
 await page.route('**/api/bootstrap*',async route=>{
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
    ...emptyWorkspace,
    me:{...emptyWorkspace.me,name:'Admin',role:'Admin'},
    users:removed?[alice]:[bob,alice],
    spaces:removed?[activeDesk,manualDesk]:[removedDesk,activeDesk,manualDesk]
  })});
 });
 await page.route('**/api/users/22/delete',async route=>{
  expect(route.request().method()).toBe('POST');
  removed=true;
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,archived_space_ids:[200]})});
 });
 await page.reload();
 const mobileToggle=page.locator('.mobile-sidebar-toggle');
 if(await mobileToggle.isVisible())await mobileToggle.click();
 const nav=page.getByRole('navigation',{name:'Designer job spaces'});
 await expect(nav.getByRole('button',{name:/Removed Designer/})).toBeVisible();
 await expect(nav.getByRole('button',{name:/Active Designer/})).toBeVisible();
 await expect(nav.getByRole('button',{name:/General Projects/})).toBeVisible();
 await page.locator('.sidebar-settings').click();
 await page.getByRole('tab',{name:/Team members/}).click();
 await page.locator('.member').filter({hasText:'Removed Designer'}).getByRole('button',{name:'Manage user'}).click();
 await page.getByRole('button',{name:'Delete user'}).click();
 await page.getByRole('button',{name:'Confirm'}).click();
 if(await mobileToggle.isVisible())await mobileToggle.click();
 await expect(nav.getByRole('button',{name:/Removed Designer/})).toHaveCount(0);
 await expect(nav.getByRole('button',{name:/Active Designer/})).toBeVisible();
 await expect(nav.getByRole('button',{name:/General Projects/})).toBeVisible();
 await expect(page.locator('.member').filter({hasText:'Removed Designer'})).toHaveCount(0);
});

test('empty team can create an unassigned shared jobsheet without a designer space',async({page})=>{
 let created=false;
 const createdJob={id:901,invoice_id:'INV-2026-00901',name:'General shared job',date_in:'2026-11-23',due_date:'2026-11-25',priority:'Normal',status:'Awaiting Sales',space_id:null,assigned_to:1,created_at:'2026-11-23T01:00:00Z',version:1};
 await page.route('**/api/bootstrap*',async route=>{
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({...emptyWorkspace,jobs:created?[createdJob]:[]})});
 });
 await page.route('**/api/jobs',async route=>{
  const b=route.request().postDataJSON();
  expect(b).toMatchObject({name:'General shared job',space_id:null});
  created=true;
  await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({job:createdJob})});
 });
 await page.reload();
 await page.locator('.ksl-dock .dock-create').click();
 await expect(page.getByRole('dialog')).toContainText('Add a job.');
 await page.getByPlaceholder('Enter job sheet name').fill('General shared job');
 await page.locator('input[name="date_in"]').fill('2026-11-23');
 await page.locator('input[name="due_date"]').fill('2026-11-25');
 await page.getByRole('dialog').getByRole('button',{name:'Add job'}).click();
 await expect(page.getByText('Jobsheet created')).toBeVisible();
 expect(created).toBe(true);
});

test('Admin can view archived jobs and prepare permanent deletion',async({page})=>{
 const j={id:905,invoice_id:'INV-2026-00905',name:'Archived sample job',date_in:'2026-11-10',due_date:'2026-11-12',priority:'Normal',status:'Cancelled',space_id:null,assigned_to:null,created_at:'2026-11-10T01:00:00Z',version:4};
 await page.route('**/api/bootstrap*',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({...emptyWorkspace,me:{...emptyWorkspace.me,name:'Admin',role:'Admin'},jobs:[j]})}));
 await page.route('**/api/jobs/905',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({job:j,activity:[]})}));
 await page.reload();
 await page.getByRole('tab',{name:/Archived/}).click();
 await expect(page.getByRole('button',{name:'Archived sample job',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Archived sample job',exact:true}).click();
 await expect(page.getByRole('button',{name:'Delete permanently'})).toBeVisible();
 await page.getByRole('button',{name:'Delete permanently'}).click();
 await expect(page.getByRole('dialog').last()).toContainText('cannot be undone');
});

test('browser favicon matches sidebar icon and errors keep a left-aligned branded recovery screen',async({page})=>{
 const favicon=await page.locator('link[rel="icon"]').getAttribute('href');
 expect(favicon).toContain('icon.svg?v=206');
 const sidebarIcon=await page.locator('.sidebar .brand-ksl img').getAttribute('src');
 expect(sidebarIcon).toContain('icon.svg');
 await page.route('**/api/bootstrap*',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Temporary connection failure'})}));
 await page.reload();
 await expect(page.getByText('Could not open the workspace.')).toBeVisible();
 await expect(page.getByText('KSL Job Management')).toBeVisible();
 expect(await page.locator('.start-screen .brand-stack').evaluate(el=>getComputedStyle(el).textAlign)).toBe('left');
 await expect(page.getByRole('button',{name:'Try again'})).toBeVisible();
});

test('missing client bundle displays the static workspace shell, not a blank white page',async({page})=>{
 await page.route('**/assets/*.js',route=>route.fulfill({status:404,body:'Missing bundle'}));
 await page.reload();
 await expect(page.locator('[data-preboot]')).toBeVisible();
 await expect(page.locator('[data-preboot] .boot-brand')).toContainText('Jobdesk');
 await expect(page.locator('[data-preboot] .boot-brand')).toContainText('KSL Job Management');
 await expect(page.locator('[data-preboot] h1')).toHaveText('Team overview');
 await expect(page.locator('[data-preboot] .boot-ring')).toHaveCount(0);
});

test('five confirmed jobs appear and no-match filters provide recovery',async({page})=>{
 const jobs=Array.from({length:6},(_,i)=>({
  id:501+i,invoice_id:'INV-2026-0050'+i,name:'Jobdesk item '+i,customer:'',contact:'',
  date_in:'2026-11-20',due_date:'2026-11-27',priority:'Normal',
  status:i===5?'Awaiting Sales':'Confirmed',assigned_to:22,space_id:200,
  confirmed_at:i===5?null:'2026-11-21T02:00:00Z',
  created_at:'2026-11-20T02:00:00Z',version:1
 }));
 await page.route('**/api/bootstrap*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
  ...emptyWorkspace,jobs,users:[{id:22,name:'Designer',role:'Designer',active:true}],
  spaces:[{id:200,name:'Designer',owner_user_id:22,sort_order:1}]
 })}));
 await page.reload();
 await page.getByRole('tab',{name:/Confirmed/}).click();
 await expect(page.locator('.job-panel .job-link')).toHaveCount(5);
 await page.getByRole('textbox',{name:'Search jobs'}).fill('no-such-job-9381');
 await expect(page.getByText('No jobs match these filters.')).toBeVisible();
 await page.getByRole('button',{name:'Show all jobs'}).click();
 await expect(page.locator('.job-panel .job-link')).toHaveCount(6);
});

test('invalid job records show an actionable error instead of crashing to white',async({page})=>{
 await page.route('**/api/bootstrap*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({...emptyWorkspace,jobs:[{id:6,name:'Broken row',due_date:null}]})}));
 await page.reload();
 await expect(page.getByText('Could not open the workspace.')).toBeVisible();
 await expect(page.getByText(/Some jobs returned incomplete data/)).toBeVisible();
});

test('the initial workspace has no splash, opening message, or spinner',async({page})=>{
 await page.route('**/api/bootstrap*',async route=>{
  await new Promise(resolve=>setTimeout(resolve,1800));
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(emptyWorkspace)});
 });
 await page.reload();
 await expect(page.getByRole('heading',{name:'Team overview'})).toBeVisible();
 await expect(page.locator('.start-screen .loader')).toHaveCount(0);
 await expect(page.getByText('Opening your workspace…')).toHaveCount(0);
 await expect(page.locator('.boot-ring')).toHaveCount(0);
 await expect(page.locator('nav.ksl-dock')).toBeVisible();
});
