import { NextRequest, NextResponse } from 'next/server';
import { PackInspectionResult } from '@/lib/types';
import { fetchFromRelay } from '@/lib/relay-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target')?.trim();

  if (!target) {
    return NextResponse.json({ error: 'Vui lòng cung cấp mã Lot hoặc PackingID.' }, { status: 400 });
  }

  const relayRes = await fetchFromRelay(`/api/pack?target=${encodeURIComponent(target)}`, {
    method: 'GET',
    timeoutMs: 15000
  });

  if (relayRes.success && relayRes.data) {
    const relayData = relayRes.data;
    if (relayData.stdout) {
          const stdout = relayData.stdout;
          const lotMatch = stdout.match(/Barcode\s+([A-Za-z0-9_-]+)/i) || stdout.match(/LotNo\s*:\s*([A-Za-z0-9_-]+)/i);
          const pkMatch = stdout.match(/PackingID\s+([A-Za-z0-9_-]+)/i) || stdout.match(/PackingID\s*hien\s*tai:\s*([A-Za-z0-9_-]+)/i);
          const matMatch = stdout.match(/MaterialCode\s+([A-Za-z0-9_-]+)/i);
          const nameMatch = stdout.match(/MaterialName[^\n]*\n[- ]+\n[A-Za-z0-9_-]+\s+([^\n]+)/);
          const qtyMatch = stdout.match(/CurrentQty\s+([0-9.]+)/i) || stdout.match(/TOTAL_PROD_QTY\s+([0-9.]+)/i);

          return NextResponse.json({
            target,
            lotId: lotMatch ? lotMatch[1] : target,
            packingId: pkMatch ? pkMatch[1] : (target.toUpperCase().startsWith('PK') ? target : 'Chờ đóng thùng'),
            boxId: 'POP-BOX',
            itemCode: matMatch ? matMatch[1] : 'N/A',
            itemName: nameMatch ? nameMatch[1].trim() : 'Sản phẩm hoàn thiện',
            standardQty: qtyMatch ? Math.round(parseFloat(qtyMatch[1])) : 0,
            actualQty: qtyMatch ? Math.round(parseFloat(qtyMatch[1])) : 0,
            printCount: 1,
            isPrintAllow: true,
            saveTime: new Date().toLocaleString('vi-VN'),
            status: 'COMPLETED'
          });
        }
      }

  const isPackingId = target.toUpperCase().startsWith('PK');
  const fallbackResult: PackInspectionResult = {
    target,
    lotId: isPackingId ? 'Chờ xác nhận Lot' : target,
    packingId: isPackingId ? target : 'Chưa đóng thùng',
    boxId: 'N/A',
    itemCode: 'N/A',
    itemName: 'Dữ liệu đóng gói chưa ghi nhận',
    standardQty: 0,
    actualQty: 0,
    printCount: 0,
    isPrintAllow: false,
    saveTime: new Date().toLocaleString('vi-VN'),
    status: 'EMPTY'
  };

  return NextResponse.json(fallbackResult);
}

