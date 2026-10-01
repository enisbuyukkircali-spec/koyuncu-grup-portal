import MeetingPage from '@/components/MeetingPage';
export default async function Page({params,searchParams}:{params:Promise<{path?:string[]}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){return <MeetingPage path={(await params).path??[]} search={await searchParams} mode="portal"/>;}
