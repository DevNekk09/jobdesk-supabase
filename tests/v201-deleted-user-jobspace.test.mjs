import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('deleting user archives their linked Jobdesk without deleting jobs or activity',()=>{
 const api=read('supabase/functions/jobdesk-api/api.ts'),local=read('api.ts');
 assert.equal(api,local,'Local and Edge API must not drift');
 const section=api.slice(api.indexOf("const ud=path.match"),api.indexOf("const um=path.match"));
 assert.ok(section.includes("role(u,['Admin'])"),'Delete remains Admin-only');
 assert.match(section,/UPDATE users SET active=0,deleted_at=\?/);
 assert.match(section,/UPDATE job_spaces SET owner_user_id=NULL,archived_at=now\(\) WHERE owner_user_id=\?/);
 assert.match(section,/SELECT id FROM job_spaces WHERE owner_user_id=\? AND archived_at IS NULL/);
 assert.match(section,/return json\(\{ok:true,archived_space_ids:removedSpaces\}\)/);
 assert.match(section,/UPDATE staff_sessions SET revoked_at=now\(\)/);
 assert.match(section,/UPDATE staff_invites SET redeemed_at=now\(\)/);
 assert.doesNotMatch(section,/DELETE FROM (?:job_spaces|jobs|users|activity)\b/);
});
test('removed-member spaces are not returned to taskbar or user space selectors',()=>{
 const api=read('supabase/functions/jobdesk-api/api.ts'),page=read('app/page.tsx');
 assert.match(api,/SELECT \* FROM job_spaces WHERE archived_at IS NULL ORDER BY sort_order,id/);
 assert.match(api,/AND owner_user_id IS NULL AND archived_at IS NULL/);
 assert.match(api,/id=\? AND archived_at IS NULL/);
 assert.match(page,/designerSpaces=data\.spaces\.filter\(s=>!s\.archived_at/);
 assert.match(page,/setData\(prev=>prev\?\{\.\.\.prev,users:prev\.users\.filter\(u=>u\.id!==id\),spaces:prev\.spaces\.filter\(d=>!archived\.has\(d\.id\)&&d\.owner_user_id!==id\)\}/);
 assert.match(page,/if\(space!=='all'&&archived\.has\(space\)\)/);
});
test('orphan cleanup leaves legitimate manually-created spaces and all jobs untouched',()=>{
 const migration=read('supabase/v201_archive_deleted_member_jobspaces.sql');
 const schema=read('supabase/schema.sql');
 assert.match(migration,/ALTER TABLE jobdesk\.job_spaces\s+ADD COLUMN IF NOT EXISTS archived_at timestamptz/);
 assert.match(migration,/s\.owner_user_id IS NULL/);
 assert.match(migration,/removed\.deleted_at IS NOT NULL/);
 assert.match(migration,/lower\(btrim\(removed\.name\)\) = lower\(btrim\(s\.name\)\)/);
 assert.match(migration,/NOT EXISTS \(\s+SELECT 1 FROM jobdesk\.users AS current_member/);
 assert.doesNotMatch(migration,/\b(?:DROP|TRUNCATE|DELETE FROM)\b/i);
 assert.doesNotMatch(migration,/\b(?:UPDATE|ALTER)\s+jobdesk\.admin_auth\b/i);
 assert.match(schema,/archived_at timestamptz/);
});
test('Admin PIN and its UI remain unchanged by deletion fix',()=>{
 const edge=read('supabase/functions/jobdesk-api/index.ts'),page=read('app/page.tsx');
 assert.match(edge,/SELECT extensions\.crypt\(\?, pin_hash\)=pin_hash AS valid,failed_attempts,locked_until/);
 assert.match(page,/adminUnlock&&<Modal title="Admin mode"/);
 assert.match(page,/if\(!\/\^\[0-9\]\{6\}\$\/\.test\(adminPin\)\)/);
});
