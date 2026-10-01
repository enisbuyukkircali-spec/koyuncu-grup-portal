'use client';
import {useEffect,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight,MapPin,Sun,CloudSun,Cloud,CloudFog,CloudDrizzle,CloudRain,CloudRainWind,CloudSnow,CloudLightning} from 'lucide-react';
import {clockText,DashboardData,emptyDashboardData,localDate,slideIndex,swipeDelta} from '@/lib/dashboard-data-shared';
// Memory only, scoped to the current actor; never persisted or shared across users.
let snapshot:{user:string;at:number;data:DashboardData}|undefined;
let pending:{user:string;promise:Promise<DashboardData>}|undefined;
async function load(user:string){
 if(snapshot?.user===user&&Date.now()-snapshot.at<300000)return snapshot.data;
 if(pending?.user===user)return pending.promise;
 if(snapshot?.user!==user)snapshot=undefined;
 const promise=fetch('/api/dashboard-data?timezone='+encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone),{cache:'no-store',credentials:'same-origin'}).then(async response=>{
  if(!response.ok){snapshot=undefined;return emptyDashboardData;}
  const data=await response.json() as DashboardData;snapshot={user,at:Date.now(),data};return data;
 }).catch(()=>snapshot?.user===user?{...snapshot.data,fxStale:true,brentStale:true,weather:snapshot.data.weather?{...snapshot.data.weather,stale:true}:null}:emptyDashboardData).finally(()=>{if(pending?.promise===promise)pending=undefined;});
 pending={user,promise};return promise;
}
type DashboardViewData=DashboardData&{loading?:boolean};
export function useDashboardData(user:string){
 const [data,setData]=useState<DashboardViewData>({...emptyDashboardData,loading:true,weatherMessage:'Hava durumu yükleniyor…'});
 useEffect(()=>{let active=true;const refresh=()=>{if(document.visibilityState==='visible')void load(user).then(value=>{if(active)setData(value);});};refresh();const timer=setInterval(refresh,300000);document.addEventListener('visibilitychange',refresh);return ()=>{active=false;clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};},[user]);
 return data;
}
export function LiveClock(){
 const [now,setNow]=useState<Date|null>(null);
 useEffect(()=>{const update=()=>setNow(new Date());update();const timer=setInterval(update,1000);return ()=>clearInterval(timer);},[]);
 const value=now?clockText(now):null;
 return <div className="header-date live-clock"><span>{value?.date||'Güncel tarih'}</span><strong>{value?.time||'--:--'}</strong></div>;
}
const money=new Intl.NumberFormat('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:4});
export function MarketStrip({data}:{data:DashboardViewData}){
 const tooltip=data.fx?`Kaynak: TCMB · Gösterge niteliğinde döviz satış kuru (günlük) · Kur tarihi: ${data.fx.asOf}${data.fxStale?' · Son başarılı veri':''}`:data.loading?'Piyasa verileri yükleniyor…':'TCMB verisi şu anda alınamadı';
 return <div className="market-strip" aria-label="Piyasa bilgileri">{(['USD','EUR','GBP'] as const).map(code=><div key={code} title={tooltip} tabIndex={0}><span>{code}</span><b>{data.fx?money.format(data.fx.rates[code])+' ₺':'--'}</b></div>)}<div title={data.brent?`Kaynak: U.S. EIA · Brent petrol, USD/varil · Günlük veri, anlık değil · Fiyat tarihi: ${data.brent.asOf}${data.brentStale?' · Son başarılı veri':''}`:data.loading?'Piyasa verileri yükleniyor…':'Petrol verisi şu anda alınamadı'} tabIndex={0}><span>Petrol <small>günlük</small></span><b>{data.brent?money.format(data.brent.value)+' $':'--'}</b></div></div>;
}
const icons={clear:Sun,'partly-cloudy':CloudSun,overcast:Cloud,fog:CloudFog,drizzle:CloudDrizzle,rain:CloudRain,'heavy-rain':CloudRainWind,snow:CloudSnow,storm:CloudLightning,unknown:Cloud};
export function WeatherCard({data}:{data:DashboardViewData}){
 const [index,setIndex]=useState(0);const touch=useRef<{x:number;y:number}|null>(null);const weather=data.weather;
 const today=weather?localDate(new Date(),weather.timezone):'';
 const days=weather?.days.filter(d=>d.date>=today)||[];const selected=Math.min(index,Math.max(0,days.length-1));const day=days[selected];
 const move=(delta:number)=>setIndex(slideIndex(selected,delta,days.length));
 if(!weather||!day)return <section className="weather live-weather weather-unavailable" aria-label="Hava durumu"><Cloud size={26}/><p>{data.weatherMessage||'Hava durumu bilgisi alınamadı'}</p></section>;
 const Icon=icons[day.group];const isToday=day.date===today;
 const label=isToday?'Bugün':new Intl.DateTimeFormat('tr-TR',{weekday:'long',timeZone:'UTC'}).format(new Date(day.date+'T12:00:00Z'));
 const temperature=isToday?weather.current:day.temperature;
 const tooltip=`${weather.resolution} · MET Norway · Güncelleme: ${new Date(weather.updatedAt).toLocaleString('tr-TR',{timeZone:weather.timezone})} · Sıcaklıklar model tahmini; min/max mevcut tahmin örneklerinden. ${weather.stale?'Son başarılı veri.':''}`;
 return <section className={`weather live-weather weather-${day.group}`} aria-label="7 günlük hava tahmini" aria-roledescription="karusel" title={tooltip} onTouchStart={event=>{touch.current={x:event.touches[0].clientX,y:event.touches[0].clientY};}} onTouchEnd={event=>{if(touch.current){move(swipeDelta(touch.current.x,touch.current.y,event.changedTouches[0].clientX,event.changedTouches[0].clientY));touch.current=null;}}} onTouchCancel={()=>{touch.current=null;}}>
  <div className="weather-location"><MapPin size={11}/>{weather.resolution.includes('yaklaşık il')?<a href="https://github.com/open-admin-data/turkey-administrative-divisions" target="_blank" rel="noreferrer" title={`${weather.resolution} · Konum: Open Admin Data, CC BY 4.0 (ad/koordinat özeti)`}>{weather.location}</a>:<span>{weather.location}</span>}</div>
  <div className="weather-nav"><button onClick={()=>move(-1)} disabled={selected===0} aria-label="Önceki hava tahmini"><ChevronLeft size={14}/></button><time dateTime={day.date}>{label}</time><button onClick={()=>move(1)} disabled={selected===days.length-1} aria-label="Sonraki hava tahmini"><ChevronRight size={14}/></button></div>
  <div className="weather-slide" aria-live="polite" aria-label={`${label}, ${day.label}`}><strong><Icon size={29}/>{temperature===null?'--':Math.round(temperature)}°</strong><span>{day.label}</span><small>↑ {Math.round(day.max)}° / ↓ {Math.round(day.min)}°</small></div>
  <div className="weather-source"><a href="https://api.met.no/doc/License" target="_blank" rel="noreferrer" title={tooltip}>MET Norway · {weather.stale?'eski veri':'tahmin'}</a><span>{selected+1}/{days.length}</span></div>
 </section>;
}
