'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function LangSwitcher({ currentLang }: { currentLang: string }) {
  const pathname = usePathname();
  const targetLang = currentLang === 'en' ? 'zh' : 'en';
  const targetPath = pathname.replace(`/${currentLang}`, `/${targetLang}`);

  return (
    <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 100 }}>
      <Link
        href={targetPath}
        style={{
          display: 'inline-block',
          background: 'var(--bg)',
          color: 'var(--fg)',
          border: 'var(--border-width) solid var(--border)',
          padding: '0.5rem 1rem',
          fontWeight: '800',
          fontSize: '0.85rem',
          textTransform: 'uppercase',
          boxShadow: '3px 3px 0px var(--border)',
          textDecoration: 'none'
        }}
      >
        {targetLang === 'zh' ? '中文' : 'EN'}
      </Link>
    </div>
  );
}
