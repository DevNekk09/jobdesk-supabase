import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sqlForPg} from '../lib/sql.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Edge and Node PostgreSQL shims remain exactly identical',()=>{
 assert.equal(read('lib/sql.mjs'),read('supabase/functions/jobdesk-api/lib/sql.mjs'));
 for(const table of ['users','job_spaces','jobs','activity','device_profiles','staff_sessions','staff_invites']){
  assert.equal(sqlForPg('UPDATE '+table+' SET id=? WHERE id=?'),
    'UPDATE jobdesk.'+table+' SET id=$1 WHERE id=$2',table);
 }
});
test('Delete User soft-deletion remains atomic and no credential tables are unqualified',()=>{
 const api=read('supabase/functions/jobdesk-api/api.ts');
 const section=api.slice(api.indexOf("const ud=path.match"),api.indexOf("const um=path.match"));
 assert.match(section,/role\(u,\['Admin'\]\)/);
 assert.match(section,/const target=await db\.prepare\('SELECT \* FROM users WHERE id=\? AND deleted_at IS NULL'\)/);
 assert.match(section,/await db\.batch\(\[/);
 assert.match(section,/UPDATE users SET active=0,deleted_at=\? WHERE id=\?/);
 assert.match(section,/UPDATE job_spaces SET owner_user_id=NULL,archived_at=now\(\) WHERE owner_user_id=\?/);
 assert.match(section,/DELETE FROM device_profiles WHERE user_id=\?/);
 assert.match(section,/UPDATE staff_sessions SET revoked_at=now\(\) WHERE user_id=\? AND revoked_at IS NULL/);
 assert.match(section,/UPDATE staff_invites SET redeemed_at=now\(\) WHERE user_id=\? AND redeemed_at IS NULL/);
 assert.match(section,/archived_space_ids:removedSpaces/);
 for(const sql of ["UPDATE staff_sessions SET revoked_at=now() WHERE user_id=? AND revoked_at IS NULL",
                    "UPDATE staff_invites SET redeemed_at=now() WHERE user_id=? AND redeemed_at IS NULL"]){
  assert.match(sqlForPg(sql),/^UPDATE jobdesk\.staff_(?:sessions|invites) /);
 }
});
test('Admin PIN remains protected and no direct public Admin role is introduced',()=>{
 const edge=read('supabase/functions/jobdesk-api/index.ts');
 const api=read('supabase/functions/jobdesk-api/api.ts');
 const ui=read('app/page.tsx');
 assert.match(edge,/SELECT extensions\.crypt\(\?, pin_hash\)=pin_hash AS valid,failed_attempts,locked_until/);
 assert.match(edge,/verifiedHeaders\.delete\('x-edge-admin-verified'\)/);
 assert.match(edge,/if\(adminValid\)verifiedHeaders\.set\('x-edge-admin-verified','1'\)/);
 assert.match(api,/const isAdmin=env\.EDGE_TRUSTED_ACCESS===true&&req\.headers\.get\('x-edge-admin-verified'\)==='1'/);
 assert.match(ui,/adminUnlock&&<Modal title="Admin mode"/);
 assert.match(ui,/Delete user/);
});
