import {randomBytes,scrypt as scryptCallback,timingSafeEqual,createHash} from 'node:crypto';
export class AppError extends Error{constructor(public status:number,message:string){super(message);}}
export const passwordMinimum=()=>Math.max(6,Number(process.env.PASSWORD_MIN_LENGTH)||6);
export function validatePassword(value:unknown):asserts value is string{if(typeof value!=='string'||value.length<passwordMinimum()||value.length>128)throw new AppError(400,`Şifre ${passwordMinimum()}–128 karakter arasında olmalıdır.`);}
function derive(password:string,salt:string){return new Promise<Buffer>((resolve,reject)=>scryptCallback(password,salt,64,{N:131072,r:8,p:1,maxmem:192*1024*1024},(e,key)=>e?reject(e):resolve(key)));}
export async function hashPassword(password:string){validatePassword(password);const salt=randomBytes(16).toString('hex');return `scrypt$131072$8$1$${salt}$${(await derive(password,salt)).toString('hex')}`;}
export async function verifyPassword(password:string,encoded:string){const parts=encoded.split('$');if(parts.length!==6||parts.slice(0,4).join('$')!=='scrypt$131072$8$1')return false;const actual=await derive(password,parts[4]);const expected=Buffer.from(parts[5],'hex');return expected.length===actual.length&&timingSafeEqual(actual,expected);}
export const temporaryPassword=()=>randomBytes(12).toString('base64url');
export const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
export const newToken=()=>randomBytes(32).toString('base64url');
export function assertOrigin(request:Request){const origin=request.headers.get('origin');const allowed=new Set([new URL(request.url).origin]);if(process.env.APP_URL)allowed.add(new URL(process.env.APP_URL).origin);if(!origin||!allowed.has(origin)||request.headers.get('sec-fetch-site')==='cross-site')throw new AppError(403,'İstek kaynağı doğrulanamadı.');if(!request.headers.get('content-type')?.startsWith('application/json'))throw new AppError(415,'Geçersiz istek biçimi.');}
export async function readJSON(request:Request){assertOrigin(request);const raw=await request.text();if(raw.length>350000)throw new AppError(413,'Gönderilen veri çok büyük.');try{const value=JSON.parse(raw);if(!value||Array.isArray(value)||typeof value!=='object')throw Error();return value;}catch{throw new AppError(400,'Gönderilen veri okunamadı.');}}
