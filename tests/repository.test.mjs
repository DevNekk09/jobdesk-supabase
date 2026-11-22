import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>readFileSync(root+p,'utf8');
test('no sample data and no SQLite-only SQL in API',()=>{
 const api=read('api.ts'),page=read('app/page.tsx');
 for(const pattern of [/sqlite_sequence/i,/last_insert_rowid/i,/INSERT OR IGNORE/i,/json_each\(/i,/changes\(\)/i])assert.doesNotMatch(api,pattern);
 for(const pattern of [/function sample\(/i,/setDemo\(/i,/\?demo=1/i,/Explore sample workspace/i,/Company profile brochure/i])assert.doesNotMatch(page,pattern);
 assert.doesNotMatch(api,/Initial Jobdesk spaces provisioned/i);
});
test('Supabase schema contains no demo INSERT records',()=>{
 const sql=read('supabase/schema.sql');
 assert.doesNotMatch(sql,/INSERT INTO/i);
 for(const table of ['users','jobs','activity','job_spaces','device_profiles'])assert.match(sql,new RegExp('CREATE TABLE IF NOT EXISTS jobdesk\\.'+table+'\\s*\\(','i'));
 assert.ok(existsSync(root+'server.mjs'));
});
