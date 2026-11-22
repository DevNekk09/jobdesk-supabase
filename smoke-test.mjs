import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import net from 'node:net';
const cwd=fileURLToPath(new URL('../',import.meta.url));
if(!process.env.DATABASE_URL)throw Error('Set DATABASE_URL to a Supabase PostgreSQL connection string before running the live smoke test.');
assert.ok(existsSync(join(cwd,'dist','index.html')),'Run npm run build first.');
assert.ok(existsSync(join(cwd,'api.mjs')),'Run npm run build first.');
const listener=net.createServer();
await new Promise((resolve,reject)=>listener.once('error',reject).listen(0,'127.0.0.1',resolve));
const port=listener.address().port;
await new Promise(resolve=>listener.close(resolve));
const origin=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['server.mjs'],{cwd,env:{...process.env,PORT:String(port),APP_URL:origin},stdio:['ignore','pipe','pipe']});
let logs='';child.stdout.on('data',data=>logs+=data.toString());child.stderr.on('data',data=>logs+=data.toString());
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
 let health;const start=Date.now();
 while(Date.now()-start<20000){
  if(child.exitCode!==null)throw Error('Node backend exited: '+logs);
  try{health=await fetch(origin+'/api/health',{signal:AbortSignal.timeout(1200)});break;}catch{await sleep(200)}
 }
 assert.ok(health,'Server not responding: '+logs);
 assert.equal(health.status,200,await health.text().catch(()=>''));
 assert.deepEqual(await (await fetch(origin+'/api/health')).json(),{ok:true,app:'Jobdesk'});
 const r=await fetch(origin+'/api/bootstrap',{signal:AbortSignal.timeout(12000)});
 if(r.status!==200)throw Error('Bootstrap failed: '+r.status+' '+await r.text()+'\n'+logs);
 assert.match(r.headers.get('content-type')||'',/application\/json/);
 const result=await r.json();
 for(const field of ['users','jobs','spaces','activity','devices'])assert.ok(Array.isArray(result[field]),'Missing '+field);
 const page=await fetch(origin+'/');assert.equal(page.status,200);assert.match(await page.text(),/Jobdesk/i);
 console.log('PASS: Supabase-backed GET /api/health, GET /api/bootstrap and homepage.');
}finally{child.kill('SIGTERM');await Promise.race([new Promise(resolve=>child.once('exit',resolve)),sleep(3000)]);if(child.exitCode===null)child.kill('SIGKILL')}
