    // app/api/uploads/[filename]/route.ts
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
        process.cwd(), // Use project root as base
        'tmp',
        'uploads',
        'audio',    
        safeFilename
        );

        // Read file from filesystem
        const fileBuffer = await readFile(filePath);

        // Determine content type
        const extension = path.extname(safeFilename).toLowerCase();
        const contentType = {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.m4a': 'audio/mp4',
        '.wma': 'audio/x-ms-wma',
        '.aac': 'audio/aac',
        '.flac': 'audio/flac',
        '.alac': 'audio/x-alac',
        '.opus': 'audio/opus',
        '.webm': 'audio/webm',
        '.m4b': 'audio/mp4',
        '.m4p': 'audio/mp4',
        '.m4v': 'video/mp4'
        }[extension] || 'application/octet-stream';

        return new NextResponse(Buffer.from(fileBuffer), {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable'
        }
        });
    } catch (error) {
        console.log("fsadfadsf", error)
        return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
        );
    }
    }
