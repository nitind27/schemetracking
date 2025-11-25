import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Get all active work records
export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                works.*, 
                users.name AS username,
                taluka.name AS taluka_name,
                village.marathi_name AS village_name,
                grampanchyat.gpname AS gp_name
             FROM works
             INNER JOIN users ON works.user_id = users.user_id 
             LEFT JOIN taluka ON taluka.taluka_id = works.taluka_id
             LEFT JOIN village ON village.village_id = works.village_id
             LEFT JOIN basic_village_details bvd ON village.village_id = bvd.village_id
             LEFT JOIN grampanchyat ON grampanchyat.gp_id = works.gp_id
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
        const department_name = formData.get('department_name') as string;
        const implementing_method = formData.get('implementing_method');
        const work_status = formData.get('work_status');
        const start_date = formData.get('start_date');
        const end_date = formData.get('end_date');
        const worker_number = formData.get('worker_number');
        const user_id = formData.get('user_id');
        const taluka_id = formData.get('taluka_id');
        const village_id = formData.get('village_id');
        const gp_id = formData.get('gp_id');
        const work_year = formData.get('work_year') as string;
        const unit = formData.get('unit') as string;
        const type =  formData.get('type') as string;


        // File upload
        const file = formData.get('work_photo');
        let photoPath = null;
        if (file && typeof file === 'object' && 'arrayBuffer' in file) {
            const buffer = Buffer.from(await file.arrayBuffer());

            const filename = `${file.name}`;
            const folder = path.join(process.cwd(), 'tmp', 'uploads', 'presentwork');
            await mkdir(folder, { recursive: true });
            const fullPath = path.join(folder, filename);

            await writeFile(fullPath, buffer);
            photoPath = `${filename}`;
        }

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO works (
                work_name, total_area, estimated_cost, department_name, implementing_method,
                work_status, work_photo, start_date, end_date,
                worker_number, user_id, status, taluka_id, village_id, gp_id, work_year, unit, type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                work_name, total_area, estimated_cost, department_name, implementing_method,
                work_status, photoPath, start_date, end_date, worker_number, user_id, 'Active', taluka_id, village_id, gp_id, work_year, unit, type
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
        const department_name = formData.get('department_name') as string;
        const work_year = formData.get('work_year') as string;
        const unit = formData.get('unit') as string;
        const type =  formData.get('type') as string;
        const taluka_id = formData.get('taluka_id');
        const village_id = formData.get('village_id');
        const gp_id = formData.get('gp_id');

        // File upload
        const file = formData.get('work_photo');
        let photoPath = null;
        if (file && typeof file === 'object' && 'arrayBuffer' in file) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const filename = `${file.name}`;
            const folder = path.join(process.cwd(), 'tmp', 'uploads', 'presentwork');
            await mkdir(folder, { recursive: true });
            const fullPath = path.join(folder, filename);

            await writeFile(fullPath, buffer);
            photoPath = `${filename}`;
        }

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE works SET 
                work_name = ?, total_area = ?, estimated_cost = ?, implementing_method = ?,
                work_status = ?, work_photo = ?, start_date = ?, end_date = ?,
                worker_number = ?, user_id = ?, department_name = ?, work_year = ?, unit = ?, type = ?, taluka_id = ?, village_id = ?, gp_id = ?
            WHERE work_id = ?`,
            [
                work_name, total_area, estimated_cost, implementing_method,
                work_status, photoPath, start_date, end_date, worker_number, user_id, department_name, work_year, unit, type, taluka_id, village_id, gp_id, work_id
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
