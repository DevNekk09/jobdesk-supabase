import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
test('Vite uses committed root index.html with correct frontend script',()=>{
 assert.ok(existsSync(root+'index.html'));
 assert.match(readFileSync(root+'index.html','utf8'),/src="\/frontend\/main\.tsx"/);
 const builder=readFileSync(root+'build.mjs','utf8');
 assert.match(builder,/input:join\(root,'index\.html'\)/);
 assert.match(builder,/outDir:join\(root,'dist'\)/);
});
test('CI checks mandatory GitHub paths',()=>{
 const ci=readFileSync(root+'.github/workflows/verify.yml','utf8');
 assert.match(ci,/npm run verify:source/);
 assert.match(ci,/git ls-files --error-unmatch index.html/);
});
