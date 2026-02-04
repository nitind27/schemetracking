import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// GET debug information about proposals
export async function GET() {
  try {
    // Get all active proposals with their status and forward_to information
    const [allProposals] = await pool.query<RowDataPacket[]>(
      `SELECT 
        proposal_id,
        work_status,
        forward_to,
        status,
        updated_at,
        created_at
      FROM proposal
      WHERE status = 'Active'
      ORDER BY updated_at DESC
      LIMIT 20`
    );

    // Get specifically proposals pending at DLC
    const [dlcProposals] = await pool.query<RowDataPacket[]>(
      `SELECT 
        proposal_id,
        work_status,
        forward_to,
        status,
        updated_at
      FROM proposal
      WHERE status = 'Active' 
        AND work_status = 'pending at DLC'
      ORDER BY updated_at DESC`
    );

    // Get proposals with forward_to pointing to category_id = 35 users
    const [forwardedToDLC] = await pool.query<RowDataPacket[]>(
      `SELECT 
        p.proposal_id,
        p.work_status,
        p.forward_to,
        p.status,
        p.updated_at,
        u.name as forward_to_user_name,
        u.user_category_id as forward_to_category
      FROM proposal p
      LEFT JOIN users u ON p.forward_to = u.user_id
      WHERE p.status = 'Active' 
        AND u.user_category_id = 35
      ORDER BY p.updated_at DESC`
    );

    return NextResponse.json({
      debug_info: {
        total_active_proposals: allProposals.length,
        proposals_pending_at_dlc: dlcProposals.length,
        proposals_forwarded_to_dlc_users: forwardedToDLC.length
      },
      all_proposals: allProposals,
      dlc_proposals: dlcProposals,
      forwarded_to_dlc: forwardedToDLC
    });
  } catch (error) {
    console.error('Error fetching debug proposals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug proposals' },
      { status: 500 }
    );
  }
}