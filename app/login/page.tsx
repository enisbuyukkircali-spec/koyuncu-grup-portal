import AuthForm from '@/components/AuthForm';
import {currentIdentity} from '@/lib/auth';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Login(){const actor=await currentIdentity();if(actor)redirect(actor.must_change_password?'/change-password':'/');return <AuthForm mode="login"/>}
