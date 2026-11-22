import {build} from 'vite';
import react from '@vitejs/plugin-react';
import ts from 'typescript';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=dirname(fileURLToPath(import.meta.url));
const required=['index.html','frontend/main.tsx','app/page.tsx','app/globals.css','api.ts','server.mjs','lib/database.mjs'];
const missing=required.filter(file=>!existsSync(join(root,file)));
if(missing.length){
  throw new Error('Incomplete GitHub checkout. Missing: '+missing.join(', ')+'\nExtract the complete Jobdesk ZIP and commit all source directories at the repository root.');
}

const pagesMode = process.env.GITHUB_PAGES === 'true';
const pagesRepo = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'jobdesk-supabase';
const publicBase = pagesMode ? `/${pagesRepo}/` : '/';

await build({
  base: publicBase,
  configFile:false,
  root,
  plugins:[react()],
  publicDir:join(root,'public'),
  build:{outDir:join(root,'dist'),emptyOutDir:true,rollupOptions:{input:join(root,'index.html')}}
});
const code=ts.transpileModule(readFileSync(join(root,'api.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
writeFileSync(join(root,'api.mjs'),code);
console.log(`Jobdesk build passed (base: ${publicBase}). The Node.js API still requires a server runtime.`);
