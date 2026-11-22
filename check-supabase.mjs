import {env,closeDatabase} from '../lib/database.mjs';
try{
 const tables=['users','job_spaces','jobs','activity','device_profiles'];
 for(const table of tables){
  const result=await env.DB.prepare(`SELECT COUNT(*)::int AS count FROM jobdesk.${table}`).first();
  console.log(`${table}: ${result.count} records`);
 }
 console.log('Supabase PostgreSQL connected. Schema present.');
}finally{await closeDatabase();}
