// Custom workspace-link authentication for the PIN-free testing period.
// The access token is checked against a SHA-256 hash stored in private PostgreSQL.
import {GET,POST,PATCH} from './api.ts';
import {env} from './lib/database.mjs';
const allowedOrigins=new Set(['https://devnekk09.github.io','http://localhost:5173','http://localhost:4173']);
const baseHeaders={'Access-Control-Allow-Headers':'content-type,x-workspace-token,x-jobdesk-device,x-jobdesk-actor,x-csrf-token','Access-Control-Allow-Methods':'GET,POST,PATCH,OPTIONS','Access-Control-Max-Age':'600','Vary':'Origin'};
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
  const path=new URL(request.url).pathname;
  const apiPath=path.includes('/jobdesk-api/')?path.slice(path.indexOf('/jobdesk-api/')+'/jobdesk-api'.length):path;
  if(!apiPath.startsWith('/api/'))return respond({error:'API endpoint not found'},404,origin);
  const adapted=new Request(new URL(apiPath,request.url),{method:request.method,headers:request.headers,...(request.method==='GET'?{}:{body:await request.text()})});
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
