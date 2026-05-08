'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Tool } from '@/lib/tools';

interface SearchBoxProps {
  tools: Tool[];
  lang: string;
  placeholder: string;
  noResults: string;
  categories: Record<string, string>;
  variant: 'home' | 'page';
  onSearch?: (query: string) => void;
  dict: Record<string, { name: string; description: string }>;
}

interface SearchResult {
  tool: Tool;
  name: string;
  description: string;
  score: number;
}

function searchTools(
  tools: Tool[],
  query: string,
  dict: Record<string, { name: string; description: string }>
): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  const results: SearchResult[] = [];

  for (const tool of tools) {
    const t = dict[tool.id];
    if (!t) continue;
    let score = 0;

    if (t.name.toLowerCase().includes(q)) score += 3;
    for (const tag of tool.tags) {
      if (tag.toLowerCase().includes(q)) score += 2;
    }
    if (t.description.toLowerCase().includes(q)) score += 1;

    if (score > 0) {
      results.push({ tool, name: t.name, description: t.description, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

export function SearchBox({ tools, lang, placeholder, noResults, categories, variant, onSearch, dict }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleChange = useCallback((value: string) => {
    setQuery(value);
    if (variant === 'page') {
      onSearch?.(value);
      return;
    }
    const r = searchTools(tools, value, dict);
    setResults(r);
    setIsOpen(value.length >= 2);
  }, [variant, onSearch, tools, dict]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleSelect = (toolId: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/${lang}/tools/${toolId}`);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg)',
    color: 'var(--fg)',
    border: 'var(--border-width) solid var(--border)',
    padding: '0.75rem 1rem',
    fontFamily: 'var(--font-mono)',
    fontSize: '1rem',
    fontWeight: '700',
    outline: 'none',
    boxShadow: '4px 4px 0px var(--border)',
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: variant === 'home' ? '600px' : '100%' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
        onFocus={() => {
          if (variant === 'home' && query.length >= 2 && results.length > 0) {
            setIsOpen(true);
          }
        }}
      />

      {variant === 'home' && isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '0.5rem',
          background: 'var(--bg)',
          border: 'var(--border-width) solid var(--border)',
          boxShadow: '6px 6px 0px var(--border)',
          zIndex: 50,
          maxHeight: '400px',
          overflowY: 'auto',
        }}>
          {results.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', fontWeight: '700', opacity: 0.6 }}>
              {noResults}
            </div>
          ) : (
            results.map((r) => (
              <button
                key={r.tool.id}
                onClick={() => handleSelect(r.tool.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '1rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid var(--border)',
                  cursor: 'pointer',
                  color: 'var(--fg)',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '0.25rem' }}>
                  {r.name}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {r.tool.categories.map((catId) => (
                    <span key={catId} style={{
                      fontSize: '0.6rem',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      color: r.tool.color,
                    }}>
                      {categories[catId] ?? catId}
                    </span>
                  ))}
                  {r.tool.tags.slice(0, 4).map((tag) => (
                    <span key={tag} style={{
                      fontSize: '0.6rem',
                      fontWeight: '700',
                      opacity: 0.6,
                      textTransform: 'uppercase',
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
