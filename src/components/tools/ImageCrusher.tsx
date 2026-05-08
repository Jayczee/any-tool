'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageCrusherLabels {
  dropHere: string;
  clickToBrowse: string;
  analyzing: string;
  original: string;
  width: string;
  height: string;
  lockAspect: string;
  unlockAspect: string;
  quality: string;
  formatLabel: string;
  formatAuto: string;
  crushIt: string;
  crushing: string;
  crushSuccessful: string;
  before: string;
  after: string;
  reduction: string;
  download: string;
  failed: string;
  noteResultLarger: string;
}

interface Metadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

interface Result {
  originalSize: number;
  optimizedSize: number;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  reduction: string;
  downloadId: string;
  noteCode?: 'result_larger';
  noteSize?: string;
}

const formats = ['auto', 'jpeg', 'webp', 'png', 'avif'];

export function ImageCrusher({ labels }: { labels: ImageCrusherLabels }) {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState<'analyzing' | 'compressing' | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [params, setParams] = useState({
    width: 0,
    height: 0,
    lockAspect: true,
    quality: 80,
    format: 'auto',
  });

  const aspectRatio = metadata ? metadata.width / metadata.height : 1;

  const analyzeFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setMetadata(null);
    setResult(null);
    setError(null);
    setLoading('analyzing');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/tools/image-optimizer', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMetadata(data);
      setParams((p) => ({ ...p, width: data.width, height: data.height }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  }, []);

  const handleWidthChange = (w: number) => {
    if (params.lockAspect && metadata) {
      setParams({ ...params, width: w, height: Math.round(w / aspectRatio) });
    } else {
      setParams({ ...params, width: w });
    }
  };

  const handleHeightChange = (h: number) => {
    if (params.lockAspect && metadata) {
      setParams({ ...params, height: h, width: Math.round(h * aspectRatio) });
    } else {
      setParams({ ...params, height: h });
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setLoading('compressing');
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('action', 'compress');
    formData.append('width', params.width.toString());
    formData.append('height', params.height.toString());
    formData.append('quality', params.quality.toString());
    formData.append('format', params.format);

    try {
      const res = await fetch('/api/tools/image-optimizer', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = `/api/tools/image-optimizer/download?id=${result.downloadId}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg)',
    color: 'var(--fg)',
    border: 'var(--border-width) solid var(--border)',
    padding: '0.5rem 0.75rem',
    fontFamily: 'var(--font-mono)',
    fontSize: '1rem',
    fontWeight: '700',
    outline: 'none',
    width: '100%',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: '0.25rem',
    display: 'block',
    letterSpacing: '0.05em',
  };

  return (
    <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', textAlign: 'center' }}>
      {/* Upload Zone */}
      <div style={{
        width: '100%',
        maxWidth: '500px',
        border: 'var(--border-width) dashed var(--border)',
        padding: '4rem 2rem',
        background: 'rgba(0,0,0,0.02)',
        position: 'relative'
      }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) analyzeFile(f);
          }}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            cursor: 'pointer'
          }}
        />
        <div style={{ pointerEvents: 'none' }}>
          <h3 style={{
            fontSize: '1.5rem',
            marginBottom: '1rem',
            overflowWrap: 'break-word',
            wordBreak: 'break-all',
            maxWidth: '100%'
          }}>
            {file ? file.name : labels.dropHere}
          </h3>
          <p style={{ opacity: 0.6 }}>{labels.clickToBrowse}</p>
        </div>
      </div>

      {/* Analyzing indicator */}
      <AnimatePresence>
        {loading === 'analyzing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ fontWeight: '800', fontSize: '1.2rem' }}>
            {labels.analyzing}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metadata Card */}
      <AnimatePresence>
        {metadata && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="brutalist-card"
            style={{ width: '100%', maxWidth: '500px', textAlign: 'left' }}
          >
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>{labels.original}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <span style={labelStyle}>{labels.width} x {labels.height}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                  {metadata.width} x {metadata.height}
                </span>
              </div>
              <div>
                <span style={labelStyle}>{labels.formatLabel}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', textTransform: 'uppercase' }}>
                  {metadata.format}
                </span>
              </div>
              <div>
                <span style={labelStyle}>Size</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                  {formatSize(metadata.size)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Panel */}
      <AnimatePresence>
        {metadata && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="brutalist-card"
            style={{ width: '100%', maxWidth: '500px', textAlign: 'left' }}
          >
            {/* Width / Lock / Height */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem', alignItems: 'end', marginBottom: '1.5rem' }}>
              <div>
                <label style={labelStyle}>{labels.width} (px)</label>
                <input
                  type="number"
                  value={params.width || ''}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                  style={inputStyle}
                  min={1}
                />
              </div>
              <button
                onClick={() => setParams({ ...params, lockAspect: !params.lockAspect })}
                style={{
                  background: params.lockAspect ? 'var(--secondary)' : 'var(--bg)',
                  color: params.lockAspect ? 'black' : 'var(--fg)',
                  border: 'var(--border-width) solid var(--border)',
                  padding: '0.5rem',
                  fontWeight: '800',
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: '2px 2px 0px var(--border)',
                  whiteSpace: 'nowrap',
                  height: 'fit-content',
                  marginBottom: '0px',
                }}
              >
                {params.lockAspect ? labels.lockAspect : labels.unlockAspect}
              </button>
              <div>
                <label style={labelStyle}>{labels.height} (px)</label>
                <input
                  type="number"
                  value={params.height || ''}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                  style={inputStyle}
                  min={1}
                />
              </div>
            </div>

            {/* Quality Slider */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={labelStyle}>{labels.quality}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '0.9rem' }}>{params.quality}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={params.quality}
                onChange={(e) => setParams({ ...params, quality: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  accentColor: 'var(--accent)',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Format Select */}
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={labelStyle}>{labels.formatLabel}</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {formats.map((f) => (
                  <button
                    key={f}
                    onClick={() => setParams({ ...params, format: f })}
                    style={{
                      background: params.format === f ? 'var(--accent)' : 'var(--bg)',
                      color: params.format === f ? 'white' : 'var(--fg)',
                      border: 'var(--border-width) solid var(--border)',
                      padding: '0.4rem 0.75rem',
                      fontWeight: '800',
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      boxShadow: '2px 2px 0px var(--border)',
                    }}
                  >
                    {f === 'auto' ? labels.formatAuto : f}
                  </button>
                ))}
              </div>
            </div>

            {/* CRUSH Button */}
            <button
              onClick={handleCompress}
              disabled={loading === 'compressing'}
              className="brutalist-button"
              style={{ width: '100%', background: 'var(--secondary)', color: 'black' }}
            >
              {loading === 'compressing' ? labels.crushing : labels.crushIt}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compressing indicator */}
      <AnimatePresence>
        {loading === 'compressing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ fontWeight: '800', fontSize: '1.2rem' }}>
            ...CRUSHING...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Card */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="brutalist-card"
            style={{ width: '100%', maxWidth: '500px', textAlign: 'left', background: 'var(--secondary)' }}
          >
            <h3 style={{ marginBottom: '1rem', color: 'black' }}>{labels.crushSuccessful}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: 'black' }}>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: '800' }}>{labels.before}</p>
                <p style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>{formatSize(result.originalSize)}</p>
                <p style={{ fontSize: '0.8rem', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>
                  {result.originalWidth} x {result.originalHeight}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: '800' }}>{labels.after}</p>
                <p style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', fontWeight: '800' }}>{formatSize(result.optimizedSize)}</p>
                <p style={{ fontSize: '0.8rem', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>
                  {result.width} x {result.height}
                </p>
              </div>
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid black', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'black' }}>
              <span style={{ fontWeight: '800' }}>{labels.reduction}: {result.reduction}</span>
              <button onClick={handleDownload} className="brutalist-button" style={{ background: 'black', color: 'white', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>{labels.download}</button>
            </div>
            {result.noteCode === 'result_larger' && (
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'black', color: 'var(--secondary)', fontSize: '0.75rem', fontWeight: '700', border: '2px solid black' }}>
                {labels.noteResultLarger.replace('{size}', result.noteSize || '')}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ color: 'var(--accent)', fontWeight: '800' }}>
            {labels.failed}: {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
