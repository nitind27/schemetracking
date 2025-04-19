import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

// Get all documents
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM documents');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// Create new document category
export async function POST(request: Request) {
  const { document_name } = await request.json();
  
  if (!document_name) {
    return NextResponse.json({ error: 'Document name is required' }, { status: 400 });
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO documents (document_name) VALUES (?)',
      [document_name]
    );
    return NextResponse.json({ message: 'Document category created', id: result.insertId });
  } catch (error) {
    console.error('Creation error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

// Update document category
export async function PUT(request: Request) {
  const { id, document_name } = await request.json();
  
  if (!id || !document_name) {
    return NextResponse.json({ error: 'Both ID and document name are required' }, { status: 400 });
  }

  try {
    await pool.query(
      'UPDATE documents SET document_name = ? WHERE id = ?',
      [document_name, id]
    );
    return NextResponse.json({ message: 'Document category updated' });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// Delete document category
export async function DELETE(request: Request) {
  const { id } = await request.json();
  
  if (!id) {
    return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
  }

  try {
    await pool.query('DELETE FROM documents WHERE id = ?', [id]);
    return NextResponse.json({ message: 'Document category deleted' });
  } catch (error) {
    console.error('Deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
