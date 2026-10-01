export const meetingPermissions=['calendar.view_own','meeting_rooms.view','meeting_rooms.manage','meeting_reservations.view_own','meeting_reservations.create','meeting_reservations.edit_own','meeting_reservations.cancel_own','meeting_reservations.manage'];
export const ownMeetingPermissions=meetingPermissions.filter(p=>!p.endsWith('.manage'));
export const roomFeatures=['TV / Ekran','Projeksiyon','Teams / Video Konferans','Whiteboard','Telefon','Diğer'];
export const reservationStatuses:Record<string,string>={ACTIVE:'Aktif',CANCELLED:'İptal Edildi',COMPLETED:'Tamamlandı'};
export type AgendaItem={id:string;kind:'MEETING'|'EVENT'|'LEAVE';title:string;start_at:string;end_at:string;venue:string;link:string;start_date?:string;end_date?:string;part?:string};
export type AgendaData={date:string;timezone:string;rows:AgendaItem[]};
export function dateInZone(value:Date|string,timezone='Europe/Istanbul'){return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));}
export function localTime(value:string,timezone:string){return new Date(value).toLocaleTimeString('tr-TR',{timeZone:timezone,hour:'2-digit',minute:'2-digit'});}
export function agendaForDay(rows:AgendaItem[],day:string,timezone:string){return rows.filter(r=>r.kind==='LEAVE'?r.start_date!<=day&&r.end_date!>=day:dateInZone(r.start_at,timezone)<=day&&dateInZone(new Date(new Date(r.end_at).getTime()-1),timezone)>=day);}
