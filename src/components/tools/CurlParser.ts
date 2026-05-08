export interface ParsedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  bodyType: 'none' | 'json' | 'raw' | 'urlencoded';
}

// Parse a curl command string into a structured request object
export function parseCurl(input: string): ParsedRequest | null {
  const s = input.trim();
  if (!s.startsWith('curl ')) return null;

  const result: ParsedRequest = {
    method: 'GET',
    url: '',
    headers: {},
    body: '',
    bodyType: 'none',
  };

  // Tokenize respecting quotes
  const tokens: string[] = [];
  let i = 4; // skip "curl"
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i])) i++;
    if (i >= s.length) break;

    if (s[i] === "'" || s[i] === '"') {
      const quote = s[i];
      let tok = '';
      i++;
      while (i < s.length && s[i] !== quote) {
        if (s[i] === '\\') { i++; if (i < s.length) tok += s[i]; }
        else tok += s[i];
        i++;
      }
      i++; // skip closing quote
      tokens.push(tok);
    } else {
      let tok = '';
      while (i < s.length && !/\s/.test(s[i])) { tok += s[i]; i++; }
      tokens.push(tok);
    }
  }

  // Parse tokens
  let expectValue: string | null = null;
  for (let ti = 0; ti < tokens.length; ti++) {
    const t = tokens[ti];

    if (expectValue) {
      switch (expectValue) {
        case 'X': case 'request': result.method = t.toUpperCase(); break;
        case 'H': case 'header': {
          const colon = t.indexOf(':');
          if (colon > 0) result.headers[t.slice(0, colon).trim()] = t.slice(colon + 1).trim();
          break;
        }
        case 'd': case 'data':
        case 'data-raw': case 'data-binary':
          result.body = t;
          result.bodyType = 'raw';
          result.method = result.method === 'GET' ? 'POST' : result.method;
          break;
        case 'u': case 'user': {
          const creds = btoa(t);
          result.headers['Authorization'] = `Basic ${creds}`;
          break;
        }
        case 'F': case 'form':
          // --form "key=value" - simplify to urlencoded body
          if (!result.body) { result.body = t; result.bodyType = 'urlencoded'; }
          else { result.body += '&' + t; }
          result.method = result.method === 'GET' ? 'POST' : result.method;
          break;
      }
      expectValue = null;
      continue;
    }

    if (t === '-X' || t === '--request') expectValue = 'X';
    else if (t === '-H' || t === '--header') expectValue = 'H';
    else if (t === '-d' || t === '--data') expectValue = 'd';
    else if (t === '--data-raw') expectValue = 'data-raw';
    else if (t === '--data-binary') expectValue = 'data-binary';
    else if (t === '-u' || t === '--user') expectValue = 'u';
    else if (t === '-F' || t === '--form') expectValue = 'F';
    else if (t === '-G' || t === '--get') result.method = 'GET';
    else if (t === '-s' || t === '--silent' || t === '-S' || t === '--show-error' || t === '-L' || t === '--location' || t === '-v' || t === '--verbose' || t === '-i' || t === '--include' || t === '-k' || t === '--insecure' || t === '--compressed') {
      // skip known flags
    }
    else if (!t.startsWith('-') && !result.url) {
      result.url = t;
    }
  }

  if (!result.url) return null;
  return result;
}

// Generate a curl command from a request object
export function generateCurl(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: string
): string {
  const parts: string[] = ['curl'];
  if (method !== 'GET') parts.push('-X', method);
  for (const [k, v] of Object.entries(headers)) {
    parts.push('-H', `'${k}: ${v}'`);
  }
  if (body) parts.push('-d', `'${body}'`);
  parts.push(`'${url}'`);
  return parts.join(' \\\n  ');
}
