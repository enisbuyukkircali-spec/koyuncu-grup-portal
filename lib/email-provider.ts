// Provider injection point. No credentials, network calls or delivery are enabled in this phase.
export type EmailMessage={recipient:string;subject:string;eventType:string;payload:Record<string,unknown>};
export type EmailResult={status:'ProviderDisabled'|'Sent'|'Failed';failureReason?:string};
export interface EmailProvider {readonly state:'DISABLED'|'CONFIGURED';send(message:EmailMessage):Promise<EmailResult>}
export const emailProvider:EmailProvider={state:'DISABLED',async send(){return {status:'ProviderDisabled',failureReason:'NOT_CONFIGURED'};}};
