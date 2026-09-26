import { NextRequest, NextResponse } from 'next/server';
import { getAllScreens } from '@/lib/knowledge-hub';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase().trim() || '';

  const all = getAllScreens();
  if (!q) {
    return NextResponse.json({ screens: all, total: all.length });
  }

  const filtered = all.filter(s =>
    (s.id || '').toLowerCase().includes(q) ||
    (s.name || '').toLowerCase().includes(q) ||
    (s.tables || []).some(t => (t || '').toLowerCase().includes(q)) ||
    (s.sp_get && s.sp_get.toLowerCase().includes(q)) ||
    (s.sp_iud && s.sp_iud.toLowerCase().includes(q))
  );

  return NextResponse.json({ screens: filtered, total: filtered.length });
}
