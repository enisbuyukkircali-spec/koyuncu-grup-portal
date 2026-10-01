import {currentIdentity} from '@/lib/auth';
import {json,fail} from '@/lib/http';
import {AppError,readJSON} from '@/lib/security';
import * as m from '@/lib/meetings';
type Context={params:Promise<{path?:string[]}>};
async function handle(request:Request,context:Context){try{const a=await currentIdentity();if(!a||a.must_change_password)throw new AppError(401,'Yeniden giriş yapın.');const path=(await context.params).path??[],[kind,id,action]=path,p=new URL(request.url).searchParams,admin=p.get('admin')==='1';p.delete('admin');if(path.length>3)throw new AppError(404,'Bulunamadı.');if(request.method==='GET'){if(kind==='agenda'&&!id)return json(await m.agenda(a,p));if(kind==='options'&&!id)return json(await m.meetingOptions(a,admin));if(kind==='rooms'&&!action)return json(id?await m.roomDetail(a,id):await m.roomList(a,p,admin));if(kind==='reservations'&&!action)return json(id?await m.reservationDetail(a,id):await m.reservationList(a,p,admin));}else{const body=await readJSON(request);if(kind==='rooms'&&!action)return json(await m.saveRoom(a,body,id));if(kind==='reservations'&&id&&action==='cancel')return json(await m.cancelReservation(a,id,admin));if(kind==='reservations'&&!action)return json(await m.saveReservation(a,body,id));}throw new AppError(404,'Bulunamadı.');}catch(e){return fail(e);}}
export const GET=handle;export const POST=handle;
