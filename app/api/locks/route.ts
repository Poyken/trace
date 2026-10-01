import { NextRequest, NextResponse } from 'next/server';
import { DbLocksResult } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const profile = searchParams.get('profile') || 'SmartFactoryV2';

  const relayUrl = process.env.MES_RELAY_URL;
  if (relayUrl) {
    try {
      const res = await fetch(`${relayUrl}/api/locks?profile=${encodeURIComponent(profile)}`, {
        headers: { 'Authorization': `Bearer ${process.env.MES_RELAY_SECRET || ''}` },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback
    }
  }

  // Realistic mock response when relay is not connected
  const mockResult: DbLocksResult = {
    profile,
    totalConnections: 42,
    activeLocksCount: 0,
    blockingChainsCount: 0,
    locks: [
      {
        spid: 84,
        blockedBySpid: 0,
        waitTimeSeconds: 0,
        waitType: 'MISCELLANEOUS',
        dbName: profile,
        hostName: 'HY-MES-AP01',
        programName: 'NAIS MES WinForm (B530)',
        loginName: 'sa_sfv2',
        sqlText: "SELECT LotID, RouteOrder, InTime, OutTime, GoodQty FROM STB_ProdRouteHist WITH (NOLOCK) WHERE LotID = 'VVQR232R710618'",
        status: 'NORMAL'
      },
      {
        spid: 92,
        blockedBySpid: 0,
        waitTimeSeconds: 0,
        waitType: 'ASYNC_NETWORK_IO',
        dbName: 'VINATECH_POP',
        hostName: 'KIOSK-WIND-03',
        programName: 'Chrome / Kiosk POP Web',
        loginName: 'sa_pop',
        sqlText: "SELECT TOP 1 * FROM VINA_EQUIPMENT_MAPPING WITH (NOLOCK) WHERE EQUIPMENT_ID = 'VVMHY130'",
        status: 'NORMAL'
      }
    ],
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(mockResult);
}
