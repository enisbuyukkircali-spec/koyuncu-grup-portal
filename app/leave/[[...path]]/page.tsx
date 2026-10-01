import {requireIdentity} from '@/lib/auth';
import WorkflowPage from '@/components/WorkflowPage';
export const dynamic='force-dynamic';
export default async function Page({params,searchParams}:{params:Promise<{path?:string[]}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){const actor=await requireIdentity();return <WorkflowPage actor={actor} path={['leave',...((await params).path??[])]} searchParams={await searchParams}/>;}
