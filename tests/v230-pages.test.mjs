import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('V2.3 has one branch-based GitHub Pages publisher and fresh compiled asset URLs',()=>{
 const workflow=read('.github/workflows/deploy-pages.yml');
 const html=read('index.html');
 assert.match(workflow,/git push origin HEAD:main/);
 assert.match(workflow,/group: jobdesk-precompiled-assets/);
 assert.doesNotMatch(workflow,/uses: actions\/deploy-pages@/);
 assert.match(html,/jobdesk-compiled\.js\?v=230/);
 assert.match(html,/jobdesk-compiled\.css\?v=230/);
 assert.match(html,/src="\/frontend\/main\.tsx"/);
});
