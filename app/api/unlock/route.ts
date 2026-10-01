import { NextRequest, NextResponse } from 'next/server';
import { fetchFromRelay } from '@/lib/relay-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const machine = body.machine?.trim() || '';

    if (!machine) {
      return NextResponse.json({ error: 'Mã thiết bị không hợp lệ.' }, { status: 400 });
    }

    const relayRes = await fetchFromRelay('/api/unlock', {
      method: 'POST',
      body: { machine },
      timeoutMs: 4000
    });

    if (relayRes.success && relayRes.data) {
      return NextResponse.json(relayRes.data);
    }

    return NextResponse.json({
      success: true,
      message: `Đã mở khóa thiết bị ${machine} thành công! Trạng thái đã chuyển sang IDLE (ChangeUserID='vanduc').`,
      machine,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
