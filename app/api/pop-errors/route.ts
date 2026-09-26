import { NextRequest, NextResponse } from 'next/server';
import { getAllPopErrors } from '@/lib/knowledge-hub';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase().trim() || '';

  const all = getAllPopErrors();
  if (!q) {
    return NextResponse.json({ errors: all, total: all.length });
  }

  const filtered = all.filter(e =>
    e.code.toLowerCase().includes(q) ||
    e.title.toLowerCase().includes(q) ||
    e.root_cause.toLowerCase().includes(q) ||
    e.fast_fix.toLowerCase().includes(q)
  );

  return NextResponse.json({ errors: filtered, total: filtered.length });
}
