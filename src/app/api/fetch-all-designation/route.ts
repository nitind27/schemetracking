import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = ['अध्यक्ष', 'सचिव', 'खजिनदार', 'सदस्य'];
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching designations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch designations' },
      { status: 500 }
    );
  }
}

