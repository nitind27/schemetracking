// app/api/users/route.ts
import { NextResponse } from 'next/server';
import { assertApiAlive } from '@/lib/assertApiAlive';
import pool from '@/lib/db';


// Type guard to check if error has code and message properties
function isDatabaseError(error: unknown): error is { code: string; message: string } {
  const err = error as Record<string, unknown>;
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in err &&
    'message' in err &&
    typeof err.code === 'string' &&
    typeof err.message === 'string'
  );
}

// Retry function for database operations
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;

      // If it's a connection error, retry
      if (isDatabaseError(error) && (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED')) {
        if (attempt < maxRetries) {
          console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
          continue;
        }
      }

      // For other errors or if we've exhausted retries, throw
      throw error;
    }
  }

  throw lastError;
}

export async function GET() {
    const __killed = await assertApiAlive('/api/users');
    if (__killed) return __killed;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let connection: any;
  try {
    const result = await executeWithRetry(async () => {
      connection = await pool.getConnection();
      const [rows] = await connection.query(`
        SELECT
          users.*,
          user_category.category_name AS user_category_name,
          taluka.name AS taluka_name,
          village.name AS village_name,
          grampanchyat.gpname AS grampanchayat_name
        FROM users
        LEFT JOIN user_category
          ON users.user_category_id = user_category.user_category_id
        LEFT JOIN taluka
          ON users.taluka_id = taluka.taluka_id
        LEFT JOIN village
          ON users.village_id = village.village_id
        LEFT JOIN grampanchyat
          ON users.gp_id = grampanchyat.gp_id
        WHERE users.status = 'Active'
      `);

      return rows;
    });

    // Type-safe mapping
    const safeUsers = result.map(({ ...user }) => user);

    return NextResponse.json(safeUsers);
  } catch (error: unknown) {
    console.error('Database query failed after retries:', error);

    // Provide more specific error messages
    let errorMessage = 'Failed to fetch users';
    if (isDatabaseError(error)) {
      if (error.code === 'ECONNRESET') {
        errorMessage = 'Database connection was reset. Please try again.';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Database server not found. Please check database configuration.';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Database connection refused. Please check if database server is running.';
      }
    }

    return NextResponse.json(
      { message: errorMessage, code: isDatabaseError(error) ? error.code : 'UNKNOWN_ERROR' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.warn('Error releasing database connection:', releaseError);
      }
    }
  }
}
