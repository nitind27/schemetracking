import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import fs from 'fs';

interface InsertResult extends ResultSetHeader {
  insertId: number;
}

// GET - Fetch all notifications with optional filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    let query = `SELECT * FROM notifications WHERE 1=1`;
    const params: (string | number | null)[] = [];

    if (status !== 'all') {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (title LIKE ? OR description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json({ notifications: rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST - Create new notification
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const link = formData.get('link') as string || '';
    const expiryDate = formData.get('expiry_date') as string || null;
    const pdfFile = formData.get('pdf_file') as File | null;
    const userId = formData.get('user_id') as string | null;

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (pdfFile && pdfFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Validate file type (PDF or images)
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (pdfFile && !allowedTypes.includes(pdfFile.type)) {
      return NextResponse.json(
        { error: 'Only PDF and image files (JPEG, PNG, GIF, WEBP) are allowed' },
        { status: 400 }
      );
    }

    let filePath = '';

    // Handle file upload if provided
    if (pdfFile && pdfFile.size > 0) {
      const bytes = await pdfFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create uploads directory in tmp folder
      const uploadsDir = path.join(process.cwd(), 'tmp', 'uploads', 'notifications');
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch {
        // Directory might already exist
      }

      // Generate unique filename
      const timestamp = Date.now();
      const originalName = pdfFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `notification_${timestamp}_${originalName}`;
      const fullPath = path.join(uploadsDir, filename);

      // Save file
      await writeFile(fullPath, buffer);
      filePath = filename; // Store only filename, not full path
    }

    // Ensure notifications table exists with expiry_date column
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          link VARCHAR(500),
          pdf_file VARCHAR(500),
          expiry_date DATE,
          user_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          status ENUM('Active', 'Inactive') DEFAULT 'Active',
          INDEX idx_user_id (user_id),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at),
          INDEX idx_expiry_date (expiry_date)
        )
      `);

      // Add expiry_date column if it doesn't exist
      try {
        await pool.query(`ALTER TABLE notifications ADD COLUMN expiry_date DATE`);
      } catch {
        // Column might already exist
      }
    } catch (error) {
      console.log('Table creation/alteration skipped - may already exist', error);
    }

    // Insert notification
    const [result] = await pool.query<InsertResult>(
      `INSERT INTO notifications (title, description, link, pdf_file, expiry_date, user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        title.trim(),
        description.trim(),
        link.trim() || null,
        filePath || null,
        expiryDate || null,
        userId ? parseInt(userId) : null
      ]
    );

    return NextResponse.json({
      message: 'Notification created successfully',
      notification_id: result.insertId,
      file_path: filePath
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PUT - Update notification
export async function PUT(req: Request) {
  try {
    const formData = await req.formData();
    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const link = formData.get('link') as string || '';
    const expiryDate = formData.get('expiry_date') as string || null;
    const pdfFile = formData.get('pdf_file') as File | null;
    const deleteFile = formData.get('delete_file') === 'true';

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Get existing notification to check for old file
    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT pdf_file FROM notifications WHERE id = ?`,
      [id]
    );

    let filePath = existing[0]?.pdf_file || '';

    // Handle file deletion
    if (deleteFile && filePath) {
      const uploadsDir = path.join(process.cwd(), 'tmp', 'uploads', 'notifications');
      const fullPath = path.join(uploadsDir, filePath);
      try {
        if (fs.existsSync(fullPath)) {
          await unlink(fullPath);
        }
      } catch (error) {
        console.error('Error deleting old file:', error);
      }
      filePath = '';
    }

    // Handle new file upload
    if (pdfFile && pdfFile.size > 0) {
      // Validate file size (max 10MB)
      if (pdfFile.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File size must be less than 10MB' },
          { status: 400 }
        );
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
      ];

      if (!allowedTypes.includes(pdfFile.type)) {
        return NextResponse.json(
          { error: 'Only PDF and image files (JPEG, PNG, GIF, WEBP) are allowed' },
          { status: 400 }
        );
      }

      // Delete old file if exists
      if (filePath) {
        const uploadsDir = path.join(process.cwd(), 'tmp', 'uploads', 'notifications');
        const oldFullPath = path.join(uploadsDir, filePath);
        try {
          if (fs.existsSync(oldFullPath)) {
            await unlink(oldFullPath);
          }
        } catch (error) {
          console.error('Error deleting old file:', error);
        }
      }

      // Save new file
      const bytes = await pdfFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadsDir = path.join(process.cwd(), 'tmp', 'uploads', 'notifications');
      await mkdir(uploadsDir, { recursive: true });

      const timestamp = Date.now();
      const originalName = pdfFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `notification_${timestamp}_${originalName}`;
      const fullPath = path.join(uploadsDir, filename);

      await writeFile(fullPath, buffer);
      filePath = filename;
    }

    // Update notification
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE notifications 
       SET title = ?, description = ?, link = ?, pdf_file = ?, expiry_date = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        title.trim(),
        description.trim(),
        link.trim() || null,
        filePath || null,
        expiryDate || null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Notification updated successfully',
      notification_id: parseInt(id)
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE - Delete notification
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Get file path before deleting
    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT pdf_file FROM notifications WHERE id = ?`,
      [id]
    );

    // Delete file if exists
    if (existing[0]?.pdf_file) {
      const uploadsDir = path.join(process.cwd(), 'tmp', 'uploads', 'notifications');
      const fullPath = path.join(uploadsDir, existing[0].pdf_file);
      try {
        if (fs.existsSync(fullPath)) {
          await unlink(fullPath);
        }
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    // Delete notification
    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM notifications WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}

