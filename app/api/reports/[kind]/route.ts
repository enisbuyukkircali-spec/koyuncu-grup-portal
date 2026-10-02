import {currentIdentity} from '@/lib/auth';
import {AppError} from '@/lib/security';
import {permit} from '@/lib/workflows';
import {fail} from '@/lib/http';
import {report,reportCSV} from '@/lib/reports';
import {ReportSection} from '@/lib/report-shared';
export async function GET(req:Request,ctx:{params:Promise<{kind:string}>}){try{const a=await currentIdentity();if(!a)throw new AppError(401,'Yeniden giriş yapın.');permit(a,'reports.export',true);const data=await report(a,(await ctx.params).kind as ReportSection,new URL(req.url).searchParams);return new Response(reportCSV(data),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="portal-raporu.csv"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}catch(e){return fail(e);}}
