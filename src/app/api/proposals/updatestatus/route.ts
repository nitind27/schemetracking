import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

const CANONICAL_STATUSES = new Set([
  'pending',
  'under review',
  'correction needed',
  'pending at dlc',
  'rejected',
  'forwarded'
]);

function normalizeStatus(input?: string | null): string {
  const raw = (input || '').toString().trim().toLowerCase();
  if (!raw) return '';

  // Legacy / variants -> canonical
  if (raw === 'underreview') return 'under review';
  if (raw === 'correctionneeded') return 'correction needed';
  if (raw === 'not started' || raw === 'not started yet' || raw === 'submitted') return 'pending';
  if (raw === 'accepted' || raw === 'approved') return 'forwarded'; // treat legacy "accepted" as forwarded stage

  return raw;
}

// Update proposal status
export async function PUT(request: Request) {
  try {
    const { proposal_id, work_status, reason, review_checkboxes, forward_to, action } = await request.json();

    if (!proposal_id || !work_status) {
      return NextResponse.json(
        { error: 'proposal_id and work_status are required' },
        { status: 400 }
      );
    }

    // Decide canonical next status (lower-case)
    let nextStatus = normalizeStatus(work_status);

    if (action === 'start_review') nextStatus = 'under review';
    if (action === 'forward_to_dlc') nextStatus = 'pending at dlc';
    if (action === 'send_back_to_agency') nextStatus = 'correction needed';
    if (action === 'send_back') nextStatus = 'correction needed';
    if (action === 'reject') nextStatus = 'rejected';
    if (action === 'forward_to_user') nextStatus = 'forwarded';

    if (!CANONICAL_STATUSES.has(nextStatus)) {
      return NextResponse.json(
        { error: `Invalid work_status: ${work_status}` },
        { status: 400 }
      );
    }

    // Update work_status/forward_to in database
    let updateQuery = `UPDATE proposal SET work_status = ?, updated_at = NOW()`;
    const updateParams: (string | number)[] = [nextStatus];

    if (forward_to) {
      updateQuery += `, forward_to = ?`;
      updateParams.push(forward_to);
    }

    updateQuery += ` WHERE proposal_id = ?`;
    updateParams.push(proposal_id);

    const [result] = await pool.query<ResultSetHeader>(updateQuery, updateParams);

    // Handle work_status_record updates (reason and/or review_checkboxes)
    if (reason || review_checkboxes) {
      // Get existing work_status_record
      const existingRecord = await pool.query<RowDataPacket[]>(
        `SELECT work_status_record FROM proposal WHERE proposal_id = ?`,
        [proposal_id]
      );
      
      let recordData: Record<string, unknown> = {};
      const existingValue = existingRecord[0]?.[0]?.work_status_record;
      
      if (existingValue) {
        // Try to parse as JSON, if it fails, treat as plain string and create new object
        try {
          recordData = JSON.parse(existingValue);
          // Ensure it's an object (not a string or other type)
          if (typeof recordData !== 'object' || recordData === null) {
            recordData = {};
          }
        } catch {
          // If parsing fails, it's likely a plain string (from reason field)
          // Create new object and preserve the old value if needed
          recordData = {};
          if (typeof existingValue === 'string' && existingValue.trim()) {
            recordData.previous_remarks = existingValue;
          }
        }
      }
      
      // Add reason to recordData if provided
      if (reason) {
        recordData.reason = reason;
        // Also update remarks field
        await pool.query<ResultSetHeader>(
          `UPDATE proposal SET remarks = CONCAT(IFNULL(remarks, ''), '\n', ?) WHERE proposal_id = ?`,
          [reason, proposal_id]
        );
      }
      
      // Add review checkboxes to recordData if provided
      if (review_checkboxes) {
        recordData.review_checkboxes = review_checkboxes;
      }
      
      // Update work_status_record with the combined JSON data
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

