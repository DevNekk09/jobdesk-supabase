import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('both API copies stay identical and cannot automatically elevate browser identity',()=>{
 const edge=read('supabase/functions/jobdesk-api/api.ts'),local=read('api.ts');
 assert.equal(local,edge,'Local and Edge API business logic must not drift');
 assert.match(edge,/env\.EDGE_TRUSTED_ACCESS===true&&req\.headers\.get\('x-edge-admin-verified'\)==='1'/);
 assert.match(edge,/AND role IN \('Designer','Print','Sales'\)/);
 assert.match(edge,/role:'Designer'/);
 assert.doesNotMatch(edge,/access remains intentionally unrestricted/);
 assert.doesNotMatch(edge,/const u:Row=\{\.\.\.shared,role:'Admin'\}/);
});
test('irreversible delete operations require a server-verified Admin role',()=>{
 const edge=read('supabase/functions/jobdesk-api/api.ts');
 assert.match(edge,/if\(path==='\/api\/trash\/clear'&&method==='POST'\)\{\s*role\(u,\['Admin'\]\)/);
 assert.match(edge,/if\(action==='purge'&&method==='POST'\)\{\s*role\(u,\['Admin'\]\)/);
 assert.match(edge,/if\(action==='comment'&&method==='POST'\)\{role\(u,\['Admin','Sales','Designer','Print'\]\)/);
 assert.match(edge,/if\(action==='status'&&method==='POST'\)\{\s*role\(u,\['Admin','Sales','Designer','Print'\]\)/);
 assert.match(edge,/if\(r==='Admin'\)fail\('Admin permissions are reserved for a verified PIN session\.',403\)/);
 const page=read('app/page.tsx');
 assert.match(page,/data\.me\.role==='Admin'&&\['Deleted','Cancelled'\]\.includes\(selected\.status\)/);
 assert.match(page,/data\.me\.role==='Admin'&&<button className="btn danger"/);
});
test('Edge refuses forged verified header without a valid server session',()=>{
 const wrapper=read('supabase/functions/jobdesk-api/index.ts');
 assert.match(wrapper,/verifiedHeaders\.delete\('x-edge-admin-verified'\)/);
 assert.match(wrapper,/if\(adminValid\)verifiedHeaders\.set\('x-edge-admin-verified','1'\)/);
 assert.match(wrapper,/expires_at>now\(\)/);
 assert.doesNotMatch(wrapper,/x-workspace-token|workspace_access/);
});
test('modular UI retains original Admin PIN modal unchanged in page',()=>{
 const page=read('app/page.tsx');
 const modules=['app/components/Icon.tsx','app/components/QuickDock.tsx','app/components/JobSaveFeedback.tsx','app/services/jobdesk-api.ts','app/lib/dates.ts','app/styles/fluid.css'];
 for(const f of modules)assert.ok(read(f).length>200, f);
 assert.match(page,/adminUnlock&&<Modal title="Admin mode"/);
 assert.match(page,/unlockAdmin\(\)/);
 assert.match(page,/APPLE SPORT SDN BHD/);
 assert.match(page,/KSL Team Job Management/);
 assert.match(page,/Jobsheet created/);
});
test('non-blocking refresh and performance modules have safe fallbacks',()=>{
 const page=read('app/page.tsx'),client=read('app/services/jobdesk-api.ts'),dates=read('app/lib/dates.ts');
 assert.match(page,/if\(dataRef\.current\)\{setSyncWarning/);
 assert.match(page,/const synced=await load\(\)/);
 assert.match(page,/setData\(prev=>prev\?\{/);
 assert.match(client,/new AbortController\(\)/);
 assert.match(client,/25000/);
 assert.match(client,/clearTimeout\(timeout\)/);
 assert.match(dates,/const isoParts=new Intl\.DateTimeFormat/);
 assert.match(dates,/const monthFormat=new Intl\.DateTimeFormat/);
 assert.match(read('frontend/main.tsx'),/styles\/fluid\.css/);
});
