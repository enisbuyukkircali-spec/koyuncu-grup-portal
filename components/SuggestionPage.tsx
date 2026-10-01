import {notFound} from 'next/navigation';
import {requireIdentity} from '@/lib/auth';
import {suggestionList,suggestionDetail,suggestionTypes} from '@/lib/suggestions';
import {AppError} from '@/lib/security';
import SuggestionPanel from './SuggestionPanel';
export default async function SuggestionPage({path,search,admin=false}:{path:string[];search:Record<string,string|string[]|undefined>;admin?:boolean}){const [id]=path;if(path.length>1||admin&&id==='new'||id&&id!=='new'&&!/^[a-f0-9-]{36}$/i.test(id))notFound();const actor=await requireIdentity(admin?'suggestions.manage':id==='new'?'suggestions.create':'suggestions.view_own'),p=new URLSearchParams();for(const [k,v]of Object.entries(search))if(typeof v==='string')p.set(k,v);let initial;try{initial=id==='new'?await suggestionTypes(actor):id?await suggestionDetail(actor,id,admin):await suggestionList(actor,p,admin);}catch(e){if(e instanceof AppError&&e.status===404)notFound();throw e;}return <SuggestionPanel key={String(admin)+path.join('/')+p.toString()} actor={actor} id={id} admin={admin} initial={JSON.parse(JSON.stringify(initial))} filters={Object.fromEntries(p)}/>;}
