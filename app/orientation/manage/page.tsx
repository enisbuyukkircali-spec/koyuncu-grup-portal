import Link from 'next/link';
import {requireIdentity} from '@/lib/auth';
import * as academy from '@/lib/academy';
import OrientationManager from '@/components/OrientationManager';
export default async function Page(){const a=await requireIdentity('orientation.task.manage'),rows=await academy.managerOrientations(a);return <><header className="admin-header"><Link href="/orientation">← Oryantasyon</Link></header><OrientationManager rows={rows}/></>;}
