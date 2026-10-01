import type {BrentData} from './dashboard-data-shared';
import type {ProviderResult} from './dashboard-cache';
export const BRENT_TTL=60*60*1000;
export const BRENT_SOURCE_URL='https://www.eia.gov/dnav/pet/hist/RBRTED.htm';
const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function parseBrent(html:string):BrentData{
 if(!/Europe Brent Spot Price FOB/i.test(html)||!/Dollars per Barrel/i.test(html))throw Error('Wrong Brent series');
 let latest:BrentData|null=null;
 for(const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
  const cells=[...match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(m=>m[1].replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').trim());
  if(cells.length!==6)continue;
  const week=cells[0].match(/^(\d{4})\s+([A-Za-z]{3})-\s*(\d{1,2})\s+to\s+/);if(!week)continue;
  const month=months.indexOf(week[2]);if(month<0)continue;
  const monday=new Date(Date.UTC(Number(week[1]),month,Number(week[3])));
  if(monday.getUTCDay()!==1||monday.getUTCMonth()!==month)continue;
  for(let i=1;i<=5;i++){
   if(!/^\d+(?:\.\d+)?$/.test(cells[i]))continue;const value=Number(cells[i]);if(!Number.isFinite(value)||value<=0)continue;
   const day=new Date(monday);day.setUTCDate(day.getUTCDate()+i-1);const asOf=day.toISOString().slice(0,10);
   if(!latest||asOf>latest.asOf)latest={source:'U.S. EIA',value,asOf,unit:'USD/varil'};
  }
 }
 if(!latest)throw Error('Brent unavailable');return latest;
}
export async function fetchBrent():Promise<ProviderResult<BrentData>>{
 const response=await fetch(BRENT_SOURCE_URL,{cache:'no-store',signal:AbortSignal.timeout(6000)});
 if(!response.ok)throw Error('Brent unavailable');return {data:parseBrent(await response.text())};
}
