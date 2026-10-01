import Dashboard from '@/components/Dashboard';
import {requireIdentity} from '@/lib/auth';
import {ownAssets} from '@/lib/inventory';
import {can} from '@/lib/permissions';
export const dynamic='force-dynamic';
export default async function Page(){const actor=await requireIdentity('portal.home.view');const assets=can(actor,'portal.assets.view')?await ownAssets(actor,new URLSearchParams(),2):{rows:[],total:0};return <Dashboard actor={actor} assets={assets}/>}
