import {readGlobalStyles} from './read-global-styles.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('drag and keyboard reordering are fully removed from Designer sidebar',()=>{
 const page=read('app/page.tsx');
 const css=readGlobalStyles();
 const icon=read('app/components/Icon.tsx');
 for(const keyword of ['desk-drag-grip','onPointerDown','onPointerMove','onPointerCancel','aria-keyshortcuts','shiftSidebarDesk','changeSidebarOrder','dragDeskRef','designer-reorder-nav'])assert.doesNotMatch(page,new RegExp(keyword));
 assert.doesNotMatch(css,/desk-drag-grip|dragging-desk|designer-reorder-nav/);
 assert.doesNotMatch(icon,/^ grip:/m);
 assert.match(page,/setRecentDeskId\(id\)/);
 assert.match(page,/const designerSidebarSpaces=designerSpaces\.slice\(\)\.sort/);
 assert.match(page,/className="space-nav designer-space-nav"/);
});
test('responsive containers support mobile, tablet and desktop without changing job functionality',()=>{
 const css=readGlobalStyles();
 assert.match(css,/@media\(max-width:390px\)/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/@media\(max-width:900px\)/);
 assert.match(css,/@media\(min-width:901px\) and \(max-width:1199px\)/);
 assert.match(css,/\.app-main\{width:100%;margin-left:0\}/);
 assert.match(css,/\.team-dashboard-grid\{grid-template-columns:minmax\(0,1fr\)\}/);
 assert.match(css,/\.sidebar-bottom\{max-height:45dvh\}/);
 assert.match(read('app/page.tsx'),/sidebar-production-shortcut/);
});
