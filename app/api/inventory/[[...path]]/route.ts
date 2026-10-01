import {currentIdentity} from '@/lib/auth';
import {json,fail} from '@/lib/http';
import {AppError,readJSON} from '@/lib/security';
import * as inv from '@/lib/inventory';
type Context={params:Promise<{path?:string[]}>};
async function handle(request:Request,context:Context){try{const actor=await currentIdentity();if(!actor||actor.must_change_password)throw new AppError(401,'Yeniden giriş yapın.');const path=(await context.params).path??[],[section,id,action]=path;if(path.length>3)throw new AppError(404,'Bulunamadı.');const method=request.method,params=new URL(request.url).searchParams;
 if(method==='GET'){if(!path.length)return json(await inv.listInventory(actor,params));if(section==='options'&&path.length===1)return json(await inv.inventoryOptions(actor));if(section==='categories'&&path.length===1)return json(await inv.listCategories(actor));if(section==='assignments'&&path.length===1)return json(await inv.listAssignments(actor,params));if(section==='items'&&id&&path.length===2)return json(await inv.inventoryDetail(actor,id));}
 else {const body=await readJSON(request);if(section==='categories'&&!action&&((method==='POST'&&!id)||(method==='PATCH'&&id)))return json(await inv.saveCategory(actor,body,id));if(section==='items'&&!action&&((method==='POST'&&!id)||(method==='PATCH'&&id)))return json(await inv.saveItem(actor,body,id));if(section==='items'&&id&&action==='status'&&method==='POST')return json(await inv.changeItemStatus(actor,id,body));if(section==='assignments'&&method==='POST'&&!id)return json(await inv.assignItem(actor,body));if(section==='assignments'&&id&&action==='return'&&method==='POST')return json(await inv.returnAssignment(actor,id,body));if(section==='assignments'&&id&&!action&&method==='PATCH')return json(await inv.updateAssignment(actor,id,body));}
 throw new AppError(404,'Bulunamadı.');}catch(e){return fail(e);}}
export const GET=handle;export const POST=handle;export const PATCH=handle;
