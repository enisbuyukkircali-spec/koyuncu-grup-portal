import {measured,report,plans,markRBAC} from '@/lib/perf';
import {database} from '@/lib/db';
import {currentIdentity} from '@/lib/auth';
import {can} from '@/lib/permissions';
import {adminRead,saveUser,saveOrg,saveRole,userAction} from '@/lib/admin';
import {readJSON,AppError} from '@/lib/security';
import {json,fail} from '@/lib/http';
export const runtime='nodejs';
async function actor(){const a=await currentIdentity();if(!a)throw new AppError(401,'Giriş yapmanız gerekiyor.');if(a.must_change_password)throw new AppError(403,'Önce şifrenizi değiştirin.');const start=performance.now();if(!can(a,'admin.view'))throw new AppError(403,'Admin paneline erişim yetkiniz bulunmuyor.');markRBAC(start);return a;}
export async function GET(request:Request,{params}:{params:Promise<{path:string[]}>}){return measured(async()=>{try{const a=await actor();const [resource,id]=(await params).path;const data=await adminRead(a,resource,new URL(request.url),id);const response=json(data);if(a.roles.includes('SUPER_ADMIN')&&report()){const profile=report();response.headers.set('X-KG-Perf',JSON.stringify(profile));if(new URL(request.url).searchParams.has('kg_plan'))response.headers.set('X-KG-Plans',JSON.stringify(await plans(database())));}return response;}catch(e){return fail(e);}});}
async function mutate(request:Request,params:Promise<{path:string[]}>){try{const data=await readJSON(request);const a=await actor();const [resource,id,action]=(await params).path;if(request.method==='PATCH'&&!id)throw new AppError(400,'Kayıt seçin.');if(request.method==='POST'&&id&&!action)throw new AppError(405,'İstek yöntemi geçersiz.');if(action&&resource==='users'&&id)return json(await userAction(a,id,action,data));if(action)throw new AppError(404,'İşlem bulunamadı.');return json(resource==='users'?await saveUser(a,data,id):resource==='roles'?await saveRole(a,data,id):await saveOrg(a,resource,data,id));}catch(e){return fail(e);}}
export async function POST(request:Request,{params}:{params:Promise<{path:string[]}>}){return mutate(request,params);}
export async function PATCH(request:Request,{params}:{params:Promise<{path:string[]}>}){return mutate(request,params);}
