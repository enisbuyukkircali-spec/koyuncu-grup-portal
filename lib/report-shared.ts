export const reportSections={hr:'İnsan Kaynakları',inventory:'Envanter',service_desk:'Ticket / Service Desk',surveys:'Anketler',training:'Eğitimler',fleet:'Filo',people:'Onboarding / Offboarding'};
export type ReportSection=keyof typeof reportSections;
export const reportPermissions=['reports.view_management','reports.view_hr','reports.view_inventory','reports.view_service_desk','reports.view_surveys','reports.view_training','reports.view_fleet','reports.export'];
export type ReportRow=Record<string,string|number|null>;
export type ReportBlock={title:string;rows:ReportRow[]};
