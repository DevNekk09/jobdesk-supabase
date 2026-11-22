// Custom workspace-link authentication for the PIN-free testing period.
// The access token is checked against a SHA-256 hash stored in private PostgreSQL.
import {GET,POST,PATCH} from './api.ts';
import {env} from './lib/database.mjs';
const allowedOrigins=new Set(['https://devnekk09.github.io','http://localhost:5173','http://localhost:4173']);
const baseHeaders={'Access-Control-Allow-Headers':'content-type,x-workspace-token,x-jobdesk-device,x-jobdesk-actor,x-jobdesk-admin-session,x-csrf-token','Access-Control-Allow-Methods':'GET,POST,PATCH,OPTIONS','Access-Control-Max-Age':'600','Vary':'Origin'};
function cors(origin:string|null){return {...baseHeaders,...(origin&&allowedOrigins.has(origin)?{'Access-Control-Allow-Origin':origin}:{})}}
function respond(payload:unknown,status:number,origin:string|null){return new Response(JSON.stringify(payload),{status,headers:{...cors(origin),'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
Deno.serve(async request=>{
 const origin=request.headers.get('origin');
 if(request.method==='OPTIONS')return new Response(null,{status:allowedOrigins.has(origin||'')?204:403,headers:cors(origin)});
 if(origin&&!allowedOrigins.has(origin))return respond({error:'Origin not permitted'},403,origin);
 if(!['GET','POST','PATCH'].includes(request.method))return respond({error:'Method not allowed'},405,origin);
 const value=request.headers.get('x-workspace-token')||'';
 if(!/^[A-Za-z0-9_-]{40,128}$/.test(value))return respond({error:'Workspace invitation link required.'},401,origin);
 try{
  const buffer=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  const hash=Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join('');
  const access=await env.DB.prepare('SELECT token_hash FROM jobdesk.workspace_access WHERE token_hash=? AND revoked_at IS NULL').bind(hash).first();
  if(!access)return respond({error:'Invalid or revoked workspace invitation link.'},403,origin);
  const device=request.headers.get('x-jobdesk-device')||'';
  const sessionToken=request.headers.get('x-jobdesk-admin-session')||'';
  const validDevice=/^[0-9a-f-]{36}$/i.test(device);
  const sessionHash=async(token:string)=>{
   const raw=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
   return [...new Uint8Array(raw)].map(x=>x.toString(16).padStart(2,'0')).join('');
  };
  const adminHash=/^[a-f0-9]{64}$/i.test(sessionToken)?await sessionHash(sessionToken):'';
  const path=new URL(request.url).pathname;
  const apiPath=path.includes('/jobdesk-api/')?path.slice(path.indexOf('/jobdesk-api/')+'/jobdesk-api'.length):path;
  if(apiPath==='/api/admin/unlock'&&request.method==='POST'){
   if(!validDevice)return respond({error:'Device identity is required.'},400,origin);
   const body=await request.json().catch(()=>({}));
   const pin=String(body?.pin||'');
   if(!/^[0-9]{6}$/.test(pin))return respond({error:'Enter the six-digit Admin PIN.'},400,origin);
   const auth=await env.DB.prepare('SELECT extensions.crypt(?, pin_hash)=pin_hash AS valid,failed_attempts,locked_until FROM jobdesk.admin_auth WHERE id=true').bind(pin).first();
   if(!auth)return respond({error:'Admin PIN has not been configured.'},503,origin);
   if(auth.locked_until&&Date.parse(auth.locked_until)>Date.now())return respond({error:'Too many attempts. Admin unlock is temporarily locked for 15 minutes.'},429,origin);
   if(!auth.valid){
    await env.DB.prepare("UPDATE jobdesk.admin_auth SET failed_attempts=failed_attempts+1,locked_until=CASE WHEN failed_attempts+1>=5 THEN now()+interval '15 minutes' ELSE NULL END,updated_at=now() WHERE id=true").run();
    return respond({error:'Incorrect Admin PIN.'},401,origin);
   }
   await env.DB.prepare('UPDATE jobdesk.admin_auth SET failed_attempts=0,locked_until=NULL,updated_at=now() WHERE id=true').run();
   const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
   await env.DB.prepare("INSERT INTO jobdesk.admin_sessions(token_hash,device_key,expires_at) VALUES(?,?,now()+interval '8 hours')").bind(await sessionHash(token),device).run();
   return respond({ok:true,session:token,expires_in:28800,role:'Admin'},200,origin);
  }
  if(apiPath==='/api/admin/lock'&&request.method==='POST'){
   if(adminHash&&validDevice)await env.DB.prepare('DELETE FROM jobdesk.admin_sessions WHERE token_hash=? AND device_key=?').bind(adminHash,device).run();
   return respond({ok:true},200,origin);
  }
  const adminValid=!!adminHash&&validDevice&&!!(await env.DB.prepare('SELECT token_hash FROM jobdesk.admin_sessions WHERE token_hash=? AND device_key=? AND expires_at>now()').bind(adminHash,device).first());
  if(!apiPath.startsWith('/api/'))return respond({error:'API endpoint not found'},404,origin);
  const verifiedHeaders=new Headers(request.headers);
  verifiedHeaders.delete('x-edge-admin-verified');
  if(adminValid)verifiedHeaders.set('x-edge-admin-verified','1');
  const adapted=new Request(new URL(apiPath,request.url),{method:request.method,headers:verifiedHeaders,...(request.method==='GET'?{}:{body:await request.text()})});
  const handler=request.method==='GET'?GET:request.method==='POST'?POST:PATCH;
  const response=await handler(adapted);
  const headers=new Headers(response.headers);
  for(const [key,val] of Object.entries(cors(origin)))headers.set(key,val);
  headers.delete('set-cookie');
  return new Response(response.body,{status:response.status,headers});
 }catch(e){
  console.error('Jobdesk edge failure:',e instanceof Error?e.message:String(e));
  return respond({error:'Workspace backend unavailable. Check Supabase Edge Function logs.'},503,origin);
 }
});
