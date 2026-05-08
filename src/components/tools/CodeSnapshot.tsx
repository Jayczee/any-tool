'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import hljs from 'highlight.js';
import html2canvas from 'html2canvas';
import 'highlight.js/styles/github-dark.min.css';

interface CodeSnapshotLabels {
  code: string; language: string; theme: string; fontFamily: string; fontSize: string;
  lineNumbers: string; windowStyle: string; windowTitle: string; windowTheme: string;
  padding: string; capture: string; copyImage: string; copied: string;
  macos: string; brutalist: string;
  dark: string; light: string; placeholder: string;
}

const LANGUAGES = [
  { id: 'auto', name: 'Auto' },
  { id: 'javascript', name: 'JavaScript' }, { id: 'typescript', name: 'TypeScript' },
  { id: 'python', name: 'Python' }, { id: 'rust', name: 'Rust' },
  { id: 'go', name: 'Go' }, { id: 'java', name: 'Java' }, { id: 'c', name: 'C' },
  { id: 'cpp', name: 'C++' }, { id: 'csharp', name: 'C#' }, { id: 'ruby', name: 'Ruby' },
  { id: 'php', name: 'PHP' }, { id: 'swift', name: 'Swift' }, { id: 'kotlin', name: 'Kotlin' },
  { id: 'sql', name: 'SQL' }, { id: 'json', name: 'JSON' }, { id: 'xml', name: 'XML' },
  { id: 'css', name: 'CSS' }, { id: 'html', name: 'HTML' }, { id: 'bash', name: 'Bash' },
  { id: 'yaml', name: 'YAML' }, { id: 'markdown', name: 'Markdown' },
];

const THEMES = [
  { id: 'github', name: 'GitHub', mode: 'light' },
  { id: 'github-dark', name: 'GitHub Dark', mode: 'dark' },
  { id: 'monokai', name: 'Monokai', mode: 'dark' },
  { id: 'dracula', name: 'Dracula', mode: 'dark' },
  { id: 'nord', name: 'Nord', mode: 'dark' },
  { id: 'one-dark', name: 'One Dark', mode: 'dark' },
  { id: 'vs2015', name: 'VS Code Dark+', mode: 'dark' },
  { id: 'atom-one-light', name: 'Atom One Light', mode: 'light' },
];

const FONTS = [
  { id: 'Fira Code', name: 'Fira Code' },
  { id: 'JetBrains Mono', name: 'JetBrains Mono' },
  { id: 'SF Mono', name: 'SF Mono' },
  { id: 'Cascadia Code', name: 'Cascadia Code' },
  { id: 'IBM Plex Mono', name: 'IBM Plex Mono' },
  { id: 'Source Code Pro', name: 'Source Code Pro' },
  { id: 'monospace', name: 'Monospace' },
];

const DEFAULT_CODE = `function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55`;

export function CodeSnapshot({ labels }: { labels: CodeSnapshotLabels }) {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState('auto');
  const [theme, setTheme] = useState('github-dark');

  // Dynamic theme loading via CDN
  useEffect(() => {
    const linkId = 'hljs-theme-link';
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${theme}.min.css`;
  }, [theme]);
  const [font, setFont] = useState('JetBrains Mono');
  const [fontSize, setFontSize] = useState(14);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [windowStyle, setWindowStyle] = useState<'macos' | 'brutalist'>('macos');
  const [windowTitle, setWindowTitle] = useState('snapshot.ts');
  const [windowTheme, setWindowTheme] = useState<'dark' | 'light'>('dark');
  const [padding, setPadding] = useState(32);
  const [copied, setCopied] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const themeInfo = THEMES.find((t) => t.id === theme) || THEMES[1];

  const highlighted = useMemo(() => {
    try {
      const lang = language === 'auto' ? undefined : language;
      if (lang) {
        const result = hljs.highlight(code, { language: lang, ignoreIllegals: true });
        return result.value;
      }
      const result = hljs.highlightAuto(code);
      // Auto-detect: if confidence is too low, fallback to plaintext
      if (result.relevance < 2) return hljs.highlight(code, { language: 'plaintext' }).value;
      return result.value;
    } catch {
      return code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }, [code, language]);

  const lines = code.split('\n');

  const captureBlob = async (): Promise<Blob | null> => {
    if (!previewRef.current) return null;
    const el = previewRef.current;
    setCaptureError(null);
    const originalOverflow = el.style.overflow;
    el.style.overflow = 'visible';
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png');
      });
      if (!blob) setCaptureError('Failed to generate image');
      return blob;
    } catch (e: any) {
      setCaptureError(e.message || 'Capture failed');
      return null;
    } finally {
      el.style.overflow = originalOverflow;
    }
  };

  const handleCapture = async () => {
    const blob = await captureBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'code-snapshot.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    const blob = await captureBlob();
    if (!blob) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not supported */ }
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg)', color: 'var(--fg)', border: 'var(--border-width) solid var(--border)',
    padding: '0.4rem 0.6rem', fontFamily: 'var(--font-body)', fontSize: '0.75rem',
    fontWeight: '700', outline: 'none', cursor: 'pointer',
  };

  const btnSmall: React.CSSProperties = {
    padding: '0.35rem 0.7rem', fontWeight: '800', fontSize: '0.65rem', textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: 'inherit', border: '2px solid var(--border)',
    background: 'var(--bg)', color: 'var(--fg)', whiteSpace: 'nowrap',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.15rem', display: 'block', letterSpacing: '0.03em',
  };

  // Determine if preview background should be dark/light
  const isDarkBg = windowTheme === 'dark' || (windowStyle === 'macos' && themeInfo.mode === 'dark');

  const bgColor = isDarkBg ? '#1e1e1e' : '#ffffff';
  const titleBarBg = windowStyle === 'macos'
    ? (windowTheme === 'dark' ? '#2d2d2d' : '#e8e8e8')
    : (windowTheme === 'dark' ? 'var(--fg)' : 'var(--fg)');
  const titleBarColor = windowStyle === 'macos'
    ? (windowTheme === 'dark' ? '#ccc' : '#333')
    : 'var(--bg)';
  const codeColor = isDarkBg ? '#e0e0e0' : '#24292e';

  return (
    <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Parameter Panel */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'end' }}>
        <div>
          <span style={labelStyle}>{labels.language}</span>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={inputStyle}>
            {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <span style={labelStyle}>{labels.theme}</span>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} style={inputStyle}>
            {THEMES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <span style={labelStyle}>{labels.fontFamily}</span>
          <select value={font} onChange={(e) => setFont(e.target.value)} style={inputStyle}>
            {FONTS.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <span style={labelStyle}>{labels.fontSize}</span>
          <input type="number" value={fontSize} onChange={(e) => setFontSize(Math.max(10, Math.min(32, parseInt(e.target.value) || 14)))}
            style={{ ...inputStyle, width: '60px' }} />
        </div>
        <div>
          <span style={labelStyle}>{labels.padding}</span>
          <input type="number" value={padding} onChange={(e) => setPadding(Math.max(8, Math.min(80, parseInt(e.target.value) || 32)))}
            style={{ ...inputStyle, width: '60px' }} />
        </div>
        <button onClick={() => setShowLineNumbers(!showLineNumbers)}
          style={{ ...btnSmall, background: showLineNumbers ? 'var(--accent)' : 'var(--bg)', color: showLineNumbers ? 'white' : 'var(--fg)' }}>
          {labels.lineNumbers}
        </button>
      </div>

      {/* Window style + theme + title */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'end' }}>
        <button onClick={() => setWindowStyle('macos')}
          style={{ ...btnSmall, background: windowStyle === 'macos' ? 'var(--accent)' : 'var(--bg)', color: windowStyle === 'macos' ? 'white' : 'var(--fg)' }}>
          {labels.macos}
        </button>
        <button onClick={() => setWindowStyle('brutalist')}
          style={{ ...btnSmall, background: windowStyle === 'brutalist' ? 'var(--accent)' : 'var(--bg)', color: windowStyle === 'brutalist' ? 'white' : 'var(--fg)' }}>
          {labels.brutalist}
        </button>
        <div>
          <span style={labelStyle}>{labels.windowTheme}</span>
          <select value={windowTheme} onChange={(e) => setWindowTheme(e.target.value as 'dark' | 'light')} style={inputStyle}>
            <option value="dark">{labels.dark}</option>
            <option value="light">{labels.light}</option>
          </select>
        </div>
        <div>
          <span style={labelStyle}>{labels.windowTitle}</span>
          <input value={windowTitle} onChange={(e) => setWindowTitle(e.target.value)}
            style={{ ...inputStyle, width: '160px', cursor: 'text' }} />
        </div>
      </div>

      {/* Editor + Preview side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Code Editor */}
        <div>
          <span style={labelStyle}>{labels.code}</span>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={labels.placeholder}
            spellCheck={false}
            style={{
              width: '100%', minHeight: '350px', resize: 'vertical',
              background: isDarkBg ? '#1a1a2e' : '#fafafa',
              color: isDarkBg ? '#e0e0e0' : '#24292e',
              border: 'var(--border-width) solid var(--border)',
              boxShadow: '3px 3px 0px var(--border)',
              padding: '1rem', fontFamily: `"${font}", monospace`, fontSize: `${fontSize}px`,
              lineHeight: 1.6, outline: 'none', whiteSpace: 'pre', tabSize: 2,
            }}
          />
        </div>

        {/* Preview */}
        <div>
          <span style={labelStyle}>Preview</span>
          <div ref={previewRef} style={{
            display: 'inline-block', minWidth: '100%',
            borderRadius: windowStyle === 'macos' ? '12px' : '0px',
            overflow: 'hidden',
            boxShadow: windowStyle === 'macos'
              ? '0 20px 60px rgba(0,0,0,0.3)'
              : 'var(--shadow)',
            border: windowStyle === 'brutalist' ? 'var(--border-width) solid var(--border)' : 'none',
          }}>
            {/* Window Title Bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 0.75rem',
              background: titleBarBg,
              color: titleBarColor,
              fontFamily: 'system-ui, sans-serif', fontSize: '0.75rem',
              fontWeight: '600',
              borderBottom: windowStyle === 'brutalist' ? 'var(--border-width) solid var(--border)' : 'none',
            }}>
              {windowStyle === 'macos' && (
                <div style={{ display: 'flex', gap: '0.4rem', marginRight: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#febc2e' }} />
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
                </div>
              )}
              <span style={{ flex: 1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {windowStyle === 'brutalist' ? windowTitle.toUpperCase() : windowTitle}
              </span>
              {windowStyle === 'brutalist' && (
                <span style={{ fontWeight: '800', fontSize: '0.65rem', opacity: 0.5 }}>ANY-TOOL</span>
              )}
            </div>

            {/* Code Body */}
            <div style={{
              background: bgColor, color: codeColor,
              padding: `${padding}px`, fontFamily: `"${font}", monospace`,
              fontSize: `${fontSize}px`, lineHeight: 1.6,
              overflow: 'hidden', whiteSpace: 'pre',
            }}>
              <table style={{ borderCollapse: 'collapse', borderSpacing: 0 }}>
                <tbody>
                  {lines.map((_, idx) => (
                    <tr key={idx}>
                      {showLineNumbers && (
                        <td style={{
                          padding: '0 1em 0 0', textAlign: 'right',
                          userSelect: 'none', opacity: 0.35,
                          minWidth: `${String(lines.length).length + 1}ch`,
                          verticalAlign: 'top',
                        }}>
                          {idx + 1}
                        </td>
                      )}
                      <td
                        style={{ verticalAlign: 'top', padding: 0 }}
                        dangerouslySetInnerHTML={{
                          __html: idx < lines.length
                            ? (highlighted.split('\n')[idx] || '&nbsp;')
                            : '&nbsp;',
                        }}
                      />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {captureError && (
        <div style={{ padding: '0.5rem 0.75rem', background: 'var(--accent)', color: 'white', fontWeight: '800', fontSize: '0.8rem', border: '2px solid var(--border)' }}>
          {captureError}
        </div>
      )}

      {/* Capture + Copy Buttons */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button onClick={handleCapture} className="brutalist-button"
          style={{ flex: 1, background: 'var(--accent)', color: 'white' }}>
          {labels.capture}
        </button>
        <button onClick={handleCopy} className="brutalist-button"
          style={{ flex: 1, background: 'black', color: 'white' }}>
          {copied ? labels.copied : labels.copyImage}
        </button>
      </div>
    </div>
  );
}
