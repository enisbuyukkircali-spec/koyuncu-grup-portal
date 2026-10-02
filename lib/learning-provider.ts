/** Provider-neutral boundary. The built-in adapter is intentionally local-only. */
export type LearningProviderKey='internal'|'scorm'|'xapi'|'external_api';
export type LearningLaunch={courseId:string;assignmentId:string;registrationRef:string;launchUrl:null;standard:'SCORM'|'xAPI'|'SSO'|'API';};
export interface LearningProviderAdapter {readonly key:LearningProviderKey; launch(input:{courseId:string;assignmentId:string;registrationRef:string}):Promise<LearningLaunch>;}
export class InternalLearningProviderAdapter implements LearningProviderAdapter {
 readonly key='internal' as const;
 async launch(input:{courseId:string;assignmentId:string;registrationRef:string}):Promise<LearningLaunch>{return {...input,launchUrl:null,standard:'API'};}
}
export const learningProviderCapabilities={providers:['internal','scorm','xapi','external_api'] as const,standards:['SCORM','xAPI','SSO','API'] as const,connectedProvider:null};
