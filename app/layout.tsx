import type { Metadata } from 'next';
import './globals.css';
import './admin.css';
export const metadata: Metadata = {title:'Koyuncu Grup | Çalışan Portalı',description:'Koyuncu Grup çalışan portalı',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="tr"><body>{children}</body></html>}
