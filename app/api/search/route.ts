import {currentIdentity} from '@/lib/auth';
import {AppError} from '@/lib/security';
import {json,fail} from '@/lib/http';
import {globalSearch} from '@/lib/directory';
export async function GET(request:Request){try{const a=await currentIdentity();if(!a)throw new AppError(401,'Yeniden giriş yapın.');return json(await globalSearch(a,new URL(request.url).searchParams));}catch(e){return fail(e);}}
