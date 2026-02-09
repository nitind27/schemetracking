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
    const [proposalsResult] = await pool.query<RowDataPacket[]>(`
      SELECT 
        p.*,
        pc.name AS proposal_category_name,
        u.name AS user_name,
        u.user_category_id,
        t.name AS taluka_name,
        gp.gpname AS gp_name,
        v.marathi_name AS village_name,
        DATEDIFF(NOW(), p.created_at) as days_pending,
        FLOOR(DATEDIFF(NOW(), p.created_at) / 30) as months_pending
      FROM proposal p
      LEFT JOIN proposal_category pc ON p.proposal_category_id = pc.proposal_category_id
      LEFT JOIN users u ON p.user_id = u.user_id
      LEFT JOIN taluka t ON p.taluka_id = t.taluka_id
      LEFT JOIN grampanchyat gp ON p.gp_id = gp.gp_id
      LEFT JOIN village v ON p.village_id = v.village_id
      WHERE p.status = 'Active'
      ORDER BY p.created_at DESC
    `);

    const proposals = (Array.isArray(proposalsResult) ? proposalsResult : []) as Proposal[];
    
    console.log('DC Dashboard - Proposals fetched:', proposals.length);
    if (proposals.length > 0) {
      console.log('Sample proposal:', {
        id: proposals[0].proposal_id,
        taluka: proposals[0].taluka_name,
        village: proposals[0].village_name,
        status: proposals[0].work_status,
        days_pending: proposals[0].days_pending,
        months_pending: proposals[0].months_pending,
        created_at: proposals[0].created_at
      });
    }

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
    // Filter proposals that have been pending for 30+ days (1 month or more)
    const actionRequired = proposals.filter(p => {
      // Handle both string and number types from MySQL
      let daysPending = 0;
      let monthsPending = 0;
      
      // Try to get days_pending from the result
      if (p.days_pending !== null && p.days_pending !== undefined) {
        daysPending = typeof p.days_pending === 'string' 
          ? parseInt(p.days_pending, 10) 
          : Number(p.days_pending);
        if (isNaN(daysPending)) daysPending = 0;
      }
      
      // Try to get months_pending from the result
      if (p.months_pending !== null && p.months_pending !== undefined) {
        monthsPending = typeof p.months_pending === 'string'
          ? parseInt(p.months_pending, 10)
          : Number(p.months_pending);
        if (isNaN(monthsPending)) monthsPending = 0;
      }
      
      // If days_pending is not available or 0, calculate from created_at
      if (daysPending === 0 && p.created_at) {
        try {
          const createdDate = new Date(p.created_at);
          const now = new Date();
          if (!isNaN(createdDate.getTime())) {
            const diffTime = Math.abs(now.getTime() - createdDate.getTime());
            daysPending = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            monthsPending = Math.floor(daysPending / 30);
          }
        } catch (e) {
          console.error('Error calculating days pending for proposal', p.proposal_id, e);
        }
      }
      
      // Include proposals that are 30+ days old (1 month or more)
      const isActionRequired = daysPending >= 30 || monthsPending >= 1;
      
      return isActionRequired;
    });

    // If no proposals are 30+ days old, show all pending/under review proposals
    let finalActionRequired = actionRequired;
    if (actionRequired.length === 0) {
      // Show all proposals that need attention (pending, under review, or no status)
      finalActionRequired = proposals.filter(p => {
        const status = (p.work_status || '').toLowerCase();
        return status.includes('pending') || 
               status.includes('under review') || 
               status === '' || 
               !p.work_status ||
               status.includes('correction');
      });
      
      // If still no proposals, show all proposals
      if (finalActionRequired.length === 0) {
        finalActionRequired = proposals;
      }
      
      console.log('No 30+ day old proposals. Showing pending/under review proposals:', finalActionRequired.length);
    }
    
    // Log all proposals with their calculated days for debugging
    console.log('All proposals with days pending:', proposals.slice(0, 5).map(p => {
      let days = Number(p.days_pending) || 0;
      if (days === 0 && p.created_at) {
        const createdDate = new Date(p.created_at);
        const now = new Date();
        if (!isNaN(createdDate.getTime())) {
          const diffTime = Math.abs(now.getTime() - createdDate.getTime());
          days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }
      }
      return {
        id: p.proposal_id,
        days: days,
        created_at: p.created_at,
        work_status: p.work_status
      };
    }));

    console.log('Action Required Proposals:', {
      total: finalActionRequired.length,
      sample: finalActionRequired.slice(0, 3).map(p => ({
        id: p.proposal_id,
        days_pending: p.days_pending,
        months_pending: p.months_pending,
        created_at: p.created_at,
        work_status: p.work_status
      }))
    });

    return NextResponse.json({
      success: true,
      proposals,
      stats,
      actionRequired: finalActionRequired
    });
  } catch (error) {
    console.error('Error fetching DC dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DC dashboard data' },
      { status: 500 }
    );
  }
}