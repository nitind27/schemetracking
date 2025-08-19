import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET all active future work records
export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT
             basic_village_details.*,
             taluka.name AS taluka_name,
              grampanchyat.gpname AS gp_name,
               village.marathi_name AS village_name
                FROM 
                basic_village_details 
             INNER JOIN taluka ON basic_village_details.taluka_id = taluka.taluka_id 
             INNER JOIN grampanchyat ON basic_village_details.gp_id = grampanchyat.gp_id 
             INNER JOIN village ON basic_village_details.village_id = village.village_id
              WHERE 
              basic_village_details.status = "Active"`
        );
        return NextResponse.json(rows);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
    }
}

// POST: Insert new record
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const taluka_id = formData.get('taluka_id');
        const gp_id = formData.get('gp_id');
        const village_id = formData.get('village_id');
        const total_cfr_area = formData.get('total_cfr_area');
        const room_number = formData.get('room_number');
        const certificate_no = formData.get('certificate_no');
        const date = formData.get('date');
        const cfrmc_details = formData.get('cfrmc_details');
        const bank_details = formData.get('bank_details');
        const cfr_boundary_map = formData.get('cfr_boundary_map');
        const cfr_work_info = formData.get('cfr_work_info');

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO basic_village_details (
                taluka_id, gp_id, village_id,
                total_cfr_area, room_number, certificate_no, date,
                cfrmc_details, bank_details, cfr_boundary_map, cfr_work_info, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                taluka_id, gp_id, village_id, total_cfr_area,
                room_number, certificate_no, date, cfrmc_details,
                bank_details, cfr_boundary_map, cfr_work_info, 'Active'
            ]
        );
        return NextResponse.json({ error: false, message: "Village details inserted successfully", insertId: result.insertId });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: true, message: 'Failed to insert record' }, { status: 500 });
    }
}


// PUT: Update record (by village_detail_id)
export async function PUT(request: Request) {
    try {
        const formData = await request.formData();
        const village_detail_id = formData.get('village_detail_id');
        const taluka_id = formData.get('taluka_id');
        const gp_id = formData.get('gp_id');
        const village_id = formData.get('village_id');
        const total_cfr_area = formData.get('total_cfr_area');
        const room_number = formData.get('room_number');
        const certificate_no = formData.get('certificate_no');
        const date = formData.get('date');
        const cfrmc_details = formData.get('cfrmc_details');
        const bank_details = formData.get('bank_details');
        const cfr_boundary_map = formData.get('cfr_boundary_map');
        const cfr_work_info = formData.get('cfr_work_info');

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE basic_village_details SET
                taluka_id = ?, gp_id = ?, village_id = ?, total_cfr_area = ?, room_number = ?,
                certificate_no = ?, date = ?, cfrmc_details = ?, bank_details = ?,
                cfr_boundary_map = ?, cfr_work_info = ?
            WHERE village_detail_id = ?`,
            [
                taluka_id, gp_id, village_id, total_cfr_area, room_number,
                certificate_no, date, cfrmc_details, bank_details,
                cfr_boundary_map, cfr_work_info, village_detail_id
            ]
        );
        return NextResponse.json({ error: false, message: "Village details updated successfully", affectedRows: result.affectedRows });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: true, message: 'Failed to update record' }, { status: 500 });
    }
}

// DELETE: Mark as inactive (by village_detail_id)
export async function DELETE(request: Request) {
    try {
        const formData = await request.formData();
        const village_detail_id = formData.get('village_detail_id');

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE basic_village_details SET status = 'Inactive' WHERE village_detail_id = ?`,
            [village_detail_id]
        );
        return NextResponse.json({ error: false, message: "Village details deleted successfully", affectedRows: result.affectedRows });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: true, message: 'Failed to delete record' }, { status: 500 });
    }
}
