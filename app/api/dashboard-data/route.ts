import {ipWeatherLocation} from '@/lib/ip-weather-location';
import {NextResponse} from 'next/server';
import {currentIdentity} from '@/lib/auth';
import {can} from '@/lib/permissions';
import {dashboardData} from '@/lib/dashboard-data';
import {emptyDashboardData} from '@/lib/dashboard-data-shared';
export const runtime='nodejs';
export const preferredRegion='fra1';
export async function GET(request:Request){
 const actor=await currentIdentity();
 const headers={'Cache-Control':'private, no-store'};
 if(!actor)return NextResponse.json({error:'Unauthorized'},{status:401,headers});
 if(actor.must_change_password||!can(actor,'portal.home.view'))return NextResponse.json({error:'Forbidden'},{status:403,headers});
 try{return NextResponse.json(await dashboardData(actor.id,ipWeatherLocation(request.headers,new URL(request.url).searchParams.get('timezone'))),{headers});}
 catch{return NextResponse.json(emptyDashboardData,{headers});}
}
