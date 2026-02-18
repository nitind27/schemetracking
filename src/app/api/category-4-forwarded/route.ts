import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

interface Proposal extends RowDataPacket {
  proposal_id: number;
  proposal_category_id: number;
  proposal_category_name: string;
  work_status: string | number | null;
  forward_to: string;
  user_id: number;
  user_category_id: number | null;
  verified_user_category_id: number | null;
  user_category_name: string | null;
  user_name: string;
  taluka_id: number;
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

interface ForwardedStats {
  totalForwarded: number;
  pendingReview: number;
  overdue: number;
}

// GET - Fetch forwarded proposals for category 4
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    // Validate user_id
    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Fetch proposals where:
    // - proposal_category_id = 4
    // - forward_to = user_id
    // - work_status = 'forwarded'
    const [proposalsResult] = await pool.query<RowDataPacket[]>(`
      SELECT 
        p.*,
        pc.name AS proposal_category_name,
        u.name AS user_name,
        u.user_id,
        u.user_category_id,
        uc.user_category_id AS verified_user_category_id,
        uc.category_name AS user_category_name,
        t.taluka_id,
        t.name AS taluka_name,
        gp.gpname AS gp_name,
        v.marathi_name AS village_name,
        DATEDIFF(NOW(), p.created_at) as days_pending,
        FLOOR(DATEDIFF(NOW(), p.created_at) / 30) as months_pending
      FROM proposal p
      LEFT JOIN proposal_category pc ON p.proposal_category_id = pc.proposal_category_id
      LEFT JOIN users u ON p.user_id = u.user_id
      LEFT JOIN user_category uc ON u.user_category_id = uc.user_category_id
      LEFT JOIN taluka t ON p.taluka_id = t.taluka_id
      LEFT JOIN grampanchyat gp ON p.gp_id = gp.gp_id
      LEFT JOIN village v ON p.village_id = v.village_id
      WHERE p.status = 'Active'
        AND p.proposal_category_id = 4
        AND p.forward_to = ?
        AND LOWER(TRIM(p.work_status)) = 'forwarded'
      ORDER BY p.created_at DESC
    `, [userId]);

    const proposals = (Array.isArray(proposalsResult) ? proposalsResult : []) as Proposal[];
    
    console.log(`Category 4 Forwarded Proposals - Total proposals fetched for user_id ${userId}:`, proposals.length);

    // Calculate statistics
    const pendingReview = proposals.filter(p => {
      const daysPending = Number(p.days_pending) || 0;
      return daysPending > 0;
    });

    const overdue = proposals.filter(p => {
      const daysPending = Number(p.days_pending) || 0;
      return daysPending >= 30;
    });

    const stats: ForwardedStats = {
      totalForwarded: proposals.length,
      pendingReview: pendingReview.length,
      overdue: overdue.length
    };

    return NextResponse.json({
      success: true,
      proposals,
      stats,
      categoryId: 4
    });
  } catch (error) {
    console.error('Error fetching Category 4 forwarded proposals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forwarded proposals' },
      { status: 500 }
    );
  }
}

