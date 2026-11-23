/** SQL compatibility shim for the private Supabase PostgreSQL schema. */
const tableName='(?:users|job_spaces|jobs|activity|device_profiles|staff_sessions|staff_invites)';
const tableRef=new RegExp(`\\b(FROM|JOIN|UPDATE|INTO)\\s+(${tableName})\\b`,'gi');
// SQL is exclusively authored server-side; user values are always bind parameters.
export function sqlForPg(sql){
 let index=0;
 return sql.replace(tableRef,(_m,keyword,name)=>`${keyword} jobdesk.${name}`)
   .replace(/\?/g,()=>`$${++index}`);
}
