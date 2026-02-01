import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

interface UserRow {
  user_id: number;
  name: string;
  user_category_id: number;
  category_name: string;
  taluka_id: number | null;
  village_id: number | null;
}

export async function GET(req: NextRequest) {
  try {
    // Get auth token from cookie
    const authToken = req.cookies.get('auth_token');
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'No auth token found' },
        { status: 401 }
      );
    }

    const userId = authToken.value;

    try {
      // Fetch user data from database using the existing pool
      const [rows] = await pool.execute(
        `SELECT u.user_id, u.name, u.user_category_id, uc.category_name, u.taluka_id, u.village_id 
         FROM users u 
         LEFT JOIN user_category uc ON u.user_category_id = uc.user_category_id 
         WHERE u.user_id = ?`,
        [userId]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const user = rows[0] as UserRow;

      return NextResponse.json({
        user: {
          name: user.name,
          user_id: user.user_id,
          category_name: user.category_name,
          category_id: user.user_category_id,
          taluka_id: user.taluka_id,
          village_id: user.village_id
        }
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Auth validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}