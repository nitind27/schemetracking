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

    // Base query: active users + category name
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        u.user_id,
        u.name,
        u.user_category_id,
        uc.category_name AS user_category_name
      FROM users u
      LEFT JOIN user_category uc
        ON u.user_category_id = uc.user_category_id
      WHERE u.status = 'Active'
      `
    );

    let users = rows as Array<{
      user_id: number | string;
      name: string;
      user_category_id: number | null;
      user_category_name: string | null;
    }>;

    // Filtering rules (can be extended later):
    // - If current user is category 24, only show DLC (35)
    if (categoryId === '24') {
      users = users.filter(u => u.user_category_id === 35);
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching forward list users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}


