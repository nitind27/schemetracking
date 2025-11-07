import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { NextResponse } from 'next/server';

// POST: Get active work records by village_id
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
                works.*, 
                users.name AS username,
                taluka.name AS taluka_name,
                village.marathi_name AS village_name,
                grampanchyat.gpname AS gp_name
             FROM works
             INNER JOIN users ON works.user_id = users.user_id 
             LEFT JOIN taluka ON taluka.taluka_id = works.taluka_id
             LEFT JOIN village ON village.village_id = works.village_id
             LEFT JOIN basic_village_details bvd ON village.village_id = bvd.village_id
             LEFT JOIN grampanchyat ON grampanchyat.gp_id = works.gp_id
             WHERE works.status = "Active"${isAll ? '' : ' AND works.village_id = ?'}
             ORDER BY works.work_id DESC`,
            isAll ? [] : [village_id]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'No work records found' },
                { status: 404 }
            );
        }

        return NextResponse.json(rows);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }
}
