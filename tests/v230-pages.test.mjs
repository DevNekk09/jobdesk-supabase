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
 const jsVersion=html.match(/jobdesk-compiled\.js\?v=([\w-]+)/)?.[1];
 const cssVersion=html.match(/jobdesk-compiled\.css\?v=([\w-]+)/)?.[1];
 assert.ok(jsVersion&&jsVersion!=='230','Use a release-specific cache key');
 assert.equal(jsVersion,cssVersion,'Compiled CSS and JS must use the same cache key');
 assert.match(html,/src="\/frontend\/main\.tsx"/);
});
