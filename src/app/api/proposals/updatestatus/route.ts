import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

// Update proposal status
export async function PUT(request: Request) {
  try {
    const { proposal_id, work_status, reason, review_checkboxes } = await request.json();

    if (!proposal_id || !work_status) {
      return NextResponse.json(
        { error: 'proposal_id and work_status are required' },
        { status: 400 }
      );
    }

    // Update work_status in database
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE proposal SET work_status = ? WHERE proposal_id = ?`,
      [work_status, proposal_id]
    );

    // If there's a reason (for Reject or Send Back), store it in work_status_record
    if (reason) {
      await pool.query<ResultSetHeader>(
        `UPDATE proposal SET work_status_record = ? WHERE proposal_id = ?`,
        [reason, proposal_id]
      );
    }

    // If review checkboxes are provided, store them in work_status_record as JSON
    if (review_checkboxes) {
      const existingRecord = await pool.query<RowDataPacket[]>(
        `SELECT work_status_record FROM proposal WHERE proposal_id = ?`,
        [proposal_id]
      );
      
      const recordData = existingRecord[0]?.[0]?.work_status_record 
        ? JSON.parse(existingRecord[0][0].work_status_record) 
        : {};
      
      recordData.review_checkboxes = review_checkboxes;
      
      await pool.query<ResultSetHeader>(
        `UPDATE proposal SET work_status_record = ? WHERE proposal_id = ?`,
        [JSON.stringify(recordData), proposal_id]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Proposal status updated successfully',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Error updating proposal status:', error);
    return NextResponse.json(
      { error: 'Failed to update proposal status' },
      { status: 500 }
    );
  }
}

