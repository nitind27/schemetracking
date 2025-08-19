import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
// import { error } from 'console';

// GET all active future work records
export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM grampanchyat'
        );
        return NextResponse.json(rows);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }
}