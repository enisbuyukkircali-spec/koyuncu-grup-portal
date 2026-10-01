import SuggestionPage from '@/components/SuggestionPage';
export const dynamic='force-dynamic';
export default async function Page({params,searchParams}:{params:Promise<{path?:string[]}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){return <SuggestionPage path={(await params).path??[]} search={await searchParams}/>;}
