import {readGlobalStyles} from './read-global-styles.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('file preparation and production progress use stage-specific CSS tokens',()=>{
 const css=readGlobalStyles(),page=read('app/page.tsx');
 for(let i=0;i<6;i++)assert.match(css,new RegExp('\\.progress-color-'+i+'\\{'));
 for(const marker of ['production-colored-progress','production-step-chips','dash-stage-track','progress-awaiting','progress-color-'])assert.ok(page.includes(marker),marker+' in React');
 assert.match(css,/\.job-panel \.status\[class\*="progress-color-"\]/);
 assert.match(css,/\.production-job-panel \.list-tabs button\.selected\[class\*="progress-color-"\]/);
 assert.match(css,/\.workflow-card li\.current\[class\*="progress-color-"\]/);
 assert.match(page,/j\.status!=='Completed'&&j\.confirmed_at/);
});
