import {randomUUID} from 'node:crypto';
import {database} from './db';
export interface ProviderResult<T>{data:T;ttlMs?:number}
interface Row<T>{payload:T|null;fetched_at:Date|null;fresh_until:Date;retry_at:Date;lease_until:Date}
export interface CachedResult<T>{data:T|null;stale:boolean}
const pending=new Map<string,Promise<CachedResult<unknown>>>();
export function providerCache<T>(key:string,ttlMs:number,load:(previous:T|null)=>Promise<ProviderResult<T>>):Promise<CachedResult<T>>{
 const active=pending.get(key);if(active)return active as Promise<CachedResult<T>>;
 const work=read<T>(key,ttlMs,load).finally(()=>pending.delete(key));pending.set(key,work);return work;
}
async function read<T>(key:string,ttlMs:number,load:(previous:T|null)=>Promise<ProviderResult<T>>):Promise<CachedResult<T>>{
 let prior:T|null=null;
 try{
  const db=database();const row=(await db.query<Row<T>>('SELECT payload,fetched_at,fresh_until,retry_at,lease_until FROM dashboard_data_cache WHERE cache_key=$1',[key])).rows[0];prior=row?.payload??null;
  if(row&&new Date(row.fresh_until).getTime()>Date.now())return {data:prior,stale:false};
  if(row&&(new Date(row.retry_at).getTime()>Date.now()||new Date(row.lease_until).getTime()>Date.now()))return {data:prior,stale:true};
  const owner=randomUUID();const claim=await db.query(`INSERT INTO dashboard_data_cache(cache_key,lease_owner,lease_until) VALUES($1,$2,now()+interval '20 seconds') ON CONFLICT(cache_key) DO UPDATE SET lease_owner=$2,lease_until=now()+interval '20 seconds' WHERE dashboard_data_cache.fresh_until<=now() AND dashboard_data_cache.retry_at<=now() AND dashboard_data_cache.lease_until<=now() RETURNING payload`,[key,owner]);
  if(!claim.rows.length){const latest=(await db.query<Row<T>>('SELECT payload FROM dashboard_data_cache WHERE cache_key=$1',[key])).rows[0];return {data:latest?.payload??prior,stale:true};}
  try{
   const result=await load(prior);const ttl=Math.max(ttlMs,result.ttlMs||0);
   await db.query(`UPDATE dashboard_data_cache SET payload=$3::jsonb,fetched_at=now(),fresh_until=now()+($4::double precision*interval '1 millisecond'),retry_at='-infinity',lease_until='-infinity',lease_owner=NULL WHERE cache_key=$1 AND lease_owner=$2`,[key,owner,JSON.stringify(result.data),ttl]);
   return {data:result.data,stale:false};
  }catch{
   await db.query(`UPDATE dashboard_data_cache SET retry_at=now()+interval '5 minutes',lease_until='-infinity',lease_owner=NULL WHERE cache_key=$1 AND lease_owner=$2`,[key,owner]);
   return {data:prior,stale:true};
  }
 }catch{return {data:prior,stale:true};}
}
