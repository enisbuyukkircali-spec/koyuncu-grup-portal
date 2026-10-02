import Link from 'next/link';
import {requireIdentity} from '@/lib/auth';
import {can} from '@/lib/permissions';
import * as academy from '@/lib/academy';
import AcademyPortal from '@/components/AcademyPortal';
export default async function Page(){const a=await requireIdentity('academy.catalog.view');const [catalog,assignments,sessions,targets]=await Promise.all([academy.catalog(a),academy.assignments(a),academy.sessionList(a),can(a,'academy.assign_direct')||can(a,'training.manage')?academy.assignmentTargets(a):Promise.resolve([])]);return <><header className="admin-header"><Link href="/">← Çalışan Portalı</Link></header><AcademyPortal courses={catalog.rows} assignments={assignments} sessions={sessions} targets={targets} actor={a}/></>;}
