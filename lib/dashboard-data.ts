import {database} from './db';
import {providerCache} from './dashboard-cache';
import {dailyForecast,fetchBIST,fetchFX,fetchWeather,FX_TTL,WEATHER_TTL,WeatherPayload} from './dashboard-providers';
import {AssignedLocation,resolveWeatherLocation} from './weather-location';
import {DashboardData,emptyDashboardData} from './dashboard-data-shared';
export async function dashboardData(userId:string):Promise<DashboardData>{
 const weatherTask=async()=>{
  try{
   const location=(await database().query<AssignedLocation>(`SELECT l.name,l.city,l.district,l.country,l.latitude,l.longitude,l.timezone FROM users u JOIN locations l ON l.id=u.location_id WHERE u.id=$1 AND l.active=true AND l.archived_at IS NULL`,[userId])).rows[0];
   if(!location)return {weather:null,weatherMessage:'Kullanıcınıza aktif bir lokasyon atanmalı.'};
   const coordinates=resolveWeatherLocation(location);if(!coordinates)return {weather:null,weatherMessage:'Lokasyonun il/ilçe veya koordinat bilgisini tamamlayın.'};
   const {lat,lon,timezone,resolution}=coordinates;
   const cached=await providerCache<WeatherPayload>(`met:v1:${lat.toFixed(4)}:${lon.toFixed(4)}`,WEATHER_TTL,previous=>fetchWeather(lat,lon,previous));
   if(!cached.data)return {weather:null,weatherMessage:'Hava durumu bilgisi alınamadı'};
   const forecast=dailyForecast(cached.data.forecast,timezone);
   if(!forecast.days.length)return {weather:null,weatherMessage:'Hava durumu bilgisi alınamadı'};
   return {weather:{...forecast,location:location.name,resolution,timezone,stale:cached.stale},weatherMessage:''};
  }catch{return {weather:null,weatherMessage:'Hava durumu bilgisi alınamadı'};}
 };
 const [fx,bist,weather]=await Promise.all([providerCache('tcmb:v1',FX_TTL,fetchFX),fetchBIST().catch(()=>emptyDashboardData.bist),weatherTask()]);
 return {fx:fx.data,fxStale:fx.stale,bist,...weather};
}
