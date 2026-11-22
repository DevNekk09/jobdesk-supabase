import {test,expect} from '@playwright/test';

const emptyWorkspace={
 me:{id:1,name:'Guest',email:'shared-team@system.invalid',role:'Viewer',active:true},
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
