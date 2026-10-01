import {currentIdentity} from '@/lib/auth';
import {AppError,readJSON} from '@/lib/security';
import {json,fail} from '@/lib/http';
import {saveSurvey,surveyStatus,submitSurvey} from '@/lib/surveys';
export async function POST(req:Request,ctx:{params:Promise<{path?:string[]}>}){try{const a=await currentIdentity();if(!a||a.must_change_password)throw new AppError(401,'Yeniden giriş yapın.');const p=(await ctx.params).path??[],body=await readJSON(req);if(!p.length)return json(await saveSurvey(a,body));if(p.length===1)return json(await saveSurvey(a,body,p[0]));if(p.length===2&&p[1]==='submit')return json(await submitSurvey(a,p[0],body));if(p.length===2&&['publish','close'].includes(p[1]))return json(await surveyStatus(a,p[0],p[1]==='publish'?'PUBLISHED':'CLOSED'));throw new AppError(404,'Bulunamadı.');}catch(e){return fail(e);}}
