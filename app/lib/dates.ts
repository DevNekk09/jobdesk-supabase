/** Reused Malaysia-local formatters avoid repeatedly allocating Intl instances per card. */
const myt='Asia/Kuala_Lumpur';
const dayFormat=new Intl.DateTimeFormat('en-CA',{timeZone:myt,year:'numeric',month:'2-digit',day:'2-digit'});
const dateShort=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',timeZone:myt});
const dateLong=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:myt});
const monthFormat=new Intl.DateTimeFormat('en-MY',{month:'long',year:'numeric',timeZone:myt});
const timeFormat=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:myt});
export const monthLabel=(value:string)=>monthFormat.format(new Date(value+'-01T12:00:00+08:00'));
export const today=()=>dayFormat.format(new Date());
export const day=(value:string)=>Math.round(Date.parse(value+'T00:00:00Z')/86400000);
export const due=(job:{due_date:string})=>day(job.due_date)-day(today());
export const add=(n:number)=>new Date((day(today())+n)*86400000).toISOString().slice(0,10);
export const date=(value:string,long=false)=>(long?dateLong:dateShort).format(new Date(value.length===10?value+'T12:00:00+08:00':value));
export const time=(value:string)=>timeFormat.format(new Date(value));
