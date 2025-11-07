import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
// import { error } from 'console';

// POST: Get active future work records by village_id
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

        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
    future_work.*, 
    users.name AS username,
    taluka.name AS taluka_name,
    village.marathi_name AS village_name,
    grampanchyat.gpname AS gp_name
 FROM future_work
 INNER JOIN users ON future_work.user_id = users.user_id
 LEFT JOIN taluka ON taluka.taluka_id = future_work.taluka_id
 LEFT JOIN village ON village.village_id = future_work.village_id
 LEFT JOIN grampanchyat ON grampanchyat.gp_id = future_work.gp_id
 WHERE future_work.status = "Active"${isAll ? '' : ' AND future_work.village_id = ?'}
 ORDER BY future_work.future_work_id DESC`,
            isAll ? [] : [village_id]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'No future work records found' },
                { status: 404 }
            );
        }

        return NextResponse.json(rows);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }
}
