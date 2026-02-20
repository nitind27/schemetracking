import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import fs from 'fs';
import path from 'path';

// Helper function to upload photo
async function uploadPhoto(file: File, photoDir: string): Promise<string> {
  if (!file || !file.name) {
    return '';
  }

  const basename = path.basename(file.name);
  const uploadPath = path.join(photoDir, basename);

  if (!fs.existsSync(photoDir)) {
    fs.mkdirSync(photoDir, { recursive: true });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.promises.writeFile(uploadPath, buffer);

  return basename;
}

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM sabhasad WHERE status = 'Active' ORDER BY id DESC"
    );

    const response = rows.map((row) => ({
      ...row,
      id: row.id ? parseInt(row.id) : null,
      user_id: row.user_id ? parseInt(row.user_id) : null,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching village members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch village members' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function POST(request: Request) {
  let connection;
  try {
    const formData = await request.formData();
    const action = formData.get('action') as string;
    const id = formData.get('id') ? parseInt(formData.get('id') as string) : 0;
    const village_id = formData.get('village_id') ? parseInt(formData.get('village_id') as string) : 0;
    const name = formData.get('name') as string;
    const Position = formData.get('Position') as string;
    const contact_number = formData.get('contact_number') as string;
    const user_id = formData.get('user_id') as string;

    connection = await pool.getConnection();
    const photoDir = path.join(process.cwd(), 'tmp', 'uploads', 'village_member_profile');

    if (action === '1') {
      // Fetch by village_id
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT * FROM sabhasad WHERE village_id = ? AND status = 'Active' ORDER BY id DESC`,
        [village_id]
      );

      const response = rows.map((row) => ({
        ...row,
        id: row.id ? parseInt(row.id) : null,
        user_id: row.user_id ? parseInt(row.user_id) : null,
      }));

      return NextResponse.json(response);
    } else if (action === '2') {
      // INSERT
      const photoFile = formData.get('photo') as File | null;
      let photo_basename = '';

      if (photoFile) {
        photo_basename = await uploadPhoto(photoFile, photoDir);
      }

      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO sabhasad 
          (village_id, name, Position, contact_number, user_id, photo)
          VALUES (?, ?, ?, ?, ?, ?)`,
        [village_id, name, Position, contact_number, user_id, photo_basename]
      );

      return NextResponse.json({
        error: false,
        message: 'Member details submitted successfully.',
        id: result.insertId,
      });
    } else if (action === '3') {
      // UPDATE
      if (!id) {
        return NextResponse.json(
          { error: true, message: 'id required for update' },
          { status: 400 }
        );
      }

      // Get existing photo from DB
      const [existingRows] = await connection.query<RowDataPacket[]>(
        'SELECT photo FROM sabhasad WHERE id = ?',
        [id]
      );

      let photo_basename = existingRows[0]?.photo || '';

      // Check if new photo is uploaded
      const photoFile = formData.get('photo') as File | null;
      if (photoFile) {
        const new_photo_basename = await uploadPhoto(photoFile, photoDir);

        if (new_photo_basename && new_photo_basename !== photo_basename) {
          // Delete old photo if exists
          if (photo_basename) {
            const oldPhotoPath = path.join(photoDir, photo_basename);
            if (fs.existsSync(oldPhotoPath)) {
              fs.unlinkSync(oldPhotoPath);
            }
          }
          photo_basename = new_photo_basename;
        }
      }

      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE sabhasad 
          SET village_id=?, name=?, Position=?, contact_number=?, user_id=?, photo=?
          WHERE id=?`,
        [village_id, name, Position, contact_number, user_id, photo_basename, id]
      );

      if (result.affectedRows > 0) {
        return NextResponse.json({
          error: false,
          message: 'Member details updated successfully.',
          id: id,
        });
      } else {
        return NextResponse.json(
          { error: true, message: 'Member not found' },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { error: true, message: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in village members CRUD:', error);
    return NextResponse.json(
      {
        error: true,
        code: 500,
        message: error instanceof Error ? error.message : 'Operation failed',
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function DELETE(request: Request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') ? parseInt(searchParams.get('id')!) : 0;

    if (!id) {
      return NextResponse.json(
        { error: true, message: 'id required for delete' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // Check if exists
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM sabhasad WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: true, message: 'Not found' },
        { status: 404 }
      );
    }

    // Delete
    const [result] = await connection.execute<ResultSetHeader>(
      'DELETE FROM sabhasad WHERE id = ?',
      [id]
    );

    if (result.affectedRows > 0) {
      return NextResponse.json({
        error: false,
        message: 'Member details deleted successfully.',
      });
    } else {
      return NextResponse.json(
        { error: true, message: 'Delete failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting village member:', error);
    return NextResponse.json(
      {
        error: true,
        code: 500,
        message: error instanceof Error ? error.message : 'Delete failed',
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

