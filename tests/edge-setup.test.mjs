import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Supabase Edge Function source committed with no server secrets',()=>{
 for(const path of ['supabase/functions/jobdesk-api/index.ts','supabase/functions/jobdesk-api/api.ts','supabase/functions/jobdesk-api/lib/database.mjs','supabase/functions/jobdesk-api/lib/sql.mjs'])assert.ok(existsSync(new URL('../'+path,import.meta.url)),path);
 const code=read('supabase/functions/jobdesk-api/index.ts');
 assert.match(code,/x-workspace-token/);
 assert.match(code,/workspace_access/);
 assert.match(code,/https:\/\/devnekk09\.github\.io/);
 assert.match(code,/crypto\.subtle\.digest/);
 assert.doesNotMatch(code,/service_role|sb_secret_/);
});
test('GitHub Pages React client points to Supabase Edge API, not Hostinger',()=>{
 const client=read('app/services/jobdesk-api.ts');
 const page=read('app/page.tsx');
 assert.match(client,/functions\/v1\/jobdesk-api/);
 assert.match(client,/jobdesk-workspace-token/);
 assert.match(client,/fetch\(apiUrl\(path\)/);
 assert.match(page,/jobdeskRequest/);
 assert.doesNotMatch(client,/Hostinger/);
});
test('Supabase database schema has no demo rows and private invitation hashes',()=>{
 const sql=read('supabase/schema.sql');
 assert.match(sql,/CREATE TABLE IF NOT EXISTS jobdesk\.workspace_access/);
 assert.match(sql,/REVOKE ALL ON ALL TABLES IN SCHEMA jobdesk/);
 assert.doesNotMatch(sql,/INSERT INTO (?:jobdesk\.)?(?:users|jobs|job_spaces)/i);
});
