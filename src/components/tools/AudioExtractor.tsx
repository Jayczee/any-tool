'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface AudioExtractorLabels {
  dropHere: string;
  clickToBrowse: string;
  analyzing: string;
  original: string;
  duration: string;
  size: string;
  formatLabel: string;
  quality: string;
  extractIt: string;
  extracting: string;
  extractSuccessful: string;
  download: string;
  failed: string;
  formatTime: string;
  formatTimeShort: string;
}

interface Metadata { duration: number; width: number; height: number; size: number; }

const CORE_VERSION = '0.12.6';
const CDN_URLS = [
  `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd`,
  `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`,
];

let ffmpegSingleton: FFmpeg | null = null;

async function loadFFmpegWithFallback(ffmpeg: FFmpeg, _p: (n: number) => void): Promise<void> {
  for (const baseUrl of CDN_URLS) {
    try {
      const coreURL = await toBlobURL(`${baseUrl}/ffmpeg-core.js`, 'text/javascript');
      const wasmURL = await toBlobURL(`${baseUrl}/ffmpeg-core.wasm`, 'application/wasm');
      await ffmpeg.load({ coreURL, wasmURL });
      return;
    } catch (e) { console.warn(`FFmpeg CDN failed: ${baseUrl}`, e); }
  }
  throw new Error('All FFmpeg CDNs unreachable.');
}

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegSingleton) return ffmpegSingleton;
  ffmpegSingleton = new FFmpeg();
  await loadFFmpegWithFallback(ffmpegSingleton, () => {});
  return ffmpegSingleton;
}

function formatSeconds(totalSeconds: number, labels: AudioExtractorLabels): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return labels.formatTime.replace('{h}', String(h)).replace('{m}', String(m)).replace('{s}', String(s));
  return labels.formatTimeShort.replace('{m}', String(m).padStart(2, '0')).replace('{s}', String(s).padStart(2, '0'));
}

function formatSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

type Format = 'mp3' | 'wav' | 'aac' | 'ogg';
const FORMATS: { id: Format; ext: string; label: string }[] = [
  { id: 'mp3', ext: 'mp3', label: 'MP3' },
  { id: 'wav', ext: 'wav', label: 'WAV' },
  { id: 'aac', ext: 'm4a', label: 'AAC' },
  { id: 'ogg', ext: 'ogg', label: 'OGG' },
];

const BITRATES: Record<string, number[]> = {
  mp3: [128, 192, 256, 320],
  aac: [128, 192, 256],
  ogg: [64, 128, 192, 256],
};

export function AudioExtractor({ labels }: { labels: AudioExtractorLabels }) {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState<'analyzing' | 'extracting' | null>(null);
  const [wasmReady, setWasmReady] = useState(false);
  const [wasmDone, setWasmDone] = useState(false);
  const [wasmError, setWasmError] = useState(false);
  const [wasmProgress, setWasmProgress] = useState(0);
  const [wasmDisplayProgress, setWasmDisplayProgress] = useState(0);
  const [format, setFormat] = useState<Format>('mp3');
  const [bitrate, setBitrate] = useState(192);
  const [result, setResult] = useState<{ origSize: number; audioSize: number; duration: number; outFormat: string } | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  useEffect(() => {
    const step = () => setWasmDisplayProgress((prev) => {
      if (prev >= 100) return 100;
      const target = wasmProgress;
      if (prev >= target) return wasmProgress >= 100 ? prev + 3 > 100 ? 100 : prev + 3 : prev;
      return Math.min(target, prev + Math.max(2, Math.ceil((target - prev) * 0.1)));
    });
    const id = setInterval(step, 40);
    return () => clearInterval(id);
  }, [wasmProgress]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ffmpeg = new FFmpeg();
        ffmpeg.on('progress', ({ progress }: { progress: number }) => {
          if (!cancelled) setWasmProgress(Math.round(progress * 100));
        });
        await loadFFmpegWithFallback(ffmpeg, (p) => { if (!cancelled) setWasmProgress(p); });
        if (!cancelled) { setWasmProgress(100); await new Promise((r) => setTimeout(r, 400)); ffmpegRef.current = ffmpeg; ffmpegSingleton = ffmpeg; setWasmReady(true); setWasmDone(true); }
      } catch { if (!cancelled) setWasmError(true); }
    })();
    return () => { cancelled = true; };
  }, []);

  const analyzeFile = useCallback((f: File) => {
    setFile(f); setFileUrl(URL.createObjectURL(f)); setMetadata(null); setResult(null); setOutputBlob(null); setError(null); setLoading('analyzing');
  }, []);

  const handleVideoLoaded = useCallback(() => {
    if (!videoRef.current || !file) return;
    setMetadata({ duration: videoRef.current.duration, width: videoRef.current.videoWidth, height: videoRef.current.videoHeight, size: file.size });
    setLoading(null);
  }, [file]);

  const handleExtract = async () => {
    if (!file) return;
    setLoading('extracting'); setResult(null); setOutputBlob(null); setError(null);
    try {
      const ffmpeg = ffmpegRef.current || await getFFmpeg();
      ffmpegRef.current = ffmpeg;
      const inName = 'input.' + (file.name.split('.').pop() || 'mp4');
      const fmt = FORMATS.find((f) => f.id === format)!;
      const outName = 'output.' + fmt.ext;
      await ffmpeg.writeFile(inName, await fetchFile(file));

      const args = ['-i', inName, '-vn'];
      if (format === 'mp3') args.push('-c:a', 'libmp3lame', '-b:a', `${bitrate}k`);
      else if (format === 'wav') args.push('-c:a', 'pcm_s16le');
      else if (format === 'aac') args.push('-c:a', 'aac', '-b:a', `${bitrate}k`);
      else if (format === 'ogg') args.push('-c:a', 'libvorbis', '-q:a', String(Math.round(bitrate / 64)));
      args.push(outName);
      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outName);
      const blob = new Blob([data as unknown as BlobPart], { type: format === 'aac' ? 'audio/mp4' : `audio/${format === 'wav' ? 'wav' : format === 'ogg' ? 'ogg' : 'mpeg'}` });
      setOutputBlob(blob);
      setResult({ origSize: file.size, audioSize: blob.size, duration: metadata?.duration || 0, outFormat: fmt.ext });

      await ffmpeg.deleteFile(inName);
      await ffmpeg.deleteFile(outName);
    } catch (e: any) { setError(e.message || 'Extract failed'); }
    finally { setLoading(null); }
  };

  const handleDownload = () => {
    if (!outputBlob) return;
    const url = URL.createObjectURL(outputBlob);
    const a = document.createElement('a'); a.href = url; a.download = `audio.${FORMATS.find((f) => f.id === format)!.ext}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const inputStyle: React.CSSProperties = { background: 'var(--bg)', color: 'var(--fg)', border: 'var(--border-width) solid var(--border)', padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: '700', outline: 'none', width: '100%' };
  const labelStyle: React.CSSProperties = { fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block', letterSpacing: '0.05em' };

  return (
    <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', textAlign: 'center' }}>
      {!wasmDone && (
        <div style={{ width: '100%', maxWidth: '550px', border: 'var(--border-width) solid var(--border)', padding: '2rem', textAlign: 'center', boxShadow: '4px 4px 0px var(--border)', background: wasmError ? 'var(--accent)' : 'var(--bg)', color: wasmError ? 'white' : 'var(--fg)' }}>
          {wasmError ? (
            <><div style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Failed to load FFmpeg</div>
              <button onClick={() => location.reload()} style={{ background: 'black', color: 'white', border: '2px solid white', padding: '0.5rem 1.5rem', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' }}>Retry</button></>
          ) : (
            <><div style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '1rem', textTransform: 'uppercase' }}>Loading FFmpeg Engine...</div>
              <div style={{ width: '100%', height: '6px', background: 'var(--border)', border: '1px solid var(--border)', marginBottom: '0.75rem' }}>
                <motion.div style={{ height: '100%', background: 'var(--accent)' }} animate={{ width: `${wasmDisplayProgress}%` }} transition={{ duration: 0.15, ease: 'easeOut' }} />
              </div>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>{Math.min(wasmDisplayProgress, 99)}%</div></>
          )}
        </div>
      )}

      {wasmDone && (<>

      <div style={{ width: '100%', maxWidth: '550px', border: 'var(--border-width) dashed var(--border)', padding: '4rem 2rem', background: 'rgba(0,0,0,0.02)', position: 'relative' }}>
        <input type="file" accept="video/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) analyzeFile(f); }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
        <div style={{ pointerEvents: 'none' }}><h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', overflowWrap: 'break-word', wordBreak: 'break-all', maxWidth: '100%' }}>{file ? file.name : labels.dropHere}</h3><p style={{ opacity: 0.6 }}>{labels.clickToBrowse}</p></div>
      </div>

      <AnimatePresence>
        {fileUrl && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '550px' }}>
            <div style={{ border: 'var(--border-width) solid var(--border)', boxShadow: '6px 6px 0px var(--border)', background: 'black', position: 'relative' }}>
              <video ref={videoRef} src={fileUrl} controls preload="metadata" onLoadedMetadata={handleVideoLoaded} style={{ width: '100%', display: 'block', maxHeight: '400px', background: '#000' }} />
              {loading === 'analyzing' && <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', background: 'var(--accent)', color: 'white', padding: '0.3rem 0.75rem', fontWeight: '800', fontSize: '0.75rem', border: '2px solid var(--border)' }}>{labels.analyzing}</div>}
            </div>

            {metadata && (<>
            <div className="brutalist-card" style={{ marginTop: '1rem', textAlign: 'left' }}>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>{labels.original}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><span style={labelStyle}>{labels.duration}</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{formatSeconds(metadata.duration, labels)}</span></div>
                <div><span style={labelStyle}>{labels.size}</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{formatSize(metadata.size)}</span></div>
              </div>
            </div>

            <div className="brutalist-card" style={{ marginTop: '1rem', textAlign: 'left' }}>
              <span style={labelStyle}>{labels.formatLabel}</span>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {FORMATS.map((f) => (
                  <button key={f.id} onClick={() => { setFormat(f.id); setBitrate(BITRATES[f.id]?.[0] || 128); }}
                    style={{ padding: '0.4rem 0.75rem', background: format === f.id ? 'var(--accent)' : 'var(--bg)', color: format === f.id ? 'white' : 'var(--fg)', border: 'var(--border-width) solid var(--border)', fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', boxShadow: format === f.id ? '2px 2px 0px var(--border)' : 'none' }}>{f.label}</button>
                ))}
              </div>
              {format !== 'wav' && BITRATES[format] && (
                <>
                  <span style={labelStyle}>{labels.quality} (kbps)</span>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {BITRATES[format].map((br) => (
                      <button key={br} onClick={() => setBitrate(br)}
                        style={{ padding: '0.4rem 0.75rem', background: bitrate === br ? 'var(--secondary)' : 'var(--bg)', color: bitrate === br ? 'black' : 'var(--fg)', border: 'var(--border-width) solid var(--border)', fontWeight: '800', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: bitrate === br ? '2px 2px 0px var(--border)' : 'none' }}>{br}k</button>
                    ))}
                  </div>
                </>
              )}
              {format === 'wav' && <p style={{ fontSize: '0.75rem', opacity: 0.5, fontWeight: '600', marginTop: '0.5rem' }}>WAV is uncompressed lossless — no quality setting needed.</p>}
            </div>

            <button onClick={handleExtract} disabled={loading === 'extracting' || !wasmReady} className="brutalist-button"
              style={{ marginTop: '1rem', width: '100%', background: 'var(--secondary)', color: 'black', opacity: wasmReady ? 1 : 0.5 }}>
              {loading === 'extracting' ? labels.extracting : `${labels.extractIt} (${FORMATS.find((f) => f.id === format)!.label})`}
            </button>
            </>)}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="brutalist-card" style={{ width: '100%', maxWidth: '550px', textAlign: 'left', background: 'var(--secondary)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'black' }}>{labels.extractSuccessful}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: 'black' }}>
              <div><p style={{ fontSize: '0.8rem', fontWeight: '800' }}>Video</p><p style={{ fontFamily: 'var(--font-mono)' }}>{formatSize(result.origSize)}</p></div>
              <div><p style={{ fontSize: '0.8rem', fontWeight: '800' }}>{result.outFormat.toUpperCase()}</p><p style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '1.1rem' }}>{formatSize(result.audioSize)}</p></div>
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid black', display: 'flex', justifyContent: 'flex-end', color: 'black' }}>
              <button onClick={handleDownload} className="brutalist-button" style={{ background: 'black', color: 'white', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>{labels.download}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--accent)', fontWeight: '800' }}>{labels.failed}: {error}</motion.div>}
      </>)}
    </div>
  );
}
