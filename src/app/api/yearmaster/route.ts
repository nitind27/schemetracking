import pool from '@/lib/db';
import { assertApiAlive } from '@/lib/assertApiAlive';
import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

// Get all years


export async function GET() {
    const __killed = await assertApiAlive('/api/yearmaster');
    if (__killed) return __killed;
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM scheme_year where status = "Active"');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// Create new Year
export async function POST(request: Request) {
    const __killed = await assertApiAlive('/api/yearmaster');
    if (__killed) return __killed;
  try {
    const { year } = await request.json();

    if (!year) {
      return NextResponse.json({ error: 'Year is required' }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO scheme_year (year) VALUES (?)',
      [year]
    );

    return NextResponse.json({ 
      message: 'Year created', 
      scheme_year_id: result.insertId 
    });
  } catch (error) {
    console.error("Error creating scheme_year:", error);
    return NextResponse.json({ error: 'Failed to create Year' }, { status: 500 });
  }
}

// Update Year
export async function PUT(request: Request) {
    const __killed = await assertApiAlive('/api/yearmaster');
    if (__killed) return __killed;
  try {
    const { scheme_year_id, year } = await request.json();

    if (!scheme_year_id || !year) {
      return NextResponse.json(
        { error: 'Both scheme_year_id and year are required' }, 
        { status: 400 }
      );
    }

    await pool.query(
      'UPDATE scheme_year SET year = ? WHERE scheme_year_id = ?',
      [year, scheme_year_id]
    );

    return NextResponse.json({ message: 'Year updated' });
  } catch (error) {
    console.error("Error updating scheme_year:", error);
    return NextResponse.json({ error: 'Failed to update Year' }, { status: 500 });
  }
}

// Delete Year (soft delete - set status to Inactive)
export async function DELETE(request: Request) {
    const __killed = await assertApiAlive('/api/yearmaster');
    if (__killed) return __killed;
  try {
    const { scheme_year_id } = await request.json();

    if (!scheme_year_id) {
      return NextResponse.json(
        { error: 'scheme_year_id is required' }, 
        { status: 400 }
      );
    }

    await pool.query(
      'UPDATE scheme_year SET status = ? WHERE scheme_year_id = ?', 
      ['Inactive', scheme_year_id]
    );

    return NextResponse.json({ message: 'Year deleted successfully' });
  } catch (error) {
    console.error("Error deleting scheme_year:", error);
    return NextResponse.json({ error: 'Failed to delete Year' }, { status: 500 });
  }
}


export async function PATCH(request: Request) {
    const __killed = await assertApiAlive('/api/yearmaster');
    if (__killed) return __killed;
  const { scheme_year_id, status } = await request.json();

  if (!scheme_year_id || !status) {
    return NextResponse.json({ error: 'scheme_year ID and status are required' }, { status: 400 });
  }

  try {
    await pool.query(
      'UPDATE scheme_year SET status = ? WHERE scheme_year_id = ?',
      [status, scheme_year_id]
    );
    return NextResponse.json({ message: `documents ${status === 'active' ? 'activated' : 'deactivated'}` });
  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}