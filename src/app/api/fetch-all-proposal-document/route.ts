import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM proposal_document WHERE status = 'Active'"
    );

    const response = rows.map((row) => ({
      ...row,
      proposal_document_id: row.proposal_document_id ? parseInt(row.proposal_document_id) : null,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching proposal documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposal documents' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

