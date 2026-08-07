// app/api/villages/route.ts
import { NextResponse } from 'next/server';
import { assertApiAlive } from '@/lib/assertApiAlive';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import fs from 'fs';
import path from 'path';

interface Village {
    village_id: number;
    name: string;
}

export async function GET() {
    const __killed = await assertApiAlive('/api/villages');
    if (__killed) return __killed;
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
    const __killed = await assertApiAlive('/api/villages');
    if (__killed) return __killed;
    try {
        const formData = await request.formData();
        const village_id = formData.get('village_id');
        const gis = formData.get('gis');

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
        const villageTharavDir = path.join(tmpBasePath, 'villagetharav');
        const villageProcidingDir = path.join(tmpBasePath, 'villageprociding');
        // Create directories if they don't exist
        for (const dir of [villageDir, villageKmlDir, villageCertificateDir, villageTharavDir, villageProcidingDir]) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }

        const [existingRows] = await pool.query<RowDataPacket[]>(
            'SELECT photo, kmlfile, certificate_img, tharav, prociding FROM village WHERE village_id = ? LIMIT 1',
            [Number(village_id)]
        );
        const existingVillage = existingRows[0] as {
            photo?: string | null;
            kmlfile?: string | null;
            certificate_img?: string | null;
            tharav?: string | null;
            prociding?: string | null;
        } | undefined;

        const removeExistingFile = async (directory: string, filename?: string | null) => {
            if (!filename) return;
            const filePath = path.join(directory, filename);
            try {
                await fs.promises.unlink(filePath);
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                    console.warn(`Failed to remove file ${filePath}:`, error);
                }
            }
        };

        const updateFields: string[] = [];
        const updateValues: (string | number)[] = [];

        if(gis){
            updateFields.push('gis = ?');
            updateValues.push(gis.toString());
        }

        // Handle photo upload
        const photoFile = formData.get('photo');
        if (photoFile && typeof photoFile === 'object' && 'arrayBuffer' in photoFile && photoFile.name && photoFile.size > 0) {
            await removeExistingFile(villageDir, existingVillage?.photo);
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
            
            await removeExistingFile(villageKmlDir, existingVillage?.kmlfile);
            await fs.promises.writeFile(filePath, buffer);
            const kmlPath = `${filename}`;
            
            updateFields.push('kmlfile = ?');
            updateValues.push(kmlPath);
        }

        // Handle certificate_img upload
        const certificateFile = formData.get('certificate_img');
        if (certificateFile && typeof certificateFile === 'object' && 'arrayBuffer' in certificateFile && certificateFile.name && certificateFile.size > 0) {
            await removeExistingFile(villageCertificateDir, existingVillage?.certificate_img);
            const buffer = Buffer.from(await certificateFile.arrayBuffer());
            const filename = `${certificateFile.name}`;
            const filePath = path.join(villageCertificateDir, filename);
            
            await fs.promises.writeFile(filePath, buffer);
            const certificatePath = `${filename}`;
            
            updateFields.push('certificate_img = ?');
            updateValues.push(certificatePath);
        }

        // Handle tharav upload
        const tharavFile = formData.get('tharav');
        if (tharavFile && typeof tharavFile === 'object' && 'arrayBuffer' in tharavFile && tharavFile.name && tharavFile.size > 0) {
            await removeExistingFile(villageTharavDir, existingVillage?.tharav);
            const buffer = Buffer.from(await tharavFile.arrayBuffer());
            const filename = `${tharavFile.name}`;
            const filePath = path.join(villageTharavDir, filename);
            
            await fs.promises.writeFile(filePath, buffer);
            const tharavPath = `${filename}`;
            
            updateFields.push('tharav = ?');
            updateValues.push(tharavPath);
        }

        // Handle prociding upload
        const procidingFile = formData.get('prociding');
        if (procidingFile && typeof procidingFile === 'object' && 'arrayBuffer' in procidingFile && procidingFile.name && procidingFile.size > 0) {
            await removeExistingFile(villageProcidingDir, existingVillage?.prociding);
            const buffer = Buffer.from(await procidingFile.arrayBuffer());
            const filename = `${procidingFile.name}`;
            const filePath = path.join(villageProcidingDir, filename);
            
            await fs.promises.writeFile(filePath, buffer);
            const procidingPath = `${filename}`;
            
            updateFields.push('prociding = ?');
            updateValues.push(procidingPath);
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


