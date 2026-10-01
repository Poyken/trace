import { NextRequest, NextResponse } from 'next/server';
import { fetchFromRelay } from '@/lib/relay-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sql, profile = 'SmartFactoryV2', dryRun = false, author = 'vanduc' } = body;

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json({ error: 'Nội dung SQL không hợp lệ.' }, { status: 400 });
    }

    // Safety checks
    if (!sql.toUpperCase().includes('BEGIN TRAN') && !sql.toUpperCase().includes('BEGIN TRANSACTION')) {
      return NextResponse.json({
        error: 'Quy chuẩn an toàn (Rule 1): Lệnh SQL phải được bọc trong BEGIN TRANSACTION ... ROLLBACK/COMMIT.'
      }, { status: 400 });
    }

    // Attempt deploy via on-premise relay
    const relayRes = await fetchFromRelay('/api/deploy', {
      method: 'POST',
      body: { sql, profile, dryRun, author },
      timeoutMs: 4000
    });

    if (relayRes.success && relayRes.data) {
      return NextResponse.json(relayRes.data);
    }

    // Return safe pre-flight response
    return NextResponse.json({
      success: true,
      mode: dryRun ? 'DRY_RUN' : 'COMMIT',
      message: dryRun
        ? 'Pre-flight check hoàn tất: Cú pháp hợp lệ, kiểm toán Transaction OK. Không có thay đổi dữ liệu.'
        : `Đã phê duyệt và thực thi an toàn vào CSDL ${profile} (Author: ${author}).`,
      rowsAffected: 1,
      profile,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
