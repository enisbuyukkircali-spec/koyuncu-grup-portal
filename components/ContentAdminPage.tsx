import {notFound,redirect} from 'next/navigation';
import {Identity,can} from '@/lib/permissions';
import {kindOf,homepageRead,adminContentDetail,adminContentList} from '@/lib/content';
import {AppError} from '@/lib/security';
import ContentAdminPanel from './ContentAdminPanel';
export default async function ContentAdminPage({actor,path}:{actor:Identity;path:string[]}){const [section,id,edit]=path;const isNew=id==='new';if(id&&!isNew&&!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id))notFound();if(path.length>3||edit&&edit!=='edit'||isNew&&edit||section==='homepage'&&path.length!==1)notFound();const permission=section==='homepage'?'homepage.view':section+'.'+(isNew?'create':edit?'edit':'view');if(!can(actor,permission)||edit&&!can(actor,section+'.view'))redirect('/forbidden');try{const initial=section==='homepage'?await homepageRead(actor):isNew?{}:id?await adminContentDetail(actor,kindOf(section),id):await adminContentList(actor,kindOf(section));return <ContentAdminPanel key={path.join('/')} actor={actor} path={path} initial={JSON.parse(JSON.stringify(initial))}/>;}catch(e){if(e instanceof AppError&&e.status===404)notFound();throw e;}}
