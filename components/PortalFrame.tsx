'use client';
import {useState,useCallback,useEffect} from 'react';
import {usePathname} from 'next/navigation';
import Link from 'next/link';
import {Menu,ChevronRight} from 'lucide-react';
import {Identity,can} from '@/lib/permissions';
import PortalSidebar,{portalRoutes} from './PortalSidebar';
import ProfileMenu from './ProfileMenu';
import GlobalSearch from './GlobalSearch';
import {NotificationBell} from './NotificationCenter';
import {LiveClock} from './DashboardLiveData';
export default function PortalFrame({actor,children}:{actor:Identity;children:React.ReactNode}){const path=usePathname(),[open,setOpen]=useState(false),close=useCallback(()=>setOpen(false),[]);useEffect(()=>setOpen(false),[path]);const label=Object.entries(portalRoutes).find(([,r])=>r!=='/requests/new'&&(path===r||path.startsWith(r+'/')))?.[0]??({'/notifications':'Bildirimler','/meeting-rooms':'Toplantı Odaları','/orientation':'Oryantasyon','/approvals':'Onaylarım','/news':'Haberler','/brand-center':'Marka Merkezi','/asset-handover':'Teslim ve İade','/search':'Arama','/training':'Eğitimlerim'} as Record<string,string>)[ '/'+path.split('/')[1]]??'Çalışan Portalı';return <div className="portal portal-inner"><PortalSidebar actor={actor} open={open} onClose={close}/><div className="workspace"><header className="header"><button className="hamburger" aria-label="Menüyü aç" aria-expanded={open} aria-controls="portal-sidebar" onClick={()=>setOpen(true)}><Menu/></button><GlobalSearch/><div className="header-right">{can(actor,'notifications.view_own')&&<NotificationBell initialUnread={0}/>}<ProfileMenu actor={actor} portalStyle/><LiveClock/></div></header><div className="portal-breadcrumb"><Link href="/">Koyuncu Grup</Link><ChevronRight size={13}/><span>{label}</span><small>ÇALIŞAN PORTALI</small></div><div className="portal-page-body">{children}</div><footer className="portal-page-footer">Koyuncu Grup <span>Birlikte daha güçlüyüz.</span></footer></div></div>;}
