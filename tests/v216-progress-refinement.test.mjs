import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../app/globals.css',import.meta.url),'utf8');
test('stage colors retain six distinct gentle palettes for desktop and mobile',()=>{
 const area=css.slice(css.indexOf('/* V2.1.4'),css.indexOf('/* V2.1.5'));
 const colors=[...area.matchAll(/\.progress-color-\d+\{--progress-ink:(#[0-9a-f]{6})/g)].map(m=>m[1]);
 assert.equal(colors.length,6);
 assert.equal(new Set(colors).size,6);
 assert.match(area,/border:1px solid var\(--progress-line\);font-weight:500/);
 assert.match(area,/border-top:1px solid var\(--progress-line\)/);
 assert.match(area,/box-shadow:none/);
 assert.doesNotMatch(area,/border-top:3px solid/);
 assert.match(css,/@media\(max-width:700px\)\{\s*\.job-panel \.status\[class\*="progress-color-"\]/);
 assert.match(css,/background:color-mix\(in srgb,var\(--progress-ink\) 62%,white\)/);
});
