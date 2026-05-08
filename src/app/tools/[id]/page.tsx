import { notFound } from 'next/navigation';
import { getToolById } from '@/lib/tools';
import Link from 'next/link';
import { JsonFormatter } from '@/components/tools/JsonFormatter';
import { ImageCrusher } from '@/components/tools/ImageCrusher';

interface ToolPageProps {
  params: Promise<{ id: string }>;
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { id } = await params;
  const tool = getToolById(id);

  if (!tool) {
    notFound();
  }

  const renderTool = () => {
    switch (id) {
      case 'json-formatter':
        return <JsonFormatter />;
      case 'image-optimizer':
        return <ImageCrusher />;
      default:
        return (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem' }}>Tool Under Construction</h2>
            <p>We are working hard to bring {tool.name} to life.</p>
          </div>
        );
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <nav style={{ marginBottom: '4rem' }}>
        <Link href="/" style={{ fontWeight: '800', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ← Back to Gallery
        </Link>
      </nav>

      <header style={{ marginBottom: '4rem' }}>
        <div style={{ 
          fontSize: '0.8rem', 
          fontWeight: '800', 
          textTransform: 'uppercase', 
          color: tool.color,
          marginBottom: '0.5rem' 
        }}>
          {tool.category} // {tool.type}
        </div>
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>{tool.name}</h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '800px', opacity: 0.8 }}>{tool.description}</p>
      </header>

      <div className="brutalist-card" style={{ padding: '0' }}>
        {renderTool()}
      </div>
    </main>
  );
}
