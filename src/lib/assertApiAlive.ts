import { NextResponse } from 'next/server';
import { isApiPathDisabled } from '@/lib/apiKillSwitch';

export async function assertApiAlive(apiPath: string): Promise<NextResponse | null> {
  if (!(await isApiPathDisabled(apiPath))) {
    return null;
  }

  return NextResponse.json(
    {
      success: false,
      message: 'This API is temporarily disabled',
      code: 'API_KILLED',
      path: apiPath,
    },
    { status: 503 }
  );
}
