// Custom workspace-link authentication for the PIN-free testing period.
// The access token is checked against a SHA-256 hash stored in private PostgreSQL.
import {GET,POST,PATCH} from './api.ts';
import {env} from './lib/database.mjs';
const allowedOrigins=new Set(['https://devnekk09.github.io','http://localhost:5173','http://localhost:4173']);
const baseHeaders={'Access-Control-Allow-Headers':'content-type,x-workspace-token,x-jobdesk-device,x-jobdesk-actor,x-jobdesk-admin-session,x-jobdesk-staff-session,x-csrf-token','Access-Control-Allow-Methods':'GET,POST,PATCH,OPTIONS','Access-Control-Max-Age':'600','Vary':'Origin'};
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
  // Secure staff onboarding uses a one-time invite, not a user-supplied actor ID.
  if(apiPath==='/api/staff/invite'&&request.method==='POST'){
   if(!adminValid)return respond({error:'Admin session required to issue staff invitations.'},403,origin);
   const body=await request.json().catch(()=>({}));
   const userId=Number(body?.user_id);
   if(!Number.isSafeInteger(userId)||userId<=0)return respond({error:'Choose a valid staff member.'},400,origin);
   const member=await env.DB.prepare("SELECT id,name,role FROM jobdesk.users WHERE id=? AND active=1 AND deleted_at IS NULL AND role IN ('Designer','Print','Sales')").bind(userId).first();
   if(!member)return respond({error:'Staff member is inactive or unavailable.'},404,origin);
   const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
   const tokenHash=await sessionHash(token);
   await env.DB.transaction(async tx=>{
    await tx.prepare("UPDATE jobdesk.staff_invites SET redeemed_at=now() WHERE user_id=? AND redeemed_at IS NULL").bind(userId).run();
    await tx.prepare("INSERT INTO jobdesk.staff_invites(token_hash,user_id,expires_at) VALUES(?,?,now()+interval '24 hours')").bind(tokenHash,userId).run();
   });
   return respond({ok:true,invite:token,user_id:userId,user_name:member.name,expires_in:86400},200,origin);
  }
  if(apiPath==='/api/staff/redeem'&&request.method==='POST'){
   if(!validDevice)return respond({error:'Device identity is required.'},400,origin);
   const body=await request.json().catch(()=>({}));
   const token=String(body?.token||'');
   if(!/^[a-f0-9]{64}$/.test(token))return respond({error:'Invalid staff invitation link.'},400,origin);
   const nextSession=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
   const nextHash=await sessionHash(nextSession);
   const accepted=await env.DB.transaction(async tx=>{
    const row=await tx.prepare("UPDATE jobdesk.staff_invites SET redeemed_at=now() WHERE token_hash=? AND redeemed_at IS NULL AND expires_at>now() RETURNING user_id").bind(await sessionHash(token)).first();
    if(!row)return null;
    const member=await tx.prepare("SELECT id,name,role FROM jobdesk.users WHERE id=? AND active=1 AND deleted_at IS NULL AND role IN ('Designer','Print','Sales')").bind(row.user_id).first();
    if(!member)return null;
    await tx.prepare("INSERT INTO jobdesk.staff_sessions(token_hash,user_id,device_key,expires_at) VALUES(?,?,?,now()+interval '30 days')").bind(nextHash,member.id,device).run();
    return member;
   });
   if(!accepted)return respond({error:'This invitation has expired or was already used. Ask Admin for a new link.'},403,origin);
   return respond({ok:true,session:nextSession,user_id:accepted.id,user_name:accepted.name,role:accepted.role,expires_in:2592000},200,origin);
  }
  if(apiPath==='/api/staff/logout'&&request.method==='POST'){
   const raw=request.headers.get('x-jobdesk-staff-session')||'';
   if(validDevice&&/^[a-f0-9]{64}$/.test(raw))await env.DB.prepare("UPDATE jobdesk.staff_sessions SET revoked_at=now() WHERE token_hash=? AND device_key=?").bind(await sessionHash(raw),device).run();
   return respond({ok:true},200,origin);
  }
  if(apiPath==='/api/staff/revoke'&&request.method==='POST'){
   if(!adminValid)return respond({error:'Admin session required.'},403,origin);
   const body=await request.json().catch(()=>({}));
   const userId=Number(body?.user_id);
   if(!Number.isSafeInteger(userId)||userId<=0)return respond({error:'Invalid staff member.'},400,origin);
   await env.DB.transaction(async tx=>{
    await tx.prepare("UPDATE jobdesk.staff_sessions SET revoked_at=now() WHERE user_id=? AND revoked_at IS NULL").bind(userId).run();
    await tx.prepare("UPDATE jobdesk.staff_invites SET redeemed_at=now() WHERE user_id=? AND redeemed_at IS NULL").bind(userId).run();
   });
   return respond({ok:true},200,origin);
  }
  const staffToken=request.headers.get('x-jobdesk-staff-session')||'';
  const staffRecord=/^[a-f0-9]{64}$/.test(staffToken)&&validDevice
   ?await env.DB.prepare("SELECT ss.user_id FROM jobdesk.staff_sessions ss JOIN jobdesk.users u ON u.id=ss.user_id WHERE ss.token_hash=? AND ss.device_key=? AND ss.revoked_at IS NULL AND ss.expires_at>now() AND u.active=1 AND u.deleted_at IS NULL AND u.role IN ('Designer','Print','Sales')").bind(await sessionHash(staffToken),device).first()
   :null;

  if(!apiPath.startsWith('/api/'))return respond({error:'API endpoint not found'},404,origin);
  const verifiedHeaders=new Headers(request.headers);
  verifiedHeaders.delete('x-edge-admin-verified');
  verifiedHeaders.delete('x-edge-staff-user');
  if(staffRecord)verifiedHeaders.set('x-edge-staff-user',String(staffRecord.user_id));
  if(adminValid)verifiedHeaders.set('x-edge-admin-verified','1');
  const endpoint=new URL(apiPath,request.url);
  endpoint.search=new URL(request.url).search;
  const adapted=new Request(endpoint,{method:request.method,headers:verifiedHeaders,...(request.method==='GET'?{}:{body:await request.text()})});
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
