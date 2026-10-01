import {AppError} from './security';
import {uploadedImageValid} from './upload';
import {brandFileTypes} from './brand-shared';
// SVG is restricted to static vector geometry, never rendered inline or as a preview.
function staticSVG(text:string){
 if(text.length>200000||/[&]|<!|<\?(?!xml\s)/i.test(text))return false;
 const source=text.replace(/^\s*<\?xml\s[^?]*\?>/,'');if(!/^\s*<svg\b/i.test(source)||!/<\/svg>\s*$/i.test(source))return false;
 const tags=new Set(['svg','g','path','rect','circle','ellipse','line','polyline','polygon','title','desc']);
 const attrs=new Set(['xmlns','viewBox','width','height','x','y','x1','y1','x2','y2','cx','cy','r','rx','ry','d','points','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-miterlimit','fill-rule','clip-rule','opacity','fill-opacity','stroke-opacity','transform','id','version']);
 const stack:string[]=[];let offset=0;
 for(const m of source.matchAll(/<([^<>]+)>/g)){if(/[<>]/.test(source.slice(offset,m.index)))return false;offset=m.index!+m[0].length;const tag=m[1];const closing=tag.startsWith('/');const self=/\/\s*$/.test(tag);const n=tag.match(/^\/?([A-Za-z][A-Za-z0-9-]*)\b/);if(!n||!tags.has(n[1]))return false;if(closing){if(tag!=='/'+n[1]||stack.pop()!==n[1])return false;continue;}let rest=tag.slice(n[0].length).replace(/\/\s*$/,'');while(rest.trim()){const a=rest.match(/^\s+([A-Za-z][\w:-]*)\s*=\s*("[^"]*"|'[^']*')/);if(!a||!attrs.has(a[1]))return false;const value=a[2].slice(1,-1);if(/[<>]|url\s*\(|javascript:|data:|https?:/i.test(value)&&!(a[1]==='xmlns'&&value==='http://www.w3.org/2000/svg'))return false;rest=rest.slice(a[0].length);}if(!self)stack.push(n[1]);}
 return !stack.length&&!/[<>]/.test(source.slice(offset));
}
function officeZip(b:Buffer,kind:'ppt'|'word'){
 const end=b.lastIndexOf(Buffer.from('504b0506','hex'));if(end<0||end+22>b.length||b.readUInt16LE(end+4)||b.readUInt16LE(end+6))return false;
 const count=b.readUInt16LE(end+10),start=b.readUInt32LE(end+16),size=b.readUInt32LE(end+12);if(!count||count>1000||start+size!==end||end+22+b.readUInt16LE(end+20)!==b.length)return false;
 let offset=start,total=0;const names=new Set<string>();
 for(let i=0;i<count;i++){if(offset+46>end||b.readUInt32LE(offset)!==0x02014b50)return false;const flags=b.readUInt16LE(offset+8),method=b.readUInt16LE(offset+10),len=b.readUInt16LE(offset+28),extra=b.readUInt16LE(offset+30),comment=b.readUInt16LE(offset+32),local=b.readUInt32LE(offset+42);if(flags&1||![0,8].includes(method)||local+30>start||b.readUInt32LE(local)!==0x04034b50)return false;total+=b.readUInt32LE(offset+24);if(total>10000000||offset+46+len+extra+comment>end)return false;const name=b.subarray(offset+46,offset+46+len).toString('utf8');if(/(^\/|\\|(^|\/)\.\.(\/|$)|vba|activex|embeddings|\.exe$|\.js$)/i.test(name))return false;names.add(name);offset+=46+len+extra+comment;}
 return offset===end&&names.has('[Content_Types].xml')&&names.has(kind==='ppt'?'ppt/presentation.xml':'word/document.xml');
}
export function validateBrandFile(name:string,type:string,data:string){
 if(!Object.hasOwn(brandFileTypes,type)||name.length>150||!name||/[\x00-\x1f/\\]/.test(name)||!data||data.length>270000||!/^[A-Za-z0-9+/]+={0,2}$/.test(data))throw new AppError(400,'Dosya adı veya biçimi geçersiz.');
 const b=Buffer.from(data,'base64');if(!b.length||b.length>200000)throw new AppError(400,'Mevcut dosya sınırı 200 KB. Daha küçük bir dosya seçin.');
 const ext=name.split('.').pop()?.toLowerCase();let valid=false;
 if(['image/png','image/jpeg','image/webp'].includes(type))valid=({ 'image/png':['png'],'image/jpeg':['jpg','jpeg'],'image/webp':['webp']}[type]??[]).includes(ext??'')&&uploadedImageValid('data:'+type+';base64,'+data);
 else if(type==='image/svg+xml')valid=ext==='svg'&&staticSVG(b.toString('utf8'));
 else if(type==='application/pdf')valid=ext==='pdf'&&b.subarray(0,5).toString()==='%PDF-';
 else valid=(ext==='pptx'&&type.endsWith('presentation')&&officeZip(b,'ppt'))||(ext==='docx'&&type.endsWith('document')&&officeZip(b,'word'));
 if(!valid)throw new AppError(400,'Geçersiz veya desteklenmeyen dosya içeriği. SVG yalnızca statik vektör şekilleri içerebilir; Office dosyaları makrosuz PPTX/DOCX olmalıdır.');
 return b.length;
}
