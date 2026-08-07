import { NextRequest, NextResponse } from 'next/server';
import {
  disableKillSwitch,
  enableRandomKillSwitch,
  isApiPathDisabled,
  KILLABLE_APIS,
  readKillSwitchState,
} from '@/lib/apiKillSwitch';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const checkPath = request.nextUrl.searchParams.get('check');
    const state = await readKillSwitchState();

    if (checkPath) {
      return NextResponse.json({
        blocked: await isApiPathDisabled(checkPath, state),
        active: state.active,
        path: checkPath,
      });
    }

    return NextResponse.json({
      active: state.active,
      disabledApis: state.disabledApis,
      updatedAt: state.updatedAt,
      pool: KILLABLE_APIS,
      poolSize: KILLABLE_APIS.length,
      storage: 'database',
    });
  } catch (error) {
    console.error('Kill switch GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to read kill switch' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      count?: number;
    };

    const action = body.action;

    if (action === 'enable') {
      const count = typeof body.count === 'number' && body.count > 0 ? body.count : 6;
      const state = await enableRandomKillSwitch(count);
      return NextResponse.json({
        success: true,
        message: `${state.disabledApis.length} random APIs disabled (saved in database)`,
        ...state,
        pool: KILLABLE_APIS,
        storage: 'database',
      });
    }

    if (action === 'disable') {
      const state = await disableKillSwitch();
      return NextResponse.json({
        success: true,
        message: 'All APIs re-enabled (saved in database)',
        ...state,
        pool: KILLABLE_APIS,
        storage: 'database',
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action. Use "enable" or "disable".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Kill switch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update kill switch' },
      { status: 500 }
    );
  }
}
