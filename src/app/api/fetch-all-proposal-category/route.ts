import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM proposal_category WHERE status = 'Active'"
    );

    const response = rows.map((row) => ({
      ...row,
      proposal_category_id: row.proposal_category_id ? parseInt(row.proposal_category_id) : null,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching proposal categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposal categories' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

