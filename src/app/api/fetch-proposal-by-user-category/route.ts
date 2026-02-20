import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
  let connection;
  try {
    const formData = await request.formData();
    const forward_to = formData.get('forward_to') as string;

    connection = await pool.getConnection();

    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT 
        p.*, 
        c.name AS proposal_category_name, 
        t.name AS taluka_name, 
        g.gpname AS gp_name, 
        v.marathi_name AS village_name
      FROM proposal p
      LEFT JOIN proposal_category c ON p.proposal_category_id = c.proposal_category_id
      LEFT JOIN taluka t ON p.taluka_id = t.taluka_id
      LEFT JOIN grampanchyat g ON p.gp_id = g.gp_id
      LEFT JOIN village v ON p.village_id = v.village_id
      WHERE p.status = 'Active'`
    );

    // Filter proposals matching forward_to within work_status_record
    const filtered: RowDataPacket[] = [];

    for (const row of rows) {
      let found = false;
      const workStatusRecord = row.work_status_record || '';
      const records = workStatusRecord.split('|');
      const totalRecords = records.length;

      let lastIndex = -1;
      for (let index = 0; index < records.length; index++) {
        const record = records[index];
        const parts = record.split('}');

        if (parts[2] && parts[2] === forward_to) {
          lastIndex = index;
        }
      }

      if (lastIndex >= 0) {
        const record = records[lastIndex];
        const parts = record.split('}');

        if (parts[2] && parts[2].trim() === forward_to) {
          if (totalRecords > lastIndex + 1) {
            const record2 = records[lastIndex + 1];
            const parts2 = record2.split('}');
            if (
              parts2[1] &&
              parts2[1].trim() === forward_to &&
              parts2[3] &&
              (parts2[3].trim() === '1' || parts2[3].trim() === '2')
            ) {
              found = true;
            }
          } else {
            found = true;
          }
        }
      }

      if (found) {
        filtered.push({
          ...row,
          proposal_id: row.proposal_id ? parseInt(row.proposal_id) : null,
          proposal_category_id: row.proposal_category_id
            ? parseInt(row.proposal_category_id)
            : null,
          taluka_id: row.taluka_id ? parseInt(row.taluka_id) : null,
          gp_id: row.gp_id ? parseInt(row.gp_id) : null,
          village_id: row.village_id ? parseInt(row.village_id) : null,
          user_id: row.user_id ? parseInt(row.user_id) : null,
        });
      }
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error fetching proposals by user category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposals by user category' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

