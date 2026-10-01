'use client';
import Link from 'next/link';
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){return <main className="auth-info"><section className="auth-box" role="alert"><small>KOYUNCU GRUP · 500</small><h1>Bir Sorun Oluştu</h1><p>İşlem şu anda tamamlanamıyor. Lütfen yeniden deneyin.</p><div className="a-actions"><button className="a-primary" onClick={reset}>Tekrar Dene</button><Link href="/">Ana Sayfaya Dön</Link></div></section></main>;}
