// Detect static-only hosting before attempting to parse an HTML fallback as JSON.
export async function readApiJson<T>(response:Response,path:string):Promise<T>{
 const contentType=(response.headers.get('content-type')||'').toLowerCase();
 if(!contentType.includes('application/json')){
  const kind=contentType.includes('html')?'HTML instead of JSON':'a non-JSON response';
  throw Error(pagesOnly ? 'Supabase Edge Function returned HTML instead of JSON. Check the Jobdesk API deployment in your Supabase dashboard.' : `Jobdesk API ${path} returned ${kind} (HTTP ${response.status}). The Node.js backend may not be running. Check your server configuration and /api/health.`);
 }
 try{return await response.json() as T}catch{throw Error(`Jobdesk API ${path} returned invalid JSON. Check your Node.js runtime logs.`)}
}
export const pagesOnly = typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io');
export const publicBase = import.meta.env.BASE_URL || '/';
const edgeApiBase = pagesOnly ? 'https://vsvlutqagtkdtrowaked.supabase.co/functions/v1/jobdesk-api' : '';
const accessHeaders = () => pagesOnly ? {'x-workspace-token':localStorage.getItem('jobdesk-workspace-token')||'','x-jobdesk-admin-session':sessionStorage.getItem('jobdesk-admin-session')||'','x-jobdesk-staff-session':localStorage.getItem('jobdesk-staff-session')||''} : {};
const apiUrl = (path:string) => edgeApiBase + path;
function deviceHeaders(){
 let key=localStorage.getItem('jobdesk-device-id');
 if(!key||!/^[0-9a-f-]{36}$/i.test(key)){key=crypto.randomUUID?.()||'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const n=crypto.getRandomValues(new Uint8Array(1))[0]%16;return (c==='x'?n:(n&3|8)).toString(16)});localStorage.setItem('jobdesk-device-id',key)}
 return {'X-Jobdesk-Device':key,'X-Jobdesk-Actor':localStorage.getItem('jobdesk-device-user')||''};
}

export async function jobdeskRequest<T>(path:string,method='GET',body?:unknown,csrf=''):Promise<T>{
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),25000);
 try{
  const response=await fetch(apiUrl(path),{
   method,
   cache:method==='GET'?'no-store':'default',
   signal:controller.signal,
   headers:{'Content-Type':'application/json','X-CSRF-Token':csrf,...deviceHeaders(),...accessHeaders()},
   ...(body!==undefined?{body:JSON.stringify(body)}:{})
  });
  const payload=await readApiJson<T & {error?:string}>(response,path);
  if(!response.ok)throw Error(payload.error||`Jobdesk API returned HTTP ${response.status}.`);
  return payload;
 }catch(e){
  if(controller.signal.aborted)throw Error('Network request timed out. Please retry.');
  throw e;
 }finally{clearTimeout(timeout)}
}
