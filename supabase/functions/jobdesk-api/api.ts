import { env } from './lib/database.mjs';
export const dynamic='force-dynamic';
type Row=Record<string,any>;
const roles=['Admin','Sales','Designer','Print'];
const statuses=['Awaiting Sales','Ready for Print File','Preparing Print File','Ready to Print','Printing','Completed','On Hold','Cancelled'];
const production=['Review Files','Printing','Cutting','Sewing','Packing','Ready to Collect'];
const workflow=['Confirmed','Preparing Master Files','Master Files Ready','Prepare Set Files','Set Files - Ready to Print'];
function stage(j:Row){const old:Record<string,string>={'Ready for Print File':'Confirmed','Preparing Print File':'Preparing Master Files','Ready to Print':'Set Files - Ready to Print','Printing':'Set Files - Ready to Print'};return old[j.status]||j.status}
const now=()=>new Date().toISOString();
function fail(message:string,status=400):never{throw Object.assign(new Error(message),{status})}
function str(v:any,label:string,max=200,required=false){if(typeof v!=='string'||v.length>max||(required&&!v.trim()))fail(`${label} is required and must be under ${max} characters.`);return v.trim()}
function email(v:any){const x=str(v,'Email',254,true).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x))fail('Enter a valid email address.');return x}
function date(v:any,label:string){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)fail(`Choose a valid ${label}.`);return v}
function safe(u:Row){return{id:u.id,name:u.name,email:'',role:u.role,active:!!u.active}}
function role(u:Row,allowed:string[]){if(!allowed.includes(u.role))fail('Your role cannot perform this action.',403)}
function json(data:any,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
function link(v:any,label:string){const x=str(v||'',label,2000);if(x&&!/^https?:\/\//i.test(x))fail(`${label} must start with https:// or http://.`);return x}
async function data(req:Request){const raw=await req.text();if(new TextEncoder().encode(raw).length>65536)fail('Request too large.',413);try{const b=JSON.parse(raw||'{}');if(!b||typeof b!=='object'||Array.isArray(b))fail('Invalid JSON.');return b}catch{fail('Invalid JSON.')}}
const selectJob=`SELECT j.*,s.name AS space_name,COALESCE(j.space_id,(SELECT id FROM job_spaces WHERE owner_user_id=j.assigned_to ORDER BY sort_order,id LIMIT 1)) AS resolved_space_id,u.name AS assigned_name,c.name AS created_name,f.name AS confirmed_name FROM jobs j LEFT JOIN job_spaces s ON s.id=j.space_id LEFT JOIN users u ON u.id=j.assigned_to JOIN users c ON c.id=j.created_by LEFT JOIN users f ON f.id=j.confirmed_by`;
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32))).map(v=>v.toString(16).padStart(2,'0')).join('');
function testJson(req:Request,body:unknown,csrf:string){return Response.json(body,{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Set-Cookie':`jobdesk_test_csrf=${csrf}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${new URL(req.url).protocol==='https:'?'; Secure':''}`}})}
async function handler(req:Request){try{
 const db=env.DB;if(!db)fail('The workspace database is unavailable.',503);
 const path=new URL(req.url).pathname,method=req.method;
 if(path==='/api/health')return json({ok:true,app:'Jobdesk'});
 // Shared test workspace. Cookie guards cross-site writes; this is NOT authentication.
 if(path.startsWith('/api/access'))fail('Endpoint not found.',404);
 const cookieToken=(req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('jobdesk_test_csrf='))?.slice(18)||'';
 const csrf=/^[a-f0-9]{64}$/.test(cookieToken)?cookieToken:random();
 if(method!=='GET'&&method!=='HEAD'&&!env.EDGE_TRUSTED_ACCESS){
  if(req.headers.get('origin')!==new URL(req.url).origin)fail('Request origin is not allowed.',403);
  if(!cookieToken||req.headers.get('x-csrf-token')!==cookieToken||cookieToken!==csrf)fail('Workspace check failed. Reload and try again.',403);
 }
 await db.prepare("INSERT INTO users(user_id,name,email,role,active,created_at) VALUES(NULL,'Admin','shared-team@system.invalid','Admin',1,?) ON CONFLICT (email) DO NOTHING").bind(now()).run();
 const shared=(await db.prepare("SELECT * FROM users WHERE email='shared-team@system.invalid'").first<Row>())!;
 const actorId=Number(env.EDGE_TRUSTED_ACCESS===true?req.headers.get('x-edge-staff-user')||'0':'0');
 const assigned:Row=Number.isSafeInteger(actorId)&&actorId>0?(await db.prepare("SELECT * FROM users WHERE id=? AND active=1 AND deleted_at IS NULL AND email!='shared-team@system.invalid' AND role IN ('Designer','Print','Sales')").bind(actorId).first<Row>()||shared):shared;
 const isAdmin=env.EDGE_TRUSTED_ACCESS===true&&req.headers.get('x-edge-admin-verified')==='1';
 const acting:Row=isAdmin?shared:assigned;
 const u:Row=isAdmin?{...shared,name:'Admin',role:'Admin'}:assigned.id===shared.id?{...shared,name:'Guest',role:'Viewer'}:assigned;
 // Device IDs are browser-generated random UUIDs, not hardware fingerprints.
 const deviceId=req.headers.get('x-jobdesk-device')||'';
 const validDevice=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deviceId);

 if(path==='/api/session'&&method==='GET')return testJson(req,{me:safe(u),csrf,hosted:true,open_test:true},csrf);
 if(path==='/api/bootstrap'&&method==='GET'){
  // Filter large job sets on the server while preserving the complete month dropdown.
  const requestedMonth=new URL(req.url).searchParams.get('month')||'all';
  if(requestedMonth!=='all'&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth))fail('Invalid month filter.');
  const nextMonth=requestedMonth==='all'?'':(()=>{
   const [year,month]=requestedMonth.split('-').map(Number);
   return month===12?String(year+1)+'-01-01':year+'-'+String(month+1).padStart(2,'0')+'-01';
  })();
  const jobQuery=requestedMonth==='all'?db.prepare(selectJob+' ORDER BY j.due_date,j.id'):
   db.prepare(selectJob+' WHERE j.due_date>=? AND j.due_date<? ORDER BY j.due_date,j.id').bind(requestedMonth+'-01',nextMonth);
  // No demo jobs, users, or workspace seeds.
  if(validDevice&&acting.id!==shared.id)await db.prepare('UPDATE device_profiles SET last_seen=? WHERE device_key=? AND user_id=?').bind(now(),deviceId,acting.id).run();
  const [users,jobs,activity,spaces,devices,months]=await Promise.all([
   db.prepare("SELECT * FROM users WHERE deleted_at IS NULL AND email!='shared-team@system.invalid' ORDER BY active DESC,name").all<Row>(),
   jobQuery.all(),
   db.prepare('SELECT a.*,u.name AS user_name,j.name AS job_name FROM activity a JOIN users u ON u.id=a.user_id LEFT JOIN jobs j ON j.id=a.job_id ORDER BY a.id DESC LIMIT 100').all(),
   db.prepare('SELECT * FROM job_spaces ORDER BY sort_order,id').all(),
   db.prepare("SELECT d.device_key,d.device_label,d.user_id,d.last_seen,u.name AS user_name FROM device_profiles d JOIN users u ON u.id=d.user_id WHERE u.deleted_at IS NULL ORDER BY d.last_seen DESC LIMIT 100").all(),
   db.prepare('SELECT DISTINCT LEFT(due_date,7) AS month FROM jobs ORDER BY month DESC').all()
  ]);
  return testJson(req,{me:safe(u),csrf,users:users.results.map(safe),jobs:jobs.results,activity:activity.results,spaces:spaces.results,devices:devices.results,available_months:months.results.map(row=>row.month),device_key:validDevice?deviceId:'',hosted:true,open_test:true},csrf);
 }
 if(path==='/api/device/clear'&&method==='POST'){
  role(u,['Admin','Designer','Print','Sales']);
  if(!validDevice)fail('This browser needs a valid device ID.',400);
  await db.prepare('DELETE FROM device_profiles WHERE device_key=?').bind(deviceId).run();
  return json({ok:true});
 }
 if(path==='/api/device'&&method==='POST'){
  role(u,['Admin','Designer','Print','Sales']);
  if(!validDevice)fail('This browser needs a valid device ID.',400);
  const b=await data(req),label=str(b.label,'Device name',60,true);
  const member=await db.prepare("SELECT id FROM users WHERE id=? AND active=1 AND deleted_at IS NULL AND email!='shared-team@system.invalid'").bind(Number(b.user_id)).first<Row>();
  if(!member)fail('Choose an active member before saving this device.',400);
  if(u.role!=='Admin'&&Number(member.id)!==Number(u.id))fail('Your device can only be linked to your verified member profile.',403);
  await db.prepare('INSERT INTO device_profiles(device_key,device_label,user_id,last_seen,created_at) VALUES(?,?,?,?,?) ON CONFLICT(device_key) DO UPDATE SET device_label=excluded.device_label,user_id=excluded.user_id,last_seen=excluded.last_seen').bind(deviceId,label,member.id,now(),now()).run();
  return json({ok:true});
 }
 const log=(job:number|null,action:string)=>db.prepare('INSERT INTO activity(job_id,user_id,action,created_at) VALUES(?,?,?,?)').bind(job,acting.id,action,now());
 if(path==='/api/users'&&method==='POST'){
  role(u,['Admin']);const b=await data(req),n=str(b.name,'Name',100,true);if(!['Designer','Print'].includes(b.role||'Designer'))fail('Choose Designer or Production.');
  if(await db.prepare('SELECT id FROM users WHERE lower(name)=lower(?) AND deleted_at IS NULL').bind(n).first())fail('A member with that name already exists.',409);
  const chosen=b.space_id?await db.prepare('SELECT * FROM job_spaces WHERE id=? AND owner_user_id IS NULL').bind(Number(b.space_id)).first<Row>():await db.prepare('SELECT * FROM job_spaces WHERE lower(name)=lower(?) AND owner_user_id IS NULL').bind(n).first<Row>();if(b.space_id&&!chosen)fail('That Jobdesk is already linked or unavailable.');
  if(!chosen&&await db.prepare('SELECT id FROM job_spaces WHERE lower(name)=lower(?)').bind(n).first())fail('A Jobdesk with that name already exists. Choose it or use a different member name.',409);
  const key='profile-'+crypto.randomUUID()+'@profiles.invalid';
  const result=await db.batch([db.prepare('INSERT INTO users(name,email,role,created_at) VALUES(?,?,?,?) RETURNING id').bind(n,key,b.role||'Designer',now()),...(b.role==='Print'?[]:chosen?[db.prepare('UPDATE job_spaces SET owner_user_id=(SELECT id FROM users WHERE email=?) WHERE id=?').bind(key,chosen.id)]:[db.prepare('INSERT INTO job_spaces(name,owner_user_id,sort_order,created_at) VALUES(?,(SELECT id FROM users WHERE email=?),(SELECT COALESCE(MAX(sort_order),0)+1 FROM job_spaces),?)').bind(n,key,now())]),log(null,`Added member ${n} and shared Jobdesk`)]);
  return json({user:safe((await db.prepare('SELECT * FROM users WHERE id=?').bind(result[0].meta.last_row_id).first<Row>())!)},201);
 }
 if(path==='/api/spaces'&&method==='POST'){role(u,['Admin']);const b=await data(req);await db.batch([db.prepare('INSERT INTO job_spaces(name,sort_order,created_at) VALUES(?,(SELECT COALESCE(MAX(sort_order),0)+1 FROM job_spaces),?)').bind(str(b.name,'Space name',100,true),now()),log(null,'Added Jobdesk space')]);return json({ok:true},201)}
 const sm=path.match(/^\/api\/spaces\/(\d+)(?:\/(delete))?$/);
 if(sm&&['POST','PATCH'].includes(method)){role(u,['Admin']);const id=Number(sm[1]);const target=await db.prepare('SELECT * FROM job_spaces WHERE id=?').bind(id).first<Row>();if(!target)fail('Space not found.',404);const b=await data(req);if(sm[2]==='delete'){await db.batch([db.prepare('UPDATE jobs SET space_id=NULL,assigned_to=NULL,version=version+1 WHERE space_id=? OR (space_id IS NULL AND assigned_to=?)').bind(id,target.owner_user_id),db.prepare('DELETE FROM job_spaces WHERE id=?').bind(id),log(null,`Removed ${target.name}’s Jobdesk; jobs retained in All jobs`)]);}else await db.batch([db.prepare('UPDATE job_spaces SET name=? WHERE id=?').bind(str(b.name,'Space name',100,true),id),log(null,`Renamed ${target.name}’s Jobdesk`)]);return json({ok:true})}
 const ud=path.match(/^\/api\/users\/(\d+)\/delete$/);
 if(ud&&method==='POST'){role(u,['Admin']);const id=Number(ud[1]);const target=await db.prepare('SELECT * FROM users WHERE id=?').bind(id).first<Row>();if(!target)fail('User not found.',404);if(id===u.id)fail('This shared workspace profile is reserved.');await db.batch([db.prepare('UPDATE users SET active=0,deleted_at=? WHERE id=?').bind(now(),id),db.prepare('UPDATE job_spaces SET owner_user_id=NULL WHERE owner_user_id=?').bind(id),db.prepare('DELETE FROM device_profiles WHERE user_id=?').bind(id),log(null,`Removed user ${target.name}; job history retained`)]);return json({ok:true})}
 const um=path.match(/^\/api\/users\/(\d+)$/);
 if(um&&method==='PATCH'){
  role(u,['Admin']);const id=Number(um[1]),b=await data(req),target=await db.prepare('SELECT * FROM users WHERE id=?').bind(id).first<Row>();if(!target)fail('User not found.',404);
  const r=b.role||target.role;if(!['Designer','Print','Admin'].includes(r))fail('Choose a valid role.');if(r==='Admin')fail('Admin permissions are reserved for a verified PIN session.',403);if(b.active!==undefined&&typeof b.active!=='boolean')fail('Active must be true or false.');const active=b.active===undefined?target.active:Number(b.active);
  if(id===u.id)fail('This shared workspace profile is reserved.');
  if(b.space_id){const chosen=await db.prepare('SELECT * FROM job_spaces WHERE id=?').bind(Number(b.space_id)).first<Row>();if(!chosen||(chosen.owner_user_id&&chosen.owner_user_id!==id))fail('That job space is already linked or unavailable.');}
  await db.batch([...(b.space_id!==undefined?[db.prepare('UPDATE job_spaces SET owner_user_id=NULL WHERE owner_user_id=?').bind(id),...(b.space_id?[db.prepare('UPDATE job_spaces SET owner_user_id=? WHERE id=?').bind(id,Number(b.space_id))]:[])]:[]),db.prepare('UPDATE users SET name=?,role=?,active=? WHERE id=?').bind(str(b.name||target.name,'Name',100,true),r,active,id),log(null,`Updated team member ${target.name}`)]);return json({ok:true});
 }
 async function jobData(b:Row){const space=b.space_id?await db!.prepare('SELECT * FROM job_spaces WHERE id=?').bind(Number(b.space_id)).first<Row>():b.space_id===undefined?await db!.prepare('SELECT * FROM job_spaces WHERE owner_user_id=? ORDER BY sort_order,id LIMIT 1').bind(acting.id).first<Row>():null;if(b.space_id&&!space)fail('Job space not found.');const date_in=date(b.date_in,'date in'),due_date=date(b.due_date,'due date');if(due_date<date_in)fail('Due date must be on or after date in.');if(!['Normal','High','Urgent'].includes(b.priority||'Normal'))fail('Choose a valid priority.');const assigned=b.assigned_to===undefined?(space?.owner_user_id||acting.id):b.assigned_to?Number(b.assigned_to):null;if(assigned&&!await db!.prepare('SELECT id FROM users WHERE id=? AND active=1').bind(assigned).first())fail('Assigned staff member is unavailable.');const quantity=Number(b.quantity??1);if(!Number.isInteger(quantity)||quantity<1||quantity>10000000)fail('Quantity must be a whole number between 1 and 10,000,000.');return{space_id:space?.id??null,name:str(b.name,'Job-sheet name',160,true),customer:str(b.customer||'','Customer',160),contact:str(b.contact||'','Contact',120),date_in,due_date,priority:b.priority||'Normal',assigned_to:assigned,quantity,size:str(b.size||'','Size',160),material:str(b.material||'','Material',160),finishing:str(b.finishing||'','Finishing',200),notes:str(b.notes||'','Notes',5000),artwork_url:link(b.artwork_url,'Artwork link')}}
 const getJob=(id:number)=>db.prepare(selectJob+' WHERE j.id=?').bind(id).first<Row>();
 if(path==='/api/jobs'&&method==='POST'){
  role(u,['Admin','Sales','Designer']);const j=await jobData(await data(req)),stamp=now(),year=new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'Asia/Kuala_Lumpur'}).format(new Date());
  const fields=Object.keys(j),vals=Object.values(j);
  const id=await db.transaction(async tx=>{
   const result=await tx.prepare(`INSERT INTO jobs(${fields.join(',')},created_by,created_at,updated_at,invoice_id) VALUES(${fields.map(()=>'?').join(',')},?,?,?,NULL) RETURNING id`).bind(...vals,acting.id,stamp,stamp).first<Row>();
   const jobId=Number(result.id);
   const invoice=`INV-${year}-${String(jobId).padStart(5,'0')}`;
   await tx.prepare('UPDATE jobs SET invoice_id=? WHERE id=?').bind(invoice,jobId).run();
   await tx.prepare("INSERT INTO activity(job_id,user_id,action,created_at) VALUES(?,?,'Created job; awaiting sales confirmation',?)").bind(jobId,acting.id,stamp).run();
   return jobId;
  });
  return json({job:await getJob(id)},201);
 }
 if(path==='/api/trash/clear'&&method==='POST'){
  role(u,['Admin']);
  const body=await data(req);if(body.confirmation!=='CLEAR TRASH'||!Array.isArray(body.jobs)||!body.jobs.length||body.jobs.length>5000)fail('Review the Trash contents and confirm Clear Trash.');
  const snapshot=body.jobs as Row[];if(snapshot.some(x=>!Number.isInteger(x.id)||!Number.isInteger(x.version))||new Set(snapshot.map(x=>x.id)).size!==snapshot.length)fail('Invalid Trash snapshot.');
  await db.transaction(async tx=>{
   const rows=(await tx.prepare("SELECT id,version FROM jobs WHERE status='Deleted' ORDER BY id FOR UPDATE").all<Row>()).results;
   if(rows.length!==snapshot.length||rows.some(x=>!snapshot.some(j=>j.id===x.id&&j.version===x.version)))fail('Trash changed. Review it again before clearing.',409);
   const ids=snapshot.map(x=>Number(x.id));
   await tx.prepare('DELETE FROM activity WHERE job_id=ANY(?::int[])').bind(ids).run();
   const cleared=await tx.prepare("DELETE FROM jobs WHERE id=ANY(?::int[]) AND status='Deleted'").bind(ids).run();
   if(cleared.meta.changes!==snapshot.length)fail('Some reviewed jobs changed. Refresh Trash before continuing.',409);
   await tx.prepare('INSERT INTO activity(job_id,user_id,action,created_at) VALUES(NULL,?,?,?)').bind(acting.id,`Permanently cleared ${snapshot.length} reviewed Trash jobs`,now()).run();
  });
  return json({ok:true});
 }
 const jm=path.match(/^\/api\/jobs\/(\d+)(?:\/(confirm|status|comment|file|complete|reopen|priority|progress|space|delete|restore|unconfirm|production|purge))?$/);
 if(jm){const id=Number(jm[1]),action=jm[2],j=await getJob(id);if(!j)fail('Job not found.',404);
  if(method==='GET'){const a=await db.prepare('SELECT a.*,u.name AS user_name FROM activity a JOIN users u ON u.id=a.user_id WHERE job_id=? ORDER BY a.id DESC').bind(id).all();return json({job:j,activity:a.results})}
  const b=await data(req);
  if(action==='comment'&&method==='POST'){role(u,['Admin','Sales','Designer','Print']);await log(id,'Note: '+str(b.message,'Note',2000,true)).run();return json({ok:true})}
  if(Number(b.version)!==j.version)fail('This job was updated by another staff member. Reopen it and try again.',409);
  if(action==='purge'&&method==='POST'){
   role(u,['Admin']);
   if(j.status!=='Deleted')fail('Only jobs in Trash can be permanently deleted.');if(b.confirmation!=='DELETE JOB')fail('Confirm permanent deletion first.');
   await db.transaction(async tx=>{
    const locked=await tx.prepare("SELECT id FROM jobs WHERE id=? AND version=? AND status='Deleted' FOR UPDATE").bind(id,j.version).first();
    if(!locked)fail('The job changed. Review Trash again.',409);
    await tx.prepare('DELETE FROM activity WHERE job_id=?').bind(id).run();
    const removed=await tx.prepare("DELETE FROM jobs WHERE id=? AND version=? AND status='Deleted'").bind(id,j.version).run();
    if(!removed.meta.changes)fail('The job changed. Review Trash again.',409);
    await tx.prepare('INSERT INTO activity(job_id,user_id,action,created_at) VALUES(NULL,?,?,?)').bind(acting.id,'Permanently deleted a trashed job',now()).run();
   });
   return json({ok:true});
  }
  const update:Row={};let message='';
  if(!action&&method==='PATCH'){
   role(u,['Admin','Sales','Designer']);if(['Completed','Cancelled'].includes(j.status))fail('Reopen this job before editing its details.');
   Object.assign(update,await jobData({...j,...b}));
   const changed=['customer','quantity','size','material','finishing','artwork_url'].some(k=>String(update[k])!==String(j[k]));
   if(j.confirmed_at&&changed){Object.assign(update,{status:'Confirmed',artwork_approved:0,print_checked:0,print_file_url:''});message='Print specifications changed — preparation must be checked again'}else message='Updated job details';
  }else if(action==='confirm'&&method==='POST'){
   role(u,['Admin','Sales','Designer']);if(j.status!=='Awaiting Sales')fail('Only jobs awaiting sales can be confirmed.');Object.assign(update,{status:'Confirmed',confirmed_by:acting.id,confirmed_at:now()});message='Job confirmation recorded — ready to prepare master files';
  }else if(action==='production'&&method==='POST'){
   role(u,['Admin','Designer','Print']);if(['Deleted','Cancelled'].includes(j.status))fail('This job is not available for production.');if(!j.confirmed_at||!(stage(j)==='Set Files - Ready to Print'||j.status==='Completed'))fail('Set files must be ready to print before production.');const at=j.production_status?production.indexOf(j.production_status):-1;if(at===production.length-1)fail('This job is already ready to collect.');const next=production[at+1];if(b.status!==next)fail('Update production one stage at a time.');update.production_status=next;update.production_updated_at=now();message=`Production: ${j.production_status||'Handover'} → ${next}`;
  }else if(action==='delete'&&method==='POST'){role(u,['Admin','Designer','Sales']);if(j.status==='Deleted')fail('Job is already in Trash.');update.status='Deleted';update.deleted_from_status=j.status;message='Moved job to Trash';
  }else if(action==='restore'&&method==='POST'){role(u,['Admin','Designer','Sales']);if(j.status!=='Deleted')fail('Job is not in Trash.');update.status=j.deleted_from_status||'Awaiting Sales';update.deleted_from_status=null;message='Restored job from Trash';
  }else if(action==='unconfirm'&&method==='POST'){role(u,['Admin','Designer','Sales']);if(j.production_status&&j.production_status!=='Review Files')fail('Production has started. Confirmation cannot be cancelled while production is in progress.');if(!j.confirmed_at||['Deleted','Completed','Cancelled'].includes(j.status))fail('Only active confirmed jobs can have confirmation cancelled.');Object.assign(update,{production_status:null,production_updated_at:null,status:'Awaiting Sales',confirmed_at:null,confirmed_by:null,artwork_approved:0,print_checked:0,print_file_url:''});message='Cancelled confirmation — file preparation reset';
  }else if(action==='progress'&&method==='POST'){
   role(u,['Admin','Designer']);if(!j.confirmed_at)fail('Confirm the job before updating file progress.');const current=stage(j),index=workflow.indexOf(current);if(index<0||index===workflow.length-1)fail('This job has no further preparation stage.');const next=workflow[index+1];if(b.status!==next)fail('Update progress one stage at a time.');update.status=next;message=`${current} → ${next}`;
  }else if(action==='space'&&method==='POST'){
   role(u,['Admin','Designer']);const target=await db.prepare('SELECT * FROM job_spaces WHERE id=?').bind(Number(b.space_id)).first<Row>();if(!target)fail('Job space not found.');update.space_id=target.id;if(target.owner_user_id)update.assigned_to=target.owner_user_id;message=`Moved job to ${target.name}’s Jobdesk`;
  }else if(action==='priority'&&method==='POST'){
   role(u,['Admin','Sales','Designer']);if(!['Normal','Urgent'].includes(b.priority))fail('Choose Normal or Urgent.');update.priority=b.priority;message=b.priority==='Urgent'?'Marked job as urgent':'Removed urgent priority';
  }else if(action==='complete'&&method==='POST'){
   role(u,['Admin','Designer']);if(['Completed','Cancelled'].includes(j.status))fail('This job is already closed.');if(!j.confirmed_at)fail('Confirm this job before it can be completed.');if(stage(j)!==workflow[workflow.length-1])fail('Finish master and set file preparation before completing the job.');update.status='Completed';message='Design job completed';
  }else if(action==='reopen'&&method==='POST'){
   role(u,['Admin','Designer']);if(j.status!=='Completed')fail('Only completed jobs can be reopened.');update.status=j.confirmed_at?'Set Files - Ready to Print':'Awaiting Sales';message='Reopened job';
  }else if(action==='file'&&method==='POST'){
   role(u,['Admin','Designer']);if(j.status!=='Preparing Print File')fail('Start print-file preparation before updating the print-file link.');Object.assign(update,{print_file_url:link(b.print_file_url,'Print-file link'),artwork_approved:0,print_checked:0});message='Updated prepared print-file link — approval checks reset';
  }else if(action==='status'&&method==='POST'){
   role(u,['Admin','Sales','Designer','Print']);
   if(workflow.includes(j.status)&&!['On Hold','Cancelled'].includes(b.status))fail('Use the file progress action to update this job.');if(!statuses.includes(b.status))fail('Invalid job status.');for(const key of ['artwork_approved','print_checked'])if(b[key]!==undefined&&typeof b[key]!=='boolean')fail('Checklist values must be true or false.');const next=b.status;
   if(next===j.status)fail('This job is already at this stage.');
   const transitions:Record<string,string[]>={'Ready for Print File':['Preparing Print File'],'Preparing Print File':['Ready to Print'],'Ready to Print':['Printing'],'Printing':['Completed']};
   if(u.role!=='Admin'){
    if(next==='On Hold'){if(['Completed','Cancelled'].includes(j.status))fail('Completed or cancelled jobs cannot be put on hold.');}
    else if(next==='Cancelled'){role(u,['Sales']);if(j.status==='Completed')fail('Ask an admin to reopen this completed job.');}
    else{const permitted=(u.role==='Designer'&&['Preparing Print File','Ready to Print'].includes(next))||(u.role==='Print'&&['Printing','Completed'].includes(next));if(!permitted)fail('Your role cannot move this job to that stage.',403);if(!(transitions[j.status]||[]).includes(next))fail('Follow the workflow stages in order.');}
   }
   if(!j.confirmed_at&&!['Awaiting Sales','On Hold','Cancelled'].includes(next))fail('Sales must confirm this job before print preparation.');
   if(j.confirmed_at&&next==='Awaiting Sales')fail('Sales confirmation is recorded. Use Ready for Print File to restart preparation.');
   const approved=!!(b.artwork_approved??j.artwork_approved),checked=!!(b.print_checked??j.print_checked);
   if(['Ready to Print','Printing','Completed'].includes(next)&&(!approved||!checked))fail('Confirm artwork approval and the print-file check before proceeding.');
   const reason=str(b.reason||'','Reason',500);if(['On Hold','Cancelled'].includes(next)&&!reason)fail('Add a reason for the team.');Object.assign(update,{status:next,artwork_approved:Number(approved),print_checked:Number(checked)});message=`${j.status} → ${next}${reason?': '+reason:''}`;
  }else fail('Action not found.',404);
  update.updated_at=now();const keys=Object.keys(update);
  await db.transaction(async tx=>{
   const result=await tx.prepare(`UPDATE jobs SET ${keys.map(k=>k+'=?').join(',')},version=version+1 WHERE id=? AND version=?`).bind(...Object.values(update),id,j.version).run();
   if(!result.meta.changes)fail('This job was updated by another staff member. Reopen it and try again.',409);
   await tx.prepare('INSERT INTO activity(job_id,user_id,action,created_at) VALUES(?,?,?,?)').bind(id,acting.id,message,update.updated_at).run();
  });
  return json({job:await getJob(id)});
 }
 if(path==='/api/backup'&&method==='GET'){
  role(u,['Admin']);const [users,jobs,activity,spaces]=await Promise.all([db.prepare("SELECT id,name,role,active FROM users WHERE email!='shared-team@system.invalid'").all(),db.prepare('SELECT * FROM jobs').all(),db.prepare('SELECT * FROM activity').all(),db.prepare('SELECT * FROM job_spaces ORDER BY sort_order,id').all()]);return json({format:'jobdesk-records-v2',exported_at:now(),users:users.results,jobs:jobs.results,activity:activity.results,spaces:spaces.results});
 }
 fail('Endpoint not found.',404);
}catch(e:any){const code=e.status||(['23505','23503'].includes(e.code)?409:500);if(code===500)console.error('Workspace error:',e.message);return json({error:code===500?'Something went wrong. Please try again.':code===409&&!e.status?'This value is already used or referenced.':e.message},code)}}
export const GET=handler;export const POST=handler;export const PATCH=handler;
