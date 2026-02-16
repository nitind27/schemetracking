import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

type Params = {
  params: Promise<{ filename: string }>;
};

export async function GET(
  request: Request,
  { params }: Params
) {
  try {
    // Await the params promise first
    const resolvedParams = await params;

    // Security: Prevent directory traversal
    const safeFilename = path.basename(resolvedParams.filename);

    const filePath = path.join(
      process.cwd(),
      'tmp',
      'uploads',
      'notifications',
      safeFilename
    );

    // Read file from filesystem
    const fileBuffer = await readFile(filePath);

    // Determine content type based on file extension
    const extension = path.extname(safeFilename).toLowerCase();
    const contentType: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };

    return new NextResponse(Buffer.from(fileBuffer), {
      headers: {
        'Content-Type': contentType[extension] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Error serving notification file:', error);
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }
}

