'use client';

import { useState, useMemo } from 'react';

interface RequestSenderLabels {
  url: string; method: string; send: string; sending: string;
  params: string; headers: string; body: string; auth: string; settings: string;
  bodyNone: string; bodyJson: string; bodyForm: string; bodyUrlencoded: string; bodyRaw: string;
  key: string; value: string; add: string; remove: string;
  noAuth: string; bearerToken: string; basicAuth: string; apiKey: string;
  token: string; username: string; password: string;
  apiKeyName: string; apiKeyValue: string; apiKeyIn: string;
  authHeader: string; authQuery: string;
  curlImport: string; curlExport: string; urlImport: string; clear: string;
  history: string; envVars: string; envKey: string;
  response: string; responseBody: string; responseHeaders: string;
  pretty: string; raw: string; copy: string; copied: string;
  status: string; time: string; size: string;
  noResponse: string; curlPlaceholder: string; urlPlaceholder: string; jsonPlaceholder: string;
  timeout: string; followRedirects: string;
  errorNetwork: string; errorTimeout: string; errorCors: string; errorParse: string;
  privacyNote: string;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
type BodyType = 'none' | 'json' | 'form' | 'urlencoded' | 'raw';
type AuthType = 'none' | 'bearer' | 'basic' | 'apikey';
type Tab = 'params' | 'headers' | 'body' | 'auth' | 'settings';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

interface KV { key: string; value: string; }
interface EnvVar { key: string; value: string; }
interface HistoryEntry {
  method: string; url: string; timestamp: number;
  params: KV[]; headers: KV[]; bodyType: BodyType; bodyText: string; formData: KV[];
  authType: AuthType; authToken: string; authUser: string; authPass: string;
  authApiKey: string; authApiValue: string; authApiIn: 'header' | 'query';
}

interface ResponseData {
  status: number; statusText: string; headers: Record<string, string>;
  body: string; bodyType: 'text' | 'json' | 'binary'; time: number; size: number;
}

// Simple curl parser inline
function parseCurl(s: string): { method: string; url: string; headers: Record<string, string>; body: string } | null {
  const input = s.trim();
  if (!input.startsWith('curl ')) return null;
  const result = { method: 'GET' as string, url: '', headers: {} as Record<string, string>, body: '' };
  // Tokenize
  const tokens: string[] = [];
  let i = 4;
  while (i < input.length) {
    while (i < input.length && /\s/.test(input[i])) i++;
    if (i >= input.length) break;
    if (input[i] === "'" || input[i] === '"') {
      const q = input[i]; let t = ''; i++;
      while (i < input.length && input[i] !== q) { if (input[i] === '\\') { i++; } t += input[i] || ''; i++; }
      i++; tokens.push(t);
    } else { let t = ''; while (i < input.length && !/\s/.test(input[i])) { t += input[i]; i++; } tokens.push(t); }
  }
  let expect: string | null = null;
  for (const t of tokens) {
    if (expect) {
      if (expect === 'X') result.method = t.toUpperCase();
      else if (expect === 'H') { const c = t.indexOf(':'); if (c > 0) result.headers[t.slice(0, c).trim()] = t.slice(c + 1).trim(); }
      else if (expect === 'd') { result.body = t; if (result.method === 'GET') result.method = 'POST'; }
      else if (expect === 'u') result.headers['Authorization'] = 'Basic ' + btoa(t);
      expect = null; continue;
    }
    if (t === '-X' || t === '--request') expect = 'X';
    else if (t === '-H' || t === '--header') expect = 'H';
    else if (t === '-d' || t === '--data' || t === '--data-raw') expect = 'd';
    else if (t === '-u' || t === '--user') expect = 'u';
    else if (t === '-G' || t === '--get') result.method = 'GET';
    else if (!t.startsWith('-') && !result.url) result.url = t;
  }
  return result.url ? result : null;
}

function substituteEnv(str: string, envVars: EnvVar[]): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, name) => envVars.find((e) => e.key === name)?.value || `{{${name}}}`);
}

function formatSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function RequestSender({ labels }: { labels: RequestSenderLabels }) {
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState('');
  const [params, setParams] = useState<KV[]>([]);
  const [headers, setHeaders] = useState<KV[]>([{ key: 'Content-Type', value: 'application/json' }]);
  const [bodyType, setBodyType] = useState<BodyType>('none');
  const [bodyText, setBodyText] = useState('');
  const [formData, setFormData] = useState<KV[]>([]);
  const [authType, setAuthType] = useState<AuthType>('none');
  const [authToken, setAuthToken] = useState('');
  const [authUser, setAuthUser] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authApiKey, setAuthApiKey] = useState('');
  const [authApiValue, setAuthApiValue] = useState('');
  const [authApiIn, setAuthApiIn] = useState<'header' | 'query'>('header');
  const [timeout, setTimeout_] = useState(30);
  const [followRedirects, setFollowRedirects] = useState(false);
  const [tab, setTab] = useState<Tab>('params');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [respTab, setRespTab] = useState<'body' | 'headers'>('body');
  const [prettyMode, setPrettyMode] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [curlInput, setCurlInput] = useState('');
  const [showCurlImport, setShowCurlImport] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('request-history') || '[]'); } catch { return []; }
  });
  const [envVars, setEnvVars] = useState<EnvVar[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('request-env') || '[]'); } catch { return []; }
  });

  const saveHistory = () => {
    const entry: HistoryEntry = {
      method, url, timestamp: Date.now(),
      params: [...params], headers: [...headers], bodyType, bodyText, formData: [...formData],
      authType, authToken, authUser, authPass, authApiKey, authApiValue, authApiIn,
    };
    const updated = [entry, ...history.filter((h) => h.url !== url || h.method !== method)].slice(0, 50);
    setHistory(updated);
    localStorage.setItem('request-history', JSON.stringify(updated));
  };

  const restoreHistory = (h: HistoryEntry) => {
    setMethod(h.method as HttpMethod); setUrl(h.url);
    setParams(h.params || []); setHeaders(h.headers || [{ key: 'Content-Type', value: 'application/json' }]);
    setBodyType(h.bodyType || 'none'); setBodyText(h.bodyText || ''); setFormData(h.formData || []);
    setAuthType(h.authType || 'none'); setAuthToken(h.authToken || '');
    setAuthUser(h.authUser || ''); setAuthPass(h.authPass || '');
    setAuthApiKey(h.authApiKey || ''); setAuthApiValue(h.authApiValue || '');
    setAuthApiIn(h.authApiIn || 'header');
    setShowHistory(false);
  };

  const saveEnv = (vars: EnvVar[]) => {
    setEnvVars(vars);
    localStorage.setItem('request-env', JSON.stringify(vars));
  };

  const resolvedUrl = substituteEnv(url, envVars);
  const resolvedBody = substituteEnv(bodyText, envVars);
  const resolvedHeaders = useMemo(() => {
    const h: Record<string, string> = {};
    headers.filter((kv) => kv.key).forEach((kv) => { h[kv.key] = substituteEnv(kv.value, envVars); });
    // Auth
    if (authType === 'bearer' && authToken) h['Authorization'] = `Bearer ${substituteEnv(authToken, envVars)}`;
    if (authType === 'basic' && authUser) h['Authorization'] = 'Basic ' + btoa(`${authUser}:${authPass}`);
    if (authType === 'apikey' && authApiKey) {
      if (authApiIn === 'query') { /* handled below */ }
      else h[authApiKey] = substituteEnv(authApiValue, envVars);
    }
    return h;
  }, [headers, authType, authToken, authUser, authPass, authApiKey, authApiValue, authApiIn, envVars]);

  const resolvedFullUrl = useMemo(() => {
    let u = resolvedUrl;
    const queryParts: string[] = [];
    params.filter((p) => p.key).forEach((p) => queryParts.push(`${encodeURIComponent(p.key)}=${encodeURIComponent(substituteEnv(p.value, envVars))}`));
    if (authType === 'apikey' && authApiIn === 'query' && authApiKey) {
      queryParts.push(`${encodeURIComponent(authApiKey)}=${encodeURIComponent(substituteEnv(authApiValue, envVars))}`);
    }
    if (queryParts.length) u += (u.includes('?') ? '&' : '?') + queryParts.join('&');
    return u;
  }, [resolvedUrl, params, authType, authApiKey, authApiValue, authApiIn, envVars]);

  const buildBody = (): string | null => {
    if (['GET', 'HEAD'].includes(method)) return null;
    if (bodyType === 'json') {
      const t = resolvedBody.trim();
      if (!t) return null;
      try { JSON.parse(t); return t; } catch { return t; }
    }
    if (bodyType === 'urlencoded') {
      return formData.filter((f) => f.key).map((f) => `${encodeURIComponent(f.key)}=${encodeURIComponent(substituteEnv(f.value, envVars))}`).join('&');
    }
    if (bodyType === 'form') return null; // form-data not fully supported via proxy
    if (bodyType === 'raw') return resolvedBody || null;
    return null;
  };

  const handleSend = async () => {
    setLoading(true); setResponse(null); setError(null);
    try {
      const res = await fetch('/api/tools/request-sender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method, url: resolvedFullUrl, headers: resolvedHeaders,
          body: buildBody(), timeout: timeout * 1000,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setResponse(data);
      saveHistory();
    } catch (e: any) { setError(e.message || labels.errorNetwork); }
    finally { setLoading(false); }
  };

  const handleCurlImport = () => {
    const parsed = parseCurl(curlInput);
    if (!parsed) { setError(labels.errorParse); return; }
    setMethod((parsed.method.toUpperCase() as HttpMethod) || 'GET');
    setUrl(parsed.url);
    const hdrArray = Object.entries(parsed.headers).map(([k, v]) => ({ key: k, value: v }));
    if (hdrArray.length) setHeaders(hdrArray);
    if (parsed.body) { setBodyType('raw'); setBodyText(parsed.body); }
    setShowCurlImport(false);
    setCurlInput('');
    setError(null);
  };

  const handleCurlExport = () => {
    const h: Record<string, string> = {};
    headers.filter((kv) => kv.key).forEach((kv) => { h[kv.key] = kv.value; });
    const parts: string[] = ['curl'];
    if (method !== 'GET') parts.push('-X', method);
    for (const [k, v] of Object.entries(h)) parts.push('-H', `'${k}: ${v}'`);
    if (bodyType !== 'none' && resolvedBody) parts.push('-d', `'${resolvedBody}'`);
    parts.push(`'${resolvedUrl}'`);
    navigator.clipboard.writeText(parts.join(' '));
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const handleUrlImport = () => { setUrl(''); };

  const kvEditor = (items: KV[], onChange: (v: KV[]) => void) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      {items.map((kv, idx) => (
        <div key={idx} style={{ display: 'flex', gap: '0.4rem' }}>
          <input value={kv.key} onChange={(e) => { const n = [...items]; n[idx] = { ...n[idx], key: e.target.value }; onChange(n); }}
            placeholder={labels.key} style={inputTight} />
          <input value={kv.value} onChange={(e) => { const n = [...items]; n[idx] = { ...n[idx], value: e.target.value }; onChange(n); }}
            placeholder={labels.value} style={inputTight} />
          <button onClick={() => onChange(items.filter((_, i) => i !== idx))}
            style={btnSmall}>{labels.remove}</button>
        </div>
      ))}
      <button onClick={() => onChange([...items, { key: '', value: '' }])}
        style={{ ...btnSmall, alignSelf: 'flex-start' }}>{labels.add}</button>
    </div>
  );

  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: '0.4rem 0.75rem', fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: 'inherit', border: 'var(--border-width) solid var(--border)',
    borderBottom: 0, background: tab === t ? 'var(--bg)' : 'rgba(0,0,0,0.05)',
    color: 'var(--fg)', marginRight: '-3px', position: 'relative' as const, top: 0,
  });

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg)', color: 'var(--fg)', border: 'var(--border-width) solid var(--border)',
    padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem',
    fontWeight: '700', outline: 'none', width: '100%',
  };
  const inputTight: React.CSSProperties = { ...inputStyle, padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: '100%' };
  const btnSmall: React.CSSProperties = {
    padding: '0.3rem 0.6rem', fontWeight: '800', fontSize: '0.65rem', textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: 'inherit', border: '2px solid var(--border)',
    background: 'var(--bg)', color: 'var(--fg)', whiteSpace: 'nowrap',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.2rem', display: 'block',
  };

  // JSON pretty print helper
  const formatJson = (text: string) => { try { return JSON.stringify(JSON.parse(text), null, 2); } catch { return text; } };
  const displayBody = response ? (response.bodyType === 'json' && prettyMode ? formatJson(response.body) : response.body) : '';

  const statusColor = !response ? 'var(--fg)' :
    response.status < 300 ? 'var(--secondary)' : response.status < 400 ? '#0070f3' : response.status < 500 ? 'var(--accent)' : 'red';

  return (
    <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setShowCurlImport(!showCurlImport)} style={btnSmall}>{labels.curlImport}</button>
        <button onClick={handleCurlExport} style={btnSmall}>{copied ? labels.copied : labels.curlExport}</button>
        <button onClick={() => { setUrl(''); setBodyText(''); setParams([]); setHeaders([{ key: 'Content-Type', value: 'application/json' }]); setFormData([]); setResponse(null); setError(null); }} style={btnSmall}>{labels.clear}</button>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowHistory(!showHistory)} style={btnSmall}>{labels.history}</button>
      </div>

      {/* curl Import */}
      {showCurlImport && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input value={curlInput} onChange={(e) => setCurlInput(e.target.value)} placeholder={labels.curlPlaceholder} style={inputStyle} />
          <button onClick={handleCurlImport} style={{ ...btnSmall, background: 'var(--accent)', color: 'white' }}>Parse</button>
        </div>
      )}

      {/* History */}
      {showHistory && (
        <div style={{ border: 'var(--border-width) solid var(--border)', maxHeight: '200px', overflow: 'auto' }}>
          {history.slice(0, 10).map((h, i) => (
            <button key={i} onClick={() => restoreHistory(h)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.3rem 0.75rem', border: 'none', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', background: 'transparent', color: 'var(--fg)' }}>
              <span style={{ color: 'var(--accent)', marginRight: '0.5rem' }}>{h.method}</span>{h.url}
            </button>
          ))}
        </div>
      )}

      {/* URL Bar */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <select value={method} onChange={(e) => setMethod(e.target.value as HttpMethod)}
          style={{ ...inputStyle, width: 'auto', minWidth: '100px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
          {METHODS.map((m) => <option key={m}>{m}</option>)}
        </select>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={labels.urlPlaceholder} style={inputStyle} />
        <button onClick={handleSend} disabled={loading} className="brutalist-button"
          style={{ background: 'var(--accent)', color: 'white', whiteSpace: 'nowrap', padding: '0.5rem 1rem' }}>
          {loading ? labels.sending : labels.send}
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: 'var(--border-width) solid var(--border)' }}>
        {(Object.keys({ params: 1, headers: 1, body: 1, auth: 1, settings: 1 }) as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={tabStyle(t)}>{labels[t]}</button>
        ))}
        <div style={{ flex: 1, borderBottom: 'var(--border-width) solid var(--border)' }} />
      </div>

      {/* Tab Content */}
      <div style={{ border: 'var(--border-width) solid var(--border)', borderTop: 0, padding: '1rem' }}>
        {tab === 'params' && kvEditor(params, setParams)}
        {tab === 'headers' && kvEditor(headers, setHeaders)}

        {tab === 'body' && (<>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {(['none', 'json', 'urlencoded', 'raw'] as BodyType[]).map((bt) => (
              <button key={bt} onClick={() => setBodyType(bt)}
                style={{ ...btnSmall, background: bodyType === bt ? 'var(--accent)' : 'var(--bg)', color: bodyType === bt ? 'white' : 'var(--fg)' }}>
                {labels[`body${bt.charAt(0).toUpperCase() + bt.slice(1)}` as keyof RequestSenderLabels] || bt}
              </button>
            ))}
          </div>
          {bodyType === 'json' && (
            <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} placeholder={labels.jsonPlaceholder}
              style={{ ...inputStyle, minHeight: '150px', resize: 'vertical', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }} />
          )}
          {bodyType === 'urlencoded' && kvEditor(formData, setFormData)}
          {bodyType === 'raw' && (
            <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)}
              style={{ ...inputStyle, minHeight: '150px', resize: 'vertical', fontFamily: 'var(--font-mono)' }} />
          )}
        </>)}

        {tab === 'auth' && (<>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {(['none', 'bearer', 'basic', 'apikey'] as AuthType[]).map((at) => (
              <button key={at} onClick={() => setAuthType(at)}
                style={{ ...btnSmall, background: authType === at ? 'var(--accent)' : 'var(--bg)', color: authType === at ? 'white' : 'var(--fg)' }}>
                {labels[at === 'none' ? 'noAuth' : at === 'bearer' ? 'bearerToken' : at === 'basic' ? 'basicAuth' : 'apiKey']}
              </button>
            ))}
          </div>
          {authType === 'bearer' && (
            <div><span style={labelStyle}>{labels.token}</span><input value={authToken} onChange={(e) => setAuthToken(e.target.value)} style={inputStyle} /></div>
          )}
          {authType === 'basic' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><span style={labelStyle}>{labels.username}</span><input value={authUser} onChange={(e) => setAuthUser(e.target.value)} style={inputStyle} /></div>
              <div><span style={labelStyle}>{labels.password}</span><input type="password" value={authPass} onChange={(e) => setAuthPass(e.target.value)} style={inputStyle} /></div>
            </div>
          )}
          {authType === 'apikey' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
              <div><span style={labelStyle}>{labels.apiKeyName}</span><input value={authApiKey} onChange={(e) => setAuthApiKey(e.target.value)} style={inputStyle} /></div>
              <div><span style={labelStyle}>{labels.apiKeyValue}</span><input value={authApiValue} onChange={(e) => setAuthApiValue(e.target.value)} style={inputStyle} /></div>
              <div>
                <span style={labelStyle}>{labels.apiKeyIn}</span>
                <select value={authApiIn} onChange={(e) => setAuthApiIn(e.target.value as 'header' | 'query')} style={inputTight}>
                  <option value="header">{labels.authHeader}</option>
                  <option value="query">{labels.authQuery}</option>
                </select>
              </div>
            </div>
          )}
        </>)}

        {tab === 'settings' && (<>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <span style={labelStyle}>{labels.timeout}</span>
              <input type="number" value={timeout} onChange={(e) => setTimeout_(parseInt(e.target.value) || 30)} min={1} max={120} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={followRedirects} onChange={(e) => setFollowRedirects(e.target.checked)} />
                {labels.followRedirects}
              </label>
            </div>
          </div>
          <div>
            <span style={{ ...labelStyle, marginBottom: '0.5rem' }}>{labels.envVars}</span>
            {kvEditor(envVars, (v) => saveEnv(v))}
          </div>
        </>)}
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '0.75rem', background: 'var(--accent)', color: 'white', fontWeight: '800', fontSize: '0.85rem', border: '2px solid var(--border)' }}>
          {error}
        </div>
      )}

      {/* Response */}
      <div style={{ border: 'var(--border-width) solid var(--border)', boxShadow: '4px 4px 0px var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', borderBottom: 'var(--border-width) solid var(--border)', background: 'var(--fg)', color: 'var(--bg)', gap: '1.5rem' }}>
          {response ? (
            <>
              <span style={{ fontWeight: '800', color: statusColor }}>● {response.status} {response.statusText}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{labels.time}: {response.time}ms</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{labels.size}: {formatSize(response.size)}</span>
            </>
          ) : (
            <span style={{ fontWeight: '800', fontSize: '0.8rem', opacity: 0.6 }}>{labels.noResponse}</span>
          )}
          <div style={{ flex: 1 }} />
          {response && (
            <>
              <button onClick={() => setRespTab('body')} style={{ ...btnSmall, background: respTab === 'body' ? 'var(--bg)' : 'transparent', color: respTab === 'body' ? 'black' : 'var(--bg)', borderColor: 'var(--bg)' }}>{labels.responseBody}</button>
              <button onClick={() => setRespTab('headers')} style={{ ...btnSmall, background: respTab === 'headers' ? 'var(--bg)' : 'transparent', color: respTab === 'headers' ? 'black' : 'var(--bg)', borderColor: 'var(--bg)' }}>{labels.responseHeaders}</button>
            </>
          )}
        </div>
        <div style={{ padding: '1rem' }}>
          {!response ? null : respTab === 'body' ? (
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {response.bodyType === 'json' && (
                  <button onClick={() => setPrettyMode(!prettyMode)} style={btnSmall}>{prettyMode ? labels.raw : labels.pretty}</button>
                )}
                <button onClick={() => { navigator.clipboard.writeText(displayBody); setCopied(true); setTimeout(() => setCopied(false), 1500); }} style={btnSmall}>
                  {copied ? labels.copied : labels.copy}
                </button>
              </div>
              <pre style={{
                background: 'rgba(0,0,0,0.03)', padding: '1rem', margin: 0,
                fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: 1.6,
                overflow: 'auto', maxHeight: '400px', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              }}>
                {response.bodyType === 'binary' ? `[Binary data: ${formatSize(response.size)}]` : displayBody}
              </pre>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {Object.entries(response.headers).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                  <span style={{ fontWeight: '800', minWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k}:</span>
                  <span style={{ opacity: 0.8, wordBreak: 'break-all' }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Privacy notice */}
      <div style={{
        textAlign: 'center', padding: '0.4rem',
        fontSize: '0.6rem', fontWeight: '600', opacity: 0.4,
        textTransform: 'uppercase', letterSpacing: '0.03em',
      }}>
        {labels.privacyNote}
      </div>
    </div>
  );
}
