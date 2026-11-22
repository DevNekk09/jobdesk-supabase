import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('monthly backend query is bounded and month choices remain available',()=>{
 const api=read('supabase/functions/jobdesk-api/api.ts');
 const index=read('supabase/functions/jobdesk-api/index.ts');
 const page=read('app/page.tsx');
 assert.match(api,/requestedMonth=new URL\(req\.url\)\.searchParams\.get\('month'\)\|\|'all'/);
 assert.match(api,/j\.due_date>=\? AND j\.due_date<\?/);
 assert.match(api,/available_months:months\.results\.map/);
 assert.match(api,/requestedMonth==='all'/);
 assert.match(index,/endpoint\.search=new URL\(request\.url\)\.search/);
 assert.match(page,/jobdeskRequest<Data & \{error\?:string\}>\('\/api\/bootstrap\?month='\+encodeURIComponent\(month\)\)/);
 assert.match(page,/\.\.\.\(data\.available_months\|\|\[\]\)/);
 assert.match(page,/loadSequence\.current/);
});
test('Trash clearing remains reviewable when only current month has loaded',()=>{
 const page=read('app/page.tsx'),api=read('supabase/functions/jobdesk-api/api.ts');
 assert.match(page,/if\(month!=='all'\)throw Error\('Select All months before permanently clearing Trash\.'\)/);
 assert.match(page,/disabled=\{month!=='all'\|\|/);
 assert.match(api,/role\(u,\['Admin'\]\)/);
});
test('Admin settings and verification remain intact while month-scoped loading is enabled',()=>{
 const page=read('app/page.tsx');
 assert.match(page,/adminUnlock&&<Modal title="Admin mode"/);
 assert.match(page,/role==='Admin'/);
 assert.match(page,/APPLE SPORT SDN BHD/);
 assert.match(page,/KSL Team Job Management/);
});
