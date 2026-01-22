import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { serialize } from 'cookie'; // npm install cookie
import crypto from 'crypto';

// Reuse or define this interface if not already present
interface User {
  user_id: number;
  name: string;
  user_category_id: number;
  username: string;
  password: string;
  old_password?: string; // Optional field for backward compatibility
  contact_no: string;
  address: string;
  category_name: string;
  taluka_id: number;
  village_id: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export async function POST(req: Request) {
  try {
    const { username, password, captchaText } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Validate captcha (must be 5 characters, uppercase letters and numbers only)
    if (!captchaText || typeof captchaText !== 'string' || captchaText.length !== 5) {
      return NextResponse.json(
        { message: 'Please complete the captcha correctly' },
        { status: 400 }
      );
    }

    // Validate captcha format (only uppercase letters and numbers)
    if (!/^[A-Z0-9]{5}$/.test(captchaText)) {
      return NextResponse.json(
        { message: 'Invalid captcha format' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    const [users] = await connection.query(
      `SELECT users.*, user_category.category_name
       FROM users
       INNER JOIN user_category ON users.user_category_id = user_category.user_category_id
       WHERE users.username = ?`,
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

    // Hash the incoming password with SHA256
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    // Check if the hashed password matches the current password column
    let isPasswordValid = hashedPassword === user.password;

    // If password hash doesn't match and old_password exists, check old_password (plain text)
    if (!isPasswordValid && user.old_password) {
      isPasswordValid = password === user.old_password;
    }

    // If neither password nor old_password matches, return invalid credentials
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Set a session cookie with user info (e.g., user id)
    // Session cookie expires when browser is closed (no maxAge)
    const cookie = serialize('auth_token', String(user.user_id), {
      httpOnly: true,
      path: '/',
      // No maxAge - makes it a session cookie that expires when browser closes
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    const response = NextResponse.json({
      message: 'Login successful',
      user: { name: user.name, user_id: user.user_id, category_name: user.category_name, taluka_id: user.taluka_id, village_id: user.village_id,category_id:user.user_category_id }
    });
    response.headers.set('Set-Cookie', cookie);

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
