// app/api/villageimagedelete/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import fs from 'fs';
import path from 'path';

// DELETE: Delete village files (photo, kmlfile, certificate_img) by village_id
export async function DELETE(request: Request) {
    try {
        const formData = await request.formData();
        const village_id = formData.get('village_id');
        const photo = formData.get('photo');
        const kmlfile = formData.get('kmlfile');
        const certificate_img = formData.get('certificate_img');

        // Validate village_id is provided
        if (!village_id) {
            return NextResponse.json(
                { error: true, message: 'village_id is required' },
                { status: 400 }
            );
        }

        // Check if at least one file field is provided
        if (!photo && !kmlfile && !certificate_img) {
            return NextResponse.json(
                { error: true, message: 'At least one file field (photo, kmlfile, or certificate_img) is required' },
                { status: 400 }
            );
        }

        const tmpBasePath = path.join(process.cwd(), 'tmp', 'uploads');
        const villageDir = path.join(tmpBasePath, 'village');
        const villageKmlDir = path.join(tmpBasePath, 'villagekml');
        const villageCertificateDir = path.join(tmpBasePath, 'villagecertificate');

        const updateFields: string[] = [];
        const deletedFiles: string[] = [];
        const errors: string[] = [];

        // Handle photo deletion
        if (photo && typeof photo === 'string' && photo.trim() !== '') {
            const photoPath = path.join(villageDir, photo);
            try {
                if (fs.existsSync(photoPath)) {
                    await fs.promises.unlink(photoPath);
                    deletedFiles.push(`photo: ${photo}`);
                } else {
                    errors.push(`Photo file not found: ${photo}`);
                }
                updateFields.push('photo = ?');
            } catch (error) {
                console.error(`Error deleting photo ${photo}:`, error);
                errors.push(`Failed to delete photo: ${photo}`);
            }
        }

        // Handle kmlfile deletion
        if (kmlfile && typeof kmlfile === 'string' && kmlfile.trim() !== '') {
            const kmlPath = path.join(villageKmlDir, kmlfile);
            try {
                if (fs.existsSync(kmlPath)) {
                    await fs.promises.unlink(kmlPath);
                    deletedFiles.push(`kmlfile: ${kmlfile}`);
                } else {
                    errors.push(`KML file not found: ${kmlfile}`);
                }
                updateFields.push('kmlfile = ?');
            } catch (error) {
                console.error(`Error deleting kmlfile ${kmlfile}:`, error);
                errors.push(`Failed to delete kmlfile: ${kmlfile}`);
            }
        }

        // Handle certificate_img deletion
        if (certificate_img && typeof certificate_img === 'string' && certificate_img.trim() !== '') {
            const certificatePath = path.join(villageCertificateDir, certificate_img);
            try {
                if (fs.existsSync(certificatePath)) {
                    await fs.promises.unlink(certificatePath);
                    deletedFiles.push(`certificate_img: ${certificate_img}`);
                } else {
                    errors.push(`Certificate file not found: ${certificate_img}`);
                }
                updateFields.push('certificate_img = ?');
            } catch (error) {
                console.error(`Error deleting certificate_img ${certificate_img}:`, error);
                errors.push(`Failed to delete certificate_img: ${certificate_img}`);
            }
        }

        // Update database if there are fields to update
        if (updateFields.length > 0) {
            const updateValues: string[] = new Array(updateFields.length).fill('');
            updateValues.push(String(village_id));

            const updateQuery = `UPDATE village SET ${updateFields.join(', ')} WHERE village_id = ?`;
            const [result] = await pool.query<ResultSetHeader>(updateQuery, updateValues);

            return NextResponse.json({
                error: false,
                message: 'Files deleted and database updated successfully',
                deletedFiles: deletedFiles,
                errors: errors.length > 0 ? errors : undefined,
                affectedRows: result.affectedRows
            });
        } else {
            return NextResponse.json({
                error: true,
                message: 'No valid files to delete',
                errors: errors
            }, { status: 400 });
        }
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { error: true, message: 'Failed to delete village files' },
            { status: 500 }
        );
    }
}


