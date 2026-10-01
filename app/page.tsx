import {measured,report} from '@/lib/perf';
import PerfProbe from '@/components/PerfProbe';
import Dashboard from '@/components/Dashboard';
import {requireIdentity} from '@/lib/auth';
export const dynamic='force-dynamic';
export default async function Page(){return measured(async()=>{const actor=await requireIdentity('portal.home.view');return <><PerfProbe profile={actor.roles.includes('SUPER_ADMIN')?report():undefined}/><Dashboard actor={actor}/></>});}
