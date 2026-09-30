import {requireIdentity} from '@/lib/auth';
import {can,canAction} from '@/lib/permissions';
import {redirect,notFound} from 'next/navigation';
import AdminPanel from '@/components/AdminPanel';
export const dynamic='force-dynamic';
const sections:Record<string,string>={users:'users',companies:'companies',locations:'locations',departments:'departments',units:'units','job-titles':'jobtitles',roles:'roles',settings:'settings'};
export default async function Admin({params}:{params:Promise<{path?:string[]}>}){const actor=await requireIdentity('admin.view');const path=(await params).path??[];const section=path[0]??'overview';if(path.length>3||section!=='overview'&&!sections[section])notFound();if(section!=='overview'&&!canAction(actor,sections[section],section==='users'&&path[1]==='new'?'create':section==='users'&&path[2]==='edit'?'edit':'view'))redirect('/forbidden');if(section==='settings'&&!can(actor,'settings.view'))redirect('/forbidden');return <AdminPanel actor={actor} section={section} path={path}/>}
