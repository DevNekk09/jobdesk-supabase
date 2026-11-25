import {readGlobalStyles} from './read-global-styles.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('urgent rules use Malaysia due-day difference and respect completed statuses',()=>{
 const source=src('app/page.tsx');
 const match=source.match(/const isUrgent=\(j:Job\)=>([^;]+);/);
 assert.ok(match,'isUrgent derived job rule must exist');
 const evalUrgent=new Function('j','active','due','return ('+match[1]+');');
 const check=(d,priority='Normal',status='Awaiting Sales')=>
   evalUrgent({priority,status},j=>!['Completed','Cancelled','Deleted'].includes(j.status),()=>d);
 assert.equal(check(0),true,'due today is urgent');
 assert.equal(check(1),true,'due in one day is urgent');
 assert.equal(check(2),true,'due in two days is urgent');
 assert.equal(check(3),false,'exactly three days away is not under three days');
 assert.equal(check(-1),false,'overdue tracked separately');
 assert.equal(check(-1,'Urgent'),true,'explicitly urgent still applies');
 assert.equal(check(10,'Urgent','Completed'),false,'completed jobs are excluded');
});
test('Jobsheet and Urgent cards exist in personal and team views',()=>{
 const page=src('app/page.tsx'),css=readGlobalStyles();
 assert.ok(page.includes("label:'Jobsheet'"));
 assert.ok(page.includes("label:'Urgent jobs'"));
 assert.ok(page.match(/label:'Urgent jobs'/g).length>=2);
 assert.match(page,/urgent=openJobs\.filter\(isUrgent\)/);
 assert.match(page,/deadline==='urgent'&&isUrgent\(j\)/);
 assert.match(page,/isUrgent\(j\)&&<span className="ticket-urgent"[^>]*><Icon name="bolt"\/>/);
 assert.match(css,/\.team-metrics\{grid-template-columns:repeat\(5,/);
 assert.match(css,/\.personal-stats\{grid-template-columns:repeat\(4,/);
});
test('reference dock keeps Overview, Plus and Spaces, with V1.6 admin and brand intact',()=>{
 const page=src('app/page.tsx'),css=readGlobalStyles(),dock=src('app/components/QuickDock.tsx');
 assert.match(dock,/<span>Overview<\/span>/);
 assert.match(dock,/<span>Spaces<\/span>/);
 assert.match(dock,/floating-add/);
 assert.match(css,/V1\.6\.1: screenshot-matched/);
 assert.match(page,/adminUnlock/);
 assert.match(page,/KSL Team Job Management/);
 assert.match(page,/APPLE SPORT SDN BHD/);
});
