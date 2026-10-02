import {currentIdentity} from '@/lib/auth';
import {AppError,readJSON} from '@/lib/security';
import {json,fail} from '@/lib/http';
import {proofResponse} from '@/lib/proof-files';
import * as f from '@/lib/fleet';
export async function GET(req:Request,ctx:{params:Promise<{path?:string[]}>}){try{const a=await currentIdentity();if(!a||a.must_change_password)throw new AppError(401,'Yeniden giriş yapın.');const p=(await ctx.params).path??[];if(p.length===2&&['file','service'].includes(p[0]))return proofResponse(await f.fleetFile(a,p[1],p[0]==='service'));throw new AppError(404,'Bulunamadı.');}catch(e){return fail(e);}}
export async function POST(req:Request,ctx:{params:Promise<{path?:string[]}>}){try{const a=await currentIdentity();if(!a||a.must_change_password)throw new AppError(401,'Yeniden giriş yapın.');const p=(await ctx.params).path??[],d=await readJSON(req);if(p[0]==='vehicles'&&p.length<=2)return json(await f.saveVehicle(a,d,p[1]));if(p.length===2){if(p[0]==='assign')return json(await f.allocateVehicle(a,p[1],d));if(p[0]==='return')return json(await f.returnVehicle(a,p[1],d));if(p[0]==='file')return json(await f.fleetFileSave(a,p[1],d));if(p[0]==='service')return json(await f.fleetService(a,p[1],d));}throw new AppError(404,'Bulunamadı.');}catch(e){return fail(e);}}
