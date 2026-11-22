/** Shared Malaysia-local date formatting. Formatters can be cached as this module evolves. */
export const monthLabel=(value:string)=>new Intl.DateTimeFormat('en-MY',{month:'long',year:'numeric',timeZone:'Asia/Kuala_Lumpur'}).format(new Date(value+'-01T12:00:00+08:00'));
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const day=(v:string)=>Math.round(Date.parse(v+'T00:00:00Z')/86400000);
export const due=(j:{due_date:string})=>day(j.due_date)-day(today());
export const add=(n:number)=>new Date((day(today())+n)*86400000).toISOString().slice(0,10);
export const date=(v:string,long=false)=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:long?'long':'short',...(long?{year:'numeric'}:{}),timeZone:'Asia/Kuala_Lumpur'}).format(new Date(v.length===10?v+'T12:00:00+08:00':v));
export const time=(v:string)=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kuala_Lumpur'}).format(new Date(v));
