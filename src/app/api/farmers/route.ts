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
        const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM farmers where status = "Active"');
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
    const files2 = formData.getAll('files2') as File[];

    const updatableFields = [
        'name', 'adivasi', 'village_id', 'taluka_id', 'gat_no',
        'vanksetra', 'nivas_seti', 'aadhaar_no', 'contact_no',
        'email', 'kisan_id', 'schemes', 'documents'
    ];

    let connection;
    try {
       
        const farmerDocDir = path.join(process.cwd(), 'tmp/uploads/farmersdocument');
        if (!fs.existsSync(farmerDocDir)) {
            fs.mkdirSync(farmerDocDir, { recursive: true });
        }

        const schemeDocDir = path.join(process.cwd(), 'tmp/uploads/schemedocument');
        if (!fs.existsSync(schemeDocDir)) {
            fs.mkdirSync(schemeDocDir, { recursive: true });
        }

        const newFarmerDocNames: string[] = [];
        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const fileName = file.name;
            const filePath = path.join(farmerDocDir, fileName);

            await fs.promises.writeFile(filePath, buffer);
            newFarmerDocNames.push(fileName);
        }

        const newSchemeDocNames: string[] = [];
        for (const file of files2) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const fileName = file.name;
            const filePath = path.join(schemeDocDir, fileName);

            await fs.promises.writeFile(filePath, buffer);
            newSchemeDocNames.push(fileName);
        }

        connection = await pool.getConnection();

        const updateFields: string[] = [];
        const updateValues: string[] = [];

        for (const field of updatableFields) {
            const value = formData.get(field);
            if (value !== null && value !== undefined) {
                updateFields.push(`${field} = ?`);
                updateValues.push(value.toString());
            }
        }

        if (updateFields.length > 0) {
            updateValues.push(farmerId);
            const updateQuery = `UPDATE farmers SET ${updateFields.join(', ')} WHERE farmer_id = ?`;
            await connection.query(updateQuery, updateValues);
        }

        return NextResponse.json({
            message: 'Farmer data updated successfully',
            uploadedFarmerDocs: newFarmerDocNames,
            uploadedSchemeDocs: newSchemeDocNames
        });

    } catch (error) {
        console.error('Error updating farmer:', error);
        return NextResponse.json({ message: 'Update failed' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}
