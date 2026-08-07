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
  pendingForAcceptAtRFODFO: number; // Pending for Accept at RFO/DFO
  rejectedByRFODFO: number; // Rejected by RFO/DFO
  pendingAtRFODFO: number; // Pending at RFO/DFO (Under Review)
  pendingAtDLC: number; // Pending at DLC
  dlcCompleted: number; // DLC Completed
}

// GET - Fetch DC Dashboard data
export async function GET() {
    const __killed = await assertApiAlive('/api/dc-dashboard');
    if (__killed) return __killed;
  try {
    // Fetch all proposals with additional details
    // Join with users table to get user_category_id and verify with user_category table
    const [proposalsResult] = await pool.query<RowDataPacket[]>(`
      SELECT 
        p.*,
        pc.name AS proposal_category_name,
        u.name AS user_name,
        u.user_id,
        u.user_category_id,
        uc.user_category_id AS verified_user_category_id,
        uc.category_name AS user_category_name,
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
      ORDER BY p.created_at DESC
    `);

    const proposals = (Array.isArray(proposalsResult) ? proposalsResult : []) as Proposal[];
    
    // Helper function to normalize work_status for comparison
    // work_status is varchar(50) in database, so it's always a string
    // Must check exact database values: 'pending', 'under review', 'correction needed', 'pending at dlc', 'rejected', 'forwarded'
    const normalizeWorkStatus = (status: string | number | null | undefined): string => {
      if (status === null || status === undefined) return '';
      // Convert to string, trim whitespace, and convert to lowercase
      // Handle both string and number types from database
      const statusStr = String(status).trim().toLowerCase();
      return statusStr;
    };

    // Helper function to normalize user_category_id
    // const normalizeUserCategoryId = (categoryId: string | number | null | undefined): number | null => {
    //   if (categoryId === null || categoryId === undefined) return null;
    //   if (typeof categoryId === 'number') return categoryId;
    //   if (typeof categoryId === 'string') {
    //     const parsed = parseInt(categoryId, 10);
    //     return isNaN(parsed) ? null : parsed;
    //   }
    //   return null;
    // };
    
    console.log('DC Dashboard - Proposals fetched:', proposals.length);
    if (proposals.length > 0) {
      // Log sample proposals with work_status details
      console.log('Sample proposals with work_status:', proposals.slice(0, 5).map(p => ({
        proposal_id: p.proposal_id,
        work_status: p.work_status,
        work_status_type: typeof p.work_status,
        work_status_normalized: normalizeWorkStatus(p.work_status),
        user_category_id: p.user_category_id,
        user_category_id_type: typeof p.user_category_id,
        user_category_name: p.user_category_name
      })));
      
      // Log unique work_status values from database (raw and normalized)
      const uniqueStatusesRaw = [...new Set(proposals.map(p => String(p.work_status).trim()))];
      const uniqueStatusesNormalized = [...new Set(proposals.map(p => normalizeWorkStatus(p.work_status)))];
      console.log('Unique work_status values in database (raw):', uniqueStatusesRaw);
      console.log('Unique work_status values in database (normalized):', uniqueStatusesNormalized);
    }

    // Calculate statistics based on user_category_id
    // RFO/DFO category_id = 24
    // DLC category_id = 35
    // Using exact database status values: 'pending', 'under review', 'correction needed', 'pending at dlc', 'rejected', 'forwarded'

    // Calculate stats with detailed logging
    // IMPORTANT: work_status is varchar(50) in database - check exact string values
    // Valid statuses: 'pending', 'under review', 'correction needed', 'pending at dlc', 'rejected', 'forwarded'
    
    // pendingForAcceptAtRFODFO: work_status = 0 (or '0' as string)
    const pendingForAcceptList = proposals.filter(p => {
      const status = p.work_status;
      // Check for 0 (number) or '0' (string) - work_status is varchar(50) so could be either
      return (typeof status === 'number' && status === 0) || 
             (typeof status === 'string' && status.trim() === '0') ||
             normalizeWorkStatus(status) === '0';
    });

    // rejectedByRFODFO: work_status = 'rejected'
    const rejectedList = proposals.filter(p => {
      const status = normalizeWorkStatus(p.work_status);
      // Check exact match with 'rejected' (case-insensitive, trimmed)
      return status === 'rejected';
    });

    // pendingAtRFODFO: work_status = 'under review'
    const pendingAtRFODFOList = proposals.filter(p => {
      const status = normalizeWorkStatus(p.work_status);
      // Check exact match with 'under review' (case-insensitive, trimmed)
      return status === 'under review';
    });

    console.log('DC Dashboard Counting Details:', {
      totalProposals: proposals.length,
      pendingForAccept: {
        count: pendingForAcceptList.length,
        condition: "work_status = 0 or '0'",
        sample: pendingForAcceptList.slice(0, 5).map(p => ({
          proposal_id: p.proposal_id,
          work_status: p.work_status,
          work_status_type: typeof p.work_status,
          work_status_normalized: normalizeWorkStatus(p.work_status),
          user_id: p.user_id,
          user_category_id: p.user_category_id,
          user_category_name: p.user_category_name
        }))
      },
      rejected: {
        count: rejectedList.length,
        condition: "work_status = 'rejected'",
        sample: rejectedList.slice(0, 5).map(p => ({
          proposal_id: p.proposal_id,
          work_status: p.work_status,
          work_status_normalized: normalizeWorkStatus(p.work_status)
        }))
      },
      pendingAtRFODFO: {
        count: pendingAtRFODFOList.length,
        condition: "work_status = 'under review'",
        sample: pendingAtRFODFOList.slice(0, 5).map(p => ({
          proposal_id: p.proposal_id,
          work_status: p.work_status,
          work_status_normalized: normalizeWorkStatus(p.work_status)
        }))
      },
      pendingAtDLC: {
        count: proposals.filter(p => normalizeWorkStatus(p.work_status) === 'pending at dlc').length,
        condition: "work_status = 'pending at dlc'",
        sample: proposals.filter(p => normalizeWorkStatus(p.work_status) === 'pending at dlc').slice(0, 5).map(p => ({
          proposal_id: p.proposal_id,
          work_status: p.work_status,
          work_status_normalized: normalizeWorkStatus(p.work_status)
        }))
      }
    });

    const stats: DCStats = {
      totalProposals: proposals.length,
      pendingForAcceptAtRFODFO: pendingForAcceptList.length,
      rejectedByRFODFO: rejectedList.length,
      pendingAtRFODFO: pendingAtRFODFOList.length,
      // Pending at DLC: status = 'pending at dlc' (exact match, case-insensitive)
      pendingAtDLC: proposals.filter(p => {
        const status = normalizeWorkStatus(p.work_status);
        return status === 'pending at dlc';
      }).length,
      // DLC Completed: status = 'forwarded' (when forwarded from DLC, it means completed/sanctioned)
      // Also check for legacy statuses: completed, complete, approved, sanctioned
      dlcCompleted: proposals.filter(p => {
        const status = normalizeWorkStatus(p.work_status);
        return status === 'forwarded' ||
               status === 'completed' ||
               status === 'complete' ||
               status === 'approved' ||
               status === 'sanctioned';
      }).length
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
        const status = typeof p.work_status === 'string' ? p.work_status.toLowerCase() : '';
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

    // Log final stats for debugging
    console.log('DC Dashboard Stats:', {
      totalProposals: stats.totalProposals,
      pendingForAcceptAtRFODFO: stats.pendingForAcceptAtRFODFO,
      rejectedByRFODFO: stats.rejectedByRFODFO,
      pendingAtRFODFO: stats.pendingAtRFODFO,
      pendingAtDLC: stats.pendingAtDLC,
      dlcCompleted: stats.dlcCompleted
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