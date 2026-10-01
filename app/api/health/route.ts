import { NextResponse } from 'next/server';
import { MOCK_HEALTH_DATA } from '@/lib/knowledge';
import { fetchFromRelay } from '@/lib/relay-client';

export async function GET() {
  const relayRes = await fetchFromRelay('/api/health', {
    method: 'GET',
    timeoutMs: 10000
  });

  if (relayRes.success && relayRes.data) {
    return NextResponse.json(relayRes.data);
  }

  return NextResponse.json({
    ...MOCK_HEALTH_DATA,
    timestamp: new Date().toISOString()
  });
}
