// app/api/user/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';


export async function GET() {

    try {

        const [rows] = await pool.query<any[]>(`
      SELECT * FROM village
    `);

        // 3. Type-safe mapping
        const safeUsers = rows.map(({ ...user }) => user);


        return NextResponse.json(safeUsers);
    } catch (error) {
        console.error('Database query failed:', error);
        return NextResponse.json(
            { message: 'Failed to fetch village' },
            { status: 500 }
        );
    }
}
