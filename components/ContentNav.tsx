import Link from 'next/link';
import {Identity,can} from '@/lib/permissions';
import {contentKinds,contentNames} from '@/lib/content-shared';
export default function ContentNav({actor}:{actor:Identity}){const kinds=contentKinds.filter(k=>can(actor,k+'.view'));return <>{kinds.length>0&&<><small>İÇERİK</small>{kinds.map(k=><Link key={k} href={'/admin/'+k}>{contentNames[k]}</Link>)}</>}{can(actor,'homepage.view')&&<Link href="/admin/homepage">Ana Sayfa Yönetimi</Link>}{(can(actor,'brand_center.manage')||can(actor,'email_signature.manage'))&&<><small>KURUMSAL İLETİŞİM</small>{can(actor,'brand_center.manage')&&<Link href="/admin/brand-center">Marka Merkezi</Link>}{can(actor,'email_signature.manage')&&<Link href="/admin/brand-center/email-signatures">E-posta İmza Şablonları</Link>}</>}</>;}
