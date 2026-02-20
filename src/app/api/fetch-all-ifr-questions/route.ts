import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM ifr_questions WHERE status = 'Active'"
    );

    const response = rows.map((row) => ({
      ...row,
      question_id: row.question_id ? parseInt(row.question_id) : null,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching IFR questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch IFR questions' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

