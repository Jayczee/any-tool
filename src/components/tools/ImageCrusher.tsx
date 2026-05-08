'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ImageCrusher() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

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
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', textAlign: 'center' }}>
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
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            cursor: 'pointer'
          }}
        />
        <div style={{ pointerEvents: 'none' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            {file ? file.name : 'DROP IMAGE HERE'}
          </h3>
          <p style={{ opacity: 0.6 }}>OR CLICK TO BROWSE</p>
        </div>
      </div>

      <button 
        onClick={handleUpload} 
        disabled={!file || loading}
        className="brutalist-button"
        style={{ width: '100%', maxWidth: '300px', background: 'var(--secondary)', color: 'black' }}
      >
        {loading ? 'CRUSHING...' : 'CRUSH IT'}
      </button>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ fontWeight: '800', fontSize: '1.2rem' }}
          >
            MAGIC IN PROGRESS...
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="brutalist-card"
            style={{ width: '100%', maxWidth: '500px', textAlign: 'left', background: 'var(--secondary)' }}
          >
            <h3 style={{ marginBottom: '1rem', color: 'black' }}>CRUSH SUCCESSFUL</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: 'black' }}>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: '800' }}>BEFORE</p>
                <p style={{ fontSize: '1.2rem' }}>{formatSize(result.originalSize)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: '800' }}>AFTER</p>
                <p style={{ fontSize: '1.2rem', fontWeight: '800' }}>{formatSize(result.optimizedSize)}</p>
              </div>
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid black', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'black' }}>
              <span style={{ fontWeight: '800' }}>REDUCTION: {result.reduction}</span>
              <button className="brutalist-button" style={{ background: 'black', color: 'white', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>DOWNLOAD</button>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ color: 'var(--accent)', fontWeight: '800' }}
          >
            FAILED: {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
