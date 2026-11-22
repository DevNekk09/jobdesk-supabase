// Server-side only: PostgreSQL queries are never accessible directly to the browser.
import postgres from 'npm:postgres@3.4.7';
import {sqlForPg} from './sql.mjs';
const url=Deno.env.get('SUPABASE_DB_URL')||Deno.env.get('DATABASE_URL');
if(!url)throw new Error('SUPABASE_DB_URL is unavailable inside Supabase Edge Functions');
const pool=postgres(url,{max:2,prepare:false,connect_timeout:10,idle_timeout:20});
class Statement{
 constructor(sql,args=[],conn=pool){this.sql=sql;this.args=args;this.conn=conn;}
 bind(...args){return new Statement(this.sql,args,this.conn)}
 async query(){return await this.conn.unsafe(sqlForPg(this.sql),this.args)}
 async first(){return (await this.query())[0]||null}
 async all(){return {results:await this.query()}}
 async run(){const rows=await this.query();return {meta:{changes:rows.count||0,last_row_id:Number(rows[0]?.id||0)}}}
}
const prepare=(sql,conn=pool)=>new Statement(sql,[],conn);
const DB={
 prepare,
 async transaction(fn){return await pool.begin(async tx=>await fn({prepare:(sql)=>prepare(sql,tx)}))},
 async batch(statements){return await this.transaction(async tx=>{
  const results=[];for(const statement of statements)results.push(await tx.prepare(statement.sql).bind(...statement.args).run());return results;
 })}
};
export const env={DB,EDGE_TRUSTED_ACCESS:true};
