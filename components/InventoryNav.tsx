import Link from 'next/link';
import {Identity,can} from '@/lib/permissions';
export default function InventoryNav({actor}:{actor:Identity}){const links=[['inventory.view','/admin/inventory','Envanter Listesi'],['inventory_categories.view','/admin/inventory/categories','Kategoriler'],['assignments.view','/admin/assignments','Zimmetler']].filter(([p])=>can(actor,p));return links.length?<><small>ENVANTER</small>{links.map(([,href,label])=><Link key={href} href={href}>{label}</Link>)}</>:null;}
