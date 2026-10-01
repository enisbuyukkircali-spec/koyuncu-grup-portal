import {currentIdentity} from '@/lib/auth';
import {AppError,readJSON} from '@/lib/security';
import {json,fail} from '@/lib/http';
import {myTasks,updateOwnTask,ticketTasks,saveTask} from '@/lib/tickets';
async function handle(req:Request,ctx:{params:Promise<{path?:string[]}>}){try{const a=await currentIdentity();if(!a||a.must_change_password)throw new AppError(401,'Yeniden giriş yapın.');const p=(await ctx.params).path??[],q=new URL(req.url).searchParams;if(p.length>3)throw new AppError(404,'Bulunamadı.');if(req.method==='GET'){if(!p.length)return json(await myTasks(a,Number(q.get('page'))||1));if(p[0]==='ticket'&&p.length===2)return json(await ticketTasks(a,p[1],q.get('admin')==='1'));}else {const body=await readJSON(req);if(p[0]==='ticket'&&p[1])return json(await saveTask(a,p[1],body,p[2]));if(p.length===1)return json(await updateOwnTask(a,p[0],body));}throw new AppError(404,'Bulunamadı.');}catch(e){return fail(e);}}
export const GET=handle;export const POST=handle;
