'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface VideoSpeederLabels {
  dropHere: string;
  clickToBrowse: string;
  analyzing: string;
  original: string;
  duration: string;
  resolution: string;
  speed: string;
  keepAudio: string;
  speedIt: string;
  speeding: string;
  speedSuccessful: string;
  before: string;
  after: string;
  download: string;
  failed: string;
  formatTime: string;
  formatTimeShort: string;
}

interface Metadata {
  duration: number;
  width: number;
  height: number;
  size: number;
}

const CORE_VERSION = '0.12.6';
const CDN_URLS = [
  `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd`,
  `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`,
];

let ffmpegSingleton: FFmpeg | null = null;

async function loadFFmpegWithFallback(ffmpeg: FFmpeg, _onProgress: (p: number) => void): Promise<void> {
  for (const baseUrl of CDN_URLS) {
    try {
      const coreURL = await toBlobURL(`${baseUrl}/ffmpeg-core.js`, 'text/javascript');
      const wasmURL = await toBlobURL(`${baseUrl}/ffmpeg-core.wasm`, 'application/wasm');
      await ffmpeg.load({ coreURL, wasmURL });
      return;
    } catch (e) {
      console.warn(`FFmpeg CDN failed: ${baseUrl}`, e);
    }
  }
  throw new Error('All FFmpeg CDNs unreachable.');
}

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegSingleton) return ffmpegSingleton;
  ffmpegSingleton = new FFmpeg();
  await loadFFmpegWithFallback(ffmpegSingleton, () => {});
  return ffmpegSingleton;
}

function buildAtempo(speed: number): string {
  if (speed >= 0.5 && speed <= 2) return `atempo=${speed.toFixed(4)}`;
  if (speed > 2) return `atempo=2,${buildAtempo(speed / 2)}`;
  return `atempo=0.5,${buildAtempo(speed * 2)}`;
}

function formatSeconds(totalSeconds: number, labels: VideoSpeederLabels): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return labels.formatTime.replace('{h}', String(h)).replace('{m}', String(m)).replace('{s}', String(s));
  return labels.formatTimeShort
    .replace('{m}', String(m).padStart(2, '0'))
    .replace('{s}', String(s).padStart(2, '0'));
}

function formatSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const SPEED_PRESETS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 5, 10];

export function VideoSpeed({ labels }: { labels: VideoSpeederLabels }) {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState<'analyzing' | 'speeding' | null>(null);
  const [wasmReady, setWasmReady] = useState(false);
  const [wasmDone, setWasmDone] = useState(false);
  const [wasmError, setWasmError] = useState(false);
  const [wasmProgress, setWasmProgress] = useState(0);
  const [wasmDisplayProgress, setWasmDisplayProgress] = useState(0);
  const [speed, setSpeed] = useState(2);
  const [keepAudio, setKeepAudio] = useState(true);
  const [result, setResult] = useState<{ originalSize: number; spedSize: number; originalDuration: number; newDuration: number } | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  // Smooth progress
  useEffect(() => {
    const step = () => {
      setWasmDisplayProgress((prev) => {
        if (prev >= 100) return 100;
        const target = wasmProgress;
        if (prev >= target) return wasmProgress >= 100 ? prev + 3 > 100 ? 100 : prev + 3 : prev;
        const gap = target - prev;
        return Math.min(target, prev + Math.max(2, Math.ceil(gap * 0.1)));
      });
    };
    const id = setInterval(step, 40);
    return () => clearInterval(id);
  }, [wasmProgress]);

  // Preload WASM
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ffmpeg = new FFmpeg();
        ffmpeg.on('progress', ({ progress }: { progress: number }) => {
          if (!cancelled) setWasmProgress(Math.round(progress * 100));
        });
        await loadFFmpegWithFallback(ffmpeg, (p) => { if (!cancelled) setWasmProgress(p); });
        if (!cancelled) {
          setWasmProgress(100);
          await new Promise((r) => setTimeout(r, 400));
          ffmpegRef.current = ffmpeg;
          ffmpegSingleton = ffmpeg;
          setWasmReady(true);
          setWasmDone(true);
        }
      } catch (e) {
        if (!cancelled) setWasmError(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const analyzeFile = useCallback((f: File) => {
    setFile(f);
    setFileUrl(URL.createObjectURL(f));
    setMetadata(null);
    setResult(null);
    setOutputBlob(null);
    setError(null);
    setLoading('analyzing');
  }, []);

  const handleVideoLoaded = useCallback(() => {
    if (!videoRef.current || !file) return;
    setMetadata({
      duration: videoRef.current.duration,
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight,
      size: file.size,
    });
    setLoading(null);
    // Apply preview speed
    videoRef.current.playbackRate = speed;
  }, [file, speed]);

  // Update preview when speed changes
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  const handleSpeed = async () => {
    if (!file) return;
    setLoading('speeding');
    setResult(null);
    setOutputBlob(null);
    setError(null);

    try {
      const ffmpeg = ffmpegRef.current || await getFFmpeg();
      ffmpegRef.current = ffmpeg;

      const inName = 'input.' + (file.name.split('.').pop() || 'mp4');
      const outName = 'output.mp4';
      await ffmpeg.writeFile(inName, await fetchFile(file));

      const setpts = `setpts=PTS/${speed}`;
      const atempo = buildAtempo(speed);

      if (keepAudio) {
        await ffmpeg.exec([
          '-i', inName,
          '-filter_complex', `[0:v]${setpts}[v];[0:a]${atempo}[a]`,
          '-map', '[v]', '-map', '[a]',
          '-c:v', 'libx264', '-c:a', 'aac',
          outName,
        ]);
      } else {
        await ffmpeg.exec([
          '-i', inName,
          '-filter:v', setpts,
          '-an',
          '-c:v', 'libx264',
          outName,
        ]);
      }

      const data = await ffmpeg.readFile(outName);
      const blob = new Blob([data as unknown as BlobPart], { type: 'video/mp4' });
      setOutputBlob(blob);

      setResult({
        originalSize: file.size,
        spedSize: blob.size,
        originalDuration: metadata?.duration || 0,
        newDuration: (metadata?.duration || 0) / speed,
      });

      await ffmpeg.deleteFile(inName);
      await ffmpeg.deleteFile(outName);
    } catch (e: any) {
      setError(e.message || 'Speed change failed');
    } finally {
      setLoading(null);
    }
  };

  const handleDownload = () => {
    if (!outputBlob) return;
    const url = URL.createObjectURL(outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sped-${speed}x.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg)', color: 'var(--fg)',
    border: 'var(--border-width) solid var(--border)',
    padding: '0.5rem 0.75rem',
    fontFamily: 'var(--font-mono)', fontSize: '0.9rem',
    fontWeight: '700', outline: 'none', width: '100%',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase',
    marginBottom: '0.25rem', display: 'block', letterSpacing: '0.05em',
  };

  return (
    <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', textAlign: 'center' }}>
      {/* WASM Loading */}
      {!wasmDone && (
        <div style={{
          width: '100%', maxWidth: '550px', border: 'var(--border-width) solid var(--border)',
          padding: '2rem', textAlign: 'center', boxShadow: '4px 4px 0px var(--border)',
          background: wasmError ? 'var(--accent)' : 'var(--bg)', color: wasmError ? 'white' : 'var(--fg)',
        }}>
          {wasmError ? (
            <>
              <div style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                Failed to load FFmpeg
              </div>
              <button onClick={() => { setWasmError(false); setWasmProgress(0); setWasmDisplayProgress(0); setWasmDone(false); location.reload(); }}
                style={{ background: 'black', color: 'white', border: '2px solid white', padding: '0.5rem 1.5rem', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' }}>
                Retry
              </button>
            </>
          ) : (
            <>
              <div style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '1rem', textTransform: 'uppercase' }}>
                Loading FFmpeg Engine...
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--border)', border: '1px solid var(--border)', marginBottom: '0.75rem' }}>
                <motion.div style={{ height: '100%', background: 'var(--accent)' }}
                  animate={{ width: `${wasmDisplayProgress}%` }} transition={{ duration: 0.15, ease: 'easeOut' }} />
              </div>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>{Math.min(wasmDisplayProgress, 99)}%</div>
            </>
          )}
        </div>
      )}

      {/* Tool UI */}
      {wasmDone && (<>

      {/* Upload */}
      <div style={{ width: '100%', maxWidth: '550px', border: 'var(--border-width) dashed var(--border)', padding: '4rem 2rem', background: 'rgba(0,0,0,0.02)', position: 'relative' }}>
        <input type="file" accept="video/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) analyzeFile(f); }}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
        <div style={{ pointerEvents: 'none' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', overflowWrap: 'break-word', wordBreak: 'break-all', maxWidth: '100%' }}>
            {file ? file.name : labels.dropHere}
          </h3>
          <p style={{ opacity: 0.6 }}>{labels.clickToBrowse}</p>
        </div>
      </div>

      {/* Player + Controls */}
      <AnimatePresence>
        {fileUrl && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '550px' }}>
            <div style={{ border: 'var(--border-width) solid var(--border)', boxShadow: '6px 6px 0px var(--border)', background: 'black', position: 'relative' }}>
              <video ref={videoRef} src={fileUrl} controls preload="metadata" onLoadedMetadata={handleVideoLoaded}
                style={{ width: '100%', display: 'block', maxHeight: '400px', background: '#000' }} />
              {loading === 'analyzing' && (
                <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', background: 'var(--accent)', color: 'white', padding: '0.3rem 0.75rem', fontWeight: '800', fontSize: '0.75rem', border: '2px solid var(--border)' }}>
                  {labels.analyzing}
                </div>
              )}
              {metadata && (
                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'var(--accent)', color: 'white', padding: '0.2rem 0.6rem', fontWeight: '800', fontSize: '0.75rem', border: '2px solid var(--border)' }}>
                  {speed}x PREVIEW
                </div>
              )}
            </div>

            {metadata && (<>
            {/* Metadata */}
            <div className="brutalist-card" style={{ marginTop: '1rem', textAlign: 'left' }}>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>{labels.original}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div><span style={labelStyle}>{labels.duration}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{formatSeconds(metadata.duration, labels)}</span></div>
                <div><span style={labelStyle}>{labels.resolution}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{metadata.width} x {metadata.height}</span></div>
                <div><span style={labelStyle}>Size</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{formatSize(metadata.size)}</span></div>
              </div>
            </div>

            {/* Speed Selector */}
            <div className="brutalist-card" style={{ marginTop: '1rem', textAlign: 'left' }}>
              <span style={labelStyle}>{labels.speed}</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                {SPEED_PRESETS.map((s) => (
                  <button key={s} onClick={() => setSpeed(s)} style={{
                    background: speed === s ? 'var(--accent)' : 'var(--bg)',
                    color: speed === s ? 'white' : 'var(--fg)',
                    border: 'var(--border-width) solid var(--border)',
                    padding: '0.4rem 0.75rem', fontWeight: '800', fontSize: '0.8rem',
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: speed === s ? '2px 2px 0px var(--border)' : 'none',
                  }}>{s}x</button>
                ))}
              </div>
              {/* Custom slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input type="range" min={0.25} max={10} step={0.05} value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '1.2rem', minWidth: '60px', textAlign: 'right' }}>
                  {speed.toFixed(2)}x
                </span>
              </div>
              {metadata && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: '700', fontFamily: 'var(--font-mono)', opacity: 0.6 }}>
                  {formatSeconds(metadata.duration, labels)} → {formatSeconds(metadata.duration / speed, labels)}
                </div>
              )}
            </div>

            {/* Audio Toggle */}
            <div className="brutalist-card" style={{ marginTop: '1rem', textAlign: 'left' }}>
              <button onClick={() => setKeepAudio(!keepAudio)} style={{
                width: '100%', padding: '0.6rem',
                background: keepAudio ? 'var(--secondary)' : 'var(--bg)',
                color: keepAudio ? 'black' : 'var(--fg)',
                border: 'var(--border-width) solid var(--border)',
                fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: keepAudio ? '3px 3px 0px var(--border)' : 'none',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>{labels.keepAudio}</span>
                <span style={{ fontSize: '1.2rem' }}>{keepAudio ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* SPEED Button */}
            <button onClick={handleSpeed} disabled={loading === 'speeding' || !wasmReady}
              className="brutalist-button"
              style={{ marginTop: '1rem', width: '100%', background: 'var(--accent)', color: 'white', opacity: wasmReady ? 1 : 0.5 }}>
              {loading === 'speeding' ? labels.speeding : `${labels.speedIt} (${speed}x)`}
            </button>
            </>)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="brutalist-card" style={{ width: '100%', maxWidth: '550px', textAlign: 'left', background: 'var(--secondary)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'black' }}>{labels.speedSuccessful}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: 'black' }}>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: '800' }}>{labels.before}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem' }}>{formatSize(result.originalSize)}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', opacity: 0.7 }}>{formatSeconds(result.originalDuration, labels)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: '800' }}>{labels.after}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: '800' }}>{formatSize(result.spedSize)}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', opacity: 0.7 }}>{formatSeconds(result.newDuration, labels)}</p>
              </div>
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid black', display: 'flex', justifyContent: 'flex-end', color: 'black' }}>
              <button onClick={handleDownload} className="brutalist-button" style={{ background: 'black', color: 'white', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                {labels.download}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--accent)', fontWeight: '800' }}>
          {labels.failed}: {error}
        </motion.div>
      )}

      </>)}
    </div>
  );
}
