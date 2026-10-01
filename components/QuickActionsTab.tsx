'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  RotateCcw, 
  Unlock, 
  Calendar, 
  Trash2, 
  FlaskConical, 
  Sliders, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  Eye, 
  Play, 
  Copy, 
  Check, 
  Sparkles,
  History,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { HotfixActionHistoryItem } from '@/lib/types';
import SqlApprovalModal from '@/components/SqlApprovalModal';

interface QuickActionConfig {
  id: string;
  title: string;
  tag: string;
  tagColor: string;
  description: string;
  icon: any;
  targetDb: string;
  defaultInputs: {
    lot?: string;
    machine?: string;
    date?: string;
    boxId?: string;
  };
  sqlGenerator: (inputs: { lot: string; machine: string; date: string; boxId: string }) => string;
}

export default function QuickActionsTab() {
  const [selectedLot, setSelectedLot] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedBoxId, setSelectedBoxId] = useState('');
  const [searchAction, setSearchAction] = useState('');
  const [copiedActionId, setCopiedActionId] = useState<string | null>(null);

  // History in localStorage
  const [history, setHistory] = useState<HotfixActionHistoryItem[]>([]);
  const [activeModal, setActiveModal] = useState<{
    isOpen: boolean;
    title: string;
    sql: string;
    targetDb: string;
  } | null>(null);

  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vinatech_hotfix_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
  }, []);

  const saveHistoryItem = (item: HotfixActionHistoryItem) => {
    const updated = [item, ...history.slice(0, 29)];
    setHistory(updated);
    try {
      localStorage.setItem('vinatech_hotfix_history', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const sampleLots = [
    { lot: 'VVQR223R072786', machine: 'VVMHY147', desc: 'Lot EDLC 357 Line HY-01' },
    { lot: 'VVQR253R018601', machine: 'VVMHY130', desc: 'Lot EDLC 252 Line BG' },
    { lot: 'SOL-150KG-09', machine: '', desc: 'Thùng dung dịch 150kg' }
  ];

  const quickActions: QuickActionConfig[] = [
    {
      id: 'swap',
      title: 'Đổi Máy Nhầm Kiosk (Rule 20.1)',
      tag: 'POP & MES',
      tagColor: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
      description: 'Cập nhật đồng thời CẢ 2 BẢNG STB_ProdRouteHist và MongoToMesPerformance để tránh lệch tiến độ.',
      icon: RotateCcw,
      targetDb: 'SmartFactoryV2',
      defaultInputs: { lot: selectedLot, machine: selectedMachine },
      sqlGenerator: ({ lot, machine }) => `-- ======================================================================
-- HOTFIX: DOI MAY NHAM KIOSK POP (CHUAN RULE 20.1 - ATOMIC 2 BANG)
-- Tac gia: Nguyen Van Duc (vanduc - EA Team) | Ngay tao: ${new Date().toLocaleDateString('vi-VN')}
-- ======================================================================
BEGIN TRAN;

-- 1. Cap nhat bang thong tin tien do san xuat MES WinForm
UPDATE SmartFactoryV2.dbo.STB_ProdRouteHist
SET MachineCode = '${machine}',
    ChangeUserID = 'vanduc',
    ChangeDate = GETDATE()
WHERE LotID = '${lot}'
  AND RouteOrder = (SELECT MAX(RouteOrder) FROM SmartFactoryV2.dbo.STB_ProdRouteHist WHERE LotID = '${lot}');

-- 2. Dong bo dong thoi sang bang pipeline dong bo Kiosk POP
UPDATE VINATECH_POP.dbo.MongoToMesPerformance
SET MachineCode = '${machine}'
WHERE LotID = '${lot}';

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`
    },
    {
      id: 'unlock',
      title: 'Giải Phóng Máy Kẹt ACTIVE (Rule 20.5)',
      tag: 'POP KIOSK',
      tagColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      description: 'Mở khóa thiết bị Kiosk bị treo giữ phiên thao tác (VINA_EQUIPMENT_MAPPING).',
      icon: Unlock,
      targetDb: 'VINATECH_POP',
      defaultInputs: { machine: selectedMachine },
      sqlGenerator: ({ machine }) => `-- ======================================================================
-- HOTFIX: GIAI PHONG THIET BI BI KET ACTIVE TREN KIOSK POP (RULE 20.5)
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

UPDATE VINATECH_POP.dbo.VINA_EQUIPMENT_MAPPING
SET MAPPING_STATUS      = 'RELEASED',
    RELEASED_AT         = GETDATE(),
    RELEASE_REASON      = N'IT 1-Click unlock by Web Portal (vanduc)',
    NO_EMP_MODIFYER     = 'vanduc',
    CD_COMPANY_MODIFYER = 'VINA'
WHERE (EQUIPMENT_NAME = '${machine}' OR EQUIPMENT_ID = '${machine}')
  AND MAPPING_STATUS IN ('ACTIVE', 'AUTO_MAPPED');

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`
    },
    {
      id: 'b782',
      title: 'Chuyển Ngày Chốt B782 (10h00 AM)',
      tag: 'MES WINFORM',
      tagColor: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      description: 'Lùi/chuyển OutTime về 10:00:00 AM của ngày chỉ định cho công nhân chốt ca muộn.',
      icon: Calendar,
      targetDb: 'SmartFactoryV2',
      defaultInputs: { lot: selectedLot, date: selectedDate },
      sqlGenerator: ({ lot, date }) => `-- ======================================================================
-- HOTFIX: CHUYEN NGAY CHOT SAN LUONG B782 (CAT CA 10:00 AM)
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

UPDATE SmartFactoryV2.dbo.STB_ProdRouteHist
SET OutTime = CONVERT(DATETIME, '${date} 10:00:00', 120),
    ChangeUserID = 'vanduc',
    ChangeDate = GETDATE()
WHERE LotID = '${lot}'
  AND RouteOrder = (SELECT MAX(RouteOrder) FROM SmartFactoryV2.dbo.STB_ProdRouteHist WHERE LotID = '${lot}');

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`
    },
    {
      id: 'pop-clone',
      title: 'Sửa Lỗi Already Completed (Rule 20.2)',
      tag: 'POP KIOSK',
      tagColor: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      description: 'Xóa dòng tự sinh trước CompleteRoute IS NULL trong STB_ProdRouteHist để Kiosk chốt được.',
      icon: Trash2,
      targetDb: 'SmartFactoryV2',
      defaultInputs: { lot: selectedLot },
      sqlGenerator: ({ lot }) => `-- ======================================================================
-- HOTFIX: XOA DONG TU SINH TRUOC COMPLETE_ROUTE CUA POP KIOSK (RULE 20.2)
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

DELETE FROM SmartFactoryV2.dbo.STB_ProdRouteHist
WHERE LotID = '${lot}'
  AND OutTime IS NULL
  AND InTime IS NULL
  AND RouteOrder = (SELECT MAX(RouteOrder) FROM SmartFactoryV2.dbo.STB_ProdRouteHist WHERE LotID = '${lot}');

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`
    },
    {
      id: 'rollback',
      title: 'Rollback Lượt Chốt Kẹt B530 / POP',
      tag: 'MES & POP',
      tagColor: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
      description: 'Hủy lượt chốt nhầm gần nhất trong STB_ProdRouteWorkerHist & STB_ProdRouteHist.',
      icon: RotateCcw,
      targetDb: 'SmartFactoryV2',
      defaultInputs: { lot: selectedLot },
      sqlGenerator: ({ lot }) => `-- ======================================================================
-- HOTFIX: ROLLBACK LUOT CHOT CONG DOAN KET B530 / KIOSK POP
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

DECLARE @MaxOrder INT;
SELECT @MaxOrder = MAX(RouteOrder) FROM SmartFactoryV2.dbo.STB_ProdRouteHist WHERE LotID = '${lot}';

DELETE FROM SmartFactoryV2.dbo.STB_ProdRouteWorkerHist
WHERE LotID = '${lot}' AND RouteOrder = @MaxOrder;

DELETE FROM SmartFactoryV2.dbo.STB_ProdRouteHist
WHERE LotID = '${lot}' AND RouteOrder = @MaxOrder;

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`
    },
    {
      id: 'solution',
      title: 'Cấp Cứu Thùng Dung Dịch Điện Giải 150kg',
      tag: 'MES NVL',
      tagColor: 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800',
      description: 'Khôi phục thùng dung dịch bị auto-exhaust cạn về 0kg, mở khóa nạp lại máy.',
      icon: FlaskConical,
      targetDb: 'SmartFactoryV2',
      defaultInputs: { lot: selectedLot },
      sqlGenerator: ({ lot }) => `-- ======================================================================
-- HOTFIX: CAP CUU THUNG DUNG DICH DIEN GIAI 150KG (RESET QUANTITY)
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

UPDATE SmartFactoryV2.dbo.STB_MaterialLotInfo
SET CurrentQty = 150.0,
    Status = 'NORMAL',
    ChangeUserID = 'vanduc',
    ChangeDate = GETDATE()
WHERE LotID = '${lot}';

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`
    },
    {
      id: 'thick',
      title: 'Sửa Độ Dày Điện Cực < 100 (Rule 20.3)',
      tag: 'MES NVL',
      tagColor: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800',
      description: 'Sửa MaterialThickness >= 100 trong STB_MaterialLotInfo để mở sáng nút Cắt điện cực.',
      icon: Sliders,
      targetDb: 'SmartFactoryV2',
      defaultInputs: { lot: selectedLot },
      sqlGenerator: ({ lot }) => `-- ======================================================================
-- HOTFIX: CAP NHAT DO DAY DIEN CUC >= 100 DE MO NUT CAT (RULE 20.3)
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

UPDATE SmartFactoryV2.dbo.STB_MaterialLotInfo
SET MaterialThickness = 120,
    ChangeUserID = 'vanduc',
    ChangeDate = GETDATE()
WHERE LotID = '${lot}';

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`
    },
    {
      id: 'defect-null',
      title: 'Sửa Mất Cột NG B782 (RepairQty = 0)',
      tag: 'MES WINFORM',
      tagColor: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
      description: 'Chuẩn hóa RepairQty = 0 khắc phục lỗi trắng cột NG trên màn hình B782 do logic NULL.',
      icon: Layers,
      targetDb: 'SmartFactoryV2',
      defaultInputs: { lot: selectedLot },
      sqlGenerator: ({ lot }) => `-- ======================================================================
-- HOTFIX: CHUAN HOA REPAIR_QTY = 0 (KHAC PHUC MAT COT NG TREN B782)
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

UPDATE SmartFactoryV2.dbo.STB_ProdRouteHist
SET RepairQty = 0,
    ChangeUserID = 'vanduc',
    ChangeDate = GETDATE()
WHERE LotID = '${lot}' AND RepairQty IS NULL;

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`
    },
    {
      id: 'b552',
      title: 'B552: Xóa Cuộn Điện Cực & Reset LineInput',
      tag: 'MES ĐIỆN CỰC',
      tagColor: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      description: 'Xóa lượt chốt chia cuộn/mẻ trộn B552 và khôi phục IsLineInput = 1 trên cuộn mẹ để tái sử dụng.',
      icon: Trash2,
      targetDb: 'SmartFactoryV2',
      defaultInputs: { lot: selectedLot },
      sqlGenerator: ({ lot }) => `-- ======================================================================
-- HOTFIX: XOA CUON DIEN CUC B552 & RESET ISLINEINPUT CUON ME (TRAP 4)
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

-- 1. Xoa luot chot chia cuon khoi STB_ProdRouteHist
DELETE FROM SmartFactoryV2.dbo.STB_ProdRouteHist
WHERE LotID = '${lot}';

-- 2. Khoi phuc trang thai IsLineInput cho cuon me de cho phep nap vao me moi
UPDATE SmartFactoryV2.dbo.STB_MaterialLotInfo
SET IsLineInput = 1,
    Status = 'NORMAL',
    ChangeUserID = 'vanduc',
    ChangeDate = GETDATE()
WHERE LotID = (
    SELECT TOP 1 RawMaterialLotID 
    FROM SmartFactoryV2.dbo.STB_MaterialLotInfo 
    WHERE LotID = '${lot}' AND RawMaterialLotID IS NOT NULL
);

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`
    },
    {
      id: 'cancel_pack',
      title: 'Hủy Lẻ Box Đóng Gói (B523/HN523)',
      tag: 'MES ĐÓNG GÓI',
      tagColor: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      description: 'Hủy lẻ từng Box mà không hủy hỏng toàn bộ PackingID hoặc lệch tồn VINA_PACKING_REMAIN_QTY.',
      icon: Trash2,
      targetDb: 'SmartFactoryV2',
      defaultInputs: { lot: selectedLot, boxId: selectedBoxId },
      sqlGenerator: ({ lot, boxId }) => `-- ======================================================================
-- HOTFIX: HUY LE TUNG BOX DONG GOI MA KHONG MAT PACKINGID (TRAP 6)
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

-- 1. Xoa lien ket Box khoi chi tiet chung tu dong goi
DELETE FROM SmartFactoryV2.dbo.STB_MaterialDocLotInfo
WHERE LotID = '${lot}' AND BoxID = '${boxId}';

-- 2. Cap nhat giam so luong da dong goi tren STB_ProdRouteHist
UPDATE SmartFactoryV2.dbo.STB_ProdRouteHist
SET ChangeUserID = 'vanduc',
    ChangeDate = GETDATE()
WHERE LotID = '${lot}'
  AND RouteOrder = (SELECT MAX(RouteOrder) FROM SmartFactoryV2.dbo.STB_ProdRouteHist WHERE LotID = '${lot}');

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`
    },
    {
      id: 'lineinput',
      title: 'Kích Hoạt Lại IsLineInput = 1',
      tag: 'MES NVL',
      tagColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      description: 'Mở khóa Lot/cuộn NVL bị kẹt cờ IsLineInput=0 không thể nạp vào dây chuyền sản xuất.',
      icon: CheckCircle2,
      targetDb: 'SmartFactoryV2',
      defaultInputs: { lot: selectedLot },
      sqlGenerator: ({ lot }) => `-- ======================================================================
-- HOTFIX: MO KHOA ISLINEINPUT = 1 CHO LOT BI KET KHONG VAO DUOC CHUYEN
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

UPDATE SmartFactoryV2.dbo.STB_MaterialLotInfo
SET IsLineInput = 1,
    Status = 'NORMAL',
    ChangeUserID = 'vanduc',
    ChangeDate = GETDATE()
WHERE LotID = '${lot}';

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`
    },
    {
      id: 'pack_reprint',
      title: 'PackingID: Mở Quyền In Lại Tem Thùng',
      tag: 'MES IN TEM',
      tagColor: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
      description: 'Cho phép in lại tem thùng Sanmina/Vinatech khi tem bị mờ/hỏng mà không sinh đúp mã PackingID.',
      icon: RefreshCw,
      targetDb: 'SmartFactoryV2',
      defaultInputs: { lot: selectedLot },
      sqlGenerator: ({ lot }) => `-- ======================================================================
-- HOTFIX: MO QUYEN IN LAI TEM PACKINGID KHONG SINH MA TRUNG
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

UPDATE SmartFactoryV2.dbo.STB_PackingMaster
SET IsPrintAllow = 1,
    PrintCount = PrintCount + 1,
    ChangeUserID = 'vanduc',
    ChangeDate = GETDATE()
WHERE PackingID = '${lot}' OR LotID = '${lot}';

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`
    }
  ];

  const validateInputs = (action: QuickActionConfig): boolean => {
    if (action.id !== 'unlock' && !selectedLot.trim()) {
      setStatusMessage({
        text: `⚠️ Vui lòng nhập Mã Lot trước khi thao tác "${action.title}"`,
        type: 'error'
      });
      return false;
    }
    if ((action.id === 'swap' || action.id === 'unlock') && !selectedMachine.trim()) {
      setStatusMessage({
        text: `⚠️ Vui lòng nhập Mã Máy (Thiết bị) trước khi thao tác "${action.title}"`,
        type: 'error'
      });
      return false;
    }
    if (action.id === 'cancel_pack' && !selectedBoxId.trim()) {
      setStatusMessage({
        text: `⚠️ Vui lòng nhập Mã Thùng (BoxID) trước khi thao tác "${action.title}"`,
        type: 'error'
      });
      return false;
    }
    return true;
  };

  const handleCopySql = (action: QuickActionConfig) => {
    if (!validateInputs(action)) return;
    const sql = action.sqlGenerator({
      lot: selectedLot,
      machine: selectedMachine,
      date: selectedDate,
      boxId: selectedBoxId
    });
    navigator.clipboard.writeText(sql);
    setCopiedActionId(action.id);
    setTimeout(() => setCopiedActionId(null), 2000);
  };

  const handleOpenModal = (action: QuickActionConfig) => {
    if (!validateInputs(action)) return;
    const sql = action.sqlGenerator({
      lot: selectedLot,
      machine: selectedMachine,
      date: selectedDate,
      boxId: selectedBoxId
    });
    setActiveModal({
      isOpen: true,
      title: action.title,
      sql,
      targetDb: action.targetDb
    });
  };

  const handle1ClickExecute = async (action: QuickActionConfig, mode: 'dry_run' | 'commit') => {
    if (!validateInputs(action)) return;
    setExecutingActionId(action.id);
    setStatusMessage(null);

    const sql = action.sqlGenerator({
      lot: selectedLot,
      machine: selectedMachine,
      date: selectedDate,
      boxId: selectedBoxId
    });

    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: mode === 'commit' ? sql.replace(/ROLLBACK\s+TRAN;/gi, 'COMMIT TRAN;') : sql,
          profile: action.targetDb,
          dryRun: mode === 'dry_run',
          author: 'vanduc'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          text: mode === 'dry_run'
            ? `✅ Khảo sát Dry-Run "${action.title}" thành công! Cú pháp an toàn.`
            : `🎉 Đã thực thi thành công "${action.title}" trên CSDL ${action.targetDb}!`,
          type: 'success'
        });

        // Save into history
        saveHistoryItem({
          id: `ACT-${Date.now()}`,
          type: action.title,
          targetLot: selectedLot,
          targetMachine: selectedMachine,
          targetDb: action.targetDb,
          mode: mode === 'dry_run' ? 'DRY_RUN' : 'COMMIT',
          timestamp: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
          author: 'vanduc',
          success: true,
          message: data.message || 'Thực thi an toàn'
        });
      } else {
        setStatusMessage({
          text: `❌ Lỗi thực thi: ${data.error || 'Không thể thực thi hotfix'}`,
          type: 'error'
        });
      }
    } catch (e) {
      setStatusMessage({
        text: `❌ Lỗi kết nối: ${(e as Error).message}`,
        type: 'error'
      });
    } finally {
      setExecutingActionId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900/70 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-cyan-500 text-white shadow-md shadow-amber-500/20">
              <Zap className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Trung Tâm Cấp Cứu Sự Cố 1-Click (Quick Dispatch Center)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dành riêng cho Kỹ sư IT (Nguyen Van Duc - EA Team). Giải quyết các sự cố xưởng thường gặp chỉ trong 1 thao tác bấm.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs font-mono text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Rule 1 & Rule 20 Enforced</span>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-sm animate-fade-in ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs">
            Đóng
          </button>
        </div>
      )}

      {/* Global Quick Input Bar */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            Thông Số Mục Tiêu Áp Dụng Cho Toàn Bộ Thao Tác
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1 sm:pb-0">
            <span className="text-slate-400 dark:text-slate-500 font-sans mr-1">Mẫu nhanh:</span>
            {sampleLots.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedLot(s.lot);
                  if (s.machine) setSelectedMachine(s.machine);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 hover:text-cyan-600 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700 font-mono transition"
                title={s.desc}
              >
                {s.lot}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Mã Lot / Đối tượng:</label>
            <input
              type="text"
              value={selectedLot}
              onChange={(e) => setSelectedLot(e.target.value.trim().toUpperCase())}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300 outline-none transition"
              placeholder="VD: VVQR223R072786..."
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Mã Thiết Bị / Machine:</label>
            <input
              type="text"
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value.trim().toUpperCase())}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300 outline-none transition"
              placeholder="VD: VVMHY147..."
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Ngày Chốt Ca (B782):</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none transition"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Mã Thùng / Box (B523):</label>
            <input
              type="text"
              value={selectedBoxId}
              onChange={(e) => setSelectedBoxId(e.target.value.trim().toUpperCase())}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none transition"
              placeholder="VD: BX-2609-0091..."
            />
          </div>
        </div>
      </div>

      {/* Action Search and Category Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Danh Mục 8 Thao Tác Cấp Cứu
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
            {quickActions.filter(a => !searchAction || a.title.toLowerCase().includes(searchAction.toLowerCase()) || a.description.toLowerCase().includes(searchAction.toLowerCase())).length} Sẵn Sàng
          </span>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchAction}
            onChange={(e) => setSearchAction(e.target.value)}
            placeholder="Lọc thao tác (B782, Kiosk, Đổi máy...)"
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-1.5 text-xs outline-none focus:border-cyan-500 transition"
          />
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions
          .filter(a => !searchAction || a.title.toLowerCase().includes(searchAction.toLowerCase()) || a.description.toLowerCase().includes(searchAction.toLowerCase()) || a.tag.toLowerCase().includes(searchAction.toLowerCase()))
          .map((action) => {
            const Icon = action.icon;
            const isBusy = executingActionId === action.id;
            const isCopied = copiedActionId === action.id;

            return (
              <div
                key={action.id}
                className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-cyan-500/60 transition-all flex flex-col justify-between shadow-sm group relative"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${action.tagColor}`}>
                      {action.tag}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition">
                    {action.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {action.description}
                  </p>

                  <div className="mt-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 space-y-0.5">
                    <div className="truncate">
                      <span className="text-slate-400">Lot:</span>{' '}
                      <b className={selectedLot ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 font-normal italic'}>
                        {selectedLot || '(Chưa điền)'}
                      </b>
                    </div>
                    {action.id === 'swap' || action.id === 'unlock' ? (
                      <div className="truncate">
                        <span className="text-slate-400">Máy:</span>{' '}
                        <b className={selectedMachine ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 font-normal italic'}>
                          {selectedMachine || '(Chưa điền)'}
                        </b>
                      </div>
                    ) : null}
                    {action.id === 'b782' ? (
                      <div className="truncate"><span className="text-slate-400">Giờ ra:</span> <b className="text-amber-600 dark:text-amber-400">{selectedDate} 10:00</b></div>
                    ) : null}
                  </div>
                </div>

                {/* 3 Action Buttons */}
                <div className="grid grid-cols-3 gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => handleCopySql(action)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition"
                    title="Copy nhanh mã SQL hotfix"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Đã copy' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenModal(action)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition"
                    title="Xem và chỉnh sửa script SQL trước khi chạy"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem & Sửa</span>
                  </button>

                  <button
                    onClick={() => handle1ClickExecute(action, 'dry_run')}
                    disabled={isBusy}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-[11px] font-bold transition shadow-sm disabled:opacity-50"
                    title="Khảo sát an toàn (Dry-Run Rollback)"
                  >
                    {isBusy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Dry-Run</span>
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Execution History Section */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Nhật Ký Thao Tác Sự Cố Gần Đây ({history.length})
            </h4>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => {
                setHistory([]);
                localStorage.removeItem('vinatech_hotfix_history');
              }}
              className="text-[11px] text-slate-400 hover:text-rose-500 transition"
            >
              Xóa lịch sử
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
            Chưa có thao tác nào trong phiên này. Hãy chọn một tác vụ phía trên để thực hiện 1-click!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/80 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Thời gian</th>
                  <th className="p-3">Tác vụ</th>
                  <th className="p-3">Mã Lot / Thiết bị</th>
                  <th className="p-3">CSDL</th>
                  <th className="p-3">Chế độ</th>
                  <th className="p-3">Kỹ sư IT</th>
                  <th className="p-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3 text-slate-500">{h.timestamp}</td>
                    <td className="p-3 font-sans font-medium text-slate-800 dark:text-slate-200">{h.type}</td>
                    <td className="p-3 text-cyan-600 dark:text-cyan-400 font-bold">{h.targetLot}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{h.targetDb}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        h.mode === 'DRY_RUN'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      }`}>
                        {h.mode}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 font-sans">{h.author}</td>
                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-sans font-semibold">
                      {h.success ? 'Thành công' : 'Thất bại'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SQL Approval & Inspection Modal */}
      {activeModal && (
        <SqlApprovalModal
          isOpen={activeModal.isOpen}
          onClose={() => setActiveModal(null)}
          title={`Duyệt & Thực Thi: ${activeModal.title}`}
          sql={activeModal.sql}
          targetDb={activeModal.targetDb}
          onExecuted={(res) => {
            saveHistoryItem({
              id: `ACT-${Date.now()}`,
              type: activeModal.title,
              targetLot: selectedLot,
              targetMachine: selectedMachine,
              targetDb: activeModal.targetDb,
              mode: 'COMMIT',
              timestamp: new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'),
              author: 'vanduc',
              success: true,
              message: res.message || 'Thực thi an toàn'
            });
          }}
        />
      )}
    </div>
  );
}
