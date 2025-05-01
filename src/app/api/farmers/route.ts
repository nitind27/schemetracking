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
        'email', 'kisan_id', 'schemes', 'documents','update_record'
    ];

    let connection;
    try {
        // Define the base tmp path safely relative to project root
        const tmpBasePath = path.join(process.cwd(), 'tmp', 'uploads');
        const farmerDocDir = path.join(tmpBasePath, 'farmersdocument');
        const schemeDocDir = path.join(tmpBasePath, 'schemedocument');

        // Ensure directories exist
        for (const dir of [farmerDocDir, schemeDocDir]) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }

        // Handle farmer documents
        const newFarmerDocNames: string[] = [];
        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const originalFileName = file.name;
           
            const safeFileName = `${originalFileName}`;
            const filePath = path.join(farmerDocDir, safeFileName);

            await fs.promises.writeFile(filePath, buffer);
            newFarmerDocNames.push(safeFileName);
        }

        // Handle scheme documents
        const newSchemeDocNames: string[] = [];
        for (const file of files2) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const originalFileName = file.name;
         
            const safeFileName = `${originalFileName}`;
            const filePath = path.join(schemeDocDir, safeFileName);

            await fs.promises.writeFile(filePath, buffer);
            newSchemeDocNames.push(safeFileName);
        }

        // Update database
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
            uploadedSchemeDocs: newSchemeDocNames,
        });

    } catch (error) {
        console.error('Error updating farmer:', error);
        return NextResponse.json({ message: 'Update failed' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}
