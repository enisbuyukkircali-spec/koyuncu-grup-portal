import AuthForm from '@/components/AuthForm';
import {currentIdentity} from '@/lib/auth';
import {redirect} from 'next/navigation';
import {passwordMinimum} from '@/lib/security';
export const dynamic='force-dynamic';
export default async function Change(){const actor=await currentIdentity();if(!actor)redirect('/login');return <AuthForm mode="change" min={passwordMinimum()}/>}
