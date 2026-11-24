import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Normal GitHub Pages URL grants access to a common editable workspace',()=>{
 const edge=read('supabase/functions/jobdesk-api/index.ts');
 const client=read('app/services/jobdesk-api.ts');
 const page=read('app/page.tsx');
 const api=read('supabase/functions/jobdesk-api/api.ts');
 assert.doesNotMatch(edge,/Workspace invitation link required|workspace_access|api\/staff\/invite|api\/staff\/redeem/);
 assert.doesNotMatch(client,/x-workspace-token|x-jobdesk-staff-session/);
 assert.doesNotMatch(page,/Your private workspace invitation link is required/);
 assert.doesNotMatch(page,/v2-staff-invites|Generate link|revokeStaffAccess/);
 assert.match(edge,/verifiedHeaders\.delete\('x-edge-staff-user'\)/);
 assert.match(edge,/if\(Number\.isSafeInteger\(actorId\)&&actorId>0\)verifiedHeaders\.set\('x-edge-staff-user',String\(actorId\)\)/);
 assert.match(api,/const openEditor=/);
 assert.match(api,/const u:Row=isAdmin\?\{\.\.\.shared,name:'Admin',role:'Admin'\}:\{\.\.\.assigned,role:'Designer'\}/);
 assert.match(api,/team-editor@system\.invalid/);
 assert.match(page,/Everyone can view and edit jobs/);
});
test('Shared team identity never escalates to Admin without the existing PIN',()=>{
 const edge=read('supabase/functions/jobdesk-api/index.ts');
 const api=read('supabase/functions/jobdesk-api/api.ts');
 assert.match(edge,/verifiedHeaders\.delete\('x-edge-admin-verified'\)/);
 assert.match(edge,/if\(adminValid\)verifiedHeaders\.set\('x-edge-admin-verified','1'\)/);
 assert.match(api,/env\.EDGE_TRUSTED_ACCESS===true&&req\.headers\.get\('x-edge-admin-verified'\)==='1'/);
 assert.match(api,/role\(u,\['Admin'\]\)/);
 assert.match(api,/role\(u,\['Admin','Sales','Designer'\]\)/);
 assert.match(api,/if\(path==='\/api\/device'&&method==='POST'\)/);
 assert.doesNotMatch(api,/Your device can only be linked to your verified member profile/);
});
test('Admin PIN is still the original six-digit bcrypt check',()=>{
 const edge=read('supabase/functions/jobdesk-api/index.ts');
 const page=read('app/page.tsx');
 assert.match(edge,/SELECT extensions\.crypt\(\?, pin_hash\)=pin_hash AS valid,failed_attempts,locked_until/);
 assert.match(edge,/failed_attempts\+1>=5/);
 assert.match(page,/if\(!\/\^\[0-9\]\{6\}\$\/\.test\(adminPin\)\)/);
 assert.match(page,/adminUnlock&&<Modal title="Admin mode"/);
 for(const content of [edge,page,read('supabase/schema.sql')])assert.doesNotMatch(content,/123456/);
});
test('Old UI, member management and deleted staff Jobdesk cleanup remain intact',()=>{
 const page=read('app/page.tsx');
 assert.match(page,/adminUnlock&&<Modal title="Admin mode"/);
 assert.match(page,/KSL Team Job Management/);
 assert.match(page,/APPLE SPORT SDN BHD/);
 assert.match(page,/designerSpaces=data\.spaces\.filter\(s=>!s\.archived_at/);
 assert.match(page,/The shared Jobdesk is open for viewing and editing/);
});
test('Month scoped loading preserves global deadline metrics',()=>{
 const api=read('supabase/functions/jobdesk-api/api.ts');
 const page=read('app/page.tsx');
 assert.match(api,/overdue_by_space:overdue\.results/);
 assert.match(api,/near_deadline_by_space:nearDeadline\.results/);
 assert.match(page,/const overdueCount=month==='all'/);
 assert.match(page,/if\(d==='overdue'\|\|d==='urgent'\|\|d==='soon'\|\|d==='today'\|\|d==='tomorrow'\)setMonth\('all'\)/);
 assert.equal((page.match(/label:'Overdue',value:overdueCount/g)||[]).length,2);
 assert.equal((page.match(/label:'Urgent jobs',value:urgentCount/g)||[]).length,2);
 assert.equal((page.match(/label:'Due in 3 days',value:soonCount/g)||[]).length,2);
});
