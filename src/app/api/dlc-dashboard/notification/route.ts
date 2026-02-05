import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

interface InsertResult extends ResultSetHeader {
  insertId: number;
}

// POST - Upload notification
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const link = formData.get('link') as string || '';
    const pdfFile = formData.get('pdf_file') as File | null;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    let pdfPath = '';

    // Handle PDF file upload if provided
    if (pdfFile && pdfFile.size > 0) {
      const bytes = await pdfFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'notifications');
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch {
        // Directory might already exist
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `notification_${timestamp}_${pdfFile.name}`;
      const filepath = path.join(uploadsDir, filename);

      // Save file
      await writeFile(filepath, buffer);
      pdfPath = `/uploads/notifications/${filename}`;
    }

    // Insert notification into database
    // First, check if notifications table exists, if not create it
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          link VARCHAR(500),
          pdf_file VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          status ENUM('Active', 'Inactive') DEFAULT 'Active'
        )
      `);
    } catch {
      console.log('Table creation skipped - may already exist');
    }

    const [result] = await pool.query<InsertResult>(
      `INSERT INTO notifications (title, description, link, pdf_file, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [title, description, link, pdfPath]
    );

    return NextResponse.json({
      message: 'Notification uploaded successfully',
      notification_id: result.insertId,
      pdf_path: pdfPath
    });
  } catch (error) {
    console.error('Error uploading notification:', error);
    return NextResponse.json(
      { error: 'Failed to upload notification' },
      { status: 500 }
    );
  }
}

// GET - Fetch all notifications
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM notifications 
       WHERE status = 'Active' 
       ORDER BY created_at DESC`
    );

    return NextResponse.json({ notifications: rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
