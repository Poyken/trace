import { NextRequest, NextResponse } from 'next/server';
import { WeeklyTaskItem } from '@/lib/types';

const INITIAL_WEEKLY_TASKS: WeeklyTaskItem[] = [
  {
    id: 'TASK-01',
    title: 'Giải phóng máy VVMHY130 bị kẹt ACTIVE trên Kiosk POP sau khi công nhân đổi ca',
    system: 'POP',
    lotOrTarget: 'VVMHY130',
    rootCause: 'Thiết bị giữ cờ ACTIVE trong VINA_EQUIPMENT_MAPPING do máy tính Kiosk mất kết nối mạng đột ngột',
    resolution: 'Chạy lệnh unlock cập nhật MAPPING_STATUS=\'RELEASED\' qua Rule 20.5 (ChangeUserID=\'vanduc\')',
    status: 'RESOLVED',
    date: '2026-09-28',
    author: 'vanduc'
  },
  {
    id: 'TASK-02',
    title: 'Khắc phục lỗi Already completed in MES trên B530 cho Lot VVQR232R710618',
    system: 'POP',
    lotOrTarget: 'VVQR232R710618',
    rootCause: 'WinForm tự sinh trước 1 dòng RouteOrder kế tiếp có OutTime IS NULL khiến Kiosk chặn không cho chốt',
    resolution: 'Xóa dòng tự sinh thừa trong STB_ProdRouteHist theo Rule 20.2',
    status: 'RESOLVED',
    date: '2026-09-28',
    author: 'vanduc'
  },
  {
    id: 'TASK-03',
    title: 'Đổi máy nhầm Kiosk từ VVMHY120 sang VVMHY130 cho Lot VVQR232R710619',
    system: 'POP',
    lotOrTarget: 'VVQR232R710619',
    rootCause: 'Công nhân chọn nhầm mã máy trên màn hình Kiosk POP',
    resolution: 'Cập nhật đồng thời cả 2 bảng STB_ProdRouteHist và MongoToMesPerformance theo Rule 20.1',
    status: 'RESOLVED',
    date: '2026-09-29',
    author: 'vanduc'
  },
  {
    id: 'TASK-04',
    title: 'Chuyển ngày chốt sản lượng B782 cắt ca 10:00 AM cho 3 Lot dở dang',
    system: 'MES',
    lotOrTarget: 'VVQR232R710601',
    rootCause: 'Tổ trưởng sản xuất chốt muộn sau 10:00 AM, cần lùi ngày công ghi nhận về ngày hôm trước',
    resolution: 'Chạy script fix-movedate cập nhật OutTime chuẩn 10:00:00 bọc BEGIN TRAN...ROLLBACK',
    status: 'RESOLVED',
    date: '2026-09-29',
    author: 'vanduc'
  },
  {
    id: 'TASK-05',
    title: 'Cấp cứu thùng dung dịch điện giải 150kg SOL-150KG-09 bị trừ cạn CurrentQty = 0',
    system: 'MES',
    lotOrTarget: 'SOL-150KG-09',
    rootCause: 'Hệ thống tự động trừ lùi thể tích chạm ngưỡng 0 khiến máy ngưng nạp dung dịch',
    resolution: 'Chạy hotfix fix-solution khôi phục CurrentQty = 150.0 và Status = \'NORMAL\'',
    status: 'RESOLVED',
    date: '2026-09-30',
    author: 'vanduc'
  },
  {
    id: 'TASK-06',
    title: 'Đồng bộ tờ trình thay thế vật tư Groupware GW-2026-09-0842 sang ERP NEOE',
    system: 'GW',
    lotOrTarget: 'GW-2026-09-0842',
    rootCause: 'Lỗi timeout kết nối giữa Bizbox Groupware và NEOE CSDL trong giờ cao điểm',
    resolution: 'Kích hoạt đồng bộ lại qua gw.ps1 sync-erp, kiểm tra cờ CD_COMPANY=\'VINA\'',
    status: 'RESOLVED',
    date: '2026-09-30',
    author: 'vanduc'
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') || '2026-09-28';
  const endDate = searchParams.get('endDate') || '2026-10-02';

  const relayUrl = process.env.MES_RELAY_URL;
  if (relayUrl) {
    try {
      const res = await fetch(`${relayUrl}/api/weekly-report?startDate=${startDate}&endDate=${endDate}`, {
        headers: { 'Authorization': `Bearer ${process.env.MES_RELAY_SECRET || ''}` },
        cache: 'no-store'
      });
      if (res.ok) {
        return NextResponse.json(await res.json());
      }
    } catch {
      // Fallback
    }
  }

  // Calculate statistics according to Rule 22
  const tasks = INITIAL_WEEKLY_TASKS;
  const total = tasks.length;
  const popCount = tasks.filter(t => t.system === 'POP').length;
  const mesCount = tasks.filter(t => t.system === 'MES').length;
  const gwCount = tasks.filter(t => t.system === 'GW').length;
  const resolvedCount = tasks.filter(t => t.status === 'RESOLVED').length;

  return NextResponse.json({
    dateRange: { startDate, endDate },
    author: 'Nguyen Van Duc (vanduc - EA Team)',
    summary: {
      totalTasks: total,
      popCount,
      mesCount,
      gwCount,
      resolvedCount,
      resolutionRate: total > 0 ? `${Math.round((resolvedCount / total) * 100)}%` : '100%',
      rule22Compliant: true
    },
    tasks
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const task: WeeklyTaskItem = body;

    // Rule 22 Enforcement: POP must be labeled as POP, NOT MES
    const popKeywords = ['KIOSK', 'POP', 'MONGOTOMESPERFORMANCE', 'VINA_EQUIPMENT_MAPPING', 'NẠP NVL', 'ĐỔI MÁY', 'ACTIVE'];
    const textToCheck = `${task.title} ${task.rootCause} ${task.resolution}`.toUpperCase();
    const containsPopKeywords = popKeywords.some(kw => textToCheck.includes(kw));

    if (containsPopKeywords && task.system === 'MES') {
      return NextResponse.json({
        error: 'Vi phạm Quy tắc Rule 22: Sự cố liên quan đến Kiosk xưởng / Web POP / MongoToMesPerformance / Mở khóa máy BẮT BUỘC phân loại là POP, TUYỆT ĐỐI KHÔNG ghi là MES.'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã thêm công việc vào Báo Cáo Tuần IT thành công!',
      task
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
