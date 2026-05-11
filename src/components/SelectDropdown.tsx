'use client';

import { useState, useRef, useEffect } from 'react';

interface Option {
  name: string;
  desc: string;
  value: string;
}

interface SelectDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export function SelectDropdown({ options, value, onChange, label }: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '0.6rem 0.75rem',
          background: 'var(--bg)',
          color: 'var(--fg)',
          border: 'var(--border-width) solid var(--border)',
          fontWeight: '800',
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          cursor: 'pointer',
          fontFamily: 'inherit',
          boxShadow: '3px 3px 0px var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
          {selected.name}
        </span>
        <span style={{
          fontSize: '0.65rem', opacity: 0.4, flexShrink: 0, lineHeight: 1,
        }}>
          {options.length}
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '0.3rem',
          maxHeight: '360px',
          overflowY: 'auto',
          background: 'var(--bg)',
          border: 'var(--border-width) solid var(--border)',
          boxShadow: '6px 6px 0px var(--border)',
          zIndex: 100,
        }}>
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value || '__custom__'}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.55rem 0.75rem',
                  background: isActive ? 'var(--accent)' : 'transparent',
                  color: isActive ? 'white' : 'var(--fg)',
                  border: 'none',
                  borderBottom: '1.5px solid var(--border)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{
                  fontWeight: '800',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  marginBottom: '0.15rem',
                }}>
                  {opt.name}
                </div>
                <div style={{
                  fontSize: '0.6rem',
                  fontWeight: '600',
                  opacity: isActive ? 0.8 : 0.45,
                  lineHeight: 1.4,
                }}>
                  {opt.desc}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
