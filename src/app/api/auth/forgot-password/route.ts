import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';
import { sendEmail, generateResetEmailHtml } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { contact_no, email } = await req.json();

    if (!contact_no && !email) {
      return NextResponse.json(
        { message: 'Contact number or email is required' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    
    try {
      // Find user by contact_no or email
      let query = '';
      let params: string[] = [];
      
      if (contact_no) {
        // Search by contact number (primary method)
        query = 'SELECT user_id, name, contact_no FROM users WHERE contact_no = ? AND status = "Active"';
        params = [contact_no];
      } else if (email) {
        // Try to search by email (if email column exists in database)
        // If email column doesn't exist, this will fail gracefully
        query = 'SELECT user_id, name, contact_no FROM users WHERE email = ? AND status = "Active"';
        params = [email];
      }

      const [users] = await connection.query(query, params);

      if (!Array.isArray(users) || users.length === 0) {
        // Don't reveal if user exists or not for security
        return NextResponse.json(
          { message: 'If an account exists with the provided information, a reset link has been sent.' },
          { status: 200 }
        );
      }

      const user = users[0] as { user_id: number; name: string; contact_no: string; email?: string };

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store reset token in database
      // First, check if password_reset_tokens table exists, if not create it
      try {
        await connection.query(`
          CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token VARCHAR(255) NOT NULL,
            expires_at DATETIME NOT NULL,
            used BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_token (token),
            INDEX idx_user_id (user_id),
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
          )
        `);
      } catch (error) {
        // Table might already exist, continue
        console.log('Table creation note:', error);
      }

      // Insert reset token
      await connection.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.user_id, hashedToken, expiresAt]
      );

      // Determine email address to send to
      // Use email if available, otherwise construct from contact_no
      // Note: In production, you should have a proper email field in users table
      const userWithEmail = user as { user_id: number; name: string; contact_no: string; email?: string };
      const recipientEmail = userWithEmail.email || `user${user.user_id}@${process.env.EMAIL_DOMAIN || 'schemetracking.com'}`;
      
      // Generate reset link
      const resetLink = `https://fra.weclocks.online/reset-password?token=${resetToken}`;

      // Send email
      const emailSent = await sendEmail({
        to: recipientEmail,
        subject: 'Password Reset Request - Scheme Tracking System',
        html: generateResetEmailHtml(resetLink, user.name)
      });

      if (!emailSent) {
        return NextResponse.json(
          { message: 'Failed to send reset email. Please try again later.' },
          { status: 500 }
        );
      }

      // Return success (don't reveal if user exists)
      return NextResponse.json(
        { message: 'If an account exists with the provided information, a reset link has been sent to your email.' },
        { status: 200 }
      );
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

