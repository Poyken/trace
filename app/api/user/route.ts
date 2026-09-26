import { NextRequest, NextResponse } from 'next/server';
import { UserInspectionResult } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target')?.trim();

  if (!target) {
    return NextResponse.json({ error: 'Vui lòng cung cấp mã nhân viên (EmpNo) hoặc tên tài khoản.' }, { status: 400 });
  }

  const relayUrl = process.env.MES_RELAY_URL;
  if (relayUrl) {
    try {
      const res = await fetch(`${relayUrl}/api/user?target=${encodeURIComponent(target)}`, {
        headers: { 'Authorization': `Bearer ${process.env.MES_RELAY_SECRET || ''}` }
      });
      if (res.ok) {
        return NextResponse.json(await res.json());
      }
    } catch {
      // Fallback
    }
  }

  const isDuc = target === '92603003' || /vanduc/i.test(target);

  const mockResult: UserInspectionResult = {
    empNo: isDuc ? '92603003' : target,
    name: isDuc ? 'Nguyen Van Duc' : 'Công Nhân Vận Hành Dây Chuyền',
    dept: isDuc ? 'EA / IT Team' : 'Sản Xuất - Xưởng Hà Nam',
    erpAuth: {
      status: 'active',
      loginAllowed: true,
      lastLogin: '2026-09-26 08:00:12'
    },
    popKioskAuth: {
      status: 'active',
      isAdmin: isDuc,
      isSystemAdmin: isDuc,
      isStopped: false,
      mbti: isDuc ? 'IT_ADMIN' : 'OP_STD'
    },
    mesWinFormAuth: {
      status: 'linked',
      userId: isDuc ? 'vanduc' : `op_${target}`,
      role: isDuc ? 'SYSTEM_ENGINEER' : 'OPERATOR'
    },
    groupwareAuth: {
      status: 'active',
      approvalRole: isDuc ? 'IT Specialist / Approver' : 'Staff'
    },
    ssoAuth: {
      status: 'registered',
      tokenStatus: 'VALID_ACTIVE'
    }
  };

  return NextResponse.json(mockResult);
}
