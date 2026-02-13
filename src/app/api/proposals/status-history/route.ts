import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

interface StatusHistory extends RowDataPacket {
  id: number;
  proposal_id: number;
  user_id: number | null;
  action: string;
  remarks: string | null;
  created_at: string;
  user_name?: string;
  work_status?: string;
}

interface ProposalData extends RowDataPacket {
  proposal_id: number;
  work_status: string | null;
  created_at: string;
  updated_at: string;
  forward_to: string | null;
}

// GET - Fetch status history for a proposal
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const proposal_id = searchParams.get('proposal_id');

    if (!proposal_id) {
      return NextResponse.json(
        { error: 'proposal_id is required' },
        { status: 400 }
      );
    }

    // Fetch audit log entries
    const [auditLogsResult] = await pool.query<StatusHistory[]>(`
      SELECT 
        pal.*,
        u.name AS user_name
      FROM proposal_audit_log pal
      LEFT JOIN users u ON pal.user_id = u.user_id
      WHERE pal.proposal_id = ?
      ORDER BY pal.created_at ASC
    `, [proposal_id]);

    // Also get the proposal's current status and dates
    const [proposalDataResult] = await pool.query<ProposalData[]>(`
      SELECT 
        proposal_id,
        work_status,
        created_at,
        updated_at,
        forward_to
      FROM proposal
      WHERE proposal_id = ?
    `, [proposal_id]);

    const proposal = Array.isArray(proposalDataResult) && proposalDataResult.length > 0 ? proposalDataResult[0] : null;
    const auditLogs = Array.isArray(auditLogsResult) ? auditLogsResult : [];

    // Build timeline entries
    const timeline: Array<{
      id: string;
      status: string;
      action: string;
      date: string;
      user_name?: string;
      remarks?: string;
      isCurrent: boolean;
    }> = [];

    // Add initial creation entry
    if (proposal) {
      timeline.push({
        id: 'created',
        status: proposal.work_status || 'pending',
        action: 'Proposal Created',
        date: proposal.created_at,
        isCurrent: false,
      });
    }

    // Add audit log entries
    if (auditLogs.length > 0) {
      auditLogs.forEach((log) => {
        timeline.push({
          id: `audit-${log.id}`,
          status: log.action === 'sanction' ? 'complete' : 
                  log.action === 'sendback' ? 'correction needed' :
                  log.action === 'forward_to_dlc' ? 'pending at dlc' :
                  log.action === 'forward_to_user' ? 'forwarded' :
                  log.action === 'reject' ? 'rejected' :
                  log.action === 'start_review' ? 'under review' :
                  proposal?.work_status || 'pending',
          action: log.action === 'sanction' ? 'Sanctioned by DLC' :
                  log.action === 'sendback' ? 'Sent Back by DLC' :
                  log.action === 'forward_to_dlc' ? 'Forwarded to DLC' :
                  log.action === 'forward_to_user' ? 'Forwarded to User' :
                  log.action === 'reject' ? 'Rejected' :
                  log.action === 'start_review' ? 'Review Started' :
                  'Status Updated',
          date: log.created_at,
          user_name: log.user_name || undefined,
          remarks: log.remarks || undefined,
          isCurrent: false,
        });
      });
    }

    // Mark the last entry as current if it matches current status
    if (timeline.length > 0 && proposal) {
      const lastEntry = timeline[timeline.length - 1];
      if (lastEntry.status.toLowerCase() === (proposal.work_status || '').toLowerCase()) {
        lastEntry.isCurrent = true;
      }
    }

    return NextResponse.json({
      success: true,
      timeline,
      proposal: proposal ? {
        current_status: proposal.work_status,
        created_at: proposal.created_at,
        updated_at: proposal.updated_at,
        forward_to: proposal.forward_to,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching status history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status history' },
      { status: 500 }
    );
  }
}

