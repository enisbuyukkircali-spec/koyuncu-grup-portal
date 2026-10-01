export const engagementPermissions=['suggestions.view_own','suggestions.create','suggestions.manage','notifications.view_own'];
export const suggestionStatuses:Record<string,string>={SUBMITTED:'Gönderildi',REVIEW:'İnceleniyor',WAITING:'Yanıt Bekliyor',ANSWERED:'Yanıtlandı',CLOSED:'Kapatıldı',REJECTED:'Reddedildi'};
export const suggestionEvents:Record<string,string>={created:'Kayıt oluşturuldu',assigned:'Sorumlu atandı',responded:'Yetkili yanıtı eklendi',status:'Durum değiştirildi'};
export const notificationTypes=['ANNOUNCEMENT','REQUEST','APPROVAL','LEAVE','INVENTORY','EVENT','SUGGESTION','SYSTEM'] as const;
export function internalNotificationLink(link:string){return /^\/(?:notifications|training|tasks|approvals|my-assets|meeting-rooms\/my-reservations)$/.test(link)||/^\/(?:admin\/)?(?:requests|leave|suggestions|surveys)\/[a-f0-9-]{36}$/i.test(link)||/^\/(?:announcements|events|news)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(link);}
export type NotificationRow={id:string;type:string;title:string;message:string;link:string;is_read:boolean;created_at:string};
export type SuggestionSummary={id:string;number:number;subject:string;status:string;created_at:string;type_name:string;group_name:string};
export type EngagementSummary={unread:number;suggestions:SuggestionSummary[];suggestion_count:number;notice_count:number};
export const emptyEngagement:EngagementSummary={unread:0,suggestions:[],suggestion_count:0,notice_count:0};
