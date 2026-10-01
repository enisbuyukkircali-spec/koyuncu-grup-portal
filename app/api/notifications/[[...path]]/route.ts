import {currentIdentity} from '@/lib/auth';
import {json,fail} from '@/lib/http';
import {AppError,readJSON} from '@/lib/security';
import {notificationList,unreadCount,readNotification} from '@/lib/notifications';
import {z} from 'zod';
type Context={params:Promise<{path?:string[]}>};
async function handle(request:Request,context:Context){try{const actor=await currentIdentity();if(!actor||actor.must_change_password)throw new AppError(401,'Yeniden giriş yapın.');const path=(await context.params).path??[],[id]=path;if(path.length>1)throw new AppError(404,'Bulunamadı.');if(request.method==='GET'){if(id==='count')return json(await unreadCount(actor));if(id==='recent')return json(await notificationList(actor,new URLSearchParams(),true));if(!id)return json(await notificationList(actor,new URL(request.url).searchParams));}else if(id){const d=z.object({read:z.boolean().default(true)}).strict().parse(await readJSON(request));return json(await readNotification(actor,id,d.read));}throw new AppError(404,'Bulunamadı.');}catch(e){return fail(e);}}
export const GET=handle;export const POST=handle;
