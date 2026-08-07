import { NextResponse } from 'next/server';
import { assertApiAlive } from '@/lib/assertApiAlive';
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

interface Category48Stats {
  totalProposals: number;
  pendingForAcceptAtRFODFO: number; // Pending for Accept at RFO/DFO
  rejectedByRFODFO: number; // Rejected by RFO/DFO
  pendingAtRFODFO: number; // Pending at RFO/DFO (Under Review)
  pendingAtPO: number; // Pending at PO
  pendingAtDLC: number; // Pending at DLC
  dlcCompleted: number; // DLC Completed
}

// GET - Fetch Category 4 and 8 Dashboard data
export async function GET(request: Request) {
    const __killed = await assertApiAlive('/api/category-4-8-dashboard');
    if (__killed) return __killed;
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id'); // user_id from sessionStorage
    
    // Validate user_id is provided
    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Fetch proposals filtered by: forward_to = user_id OR work_status = 'forwarded'
    const userIdNum = parseInt(userId, 10);
    
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'Invalid user_id' },
        { status: 400 }
      );
    }
    
    // Build query with filtering condition:
    // - forward_to = user_id OR work_status = 'forwarded'
    // - No proposal_category_id filter
    let query = `
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
        AND (p.forward_to = ? OR LOWER(TRIM(p.work_status)) = 'forwarded')
    `;
    
    const queryParams: (string | number)[] = [userIdNum];
    
    query += ` ORDER BY p.created_at DESC`;
    
    const [proposalsResult] = await pool.query<RowDataPacket[]>(query, queryParams);

    const proposals = (Array.isArray(proposalsResult) ? proposalsResult : []) as Proposal[];
    
    // Show proposals filtered by: forward_to = user_id OR work_status = 'forwarded'
    const filterInfo = `(forward_to = ${userIdNum} OR work_status = 'forwarded')`;
    
    console.log(`Section 3(2) Dashboard - Total proposals fetched (filtered by ${filterInfo}):`, proposals.length);
    console.log(`Filtered by ${filterInfo} - showing only matching proposals`);
    
    // Helper function to normalize work_status for comparison
    const normalizeWorkStatus = (status: string | number | null | undefined): string => {
      if (status === null || status === undefined) return '';
      const statusStr = String(status).trim().toLowerCase();
      return statusStr;
    };
    
    // Log sample proposals with work_status details for debugging
    if (proposals.length > 0) {
      console.log('Sample proposals with work_status:', proposals.slice(0, 5).map(p => ({
        proposal_id: p.proposal_id,
        work_status: p.work_status,
        work_status_type: typeof p.work_status,
        work_status_normalized: normalizeWorkStatus(p.work_status),
        taluka_id: p.taluka_id,
        taluka_name: p.taluka_name
      })));
      
      // Log unique work_status values from database (raw and normalized)
      const uniqueStatusesRaw = [...new Set(proposals.map(p => String(p.work_status).trim()))];
      const uniqueStatusesNormalized = [...new Set(proposals.map(p => normalizeWorkStatus(p.work_status)))];
      console.log('Unique work_status values in database (raw):', uniqueStatusesRaw);
      console.log('Unique work_status values in database (normalized):', uniqueStatusesNormalized);
    }

    // Calculate statistics with detailed logging
    // pendingForAcceptAtRFODFO: work_status = 0 (or '0' as string)
    const pendingForAcceptList = proposals.filter(p => {
      const status = p.work_status;
      return (typeof status === 'number' && status === 0) || 
             (typeof status === 'string' && status.trim() === '0') ||
             normalizeWorkStatus(status) === '0';
    });

    // rejectedByRFODFO: work_status = 'rejected'
    const rejectedList = proposals.filter(p => {
      const status = normalizeWorkStatus(p.work_status);
      return status === 'rejected';
    });

    // pendingAtRFODFO: work_status = 'under review'
    const pendingAtRFODFOList = proposals.filter(p => {
      const status = normalizeWorkStatus(p.work_status);
      return status === 'under review';
    });

    // pendingAtPO: work_status = 'pending at po'
    const pendingAtPOList = proposals.filter(p => {
      const status = normalizeWorkStatus(p.work_status);
      return status === 'pending at po';
    });

    // pendingAtDLC: work_status = 'pending at dlc'
    const pendingAtDLCList = proposals.filter(p => {
      const status = normalizeWorkStatus(p.work_status);
      return status === 'pending at dlc';
    });

    // dlcCompleted: work_status = 'forwarded' (or legacy statuses)
    const dlcCompletedList = proposals.filter(p => {
      const status = normalizeWorkStatus(p.work_status);
      return status === 'forwarded' ||
             status === 'completed' ||
             status === 'complete' ||
             status === 'approved' ||
             status === 'sanctioned';
    });

    // Log counting details for debugging
    console.log(`Section 3(2) Dashboard Counting Details:`, {
      totalProposals: proposals.length,
      pendingForAccept: {
        count: pendingForAcceptList.length,
        condition: "work_status = 0 or '0'",
        sample: pendingForAcceptList.slice(0, 3).map(p => ({
          proposal_id: p.proposal_id,
          work_status: p.work_status,
          work_status_type: typeof p.work_status,
          work_status_normalized: normalizeWorkStatus(p.work_status)
        }))
      },
      rejected: {
        count: rejectedList.length,
        condition: "work_status = 'rejected'",
        sample: rejectedList.slice(0, 3).map(p => ({
          proposal_id: p.proposal_id,
          work_status: p.work_status,
          work_status_normalized: normalizeWorkStatus(p.work_status)
        }))
      },
      pendingAtRFODFO: {
        count: pendingAtRFODFOList.length,
        condition: "work_status = 'under review'",
        sample: pendingAtRFODFOList.slice(0, 3).map(p => ({
          proposal_id: p.proposal_id,
          work_status: p.work_status,
          work_status_normalized: normalizeWorkStatus(p.work_status)
        }))
      },
      pendingAtPO: {
        count: pendingAtPOList.length,
        condition: "work_status = 'pending at po'",
        sample: pendingAtPOList.slice(0, 3).map(p => ({
          proposal_id: p.proposal_id,
          work_status: p.work_status,
          work_status_normalized: normalizeWorkStatus(p.work_status)
        }))
      },
      pendingAtDLC: {
        count: pendingAtDLCList.length,
        condition: "work_status = 'pending at dlc'",
        sample: pendingAtDLCList.slice(0, 3).map(p => ({
          proposal_id: p.proposal_id,
          work_status: p.work_status,
          work_status_normalized: normalizeWorkStatus(p.work_status)
        }))
      },
      dlcCompleted: {
        count: dlcCompletedList.length,
        condition: "work_status = 'forwarded' or legacy statuses",
        sample: dlcCompletedList.slice(0, 3).map(p => ({
          proposal_id: p.proposal_id,
          work_status: p.work_status,
          work_status_normalized: normalizeWorkStatus(p.work_status)
        }))
      }
    });

    // Calculate statistics
    const stats: Category48Stats = {
      totalProposals: proposals.length,
      pendingForAcceptAtRFODFO: pendingForAcceptList.length,
      rejectedByRFODFO: rejectedList.length,
      pendingAtRFODFO: pendingAtRFODFOList.length,
      pendingAtPO: pendingAtPOList.length,
      pendingAtDLC: pendingAtDLCList.length,
      dlcCompleted: dlcCompletedList.length
    };

    // Get action required proposals (pending for more than 1 month)
    const actionRequired = proposals.filter(p => {
      let daysPending = 0;
      let monthsPending = 0;
      
      if (p.days_pending !== null && p.days_pending !== undefined) {
        daysPending = typeof p.days_pending === 'string' 
          ? parseInt(p.days_pending, 10) 
          : Number(p.days_pending);
        if (isNaN(daysPending)) daysPending = 0;
      }
      
      if (p.months_pending !== null && p.months_pending !== undefined) {
        monthsPending = typeof p.months_pending === 'string'
          ? parseInt(p.months_pending, 10)
          : Number(p.months_pending);
        if (isNaN(monthsPending)) monthsPending = 0;
      }
      
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
      
      return daysPending >= 30 || monthsPending >= 1;
    });

    // If no proposals are 30+ days old, show all pending/under review proposals
    let finalActionRequired = actionRequired;
    if (actionRequired.length === 0) {
      finalActionRequired = proposals.filter(p => {
        const status = typeof p.work_status === 'string' ? p.work_status.toLowerCase() : '';
        return status.includes('pending') || 
               status.includes('under review') || 
               status === '' || 
               !p.work_status ||
               status.includes('correction');
      });
      
      if (finalActionRequired.length === 0) {
        finalActionRequired = proposals;
      }
    }

    // Log final stats for debugging
    console.log(`Section 3(2) Dashboard Final Stats:`, {
      totalProposals: stats.totalProposals,
      pendingForAcceptAtRFODFO: stats.pendingForAcceptAtRFODFO,
      rejectedByRFODFO: stats.rejectedByRFODFO,
      pendingAtRFODFO: stats.pendingAtRFODFO,
      pendingAtPO: stats.pendingAtPO,
      pendingAtDLC: stats.pendingAtDLC,
      dlcCompleted: stats.dlcCompleted,
      actionRequiredCount: finalActionRequired.length
    });

    return NextResponse.json({
      success: true,
      proposals,
      stats,
      actionRequired: finalActionRequired
    });
  } catch (error) {
    console.error('Error fetching Category 4/8 dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

