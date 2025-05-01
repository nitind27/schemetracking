import { NextResponse } from 'next/server';
import pool from '@/lib/db';
// import type { RowDataPacket } from 'mysql2';
import fs from 'fs';
import path from 'path';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ✅ Handle preflight CORS (Flutter & browsers send this before POST)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// // ✅ GET handler
// export async function GET() {
//   let connection;
//   try {
//     connection = await pool.getConnection();
//     const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM farmers where status = "Active"');
//     const safeUsers = rows.map(user => ({ ...user }));
//     return NextResponse.json(safeUsers, { headers: corsHeaders });
//   } catch (error) {
//     console.error('Database query failed:', error);
//     return NextResponse.json(
//       { message: 'Failed to fetch farmers' },
//       { status: 500, headers: corsHeaders }
//     );
//   } finally {
//     if (connection) connection.release();
//   }
// }

// ✅ POST handler
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
    const tmpBasePath = path.join(process.cwd(), 'tmp', 'uploads');
    const farmerDocDir = path.join(tmpBasePath, 'farmersdocument');
    const schemeDocDir = path.join(tmpBasePath, 'schemedocument');

    for (const dir of [farmerDocDir, schemeDocDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // Save farmer documents
    const newFarmerDocNames: string[] = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(farmerDocDir, file.name);
      await fs.promises.writeFile(filePath, buffer);
      newFarmerDocNames.push(file.name);
    }

    // Save scheme documents
    const newSchemeDocNames: string[] = [];
    for (const file of files2) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(schemeDocDir, file.name);
      await fs.promises.writeFile(filePath, buffer);
      newSchemeDocNames.push(file.name);
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

    return NextResponse.json(
      {
        message: 'Farmer data updated successfully',
        uploadedFarmerDocs: newFarmerDocNames,
        uploadedSchemeDocs: newSchemeDocNames,
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error updating farmer:', error);
    return NextResponse.json({ message: 'Update failed' }, { status: 500, headers: corsHeaders });
  } finally {
    if (connection) connection.release();
  }
}
