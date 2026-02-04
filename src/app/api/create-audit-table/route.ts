import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST - Create audit log table
export async function POST() {
  try {
    // Create proposal_audit_log table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS proposal_audit_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        proposal_id INT NOT NULL,
        user_id INT,
        action VARCHAR(50) NOT NULL,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_proposal_id (proposal_id),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      )
    `);

    // Create notifications table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        link VARCHAR(500),
        pdf_file VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      )
    `);

    return NextResponse.json({
      message: 'Audit tables created successfully',
      tables: ['proposal_audit_log', 'notifications']
    });
  } catch (error) {
    console.error('Error creating audit tables:', error);
    return NextResponse.json(
      { error: 'Failed to create audit tables' },
      { status: 500 }
    );
  }
}