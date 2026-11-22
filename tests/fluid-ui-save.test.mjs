import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('permanent three-button dock matches reference even without edit permission',()=>{
 const page=read('app/page.tsx'),css=read('app/globals.css');
 const dock=page.slice(page.indexOf('<nav className="floating-panel ksl-dock"'),page.indexOf('</nav>',page.indexOf('<nav className="floating-panel ksl-dock"'))+6);
 assert.ok(dock.length>100,'dock exists');
 assert.match(dock,/<span>Overview<\/span>/);
 assert.match(dock,/dock-create/);
 assert.match(dock,/<span>Spaces<\/span>/);
 assert.match(dock,/if\(!canEdit\)/);
 assert.doesNotMatch(dock,/&&<button className="floating-add"/,'the plus must not disappear for guests');
 assert.match(css,/\.floating-panel\.ksl-dock\{/);
 assert.match(css,/grid-template-columns:repeat\(3,68px\)/);
});
test('redundant green instructional banner has been removed',()=>{
 const page=read('app/page.tsx');
 assert.doesNotMatch(page,/className="open-test-strip"/);
 assert.doesNotMatch(page,/Select your team identity to work\. Admin tools require a PIN\./);
 assert.match(page,/adminUnlock&&<Modal/);
});
test('save and production animations only follow API success paths',()=>{
 const page=read('app/page.tsx'),css=read('app/globals.css');
 for(const [start,end] of [['async function saveJob(', 'function editUser('],['async function mutate(', 'async function saveJob('],['async function updateProduction(', 'async function mutate(']]){
  const body=page.slice(page.indexOf(start),page.indexOf(end));
  assert.ok(body.indexOf('await request(')>=0, start+' has awaited API call');
  assert.ok(body.indexOf('animateSave(')>body.indexOf('await request('),start+' animates only after confirmed API write');
  assert.match(body,/catch\(e\)/);
 }
 assert.match(page,/role="status" aria-live="polite" aria-atomic="true"/);
 assert.match(page,/job-save-feedback/);
 assert.match(css,/@keyframes ksl-save-enter/);
 assert.match(css,/@keyframes ksl-check-draw/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test('existing Supabase and Admin PIN security preserved',()=>{
 const page=read('app/page.tsx');
 assert.match(page,/functions\/v1\/jobdesk-api/);
 assert.match(page,/x-jobdesk-admin-session/);
 assert.match(page,/KSL Team Job Management/);
 assert.match(page,/APPLE SPORT SDN BHD/);
 assert.match(page,/isUrgent/);
});
