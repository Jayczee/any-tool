import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { method, url, headers, body: reqBody, timeout = 30000 } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const fetchOptions: RequestInit = {
      method: method || 'GET',
      headers: headers || {},
      signal: controller.signal,
      redirect: 'manual',
    };

    if (reqBody && !['GET', 'HEAD'].includes(fetchOptions.method as string)) {
      fetchOptions.body = reqBody;
    }

    const start = performance.now();
    let response: Response;
    try {
      response = await fetch(url, fetchOptions);
    } finally {
      clearTimeout(timer);
    }
    const elapsed = Math.round(performance.now() - start);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const contentType = response.headers.get('content-type') || '';
    let respBody: string;
    let bodyType: 'text' | 'json' | 'binary';
    const arrayBuffer = await response.arrayBuffer();
    const size = arrayBuffer.byteLength;

    if (contentType.includes('application/json')) {
      try {
        const text = new TextDecoder().decode(arrayBuffer);
        JSON.parse(text); // validate
        respBody = text;
        bodyType = 'json';
      } catch {
        respBody = Buffer.from(arrayBuffer).toString('base64');
        bodyType = 'binary';
      }
    } else if (
      contentType.includes('text/') ||
      contentType.includes('application/xml') ||
      contentType.includes('application/javascript')
    ) {
      respBody = new TextDecoder().decode(arrayBuffer);
      bodyType = 'text';
    } else {
      respBody = Buffer.from(arrayBuffer).toString('base64');
      bodyType = 'binary';
    }

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: respBody,
      bodyType,
      time: elapsed,
      size,
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out' }, { status: 408 });
    }
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
}
