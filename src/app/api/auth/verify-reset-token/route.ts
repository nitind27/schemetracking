import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valid: false, message: 'Token is required' },
        { status: 400 }
      );
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const connection = await pool.getConnection();
    
    // Check if token exists and is valid
    const [tokens] = await connection.query(
      `SELECT prt.*, u.user_id, u.name 
       FROM password_reset_tokens prt
       INNER JOIN users u ON prt.user_id = u.user_id
       WHERE prt.token = ? AND prt.used = FALSE AND prt.expires_at > NOW() AND u.status = "Active"`,
      [hashedToken]
    );
    
    connection.release();

    if (!Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json(
        { valid: false, message: 'Invalid or expired token' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { valid: true, message: 'Token is valid' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Verify token error:', error);
    return NextResponse.json(
      { valid: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

