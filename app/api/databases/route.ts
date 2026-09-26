import { NextResponse } from 'next/server';
import { getAllDatabases } from '@/lib/knowledge-hub';

export async function GET() {
  const dbs = getAllDatabases();
  return NextResponse.json({ databases: dbs, total: dbs.length });
}
