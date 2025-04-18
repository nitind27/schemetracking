import { NextResponse } from 'next/server';
import pool from '@/lib/db';

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
      const [result] = await pool.query(
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

      return NextResponse.json({
        success: true,
        userId: (result as any).insertId
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
      const [rows] = await connection.query(`
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
