import {spawnSync} from 'node:child_process';
import {database} from '../lib/db';
import {bootstrap} from '../lib/seed';
async function main(){
 if(process.env.DATABASE_URL){
  const migration=spawnSync(process.execPath,['--import','tsx','scripts/migrate.ts'],{stdio:'inherit'});
  if(migration.status!==0)throw Error('migration');
  const {BOOTSTRAP_ADMIN_EMAIL:email,BOOTSTRAP_ADMIN_USERNAME:username,BOOTSTRAP_ADMIN_PASSWORD:configuredPassword}=process.env;
  // Accept the existing deployment variable spelling without exposing its value.
  const password=configuredPassword??process.env.BOOTSTRAPADMIN_PASSWORD;
  if(email&&username&&password){
   const existing=await database().query('SELECT id FROM users LIMIT 1');
   if(!existing.rows.length){await bootstrap(email,username,password);console.log('İlk yönetici oluşturuldu; ilk girişte şifre değişimi zorunlu.');}
  }
 }
 const result=spawnSync(process.execPath,['node_modules/next/dist/bin/next','build'],{stdio:'inherit'});
 process.exit(result.status??1);
}
main().catch(()=>{console.error('Veritabanı kurulumu başarısız; dağıtım durduruldu. Bağlantı ve başlangıç değişkenlerini kontrol edin.');process.exit(1);});
