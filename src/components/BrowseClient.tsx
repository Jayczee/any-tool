'use client';

import { useState, useMemo } from 'react';
import type { Tool } from '@/lib/tools';
import { SearchBox } from '@/components/SearchBox';
import { CategorySidebar } from '@/components/CategorySidebar';
import { ToolCard } from '@/components/ToolCard';

interface BrowseClientProps {
  tools: Tool[];
  lang: string;
  dict: {
    searchPlaceholder: string;
    noResults: string;
    categoriesTitle: string;
    toggleLabel: string;
  };
  categories: Record<string, string>;
  toolDict: Record<string, { name: string; description: string }>;
  typeLabels: { frontend: string; fullstack: string };
}

export function BrowseClient({ tools, lang, dict, categories, toolDict, typeLabels }: BrowseClientProps) {
  const [query, setQuery] = useState('');
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  const handleCategoryToggle = (catId: string) => {
    setActiveCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const filteredTools = useMemo(() => {
    const q = query.toLowerCase().trim();

    return tools.filter((tool) => {
      // Category filter (OR logic — if any selected category matches)
      if (activeCategories.length > 0) {
        const hasCat = tool.categories.some((c) => activeCategories.includes(c));
        if (!hasCat) return false;
      }

      // Text search
      if (q.length < 2) return true;

      const t = toolDict[tool.id];
      if (!t) return false;

      if (t.name.toLowerCase().includes(q)) return true;
      if (t.description.toLowerCase().includes(q)) return true;
      if (tool.tags.some((tag) => tag.toLowerCase().includes(q))) return true;

      return false;
    });
  }, [tools, query, activeCategories, toolDict]);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <SearchBox
          tools={tools}
          lang={lang}
          placeholder={dict.searchPlaceholder}
          noResults={dict.noResults}
          categories={categories}
          variant="page"
          onSearch={setQuery}
          dict={toolDict}
        />
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <div style={{ width: '220px', flexShrink: 0 }}>
          <CategorySidebar
            categories={categories}
            active={activeCategories}
            onToggle={handleCategoryToggle}
            title={dict.categoriesTitle}
            toggleLabel={dict.toggleLabel}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {filteredTools.length === 0 ? (
            <div style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              fontWeight: '800',
              fontSize: '1.2rem',
              opacity: 0.6,
              border: 'var(--border-width) dashed var(--border)',
            }}>
              {dict.noResults}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '2rem',
            }}>
              {filteredTools.map((tool) => {
                const t = toolDict[tool.id];
                const typeLabel = tool.type === 'frontend' ? typeLabels.frontend : typeLabels.fullstack;
                return (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    lang={lang}
                    name={t?.name ?? tool.name}
                    description={t?.description ?? tool.description}
                    categories={tool.categories.map((catId) => categories[catId] ?? catId)}
                    typeLabel={typeLabel}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
