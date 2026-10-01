import provinces from './tr-weather-locations.json';
export interface AssignedLocation {name:string;city:string|null;district:string|null;country:string|null;latitude:string|number|null;longitude:string|number|null;timezone:string|null}
function normalize(value:string|null){return (value||'').trim().toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');}
export function resolveWeatherLocation(location:AssignedLocation){
 let timezone=location.timezone||'Europe/Istanbul';try{new Intl.DateTimeFormat('en',{timeZone:timezone});}catch{timezone='Europe/Istanbul';}
 const lat=Number(location.latitude),lon=Number(location.longitude);
 if(location.latitude!==null&&location.longitude!==null&&location.latitude!==''&&location.longitude!==''&&Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180)return {lat,lon,timezone,resolution:'Lokasyon koordinatları'};
 if(!['tr','tur','turkiye','turkey'].includes(normalize(location.country)))return null;
 const province=provinces.find(p=>normalize(p.name)===normalize(location.city));if(!province)return null;
 const district=province.districts.find(d=>normalize(String(d[0]))===normalize(location.district));
 if(district&&Number.isFinite(Number(district[1]))&&Number.isFinite(Number(district[2])))return {lat:Number(district[1]),lon:Number(district[2]),timezone,resolution:`${district[0]} / ${province.name} · yaklaşık ilçe konumu`};
 return {lat:province.lat,lon:province.lon,timezone,resolution:`${province.name} · yaklaşık il konumu`};
}
