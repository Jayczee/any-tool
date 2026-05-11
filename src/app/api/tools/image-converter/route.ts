import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { writeFile, stat, readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

function buildIco(pngBuffers: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: ICO
  header.writeUInt16LE(pngBuffers.length, 4); // count

  const entrySize = 16;
  const dirBuf = Buffer.alloc(entrySize * pngBuffers.length);
  const imageData: Buffer[] = [];
  let offset = 6 + dirBuf.length;

  pngBuffers.forEach(({ size, data }, i) => {
    const entry = Buffer.alloc(entrySize);
    const w = size >= 256 ? 0 : size; // 0 means 256
    entry.writeUInt8(Math.min(w, 255), 0);
    entry.writeUInt8(Math.min(size, 255), 1);
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(data.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    entry.copy(dirBuf, i * entrySize);
    imageData.push(data);
    offset += data.length;
  });

  return Buffer.concat([header, dirBuf, ...imageData]);
}

function formatSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function POST(request: Request) {
  let uploadedPath = '';
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const meta = await sharp(buffer).metadata();

    const action = formData.get('action') as string | null;
    if (action !== 'convert') {
      return NextResponse.json({
        width: meta.width || 0,
        height: meta.height || 0,
        format: meta.format || 'unknown',
        size: file.size,
      });
    }

    const targetFormat = (formData.get('format') as string) || 'png';
    const quality = parseInt(formData.get('quality') as string || '85');

    let pipeline = sharp(buffer);
    switch (targetFormat) {
      case 'jpeg': case 'jpg': pipeline = pipeline.jpeg({ quality }); break;
      case 'webp': pipeline = pipeline.webp({ quality }); break;
      case 'png': pipeline = pipeline.png({ quality: Math.min(quality, 100) }); break;
      case 'avif': pipeline = pipeline.avif({ quality: Math.min(quality, 63) }); break;
      case 'tiff': pipeline = pipeline.tiff({ quality: Math.min(quality, 100) }); break;
      case 'ico': pipeline = pipeline.png(); break; // ICO uses PNG data
      default: pipeline = pipeline.png();
    }

    let outputBuffer: Buffer;
    let outWidth: number;
    let outHeight: number;
    const downloadId = randomUUID();
    const ext = targetFormat === 'jpeg' ? 'jpg' : targetFormat;

    if (targetFormat === 'ico') {
      const sizes = [16, 32, 48, 64, 128, 256];
      const pngBuffers = await Promise.all(
        sizes.map(async (s) => ({
          size: s,
          data: await sharp(buffer).resize(s, s, { fit: 'contain' }).png().toBuffer(),
        }))
      );
      outputBuffer = buildIco(pngBuffers);
      outWidth = 256;
      outHeight = 256;
    } else {
      outputBuffer = await pipeline.toBuffer();
      const m = await sharp(outputBuffer).metadata();
      outWidth = m.width || 0;
      outHeight = m.height || 0;
    }

    const tmpPath = join(tmpdir(), `converted-${downloadId}.${ext}`);
    await writeFile(tmpPath, outputBuffer);

    return NextResponse.json({
      originalSize: file.size,
      convertedSize: outputBuffer.length,
      originalFormat: meta.format,
      targetFormat: ext,
      width: outWidth,
      height: outHeight,
      reduction: `${Math.round((1 - outputBuffer.length / file.size) * 100)}%`,
      downloadId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (uploadedPath) unlink(uploadedPath).catch(() => {});
  }
}
