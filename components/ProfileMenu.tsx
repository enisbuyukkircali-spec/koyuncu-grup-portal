'use client';
import {useState} from 'react';
import Link from 'next/link';
import {UserRound,ChevronDown} from 'lucide-react';
import {Identity,can} from '@/lib/permissions';
export default function ProfileMenu({actor,portalStyle=false}:{actor:Identity;portalStyle?:boolean}){const[open,setOpen]=useState(false);return <div className="account-menu"><button className={portalStyle?"profile":"account-trigger"} onClick={()=>setOpen(!open)} aria-expanded={open}>{portalStyle?<><UserRound size={30}/><span><strong>{actor.first_name} {actor.last_name}</strong><small>{actor.username}</small></span><ChevronDown size={14}/></>:<>{actor.first_name} {actor.last_name} ▾</>}</button>{open&&<div className="account-dropdown">{can(actor,'portal.home.view')&&<Link href="/">Çalışan Portalı</Link>}{can(actor,'admin.view')&&<Link href="/admin">Admin Paneli</Link>}<Link href="/change-password">Şifremi Değiştir</Link><button onClick={async()=>{const r=await fetch('/api/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(r.ok)window.location.assign('/login');}}>Çıkış Yap</button></div>}</div>}
