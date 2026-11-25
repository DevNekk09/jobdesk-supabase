import {readFileSync} from 'node:fs';
export function readGlobalStyles(){
 const entry=new URL('../app/globals.css',import.meta.url);
 const css=readFileSync(entry,'utf8');
 return css.replace(/@import\s+"([^"]+)";/g,(_,path)=>readFileSync(new URL(path,entry),'utf8'));
}
