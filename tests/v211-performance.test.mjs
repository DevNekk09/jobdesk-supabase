import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('bootstrap combines two system identities without altering Admin PIN or public actor separation',()=>{
 const api=read('api.ts');
 assert.equal(api,read('supabase/functions/jobdesk-api/api.ts'));
 const insert=api.match(/INSERT INTO users\(user_id,name,email,role,active,created_at\) VALUES\(NULL,'Admin','shared-team@system\.invalid','Admin',1,\?\),\(NULL,'Team member','team-editor@system\.invalid','Designer',1,\?\) ON CONFLICT \(email\) DO NOTHING/);
 assert.ok(insert,'both idempotent system inserts are in the same query');
 assert.match(api,/const shared=systemUsers\.find\(row=>row\.email==='shared-team@system\.invalid'\)/);
 assert.match(api,/const openEditor=systemUsers\.find\(row=>row\.email==='team-editor@system\.invalid'\)/);
 assert.match(api,/if\(!shared\|\|!openEditor\)fail\('Shared system identities are unavailable\.',503\)/);
 assert.match(api,/const isAdmin=env\.EDGE_TRUSTED_ACCESS===true&&req\.headers\.get\('x-edge-admin-verified'\)==='1'/);
});
test('preconnect and refresh throttling do not cache Jobdesk data or add fake loading',()=>{
 const html=read('index.html');
 const page=read('app/page.tsx');
 const client=read('app/services/jobdesk-api.ts');
 assert.match(html,/rel="preconnect" href="https:\/\/vsvlutqagtkdtrowaked\.supabase\.co"/);
 assert.match(html,/rel="dns-prefetch"/);
 assert.match(page,/Date\.now\(\)-lastSuccessfulLoad\.current>=30000/);
 assert.match(page,/jobdeskRequest<Data & \{error\?:string\}>\('\/api\/bootstrap\?month='/);
 assert.match(client,/cache:method==='GET'\?'no-store':'default'/);
 assert.doesNotMatch(page,/if\(loading\)return <div className="initial-workspace"/);
});
