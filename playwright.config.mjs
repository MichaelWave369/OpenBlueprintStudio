import {defineConfig,devices} from '@playwright/test';

/**
 * R23 Chromium tests run ONLY against an isolated production preview.
 * The browser profile and all localStorage records are temporary per test.
 */
export default defineConfig({
 testDir:'./e2e',
 testMatch:'**/*.e2e.mjs',
 fullyParallel:false,
 forbidOnly:!!process.env.CI,
 retries:process.env.CI?1:0,
 workers:1,
 timeout:45_000,
 reporter:process.env.CI?[['list'],['html',{open:'never',outputFolder:'playwright-report'}]]:'list',
 use:{
   baseURL:'http://127.0.0.1:4173',
   ...devices['Desktop Chrome'],
   viewport:{width:1440,height:960},
   headless:true,
   acceptDownloads:true,
   trace:'retain-on-failure',
   screenshot:'only-on-failure',
 },
 webServer:{
   command:'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
   url:'http://127.0.0.1:4173',
   timeout:30_000,
   reuseExistingServer:!process.env.CI,
 },
});
