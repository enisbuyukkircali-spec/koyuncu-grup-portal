import Link from 'next/link';
import {requireIdentity} from '@/lib/auth';
import {myArea} from '@/lib/organization';
export default async function Page(){const a=await requireIdentity('my_area.view'),rows=await myArea(a);return <main className="admin-content" style={{maxWidth:1100,margin:'auto'}}><Link href="/">← Portal</Link><h1>Benden Beklenenler</h1><div className="form-grid">{rows.map(r=><Link className="a-card" key={r.label} href={r.link}><h2>{r.label}</h2><strong>{r.count}</strong></Link>)}</div>{!rows.some(r=>r.count>0)&&<p>Bekleyen işleminiz bulunmuyor.</p>}<Link href="/deadlines">Yaklaşan Süreler</Link></main>;}
