'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Labels {
  dropHere: string; clickToBrowse: string; original: string;
  format: string; resolution: string; size: string;
  convertTo: string; quality: string; convertIt: string; converting: string;
  successful: string; before: string; after: string; reduction: string;
  download: string; failed: string;
}

interface Metadata { width: number; height: number; format: string; size: number; }

interface Result {
  originalSize: number; convertedSize: number; originalFormat: string; targetFormat: string;
  width: number; height: number; reduction: string; downloadId: string;
}

const FORMATS = [
  { id: 'png', label: 'PNG', desc: 'Lossless' },
  { id: 'jpeg', label: 'JPEG', desc: 'Lossy' },
  { id: 'webp', label: 'WebP', desc: 'Lossy/Lossless' },
  { id: 'avif', label: 'AVIF', desc: 'Next-gen' },
  { id: 'tiff', label: 'TIFF', desc: 'Lossless' },
  { id: 'ico', label: 'ICO', desc: 'Favicon' },
];

function formatSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function ImageConverter({ labels }: { labels: Labels }) {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [targetFormat, setTargetFormat] = useState('png');
  const [quality, setQuality] = useState(85);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (f: File) => {
    setFile(f); setMetadata(null); setResult(null); setError(null);
    const fd = new FormData(); fd.append('file', f);
    try {
      const res = await fetch('/api/tools/image-converter', { method: 'POST', body: fd });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setMetadata(d);
      // Auto-pick a different format
      const cur = d.format;
      const alt = FORMATS.find((ff) => ff.id !== cur && ff.id !== 'tiff');
      if (alt) setTargetFormat(alt.id);
    } catch (e: any) { setError(e.message); }
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true); setResult(null); setError(null);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('action', 'convert');
    fd.append('format', targetFormat);
    fd.append('quality', String(quality));
    try {
      const res = await fetch('/api/tools/image-converter', { method: 'POST', body: fd });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setResult(d);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = `/api/tools/image-converter/download?id=${result.downloadId}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg)', color: 'var(--fg)', border: 'var(--border-width) solid var(--border)',
    padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem',
    fontWeight: '700', outline: 'none', width: '100%',
  };
  const lbl: React.CSSProperties = {
    fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block', letterSpacing: '0.05em',
  };

  return (
    <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', textAlign: 'center' }}>
      {/* Upload */}
      <div style={{ width: '100%', maxWidth: '550px', border: 'var(--border-width) dashed var(--border)', padding: '4rem 2rem', background: 'rgba(0,0,0,0.02)', position: 'relative' }}>
        <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) analyze(f); }}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
        <div style={{ pointerEvents: 'none' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', overflowWrap: 'break-word', wordBreak: 'break-all', maxWidth: '100%' }}>
            {file ? file.name : labels.dropHere}
          </h3>
          <p style={{ opacity: 0.6 }}>{labels.clickToBrowse}</p>
        </div>
      </div>

      {/* Metadata */}
      <AnimatePresence>
        {metadata && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="brutalist-card" style={{ width: '100%', maxWidth: '550px', textAlign: 'left' }}>
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>{labels.original}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div><span style={lbl}>{labels.format}</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', textTransform: 'uppercase' }}>{metadata.format}</span></div>
              <div><span style={lbl}>{labels.resolution}</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{metadata.width} x {metadata.height}</span></div>
              <div><span style={lbl}>{labels.size}</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{formatSize(metadata.size)}</span></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Format Select + Quality + Convert */}
      <AnimatePresence>
        {metadata && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="brutalist-card" style={{ width: '100%', maxWidth: '550px', textAlign: 'left' }}>
            <span style={lbl}>{labels.convertTo}</span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {FORMATS.map((f) => (
                <button key={f.id} onClick={() => setTargetFormat(f.id)} style={{
                  padding: '0.5rem 0.75rem',
                  background: targetFormat === f.id ? 'var(--accent)' : 'var(--bg)',
                  color: targetFormat === f.id ? 'white' : 'var(--fg)',
                  border: 'var(--border-width) solid var(--border)',
                  fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: targetFormat === f.id ? '2px 2px 0px var(--border)' : 'none',
                }}>{f.label}<span style={{ display: 'block', fontSize: '0.55rem', opacity: 0.6, fontWeight: '600' }}>{f.desc}</span></button>
              ))}
            </div>
            {targetFormat !== 'png' && targetFormat !== 'tiff' && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={lbl}>{labels.quality}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '0.9rem' }}>{quality}%</span>
                </div>
                <input type="range" min={1} max={100} value={quality} onChange={(e) => setQuality(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} />
              </div>
            )}
            <button onClick={convert} disabled={loading} className="brutalist-button"
              style={{ width: '100%', background: 'var(--secondary)', color: 'black' }}>
              {loading ? labels.converting : `${labels.convertIt} → ${targetFormat.toUpperCase()}`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="brutalist-card" style={{ width: '100%', maxWidth: '550px', textAlign: 'left', background: 'var(--secondary)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'black' }}>{labels.successful}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: 'black' }}>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: '800' }}>{labels.before}</p>
                <p style={{ fontFamily: 'var(--font-mono)' }}>{formatSize(result.originalSize)}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase' }}>{result.originalFormat}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: '800' }}>{labels.after}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '1.1rem' }}>{formatSize(result.convertedSize)}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase' }}>{result.targetFormat}</p>
              </div>
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid black', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'black' }}>
              <span style={{ fontWeight: '800' }}>{labels.reduction}: {result.reduction}</span>
              <button onClick={download} className="brutalist-button" style={{ background: 'black', color: 'white', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>{labels.download}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--accent)', fontWeight: '800' }}>{labels.failed}: {error}</motion.div>}
    </div>
  );
}
