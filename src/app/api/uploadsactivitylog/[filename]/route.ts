// app/api/uploadsactivitylog/[filename]/route.ts
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
            'activitylogs',    
            safeFilename
        );

        // Read file from filesystem
        const fileBuffer = await readFile(filePath);

        // Determine content type
        const extension = path.extname(safeFilename).toLowerCase();
        const contentType = {
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.xls': 'application/vnd.ms-excel',
            '.csv': 'text/csv',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.txt': 'text/plain',
            '.json': 'application/json',
        }[extension] || 'application/octet-stream';

        return new NextResponse(Buffer.from(fileBuffer), {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${safeFilename}"`,
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        });
    } catch (error) {
        console.error("Error reading activity log file:", error);
        return NextResponse.json(
            { error: 'File not found' },
            { status: 404 }
        );
    }
}
