import {requireIdentity} from '@/lib/auth';
import ProfileMenu from '@/components/ProfileMenu';
export default async function Forbidden(){const actor=await requireIdentity();return <main className="auth-info"><div className="auth-box"><small>KOYUNCU GRUP · 403</small><h1>Yetkiniz Bulunmuyor</h1><p>Bu bölüm için sistem yöneticinizden yetki isteyebilirsiniz.</p><ProfileMenu actor={actor}/></div></main>}
