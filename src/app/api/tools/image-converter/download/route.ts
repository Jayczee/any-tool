import { NextResponse } from 'next/server';
import { readFile, unlink, readdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing download ID' }, { status: 400 });

    const tmpFiles = await readdir(tmpdir());
    const filename = tmpFiles.find((f: string) => f.startsWith(`converted-${id}.`));
    if (!filename) return NextResponse.json({ error: 'File not found' }, { status: 404 });

    const filepath = join(tmpdir(), filename);
    const buffer = await readFile(filepath);
    unlink(filepath).catch(() => {});

    const ext = filename.split('.').pop();
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      webp: 'image/webp', avif: 'image/avif', tiff: 'image/tiff',
      ico: 'image/x-icon',
    };

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeMap[ext || ''] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="converted.${ext}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
