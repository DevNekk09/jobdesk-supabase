/** Malaysia-local date helpers: ISO for storage/comparison, DD/MM/YYYY for UI. */
const myt='Asia/Kuala_Lumpur';
const isoParts=new Intl.DateTimeFormat('en-GB',{timeZone:myt,year:'numeric',month:'2-digit',day:'2-digit'});
const monthFormat=new Intl.DateTimeFormat('en-MY',{month:'long',year:'numeric',timeZone:myt});
const timeClock=new Intl.DateTimeFormat('en-GB',{timeZone:myt,hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const normalizeDate=(value:string)=>new Date(value.length===10?value+'T12:00:00+08:00':value);
export const today=()=>{
 const parts=isoParts.formatToParts(new Date());
 const part=(name:string)=>parts.find(p=>p.type===name)?.value||'';
 return part('year')+'-'+part('month')+'-'+part('day');
};
export const monthLabel=(value:string)=>monthFormat.format(new Date(value+'-01T12:00:00+08:00'));
export const day=(value:string)=>Math.round(Date.parse(value+'T00:00:00Z')/86400000);
export const due=(job:{due_date:string})=>day(job.due_date)-day(today());
export const add=(n:number)=>new Date((day(today())+n)*86400000).toISOString().slice(0,10);
export const date=(value:string,_long=false)=>isoParts.format(normalizeDate(value));
export const time=(value:string)=>date(value)+' '+timeClock.format(normalizeDate(value));
/** Text date inputs accept strict DD/MM/YYYY and preserve ISO storage. */
export const parseDisplayDate=(value:string)=>{
 const match=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
 if(!match)throw Error('Use date format DD/MM/YYYY (e.g. 24/11/2026).');
 const dd=Number(match[1]),mm=Number(match[2]),yyyy=Number(match[3]);
 if(yyyy<1900||yyyy>2100)throw Error('Enter a valid year between 1900 and 2100.');
 const d=new Date(Date.UTC(yyyy,mm-1,dd));
 if(d.getUTCFullYear()!==yyyy||d.getUTCMonth()!==mm-1||d.getUTCDate()!==dd)throw Error('Enter a valid calendar date (DD/MM/YYYY).');
 return String(yyyy).padStart(4,'0')+'-'+String(mm).padStart(2,'0')+'-'+String(dd).padStart(2,'0');
};
