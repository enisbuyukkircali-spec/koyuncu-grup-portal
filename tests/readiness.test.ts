import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {pg_trgm} from '@electric-sql/pglite/contrib/pg_trgm';
import {btree_gist} from '@electric-sql/pglite/contrib/btree_gist';
import {injectTestDB} from '../lib/db';
import {seed,bootstrap} from '../lib/seed';
import {hashPassword} from '../lib/security';
import {login,logout,sessionIdentity,identityFor} from '../lib/auth-core';
import {initialRoles,can} from '../lib/permissions';
import {adminRead,saveOrg} from '../lib/admin';
import {dashboardContent} from '../lib/content';
import {dashboardCounts} from '../lib/workflows';
import {dashboardEngagement,suggestionList} from '../lib/suggestions';
import {agenda} from '../lib/meetings';
import {globalSearch} from '../lib/directory';
import {uploadedImageValid} from '../lib/upload';

test('V1 audit: seven roles, sessions, dashboard and scope',async t=>{
 Object.assign(process.env,{NODE_ENV:'test'});
 const pg=new PGlite({extensions:{pg_trgm,btree_gist}});let queries:string[]=[];
 const db={query:async(sql:string,values?:unknown[])=>{queries.push(sql);return pg.query<any>(sql,values);}};injectTestDB(db);
 for(const file of ['001_phase2.sql','002_inventory.sql','003_content.sql','004_dashboard_cache.sql','005_workflows.sql','006_engagement.sql','007_meetings.sql','008_directory.sql'])await pg.exec(await readFile('db/'+file,'utf8'));
 await seed(db);const hash=await hashPassword('Audit-test-923!');
 for(const role of Object.keys(initialRoles))await t.test(role+' login / dashboard / authorized and denied operations / logout',async()=>{
  const id=randomUUID(),name=role.toLowerCase();
  await db.query("INSERT INTO users(id,personnel_no,first_name,last_name,email,username,must_change_password) VALUES($1,$2,$2,'Audit',$3,$2,false)",[id,name,name+'@example.test']);
  await db.query('INSERT INTO credentials(user_id,password_hash) VALUES($1,$2)',[id,hash]);await db.query('INSERT INTO user_roles VALUES($1,$2)',[id,role]);
  const session=await login(name,'Audit-test-923!',false,'audit-'+name);queries=[];
  const actor=(await sessionIdentity(session.token))!;assert.equal(actor.id,id);assert.equal(queries.length,1,'one fresh session/RBAC query');
  assert.ok(can(actor,'portal.home.view'));await dashboardContent(actor);await dashboardCounts(actor);await dashboardEngagement(actor);await agenda(actor);await globalSearch(actor,new URLSearchParams('q=Audit'));
  if(['SUPER_ADMIN','ADMIN','HR_ADMIN','IT_ADMIN'].includes(role))await adminRead(actor,'users',new URL('https://portal.test/api/admin/users'));
  else await assert.rejects(()=>adminRead(actor,'users',new URL('https://portal.test/api/admin/users')),{status:403});
  if(['SUPER_ADMIN','ADMIN','CONTENT_ADMIN'].includes(role))await suggestionList(actor,new URLSearchParams(),true);
  else await assert.rejects(()=>suggestionList(actor,new URLSearchParams(),true),{status:403});
  if(role!=='SUPER_ADMIN'){
   await db.query("INSERT INTO user_permission_overrides VALUES($1,'portal.home.view',false)",[id]);
   const changed=(await sessionIdentity(session.token))!;assert.ok(!can(changed,'portal.home.view'));await assert.rejects(()=>dashboardContent(changed),{status:403});
   await db.query('DELETE FROM user_permission_overrides WHERE user_id=$1',[id]);
  }else await assert.rejects(()=>bootstrap('second@example.test','second','Audit-test-923!'),{status:409});
  await db.query("UPDATE users SET status='INACTIVE' WHERE id=$1",[id]);assert.equal(await sessionIdentity(session.token),null);await assert.rejects(()=>login(name,'Audit-test-923!',false,'audit-'+name),{status:401});
  await db.query("UPDATE users SET status='ACTIVE' WHERE id=$1",[id]);await logout(session.token);assert.equal(await sessionIdentity(session.token),null);
 });
 await t.test('inline images reject forged MIME, SVG, external paths and oversize bytes',async()=>{
  for(const value of ['data:image/png;base64,'+Buffer.from('<script>bad</script>').toString('base64'),'data:image/svg+xml;base64,PHN2Zz4=','https://example.test/private','../../file'])assert.equal(uploadedImageValid(value),false);
  const png=Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),Buffer.alloc(200000)]);assert.equal(uploadedImageValid('data:image/png;base64,'+png.toString('base64')),false);
  const actor=(await identityFor(db,(await db.query("SELECT user_id FROM user_roles WHERE role_id='SUPER_ADMIN'")).rows[0].user_id))!;
  await assert.rejects(()=>saveOrg(actor,'companies',{name:'Invalid image',code:'BAD',active:true,logo:'data:image/png;base64,SGVsbG8='}));
 });
 await t.test('system seed does not create business records and repeat does not alter grants',async()=>{
  for(const table of ['requests','leave_requests','suggestions','meeting_reservations','asset_assignments','workflow_notifications'])assert.equal((await db.query(`SELECT count(*)::int n FROM ${table}`)).rows[0].n,0);
  await db.query("DELETE FROM role_permissions WHERE role_id='EMPLOYEE' AND permission_id='directory.view'");await seed(db);assert.equal((await db.query("SELECT count(*)::int n FROM role_permissions WHERE role_id='EMPLOYEE' AND permission_id='directory.view'")).rows[0].n,0);
 });
 await pg.close();
});
