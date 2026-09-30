import 'server-only';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {SESSION_COOKIE,sessionIdentity} from './auth-core';
import {can} from './permissions';
export async function currentIdentity(){return sessionIdentity((await cookies()).get(SESSION_COOKIE)?.value);}
export async function requireIdentity(permission?:string){const actor=await currentIdentity();if(!actor)redirect('/login');if(actor.must_change_password)redirect('/change-password');if(permission&&!can(actor,permission))redirect('/forbidden');return actor;}
