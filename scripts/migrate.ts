import {readFile} from 'node:fs/promises';
import {database,transaction} from '../lib/db';
import {seed} from '../lib/seed';
async function main(){const sql=await readFile(new URL('../db/001_phase2.sql',import.meta.url),'utf8');await database().query(sql);await database().query(await readFile(new URL('../db/002_inventory.sql',import.meta.url),'utf8'));await database().query(await readFile(new URL('../db/003_content.sql',import.meta.url),'utf8'));await database().query(await readFile(new URL('../db/004_dashboard_cache.sql',import.meta.url),'utf8'));await transaction(seed);console.log('Phase 2A-3 veritabanı şeması hazır.');}
main().then(()=>process.exit(0)).catch(()=>{console.error('Migration başarısız. DATABASE_URL ve veritabanı yetkilerini kontrol edin.');process.exit(1);});
