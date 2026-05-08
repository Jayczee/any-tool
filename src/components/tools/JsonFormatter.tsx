'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface JsonFormatterLabels {
  input: string;
  output: string;
  placeholder: string;
  format: string;
  minify: string;
  clear: string;
  copyToClipboard: string;
  errorPrefix: string;
}

export function JsonFormatter({ labels }: { labels: JsonFormatterLabels }) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const formatJson = () => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  };

  const minifyJson = () => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        borderBottom: 'var(--border-width) solid var(--border)',
        minHeight: '500px'
      }}>
        <div style={{ borderRight: 'var(--border-width) solid var(--border)', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontWeight: '800', marginBottom: '0.5rem', display: 'block' }}>{labels.input}</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={labels.placeholder}
            style={{
              flexGrow: 1,
              width: '100%',
              background: 'transparent',
              border: 'none',
              resize: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '1rem',
              outline: 'none',
              color: 'inherit'
            }}
          />
        </div>
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.02)' }}>
          <label style={{ fontWeight: '800', marginBottom: '0.5rem', display: 'block' }}>{labels.output}</label>
          <div style={{ flexGrow: 1, position: 'relative' }}>
            <textarea
              readOnly
              value={output}
              style={{
                width: '100%',
                height: '100%',
                background: 'transparent',
                border: 'none',
                resize: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem',
                outline: 'none',
                color: error ? 'var(--accent)' : 'inherit'
              }}
            />
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    bottom: '1rem',
                    left: '1rem',
                    right: '1rem',
                    background: 'var(--accent)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    fontWeight: '700',
                    border: '2px solid black'
                  }}
                >
                  {labels.errorPrefix}: {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--bg)' }}>
        <button onClick={formatJson} className="brutalist-button">{labels.format}</button>
        <button onClick={minifyJson} className="brutalist-button" style={{ background: 'var(--secondary)', color: 'black' }}>{labels.minify}</button>
        <button
          onClick={() => { setInput(''); setOutput(''); setError(null); }}
          className="brutalist-button"
          style={{ background: 'white', color: 'black' }}
        >
          {labels.clear}
        </button>
        <div style={{ flexGrow: 1 }} />
        {output && (
          <button onClick={copyToClipboard} className="brutalist-button" style={{ background: 'black', color: 'white' }}>
            {labels.copyToClipboard}
          </button>
        )}
      </div>
    </div>
  );
}
