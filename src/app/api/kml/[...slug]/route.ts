import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
	try {
		const resolvedParams = await params;
		const rel = resolvedParams.slug.join('/');
		const filePath = path.join(process.cwd(), 'public', 'kml', rel);
		const data = await fs.readFile(filePath);

		return new NextResponse(data, {
			status: 200,
			headers: {
				'Content-Type': 'application/vnd.google-earth.kml+xml; charset=UTF-8',
				'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Range',
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
		});
	} catch {
		return new NextResponse('Not found', {
			status: 404,
			headers: { 'Access-Control-Allow-Origin': '*' },
		});
	}
}

export async function OPTIONS() {
	return new NextResponse(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Range',
			'Access-Control-Max-Age': '86400',
		},
	});
}
