// app/api/villages/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import fs from 'fs';
import path from 'path';

interface Village {
    village_id: number;
    name: string;
}

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[] & Village[]>(`SELECT * FROM village where status = "Active"`);


        const safeVillages = (rows as Village[]).map(({ ...village }) => village);

        return NextResponse.json(safeVillages);
    } catch (error) {
        console.error('Database query failed:', error);
        return NextResponse.json(
            { message: 'Failed to fetch villages' },
            { status: 500 }
        );
    }
}

// PUT: Update village files (photo, kmlfile, certificate_img) by village_id
export async function PUT(request: Request) {
    try {
        const formData = await request.formData();
        const village_id = formData.get('village_id');

        if (!village_id) {
            return NextResponse.json(
                { error: true, message: 'village_id is required' },
                { status: 400 }
            );
        }

        const tmpBasePath = path.join(process.cwd(), 'tmp', 'uploads');
        const villageDir = path.join(tmpBasePath, 'village');
        const villageKmlDir = path.join(tmpBasePath, 'villagekml');
        const villageCertificateDir = path.join(tmpBasePath, 'villagecertificate');

        // Create directories if they don't exist
        for (const dir of [villageDir, villageKmlDir, villageCertificateDir]) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }

        const updateFields: string[] = [];
        const updateValues: (string | number)[] = [];

        // Handle photo upload
        const photoFile = formData.get('photo');
        if (photoFile && typeof photoFile === 'object' && 'arrayBuffer' in photoFile && photoFile.name && photoFile.size > 0) {
            const buffer = Buffer.from(await photoFile.arrayBuffer());
            const filename = `${photoFile.name}`;
            const filePath = path.join(villageDir, filename);
            
            await fs.promises.writeFile(filePath, buffer);
            const photoPath = `${filename}`;
            
            updateFields.push('photo = ?');
            updateValues.push(photoPath);
        }

        // Handle kmlfile upload
        const kmlFile = formData.get('kmlfile');
        if (kmlFile && typeof kmlFile === 'object' && 'arrayBuffer' in kmlFile && kmlFile.name && kmlFile.size > 0) {
            const filename = `${kmlFile.name}`;
            const fileExtension = path.extname(filename).toLowerCase();
            
            // Validate KML file extension
            if (fileExtension !== '.kml') {
                return NextResponse.json(
                    { error: true, message: 'Failed: KML file must have .kml extension' },
                    { status: 400 }
                );
            }
            
            const buffer = Buffer.from(await kmlFile.arrayBuffer());
            const filePath = path.join(villageKmlDir, filename);
            
            await fs.promises.writeFile(filePath, buffer);
            const kmlPath = `${filename}`;
            
            updateFields.push('kmlfile = ?');
            updateValues.push(kmlPath);
        }

        // Handle certificate_img upload
        const certificateFile = formData.get('certificate_img');
        if (certificateFile && typeof certificateFile === 'object' && 'arrayBuffer' in certificateFile && certificateFile.name && certificateFile.size > 0) {
            const buffer = Buffer.from(await certificateFile.arrayBuffer());
            const filename = `${certificateFile.name}`;
            const filePath = path.join(villageCertificateDir, filename);
            
            await fs.promises.writeFile(filePath, buffer);
            const certificatePath = `${filename}`;
            
            updateFields.push('certificate_img = ?');
            updateValues.push(certificatePath);
        }

        // If no fields to update, just return success
        if (updateFields.length === 0) {
            return NextResponse.json({
                error: false,
                message: 'No fields to update',
                affectedRows: 0
            });
        }

        // Add village_id to updateValues for WHERE clause
        updateValues.push(Number(village_id));

        // Build and execute update query
        const updateQuery = `UPDATE village SET ${updateFields.join(', ')} WHERE village_id = ?`;
        const [result] = await pool.query<ResultSetHeader>(updateQuery, updateValues);

        return NextResponse.json({
            error: false,
            message: 'Village updated successfully',
            affectedRows: result.affectedRows
        });
    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json(
            { error: true, message: 'Failed to update village' },
            { status: 500 }
        );
    }
}


