import SurveyPage from '@/components/SurveyPage';
export default function Page(props:{params:Promise<{path?:string[]}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){return <SurveyPage {...props} admin/>;}
