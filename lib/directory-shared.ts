export const directoryPermissions=['directory.view','directory.view_contact_details','absence.view_basic','absence.view_leave_type'];
export const ownDirectoryPermissions=directoryPermissions.filter(p=>p!=='absence.view_leave_type');
export type Person={id:string;name:string;photo:string|null;job_title:string|null;department:string|null;company:string|null;location:string|null;unit:string|null;email?:string;phone?:string;extension?:string;manager?:{id:string;name:string}|null;absence?:{until:string;return_date:string;backup:{id:string;name:string;job_title:string|null}|null;leave_type?:string;from?:string}|null};
export type DirectoryData={rows:Person[];total:number;page:number;size:number};
export type Birthday={id:string;name:string;photo:string|null;job_title:string|null;day:number;month:number;days_away:number};
export type SearchRow={id:string;title:string;link:string};
export type SearchGroup={kind:string;label:string;rows:SearchRow[]};
export function foldText(value:string){return value.replace(/[ÇĞİIÖŞÜçğıöşü]/g,c=>({'Ç':'c','Ğ':'g','İ':'i','I':'i','Ö':'o','Ş':'s','Ü':'u','ç':'c','ğ':'g','ı':'i','ö':'o','ş':'s','ü':'u'}[c]!)).toLowerCase();}
export function shortDate(v:string){const [y,m,d]=v.split('-');return `${Number(d)} ${new Date(Date.UTC(2000,Number(m)-1,1)).toLocaleDateString('tr-TR',{month:'long',timeZone:'UTC'})}`;}
