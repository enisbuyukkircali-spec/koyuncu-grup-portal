import Dashboard from '@/components/Dashboard';
import {requireIdentity} from '@/lib/auth';
export const dynamic='force-dynamic';
export default async function Page(){const actor=await requireIdentity('portal.home.view');return <Dashboard actor={actor}/>}
