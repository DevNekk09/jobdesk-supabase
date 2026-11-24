import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Job Details action groups preserve original mutations and confirmation dialogs',()=>{
 const page=read('app/page.tsx');
 for(const item of ["'progress'","'complete'","'unconfirm'","'delete'","'restore'","'reopen'","'priority'"])assert.ok(page.includes(item));
 assert.match(page,/className="job-action-area"/);
 assert.match(page,/className="job-primary-actions"/);
 assert.match(page,/className="job-quick-actions"/);
 assert.match(page,/className="job-more-actions"/);
 assert.match(page,/Move to Trash/);
 assert.match(page,/Due soon · auto urgent/);
 assert.doesNotMatch(page,/className="detail-actions"/);
 assert.match(page,/Permanently delete job\?/);
});
test('Job Detail responsive actions are not large competing call-to-actions',()=>{
 const css=read('app/globals.css');
 assert.match(css,/\.job-primary-actions \.job-next-action/);
 assert.match(css,/\.job-more-actions>summary/);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/\.job-secondary-actions\{display:grid/);
});
