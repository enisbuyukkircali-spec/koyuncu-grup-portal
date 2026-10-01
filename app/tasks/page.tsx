import Link from 'next/link';
import {requireIdentity} from '@/lib/auth';
import {myTasks} from '@/lib/tickets';
import {TaskList} from '@/components/TicketTasks';
export default async function Page({searchParams}:{searchParams:Promise<{page?:string}>}){const a=await requireIdentity('tasks.view_own'),p=await searchParams,data=await myTasks(a,Number(p.page)||1);return <main className="admin-content" style={{maxWidth:1100,margin:'auto'}}><Link href="/requests">← Taleplerim</Link><h1>Görevlerim</h1><TaskList rows={data.rows} editable={a.roles.includes('SUPER_ADMIN')||a.permissions.includes('tasks.update_own')}/><p>{data.total} açık görev · Sayfa {data.page}</p>{data.page>1&&<Link href={'/tasks?page='+(data.page-1)}>Önceki</Link>}{data.page*20<data.total&&<Link href={'/tasks?page='+(data.page+1)}>Sonraki</Link>}</main>}
