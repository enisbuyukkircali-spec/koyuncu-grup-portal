export type LearningLaunch={status:'READY'|'NOT_CONFIGURED';url:string|null;message:string};
export interface LearningProviderAdapter{readonly name:string;launch(content:{type:string;url:string;externalId:string;packageReference:string}):LearningLaunch;}
export const learningProvider:LearningProviderAdapter={name:'INTERNAL',launch(c){if(['SCORM','EXTERNAL_LMS'].includes(c.type))return {status:'NOT_CONFIGURED',url:null,message:'Bu içerik için eğitim sağlayıcısı henüz bağlanmadı.'};return {status:'READY',url:/^https:\/\//i.test(c.url)?c.url:null,message:''};}};
// Future trusted adapters may report completion/progress/score through a verified server integration.
// There is deliberately no public callback or client-controlled provider score endpoint.
