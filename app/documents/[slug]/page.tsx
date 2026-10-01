import PortalContent from '@/components/PortalContent';
export default async function Page({params}:{params:Promise<{slug:string}>}){return <PortalContent kind="documents" slug={(await params).slug}/>}
