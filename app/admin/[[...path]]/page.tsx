import {requireIdentity} from '@/lib/auth';
import {can,canAction} from '@/lib/permissions';
import {redirect,notFound} from 'next/navigation';
import {adminRead} from '@/lib/admin';
import AdminPanel from '@/components/AdminPanel';
export const dynamic='force-dynamic';
const sections:Record<string,string>={users:'users',companies:'companies',locations:'locations',departments:'departments',units:'units','job-titles':'jobtitles',roles:'roles',settings:'settings'};
export default async function Admin({params}:{params:Promise<{path?:string[]}>}){const actor=await requireIdentity('admin.view');const path=(await params).path??[];const section=path[0]??'overview';if(path.length>3||section!=='overview'&&!sections[section])notFound();if(section!=='overview'&&!canAction(actor,sections[section],section==='users'&&path[1]==='new'?'create':section==='users'&&path[2]==='edit'?'edit':'view'))redirect('/forbidden');if(section==='settings'&&!can(actor,'settings.view'))redirect('/forbidden');const initialData=path.length===1&&['users','companies','locations','departments','units','job-titles','roles'].includes(section)?await adminRead(actor,section,new URL('https://portal.internal/admin/'+section)):undefined;return <AdminPanel key={path.join('/')} initialData={initialData} actor={actor} section={section} path={path}/>}
