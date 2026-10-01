import PortalContent from '@/components/PortalContent';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <PortalContent kind="events" searchParams={await searchParams}/>}
