// app/api/user/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';


export async function GET() {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query<any[]>(`
      SELECT * FROM taluka
    `);

        // 3. Type-safe mapping
        const safeUsers = rows.map(({ ...user }) => user);


        return NextResponse.json(safeUsers);
    } catch (error) {
        console.error('Database query failed:', error);
        return NextResponse.json(
            { message: 'Failed to fetch taluka' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
