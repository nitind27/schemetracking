import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// GET DLC Dashboard data - only proposals pending at DLC
export async function GET() {
  try {
    console.log('DLC Dashboard API called');
    
    // Get proposals that are pending at DLC (forwarded by RFO/DFO)
    const [proposalsRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
    proposal.*,
    taluka.name AS taluka_name,
    grampanchyat.gpname AS gp_name,
    village.marathi_name AS village_name,
    users.name AS user_name,
    users.user_category_id AS user_category_id,
    proposal_category.name AS proposal_category_name,
    DATEDIFF(NOW(), proposal.updated_at) AS days_pending,
    FLOOR(DATEDIFF(NOW(), proposal.updated_at) / 30) AS months_pending
FROM proposal
LEFT JOIN taluka 
    ON proposal.taluka_id = taluka.taluka_id
LEFT JOIN grampanchyat 
    ON proposal.gp_id = grampanchyat.gp_id
LEFT JOIN village 
    ON proposal.village_id = village.village_id
LEFT JOIN users 
    ON proposal.user_id = users.user_id
LEFT JOIN proposal_category 
    ON proposal.proposal_category_id = proposal_category.proposal_category_id
WHERE proposal.status = 'Active'
  AND LOWER(proposal.work_status) IN (
      'pending',
      'under review',
      'correction needed',
      'pending at dlc',
      'rejected',
      'forwarded'
  )
ORDER BY proposal.updated_at ASC;
`
    );

    console.log('DLC Dashboard proposals found:', proposalsRows.length);
    console.log('Sample proposal statuses:', proposalsRows.slice(0, 3).map(p => ({ 
      id: p.proposal_id, 
      status: p.work_status, 
      forward_to: p.forward_to 
    })));

    return NextResponse.json({
      proposals: proposalsRows,
    });
  } catch (error) {
    console.error('Error fetching DLC dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DLC dashboard data' },
      { status: 500 }
    );
  }
}