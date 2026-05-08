'use client';

import { useState } from 'react';

interface CategorySidebarProps {
  categories: Record<string, string>;
  active: string[];
  onToggle: (categoryId: string) => void;
  title: string;
  toggleLabel: string;
}

export function CategorySidebar({ categories, active, onToggle, title, toggleLabel }: CategorySidebarProps) {
  const [open, setOpen] = useState(true);

  const categoryIds = Object.keys(categories);

  return (
    <div style={{
      border: 'var(--border-width) solid var(--border)',
      boxShadow: '4px 4px 0px var(--border)',
      background: 'var(--bg)',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          background: 'var(--fg)',
          color: 'var(--bg)',
          border: 'none',
          borderBottom: open ? 'var(--border-width) solid var(--border)' : 'none',
          fontWeight: '800',
          fontSize: '0.85rem',
          textTransform: 'uppercase',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {categoryIds.map((catId) => {
            const isActive = active.includes(catId);
            return (
              <button
                key={catId}
                onClick={() => onToggle(catId)}
                style={{
                  textAlign: 'left',
                  padding: '0.5rem 0.75rem',
                  background: isActive ? 'var(--accent)' : 'transparent',
                  color: isActive ? 'white' : 'var(--fg)',
                  border: '2px solid var(--border)',
                  fontWeight: '800',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: isActive ? '2px 2px 0px var(--border)' : 'none',
                }}
              >
                {categories[catId]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
