'use client';
import Directory from './Directory';
import GlobalSearch from './GlobalSearch';
import Agenda from './Agenda';
import {AgendaData} from '@/lib/meeting-shared';
import {NotificationBell} from './NotificationCenter';
import DashboardSuggestions from './DashboardSuggestions';
import {EngagementSummary,emptyEngagement} from '@/lib/engagement-shared';
import { useState, useEffect } from 'react';
import {LiveClock,MarketStrip,WeatherCard,useDashboardData} from './DashboardLiveData';
import {useRouter} from 'next/navigation';
import {AnnouncementBlock,EventBlock,NewsBlock} from './DashboardContentBlocks';
import {DashboardContent,contentDate,contentTime} from '@/lib/content-shared';
import AssetCards from './AssetCards';
import type {AssetSummary} from '@/lib/inventory-shared';
import Image from 'next/image';
import ProfileMenu from './ProfileMenu';
import {Identity,can,portalPermissions} from '@/lib/permissions';
import {Home, Megaphone, ClipboardList, Contact, Timer, FileText, CalendarDays, UserRound, CalendarPlus, MessageSquare, CircleHelp, Building2, PanelsTopLeft, Phone, Settings, Search, Bell, ChevronDown, ChevronRight, ChevronLeft, ArrowRight, Laptop, Files, ClipboardCheck, MapPin, CloudSun, Headphones, Plane, Lightbulb, UsersRound, CalendarClock, Mail, Menu, X, Leaf, Check, Send} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
const menus:[string,LucideIcon,string?][]=[['Ana Sayfa',Home],['Anketler',ClipboardCheck],['Duyurular',Megaphone],['Talepler',ClipboardList],['İletişim Rehberi',Contact],['Zimmetlerim',Timer],['Dokümanlar',FileText],['Etkinlikler',CalendarDays],['Ajandam',CalendarClock],['İK İşlemleri',UserRound],['Şirket Bilgileri',CalendarPlus],['Öneri & Bildirim',MessageSquare],['BT Destek',CircleHelp],['Sürdürülebilirlik',Building2],['Kurumsal İletişim',PanelsTopLeft],['Yardım & Destek',Phone],['Ayarlar',Settings]];
const sections:Record<string,string>={'Ana Sayfa':'top','Duyurular':'duyurular','İletişim Rehberi':'rehber','Zimmetlerim':'zimmet','Etkinlikler':'etkinlik','Öneri & Bildirim':'oneriler'};

const quick:[string,LucideIcon,string][]=[['Yeni Talep',FileText,'blue'],['BT Destek',Headphones,'purple'],['İK İşlemleri',UserRound,'green'],['Dokümanlar',FileText,'orange'],['İzin Talebi',Plane,'blue'],['Toplantı Odası',CalendarDays,'blue'],['Şirket Politikaları',FileText,'purple'],['Öneri & Bildirim',Lightbulb,'orange']];
function Photo({src,alt,className='',priority=false}:{src:string,alt:string,className?:string,priority?:boolean}){return <Image src={src} alt={alt} fill sizes="(max-width: 720px) 90vw, 40vw" className={className} priority={priority}/>}
function SectionTitle({title,onClick}:{title:string,onClick:()=>void}){return <div className="section-title"><h2>{title}</h2><button className="text-link" onClick={onClick}>Tümünü Gör <ArrowRight size={13}/></button></div>}
export default function Dashboard({actor,assets,content,counts={requests:0,approvals:0},engagement=emptyEngagement,agendaData}:{actor:Identity;assets:AssetSummary;content:DashboardContent;counts?:{requests:number;approvals:number};engagement?:EngagementSummary;agendaData?:AgendaData}){
 const liveData=useDashboardData(actor.id);
 const router=useRouter();const announcements=content.announcements,home=content.homepage;
 const [sidebar,setSidebar]=useState(false),[modal,setModal]=useState<{title:string,text:string}|null>(null);
 useEffect(()=>{if(!sidebar)return;const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setSidebar(false);};document.addEventListener('keydown',close);const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',close);document.body.style.overflow=old;};},[sidebar]);
 const unavailable=(title:string)=>setModal({title,text:'Bu bölüm henüz kullanıma açık değil.'});
 const navigate=(label:string)=>{const route:Record<string,string>={'Anketler':'/surveys','İletişim Rehberi':'/directory','Ajandam':'/calendar','Toplantı Odası':'/meeting-rooms','Öneri & Bildirim':'/suggestions','Talepler':'/requests','Taleplerim':'/requests','Yeni Talep':'/requests/new','İzin Talebi':'/leave/new','İK İşlemleri':'/leave','Onaylarım':'/approvals','Duyurular':'/announcements','Dokümanlar':'/documents','Etkinlikler':'/events','Zimmetlerim':'/my-assets','Şirket Politikaları':'/documents','BT Destek':'/requests/new','Yardım & Destek':'/requests/new','Kurumsal İletişim':'/corporate-communications'};if(route[label]){router.push(route[label]);setSidebar(false);return;}if(label==='Ayarlar'&&can(actor,'admin.view')){router.push('/admin');setSidebar(false);return;}setSidebar(false);const id=sections[label];if(id)document.getElementById(id)?.scrollIntoView({behavior:'smooth'});else unavailable(label)};
 return <div id="top" className="portal">
 {sidebar&&<button className="scrim" aria-label="Menüyü kapat" onClick={()=>setSidebar(false)}/>}
 <aside id="portal-sidebar" className={`sidebar ${sidebar?'open':''}`}><a href="#top" className="logo" aria-label="Koyuncu Grup ana sayfa"><Image src="/brand/koyuncu-grup.png" alt="Koyuncu Grup" width={132} height={46} priority/></a><button className="mobile-close" aria-label="Menüyü kapat" onClick={()=>setSidebar(false)}><X/></button><nav aria-label="Ana menü">{menus.filter(([name])=>!['Şirket Bilgileri','Sürdürülebilirlik'].includes(name)).filter(([name])=>name==='Anketler'?can(actor,'surveys.view_own'):name==='İletişim Rehberi'?can(actor,'directory.view')&&can(actor,'portal.directory.view'):name==='Ajandam'?can(actor,'calendar.view_own'):name==='Kurumsal İletişim'?can(actor,'corporate_communications.view'):name==='Ayarlar'?can(actor,'admin.view'):can(actor,portalPermissions.find(p=>p.name===name)?.id??'portal.home.view')).map(([label,Icon,badge],i)=><button key={label} className={`nav-item ${i===0?'active':''}`} onClick={()=>navigate(label)}><Icon size={20}/><span>{label}</span>{badge&&<b className="badge">{badge}</b>}</button>)}</nav><div className="sidebar-bottom"><Building2 size={66} strokeWidth={.6}/><span>Birlikte<br/>Daha Güçlüyüz</span></div></aside>
 <div className="workspace"><header className="header"><button className="hamburger" onClick={()=>setSidebar(true)} aria-label="Menüyü aç" aria-expanded={sidebar} aria-controls="portal-sidebar"><Menu/></button><GlobalSearch/><MarketStrip data={liveData}/><div className="header-right">{can(actor,'notifications.view_own')&&<NotificationBell initialUnread={engagement.unread}/>}<ProfileMenu actor={actor} portalStyle/><LiveClock/></div></header>
 <main className="dashboard"><div className="main-column"><section className="hero" aria-labelledby="welcome">{home.hero_active&&<Photo src={home.hero_image||'/images/hero/building.webp'} alt="Koyuncu Grup merkez binası" priority/>}<div className="hero-shade"/>{home.hero_active&&<div className="welcome"><b>{contentDate(new Date().toISOString())}</b><h1 id="welcome">{home.hero_title.replaceAll('{ad}',actor.first_name)}</h1><p>{home.hero_subtitle}</p></div>}<WeatherCard data={liveData}/></section>
 <section className="summary" aria-label="Özet bilgiler">{([['Taleplerim',String(counts.requests),'Açık Talep',Files,'blue'],['Zimmetlerim',String(assets.total),'Aktif Zimmet',Laptop,'blue'],['Yaklaşan Etkinlikler',String(content.upcomingEventCount??content.events.length),'Yaklaşan',CalendarDays,'orange'],['Onaylarım',String(counts.approvals),'Onay Bekliyor',FileText,'blue']] as [string,string,string,LucideIcon,string][]).map(([label,count,sub,Icon,color])=><button className="summary-card" key={label} onClick={()=>label==='Zimmetlerim'?navigate(label):label==='Yaklaşan Etkinlikler'?navigate('Etkinlikler'):navigate(label)}><div className={`summary-icon ${color}`}><Icon size={32}/></div><div><h3>{label}</h3><strong>{count}</strong><small>{sub}</small></div><ChevronRight size={16}/></button>)}</section>
 <div className="middle-grid">{can(actor,'portal.assets.view')&&<section className="panel assets" id="zimmet"><SectionTitle title="Zimmetlerim" onClick={()=>router.push('/my-assets')}/><AssetCards rows={assets.rows}/></section>}
 {can(actor,'calendar.view_own')&&agendaData&&<Agenda initial={agendaData} compact/>}
 {can(actor,'portal.announcements.view')&&<AnnouncementBlock rows={content.announcements} title={home.announcements_title}/>}
 {can(actor,'portal.events.view')&&<EventBlock rows={content.events} title={home.events_title}/>}</div>
 {can(actor,'portal.directory.view')&&can(actor,'directory.view')&&<Directory compact/>}</div>
 <aside className="right-column"><section className="office-banner">{home.corporate_active&&<><Photo src={home.corporate_image||'/images/hero/lounge.webp'} alt="Koyuncu Grup kurumsal görseli" priority/><div className="office-shade"/><blockquote style={{whiteSpace:'pre-line'}}>{home.corporate_quote}<cite>{home.corporate_caption}</cite></blockquote></>}</section>
 <section className="panel quick-access"><h2>Hızlı Erişim</h2><div className="quick-grid">{quick.map(([label,Icon,color])=><button className={color} key={label} onClick={()=>navigate(label)}><Icon size={28}/><span>{label}</span></button>)}</div></section>
 {can(actor,'suggestions.view_own')&&<DashboardSuggestions data={engagement} canCreate={can(actor,'suggestions.create')}/>}
 {can(actor,'portal.communications.view')&&<NewsBlock rows={content.news} title={home.news_title}/>}</aside></main></div>
 {modal&&<div className="modal-overlay" onClick={()=>setModal(null)}><section role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="modal" onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Escape')setModal(null)}}><button autoFocus className="modal-close" onClick={()=>setModal(null)} aria-label="Kapat"><X size={21}/></button><h2 id="dialog-title">{modal.title}</h2><p>{modal.text}</p><button className="primary-button" onClick={()=>setModal(null)}>Tamam</button></section></div>}
 </div>
}

