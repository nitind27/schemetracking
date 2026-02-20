import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type {  ResultSetHeader } from 'mysql2';

export async function POST(request: Request) {
  let connection;
  try {
    const formData = await request.formData();
    const user_id = formData.get('user_id') as string;
    const email = formData.get('email') as string;

    if (!user_id || !email) {
      return NextResponse.json(
        {
          error: true,
          code: 400,
          message: 'All fields are required',
        },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    
    const query = `UPDATE users SET 
      email = ?,
      updated_at = NOW()
      WHERE user_id = ?`;

    const [result] = await connection.execute<ResultSetHeader>(query, [email, user_id]);

    if (result.affectedRows > 0) {
      return NextResponse.json({
        error: false,
        code: 200,
        message: 'Email submitted successfully',
      });
    } else {
      return NextResponse.json(
        {
          error: true,
          code: 404,
          message: 'User not found',
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error updating user email:', error);
    return NextResponse.json(
      {
        error: true,
        code: 500,
        message: error instanceof Error ? error.message : 'Update failed',
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

