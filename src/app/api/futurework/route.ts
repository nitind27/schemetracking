import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
// import { error } from 'console';

// GET all active future work records
export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM future_work WHERE status = "Active"'
        );
        return NextResponse.json(rows);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }
}

// POST insert new future work record (form-data)
export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        const work_name = formData.get('work_name') as string;
        const total_area = parseFloat(formData.get('total_area') as string);
        const department_name = formData.get('department_name') as string;
        const estimated_amount = parseFloat(formData.get('estimated_amount') as string);
        const implementing_method = formData.get('implementing_method') as string;
        const work_status = formData.get('work_status') as string;
        const user_id = parseInt(formData.get('user_id') as string, 10);

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO future_work 
        (work_name, total_area, department_name, estimated_amount, implementing_method, work_status, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [work_name, total_area, department_name, estimated_amount, implementing_method, work_status, user_id]
        );

        return NextResponse.json({ error: "true", message: 'Inserted successfully', id: result.insertId });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Failed to insert record", error: 'false' }, { status: 500 });
    }
}

// PUT update future work record (form-data)
export async function PUT(request: Request) {
    try {
        const formData = await request.formData();

        const future_work_id = parseInt(formData.get('future_work_id') as string, 10);
        const work_name = formData.get('work_name') as string;
        const total_area = parseFloat(formData.get('total_area') as string);
        const department_name = formData.get('department_name') as string;
        const estimated_amount = parseFloat(formData.get('estimated_amount') as string);
        const implementing_method = formData.get('implementing_method') as string;
        const work_status = formData.get('work_status') as string;
        const user_id = parseInt(formData.get('user_id') as string, 10);
        // const status = formData.get('status') as string;

        await pool.query<ResultSetHeader>(
            `UPDATE future_work 
       SET work_name = ?, total_area = ?, department_name = ?, 
           estimated_amount = ?, implementing_method = ?, 
           work_status = ?, user_id = ?
       WHERE future_work_id = ?`,
            [
                work_name,
                total_area,
                department_name,
                estimated_amount,
                implementing_method,
                work_status,
                user_id,
                future_work_id,
            ]
        );

        return NextResponse.json({ error: "true", message: 'Updated successfully' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "false", message: 'Failed to update record' }, { status: 500 });
    }
}

// DELETE soft delete (set status = 'Inactive') future work record (form-data)
export async function DELETE(request: Request) {
    try {
        const formData = await request.formData();
        const future_work_id = parseInt(formData.get('future_work_id') as string, 10);

        await pool.query<ResultSetHeader>(
            `UPDATE future_work SET status = 'Inactive' WHERE future_work_id = ?`,
            [future_work_id]
        );

        return NextResponse.json({ error: "true", message: 'Deleted successfully' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "false", message: 'Failed to delete record' }, { status: 500 });
    }
}
