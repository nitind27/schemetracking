import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

// Update work status
export async function PUT(request: Request) {
  try {
    const { work_id, work_status, reason, review_checkboxes } = await request.json();

    if (!work_id || !work_status) {
      return NextResponse.json(
        { error: 'work_id and work_status are required' },
        { status: 400 }
      );
    }

    // Update work_status in database
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE works SET work_status = ? WHERE work_id = ?`,
      [work_status, work_id]
    );

    // If there's a reason (for Reject or Send Back), store it in work_status_record
    if (reason) {
      await pool.query<ResultSetHeader>(
        `UPDATE works SET work_status_record = ? WHERE work_id = ?`,
        [reason, work_id]
      );
    }

    // If review checkboxes are provided, store them (you might need a separate field for this)
    // For now, we'll store it in work_status_record as JSON if needed
    if (review_checkboxes) {
      const existingRecord = await pool.query<RowDataPacket[]>(
        `SELECT work_status_record FROM works WHERE work_id = ?`,
        [work_id]
      );
      
      const recordData = existingRecord[0]?.[0]?.work_status_record 
        ? JSON.parse(existingRecord[0][0].work_status_record) 
        : {};
      
      recordData.review_checkboxes = review_checkboxes;
      
      await pool.query<ResultSetHeader>(
        `UPDATE works SET work_status_record = ? WHERE work_id = ?`,
        [JSON.stringify(recordData), work_id]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Work status updated successfully',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Error updating work status:', error);
    return NextResponse.json(
      { error: 'Failed to update work status' },
      { status: 500 }
    );
  }
}

