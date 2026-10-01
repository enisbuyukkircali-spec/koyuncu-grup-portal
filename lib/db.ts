import { Pool } from 'pg';
import {trace,queryName} from './perf';
const seen=new WeakSet<object>();
export interface DB { query<T = Record<string, unknown>>(text: string, values?: unknown[]): Promise<{rows:T[]}> }
let pool: Pool | undefined;
let testDB: DB | undefined;
export function injectTestDB(db:DB){if(process.env.NODE_ENV!=='test')throw Error('Test only');testDB=db;}
export function database(): DB {
 if(testDB)return testDB;
 if(!process.env.DATABASE_URL)throw new Error('DATABASE_NOT_CONFIGURED');
 if(!pool)pool=new Pool({connectionString:process.env.DATABASE_URL,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:10000});
 if(!trace())return pool as DB;
 return {async query<T>(sql:string,values?:unknown[]){const t=trace()!,start=performance.now();const client=await pool!.connect();const acquired=performance.now(),fresh=!seen.has(client);seen.add(client);try{return await client.query(sql,values) as unknown as {rows:T[]};}finally{t.queries.push({name:queryName(sql),acquire:acquired-start,query:performance.now()-acquired,fresh,sql,values});client.release();}}};
}
export async function transaction<T>(fn:(db:DB)=>Promise<T>):Promise<T>{
 if(testDB){await testDB.query('BEGIN');try{const value=await fn(testDB);await testDB.query('COMMIT');return value;}catch(e){await testDB.query('ROLLBACK');throw e;}}
 database();const client=await pool!.connect();try{await client.query('BEGIN');const value=await fn(client as DB);await client.query('COMMIT');return value;}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}
export async function lock(db:DB){await db.query('SELECT id FROM app_lock WHERE id=1 FOR UPDATE');}
