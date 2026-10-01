export type WeatherGroup='clear'|'partly-cloudy'|'overcast'|'fog'|'drizzle'|'rain'|'heavy-rain'|'snow'|'storm'|'unknown';
export interface ForecastDay {date:string;code:string;group:WeatherGroup;label:string;min:number;max:number;temperature:number}
export interface FXData {source:'TCMB';asOf:string;rates:Record<'USD'|'EUR'|'GBP',number>}
export interface WeatherData {location:string;resolution:string;timezone:string;updatedAt:string;currentAt:string;current:number|null;days:ForecastDay[];stale:boolean}
export interface DashboardData {fx:FXData|null;fxStale:boolean;bist:{value:null;reason:string};weather:WeatherData|null;weatherMessage:string}
export const emptyDashboardData:DashboardData={fx:null,fxStale:false,bist:{value:null,reason:'Ücretsiz ve yeniden yayınlama izni doğrulanmış kaynak bağlı değil.'},weather:null,weatherMessage:'Hava durumu bilgisi alınamadı'};
export function localDate(date:Date,timezone:string){return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function clockText(now:Date,timezone?:string){return {date:new Intl.DateTimeFormat('tr-TR',{timeZone:timezone,day:'numeric',month:'long',year:'numeric',weekday:'long'}).format(now),time:new Intl.DateTimeFormat('tr-TR',{timeZone:timezone,hour:'2-digit',minute:'2-digit',hour12:false}).format(now)};}
export function slideIndex(index:number,delta:number,count:number){return count?Math.max(0,Math.min(count-1,index+delta)):0;}
export function swipeDelta(startX:number,startY:number,endX:number,endY:number){const dx=endX-startX;return Math.abs(dx)>30&&Math.abs(dx)>Math.abs(endY-startY)?(dx<0?1:-1):0;}
// Exact MET Norway symbol codes, not translated description matching.
const groups:Record<string,WeatherGroup>={clearsky:'clear',fair:'partly-cloudy',partlycloudy:'partly-cloudy',cloudy:'overcast',fog:'fog',lightrain:'drizzle',lightrainshowers:'drizzle',rain:'rain',rainshowers:'rain',heavyrain:'heavy-rain',heavyrainshowers:'heavy-rain'};
for(const code of ['lightsnow','snow','heavysnow','lightsnowshowers','snowshowers','heavysnowshowers','lightsleet','sleet','heavysleet','lightsleetshowers','sleetshowers','heavysleetshowers'])groups[code]='snow';
for(const code of ['lightrainandthunder','rainandthunder','heavyrainandthunder','lightrainshowersandthunder','rainshowersandthunder','heavyrainshowersandthunder','lightsleetandthunder','sleetandthunder','heavysleetandthunder','lightssleetshowersandthunder','sleetshowersandthunder','heavysleetshowersandthunder','lightsnowandthunder','snowandthunder','heavysnowandthunder','lightssnowshowersandthunder','snowshowersandthunder','heavysnowshowersandthunder'])groups[code]='storm';
export const weatherLabels:Record<WeatherGroup,string>={clear:'Açık', 'partly-cloudy':'Parçalı bulutlu',overcast:'Kapalı',fog:'Sisli',drizzle:'Hafif yağmur',rain:'Yağmurlu','heavy-rain':'Yoğun yağmur',snow:'Kar / sulu kar',storm:'Fırtına',unknown:'Tahmin'};
export function weatherGroup(code:string):WeatherGroup{return groups[code.replace(/_(day|night|polartwilight)$/,'')]||'unknown';}
