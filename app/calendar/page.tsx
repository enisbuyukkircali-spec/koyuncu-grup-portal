import Link from 'next/link';
import {requireIdentity} from '@/lib/auth';
import {agenda} from '@/lib/meetings';
import Agenda from '@/components/Agenda';
import ProfileMenu from '@/components/ProfileMenu';
export default async function Page({searchParams}:{searchParams:Promise<{month?:string}>}){const a=await requireIdentity('calendar.view_own'),p=new URLSearchParams(),q=await searchParams;if(q.month)p.set('month',q.month);const data=await agenda(a,p,true);return <><header className="admin-header"><Link href="/">← Çalışan Portalı</Link><ProfileMenu actor={a}/></header><main className="admin-content" style={{maxWidth:1150,margin:'auto'}}><h1>Ajandam</h1><Agenda initial={JSON.parse(JSON.stringify(data))}/></main></>;}
