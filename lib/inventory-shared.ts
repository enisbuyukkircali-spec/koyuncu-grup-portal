export const inventoryPermissions=['inventory.view','inventory.create','inventory.edit','inventory.manage','inventory_categories.view','inventory_categories.manage','assignments.view','assignments.create','assignments.return','assignments.manage'];
export const statusLabels:Record<string,string>={STOCK:'Stokta',ASSIGNED:'Zimmetli',SERVICE:'Serviste',FAULTY:'Arızalı',LOST:'Kayıp',SCRAPPED:'Hurda',RETURNED:'İade Edildi',INACTIVE:'Pasif'};
export const profileLabels:Record<string,string>={BASIC:'Standart',COMPUTER:'Bilgisayar',PHONE:'Telefon',SIM:'SIM Kart',MONITOR:'Monitör'};
export const extraFields:Record<string,[string,string][]>= {BASIC:[],COMPUTER:[['cpu','CPU'],['ram','RAM'],['disk','Disk / SSD'],['os','İşletim Sistemi']],PHONE:[['imei','IMEI'],['phone_number','Telefon Numarası']],SIM:[['phone_number','Telefon Numarası'],['iccid','SIM / ICCID']],MONITOR:[['screen_size','Ekran Boyutu']]};
export type AssetCard={id:string;asset_number:string;brand:string;model:string;serial_number:string|null;image:string|null;category_name:string;assigned_at:string;returned_at?:string|null};
export type AssetSummary={rows:AssetCard[];total:number};
export const dateLabel=(value:unknown)=>value?String(value).slice(0,10).split('-').reverse().join('.'):'—';
