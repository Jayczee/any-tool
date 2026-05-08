import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDictionary, hasLocale } from '../dictionaries';
import { tools } from '@/lib/tools';
import { ToolCard } from '@/components/ToolCard';
import { BrowseClient } from '@/components/BrowseClient';

interface BrowsePageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: BrowsePageProps) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: `${dict.browse.title} | ANY-TOOL`,
  };
}

export default async function BrowsePage({ params }: BrowsePageProps) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <nav style={{ marginBottom: '2rem' }}>
        <Link
          href={`/${lang}`}
          style={{
            fontWeight: '800',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            color: 'var(--fg)',
          }}
        >
          ← {dict.browse.back}
        </Link>
      </nav>

      <BrowseClient
        tools={tools}
        lang={lang}
        dict={{
          searchPlaceholder: dict.browse.searchPlaceholder,
          noResults: dict.browse.noResults,
          categoriesTitle: dict.browse.categories,
          toggleLabel: dict.browse.toggleSidebar,
        }}
        categories={dict.categories}
        tagLabels={dict.tags}
        toolDict={dict.tools}
        typeLabels={{ frontend: dict.toolPage.type, fullstack: dict.toolPage.typeFullstack }}
      />
    </main>
  );
}
