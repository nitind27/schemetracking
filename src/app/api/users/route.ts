// app/api/user/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// 1. Create a SafeUser type excluding password
// interface User extends RowDataPacket {
//   user_id: number;
//   name: string;
//   user_category_id: number;
//   username: string;
//   password: string;
//   contact_no: string;
//   address: string;
//   taluka_id: number;
//   village_id: number;
//   status: string;
//   created_at: Date;
//   updated_at: Date;
// }

// 2. Define type-safe return structure
interface SafeUser extends Omit<any, 'password'> {}

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query<any[]>(`
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

    // 3. Type-safe mapping
    const safeUsers: SafeUser[] = rows.map(({ password: _, ...user }) => user);


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
