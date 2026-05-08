import { notFound } from 'next/navigation';
import { getToolById } from '@/lib/tools';
import { getDictionary, hasLocale, type Dictionary } from '../../dictionaries';
import Link from 'next/link';
import { JsonFormatter } from '@/components/tools/JsonFormatter';
import { ImageCrusher } from '@/components/tools/ImageCrusher';
import { RegexLab } from '@/components/tools/RegexLab';
import { VideoTrimmer } from '@/components/tools/VideoTrimmer';
import { VideoSpeed } from '@/components/tools/VideoSpeed';

interface ToolPageProps {
  params: Promise<{ lang: string; id: string }>;
}

export async function generateMetadata({ params }: ToolPageProps) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  const tool = getToolById(id);
  if (!tool) return {};
  const t = dict.tools[id as keyof typeof dict.tools];
  return {
    title: t?.name ?? tool.name,
    description: t?.description ?? tool.description,
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const tool = getToolById(id);
  if (!tool) notFound();

  const t = dict.tools[id as keyof typeof dict.tools];
  const typeLabel = tool.type === 'frontend' ? dict.toolPage.type : dict.toolPage.typeFullstack;

  const renderTool = () => {
    switch (id) {
      case 'json-formatter':
        return <JsonFormatter labels={dict.jsonFormatter} />;
      case 'image-optimizer':
        return <ImageCrusher labels={dict.imageCrusher} />;
      case 'regex-tester':
        return <RegexLab labels={dict.regexLab} lang={lang} />;
      case 'video-trimmer':
        return <VideoTrimmer labels={dict.videoTrimmer} />;
      case 'video-speeder':
        return <VideoSpeed labels={dict.videoSpeeder} />;
      default:
        return (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem' }}>{dict.toolPage.underConstruction}</h2>
            <p>{dict.toolPage.underConstructionDesc.replace('{name}', t?.name ?? tool.name)}</p>
          </div>
        );
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <nav style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href={`/${lang}`} style={{ fontWeight: '800', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ← {dict.toolPage.backToGallery}
        </Link>
      </nav>

      <header style={{ marginBottom: '4rem' }}>
        <div style={{
          fontSize: '0.8rem',
          fontWeight: '800',
          textTransform: 'uppercase',
          color: tool.color,
          marginBottom: '0.5rem',
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          {tool.categories.map((catId) => (
            <span key={catId}>{dict.categories[catId as keyof typeof dict.categories] ?? catId}</span>
          ))} // {typeLabel}
        </div>
        {tool.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
            {tool.tags.map((tag) => (
              <span key={tag} style={{
                fontSize: '0.65rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                padding: '0.15rem 0.5rem',
                border: '2px solid var(--border)',
              }}>
                {dict.tags[tag as keyof typeof dict.tags] ?? tag}
              </span>
            ))}
          </div>
        )}
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>{t?.name ?? tool.name}</h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '800px', opacity: 0.8 }}>{t?.description ?? tool.description}</p>
      </header>

      <div className="brutalist-card" style={{ padding: '0' }}>
        {renderTool()}
      </div>
    </main>
  );
}
