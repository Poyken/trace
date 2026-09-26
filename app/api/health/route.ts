import { NextResponse } from 'next/server';
import { MOCK_HEALTH_DATA } from '@/lib/knowledge';

export async function GET() {
  const relayUrl = process.env.MES_RELAY_URL;
  if (relayUrl) {
    try {
      const res = await fetch(`${relayUrl}/api/health`, {
        headers: { 'Authorization': `Bearer ${process.env.MES_RELAY_SECRET || ''}` },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback if relay unreachable
    }
  }

  return NextResponse.json({
    ...MOCK_HEALTH_DATA,
    timestamp: new Date().toISOString()
  });
}
