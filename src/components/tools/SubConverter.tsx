'use client';

import { useState } from 'react';
import { SelectDropdown } from '@/components/SelectDropdown';

interface Labels {
  subconverterUrl: string; subscriptionUrl: string; target: string;
  ruleset: string; customRules: string; include: string; exclude: string;
  rename: string; emoji: string; udp: string; scv: string; tfo: string;
  convertIt: string; converting: string; result: string;
  subscriptionLink: string; copyLink: string; copyConfig: string; downloadConfig: string;
  copied: string; failed: string;
  rulesetsDesc: string; placeholderSubUrl: string; placeholderSubLink: string; placeholderCustomRules: string;
  rulesets: { n: string; d: string }[];
}

interface Result { subscriptionUrl: string; config: string; size: number; }

const TARGETS = ['clash', 'clashr', 'surge', 'surfboard', 'quantumult', 'quantumultx', 'loon', 'mellow', 'ss', 'ssr', 'ssd', 'v2ray', 'trojan', 'sip008'];

const RULESET_URLS = [
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_AdblockPlus.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Full.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Full_AdblockPlus.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Full_Google.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Full_MultiMode.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Full_Netflix.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Full_NoAuto.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Mini.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Mini_AdblockPlus.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Mini_Ai.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Mini_Fallback.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Mini_MultiCountry.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Mini_MultiMode.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Mini_NoAuto.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_MultiCountry.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_NoAuto.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_NoReject.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Mini.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Mini_Fallback.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Mini_MultiMode.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Mini_NoAuto.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_BackCN.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_NoApple.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_NoMicrosoft.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_NoAuto.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_NoAuto_NoApple.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_NoAuto_NoApple_NoMicrosoft.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_AdblockPlus.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_WithChinaIp.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_WithChinaIp_WithGFW.ini',
  'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_WithGFW.ini',
  '',
];

export function SubConverter({ labels }: { labels: Labels }) {
  const [subUrl, setSubUrl] = useState('');
  const [subLink, setSubLink] = useState('');
  const [target, setTarget] = useState('clash');
  const [ruleset, setRuleset] = useState(RULESET_URLS[0]);
  const [customRules, setCustomRules] = useState('');
  const [include, setInclude] = useState('');
  const [exclude, setExclude] = useState('');
  const [rename, setRename] = useState('');
  const [emoji, setEmoji] = useState(true);
  const [udp, setUdp] = useState(true);
  const [scv, setScv] = useState(false);
  const [tfo, setTfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState('');

  const finalRules = customRules || ruleset;

  const convert = async () => {
    if (!subUrl || !subLink) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const res = await fetch('/api/tools/subconverter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subconverterUrl: subUrl, url: subLink, target,
          config: finalRules || undefined,
          include: include || undefined, exclude: exclude || undefined,
          rename: rename || undefined, emoji, udp, scv, tfo,
        }),
      });
      const d = await res.json();
      if (d.error) { setError(d.error + (d.detail ? ': ' + d.detail : '')); return; }
      setResult(d);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(() => setCopied(''), 1500);
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([result.config], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `subconverter-${target}.yaml`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg)', color: 'var(--fg)', border: 'var(--border-width) solid var(--border)',
    padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
    fontWeight: '700', outline: 'none', width: '100%',
  };
  const lbl: React.CSSProperties = {
    fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'block', letterSpacing: '0.05em',
  };
  const btnS: React.CSSProperties = {
    padding: '0.35rem 0.7rem', fontWeight: '800', fontSize: '0.65rem', textTransform: 'uppercase',
    cursor: 'pointer', fontFamily: 'inherit', border: '2px solid var(--border)',
    background: 'var(--bg)', color: 'var(--fg)', whiteSpace: 'nowrap',
  };
  const toggleStyle = (on: boolean): React.CSSProperties => ({
    ...btnS, background: on ? 'var(--secondary)' : 'var(--bg)', color: on ? 'black' : 'var(--fg)',
    boxShadow: on ? '2px 2px 0px var(--border)' : 'none',
  });

  return (
    <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Subconverter URL */}
      <div>
        <label style={lbl}>{labels.subconverterUrl}</label>
        <input value={subUrl} onChange={(e) => setSubUrl(e.target.value)} placeholder={labels.placeholderSubUrl} style={inputStyle} />
      </div>

      {/* Subscription Link */}
      <div>
        <label style={lbl}>{labels.subscriptionUrl}</label>
        <input value={subLink} onChange={(e) => setSubLink(e.target.value)} placeholder={labels.placeholderSubLink} style={inputStyle} />
      </div>

      {/* Target + Rule Set */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={lbl}>{labels.target}</label>
          <SelectDropdown
            label={labels.target}
            value={target}
            onChange={setTarget}
            options={TARGETS.map((t) => ({ name: t, desc: '', value: t }))}
          />
        </div>
        <div>
          <label style={lbl}>{labels.ruleset}</label>
          <SelectDropdown
            label={labels.ruleset}
            value={ruleset}
            onChange={(v) => { setRuleset(v); setCustomRules(''); }}
            options={labels.rulesets.map((r, i) => ({ name: r.n, desc: r.d, value: RULESET_URLS[i] || '' }))}
          />
        </div>
      </div>

      {/* Custom Rules URL */}
      <div>
        <label style={lbl}>{labels.customRules}</label>
        <input value={customRules} onChange={(e) => setCustomRules(e.target.value)} placeholder={labels.placeholderCustomRules} style={inputStyle} />
      </div>

      {/* Include / Exclude / Rename */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={lbl}>{labels.include}</label>
          <input value={include} onChange={(e) => setInclude(e.target.value)} placeholder="HK, JP, US" style={inputStyle} />
        </div>
        <div>
          <label style={lbl}>{labels.exclude}</label>
          <input value={exclude} onChange={(e) => setExclude(e.target.value)} placeholder="Expire, Timeout" style={inputStyle} />
        </div>
        <div>
          <label style={lbl}>{labels.rename}</label>
          <input value={rename} onChange={(e) => setRename(e.target.value)} placeholder="OldName@NewName" style={inputStyle} />
        </div>
      </div>

      {/* Toggles */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setEmoji(!emoji)} style={toggleStyle(emoji)}>{labels.emoji}</button>
        <button onClick={() => setUdp(!udp)} style={toggleStyle(udp)}>{labels.udp}</button>
        <button onClick={() => setScv(!scv)} style={toggleStyle(scv)}>{labels.scv}</button>
        <button onClick={() => setTfo(!tfo)} style={toggleStyle(tfo)}>{labels.tfo}</button>
      </div>

      {/* Convert button */}
      <button onClick={convert} disabled={loading || !subUrl || !subLink} className="brutalist-button"
        style={{ width: '100%', background: 'var(--accent)', color: 'white' }}>
        {loading ? labels.converting : labels.convertIt}
      </button>

      {/* Error */}
      {error && (
        <div style={{ padding: '0.75rem', background: 'var(--accent)', color: 'white', fontWeight: '800', fontSize: '0.8rem', border: '2px solid var(--border)', wordBreak: 'break-all' }}>
          {labels.failed}: {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="brutalist-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>{labels.result} ({labels.target}: {target}, {result.size.toLocaleString()} bytes)</h3>

          {/* Subscription Link */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={lbl}>{labels.subscriptionLink}</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input readOnly value={result.subscriptionUrl} style={{ ...inputStyle, flex: 1, fontSize: '0.75rem' }} />
              <button onClick={() => copy(result.subscriptionUrl, 'link')} style={btnS}>
                {copied === 'link' ? labels.copied : labels.copyLink}
              </button>
            </div>
          </div>

          {/* Config */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={lbl}>Config</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button onClick={() => copy(result.config, 'cfg')} style={btnS}>
                  {copied === 'cfg' ? labels.copied : labels.copyConfig}
                </button>
                <button onClick={download} style={btnS}>{labels.downloadConfig}</button>
              </div>
            </div>
            <pre style={{
              background: 'rgba(0,0,0,0.03)', padding: '1rem', margin: 0,
              fontFamily: 'var(--font-mono)', fontSize: '0.7rem', lineHeight: 1.6,
              overflow: 'auto', maxHeight: '400px', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>
              {result.config.slice(0, 50000)}{result.config.length > 50000 ? '\n\n... (truncated)' : ''}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
