import Link from 'next/link';
import {requireIdentity} from '@/lib/auth';
import {can} from '@/lib/permissions';
import * as academy from '@/lib/academy';
import OrientationPortal from '@/components/OrientationPortal';
export default async function Page(){const a=await requireIdentity('orientation.view_own'),plans=await academy.orientationOwn(a);return <><header className="admin-header"><Link href="/">← Çalışan Portalı</Link></header><OrientationPortal plans={plans} canManage={can(a,'orientation.task.manage')}/></>;}
