import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

// Fix invalid JSON in work_status_record field
export async function POST() {
  try {
    // Get all proposals with work_status_record
    const [proposals] = await pool.query<RowDataPacket[]>(
      `SELECT proposal_id, work_status_record FROM proposal WHERE work_status_record IS NOT NULL AND work_status_record != ''`
    );

    let fixedCount = 0;
    let errorCount = 0;

    for (const proposal of proposals) {
      try {
        // Try to parse as JSON
        JSON.parse(proposal.work_status_record);
        // If successful, it's already valid JSON, skip
      } catch {
        // If parsing fails, it's plain text, convert to JSON format
        try {
          const jsonData = {
            reason: proposal.work_status_record,
            converted_at: new Date().toISOString(),
            original_format: 'plain_text'
          };

          await pool.query<ResultSetHeader>(
            `UPDATE proposal SET work_status_record = ? WHERE proposal_id = ?`,
            [JSON.stringify(jsonData), proposal.proposal_id]
          );

          fixedCount++;
          console.log(`Fixed proposal ${proposal.proposal_id}: converted plain text to JSON`);
        } catch (updateError) {
          errorCount++;
          console.error(`Failed to fix proposal ${proposal.proposal_id}:`, updateError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Work status records cleanup completed',
      total_checked: proposals.length,
      fixed_count: fixedCount,
      error_count: errorCount
    });
  } catch (error) {
    console.error('Error fixing work status records:', error);
    return NextResponse.json(
      { error: 'Failed to fix work status records' },
      { status: 500 }
    );
  }
}