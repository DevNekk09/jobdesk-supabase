import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sqlForPg} from '../lib/sql.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('full reset requires Admin, typed phrase, exact scope, and one FK-safe transaction',()=>{
 const api=read('api.ts');
 const section=api.slice(api.indexOf("if(path==='/api/admin/reset-workspace'"),api.indexOf("if(path==='/api/trash/clear'"));
 assert.ok(section.startsWith("if(path==='/api/admin/reset-workspace'"));
 assert.match(section,/role\(u,\['Admin'\]\)/);
 assert.match(section,/body\.confirmation!=='RESET JOBDESK'/);
 assert.match(section,/body\.scope!=='all-workspace-data'/);
 assert.match(section,/await db\.transaction\(async tx=>/);
 const order=['DELETE FROM activity','DELETE FROM jobs','DELETE FROM device_profiles','DELETE FROM staff_sessions','DELETE FROM staff_invites','DELETE FROM workspace_access','DELETE FROM job_spaces','DELETE FROM users'];
 let prev=-1;
 for(const token of order){const index=section.indexOf(token);assert.ok(index>prev,'FK-safe deletion: '+token);prev=index;}
 assert.doesNotMatch(section,/DELETE FROM admin_auth|DELETE FROM admin_sessions|TRUNCATE|DROP TABLE/);
 assert.match(section,/shared-team@system\.invalid/);
 assert.match(section,/team-editor@system\.invalid/);
 assert.equal(sqlForPg('DELETE FROM workspace_access'), 'DELETE FROM jobdesk.workspace_access');
 assert.equal(read('api.ts'),read('supabase/functions/jobdesk-api/api.ts'));
 assert.equal(read('lib/sql.mjs'),read('supabase/functions/jobdesk-api/lib/sql.mjs'));
});
test('Archive purge is Admin-only, requires exact version, and preserves unrelated jobs',()=>{
 const api=read('api.ts');
 const section=api.slice(api.indexOf("if(action==='purge'&&method==='POST')"),api.indexOf('const update:Row={};'));
 assert.match(section,/role\(u,\['Admin'\]\)/);
 assert.match(section,/\['Deleted','Cancelled'\]\.includes\(j\.status\)/);
 assert.match(section,/SELECT id FROM jobs WHERE id=\? AND version=\? AND status IN \('Deleted','Cancelled'\) FOR UPDATE/);
 assert.match(section,/DELETE FROM activity WHERE job_id=\?/);
 assert.match(section,/DELETE FROM jobs WHERE id=\? AND version=\? AND status IN \('Deleted','Cancelled'\)/);
 const ui=read('app/page.tsx');
 assert.match(ui,/Full database reset/);
 assert.match(ui,/window\.prompt\('PERMANENT RESET:/);
 assert.match(ui,/data\.me\.role==='Admin'&&\['Deleted','Cancelled'\]\.includes\(selected\.status\)/);
});
