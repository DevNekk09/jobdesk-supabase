import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/e2e',
 timeout:25000,
 retries:process.env.CI?1:0,
 reporter:'list',
 use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure'},
 projects:[
  {name:'desktop-chromium',use:{...devices['Desktop Chrome']}},
  {name:'mobile-chromium',use:{...devices['Pixel 7']}}
 ],
 webServer:{
  command:'npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
  url:'http://127.0.0.1:4173/',
  timeout:30000,
  reuseExistingServer:!process.env.CI
 }
});
