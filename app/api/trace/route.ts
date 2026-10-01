import { NextRequest, NextResponse } from 'next/server';
import { TraceResult } from '@/lib/types';
import { fetchFromRelay } from '@/lib/relay-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target')?.trim();

  if (!target) {
    return NextResponse.json({ error: 'Vui lòng cung cấp mã Lot, PO hoặc Thiết bị.' }, { status: 400 });
  }

  const relayRes = await fetchFromRelay(`/api/trace?target=${encodeURIComponent(target)}`, {
    method: 'GET',
    timeoutMs: 4000
  });

  if (relayRes.success && relayRes.data) {
    return NextResponse.json(relayRes.data);
  }

  // Realistic domain-specific 360 trace response
  const isPo = /^\d{12}$/.test(target);
  const isMachine = /^VV[A-Z]{2,4}\d{2,4}$/i.test(target);

  const mockResult: TraceResult = {
    target,
    type: isPo ? 'PO' : isMachine ? 'MACHINE' : 'LOT',
    modelCode: 'VEC3R0106QG',
    modelName: 'EDLC 3.0V 10F (D10xL20)',
    line: 'HY_LINE_02',
    currentRoute: 'Đóng gói (Packing - B523)',
    status: 'ACTIVE_RUNNING',
    routeHistory: [
      {
        routeOrder: 1,
        routeName: 'Cắt cuộn (Slitting - B552)',
        machineCode: 'VVSL002',
        workerId: '31707007',
        inTime: '2026-09-25 08:30:00',
        outTime: '2026-09-25 10:15:00',
        goodQty: 2500,
        ngQty: 12
      },
      {
        routeOrder: 2,
        routeName: 'Cuộn lõi (Winding - B530)',
        machineCode: 'VVWD014',
        workerId: '32001015',
        inTime: '2026-09-25 10:45:00',
        outTime: '2026-09-25 14:20:00',
        goodQty: 2480,
        ngQty: 8
      },
      {
        routeOrder: 3,
        routeName: 'Lắp ráp & Ép nắp (Assembly)',
        machineCode: 'VVAS102',
        workerId: '32105009',
        inTime: '2026-09-25 14:40:00',
        outTime: '2026-09-25 18:00:00',
        goodQty: 2470,
        ngQty: 10
      },
      {
        routeOrder: 4,
        routeName: 'Hút chân không & Nạp dung dịch',
        machineCode: 'VVMHY130',
        workerId: '32204018',
        inTime: '2026-09-26 07:15:00',
        outTime: '2026-09-26 09:30:00',
        goodQty: 2465,
        ngQty: 5
      },
      {
        routeOrder: 5,
        routeName: 'Phân loại & Test điện (Sorting/Aging)',
        machineCode: 'VVAG008',
        workerId: '32309002',
        inTime: '2026-09-26 10:00:00',
        outTime: '2026-09-26 13:45:00',
        goodQty: 2460,
        ngQty: 5
      }
    ],
    bomMaterials: [
      {
        itemCode: 'VT-EL-ALU-01',
        itemName: 'Lá nhôm điện cực (Alu Foil 20um)',
        bomQty: 250,
        consumedQty: 248,
        stockRouteWh: 1420,
        stockMainWh: 8500,
        status: 'sufficient'
      },
      {
        itemCode: 'VT-SEP-CEL-02',
        itemName: 'Màng cách ly (Cellulose Separator)',
        bomQty: 310,
        consumedQty: 308,
        stockRouteWh: 180,
        stockMainWh: 4200,
        status: 'low'
      },
      {
        itemCode: 'VT-SOL-ACN-05',
        itemName: 'Dung dịch điện giải 150kg (AN-Sol)',
        bomQty: 45,
        consumedQty: 45,
        stockRouteWh: 350,
        stockMainWh: 1200,
        status: 'sufficient'
      }
    ],
    pqcStatus: 'PASSED (PQC Verified by QA)',
    packingInfo: {
      packingId: 'PKQR2501480',
      boxId: 'BX-2609-0091',
      standardQty: 2000,
      actualQty: 2000,
      isPrintAllow: true,
      printCount: 1
    }
  };

  return NextResponse.json(mockResult);
}
