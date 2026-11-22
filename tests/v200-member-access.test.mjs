import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('V2 staff session cannot be forged through a browser member ID',()=>{
 const edge=read('supabase/functions/jobdesk-api/index.ts');
 const api=read('supabase/functions/jobdesk-api/api.ts');
 assert.match(edge,/verifiedHeaders\.delete\('x-edge-staff-user'\)/);
 assert.match(edge,/if\(staffRecord\)verifiedHeaders\.set\('x-edge-staff-user',String\(staffRecord\.user_id\)\)/);
 assert.match(edge,/ss\.revoked_at IS NULL AND ss\.expires_at>now\(\)/);
 assert.match(edge,/u\.active=1 AND u\.deleted_at IS NULL/);
 assert.match(api,/env\.EDGE_TRUSTED_ACCESS===true\?req\.headers\.get\('x-edge-staff-user'\)/);
 assert.doesNotMatch(api,/const actorId=Number\(req\.headers\.get\('x-jobdesk-actor'\)/);
 assert.match(api,/AND role IN \('Designer','Print','Sales'\)/);
});
test('Admin alone can issue and revoke a single-use member invitation',()=>{
 const edge=read('supabase/functions/jobdesk-api/index.ts');
 assert.match(edge,/api\/staff\/invite/);
 assert.match(edge,/api\/staff\/redeem/);
 assert.match(edge,/api\/staff\/revoke/);
 assert.match(edge,/if\(!adminValid\)return respond\(\{error:'Admin session required/);
 assert.match(edge,/redeemed_at IS NULL AND expires_at>now\(\) RETURNING user_id/);
 assert.match(edge,/jobdesk\.staff_sessions/);
 assert.match(edge,/interval '30 days'/);
 assert.match(edge,/interval '24 hours'/);
 const sql=read('supabase/schema.sql');
 assert.match(sql,/CREATE TABLE IF NOT EXISTS jobdesk\.staff_invites/);
 assert.match(sql,/CREATE TABLE IF NOT EXISTS jobdesk\.staff_sessions/);
 assert.doesNotMatch(sql,/INSERT INTO jobdesk\.(?:staff_invites|staff_sessions)/);
});
test('Admin PIN remains exactly the previous 6-digit bcrypt check',()=>{
 const edge=read('supabase/functions/jobdesk-api/index.ts');
 const page=read('app/page.tsx');
 assert.match(edge,/SELECT extensions\.crypt\(\?, pin_hash\)=pin_hash AS valid,failed_attempts,locked_until/);
 assert.match(edge,/failed_attempts\+1>=5/);
 assert.match(page,/if\(!\/\^\[0-9\]\{6\}\$\/\.test\(adminPin\)\)/);
 assert.match(page,/adminUnlock&&<Modal title="Admin mode"/);
 for(const content of [edge,page,read('supabase/schema.sql')])assert.doesNotMatch(content,/123456/);
});
test('Original Admin Settings remain separate from invite UI',()=>{
 const page=read('app/page.tsx');
 assert.match(page,/v2-staff-invites/);
 assert.match(page,/createStaffInvite\(/);
 assert.match(page,/revokeStaffAccess\(/);
 assert.match(page,/jobdeskRequest.*\/api\/staff\/redeem/);
 assert.match(page,/KSL Team Job Management/);
 assert.match(page,/APPLE SPORT SDN BHD/);
});
test('month-scoped Jobsheet still counts overdue jobs from all prior months',()=>{
 const api=read('supabase/functions/jobdesk-api/api.ts');
 const page=read('app/page.tsx');
 assert.match(api,/overdue_by_space:overdue\.results/);
 assert.match(api,/COALESCE\(j\.space_id,/);
 assert.match(page,/const overdueCount=month==='all'/);
 assert.match(page,/if\(d==='overdue'\)setMonth\('all'\)/);
 assert.equal((page.match(/label:'Overdue',value:overdueCount/g)||[]).length,2);
});
