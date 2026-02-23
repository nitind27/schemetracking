import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';

// GET: fetch forwarded-to categories
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM user_category WHERE user_category_id = 24 and status = "Active" ORDER BY category_name DESC'
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// OPTIONS: CORS preflight — without this, browsers can get 405 on preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}