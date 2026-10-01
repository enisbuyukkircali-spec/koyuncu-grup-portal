import Link from 'next/link';
import {requireIdentity} from '@/lib/auth';
import {trainingList} from '@/lib/people';
import {TrainingRows} from '@/components/PeoplePanel';
export default async function Page({searchParams}:{searchParams:Promise<{page?:string}>}){const a=await requireIdentity('training.view_own'),page=Math.max(1,Number((await searchParams).page)||1),d=await trainingList(a,false,page);return <main className="admin-content" style={{maxWidth:1200}}><nav className="a-actions"><Link className="a-button" href="/">Çalışan Portalı</Link></nav><h1>Eğitimlerim ve Sertifikalarım</h1><TrainingRows rows={d.rows}/><p>{d.total} kayıt · Sayfa {page}</p><div className="a-actions">{page>1&&<Link href={'?page='+(page-1)}>Önceki</Link>}{page*20<d.total&&<Link href={'?page='+(page+1)}>Sonraki</Link>}</div></main>;}
