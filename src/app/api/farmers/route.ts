// app/api/farmers/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import fs from 'fs';
import path from 'path';

// GET handler (existing)
export async function GET() {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM farmers');
        const safeUsers = rows.map(user => ({ ...user }));
        return NextResponse.json(safeUsers);
    } catch (error) {
        console.error('Database query failed:', error);
        return NextResponse.json(
            { message: 'Failed to fetch farmers' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

// POST handler (new)
export async function POST(request: Request) {
    const formData = await request.formData();
    const farmerId = formData.get('farmer_id') as string;
    const files = formData.getAll('files') as File[];



    let connection;
    try {
        // Create upload directory
        const uploadDir = path.join(process.cwd(), 'public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Process files
        const newFilePaths: string[] = [];
        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '-')}`;
            const filePath = path.join(uploadDir, fileName);
            
            await fs.promises.writeFile(filePath, buffer);
            newFilePaths.push(`/uploads/${fileName}`);
        }

        connection = await pool.getConnection();
        
        // Get existing documents
        const [existing] = await connection.query<RowDataPacket[]>(
            'SELECT documents FROM farmers WHERE farmer_id = ?',
            [farmerId]
        );
        
        const existingDocs = existing[0]?.documents 
            ? existing[0].documents.split(',') 
            : [];

        // Combine documents
        const updatedDocs = [...existingDocs, ...newFilePaths].join(',');

        // Update database
        await connection.query(
            'UPDATE farmers SET documents = ? WHERE farmer_id = ?',
            [updatedDocs, farmerId]
        );

        return NextResponse.json({
            message: 'Files uploaded successfully',
            paths: newFilePaths
        });

    } catch (error) {
        console.error('Upload failed:', error);
        return NextResponse.json(
            { message: 'File upload failed' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
