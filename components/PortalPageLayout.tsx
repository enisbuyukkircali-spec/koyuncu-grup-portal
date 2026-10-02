import {requireIdentity} from '@/lib/auth';
import PortalFrame from './PortalFrame';
export default async function PortalPageLayout({children}:{children:React.ReactNode}){const actor=await requireIdentity();return <PortalFrame actor={actor}>{children}</PortalFrame>;}
