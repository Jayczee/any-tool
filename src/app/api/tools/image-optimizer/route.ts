import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

function formatSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const image = sharp(buffer);
    const metadata = await image.metadata();

    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;
    const originalFormat = metadata.format || 'unknown';
    const originalSize = file.size;

    const action = formData.get('action') as string | null;

    if (action !== 'compress') {
      // Phase 1: analyze only
      return NextResponse.json({
        width: originalWidth,
        height: originalHeight,
        format: originalFormat,
        size: originalSize,
      });
    }

    // Phase 2: compress
    const targetWidth = formData.get('width');
    const targetHeight = formData.get('height');
    const quality = formData.get('quality');
    const targetFormat = formData.get('format') as string | null;

    let pipeline = sharp(buffer);

    // Resize if dimensions provided
    if (targetWidth || targetHeight) {
      pipeline = pipeline.resize({
        width: targetWidth ? parseInt(targetWidth as string) : undefined,
        height: targetHeight ? parseInt(targetHeight as string) : undefined,
        fit: 'fill',
      });
    }

    // Determine output format
    const outFormat = targetFormat && targetFormat !== 'auto' ? targetFormat : originalFormat;

    // Apply quality/compression
    switch (outFormat) {
      case 'jpeg':
      case 'jpg':
        pipeline = pipeline.jpeg({ quality: quality ? parseInt(quality as string) : 80 });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality: quality ? parseInt(quality as string) : 80 });
        break;
      case 'png':
        pipeline = pipeline.png({ quality: quality ? parseInt(quality as string) : 80 });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality: quality ? parseInt(quality as string) : 50 });
        break;
      default:
        pipeline = pipeline.jpeg({ quality: quality ? parseInt(quality as string) : 80 });
    }

    const outputBuffer = await pipeline.toBuffer();
    const outExt = outFormat === 'jpeg' ? 'jpg' : outFormat;

    // If the "optimized" result is larger than the original, keep the original.
    // This happens when e.g. converting JPEG → PNG, or re-encoding an already
    // heavily compressed image at too high a quality setting.
    const grew = outputBuffer.length >= originalSize;
    const finalBuffer = grew ? buffer : outputBuffer;
    const finalExt = grew
      ? (originalFormat === 'jpeg' ? 'jpg' : originalFormat)
      : outExt;

    const downloadId = randomUUID();
    const tmpPath = join(tmpdir(), `crushed-${downloadId}.${finalExt}`);
    await writeFile(tmpPath, finalBuffer);

    const outMeta = await sharp(finalBuffer).metadata();

    return NextResponse.json({
      originalSize,
      optimizedSize: finalBuffer.length,
      originalWidth,
      originalHeight,
      width: outMeta.width,
      height: outMeta.height,
      format: finalExt,
      reduction: `${Math.round((1 - finalBuffer.length / originalSize) * 100)}%`,
      downloadId,
      noteCode: grew ? ('result_larger' as const) : undefined,
      noteSize: grew ? formatSize(outputBuffer.length) : undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
