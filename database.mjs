/**
 * Server-only Supabase Postgres adapter. No Supabase secrets reach React.
 * Names are mapped into private jobdesk schema, outside the public Data API.
 * Intentionally no SQLite fallback or example data seeding.
 */
import pg from 'pg';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {sqlForPg} from './sql.mjs';

const connectionString=process.env.DATABASE_URL;
if(!connectionString)throw Error('DATABASE_URL is required. Set your Supabase PostgreSQL connection string in Hostinger environment variables.');
const url=new URL(connectionString);
if(!['postgresql:','postgres:'].includes(url.protocol))throw Error('DATABASE_URL must use postgresql:// or postgres://.');
if(!url.hostname)throw Error('DATABASE_URL has no database hostname.');

const pool=new pg.Pool({
 connectionString,
 max:Math.min(10,Math.max(1,Number(process.env.PG_POOL_MAX)||5)),
 idleTimeoutMillis:30000,
 connectionTimeoutMillis:10000,
 application_name:'jobdesk',
});
pool.on('error',error=>console.error('PostgreSQL idle connection error:',error.message));

class Statement{
 constructor(sql,args=[],client=null){this.sql=sql;this.args=args;this.client=client;}
 bind(...args){return new Statement(this.sql,args,this.client);}
 async query(){return (this.client||pool).query(sqlForPg(this.sql),this.args);}
 async first(){return (await this.query()).rows[0]||null;}
 async all(){return {results:(await this.query()).rows};}
 async run(){const result=await this.query();return {meta:{changes:result.rowCount||0,last_row_id:Number(result.rows[0]?.id||0)}};}
}
const prepare=(sql,client=null)=>new Statement(sql,[],client);
export const env={DB:{
 prepare,
 async batch(statements){
  return this.transaction(async tx=>{
    const results=[];
    for(const statement of statements)results.push(await prepare(statement.sql,tx.client).bind(...statement.args).run());
    return results;
  });
 },
 async transaction(fn){
  const client=await pool.connect();
  try{
   await client.query('BEGIN');
   const tx={client,prepare:(sql)=>prepare(sql,client)};
   const result=await fn(tx);
   await client.query('COMMIT');
   return result;
  }catch(e){
   try{await client.query('ROLLBACK');}catch{}
   throw e;
  }finally{client.release();}
 },
}};

// Initialization is an idempotent DDL migration, serialized for first deploys.
const schema=readFileSync(fileURLToPath(new URL('../supabase/schema.sql',import.meta.url)),'utf8')
  .replace(/^\s*BEGIN;\s*$/mi,'').replace(/^\s*COMMIT;\s*$/mi,'');
const bootstrapClient=await pool.connect();
let bootstrapError;
try{
 await bootstrapClient.query('BEGIN');
 await bootstrapClient.query('SELECT pg_advisory_xact_lock(147003, 140000)');
 await bootstrapClient.query(schema);
 await bootstrapClient.query('COMMIT');
}catch(error){
 try{await bootstrapClient.query('ROLLBACK');}catch{}
 bootstrapError=error;
}finally{bootstrapClient.release();}
if(bootstrapError){await pool.end();throw bootstrapError;}
export async function closeDatabase(){await pool.end();}
