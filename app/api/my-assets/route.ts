import {currentIdentity} from '@/lib/auth';
import {ownAssets} from '@/lib/inventory';
import {json,fail} from '@/lib/http';
import {AppError} from '@/lib/security';
export async function GET(request:Request){try{const actor=await currentIdentity();if(!actor||actor.must_change_password)throw new AppError(401,'Yeniden giriş yapın.');return json(await ownAssets(actor,new URL(request.url).searchParams));}catch(e){return fail(e);}}
