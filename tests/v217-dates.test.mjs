import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('DD/MM/YYYY formatting keeps ISO for sorting and database APIs',()=>{
 const dates=read('app/lib/dates.ts'),page=read('app/page.tsx');
 assert.match(dates,/month:'2-digit',day:'2-digit'/);
 assert.match(dates,/export const date=\(value:string,_long=false\)=>isoParts\.format/);
 assert.match(dates,/export const parseDisplayDate=/);
 assert.match(dates,/getUTCMonth\(\)!==mm-1/);
 assert.match(page,/date_in:parseDisplayDate\(String\(fields\.get\('date_in'\)/);
 assert.match(page,/due_date:parseDisplayDate\(String\(fields\.get\('due_date'\)/);
 assert.match(page,/values\.due_date<values\.date_in/);
 assert.match(page,/a\.due_date\.localeCompare\(b\.due_date\)/);
 assert.match(page,/name="date_in" type="date"/);
 assert.match(page,/name="due_date" type="date"/);
 assert.doesNotMatch(page,/name="date_in" type="text"/);
 assert.doesNotMatch(page,/name="due_date" type="text"/);
});
