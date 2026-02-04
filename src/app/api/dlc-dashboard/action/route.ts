import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// PUT - Update proposal status based on DLC action
export async function PUT(req: Request) {
  try {
    const { proposal_id, action, reason, user_id } = await req.json();

    if (!proposal_id || !action || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Determine the new status based on action
    let newStatus = '';
    let newRemarks = '';

    if (action === 'sanction') {
      newStatus = 'complete';
      newRemarks = `DLC Sanctioned: ${reason}`;
      
      // Update the proposal (for sanction action)
      const [result] = await pool.query(
        `UPDATE proposal 
         SET work_status = ?, 
             remarks = CONCAT(IFNULL(remarks, ''), '\n', ?),
             updated_at = NOW()
         WHERE proposal_id = ? AND status = 'Active'`,
        [newStatus, newRemarks, proposal_id]
      );

      // Log the action in audit trail (if you have an audit table)
      try {
        await pool.query(
          `INSERT INTO proposal_audit_log (proposal_id, user_id, action, remarks, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [proposal_id, user_id, action, reason]
        );
      } catch (auditError) {
        // If audit table doesn't exist, continue without logging
        console.log('Audit logging skipped - table may not exist');
      }

      return NextResponse.json({
        message: `Proposal ${action === 'sanction' ? 'sanctioned' : 'sent back'} successfully`,
        proposal_id,
        new_status: newStatus
      });
    } else if (action === 'sendback') {
      newStatus = 'Correction needed';
      newRemarks = `DLC Send Back: ${reason}`;
      
      // Find a user with category_id = 24 to forward back to
      const [category24Users] = await pool.query<RowDataPacket[]>(
        `SELECT user_id FROM users WHERE user_category_id = 24 AND status = 'Active' LIMIT 1`
      );
      
      if (category24Users && category24Users.length > 0) {
        const forwardToUserId = category24Users[0].user_id;
        
        // Update the proposal with forward_to
        const [result] = await pool.query(
          `UPDATE proposal 
           SET work_status = ?, 
               remarks = CONCAT(IFNULL(remarks, ''), '\n', ?),
               forward_to = ?,
               updated_at = NOW()
           WHERE proposal_id = ? AND status = 'Active'`,
          [newStatus, newRemarks, forwardToUserId, proposal_id]
        );
      } else {
        // If no category_id = 24 user found, just update status and remarks
        const [result] = await pool.query(
          `UPDATE proposal 
           SET work_status = ?, 
               remarks = CONCAT(IFNULL(remarks, ''), '\n', ?),
               updated_at = NOW()
           WHERE proposal_id = ? AND status = 'Active'`,
          [newStatus, newRemarks, proposal_id]
        );
      }
      
      // Log the action in audit trail (if you have an audit table)
      try {
        await pool.query(
          `INSERT INTO proposal_audit_log (proposal_id, user_id, action, remarks, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [proposal_id, user_id, action, reason]
        );
      } catch (auditError) {
        // If audit table doesn't exist, continue without logging
        console.log('Audit logging skipped - table may not exist');
      }

      return NextResponse.json({
        message: `Proposal ${action === 'sanction' ? 'sanctioned' : 'sent back'} successfully`,
        proposal_id,
        new_status: newStatus
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to update proposal' },
      { status: 500 }
    );
  }
}