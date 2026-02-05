import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

interface Proposal extends RowDataPacket {
  proposal_id: number;
  proposal_category_id: number;
  proposal_category_name: string;
  work_status: string;
  forward_to: string;
  user_category_id: number;
  user_name: string;
  taluka_name: string;
  gp_name: string;
  village_name: string;
  beneficiaries: string;
  number_of_tree: number;
  land_details: string;
  remarks: string;
  pdf: string;
  created_at: string;
  updated_at: string;
  days_pending?: number;
  months_pending?: number;
}

interface DCStats {
  totalProposals: number;
  pendingAtRFODFO: number;
  rejectedByRFODFO: number;
  pendingAtDLC: number;
  dlcCompleted: number;
}

// GET - Fetch DC Dashboard data
export async function GET() {
  try {
    // Fetch all proposals with additional details
    const [proposalsResult] = await pool.query<Proposal[]>(`
      SELECT 
        p.*,
        pc.proposal_category_name,
        u.user_name,
        t.taluka_name,
        gp.gp_name,
        v.village_name,
        DATEDIFF(NOW(), p.created_at) as days_pending,
        FLOOR(DATEDIFF(NOW(), p.created_at) / 30) as months_pending
      FROM proposal p
      LEFT JOIN proposal_category pc ON p.proposal_category_id = pc.proposal_category_id
      LEFT JOIN users u ON p.user_id = u.user_id
      LEFT JOIN taluka t ON u.taluka_id = t.taluka_id
      LEFT JOIN grampanchyat gp ON u.gp_id = gp.gp_id
      LEFT JOIN village v ON u.village_id = v.village_id
      WHERE p.status = 'Active'
      ORDER BY p.created_at DESC
    `);

    const proposals = proposalsResult || [];

    // Calculate statistics
    const stats: DCStats = {
      totalProposals: proposals.length,
      pendingAtRFODFO: proposals.filter(p => 
        p.work_status?.toLowerCase().includes('pending') && 
        (p.work_status?.toLowerCase().includes('rfo') || p.work_status?.toLowerCase().includes('dfo'))
      ).length,
      rejectedByRFODFO: proposals.filter(p => 
        p.work_status?.toLowerCase() === 'rejected'
      ).length,
      pendingAtDLC: proposals.filter(p => 
        p.work_status?.toLowerCase().includes('pending at dlc') ||
        p.work_status?.toLowerCase().includes('dlc')
      ).length,
      dlcCompleted: proposals.filter(p => 
        p.work_status?.toLowerCase() === 'completed' ||
        p.work_status?.toLowerCase() === 'complete'
      ).length
    };

    // Get action required proposals (pending for more than 1 month)
    const actionRequired = proposals.filter(p => (p.months_pending || 0) >= 1);

    return NextResponse.json({
      success: true,
      proposals,
      stats,
      actionRequired
    });
  } catch (error) {
    console.error('Error fetching DC dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DC dashboard data' },
      { status: 500 }
    );
  }
}