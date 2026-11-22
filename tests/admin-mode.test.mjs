import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Admin mode uses a PIN modal and time-limited session, never a direct admin switch',()=>{
 const ui=src('app/page.tsx');
 assert.match(ui,/unlockAdmin/);
 assert.match(ui,/adminPin/);
 assert.match(ui,/\/api\/admin\/unlock/);
 assert.match(ui,/\/api\/admin\/lock/);
 assert.match(ui,/sessionStorage\.setItem\('jobdesk-admin-session'/);
 assert.doesNotMatch(ui,/Return to shared test admin/);
 assert.match(ui,/KSL Team Job Management/);
 assert.match(ui,/APPLE SPORT SDN BHD/);
});
test('Supabase Edge rejects forged Admin mode and requires a server-verified session',()=>{
 const edge=src('supabase/functions/jobdesk-api/index.ts');
 const api=src('supabase/functions/jobdesk-api/api.ts');
 assert.match(edge,/adminValid/);
 assert.match(edge,/x-jobdesk-admin-session/);
 assert.match(edge,/x-edge-admin-verified/);
 assert.match(edge,/failed_attempts\+1>=5/);
 assert.match(edge,/sessionHash/);
 assert.match(api,/req\.headers\.get\('x-edge-admin-verified'\)===\x271\x27/);
 assert.match(api,/role:'Viewer'/);
 assert.doesNotMatch(api,/access remains intentionally unrestricted/);
});
test('PIN is never embedded as plaintext in frontend or repository',()=>{
 for(const path of ['app/page.tsx','app/globals.css','supabase/functions/jobdesk-api/index.ts','supabase/functions/jobdesk-api/api.ts','supabase/schema.sql']){
   assert.doesNotMatch(src(path),/123456/);
 }
 assert.match(src('app/globals.css'),/HyperOS 4-inspired/);
});
