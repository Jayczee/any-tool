import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDictionary, hasLocale } from './dictionaries';
import { tools } from '@/lib/tools';
import { LangSwitcher } from '@/components/LangSwitcher';

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

      <header style={{ marginBottom: '6rem', position: 'relative' }}>
        <h1 style={{ fontSize: 'clamp(3rem, 10vw, 8rem)', lineHeight: '0.9', marginBottom: '1rem' }}>
          {dict.home.heroLine1}<br /><span style={{ color: 'var(--accent)' }}>{dict.home.heroLine2}</span>
        </h1>
        <p style={{ fontSize: '1.5rem', maxWidth: '600px', fontWeight: '500' }}>
          {dict.home.subtitle}
        </p>

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
            <Link key={tool.id} href={`/${lang}/tools/${tool.id}`} style={{ display: 'block' }}>
              <div className="brutalist-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  color: tool.color,
                  marginBottom: '1rem'
                }}>
                  {t?.category ?? tool.category} // {typeLabel}
                </div>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{t?.name ?? tool.name}</h2>
                <p style={{ marginBottom: '2rem', flexGrow: 1, opacity: 0.8 }}>{t?.description ?? tool.description}</p>
                <span className="brutalist-button" style={{ textAlign: 'center', alignSelf: 'flex-start', display: 'inline-block' }}>
                  Launch
                </span>
              </div>
            </Link>
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
