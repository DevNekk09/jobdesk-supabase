/** Shared search logic for Designer and Production lists. Case-insensitive; no regex. */
export type SearchableJob={
 name:string;invoice_id:string;status?:string;priority?:string;
 assigned_name?:string;space_name?:string;production_status?:string|null;
};
export function matchesJobSearch(job:SearchableJob,query:string,deskName=''):boolean{
 const needle=query.trim().toLocaleLowerCase('en');
 if(!needle)return true;
 const searchable=[
  job.name,job.invoice_id,job.status,job.priority,
  job.assigned_name,job.space_name,job.production_status,deskName
 ].filter(Boolean).join(' ').toLocaleLowerCase('en');
 return searchable.includes(needle);
}
