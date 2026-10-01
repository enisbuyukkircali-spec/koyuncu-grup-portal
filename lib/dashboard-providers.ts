import {FXData,ForecastDay,localDate,weatherGroup,weatherLabels,emptyDashboardData} from './dashboard-data-shared';
import type {ProviderResult} from './dashboard-cache';
export const FX_TTL=60*60*1000,WEATHER_TTL=30*60*1000;
const USER_AGENT='KoyuncuGrupPortal/1.0 (https://koyuncu-grup-portal.vercel.app/; enisbuyukkircali@windycar.com.tr)';
export function parseTCMB(xml:string):FXData{
 const date=xml.match(/<Tarih_Date\b[^>]*\bTarih="(\d{2})\.(\d{2})\.(\d{4})"/);if(!date)throw Error('Invalid TCMB date');
 const asOf=`${date[3]}-${date[2]}-${date[1]}`;if(!Number.isFinite(Date.parse(asOf))||new Date(asOf).toISOString().slice(0,10)!==asOf)throw Error('Invalid date');
 const rates={} as FXData['rates'];for(const currency of ['USD','EUR','GBP'] as const){
  const section=xml.match(new RegExp(`<Currency\\b[^>]*\\bCurrencyCode="${currency}"[^>]*>([\\s\\S]*?)<\\/Currency>`))?.[1];
  const value=section?.match(/<ForexSelling>\s*(\d+(?:\.\d+)?)\s*<\/ForexSelling>/)?.[1],unit=section?.match(/<Unit>\s*(\d+)\s*<\/Unit>/)?.[1];
  if(!value||!unit||Number(value)<=0||Number(unit)<=0)throw Error('Missing TCMB currency');rates[currency]=Number(value)/Number(unit);
 }return {source:'TCMB',asOf,rates};
}
export async function fetchFX():Promise<ProviderResult<FXData>>{const response=await fetch('https://www.tcmb.gov.tr/kurlar/today.xml',{cache:'no-store',signal:AbortSignal.timeout(5000)});if(!response.ok)throw Error('FX unavailable');return {data:parseTCMB(await response.text())};}
// A separate adapter: no licensed/free redistribution feed has been configured.
export async function fetchBIST(){return emptyDashboardData.bist;}
interface Period {summary?:{symbol_code?:string};details?:{air_temperature_min?:number;air_temperature_max?:number}}
export interface METData {properties:{meta:{updated_at:string};timeseries:{time:string;data:{instant:{details:{air_temperature:number}};next_1_hours?:Period;next_6_hours?:Period;next_12_hours?:Period}}[]}}
export interface WeatherPayload {forecast:METData;lastModified:string|null}
export async function fetchWeather(lat:number,lon:number,previous:WeatherPayload|null):Promise<ProviderResult<WeatherPayload>>{
 const response=await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`,{cache:'no-store',headers:{'User-Agent':USER_AGENT,...(previous?.lastModified?{'If-Modified-Since':previous.lastModified}:{})},signal:AbortSignal.timeout(5000)});
 const expires=Date.parse(response.headers.get('expires')||'');const ttlMs=Number.isFinite(expires)?Math.max(WEATHER_TTL,expires-Date.now()):WEATHER_TTL;
 if(response.status===304&&previous)return {data:previous,ttlMs};if(!response.ok)throw Error('Weather unavailable');
 const forecast=await response.json() as METData;
 if(!forecast.properties?.timeseries?.length||!Number.isFinite(Date.parse(forecast.properties.meta?.updated_at)))throw Error('Invalid weather');
 if(!forecast.properties.timeseries.some(s=>Number.isFinite(s.data?.instant?.details?.air_temperature)&&Number.isFinite(Date.parse(s.time))))throw Error('Invalid forecast');
 return {data:{forecast,lastModified:response.headers.get('last-modified')},ttlMs};
}
export function dailyForecast(data:METData,timezone:string,now=new Date()){
 const today=localDate(now,timezone);const end=new Date(today+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+6);const last=end.toISOString().slice(0,10);
 const samples=data.properties.timeseries.filter(s=>Number.isFinite(Date.parse(s.time))&&Number.isFinite(s.data?.instant?.details?.air_temperature)).sort((a,b)=>a.time.localeCompare(b.time));
 const days:ForecastDay[]=[];
 for(let offset=0;offset<7;offset++){
  const date=new Date(today+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+offset);const key=date.toISOString().slice(0,10);if(key>last)continue;
  const group=samples.filter(s=>localDate(new Date(s.time),timezone)===key);if(!group.length)continue;
  // Representative symbol closest to local noon (current day: closest forecast to now).
  const distance=(s:typeof group[number])=>offset===0?Math.abs(Date.parse(s.time)-now.getTime()):Math.abs(Number(new Intl.DateTimeFormat('en-GB',{timeZone:timezone,hour:'2-digit',hour12:false}).format(new Date(s.time)))-12);
  const representative=[...group].filter(s=>s.data.next_1_hours?.summary?.symbol_code||s.data.next_6_hours?.summary?.symbol_code||s.data.next_12_hours?.summary?.symbol_code).sort((a,b)=>distance(a)-distance(b))[0];if(!representative)continue;
  const code=(representative.data.next_1_hours||representative.data.next_6_hours||representative.data.next_12_hours)?.summary?.symbol_code||'unknown';const theme=weatherGroup(code);
  const temperatures=group.map(s=>s.data.instant.details.air_temperature);
  // These are available forecast sample extrema, not observed full-day extremes.
  days.push({date:key,code,group:theme,label:weatherLabels[theme],min:Math.min(...temperatures),max:Math.max(...temperatures),temperature:representative.data.instant.details.air_temperature});
 }
 const nearest=[...samples].sort((a,b)=>Math.abs(Date.parse(a.time)-now.getTime())-Math.abs(Date.parse(b.time)-now.getTime()))[0];
 const current=nearest&&Math.abs(Date.parse(nearest.time)-now.getTime())<=3*60*60*1000?nearest.data.instant.details.air_temperature:null;
 return {days,current,currentAt:nearest?.time||'',updatedAt:data.properties.meta.updated_at};
}
