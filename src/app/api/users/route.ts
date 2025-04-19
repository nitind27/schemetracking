// app/api/users/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// Define a User interface that matches your database schema
interface User extends RowDataPacket {
  user_id: number;
  name: string;
  user_category_id: number;
  username: string;
  password: string;
  contact_no: string;
  address: string;
  taluka_id: number;
  village_id: number;
  status: number | string;
  created_at: string;
  updated_at: string;
}

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query<User[]>(`
      SELECT 
        user_id,
        name,
        user_category_id,
        username,
        password,
        contact_no,
        address,
        taluka_id,
        village_id,
        status,
        created_at,
        updated_at 
      FROM users
    `);

    // Type-safe mapping
    const safeUsers = rows.map(({ ...user }) => user);

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error('Database query failed:', error);
    return NextResponse.json(
      { message: 'Failed to fetch users' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
