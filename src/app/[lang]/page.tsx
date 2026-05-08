import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDictionary, hasLocale } from './dictionaries';
import { tools } from '@/lib/tools';
import { LangSwitcher } from '@/components/LangSwitcher';
import { SearchBox } from '@/components/SearchBox';
import { ToolCard } from '@/components/ToolCard';

interface HomePageProps {
  params: Promise<{ lang: string }>;
}

export default async function Home({ params }: HomePageProps) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <main style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <LangSwitcher currentLang={lang} />

      <header style={{ marginBottom: '4rem', position: 'relative' }}>
        <h1 style={{ fontSize: 'clamp(3rem, 10vw, 8rem)', lineHeight: '0.9', marginBottom: '1rem' }}>
          {dict.home.heroLine1}<br /><span style={{ color: 'var(--accent)' }}>{dict.home.heroLine2}</span>
        </h1>
        <p style={{ fontSize: '1.5rem', maxWidth: '600px', fontWeight: '500', marginBottom: '2rem' }}>
          {dict.home.subtitle}
        </p>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <SearchBox
            tools={tools}
            lang={lang}
            placeholder={dict.home.searchPlaceholder}
            noResults={dict.home.noResults}
            categories={dict.categories}
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

        <div style={{
          position: 'absolute',
          top: '0',
          right: '0',
          width: '150px',
          height: '150px',
          background: 'var(--secondary)',
          border: 'var(--border-width) solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'rotate(15deg)',
          fontWeight: '800',
          fontSize: '1.2rem',
          textAlign: 'center'
        }}>
          {dict.home.betaBadge}
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2.5rem' }}>
        {tools.map((tool) => {
          const t = dict.tools[tool.id as keyof typeof dict.tools];
          const typeLabel = tool.type === 'frontend' ? dict.toolPage.type : dict.toolPage.typeFullstack;
          return (
            <ToolCard
              key={tool.id}
              tool={tool}
              lang={lang}
              name={t?.name ?? tool.name}
              description={t?.description ?? tool.description}
              categories={tool.categories.map((catId) => dict.categories[catId as keyof typeof dict.categories] ?? catId)}
              typeLabel={typeLabel}
            />
          );
        })}
      </section>

      <footer style={{ marginTop: '10rem', padding: '4rem 0', borderTop: 'var(--border-width) solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h3 style={{ fontSize: '2rem' }}>ANY-TOOL</h3>
            <p>© 2026 {dict.home.footer.tagline}</p>
          </div>
          <div style={{ display: 'flex', gap: '2rem', fontWeight: '700' }}>
            <a href="#">{dict.home.footer.github}</a>
            <a href="#">{dict.home.footer.twitter}</a>
            <a href="#">{dict.home.footer.docs}</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
