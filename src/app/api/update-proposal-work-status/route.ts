import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function POST(request: Request) {
  let connection;
  try {
    const formData = await request.formData();
    const proposal_id = formData.get('proposal_id') as string;
    const work_status = formData.get('work_status') as string;
    const reject_reason = formData.get('reject_reason') as string;
    const from_cate_id = formData.get('from_cate_id') as string;
    const forward_to = formData.get('forward_to') as string;
    const user_id = formData.get('user_id') as string;

    if (!proposal_id) {
      return NextResponse.json(
        {
          error: true,
          code: 400,
          message: 'Proposal ID is required for update.',
        },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // Get existing work_status_record
    const [existingRows] = await connection.query<RowDataPacket[]>(
      'SELECT work_status_record FROM proposal WHERE proposal_id = ?',
      [proposal_id]
    );

    const existing_record = existingRows[0]?.work_status_record || '';

    // New work status record string
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const new_record = `${user_id}}${from_cate_id}}${forward_to}}${work_status}}${reject_reason}}${now}`;

    // Append new record with pipe separator if existing record is not empty
    const updated_record = existing_record
      ? `${existing_record}|${new_record}`
      : new_record;

    let result: ResultSetHeader;
    if (forward_to && forward_to.trim()) {
      // Update with forward_to
      [result] = await connection.execute<ResultSetHeader>(
        `UPDATE proposal SET 
          work_status_record = ?,
          updated_at = NOW() 
          WHERE proposal_id = ?`,
        [updated_record, proposal_id]
      );
    } else {
      // Update without forward_to (keep existing forward_to)
      [result] = await connection.execute<ResultSetHeader>(
        `UPDATE proposal SET 
          work_status_record = ?, 
          forward_to = ?, 
          updated_at = NOW() 
          WHERE proposal_id = ?`,
        [updated_record, forward_to, proposal_id]
      );
    }

    if (result.affectedRows > 0) {
      const message =
        work_status == '2'
          ? 'Proposal verified successfully.'
          : work_status == '3'
          ? 'Proposal rejected successfully.'
          : 'Proposal forwarded successfully.';

      return NextResponse.json({
        error: false,
        message: message,
        proposal_id: parseInt(proposal_id),
      });
    } else {
      return NextResponse.json(
        {
          error: true,
          code: 404,
          message: 'Proposal not found',
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error updating proposal work status:', error);
    return NextResponse.json(
      {
        error: true,
        code: 500,
        message: error instanceof Error ? error.message : 'Update failed',
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

