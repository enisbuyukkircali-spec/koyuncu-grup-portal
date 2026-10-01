import {currentIdentity} from '@/lib/auth';
import {json,fail} from '@/lib/http';
import {AppError} from '@/lib/security';
import * as c from '@/lib/content';
async function handle(request:Request,context:{params:Promise<{path:string[]}>}){try{const actor=await currentIdentity();if(!actor||actor.must_change_password)throw new AppError(401,'Yeniden giriş yapın.');const path=(await context.params).path,[section,id,action]=path;if(path.length>3)throw new AppError(404,'Bulunamadı.');if(section==='homepage'&&path.length===1){if(request.method==='GET')return json(await c.homepageRead(actor));if(request.method==='PATCH')return json(await c.saveHomepage(actor,await c.readContentJSON(request)));}const kind=c.kindOf(section);
 if(request.method==='GET'){if(!id)return json(await c.adminContentList(actor,kind,new URL(request.url).searchParams));if(path.length===2)return json(id==='options'?await c.contentOptions(actor,kind):await c.adminContentDetail(actor,kind,id));}
 if(request.method==='POST'&&!id)return json(await c.saveContent(actor,kind,await c.readContentJSON(request)));if(request.method==='PATCH'&&id&&!action)return json(await c.saveContent(actor,kind,await c.readContentJSON(request),id));if(request.method==='POST'&&id&&action){await c.readContentJSON(request);return json(await c.contentAction(actor,kind,id,action));}throw new AppError(404,'Bulunamadı.');}catch(e){if((e as {code?:string}).code==='23505')return json({error:'Bu bağlantı adresi (slug) zaten kullanılıyor.'},409);return fail(e);}}
export const GET=handle;export const POST=handle;export const PATCH=handle;
