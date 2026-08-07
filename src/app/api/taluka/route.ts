// app/api/taluka/route.ts
import { NextResponse } from 'next/server';
import { assertApiAlive } from '@/lib/assertApiAlive';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET() {
    const __killed = await assertApiAlive('/api/taluka');
    if (__killed) return __killed;
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM taluka where status = "Active"');

        // Type-safe mapping (optional - now properly typed)
        const safeUsers = rows.map((user) => user);

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
