export const surveyPermissions=['surveys.view_own','surveys.manage','surveys.results'];
export const questionTypes={SINGLE:'Tek Seçim',MULTIPLE:'Çoklu Seçim',YES_NO:'Evet / Hayır',SCALE_5:'1–5 Ölçek',SCALE_10:'1–10 Ölçek',SHORT:'Kısa Metin',LONG:'Uzun Metin'};
export type Question={id:string;title:string;type:keyof typeof questionTypes;required:boolean;options:string[]};
export type Survey={id:string;title:string;description:string;anonymous:boolean;required:boolean;status:string;starts_at:string;ends_at:string;privacy_threshold:number;audience_all:boolean;targets:{type:string;id:string}[];questions:Question[];answered?:boolean};
export type Answer=string|string[]|number;
export type SurveyResults={assigned:number;answered:number;pending:number;participation:number;suppressed:boolean;questions:{title:string;counts:{label:string;count:number}[];texts:string[]}[]};
