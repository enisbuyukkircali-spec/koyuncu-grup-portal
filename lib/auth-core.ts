import {database,transaction,lock,DB} from './db';
import {AppError,digest,newToken,hashPassword,verifyPassword,validatePassword} from './security';
import {Identity,allPermissionIds} from './permissions';
export const SESSION_COOKIE=process.env.NODE_ENV==='production'?'__Host-kg_session':'kg_session';
export const LOGIN_ERROR='Kullanıcı adı/e-posta veya şifre hatalı.';
const dummy='scrypt$131072$8$1$0123456789abcdef0123456789abcdef$'+'0'.repeat(128);
// One database round trip per identity, with a fresh authorization snapshot.
const identityColumns=`u.id,u.first_name,u.last_name,u.username,u.email,u.photo,u.must_change_password,
 ARRAY(SELECT r.id FROM roles r JOIN user_roles ur ON r.id=ur.role_id WHERE ur.user_id=u.id AND r.active=true) roles,
 ARRAY(SELECT DISTINCT rp.permission_id FROM role_permissions rp JOIN user_roles ur ON ur.role_id=rp.role_id JOIN roles r ON r.id=rp.role_id WHERE ur.user_id=u.id AND r.active=true) permissions,
 COALESCE((SELECT json_agg(json_build_object('permission_id',o.permission_id,'allowed',o.allowed)) FROM user_permission_overrides o WHERE o.user_id=u.id),'[]'::json) overrides`;
type IdentityRow=Identity & {overrides:{permission_id:string;allowed:boolean}[]};
function resolvedIdentity(row:IdentityRow|undefined):Identity|null{
 if(!row)return null;
 const {overrides,...actor}=row,perms=new Set(actor.permissions);
 for(const p of overrides)p.allowed?perms.add(p.permission_id):perms.delete(p.permission_id);
 return {...actor,permissions:actor.roles.includes('SUPER_ADMIN')?allPermissionIds:[...perms]};
}
export async function identityFor(db:DB,id:string):Promise<Identity|null>{
 return resolvedIdentity((await db.query<IdentityRow>(`SELECT ${identityColumns} FROM users u WHERE u.id=$1 AND u.status IN('ACTIVE','ON_LEAVE') AND u.archived_at IS NULL`,[id])).rows[0]);
}
export async function sessionIdentity(token:string|undefined):Promise<Identity|null>{
 if(!token||token.length!==43)return null;
 return resolvedIdentity((await database().query<IdentityRow>(`SELECT ${identityColumns} FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.status IN('ACTIVE','ON_LEAVE') AND u.archived_at IS NULL`,[digest(token)])).rows[0]);
}
async function limit(key:string,max:number){const rows=(await database().query<{count:number}>(`INSERT INTO login_limits(key_hash,count,window_end) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key_hash) DO UPDATE SET count=CASE WHEN login_limits.window_end<now() THEN 1 ELSE login_limits.count+1 END,window_end=CASE WHEN login_limits.window_end<now() THEN now()+interval '15 minutes' ELSE login_limits.window_end END RETURNING count`,[digest(key)])).rows;if(rows[0].count>max)throw new AppError(429,'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.');}
export async function login(identifier:string,password:string,remember:boolean,ip:string){
 if(typeof identifier!=='string'||identifier.length>254||typeof password!=='string'||password.length>128)throw new AppError(401,LOGIN_ERROR);
 const normalized=identifier.trim().toLowerCase();await limit('account:'+normalized,10);await limit('ip:'+ip,50);
 const row=(await database().query<{id:string;password_hash:string}>('SELECT u.id,c.password_hash FROM users u JOIN credentials c ON c.user_id=u.id WHERE (u.username=$1 OR u.email=$1) AND u.archived_at IS NULL',[normalized])).rows[0];
 const valid=await verifyPassword(password,row?.password_hash??dummy);if(!row||!valid)throw new AppError(401,LOGIN_ERROR);
 return transaction(async db=>{await lock(db);const actor=await identityFor(db,row.id);if(!actor)throw new AppError(401,LOGIN_ERROR);const current=(await db.query<{password_hash:string}>('SELECT password_hash FROM credentials WHERE user_id=$1',[row.id])).rows[0];if(current.password_hash!==row.password_hash)throw new AppError(401,LOGIN_ERROR);const token=newToken(),seconds=remember?30*24*3600:8*3600;await db.query('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)',[digest(token),row.id,new Date(Date.now()+seconds*1000)]);await db.query('UPDATE users SET last_login=now() WHERE id=$1',[row.id]);return {token,seconds,actor};});
}
export async function logout(token:string){await database().query('DELETE FROM sessions WHERE token_hash=$1',[digest(token)]);}
export async function changePassword(userId:string,current:string,next:string){await limit('password-change:'+userId,10);validatePassword(next);if(current===next)throw new AppError(400,'Yeni şifre mevcut şifreden farklı olmalıdır.');const row=(await database().query<{password_hash:string}>('SELECT password_hash FROM credentials WHERE user_id=$1',[userId])).rows[0];if(!row||!(await verifyPassword(current,row.password_hash)))throw new AppError(400,'Mevcut şifre hatalı.');const hashed=await hashPassword(next);return transaction(async db=>{await lock(db);const live=(await db.query<{password_hash:string}>('SELECT password_hash FROM credentials WHERE user_id=$1',[userId])).rows[0];if(live.password_hash!==row.password_hash||!await identityFor(db,userId))throw new AppError(401,'Oturumunuz değişti. Yeniden giriş yapın.');await db.query('UPDATE credentials SET password_hash=$1,changed_at=now() WHERE user_id=$2',[hashed,userId]);await db.query('UPDATE users SET must_change_password=false,updated_at=now() WHERE id=$1',[userId]);await db.query('DELETE FROM sessions WHERE user_id=$1',[userId]);const token=newToken();await db.query('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)',[digest(token),userId,new Date(Date.now()+8*3600*1000)]);return token;});}
