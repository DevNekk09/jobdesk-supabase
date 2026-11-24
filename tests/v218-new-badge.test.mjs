import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('native date picker and ISO values preserved for add/edit job',()=>{
 const page=read('app/page.tsx');
 assert.match(page,/name="date_in" type="date" lang="en-GB"/);
 assert.match(page,/name="due_date" type="date" lang="en-GB"/);
 assert.match(page,/values\.due_date<values\.date_in/);
 assert.match(page,/date\(j\.date_in\)/);
});
test('NEW badge uses Malaysia calendar date of immutable creation timestamp',()=>{
 const page=read('app/page.tsx');
 const dates=read('app/lib/dates.ts');
 assert.match(page,/const isNewToday=\(j:Job\)=>!!j\.created_at/);
 assert.match(page,/date\(j\.created_at\)===date\(todayLocal\)/);
 assert.match(page,/86400000-\(\(Date\.now\(\)\+28800000\)%86400000\)\+100/);
 assert.match(page,/document\.addEventListener\('visibilitychange',update\)/);
 assert.match(page,/window\.addEventListener\('focus',update\)/);
 assert.equal(page.split('className="job-new-label"').length-1,3);
 assert.match(dates,/timeZone:myt/);
});
