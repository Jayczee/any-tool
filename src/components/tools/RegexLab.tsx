'use client';

import { useState, useMemo, useCallback } from 'react';
import { RegexSnippets, type RegexSnippet } from './RegexSnippets';

type Tab = 'match' | 'replace' | 'explain' | 'benchmark' | 'export';

interface RegexLabLabels {
  pattern: string;
  flags: string;
  testText: string;
  snippetLibrary: string;
  snippetValidation: string;
  snippetCommon: string;
  snippetFormatting: string;
  snippetNumbers: string;
  snippetNetwork: string;
  tabMatch: string;
  tabReplace: string;
  tabExplain: string;
  tabBenchmark: string;
  tabExport: string;
  matches: string;
  matchIn: string;
  lines: string;
  noMatch: string;
  matchIndex: string;
  groupIndex: string;
  replacePattern: string;
  replaceResult: string;
  before: string;
  after: string;
  copyReplaceResult: string;
  explainTitle: string;
  explainLiteral: string;
  explainQuantifier: string;
  explainAnchor: string;
  explainGroup: string;
  explainClass: string;
  explainEscape: string;
  explainAlternation: string;
  explainExactly: string;
  explainAtLeast: string;
  explainBetween: string;
  explainZeroOrOne: string;
  explainZeroOrMore: string;
  explainOneOrMore: string;
  explainStart: string;
  explainEnd: string;
  explainWordBoundary: string;
  explainAnyChar: string;
  explainDigit: string;
  explainWord: string;
  explainWhitespace: string;
  explainNotDigit: string;
  explainNotWord: string;
  explainNotWhitespace: string;
  explainCapturingGroup: string;
  explainNonCapturingGroup: string;
  benchmarkIterations: string;
  benchmarkRun: string;
  benchmarkTotal: string;
  benchmarkAvg: string;
  benchmarkPerSec: string;
  benchmarkCompare: string;
  benchmarkCompPattern: string;
  benchmarkNoComp: string;
  benchmarkWarning: string;
  exportTitle: string;
  exportCopied: string;
  exportCopy: string;
  placeholderPattern: string;
  placeholderTestText: string;
  placeholderReplace: string;
  helpMatch: string;
  helpReplace: string;
  helpExplain: string;
  helpBenchmark: string;
  helpExport: string;
  explainLookahead: string;
  explainLookbehind: string;
  explainNewline: string;
  explainTab: string;
  explainEscaped: string;
  explainCharClass: string;
}

interface BenchmarkResult {
  totalTime: number;
  avgTime: number;
  opsPerSec: number;
  hasBacktrackingRisk: boolean;
}

function checkBacktrackingRisk(pattern: string): boolean {
  return /\([^)]*[\+\*][^)]*\)[\+\*]/.test(pattern) ||
         /\([^)]*\)[\+\*]\{/.test(pattern) ||
         /\([^)]*[\+\*][^)]*\)[\+\*]/.test(pattern);
}

function runBenchmark(pattern: string, flags: string, text: string, iterations: number): BenchmarkResult {
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch {
    return { totalTime: 0, avgTime: 0, opsPerSec: 0, hasBacktrackingRisk: false };
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    regex.exec(text);
    regex.lastIndex = 0;
  }
  const totalTime = performance.now() - start;

  return {
    totalTime,
    avgTime: totalTime / iterations,
    opsPerSec: Math.round((iterations / totalTime) * 1000),
    hasBacktrackingRisk: checkBacktrackingRisk(pattern),
  };
}

interface ExplainToken {
  token: string;
  type: string;
  description: string;
}

function explainRegex(pattern: string, labels: RegexLabLabels): ExplainToken[] {
  const tokens: ExplainToken[] = [];
  let i = 0;

  while (i < pattern.length) {
    // Start of string anchor
    if (pattern[i] === '^' && (i === 0 || pattern[i - 1] !== '\\')) {
      tokens.push({ token: '^', type: labels.explainAnchor, description: labels.explainStart });
      i++; continue;
    }
    // End of string anchor
    if (pattern[i] === '$' && i < pattern.length && pattern[i - 1] !== '\\') {
      tokens.push({ token: '$', type: labels.explainAnchor, description: labels.explainEnd });
      i++; continue;
    }
    // Alternation
    if (pattern[i] === '|' && pattern[i - 1] !== '\\') {
      tokens.push({ token: '|', type: labels.explainAlternation, description: 'OR' });
      i++; continue;
    }
    // Escape sequences
    if (pattern[i] === '\\') {
      const esc = pattern.slice(i, i + 2);
      const descMap: Record<string, string> = {
        '\\d': labels.explainDigit, '\\D': labels.explainNotDigit,
        '\\w': labels.explainWord, '\\W': labels.explainNotWord,
        '\\s': labels.explainWhitespace, '\\S': labels.explainNotWhitespace,
        '\\b': labels.explainWordBoundary,
        '\\n': labels.explainNewline,
        '\\t': labels.explainTab,
      };
      tokens.push({
        token: esc,
        type: labels.explainEscape,
        description: descMap[esc] || labels.explainEscaped.replace('{c}', esc[1]),
      });
      i += 2; continue;
    }
    // Character class [...]
    if (pattern[i] === '[') {
      let end = i + 1;
      while (end < pattern.length && pattern[end] !== ']') end++;
      const cls = pattern.slice(i, end + 1);
      tokens.push({
        token: cls.length > 30 ? cls.slice(0, 30) + '...]' : cls,
        type: labels.explainClass,
        description: labels.explainCharClass.replace('{c}', cls),
      });
      i = end + 1; continue;
    }
    // Grouping parentheses
    if (pattern[i] === '(') {
      const isNonCapture = pattern[i + 1] === '?' && pattern[i + 2] === ':';
      const isLookahead = pattern[i + 1] === '?' && (pattern[i + 2] === '=' || pattern[i + 2] === '!');
      const isLookbehind = pattern[i + 1] === '?' && (pattern[i + 2] === '<');
      let end = i + 1;
      let depth = 1;
      while (end < pattern.length && depth > 0) {
        if (pattern[end] === '\\') { end += 2; continue; }
        if (pattern[end] === '(') depth++;
        if (pattern[end] === ')') depth--;
        end++;
      }
      const grp = pattern.slice(i, end);
      let desc: string;
      if (isNonCapture) desc = labels.explainNonCapturingGroup;
      else if (isLookahead) desc = labels.explainLookahead;
      else if (isLookbehind) desc = labels.explainLookbehind;
      else desc = labels.explainCapturingGroup.replace('{n}', String(tokens.filter(t => t.type === labels.explainGroup).length + 1));
      tokens.push({
        token: grp.length > 40 ? grp.slice(0, 40) + '...)' : grp,
        type: labels.explainGroup,
        description: desc,
      });
      i = end; continue;
    }
    // Quantifiers
    if (pattern[i] === '*' || pattern[i] === '+' || pattern[i] === '?') {
      const map: Record<string, string> = {
        '*': labels.explainZeroOrMore, '+': labels.explainOneOrMore, '?': labels.explainZeroOrOne,
      };
      tokens.push({ token: pattern[i], type: labels.explainQuantifier, description: map[pattern[i]] });
      i++; continue;
    }
    // {n,m} quantifier
    if (pattern[i] === '{') {
      let end = i + 1;
      while (end < pattern.length && pattern[end] !== '}') end++;
      const inner = pattern.slice(i + 1, end);
      const parts = inner.split(',');
      let desc: string;
      if (parts.length === 1) {
        desc = labels.explainExactly.replace('{n}', parts[0]);
      } else if (parts[1] === '') {
        desc = labels.explainAtLeast.replace('{n}', parts[0]);
      } else {
        desc = labels.explainBetween.replace('{n}', parts[0]).replace('{m}', parts[1]);
      }
      tokens.push({ token: pattern.slice(i, end + 1), type: labels.explainQuantifier, description: desc });
      i = end + 1; continue;
    }
    // Dot
    if (pattern[i] === '.') {
      tokens.push({ token: '.', type: labels.explainLiteral, description: labels.explainAnyChar });
      i++; continue;
    }
    // Literal
    tokens.push({ token: pattern[i], type: labels.explainLiteral, description: `Literal '${pattern[i]}'` });
    i++;
  }

  return tokens;
}

function generateExports(pattern: string, flags: string): Array<{ lang: string; code: string }> {
  const escaped = pattern.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const jsFlags = flags.replace('g', '').replace('s', '');

  return [
    { lang: 'JavaScript', code: flags ? `/${pattern}/${flags}` : `new RegExp('${escaped}')` },
    { lang: 'Python', code: `re.compile(r'${pattern}'${flags ? `, re.${flags.toUpperCase().split('').join(' | re.')}` : ''})` },
    { lang: 'Rust', code: `Regex::new(r"${pattern}").unwrap();` },
    { lang: 'PHP', code: `'/${escaped}/${flags}'` },
    { lang: 'Go', code: `regexp.MustCompile(\`${pattern}\`)` },
    { lang: 'Java', code: `Pattern.compile("${escaped}"${jsFlags ? `, Pattern.${jsFlags.split('').map(f => f === 'i' ? 'CASE_INSENSITIVE' : f === 'm' ? 'MULTILINE' : f === 'u' ? 'UNICODE_CASE' : '').filter(Boolean).join(' | ')}` : ''});` },
  ];
}

export function RegexLab({ labels, lang }: { labels: RegexLabLabels; lang: string }) {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [testText, setTestText] = useState('');
  const [tab, setTab] = useState<Tab>('match');
  const [replacePattern, setReplacePattern] = useState('');
  const [benchIterations, setBenchIterations] = useState(10000);
  const [benchComparison, setBenchComparison] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const flagOptions = [
    { key: 'g', label: 'g' },
    { key: 'i', label: 'i' },
    { key: 'm', label: 'm' },
    { key: 's', label: 's' },
    { key: 'u', label: 'u' },
  ];

  const toggleFlag = (flag: string) => {
    setFlags(prev => prev.includes(flag) ? prev.replace(flag, '') : prev + flag);
  };

  const regex = useMemo(() => {
    try { return new RegExp(pattern, flags); } catch { return null; }
  }, [pattern, flags]);

  const matchResult = useMemo(() => {
    if (!regex || !testText || !pattern) return null;
    try {
      const matches = Array.from(testText.matchAll(regex));
      return { matches, count: matches.length };
    } catch { return null; }
  }, [regex, testText, pattern]);

  const replaceResult = useMemo(() => {
    if (!regex || !testText || !pattern) return null;
    try {
      const result = testText.replace(regex, replacePattern);
      return { result, changed: result !== testText };
    } catch { return null; }
  }, [regex, testText, pattern, replacePattern]);

  const explainResult = useMemo(() => {
    if (!pattern) return [];
    return explainRegex(pattern, labels);
  }, [pattern, labels]);

  const benchmarkResult = useMemo(() => {
    if (!pattern || !testText) return null;
    const main = runBenchmark(pattern, flags, testText, benchIterations);
    let comp: BenchmarkResult | null = null;
    if (benchComparison) {
      try {
        comp = runBenchmark(benchComparison, flags, testText, benchIterations);
      } catch { comp = null; }
    }
    return { main, comp };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern, flags, testText, benchIterations, benchComparison]);

  const exports = useMemo(() => {
    if (!pattern) return [];
    return generateExports(pattern, flags);
  }, [pattern, flags]);

  const handleSnippetSelect = useCallback((s: RegexSnippet) => {
    setPattern(s.pattern);
    setFlags(s.flags);
    setTab('match');
  }, []);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const highlightMatches = (): React.ReactNode[] => {
    if (!matchResult || matchResult.count === 0) return [testText];

    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    const groupColors = ['var(--secondary)', '#0070f3', '#ff4d00', '#8b5cf6', '#10b981'];

    matchResult.matches.forEach((match, mi) => {
      if (match.index !== undefined && match.index >= lastIndex) {
        if (match.index > lastIndex) {
          nodes.push(<span key={`txt-${mi}`}>{testText.slice(lastIndex, match.index)}</span>);
        }
        // Full match highlight
        const fullMatch = match[0];
        if (fullMatch.length > 0) {
          nodes.push(
            <span key={`match-${mi}`} style={{
              background: 'var(--accent)', color: 'white', fontWeight: '700',
              padding: '0 2px', border: '1px solid var(--border)',
            }}>{fullMatch}</span>
          );
        }
        lastIndex = (match.index || 0) + fullMatch.length;
      }
    });

    if (lastIndex < testText.length) {
      nodes.push(<span key="txt-end">{testText.slice(lastIndex)}</span>);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = groupColors;
    return nodes;
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg)', color: 'var(--fg)',
    border: 'var(--border-width) solid var(--border)',
    padding: '0.6rem 0.75rem',
    fontFamily: 'var(--font-mono)', fontSize: '0.95rem',
    fontWeight: '700', outline: 'none', width: '100%',
  };

  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: '0.6rem 1.2rem',
    background: tab === t ? 'var(--fg)' : 'var(--bg)',
    color: tab === t ? 'var(--bg)' : 'var(--fg)',
    border: 'var(--border-width) solid var(--border)',
    borderBottom: tab === t ? 'none' : undefined,
    fontWeight: '800', fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    cursor: 'pointer', fontFamily: 'inherit',
    position: 'relative' as const,
    top: tab === t ? 'var(--border-width)' : 0,
  });

  const tabs: Tab[] = ['match', 'replace', 'explain', 'benchmark', 'export'];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Pattern Input Row */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
            {labels.pattern}
          </label>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder={labels.placeholderPattern}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
            {labels.flags}
          </label>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            {flagOptions.map((f) => (
              <button
                key={f.key}
                onClick={() => toggleFlag(f.key)}
                style={{
                  width: '2rem', height: '2rem',
                  background: flags.includes(f.key) ? 'var(--accent)' : 'var(--bg)',
                  color: flags.includes(f.key) ? 'white' : 'var(--fg)',
                  border: 'var(--border-width) solid var(--border)',
                  fontWeight: '800', fontSize: '0.8rem',
                  cursor: 'pointer', fontFamily: 'var(--font-mono)',
                  boxShadow: flags.includes(f.key) ? '2px 2px 0px var(--border)' : 'none',
                }}
              >{f.label}</button>
            ))}
          </div>
        </div>
        <div style={{ paddingTop: '1.2rem' }}>
          <RegexSnippets
            lang={lang}
            onSelect={handleSnippetSelect}
            labels={{
              title: labels.snippetLibrary,
              validation: labels.snippetValidation,
              common: labels.snippetCommon,
              formatting: labels.snippetFormatting,
              numbers: labels.snippetNumbers,
              network: labels.snippetNetwork,
            }}
          />
        </div>
      </div>

      {/* Test Text */}
      <div>
        <label style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
          {labels.testText}
        </label>
        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          placeholder={labels.placeholderTestText}
          style={{
            ...inputStyle,
            minHeight: '180px', resize: 'vertical',
            whiteSpace: 'pre-wrap',
          }}
        />
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '0', borderBottom: 'var(--border-width) solid var(--border)' }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={tabStyle(t)}>
            {labels[`tab${t.charAt(0).toUpperCase() + t.slice(1)}` as keyof RegexLabLabels]}
          </button>
        ))}
        <div style={{ flex: 1, borderBottom: 'var(--border-width) solid var(--border)' }} />
      </div>

      {/* Tab Content */}
      <div style={{ border: 'var(--border-width) solid var(--border)', borderTop: 0, padding: '1.5rem', minHeight: '200px' }}>
        {/* MATCH TAB */}
        {tab === 'match' && (
          <div>
            {!matchResult ? (
              <div style={{ opacity: 0.5, fontWeight: '800', textAlign: 'center', padding: '2rem' }}>
                {labels.helpMatch}
              </div>
            ) : matchResult.count === 0 ? (
              <div style={{
                background: 'var(--accent)', color: 'white', padding: '1rem',
                fontWeight: '800', fontSize: '1.2rem', textAlign: 'center',
                border: '2px solid var(--border)',
              }}>
                {labels.noMatch}
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1.5rem', fontWeight: '700', fontSize: '0.9rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: '800' }}>{matchResult.count}</span> {labels.matches} {labels.matchIn} {testText.split('\n').length} {labels.lines}
                </div>
                <div style={{
                  background: 'rgba(0,0,0,0.03)', padding: '1rem',
                  border: 'var(--border-width) solid var(--border)',
                  fontFamily: 'var(--font-mono)', fontSize: '1rem',
                  lineHeight: '1.8', marginBottom: '1.5rem',
                  overflowWrap: 'break-word', wordBreak: 'break-all',
                }}>
                  {highlightMatches()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {matchResult.matches.map((match, mi) => (
                    <div key={mi} style={{
                      border: '2px solid var(--border)', padding: '0.75rem',
                      background: 'var(--bg)',
                    }}>
                      <div style={{ fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        {labels.matchIndex} {mi + 1}: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{match[0]}</span>
                      </div>
                      {match.length > 1 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {Array.from({ length: match.length - 1 }, (_, gi) => (
                            <span key={gi} style={{
                              fontSize: '0.7rem', fontWeight: '700',
                              padding: '0.2rem 0.5rem',
                              border: '2px solid var(--border)',
                              fontFamily: 'var(--font-mono)',
                            }}>
                              {labels.groupIndex} {gi + 1}: {match[gi + 1] || '(empty)'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* REPLACE TAB */}
        {tab === 'replace' && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                {labels.replacePattern}
              </label>
              <input
                type="text"
                value={replacePattern}
                onChange={(e) => setReplacePattern(e.target.value)}
                placeholder={labels.placeholderReplace}
                style={inputStyle}
              />
            </div>
            {replaceResult ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{labels.before}</div>
                  <div style={{
                    border: 'var(--border-width) solid var(--border)', padding: '0.75rem',
                    fontFamily: 'var(--font-mono)', fontSize: '0.9rem',
                    whiteSpace: 'pre-wrap', minHeight: '100px',
                    overflowWrap: 'break-word', wordBreak: 'break-all',
                  }}>
                    {testText}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{labels.after}</div>
                  <div style={{
                    border: 'var(--border-width) solid var(--border)', padding: '0.75rem',
                    fontFamily: 'var(--font-mono)', fontSize: '0.9rem',
                    whiteSpace: 'pre-wrap', minHeight: '100px',
                    overflowWrap: 'break-word', wordBreak: 'break-all',
                    background: replaceResult.changed ? 'rgba(0,230,118,0.1)' : undefined,
                  }}>
                    {replaceResult.result}
                  </div>
                </div>
                {replaceResult.changed && (
                  <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleCopy(replaceResult.result, -1)}
                      className="brutalist-button"
                      style={{ background: 'black', color: 'white', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                    >
                      {copiedIdx === -1 ? labels.exportCopied : labels.copyReplaceResult}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ opacity: 0.5, fontWeight: '800', textAlign: 'center', padding: '2rem' }}>
                {labels.helpReplace}
              </div>
            )}
          </div>
        )}

        {/* EXPLAIN TAB */}
        {tab === 'explain' && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '1rem' }}>
              {labels.explainTitle}
            </h3>
            {explainResult.length === 0 ? (
              <div style={{ opacity: 0.5, fontWeight: '800', textAlign: 'center', padding: '2rem' }}>
                {labels.helpExplain}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {explainResult.map((tok, idx) => (
                  <div key={idx} style={{
                    display: 'grid', gridTemplateColumns: 'auto 1fr',
                    gap: '1rem', padding: '0.6rem 0.75rem',
                    borderBottom: '1px solid var(--border)',
                    alignItems: 'baseline',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontWeight: '800',
                      background: 'var(--fg)', color: 'var(--bg)',
                      padding: '0.15rem 0.5rem', fontSize: '0.85rem',
                    }}>{tok.token}</span>
                    <div>
                      <span style={{
                        fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase',
                        opacity: 0.5, marginRight: '0.5rem',
                      }}>{tok.type}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{tok.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BENCHMARK TAB */}
        {tab === 'benchmark' && (
          <div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                  {labels.benchmarkIterations}
                </label>
                <select
                  value={benchIterations}
                  onChange={(e) => setBenchIterations(parseInt(e.target.value))}
                  style={inputStyle}
                >
                  {[100, 1000, 10000, 100000, 1000000].map((n) => (
                    <option key={n} value={n}>{n.toLocaleString()}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                  {labels.benchmarkCompare}
                </label>
                <input
                  type="text"
                  value={benchComparison}
                  onChange={(e) => setBenchComparison(e.target.value)}
                  placeholder={labels.benchmarkNoComp}
                  style={inputStyle}
                />
              </div>
            </div>

            {benchmarkResult ? (
              <div>
                {benchmarkResult.main.hasBacktrackingRisk && (
                  <div style={{
                    background: 'var(--accent)', color: 'white', padding: '0.75rem',
                    fontWeight: '800', fontSize: '0.8rem', marginBottom: '1rem',
                    border: '2px solid var(--border)',
                  }}>
                    {labels.benchmarkWarning}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: benchComparison ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                  {([
                    { result: benchmarkResult.main, label: pattern },
                    ...(benchmarkResult.comp ? [{ result: benchmarkResult.comp, label: benchComparison }] : []),
                  ]).map((item, idx) => (
                    <div key={idx} style={{
                      border: 'var(--border-width) solid var(--border)', padding: '1rem',
                      boxShadow: '3px 3px 0px var(--border)',
                    }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.8rem', marginBottom: '0.75rem', overflowWrap: 'break-word' }}>
                        {item.label}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase', opacity: 0.5 }}>{labels.benchmarkTotal}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '1.2rem' }}>{item.result.totalTime.toFixed(2)}ms</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase', opacity: 0.5 }}>{labels.benchmarkAvg}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '1.2rem' }}>{item.result.avgTime.toFixed(4)}ms</div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase', opacity: 0.5 }}>{labels.benchmarkPerSec}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '1.2rem' }}>{item.result.opsPerSec.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ opacity: 0.5, fontWeight: '800', textAlign: 'center', padding: '2rem' }}>
                {labels.helpBenchmark}
              </div>
            )}
          </div>
        )}

        {/* EXPORT TAB */}
        {tab === 'export' && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '1rem' }}>
              {labels.exportTitle}
            </h3>
            {exports.length === 0 ? (
              <div style={{ opacity: 0.5, fontWeight: '800', textAlign: 'center', padding: '2rem' }}>
                {labels.helpExport}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {exports.map((exp, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    border: '2px solid var(--border)', padding: '0.5rem 0.75rem',
                  }}>
                    <span style={{
                      fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase',
                      minWidth: '80px', flexShrink: 0,
                    }}>{exp.lang}</span>
                    <code style={{
                      flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{exp.code}</code>
                    <button
                      onClick={() => handleCopy(exp.code, idx)}
                      className="brutalist-button"
                      style={{ background: 'black', color: 'white', padding: '0.3rem 0.75rem', fontSize: '0.7rem', flexShrink: 0 }}
                    >
                      {copiedIdx === idx ? labels.exportCopied : labels.exportCopy}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
