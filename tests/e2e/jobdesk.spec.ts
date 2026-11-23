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
