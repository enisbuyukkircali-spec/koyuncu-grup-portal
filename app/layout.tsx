import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Koyuncu Grup | Çalışan Portalı',description:'Koyuncu Grup çalışan portalı ana sayfa demosu',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="tr"><body>{children}</body></html>}
