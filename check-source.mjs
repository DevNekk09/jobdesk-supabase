import {existsSync,readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
const source=['index.html','frontend/main.tsx','app/page.tsx','app/globals.css','api.ts','server.mjs','lib/database.mjs','supabase/schema.sql','build.mjs'];
const missing=source.filter(name=>!existsSync(join(root,name)));
if(missing.length){console.error('Missing required GitHub source files: '+missing.join(', '));process.exitCode=1;}
else {
 const html=readFileSync(join(root,'index.html'),'utf8');
 if(!html.includes('/frontend/main.tsx')){console.error('index.html missing correct Vite frontend/main.tsx reference.');process.exitCode=1;}
 else console.log('All '+source.length+' Jobdesk source files verified (root Vite entry).');
}
