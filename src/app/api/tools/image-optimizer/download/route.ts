import { NextResponse } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing download ID' }, { status: 400 });
    }

    // Find the file in /tmp (extension varies by format)
    const { readdir } = await import('fs/promises');
    const tmpFiles = await readdir(tmpdir());
    const filename = tmpFiles.find((f: string) => f.startsWith(`crushed-${id}.`));

    if (!filename) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const filepath = join(tmpdir(), filename);
    const buffer = await readFile(filepath);

    // Clean up temp file
    unlink(filepath).catch(() => {});

    const ext = filename.split('.').pop();
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
    };

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeMap[ext || ''] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="crushed.${ext}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
