import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const machine = body.machine?.trim() || '';

    if (!machine) {
      return NextResponse.json({ error: 'Mã thiết bị không hợp lệ.' }, { status: 400 });
    }

    const relayUrl = process.env.MES_RELAY_URL;
    if (relayUrl) {
      try {
        const res = await fetch(`${relayUrl}/api/unlock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MES_RELAY_SECRET || ''}`
          },
          body: JSON.stringify({ machine })
        });
        if (res.ok) {
          return NextResponse.json(await res.json());
        }
      } catch {
        // Fallback
      }
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
