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
        const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM farmers_new where status = "Active"');
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



export async function POST(request: Request) {
    const formData = await request.formData();
    const farmerJson = formData.get('farmer_json') as string;
    // const files3 = formData.getAll('files3') as File[];
    // const files4 = formData.getAll('files4') as File[];
    // const files5 = formData.getAll('files5') as File[];
    // const files6 = formData.getAll('files6') as File[];
    // const files7 = formData.getAll('files7') as File[];
    // Try both formats: files3 and files3[]
    const files3 = (formData.getAll('files3') as File[]).length > 0
        ? formData.getAll('files3') as File[]
        : formData.getAll('files3[]') as File[];
    const files4 = (formData.getAll('files4') as File[]).length > 0
        ? formData.getAll('files4') as File[]
        : formData.getAll('files4[]') as File[];
    const files5 = (formData.getAll('files5') as File[]).length > 0
        ? formData.getAll('files5') as File[]
        : formData.getAll('files5[]') as File[];
    const files6 = (formData.getAll('files6') as File[]).length > 0
        ? formData.getAll('files6') as File[]
        : formData.getAll('files6[]') as File[];
    const files7 = (formData.getAll('files7') as File[]).length > 0
        ? formData.getAll('files7') as File[]
        : formData.getAll('files7[]') as File[];

    if (!farmerJson) {
        return NextResponse.json({ message: 'farmer_json is required' }, { status: 400 });
    }

    let farmersData;
    try {
        farmersData = JSON.parse(farmerJson);
    } catch {
        return NextResponse.json({ message: 'Invalid farmer_json format' }, { status: 400 });
    }

    if (!Array.isArray(farmersData) || farmersData.length === 0) {
        return NextResponse.json({ message: 'farmer_json must be a non-empty array' }, { status: 400 });
    }

    const updatableFields = [
        'village_id', 'taluka_id', 'documents',
        'schemes', 'questions', 'update_record', 'gis', 'gis_2', 'geo_photo',
        'farmer_record'
    ];

    let connection;
    try {
        const tmpBasePath = path.join(process.cwd(), 'tmp', 'uploads');
        const farmerDocDir = path.join(tmpBasePath, 'farmersdocument');
        const schemeDocDir = path.join(tmpBasePath, 'schemedocument');
        const aadhaarDocDir = path.join(tmpBasePath, 'uploadaadhaar');
        const profileDocDir = path.join(tmpBasePath, 'uploadsprofile');
        const geophotoDir = path.join(tmpBasePath, 'geophotos');
        const audioDir = path.join(tmpBasePath, 'audio');
        const activityLogsDir = path.join(tmpBasePath, 'activitylogs');

        for (const dir of [farmerDocDir, schemeDocDir, aadhaarDocDir, profileDocDir, geophotoDir, audioDir, activityLogsDir]) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }

        // Process profile photos (files3)
        const newProfileDocNames: string[] = [];
        for (const file of files3) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const originalFileName = file.name;
            const safeFileName = `${originalFileName}`;
            const filePath = path.join(profileDocDir, safeFileName);
            await fs.promises.writeFile(filePath, buffer);
            newProfileDocNames.push(safeFileName);
        }

        // Process aadhaar documents (files4)
        const newAadhaarDocNames: string[] = [];
        for (const file of files4) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const originalFileName = file.name;
            const safeFileName = `${originalFileName}`;
            const filePath = path.join(aadhaarDocDir, safeFileName);
            await fs.promises.writeFile(filePath, buffer);
            newAadhaarDocNames.push(safeFileName);
        }

        // Process geo photos (files5)
        const geophotos: string[] = [];
        for (const file of files5) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const originalFileName = file.name;
            const safeFileName = `${originalFileName}`;
            const filePath = path.join(geophotoDir, safeFileName);
            await fs.promises.writeFile(filePath, buffer);
            geophotos.push(safeFileName);
        }

        // Process audio files (files6)
        const newAudioNames: string[] = [];
        for (const file of files6) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const originalFileName = file.name;
            const safeFileName = `${originalFileName}`;
            const filePath = path.join(audioDir, safeFileName);
            await fs.promises.writeFile(filePath, buffer);
            newAudioNames.push(safeFileName);
        }

        // Handle activity logs (files7)
        let activityLogFileName: string | null = null;
        if (files7 && files7.length > 0 && files7[0]) {
            const file = files7[0];
            const allowedExtensions = ['.xlsx', '.xls', '.csv', '.pdf', '.doc', '.docx', '.txt', '.json'];
            const fileExtension = path.extname(file.name).toLowerCase();

            if (!allowedExtensions.includes(fileExtension)) {
                console.warn(`File extension ${fileExtension} not allowed for activity logs. Allowed: ${allowedExtensions.join(', ')}`);
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const originalFileName = file.name;
            const safeFileName = path.basename(originalFileName);
            const filePath = path.join(activityLogsDir, safeFileName);
            await fs.promises.writeFile(filePath, buffer);
            activityLogFileName = safeFileName;
        }

        connection = await pool.getConnection();

        const results = [];

        // Process each farmer in the array
        for (const farmer of farmersData) {
            const farmerId = farmer.farmer_id;
            if (!farmerId) {
                results.push({
                    farmer_id: farmerId,
                    success: false,
                    message: 'farmer_id is required for each farmer record'
                });
                continue;
            }

            try {
                const updateFields: string[] = [];
                const updateValues: (string | number)[] = [];

                // Build update query for this farmer
                for (const field of updatableFields) {
                    const value = farmer[field];
                    if (value !== null && value !== undefined) {
                        updateFields.push(`${field} = ?`);
                        updateValues.push(value.toString());
                    }
                }

                if (updateFields.length > 0) {
                    updateValues.push(farmerId);
                    const updateQuery = `UPDATE farmers_new SET ${updateFields.join(', ')} WHERE farmer_id = ?`;
                    await connection.query(updateQuery, updateValues);

                    results.push({
                        farmer_id: farmerId,
                        success: true,
                        message: 'Farmer data updated successfully'
                    });
                } else {
                    results.push({
                        farmer_id: farmerId,
                        success: false,
                        message: 'No fields to update for this farmer'
                    });
                }

            } catch (error) {
                console.error(`Error updating farmer ${farmerId}:`, error);
                results.push({
                    farmer_id: farmerId,
                    success: false,
                    message: 'Update failed for this farmer'
                });
            }
        }

        return NextResponse.json({
            message: 'Bulk farmer update completed',
            results: results,
            uploadedProfileDocs: newProfileDocNames,
            uploadedAadhaarDocs: newAadhaarDocNames,
            geophotos1: geophotos,
            uploadedAudio: newAudioNames,
            uploadedActivityLog: activityLogFileName,
        });

    } catch (error) {
        console.error('Error updating farmer:', error);
        return NextResponse.json({ message: 'Update failed' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

