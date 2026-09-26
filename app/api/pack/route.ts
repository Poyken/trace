import { NextRequest, NextResponse } from 'next/server';
import { PackInspectionResult } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target')?.trim();

  if (!target) {
    return NextResponse.json({ error: 'Vui lòng cung cấp mã Lot hoặc PackingID.' }, { status: 400 });
  }

  const relayUrl = process.env.MES_RELAY_URL;
  if (relayUrl) {
    try {
      const res = await fetch(`${relayUrl}/api/pack?target=${encodeURIComponent(target)}`, {
        headers: { 'Authorization': `Bearer ${process.env.MES_RELAY_SECRET || ''}` }
      });
      if (res.ok) {
        return NextResponse.json(await res.json());
      }
    } catch {
      // Fallback
    }
  }

  const isPackingId = target.toUpperCase().startsWith('PK');
  const mockResult: PackInspectionResult = {
    target,
    lotId: isPackingId ? 'VVQR232R710618' : target,
    packingId: isPackingId ? target : 'PKQR2501480',
    boxId: 'BX-2609-0091',
    itemCode: 'VEC3R0106QG',
    itemName: 'EDLC 3.0V 10F (D10xL20)',
    standardQty: 2000,
    actualQty: 2000,
    printCount: 1,
    isPrintAllow: true,
    saveTime: '2026-09-26 14:15:30',
    status: 'COMPLETED'
  };

  return NextResponse.json(mockResult);
}
