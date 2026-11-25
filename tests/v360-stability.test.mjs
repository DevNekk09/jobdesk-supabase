import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Undo requires the exact expected next version and status',async()=>{
 const js=ts.transpileModule(read('app/lib/workspace-stability.ts'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 const {validUndoResult,newerRecord}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
 const before={id:7,version:4,status:'Confirmed'};
 assert.equal(validUndoResult(before,{...before,version:5,status:'Preparing Master Files'},'undo-progress','Preparing Master Files'),true);
 assert.equal(validUndoResult(before,{...before,version:6,status:'Preparing Master Files'},'undo-progress','Preparing Master Files'),false);
 assert.equal(validUndoResult(before,{...before,version:5,status:'Master Files Ready'},'undo-progress','Preparing Master Files'),false);
 assert.equal(validUndoResult(before,{...before,id:8,version:5,status:'Preparing Master Files'},'undo-progress','Preparing Master Files'),false);
 assert.equal(validUndoResult(before,{...before,version:5,production_status:'Printing'},'undo-production','Printing'),true);
 assert.equal(newerRecord(before,{...before,version:3}),before);
});
test('V3.6 publication gates and immutable backend contract',()=>{
 const workflow=read('.github/workflows/deploy-pages.yml');
 assert.ok(workflow.indexOf('npm run test:e2e')<workflow.indexOf('git push origin HEAD:main'));
 assert.equal(read('api.ts'),read('supabase/functions/jobdesk-api/api.ts'));
 const page=read('app/page.tsx');
 assert.match(page,/function closeDetails\(\)\{\+\+openSequence.current/);
 assert.match(page,/function focusDeadline\(d:Deadline\)\{setMonth\('all'\)/);
});
