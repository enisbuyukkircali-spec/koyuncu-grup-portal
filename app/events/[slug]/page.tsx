import PortalContent from '@/components/PortalContent';
export default async function Page({params}:{params:Promise<{slug:string}>}){return <PortalContent kind="events" slug={(await params).slug}/>}
