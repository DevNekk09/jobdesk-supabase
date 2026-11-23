import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('delete member detaches open jobs before desk archival without changing historic jobs',()=>{
 const api=read('api.ts');
 const block=api.slice(api.indexOf('const ud=path.match'),api.indexOf('const um=path.match'));
 const move=block.indexOf('UPDATE jobs SET space_id=NULL');
 const archive=block.indexOf('UPDATE job_spaces SET owner_user_id=NULL,archived_at=now()');
 assert.ok(move>0&&archive>move,'active jobs are released before archiving');
 assert.match(block,/status NOT IN \('Completed','Cancelled','Deleted'\)/);
 assert.match(block,/assigned_to=CASE WHEN assigned_to=\? THEN NULL ELSE assigned_to END/);
 assert.match(block,/version=version\+1/);
 assert.match(block,/target\.email/);
 assert.match(block,/await db\.batch\(\[/);
 assert.equal(read('supabase/functions/jobdesk-api/api.ts'),api);
});
test('Trash/Archive state guards reject edits and never allow a status-only resurrection',()=>{
 const api=read('api.ts');
 assert.match(api,/j\.status==='Deleted'&&!\['restore','purge'\]\.includes\(action\|\|''\)/);
 assert.match(api,/j\.status==='Cancelled'&&!\['delete','purge'\]\.includes\(action\|\|''\)/);
 assert.match(api,/jobData\(\{\.\.\.j,\.\.\.b\},j\)/);
 assert.match(api,/SELECT \* FROM job_spaces WHERE id=\? AND archived_at IS NULL/);
 assert.match(api,/SELECT id FROM users WHERE id=\? AND active=1 AND deleted_at IS NULL/);
});
test('empty workspace add and backup flows are accessible without weakening Admin PIN',()=>{
 const page=read('app/page.tsx');
 const api=read('api.ts');
 assert.match(page,/if\(!j&&!chosen&&\(data\?\.spaces\.length\|\|0\)>0\)/);
 assert.match(page,/chosen\?\.id\?\?null/);
 assert.match(page,/Jobdesk_Backup_/);
 assert.match(page,/request\('\/api\/backup'\)/);
 assert.match(page,/setData\(prev=>prev\?\{\.\.\.prev,users:\[\],spaces:\[\],jobs:\[\]/);
 assert.match(api,/if\(path==='\/api\/backup'&&method==='GET'\)\{\s*role\(u,\['Admin'\]\)/);
});
