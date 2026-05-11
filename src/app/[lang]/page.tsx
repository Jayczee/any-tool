import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDictionary, hasLocale } from './dictionaries';
import { tools } from '@/lib/tools';
import { LangSwitcher } from '@/components/LangSwitcher';
import { SearchBox } from '@/components/SearchBox';

interface HomePageProps {
  params: Promise<{ lang: string }>;
}

export default async function Home({ params }: HomePageProps) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <main style={{ padding: '6rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
      <LangSwitcher currentLang={lang} />

      <header>
        <h1 style={{ fontSize: 'clamp(3rem, 10vw, 8rem)', lineHeight: '0.9', marginBottom: '1rem' }}>
          {dict.home.heroLine1}<br /><span style={{ color: 'var(--accent)' }}>{dict.home.heroLine2}</span>
        </h1>
        <p style={{ fontSize: '1.5rem', maxWidth: '600px', fontWeight: '500', marginBottom: '2.5rem' }}>
          {dict.home.subtitle}
        </p>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <SearchBox
            tools={tools}
            lang={lang}
            placeholder={dict.home.searchPlaceholder}
            noResults={dict.home.noResults}
            categories={dict.categories}
            tagLabels={dict.tags}
            variant="home"
            dict={dict.tools}
          />
          <Link
            href={`/${lang}/tools`}
            className="brutalist-button"
            style={{ background: 'black', color: 'white', whiteSpace: 'nowrap', textDecoration: 'none' }}
          >
            {dict.home.browseAll}
          </Link>
        </div>
      </header>

      <footer style={{ marginTop: '8rem', paddingTop: '2rem', borderTop: 'var(--border-width) solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', opacity: 0.4 }}>ANY-TOOL</span>
        <a href="https://github.com/Jayczee/any-tool" target="_blank" style={{ fontWeight: '800', fontSize: '0.75rem', opacity: 0.5 }}>GitHub →</a>
      </footer>
    </main>
  );
}
