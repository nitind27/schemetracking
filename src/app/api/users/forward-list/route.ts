import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

// Returns forwardable users from `users` table (Active only).
// Optional query param:
// - category_id: current user's category id (used for filtering)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('category_id');
    const dlcOnly = searchParams.get('dlc_only'); // New parameter to fetch only DLC users

    // Check if we need to filter for specific categories (4 and 8)
    const filterCategories = searchParams.get('filter_categories');
    
    // Base query: active users + category name
    let query = `
      SELECT
        u.user_id,
        u.name,
        u.user_category_id,
        uc.category_name AS user_category_name
      FROM users u
      LEFT JOIN user_category uc
        ON u.user_category_id = uc.user_category_id
      WHERE u.status = 'Active'
    `;
    
    // If dlc_only is requested, directly filter for category_id 35 (DLC)
    if (dlcOnly === 'true' || dlcOnly === '1') {
      query += ` AND u.user_category_id = 35`;
    }
    // If filter_categories is requested, filter for category_id 4 and 8
    else if (filterCategories === 'true' || filterCategories === '4,8') {
      query += ` AND u.user_category_id IN (4, 8)`;
    }
    
    const [rows] = await pool.query<RowDataPacket[]>(query);

    let users = rows as Array<{
      user_id: number | string;
      name: string;
      user_category_id: number | null;
      user_category_name: string | null;
    }>;

    // Log users with category 4 and 8 for debugging
    const category4And8Users = users.filter(u => u.user_category_id === 4 || u.user_category_id === 8);
    console.log('Users with category_id 4 and 8:', {
      total: category4And8Users.length,
      users: category4And8Users.map(u => ({
        user_id: u.user_id,
        name: u.name,
        user_category_id: u.user_category_id,
        category_name: u.user_category_name
      }))
    });

    // Log DLC users for debugging
    const dlcUsers = users.filter(u => u.user_category_id === 35);
    console.log('DLC users (category_id 35):', {
      total: dlcUsers.length,
      users: dlcUsers.map(u => ({
        user_id: u.user_id,
        name: u.name,
        user_category_id: u.user_category_id,
        category_name: u.user_category_name
      }))
    });

    // Filtering rules (can be extended later):
    // - If current user is category 24, only show DLC (35)
    if (categoryId === '24' && filterCategories !== 'true' && filterCategories !== '4,8' && dlcOnly !== 'true' && dlcOnly !== '1') {
      users = users.filter(u => u.user_category_id === 35);
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching forward list users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}


