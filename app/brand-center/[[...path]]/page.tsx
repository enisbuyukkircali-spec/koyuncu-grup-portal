import BrandPage from '@/components/BrandPage';
export default async function Page({params,searchParams}:{params:Promise<{path?:string[]}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){return <BrandPage path={(await params).path??[]} search={await searchParams}/>;}
