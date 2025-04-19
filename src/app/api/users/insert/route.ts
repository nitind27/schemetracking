import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { RowDataPacket } from 'mysql2';

// Define the User type to match your database schema
interface User {
  user_id?: number; // Auto-incremented, so optional for inserts
  name: string;
  user_category_id?: number | null;
  username: string;
  password: string;
  contact_no: string;
  address?: string | null;
  taluka_id?: number | null;
  village_id?: number | null;
  status?: string | null;
}

export async function POST(request: Request) {
  try {
    const {
      name,
      user_category_id,
      username,
      password,
      contact_no,
      address,
      taluka_id,
      village_id,
      status
    } = await request.json();

    // Basic validation
    if (!name || !username || !password || !contact_no) {
      return NextResponse.json(
        { error: 'Required fields: name, username, password, contact_no' },
        { status: 400 }
      );
    }

    // Database operation
    try {
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO users (
          name,
          user_category_id,
          username,
          password,
          contact_no,
          address,
          taluka_id,
          village_id,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          user_category_id,
          username,
          password,
          contact_no,
          address,
          taluka_id,
          village_id,
          status
        ]
      );

      const insertId = result.insertId;

      return NextResponse.json({
        success: true,
        userId: insertId,
      });
    } catch (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Request parsing error:', error);
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query<RowDataPacket[] &User[]>(`
        SELECT 
          user_id,
          name,
          user_category_id,
          username,
          contact_no,
          address,
          taluka_id,
          village_id,
          status
        FROM users
      `);
      return NextResponse.json(rows);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
