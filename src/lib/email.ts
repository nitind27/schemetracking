// Email utility for sending password reset links
// Configured with nodemailer - supports Gmail, SMTP, SendGrid, etc.

import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if email service is configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // If SMTP is not configured, log in development mode
    if (!smtpHost || !smtpUser || !smtpPass) {
      if (process.env.NODE_ENV === 'development') {
        console.log('=== EMAIL (Development Mode - SMTP not configured) ===');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Reset Link:', options.html.match(/https?:\/\/[^\s"<>]+/)?.[0] || 'Link in HTML');
        console.log('======================================================');
        console.log('To enable email sending, configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
        return true;
      } else {
        console.error('SMTP configuration missing. Cannot send email.');
        return false;
      }
    }

    // Create transporter configuration
    type TransporterConfig = {
      service?: string;
      host?: string;
      port?: number;
      secure?: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
    
    let transporterConfig: TransporterConfig;

    // If using Gmail, use service option (more reliable)
    if (smtpHost.includes('gmail.com') || smtpHost === 'smtp.gmail.com') {
      transporterConfig = {
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      };
    } else {
      // For other SMTP servers, use host/port configuration
      transporterConfig = {
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      };
    }

    // Create transporter
    const transporter = nodemailer.createTransport(transporterConfig);

    // Verify connection configuration
    try {
      await transporter.verify();
      console.log('SMTP server connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      // Continue anyway, sometimes verification fails but sending works
    }

    // Send email
    const mailOptions = {
      from: process.env.SMTP_FROM || smtpUser,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.to}. Message ID: ${info.messageId}`);
    return true;
  } catch (error: unknown) {
    console.error('Email sending error:', error);
    
    // Provide helpful error messages
    const emailError = error as { code?: string; message?: string };
    if (emailError.code === 'EAUTH') {
      console.error('Authentication failed. Check SMTP_USER and SMTP_PASS in .env');
    } else if (emailError.code === 'ECONNECTION' || emailError.code === 'ETIMEDOUT') {
      console.error('Connection failed. Check SMTP_HOST and SMTP_PORT in .env');
    } else if (emailError.code === 'EDNS') {
      console.error('DNS lookup failed. Check SMTP_HOST is correct (e.g., smtp.gmail.com, not email address)');
    }
    
    return false;
  }
}

export function generateResetEmailHtml(resetLink: string, userName?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
        <h1 style="color: #2563eb; margin-bottom: 20px;">Password Reset Request</h1>
        <p>Hello${userName ? ` ${userName}` : ''},</p>
        <p>You have requested to reset your password for your account. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #2563eb;">${resetLink}</p>
        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">
          This is an automated message, please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `;
}

