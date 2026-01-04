import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { message: 'Token and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const connection = await pool.getConnection();
    
    // Find valid token
    const [tokens] = await connection.query(
      `SELECT prt.*, u.user_id 
       FROM password_reset_tokens prt
       INNER JOIN users u ON prt.user_id = u.user_id
       WHERE prt.token = ? AND prt.used = FALSE AND prt.expires_at > NOW() AND u.status = "Active"`,
      [hashedToken]
    );

    if (!Array.isArray(tokens) || tokens.length === 0) {
      connection.release();
      return NextResponse.json(
        { message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const resetToken = tokens[0] as { user_id: number; id: number };
    const userId = resetToken.user_id;

    // Hash the new password with SHA256 (same format as login)
    const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');

    // Update user password
    await connection.query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE user_id = ?',
      [hashedPassword, userId]
    );

    // Mark token as used
    await connection.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE id = ?',
      [resetToken.id]
    );

    connection.release();

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

