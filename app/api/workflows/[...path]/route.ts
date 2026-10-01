import {currentIdentity} from '@/lib/auth';
import {json,fail} from '@/lib/http';
import {AppError,readJSON} from '@/lib/security';
import * as w from '@/lib/workflows';
type Context={params:Promise<{path:string[]}>};
async function handle(request:Request,context:Context){try{const actor=await currentIdentity();if(!actor||actor.must_change_password)throw new AppError(401,'Yeniden giriş yapın.');const path=(await context.params).path,[section,id,action]=path,params=new URL(request.url).searchParams,admin=params.get('admin')==='1';if(path.length>3)throw new AppError(404,'Bulunamadı.');if(request.method==='GET'){
if(section==='attachments'&&id){const f=await w.attachmentDownload(actor,id);return new Response(new Uint8Array(f.data),{headers:{'Content-Type':f.mime,'Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(f.name),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
if(section==='options')return json(await w.workflowOptions(actor));
if(section==='request-types'||section==='leave-types')return json(await w.types(actor,section,admin));
if(section==='requests'||section==='leave')return json(id?await w.detail(actor,section,id,admin):await w.listWork(actor,section,params,admin));
if(section==='approvals')return json(await w.listApprovals(actor,params));
if(section==='leave-balances')return json(id&&action?await w.balanceHistory(actor,id,action):await w.balances(actor,params,admin));
}else {const body=await readJSON(request);if(section==='request-types'||section==='leave-types')return json(await w.saveType(actor,section,body,id));if(section==='requests'&&!id)return json(await w.createRequest(actor,body));if(section==='leave'&&!id)return json(await w.createLeave(actor,body));if((section==='requests'||section==='leave')&&id&&action==='cancel')return json(await w.cancel(actor,section,id));if(section==='requests'&&id&&!action)return json(await w.updateRequest(actor,id,body));if(section==='approvals'&&id)return json(await w.decide(actor,id,body));if(section==='leave-balances')return json(await w.adjustBalance(actor,body));}throw new AppError(404,'Bulunamadı.');}catch(e){return fail(e);}}
export const GET=handle;export const POST=handle;export const PATCH=handle;
