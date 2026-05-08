'use client';

import { useState, useRef, useEffect } from 'react';

export interface RegexSnippet {
  id: string;
  name: string;
  description: string;
  pattern: string;
  flags: string;
  category: string;
}

interface RegexSnippetsProps {
  lang: string;
  onSelect: (snippet: RegexSnippet) => void;
  labels: {
    title: string;
    validation: string;
    common: string;
    formatting: string;
    numbers: string;
    network: string;
  };
}

const snippets: Array<{
  id: string;
  nameEn: string;
  nameZh: string;
  descEn: string;
  descZh: string;
  pattern: string;
  flags: string;
  category: 'validation' | 'common' | 'formatting' | 'numbers' | 'network';
}> = [
  // Validation
  { id: 'email', nameEn: 'Email', nameZh: '邮箱', descEn: 'Standard email validation', descZh: '标准邮箱地址验证', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', flags: 'g', category: 'validation' },
  { id: 'url', nameEn: 'URL', nameZh: '网址', descEn: 'HTTP/HTTPS URL', descZh: 'HTTP/HTTPS 网址', pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)', flags: 'gi', category: 'validation' },
  { id: 'ipv4', nameEn: 'IPv4 Address', nameZh: 'IPv4 地址', descEn: 'Match valid IPv4 addresses', descZh: '匹配有效的 IPv4 地址', pattern: '\\b((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b', flags: 'g', category: 'validation' },
  { id: 'ipv6', nameEn: 'IPv6 Address', nameZh: 'IPv6 地址', descEn: 'Match standard IPv6 addresses', descZh: '匹配标准 IPv6 地址', pattern: '(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))', flags: 'gi', category: 'validation' },
  { id: 'phone-us', nameEn: 'Phone (US)', nameZh: '电话 (美国)', descEn: 'US phone numbers with optional country code', descZh: '美国电话号码，支持可选国际区号', pattern: '(\\+?1[-.]?)?\\(?[0-9]{3}\\)?[-.\\s]?[0-9]{3}[-.\\s]?[0-9]{4}', flags: 'g', category: 'validation' },
  { id: 'phone-cn', nameEn: 'Phone (CN)', nameZh: '电话 (中国)', descEn: 'Chinese mobile & landline numbers', descZh: '中国手机号及固定电话', pattern: '(\\+?86)?1[3-9]\\d{9}', flags: 'g', category: 'validation' },
  { id: 'date', nameEn: 'Date (YYYY-MM-DD)', nameZh: '日期 (YYYY-MM-DD)', descEn: 'ISO 8601 date format', descZh: 'ISO 8601 日期格式', pattern: '\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])', flags: 'g', category: 'validation' },
  { id: 'time', nameEn: 'Time (HH:MM)', nameZh: '时间 (HH:MM)', descEn: '24-hour time with optional seconds', descZh: '24 小时制，可选秒', pattern: '([01]?\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?', flags: 'g', category: 'validation' },
  { id: 'hex-color', nameEn: 'Hex Color', nameZh: '十六进制颜色', descEn: '3/6/8 digit hex color codes', descZh: '3/6/8 位十六进制颜色值', pattern: '#([a-fA-F0-9]{6}|[a-fA-F0-9]{3}|[a-fA-F0-9]{8})\\b', flags: 'gi', category: 'validation' },
  { id: 'uuid', nameEn: 'UUID v4', nameZh: 'UUID v4', descEn: 'Standard UUID version 4', descZh: '标准 UUID 第4版', pattern: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}', flags: 'gi', category: 'validation' },
  // Common
  { id: 'username', nameEn: 'Username', nameZh: '用户名', descEn: 'Alphanumeric, 3-16 characters', descZh: '字母数字组合，3-16 位', pattern: '^[a-zA-Z0-9_]{3,16}$', flags: 'g', category: 'common' },
  { id: 'password', nameEn: 'Password Strength', nameZh: '密码强度', descEn: '8+ chars, mixed types', descZh: '8 位以上，包含多种字符类型', pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$', flags: 'g', category: 'common' },
  { id: 'domain', nameEn: 'Domain Name', nameZh: '域名', descEn: 'Domain with optional subdomain', descZh: '域名，含可选子域名', pattern: '([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}', flags: 'gi', category: 'common' },
  { id: 'file-ext', nameEn: 'File Extension', nameZh: '文件扩展名', descEn: 'Extract file extensions from paths', descZh: '从路径中提取文件扩展名', pattern: '\\.([a-zA-Z0-9]{1,10})$', flags: 'gm', category: 'common' },
  { id: 'md-link', nameEn: 'Markdown Link', nameZh: 'Markdown 链接', descEn: 'Extract markdown links [text](url)', descZh: '提取 Markdown [文本](链接)', pattern: '\\[([^\\]]+)\\]\\(([^)]+)\\)', flags: 'g', category: 'common' },
  { id: 'twitter', nameEn: 'Twitter Handle', nameZh: 'Twitter 用户', descEn: '@username format', descZh: '@用户名 格式', pattern: '@([a-zA-Z0-9_]{1,15})', flags: 'g', category: 'common' },
  { id: 'hashtag', nameEn: 'Hashtag', nameZh: '话题标签', descEn: '#tag format with Unicode support', descZh: '#标签 格式，支持 Unicode', pattern: '#([\\w\\u4e00-\\u9fff]+)', flags: 'gi', category: 'common' },
  { id: 'html-tag', nameEn: 'HTML Tag', nameZh: 'HTML 标签', descEn: 'Match opening or self-closing HTML tags', descZh: '匹配开标签或自闭合 HTML 标签', pattern: '<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>', flags: 'gi', category: 'common' },
  // Formatting
  { id: 'trim-whitespace', nameEn: 'Trim Whitespace', nameZh: '去除首尾空格', descEn: 'Remove leading/trailing whitespace per line', descZh: '每行去除首尾空白字符', pattern: '^\\s+|\\s+$', flags: 'gm', category: 'formatting' },
  { id: 'collapse-spaces', nameEn: 'Collapse Spaces', nameZh: '合并空格', descEn: 'Replace multiple spaces with single space', descZh: '多个连续空格替换为单个空格', pattern: ' {2,}', flags: 'g', category: 'formatting' },
  { id: 'words-only', nameEn: 'Words Only', nameZh: '仅匹配单词', descEn: 'Match words, exclude punctuation and digits', descZh: '匹配单词，排除标点和数字', pattern: '[a-zA-Z\\u4e00-\\u9fff]+', flags: 'g', category: 'formatting' },
  { id: 'non-ascii', nameEn: 'Non-ASCII', nameZh: '非 ASCII 字符', descEn: 'Match any non-ASCII character', descZh: '匹配所有非 ASCII 字符', pattern: '[^\\x00-\\x7F]+', flags: 'g', category: 'formatting' },
  { id: 'blank-lines', nameEn: 'Blank Lines', nameZh: '空行', descEn: 'Match completely blank lines', descZh: '匹配完全空白的行', pattern: '^\\s*$', flags: 'gm', category: 'formatting' },
  { id: 'chinese-chars', nameEn: 'Chinese Characters', nameZh: '中文字符', descEn: 'Match CJK Unified Ideographs', descZh: '匹配中日韩统一表意文字', pattern: '[\\u4e00-\\u9fff\\u3400-\\u4dbf]', flags: 'g', category: 'formatting' },
  // Numbers
  { id: 'integer', nameEn: 'Integer', nameZh: '整数', descEn: 'Positive or negative integers', descZh: '正整数或负整数', pattern: '-?\\b\\d+\\b', flags: 'g', category: 'numbers' },
  { id: 'float', nameEn: 'Float / Decimal', nameZh: '浮点数', descEn: 'Numbers with optional decimal part', descZh: '含可选小数部分的数字', pattern: '-?\\b\\d+\\.?\\d*\\b', flags: 'g', category: 'numbers' },
  { id: 'percentage', nameEn: 'Percentage', nameZh: '百分比', descEn: '0-100% with optional decimal', descZh: '0-100% 含可选小数', pattern: '\\b([0-9]|[1-9][0-9]|100)(\\.\\d+)?%\\b', flags: 'g', category: 'numbers' },
  { id: 'currency', nameEn: 'Currency Amount', nameZh: '金额', descEn: 'Amount with optional $/€/¥/£ prefix', descZh: '金额，可选货币符号前缀', pattern: '[$€¥£]\\s?-?\\d+[\.,]?\\d*', flags: 'g', category: 'numbers' },
  // Network
  { id: 'ipv4-subnet', nameEn: 'IPv4 + Subnet', nameZh: 'IPv4 + 子网', descEn: 'IPv4 with optional CIDR subnet', descZh: 'IPv4 含可选 CIDR 子网掩码', pattern: '\\b((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)(\\/(3[0-2]|[12]?\\d))?\\b', flags: 'g', category: 'network' },
  { id: 'mac-address', nameEn: 'MAC Address', nameZh: 'MAC 地址', descEn: 'Standard 6-octet MAC addresses', descZh: '标准 6 字节 MAC 地址', pattern: '([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})', flags: 'g', category: 'network' },
  { id: 'port', nameEn: 'Port Number', nameZh: '端口号', descEn: 'Valid TCP/UDP port 0-65535', descZh: '有效 TCP/UDP 端口 0-65535', pattern: '\\b([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])\\b', flags: 'g', category: 'network' },
  { id: 'http-url', nameEn: 'HTTP URL', nameZh: 'HTTP 链接', descEn: 'Full HTTP/HTTPS URL with path and query', descZh: '完整 HTTP/HTTPS 链接含路径和参数', pattern: 'https?:\\/\\/[^\\s/$.?#].[^\\s]*', flags: 'gi', category: 'network' },
];

export function RegexSnippets({ lang, onSelect, labels }: RegexSnippetsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isZh = lang === 'zh';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const categories = [
    { key: 'validation', label: labels.validation },
    { key: 'common', label: labels.common },
    { key: 'formatting', label: labels.formatting },
    { key: 'numbers', label: labels.numbers },
    { key: 'network', label: labels.network },
  ];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="brutalist-button"
        style={{ background: 'black', color: 'white', padding: '0.5rem 1rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
      >
        {labels.title}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          width: '500px',
          maxHeight: '500px',
          overflowY: 'auto',
          background: 'var(--bg)',
          border: 'var(--border-width) solid var(--border)',
          boxShadow: '8px 8px 0px var(--border)',
          zIndex: 50,
        }}>
          {categories.map((cat) => {
            const catSnippets = snippets.filter((s) => s.category === cat.key);
            if (catSnippets.length === 0) return null;
            return (
              <div key={cat.key}>
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--fg)',
                  color: 'var(--bg)',
                  fontWeight: '800',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  borderBottom: '2px solid var(--border)',
                }}>
                  {cat.label}
                </div>
                {catSnippets.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelect({
                        id: s.id,
                        name: isZh ? s.nameZh : s.nameEn,
                        description: isZh ? s.descZh : s.descEn,
                        pattern: s.pattern,
                        flags: s.flags,
                        category: s.category,
                      });
                      setOpen(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.4rem 1rem',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      color: 'var(--fg)',
                      fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ fontWeight: '800', fontSize: '0.8rem' }}>
                      {isZh ? s.nameZh : s.nameEn}
                    </span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.5, marginLeft: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                      {s.pattern.length > 50 ? s.pattern.slice(0, 50) + '...' : s.pattern}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { snippets };
