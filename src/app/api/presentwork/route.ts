import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

// Get all active work records
export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                works.*, 
                users.name AS username
             FROM works
             INNER JOIN users ON works.user_id = users.user_id 
             WHERE works.status = "Active"`
        );

        return NextResponse.json(rows);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }
}


// Insert new work record
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const work_name = formData.get('work_name');
        const total_area = formData.get('total_area');
        const estimated_cost = formData.get('estimated_cost');
        const implementing_method = formData.get('implementing_method');
        const work_status = formData.get('work_status');
        const start_date = formData.get('start_date');
        const end_date = formData.get('end_date');
        const worker_number = formData.get('worker_number');
        const user_id = formData.get('user_id');

        // File upload
        const file = formData.get('work_photo');
        let photoPath = null;
        if (file && typeof file === 'object' && 'arrayBuffer' in file) {
            const buffer = Buffer.from(await file.arrayBuffer());

            const filename = `${file.name}`;
            const folder = path.join(process.cwd(), 'public', 'uploads', 'presentwork');
            const fullPath = path.join(folder, filename);

            await writeFile(fullPath, buffer);
            photoPath = `/uploads/presentwork/${filename}`;
        }

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO works (
                work_name, total_area, estimated_cost, implementing_method,
                work_status, work_photo, start_date, end_date,
                worker_number, user_id, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                work_name, total_area, estimated_cost, implementing_method,
                work_status, photoPath, start_date, end_date, worker_number, user_id, 'Active'
            ]
        );
        return NextResponse.json({ error: false, message: "Work inserted successfully", insertId: result.insertId });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: true, message: 'Failed to insert record' }, { status: 500 });
    }
}

// Update work record
export async function PUT(request: Request) {
    try {
        const formData = await request.formData();
        const work_id = formData.get('work_id');
        const work_name = formData.get('work_name');
        const total_area = formData.get('total_area');
        const estimated_cost = formData.get('estimated_cost');
        const implementing_method = formData.get('implementing_method');
        const work_status = formData.get('work_status');
        const start_date = formData.get('start_date');
        const end_date = formData.get('end_date');
        const worker_number = formData.get('worker_number');
        const user_id = formData.get('user_id');

        // File upload
        const file = formData.get('work_photo');
        let photoPath = null;
        if (file && typeof file === 'object' && 'arrayBuffer' in file) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const filename = `${file.name}`;
            const folder = path.join(process.cwd(), 'public', 'uploads', 'presentwork');
            const fullPath = path.join(folder, filename);

            await writeFile(fullPath, buffer);
            photoPath = `/uploads/presentwork/${filename}`;
        }

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE works SET 
                work_name = ?, total_area = ?, estimated_cost = ?, implementing_method = ?,
                work_status = ?, work_photo = ?, start_date = ?, end_date = ?,
                worker_number = ?, user_id = ?
            WHERE work_id = ?`,
            [
                work_name, total_area, estimated_cost, implementing_method,
                work_status, photoPath, start_date, end_date, worker_number, user_id, work_id
            ]
        );
        return NextResponse.json({ error: false, message: "Work updated successfully", affectedRows: result.affectedRows });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: true, message: 'Failed to update record' }, { status: 500 });
    }
}

// Soft delete: mark as inactive
export async function DELETE(request: Request) {
    try {
        const formData = await request.formData();
        const work_id = formData.get('work_id');
        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE works SET status = 'Inactive' WHERE work_id = ?`,
            [work_id]
        );
        return NextResponse.json({ error: false, message: "Work deleted successfully", affectedRows: result.affectedRows });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: true, message: 'Failed to delete record' }, { status: 500 });
    }
}
