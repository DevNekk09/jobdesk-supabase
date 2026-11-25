import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const hash=path=>{const b=readFileSync(path);return createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex').slice(0,12)};
const tag='360-'+hash('assets/jobdesk-compiled.js')+'-'+hash('assets/jobdesk-compiled.css');
const path='index.html',html=readFileSync(path,'utf8');
const matches=html.match(/jobdesk-compiled\.(css|js)\?v=[\w-]+(?=')/g)||[];
if(matches.length!==2||!matches.some(x=>x.includes('.js?'))||!matches.some(x=>x.includes('.css?')))throw Error('Expected one JS and one CSS fallback URL');
writeFileSync(path,html.replace(/jobdesk-compiled\.(css|js)\?v=[\w-]+(?=')/g,(_,ext)=>'jobdesk-compiled.'+ext+'?v='+tag));
console.log('Pages asset cache key:',tag);
