import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

// Get all schemes
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM schemes');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// Create new scheme
export async function POST(request: Request) {
  const {
    scheme_category_id,
    scheme_sub_category_id,
    scheme_year_id,
    scheme_name,
    beneficiery_name,
    applyed_at,
    link,
    documents
  } = await request.json();

  // Basic validation
  if (
    scheme_category_id === undefined ||
    scheme_sub_category_id === undefined ||
    scheme_year_id === undefined ||
    !scheme_name ||
    !beneficiery_name ||
    !applyed_at ||
    !link ||
    !documents
  ) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO schemes 
      (scheme_category_id, scheme_sub_category_id, scheme_year_id, scheme_name, beneficiery_name, applyed_at, link, documents)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        scheme_category_id,
        scheme_sub_category_id,
        scheme_year_id,
        scheme_name,
        beneficiery_name,
        applyed_at,
        link,
        documents
      ]
    );
    return NextResponse.json({ message: 'Scheme created', id: result.insertId });
  } catch (error) {
    console.error('Creation failed:', error);
    return NextResponse.json({ error: 'Failed to create scheme' }, { status: 500 });
  }
}

// Update scheme
export async function PUT(request: Request) {
  const {
    id,
    scheme_category_id,
    scheme_sub_category_id,
    scheme_year_id,
    scheme_name,
    beneficiery_name,
    applyed_at,
    link,
    documents
  } = await request.json();

  if (
    !id ||
    scheme_category_id === undefined ||
    scheme_sub_category_id === undefined ||
    scheme_year_id === undefined ||
    !scheme_name ||
    !beneficiery_name ||
    !applyed_at ||
    !link ||
    !documents
  ) {
    return NextResponse.json({ error: 'All fields including ID are required' }, { status: 400 });
  }

  try {
    await pool.query(
      `UPDATE schemes SET
        scheme_category_id = ?,
        scheme_sub_category_id = ?,
        scheme_year_id = ?,
        scheme_name = ?,
        beneficiery_name = ?,
        applyed_at = ?,
        link = ?,
        documents = ?
      WHERE id = ?`,
      [
        scheme_category_id,
        scheme_sub_category_id,
        scheme_year_id,
        scheme_name,
        beneficiery_name,
        applyed_at,
        link,
        documents,
        id
      ]
    );
    return NextResponse.json({ message: 'Scheme updated' });
  } catch (error) {
    console.error('Update failed:', error);
    return NextResponse.json({ error: 'Failed to update scheme' }, { status: 500 });
  }
}

// Delete scheme
export async function DELETE(request: Request) {
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'Scheme ID is required' }, { status: 400 });
  }

  try {
    await pool.query('DELETE FROM schemes WHERE id = ?', [id]);
    return NextResponse.json({ message: 'Scheme deleted' });
  } catch (error) {
    console.error('Deletion failed:', error);
    return NextResponse.json({ error: 'Failed to delete scheme' }, { status: 500 });
  }
}
