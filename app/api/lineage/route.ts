import { NextRequest, NextResponse } from 'next/server';
import { LineageResult } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target') || 'VVQR232R710618';

  const relayUrl = process.env.MES_RELAY_URL;
  if (relayUrl) {
    try {
      const res = await fetch(`${relayUrl}/api/lineage?target=${encodeURIComponent(target)}`, {
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

  // Realistic Lineage 360° Result
  const isPo = /^\d{12}$/.test(target);
  const mockLineage: LineageResult = {
    target,
    poCode: isPo ? target : '260829000018',
    modelCode: 'VEC3R0106QG',
    modelName: 'EDLC 3.0V 10F Radial',
    stages: [
      {
        stageId: 'PO_GW',
        title: 'Trụ Cột 1: Kế Hoạch PO & Phê Duyệt Groupware',
        status: 'COMPLETED',
        description: 'Đơn hàng sản xuất PO #260829000018 đã được duyệt trên Bizbox Groupware & đồng bộ sang ERP NEOE.',
        details: {
          'Mã PO Master': isPo ? target : '260829000018',
          'Mã Tờ Trình GW': 'GW-2026-09-0842',
          'Nhà Máy': 'Hưng Yên (HY)',
          'Sản Lượng Kế Hoạch': '50,000 EA',
          'Trạng Thái Duyệt': 'ĐÃ PHÊ DUYỆT (Trưởng phòng & GĐ)',
          'Đồng Bộ ERP NEOE': 'Hoàn tất (SO_NO: SO2609012)'
        },
        timestamp: '2026-09-24 08:30:00'
      },
      {
        stageId: 'WH_MATERIAL',
        title: 'Trụ Cột 2: Cấp Phát Kho NVL & Khả Dụng BOM',
        status: 'COMPLETED',
        description: 'Vật tư đã xuất từ Kho Chính (MAIN_VN_WH) về Kho Chuyền (ROUTE_VN_WH) đạt định mức BOM.',
        details: {
          'Phiếu Xuất Kho': 'OUT-WH-2609-019',
          'Cuộn Điện Cực (Anode)': 'AN-260920-01 (Độ dày: 120µm - OK)',
          'Cuộn Điện Cực (Cathode)': 'CA-260920-04 (Độ dày: 118µm - OK)',
          'Dung Dịch Điện Giải': 'SOL-150KG-09 (Tồn: 150.0kg - NORMAL)',
          'Giấy Cách Điện (Separator)': 'SEP-T15-082 (Đạt chuẩn BOM)',
          'Kho Nhận': 'ROUTE_VN_WH (Sẵn sàng nạp máy)'
        },
        timestamp: '2026-09-24 14:15:00'
      },
      {
        stageId: 'MES_PRODUCTION',
        title: 'Trụ Cột 3: Vòng Đời Lô Hàng Trên MES WinForm',
        status: 'IN_PROGRESS',
        description: 'Lô hàng đang tiến hành các công đoạn lắp ráp, hút chân không và lão hóa Aging.',
        details: {
          'Mã Lot Sản Xuất': isPo ? 'VVQR232R710618' : target,
          'Công Đoạn Hiện Tại': 'AGING (Công đoạn 5/7)',
          'Thiết Bị Đang Chạy': 'VVMHY130 (Line HY-02)',
          'Sản Lượng Vào (InQty)': '2,500 EA',
          'Sản Lượng Đạt (GoodQty)': '2,485 EA',
          'Sản Lượng Hỏng (NGQty)': '15 EA',
          'Tiêu Chuẩn ESR / OCV': 'PASS (PQC Kiểm định)'
        },
        timestamp: '2026-09-25 09:20:00'
      },
      {
        stageId: 'POP_KIOSK',
        title: 'Trụ Cột 4: Kiosk POP Tại Xưởng & Pipeline Đồng Bộ',
        status: 'IN_PROGRESS',
        description: 'Dữ liệu chốt từ Kiosk đã ghi nhận vào MongoToMesPerformance và đồng bộ vào STB_ProdRouteHist.',
        details: {
          'Mã Thiết Bị Kiosk': 'VVMHY130',
          'Trạng Thái Khóa Máy': 'ACTIVE (Đang trong ca)',
          'Trạng Thái Pipeline': 'IsDone = 1, IsTransferred = 1 (Đã sync MES)',
          'Công Nhân Thao Tác': 'Công nhân vận hành Kiosk POP',
          'Tiến Độ Đóng Thùng': 'Chờ hoàn thành Aging để sinh PackingID'
        },
        timestamp: '2026-09-25 11:45:00'
      }
    ]
  };

  return NextResponse.json(mockLineage);
}
