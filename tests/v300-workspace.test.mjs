import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('V3 feature paths preserve default ticket and month-scoped workspace',()=>{
 const page=read('app/page.tsx');
 assert.match(page,/v==='list'\|\|v==='board'\?v:'ticket'/);
 assert.match(page,/jobdesk-view-v3/);
 assert.match(page,/jobdeskRequest<Data>\('\/api\/bootstrap\?month=all'\)/);
 assert.match(page,/if\(!utility\)return/);
 assert.match(page,/deadline==='tomorrow'&&active\(j\)&&due\(j\)===1/);
 assert.match(page,/productionDeadline==='tomorrow'\?due\(j\)===1/);
});
test('Undo feedback sends captured server version and cannot target another actor',()=>{
 const page=read('app/page.tsx'),api=read('api.ts');
 assert.match(page,/version:job.version,name:job.name,actor,action/);
 assert.match(page,/dataRef.current\?\.me.id!==token.actor/);
 assert.match(page,/token.action,'POST',\{version:token.version\}/);
 assert.match(page,/undoFor\(result.job,'undo-progress',/);
 assert.match(page,/undoFor\(result.job,'undo-production',/);
 assert.equal(api,read('supabase/functions/jobdesk-api/api.ts'));
});
