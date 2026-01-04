import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// GET all proposals
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        proposal.*,
        taluka.name AS taluka_name,
        grampanchyat.gpname AS gp_name,
        village.marathi_name AS village_name,
        users.name AS user_name,
        users.user_category_id AS user_category_id
      FROM proposal
      LEFT JOIN taluka ON proposal.taluka_id = taluka.taluka_id
      LEFT JOIN grampanchyat ON proposal.gp_id = grampanchyat.gp_id
      LEFT JOIN village ON proposal.village_id = village.village_id
      LEFT JOIN users ON proposal.user_id = users.user_id
      WHERE proposal.status = 'Active'
      ORDER BY proposal.created_at DESC`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}

