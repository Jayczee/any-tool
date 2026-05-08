import Link from 'next/link';
import type { Tool } from '@/lib/tools';

interface ToolCardProps {
  tool: Tool;
  lang: string;
  name: string;
  description: string;
  categories: string[];
  typeLabel: string;
  tagLabels: Record<string, string>;
}

export function ToolCard({ tool, lang, name, description, categories, typeLabel, tagLabels }: ToolCardProps) {
  return (
    <Link href={`/${lang}/tools/${tool.id}`} style={{ display: 'block' }}>
      <div className="brutalist-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          fontSize: '0.8rem',
          fontWeight: '800',
          textTransform: 'uppercase',
          color: tool.color,
          marginBottom: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          {categories.map((cat) => (
            <span key={cat}>{cat}</span>
          ))}
          <span>// {typeLabel}</span>
        </div>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{name}</h2>
        <p style={{ marginBottom: '1.5rem', flexGrow: 1, opacity: 0.8 }}>{description}</p>
        {tool.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
            {tool.tags.map((tag) => (
              <span key={tag} style={{
                fontSize: '0.65rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                padding: '0.15rem 0.5rem',
                border: '2px solid var(--border)',
                background: 'var(--bg)',
              }}>
                {tagLabels[tag] ?? tag}
              </span>
            ))}
          </div>
        )}
        <span className="brutalist-button" style={{ textAlign: 'center', alignSelf: 'flex-start', display: 'inline-block' }}>
          Launch
        </span>
      </div>
    </Link>
  );
}
