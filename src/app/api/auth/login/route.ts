import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Reuse or define this interface if not already present
interface User {
  user_id: number;
  name: string;
  user_category_id: number;
  username: string;
  password: string;
  contact_no: string;
  address: string;
  taluka_id: number;
  village_id: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    const [users] = await connection.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    connection.release();

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = users[0] as User;

    if (password !== user.password) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const { ...userData } = user;

    return NextResponse.json({
      message: 'Login successful',
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
