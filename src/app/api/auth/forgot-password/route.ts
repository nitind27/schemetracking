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
      // First, check if email column exists in users table
      let emailColumnExists = false;
      try {
        const [columns] = await connection.query(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'users' 
          AND COLUMN_NAME = 'email'
        `);
        emailColumnExists = Array.isArray(columns) && columns.length > 0;
        console.log('Email column exists:', emailColumnExists);
      } catch (error) {
        console.log('Error checking email column:', error);
        // Assume email column doesn't exist
        emailColumnExists = false;
      }

      // Find user by contact_no or email
      let query = '';
      let params: string[] = [];
      
      if (contact_no) {
        // Search by contact number (primary method)
        if (emailColumnExists) {
          query = 'SELECT user_id, name, contact_no, email FROM users WHERE contact_no = ? AND status = "Active"';
        } else {
          query = 'SELECT user_id, name, contact_no FROM users WHERE contact_no = ? AND status = "Active"';
        }
        params = [contact_no];
      } else if (email) {
        if (!emailColumnExists) {
          return NextResponse.json(
            { message: 'Email feature is not available. Please use contact number or contact administrator.' },
            { status: 400 }
          );
        }
        // Search by email - check if email exists in database
        query = 'SELECT user_id, name, contact_no, email FROM users WHERE email = ? AND status = "Active"';
        params = [email];
      }

      const [users] = await connection.query(query, params);

      console.log('Query executed:', query);
      console.log('Users found:', Array.isArray(users) ? users.length : 0);
      if (Array.isArray(users) && users.length > 0) {
        console.log('User data:', users[0]);
      }

      if (!Array.isArray(users) || users.length === 0) {
        // Don't reveal if user exists or not for security
        console.log('No user found with provided credentials');
        return NextResponse.json(
          { message: 'If an account exists with the provided information, a reset link has been sent.' },
          { status: 200 }
        );
      }

      const user = users[0] as { user_id: number; name: string; contact_no: string; email?: string };

      // Get email from database - this is the email we'll send reset link to
      const recipientEmail = (user).email || user.email;
      console.log('Recipient email from database:', recipientEmail);
      console.log('Full user object:', user);
      
      // If email was provided in the form, we must have email in database to send reset link
      if (email && !recipientEmail) {
        // User searched by email but database doesn't have email for this user
        console.error('Email provided but not found in database for user:', user.user_id);
        return NextResponse.json(
          { message: 'Email address not found in your account. Please contact administrator.' },
          { status: 400 }
        );
      }

      // If no email in database at all, cannot send reset link
      if (!recipientEmail || recipientEmail === null || recipientEmail === '') {
        console.error('No email found in database for user:', user.user_id);
        return NextResponse.json(
          { message: 'Email address not found in your account. Please contact administrator to add your email address.' },
          { status: 400 }
        );
      }

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
      
      // Generate reset link
      const resetLink = `https://fra.weclocks.online/reset-password?token=${resetToken}`;

      // Send email to the email address stored in database
      console.log('Attempting to send email to:', recipientEmail);
      console.log('Reset link:', resetLink);
      
      const emailSent = await sendEmail({
        to: recipientEmail,
        subject: 'Password Reset Request - Scheme Tracking System',
        html: generateResetEmailHtml(resetLink, user.name)
      });

      console.log('Email sent result:', emailSent);

      if (!emailSent) {
        console.error('Failed to send email. Check SMTP configuration.');
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

