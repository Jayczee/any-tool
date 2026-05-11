import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subconverterUrl, target, url, config, include, exclude, emoji, udp, scv, tfo, rename } = body;

    if (!subconverterUrl || !url) {
      return NextResponse.json({ error: 'Subconverter URL and subscription URL are required' }, { status: 400 });
    }

    const base = subconverterUrl.replace(/\/+$/, '');
    const params = new URLSearchParams();

    params.set('target', target || 'clash');
    params.set('url', url);

    if (config) params.set('config', encodeURIComponent(config));
    if (include) params.set('include', include);
    if (exclude) params.set('exclude', exclude);
    if (emoji !== undefined) params.set('emoji', emoji ? 'true' : 'false');
    if (udp !== undefined) params.set('udp', udp ? 'true' : 'false');
    if (scv !== undefined) params.set('scv', scv ? 'true' : 'false');
    if (tfo !== undefined) params.set('tfo', tfo ? 'true' : 'false');
    if (rename) params.set('rename', rename);

    const fullUrl = base.includes('/sub') ? `${base}${base.endsWith('?') ? '' : '?'}${params.toString()}` : `${base}/sub?${params.toString()}`;

    const resp = await fetch(fullUrl, { signal: AbortSignal.timeout(30000) });
    const text = await resp.text();

    if (!resp.ok) {
      return NextResponse.json({
        error: `Subconverter returned ${resp.status}`,
        detail: text.slice(0, 500),
      }, { status: 502 });
    }

    return NextResponse.json({
      subscriptionUrl: fullUrl,
      config: text,
      size: text.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
}
