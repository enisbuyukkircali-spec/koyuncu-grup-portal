export interface IPWeatherLocation {name:string;lat:number;lon:number;timezone:string;resolution:string}
export function ipWeatherLocation(headers:Headers,requestedTimezone?:string|null):IPWeatherLocation|null{
 const latitude=headers.get('x-vercel-ip-latitude'),longitude=headers.get('x-vercel-ip-longitude');
 if(!latitude?.trim()||!longitude?.trim())return null;
 const lat=Number(latitude),lon=Number(longitude);
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return null;
 let city=headers.get('x-vercel-ip-city')||'';try{city=decodeURIComponent(city);}catch{city='';}
 const country=headers.get('x-vercel-ip-country')||'';
 let timezone=country==='TR'?'Europe/Istanbul':'UTC';
 if(requestedTimezone&&requestedTimezone.length<80){try{new Intl.DateTimeFormat('en',{timeZone:requestedTimezone});timezone=requestedTimezone;}catch{/* retain safe default */}}
 // City-level GeoIP only. Never store or forward the raw client IP.
 return {name:city.trim().slice(0,100)||country||'Yaklaşık konum',lat:Math.round(lat*100)/100,lon:Math.round(lon*100)/100,timezone,resolution:'IP üzerinden yaklaşık şehir konumu · VPN/operatör nedeniyle farklı görünebilir'};
}
