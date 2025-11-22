import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
	try {
		const url = new URL(_req.url);
		const styled = url.searchParams.get('styled');

		const resolvedParams = await params;
		const rel = resolvedParams.slug.join('/');
		const filePath = path.join(process.cwd(), 'public', 'kml', rel);
		const data = await fs.readFile(filePath);

		let out: Buffer = data;

		if (styled) {
			const text = data.toString('utf-8');
			let modified = text;

			// Inject default styles into <Document> if not present
			if (!modified.includes('id="default-point"') || !modified.includes('id="default-line"')) {
				const styles = `
	<Style id="default-point">
		<IconStyle>
			<scale>1.2</scale>
			<color>ff00ffff</color>
			<Icon>
				<href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>
			</Icon>
		</IconStyle>
		<LabelStyle>
			<scale>1.0</scale>
		</LabelStyle>
	</Style>
	<Style id="default-line">
		<LineStyle>
			<color>ff0000ff</color>
			<width>3</width>
		</LineStyle>
	</Style>`;
				modified = modified.replace(/<Document(\b[^>]*)>/, (m) => `${m}\n${styles}`);
			}

			// Add styleUrl for Points without style
			modified = modified.replace(
				/(<Placemark\b[^>]*>(?:(?!<\/Placemark>)[\s\S])*?<Point[\s\S]*?<\/Point>[\s\S]*?)(<\/Placemark>)/g,
				(full, before, endTag) => (/<styleUrl>/.test(full) ? full : `${before}<styleUrl>#default-point</styleUrl>${endTag}`)
			);

			// Add styleUrl for LineStrings without style
			modified = modified.replace(
				/(<Placemark\b[^>]*>(?:(?!<\/Placemark>)[\s\S])*?<LineString[\s\S]*?<\/LineString>[\s\S]*?)(<\/Placemark>)/g,
				(full, before, endTag) => (/<styleUrl>/.test(full) ? full : `${before}<styleUrl>#default-line</styleUrl>${endTag}`)
			);

			out = Buffer.from(modified, 'utf-8');
		}

		return new NextResponse(new Uint8Array(out), {
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