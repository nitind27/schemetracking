import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// POST: Get village details by village_id
export async function POST(request: Request) {
	try {
		const formData = await request.formData();
		const village_id = formData.get('village_id')?.toString().trim();

		if (!village_id) {
			return NextResponse.json(
				{ error: 'village_id is required' },
				{ status: 400 }
			);
		}

		// Check if village_id is "all" (case-insensitive)
		const isAll = village_id.toLowerCase() === 'all';

		// Validate village_id is numeric if not "all"
		if (!isAll && !/^\d+$/.test(village_id)) {
			return NextResponse.json(
				{ error: 'Invalid village_id format. Must be a number or "all"' },
				{ status: 400 }
			);
		}

		// Build query based on whether we want all data or specific village
		const query = `SELECT
  bvd.*,
  t.name AS taluka_name,
  gp.gpname AS gp_name,
  v.marathi_name AS village_name,
  v.kmlfile,
  v.certificate_img,
  v.photo,
  v.tharav,
  v.prociding,
  v.gis,
  COALESCE(
    (
      SELECT CONCAT(
        '[',
        GROUP_CONCAT(
          CONCAT(
            '{\"id\":', s.id,
            ',\"name\":\"', IFNULL(s.name, ''),
            '\",\"contact_number\":\"', IFNULL(s.contact_number, ''),
            '\",\"Position\":\"', IFNULL(s.Position, ''),
            '\",\"photo\":\"', IFNULL(s.photo, ''),
            '\"}'
          )
          SEPARATOR ','
        ),
        ']'
      )
      FROM sabhasad s
      WHERE s.village_id = v.village_id
    ),
    '[]'
  ) AS sabhasad_array
FROM
  basic_village_details bvd
  INNER JOIN taluka t ON bvd.taluka_id = t.taluka_id
  INNER JOIN grampanchyat gp ON bvd.gp_id = gp.gp_id
  INNER JOIN village v ON bvd.village_id = v.village_id
WHERE
  bvd.status = "Active"${isAll ? '' : ' AND bvd.village_id = ?'} order by bvd.village_detail_id desc`;

		const [rows] = await pool.query<RowDataPacket[]>(
			query,
			isAll ? [] : [village_id]
		);

		if (rows.length === 0) {
			return NextResponse.json(
				{ error: 'No village details found' },
				{ status: 404 }
			);
		}

		return NextResponse.json(rows);
	} catch (error) {
		console.error(error);
		return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
	}
}
