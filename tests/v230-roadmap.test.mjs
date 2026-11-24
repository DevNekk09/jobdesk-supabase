import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('V2.3 keeps server-authoritative endpoints and Admin PIN',()=>{
 const p=read('app/page.tsx'),api=read('api.ts');
 assert.match(p,/jobdeskRequest/);
 assert.match(p,/mutationInFlight\.current/);
 assert.match(p,/version:j\.version/);
 assert.match(p,/isJobConflict\(message\)/);
 assert.match(api,/x-edge-admin-verified/);
 assert.match(api,/RESET JOBDESK/);
});
test('V2.3 compact cards, smart filters and handover are responsive and accessible',()=>{
 const p=read('app/page.tsx'),css=read('app/globals.css');
 const filters=read('app/components/QuickDeadlineFilters.tsx');
 for(const token of ['v23-job-list','v23-quick-next','v23-handover','v23-connection-banner','productionLimit','useDeferredValue','QuickDeadlineFilters','matchesJobSearch'])assert.ok(p.includes(token),token);
 assert.match(filters,/aria-pressed=\{value===item.value\}/);
 assert.match(filters,/role="group"/);
 assert.match(css,/\.job-panel\.v23-job-list tbody tr/);
 assert.match(css,/@media\(max-width:900px\)/);
 assert.match(css,/focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
});
test('V2.3 search is plain-text and conflicts never auto-retry mutations',()=>{
 const search=read('app/lib/jobdesk-search.ts'),sync=read('app/lib/jobdesk-sync.ts');
 assert.match(search,/searchable\.includes\(needle\)/);
 assert.match(sync,/isJobConflict/);
 assert.match(sync,/This job was updated in another browser/);
 assert.doesNotMatch(read('app/page.tsx'),/setInterval\(.*progress.*POST/);
});
test('V2.3 moves reusable modal to a standalone component preserving focus',()=>{
 const main=read('app/page.tsx'),modal=read('app/components/JobdeskModal.tsx');
 assert.match(main,/import Modal from '\.\/components\/JobdeskModal'/);
 assert.match(modal,/aria-modal="true"/);
 assert.match(modal,/old\?\.focus\(\)/);
 assert.match(modal,/useId\(\)/);
});
