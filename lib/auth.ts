import 'server-only';
import {trace,markRBAC} from './perf';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {SESSION_COOKIE,sessionIdentity} from './auth-core';
import {can} from './permissions';
export async function currentIdentity(){const t=trace(),start=performance.now();try{return await sessionIdentity((await cookies()).get(SESSION_COOKIE)?.value);}finally{if(t){t.auth+=performance.now()-start;t.authCalls++;}}}
export async function requireIdentity(permission?:string){const actor=await currentIdentity();if(!actor)redirect('/login');if(actor.must_change_password)redirect('/change-password');const start=performance.now();if(permission&&!can(actor,permission))redirect('/forbidden');markRBAC(start);return actor;}
