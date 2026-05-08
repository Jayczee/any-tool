'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface VideoTrimmerLabels {
  dropHere: string;
  clickToBrowse: string;
  analyzing: string;
  original: string;
  duration: string;
  resolution: string;
  codec: string;
  startTime: string;
  endTime: string;
  setStart: string;
  setEnd: string;
  clippedDuration: string;
  formatLabel: string;
  modeFast: string;
  modePrecise: string;
  trimIt: string;
  trimming: string;
  trimSuccessful: string;
  before: string;
  after: string;
  reduction: string;
  download: string;
  failed: string;
  formatTime: string;
  formatTimeShort: string;
}

interface Metadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
  size: number;
}

interface Result {
  originalSize: number;
  trimmedSize: number;
  originalDuration: number;
  trimmedDuration: number;
  start: number;
  end: number;
  reduction: string;
}

const CORE_VERSION = '0.12.6';
const CDN_URLS = [
  `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd`,
  `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`,
];

let ffmpegSingleton: FFmpeg | null = null;
let ffmpegLoadPromise: Promise<boolean> | null = null;

async function loadFFmpegWithFallback(ffmpeg: FFmpeg, onProgress: (p: number) => void): Promise<void> {
  for (const baseUrl of CDN_URLS) {
    try {
      const coreURL = await toBlobURL(`${baseUrl}/ffmpeg-core.js`, 'text/javascript');
      const wasmURL = await toBlobURL(`${baseUrl}/ffmpeg-core.wasm`, 'application/wasm');
      await ffmpeg.load({ coreURL, wasmURL });
      return; // success
    } catch (e) {
      console.warn(`FFmpeg CDN failed: ${baseUrl}`, e);
    }
  }
  throw new Error('All FFmpeg CDNs unreachable. Check your network.');
}

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegSingleton) return ffmpegSingleton;
  ffmpegSingleton = new FFmpeg();
  await loadFFmpegWithFallback(ffmpegSingleton, () => {});
  return ffmpegSingleton;
}

function formatSeconds(totalSeconds: number, labels: VideoTrimmerLabels): string {
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

export function VideoTrimmer({ labels }: { labels: VideoTrimmerLabels }) {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState<'analyzing' | 'trimming' | null>(null);
  const [wasmReady, setWasmReady] = useState(false);
  const [wasmDone, setWasmDone] = useState(false);
  const [wasmError, setWasmError] = useState(false);
  const [wasmProgress, setWasmProgress] = useState(0);
  const [wasmDisplayProgress, setWasmDisplayProgress] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [precise, setPrecise] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  // Smooth progress animation — runs until display reaches 100
  useEffect(() => {
    let id: ReturnType<typeof setInterval>;
    const step = () => {
      setWasmDisplayProgress((prev) => {
        if (prev >= 100) return 100;
        const target = wasmProgress;
        if (prev >= target) {
          // Chasing target: either closed the gap or target is done, keep inching if <100
          if (wasmProgress >= 100) return prev + 3 > 100 ? 100 : prev + 3;
          return prev;
        }
        const gap = target - prev;
        const increment = Math.max(2, Math.ceil(gap * 0.1));
        return Math.min(target, prev + increment);
      });
    };
    id = setInterval(step, 40);
    return () => clearInterval(id);
  }, [wasmProgress]);

  // Preload WASM in background
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ffmpeg = new FFmpeg();
        ffmpeg.on('progress', ({ progress }: { progress: number }) => {
          if (!cancelled) setWasmProgress(Math.round(progress * 100));
        });
        await loadFFmpegWithFallback(ffmpeg, (p) => {
          if (!cancelled) setWasmProgress(p);
        });
        if (!cancelled) {
          setWasmProgress(100);
          // Brief pause at 100% so user sees completion
          await new Promise((r) => setTimeout(r, 400));
          ffmpegRef.current = ffmpeg;
          ffmpegSingleton = ffmpeg;
          setWasmReady(true);
          setWasmDone(true);
        }
      } catch (e) {
        console.error('FFmpeg load failed:', e);
        if (!cancelled) setWasmError(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const analyzeFile = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setFileUrl(URL.createObjectURL(selectedFile));
    setMetadata(null);
    setResult(null);
    setOutputBlob(null);
    setError(null);
    setLoading('analyzing');
  }, []);

  const handleVideoLoaded = useCallback(() => {
    if (!videoRef.current || !file) return;
    const video = videoRef.current;

    // Try to get codec info via MSE or MediaSource
    let codec = 'unknown';
    if ('getVideoPlaybackQuality' in video) {
      codec = 'h264'; // best guess
    }

    const meta: Metadata = {
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
      codec,
      size: file.size,
    };

    setMetadata(meta);
    setStart(0);
    setEnd(video.duration);
    setLoading(null);
  }, [file]);

  const handleTrim = async () => {
    if (!file) return;
    setLoading('trimming');
    setResult(null);
    setOutputBlob(null);
    setError(null);

    try {
      const ffmpeg = ffmpegRef.current || await getFFmpeg();
      ffmpegRef.current = ffmpeg;

      const inputName = 'input.' + (file.name.split('.').pop() || 'mp4');
      const outputName = 'output.mp4';

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      const args = ['-i', inputName];

      if (precise) {
        // Re-encode for frame accuracy
        args.push('-ss', String(start), '-to', String(end), '-c:v', 'libx264', '-c:a', 'aac');
      } else {
        // Stream copy (keyframe accuracy)
        args.push('-ss', String(start), '-to', String(end), '-c:v', 'copy', '-c:a', 'copy');
      }

      args.push('-avoid_negative_ts', 'make_zero', outputName);

      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data as unknown as BlobPart], { type: 'video/mp4' });
      setOutputBlob(blob);

      setResult({
        originalSize: file.size,
        trimmedSize: blob.size,
        originalDuration: metadata?.duration || 0,
        trimmedDuration: end - start,
        start,
        end,
        reduction: `${Math.round((1 - blob.size / file.size) * 100)}%`,
      });

      // Cleanup
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (e: any) {
      setError(e.message || 'Trim failed');
    } finally {
      setLoading(null);
    }
  };

  const handleDownload = () => {
    if (!outputBlob) return;
    const url = URL.createObjectURL(outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trimmed.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const setVideoTime = (target: 'start' | 'end') => {
    if (!videoRef.current) return;
    if (target === 'start') setStart(videoRef.current.currentTime);
    else setEnd(videoRef.current.currentTime);
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
      {/* WASM Loading / Error */}
      {!wasmDone && (
        <div style={{
          width: '100%', maxWidth: '550px',
          border: 'var(--border-width) solid var(--border)',
          padding: '2rem', textAlign: 'center',
          boxShadow: '4px 4px 0px var(--border)',
          background: wasmError ? 'var(--accent)' : 'var(--bg)',
          color: wasmError ? 'white' : 'var(--fg)',
        }}>
          {wasmError ? (
            <>
              <div style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                Failed to load FFmpeg
              </div>
              <p style={{ fontSize: '0.8rem', marginBottom: '1rem', fontWeight: '500' }}>
                CDN unreachable. Check your network or try a VPN.
              </p>
              <button
                onClick={() => {
                  setWasmError(false);
                  setWasmProgress(0);
                  setWasmDisplayProgress(0);
                  setWasmDone(false);
                  const ffmpeg = new FFmpeg();
                  ffmpeg.on('progress', ({ progress }: { progress: number }) => {
                    setWasmProgress(Math.round(progress * 100));
                  });
                  loadFFmpegWithFallback(ffmpeg, (p) => setWasmProgress(p))
                    .then(async () => {
                      setWasmProgress(100);
                      await new Promise((r) => setTimeout(r, 400));
                      ffmpegRef.current = ffmpeg;
                      ffmpegSingleton = ffmpeg;
                      setWasmReady(true);
                      setWasmDone(true);
                    })
                    .catch(() => setWasmError(true));
                }}
                style={{
                  background: 'black', color: 'white',
                  border: '2px solid white', padding: '0.5rem 1.5rem',
                  fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Retry
              </button>
            </>
          ) : (
            <>
              <div style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '1rem', textTransform: 'uppercase' }}>
                Loading FFmpeg Engine...
              </div>
              <div style={{
                width: '100%', height: '6px', background: 'var(--border)',
                border: '1px solid var(--border)', marginBottom: '0.75rem',
              }}>
                <motion.div
                  style={{
                    height: '100%',
                    background: 'var(--accent)',
                  }}
                  animate={{ width: `${wasmDisplayProgress}%` }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                />
              </div>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
                {Math.min(wasmDisplayProgress, 99)}%
              </div>
              <p style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.75rem', fontWeight: '500' }}>
                Downloading WebAssembly binary (~31 MB). Cached for next visit.
              </p>
            </>
          )}
        </div>
      )}

      {/* All tool UI — only visible after WASM is loaded */}
      {wasmDone && (<>

      {/* Upload Zone */}
      <div style={{
        width: '100%', maxWidth: '550px',
        border: 'var(--border-width) dashed var(--border)',
        padding: '4rem 2rem', background: 'rgba(0,0,0,0.02)',
        position: 'relative',
      }}>
        <input
          type="file" accept="video/*"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) analyzeFile(f); }}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
        />
        <div style={{ pointerEvents: 'none' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', overflowWrap: 'break-word', wordBreak: 'break-all', maxWidth: '100%' }}>
            {file ? file.name : labels.dropHere}
          </h3>
          <p style={{ opacity: 0.6 }}>{labels.clickToBrowse}</p>
        </div>
      </div>

      {/* Player + Controls — appears as soon as file selected */}
      <AnimatePresence>
        {fileUrl && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ width: '100%', maxWidth: '550px' }}>
            {/* Video Player */}
            <div style={{
              border: 'var(--border-width) solid var(--border)',
              boxShadow: '6px 6px 0px var(--border)',
              background: 'black',
              position: 'relative',
            }}>
              <video
                ref={videoRef}
                src={fileUrl}
                controls
                preload="metadata"
                onLoadedMetadata={handleVideoLoaded}
                style={{ width: '100%', display: 'block', maxHeight: '400px', background: '#000' }}
              />
              {/* Analyzing overlay */}
              {loading === 'analyzing' && (
                <div style={{
                  position: 'absolute', bottom: '0.5rem', left: '0.5rem',
                  background: 'var(--accent)', color: 'white',
                  padding: '0.3rem 0.75rem', fontWeight: '800', fontSize: '0.75rem',
                  border: '2px solid var(--border)',
                }}>
                  {labels.analyzing}
                </div>
              )}
            </div>

            {/* Metadata + Controls — only after metadata loaded */}
            {metadata && (<>
            {/* Metadata Card */}
            <div className="brutalist-card" style={{ marginTop: '1rem', textAlign: 'left' }}>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>{labels.original}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={labelStyle}>{labels.duration}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                    {formatSeconds(metadata.duration, labels)}
                  </span>
                </div>
                <div>
                  <span style={labelStyle}>{labels.resolution}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                    {metadata.width} x {metadata.height}
                  </span>
                </div>
                <div>
                  <span style={labelStyle}>Size</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                    {formatSize(metadata.size)}
                  </span>
                </div>
              </div>
            </div>

            {/* Time Selection */}
            <div className="brutalist-card" style={{ marginTop: '1rem', textAlign: 'left' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>{labels.startTime}</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="number" value={start.toFixed(1)} step="0.1" min="0" max={end}
                      onChange={(e) => setStart(Math.max(0, Math.min(parseFloat(e.target.value) || 0, end - 0.1)))}
                      style={inputStyle}
                    />
                    <button onClick={() => setVideoTime('start')} style={{
                      background: 'var(--accent)', color: 'white', border: '2px solid var(--border)',
                      fontWeight: '800', fontSize: '0.6rem', textTransform: 'uppercase', cursor: 'pointer',
                      padding: '0 0.5rem', whiteSpace: 'nowrap', fontFamily: 'inherit',
                    }}>{labels.setStart}</button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>{labels.endTime}</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="number" value={end.toFixed(1)} step="0.1" min={start} max={metadata.duration}
                      onChange={(e) => setEnd(Math.max(start + 0.1, Math.min(parseFloat(e.target.value) || start + 0.1, metadata.duration)))}
                      style={inputStyle}
                    />
                    <button onClick={() => setVideoTime('end')} style={{
                      background: 'var(--accent)', color: 'white', border: '2px solid var(--border)',
                      fontWeight: '800', fontSize: '0.6rem', textTransform: 'uppercase', cursor: 'pointer',
                      padding: '0 0.5rem', whiteSpace: 'nowrap', fontFamily: 'inherit',
                    }}>{labels.setEnd}</button>
                  </div>
                </div>
              </div>
              <div style={{ padding: '0.5rem', background: 'var(--fg)', color: 'var(--bg)', textAlign: 'center', fontWeight: '800' }}>
                {labels.clippedDuration}: {formatSeconds(end - start, labels)}
              </div>
            </div>

            {/* Mode Select */}
            <div className="brutalist-card" style={{ marginTop: '1rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setPrecise(false)} style={{
                  flex: 1, padding: '0.5rem',
                  background: !precise ? 'var(--secondary)' : 'var(--bg)',
                  color: !precise ? 'black' : 'var(--fg)',
                  border: 'var(--border-width) solid var(--border)',
                  fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: !precise ? '3px 3px 0px var(--border)' : 'none',
                }}>{labels.modeFast}</button>
                <button onClick={() => setPrecise(true)} style={{
                  flex: 1, padding: '0.5rem',
                  background: precise ? 'var(--accent)' : 'var(--bg)',
                  color: precise ? 'white' : 'var(--fg)',
                  border: 'var(--border-width) solid var(--border)',
                  fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: precise ? '3px 3px 0px var(--border)' : 'none',
                }}>{labels.modePrecise}</button>
              </div>
            </div>

            {/* TRIM Button */}
            <button
              onClick={handleTrim}
              disabled={loading === 'trimming' || !wasmReady}
              className="brutalist-button"
              style={{ marginTop: '1rem', width: '100%', background: 'var(--accent)', color: 'white', opacity: wasmReady ? 1 : 0.5 }}
            >
              {loading === 'trimming' ? labels.trimming : labels.trimIt}
            </button>
            </>)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Card */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="brutalist-card"
            style={{ width: '100%', maxWidth: '550px', textAlign: 'left', background: 'var(--secondary)' }}
          >
            <h3 style={{ marginBottom: '1rem', color: 'black' }}>{labels.trimSuccessful}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: 'black' }}>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: '800' }}>{labels.before}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem' }}>{formatSize(result.originalSize)}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', opacity: 0.7 }}>
                  {formatSeconds(result.originalDuration, labels)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: '800' }}>{labels.after}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: '800' }}>{formatSize(result.trimmedSize)}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', opacity: 0.7 }}>
                  {formatSeconds(result.trimmedDuration, labels)}
                </p>
              </div>
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid black', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'black' }}>
              <span style={{ fontWeight: '800' }}>{labels.reduction}: {result.reduction}</span>
              <button onClick={handleDownload} className="brutalist-button"
                style={{ background: 'black', color: 'white', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                {labels.download}
              </button>
            </div>
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
      </>)}
    </div>
  );
}
