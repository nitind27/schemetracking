
import fs from 'fs';
import path from 'path';
import pool from '@/lib/db';
import type {  RowDataPacket } from 'mysql2';
import { NextResponse } from 'next/server';

// Disable Next.js default body parser for multipart form uploads
export const config = { api: { bodyParser: false } };



const uploadDir = path.join(process.cwd(), 'public/uploads/presentwork');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM works WHERE status = "Active"'
        );
        return NextResponse.json(rows);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }
}


