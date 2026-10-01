import Dashboard from '@/components/Dashboard';
import {requireIdentity} from '@/lib/auth';
import {ownAssets} from '@/lib/inventory';
import {can} from '@/lib/permissions';
import {dashboardContent} from '@/lib/content';
export const dynamic='force-dynamic';
export default async function Page(){const actor=await requireIdentity('portal.home.view');const [assets,content]=await Promise.all([can(actor,'portal.assets.view')?ownAssets(actor,new URLSearchParams(),2):Promise.resolve({rows:[],total:0}),dashboardContent(actor)]);return <Dashboard actor={actor} assets={assets} content={content}/>}
