import PortalContent from '@/components/PortalContent';
export default async function Page({params}:{params:Promise<{slug:string}>}){return <PortalContent kind="news" slug={(await params).slug}/>}
