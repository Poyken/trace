'use client';

import React, { useState } from 'react';
import { Wrench, Copy, Check, ShieldAlert, FileCode2, ShieldCheck } from 'lucide-react';
import SqlApprovalModal from '@/components/SqlApprovalModal';

export default function HotfixTab() {
  const [template, setTemplate] = useState<string>('swap');
  const [targetLot, setTargetLot] = useState('');
  const [targetMachine, setTargetMachine] = useState('VVMHY130');
  const [targetDate, setTargetDate] = useState('2026-09-26');
  const [boxId, setBoxId] = useState('BX-2609-0091');
  const [copied, setCopied] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);

  const hotfixList = [
    { id: 'swap', label: 'Rule 20.1: Đổi máy nhầm Kiosk (2 bảng)' },
    { id: 'b782', label: 'B782: Chuyển ngày ca 10:00 AM' },
    { id: 'b552', label: 'B552: Xóa cuộn điện cực & reset LineInput' },
    { id: 'rollback', label: 'Rollback lượt chốt kẹt B530 / POP' },
    { id: 'pop-clone', label: 'Rule 20.2: Xóa dòng tự sinh CompleteRoute' },
    { id: 'cancel-pack', label: 'Hủy lẻ từng Box/Pack đóng gói (B523)' },
    { id: 'defect-null', label: 'Chuẩn hóa RepairQty = 0 (hiện cột NG B782)' },
    { id: 'lineinput', label: 'Kích hoạt lại IsLineInput = 1' },
    { id: 'solution', label: 'Cấp cứu thùng dung dịch điện giải 150kg' },
    { id: 'unlock', label: 'Rule 20.5: Giải phóng máy kẹt ACTIVE' },
    { id: 'pack', label: 'PackingID: Mở quyền in lại tem' },
    { id: 'thick', label: 'Rule 20.3: Sửa độ dày điện cực < 100' }
  ];

  const generateSql = () => {
    switch (template) {
      case 'swap':
        return `-- ======================================================================
-- HOTFIX: DOI MAY NHAM KIOSK POP (CHUAN RULE 20.1 - ATOMIC 2 BANG)
-- Tac gia: Nguyen Van Duc (vanduc - EA Team) | Ngay tao: ${new Date().toLocaleDateString('vi-VN')}
-- ======================================================================
BEGIN TRAN;

-- 1. Cap nhat bang thong tin tien do san xuat MES WinForm (join qua STB_SetInfo)
UPDATE H
SET H.MachineCode = '${targetMachine}',
    H.ChangeDateTime = GETDATE(),
    H.ChangeUserID = 'vanduc'
FROM SmartFactoryV2.dbo.STB_ProdRouteHist H
INNER JOIN SmartFactoryV2.dbo.STB_SetInfo S WITH(NOLOCK) ON H.ControlNo = S.ControlNo
WHERE S.Barcode = '${targetLot}';

-- 2. Dong bo dong thoi sang bang pipeline dong bo Kiosk POP
UPDATE M
SET M.MachineCode = '${targetMachine}',
    M.InsertDateTime = GETDATE()
FROM SmartFactoryV2.dbo.MongoToMesPerformance M
WHERE M.Barcode = '${targetLot}';

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`;

      case 'b782':
        return `-- ======================================================================
-- HOTFIX: CHUYEN NGAY CHOT SAN LUONG B782 (CAT CA 10:00 AM)
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

UPDATE H
SET H.ProdDateTime = CONVERT(DATETIME, '${targetDate} 10:00:00', 120),
    H.JobDate = '${targetDate}',
    H.ChangeDateTime = GETDATE(),
    H.ChangeUserID = 'vanduc'
FROM SmartFactoryV2.dbo.STB_ProdRouteHist H
INNER JOIN SmartFactoryV2.dbo.STB_SetInfo S WITH(NOLOCK) ON H.ControlNo = S.ControlNo
WHERE S.Barcode = '${targetLot}';

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`;

      case 'b552':
        return `-- ======================================================================
-- HOTFIX: XOA CUON DIEN CUC B552 & RESET ISLINEINPUT (SLITTING/MIXING)
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

DELETE FROM SmartFactoryV2.dbo.STB_MaterialDocLotInfo
WHERE LotID = '${targetLot}' AND ProcessCode = 'SLITTING';

UPDATE SmartFactoryV2.dbo.STB_MaterialLotInfo
SET IsLineInput = 1, ChangeUserID = 'vanduc', ChangeDate = GETDATE()
WHERE LotID = '${targetLot}';

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`;

      case 'rollback':
        return `-- ======================================================================
-- HOTFIX: ROLLBACK LUOT CHOT CONG DOAN KET B530 / KIOSK POP
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

DELETE W
FROM SmartFactoryV2.dbo.STB_ProdRouteWorkerHist W
INNER JOIN SmartFactoryV2.dbo.STB_ProdRouteHist H ON W.ProdRouteHistNo = H.ProdRouteHistNo
INNER JOIN SmartFactoryV2.dbo.STB_SetInfo S WITH(NOLOCK) ON H.ControlNo = S.ControlNo
WHERE S.Barcode = '${targetLot}';

DELETE H
FROM SmartFactoryV2.dbo.STB_ProdRouteHist H
INNER JOIN SmartFactoryV2.dbo.STB_SetInfo S WITH(NOLOCK) ON H.ControlNo = S.ControlNo
WHERE S.Barcode = '${targetLot}';

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`;

      case 'pop-clone':
        return `-- ======================================================================
-- HOTFIX: XOA DONG TU SINH TRUOC COMPLETE_ROUTE CUA POP KIOSK (RULE 20.2)
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

DELETE W
FROM SmartFactoryV2.dbo.STB_ProdRouteWorkerHist W
INNER JOIN SmartFactoryV2.dbo.STB_ProdRouteHist H ON W.ProdRouteHistNo = H.ProdRouteHistNo
INNER JOIN SmartFactoryV2.dbo.STB_SetInfo S WITH(NOLOCK) ON H.ControlNo = S.ControlNo
WHERE S.Barcode = '${targetLot}' AND H.CompleteRoute IS NULL;

DELETE H
FROM SmartFactoryV2.dbo.STB_ProdRouteHist H
INNER JOIN SmartFactoryV2.dbo.STB_SetInfo S WITH(NOLOCK) ON H.ControlNo = S.ControlNo
WHERE S.Barcode = '${targetLot}' AND H.CompleteRoute IS NULL;

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`;

      case 'cancel-pack':
        return `-- ======================================================================
-- HOTFIX: HUY LE TUNG BOX / PACK DONG GOI (B523 / HN523)
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

UPDATE SmartFactoryV2.dbo.STB_PackingDetailInfo
SET PackingStatus = 'CANCEL', ChangeUserID = 'vanduc', ChangeDate = GETDATE()
WHERE BoxID = '${boxId}' AND PackingID = '${targetLot}';

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`;

      case 'defect-null':
        return `-- ======================================================================
-- HOTFIX: CHUAN HOA REPAIR_QTY = 0 (KHAC PHUC MAT COT NG TREN B782)
-- Bang muc tieu: SmartFactoryV2.dbo.STB_DefectRepairInfo
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

UPDATE D
SET D.RepairQty = 0, 
    D.ChangeDateTime = GETDATE(), 
    D.ChangeUserID = 'vanduc'
FROM SmartFactoryV2.dbo.STB_DefectRepairInfo D
INNER JOIN SmartFactoryV2.dbo.STB_SetInfo S WITH(NOLOCK) ON D.ControlNo = S.ControlNo
WHERE S.Barcode = '${targetLot}' AND D.RepairQty IS NULL;

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`;

      case 'lineinput':
        return `-- ======================================================================
-- HOTFIX: KICH HOAT LAI ISLINEINPUT = 1 DE CAP NVL
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

UPDATE SmartFactoryV2.dbo.STB_MaterialLotInfo
SET IsLineInput = 1, ChangeUserID = 'vanduc', ChangeDate = GETDATE()
WHERE LotID = '${targetLot}';

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`;

      case 'solution':
        return `-- ======================================================================
-- HOTFIX: CAP CUU THUNG DUNG DICH DIEN GIAI 150KG (RESET QUANTITY)
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

UPDATE SmartFactoryV2.dbo.STB_MaterialLotInfo
SET CurrentQty = 150.0,
    Status = 'NORMAL',
    ChangeUserID = 'vanduc',
    ChangeDate = GETDATE()
WHERE LotID = '${targetLot}';

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`;

      case 'unlock':
        return `-- ======================================================================
-- HOTFIX: GIAI PHONG THIET BI BI KET ACTIVE TREN KIOSK POP (RULE 20.5)
-- Bang muc tieu: VINATECH_POP.dbo.VINA_EQUIPMENT_MAPPING
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

UPDATE VINATECH_POP.dbo.VINA_EQUIPMENT_MAPPING
SET MAPPING_STATUS      = 'RELEASED',
    RELEASED_AT         = GETDATE(),
    RELEASE_REASON      = N'IT unlock machine by Web Portal (vanduc)',
    NO_EMP_MODIFYER     = 'vanduc',
    CD_COMPANY_MODIFYER = 'VINA'
WHERE (EQUIPMENT_NAME = '${targetMachine}' OR EQUIPMENT_ID = '${targetMachine}')
  AND MAPPING_STATUS IN ('ACTIVE', 'AUTO_MAPPED');

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`;

      case 'pack':
        return `-- ======================================================================
-- HOTFIX: MO KHOA CHO PHEP IN LAI TEM DONG GOI PACKINGID
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

UPDATE SmartFactoryV2.dbo.STB_PackingLabelPrintHist
SET IsPrintAllow = 1, ChangeUserID = 'vanduc', ChangeDate = GETDATE()
WHERE PackingID = '${targetLot}';

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`;

      case 'thick':
        return `-- ======================================================================
-- HOTFIX: CAP NHAT DO DAY DIEN CUC >= 100 DE MO NUT CAT (RULE 20.3)
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

UPDATE SmartFactoryV2.dbo.STB_MaterialLotInfo
SET MaterialThickness = 120, ChangeUserID = 'vanduc', ChangeDate = GETDATE()
WHERE LotID = '${targetLot}';

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`;

      default:
        return '';
    }
  };

  const sqlCode = generateSql();

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm transition-colors duration-300">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Trung Tâm 12 Mẫu Hotfix Nghiệp Vụ Vinatech (Rule 1 & Rule 20)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tất cả script sinh ra đều bọc khối Transaction (BEGIN TRAN...ROLLBACK) và gắn định danh ChangeUserID = &apos;vanduc&apos;
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-3.5 py-1.5 rounded-xl shadow-sm">
          <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Strict Pre-Flight Check Active</span>
        </div>
      </div>

      {/* Template Selector Grid */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            1. Chọn Mẫu Hotfix Nghiệp Vụ (12 Mẫu Sẵn Sàng)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 mt-2.5">
            {hotfixList.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`p-3 rounded-xl text-xs font-medium text-left border transition ${
                  template === t.id
                    ? 'bg-cyan-50 dark:bg-cyan-950/80 border-cyan-500 text-cyan-800 dark:text-cyan-300 shadow-sm font-bold'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Parameter Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Mã Lot / PackingID:</label>
            <input
              type="text"
              placeholder="VD: VVQR223R072786"
              value={targetLot}
              onChange={(e) => setTargetLot(e.target.value)}
              className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-700 dark:text-cyan-300 font-bold focus:border-cyan-500 outline-none transition"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Mã Thiết Bị (Machine):</label>
            <input
              type="text"
              value={targetMachine}
              onChange={(e) => setTargetMachine(e.target.value)}
              className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-700 dark:text-cyan-300 font-bold focus:border-cyan-500 outline-none transition"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Ngày Chốt Mục Tiêu:</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-700 dark:text-cyan-300 font-bold focus:border-cyan-500 outline-none transition"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Mã Box Carton (B523):</label>
            <input
              type="text"
              value={boxId}
              onChange={(e) => setBoxId(e.target.value)}
              className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-700 dark:text-cyan-300 font-bold focus:border-cyan-500 outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* SQL Preview Box & Action Controls */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
            <FileCode2 className="w-4 h-4 text-cyan-400" />
            <span>hotfix_{template}_{targetLot}.sql</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition border border-slate-700 shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Đã copy' : 'Copy Script SQL'}
            </button>

            {/* PRE-FLIGHT REVIEW & DIRECT EXECUTION BUTTON */}
            <button
              onClick={() => setIsApprovalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/25"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Duyệt SQL & Thực Thi Trực Tiếp</span>
            </button>
          </div>
        </div>

        <pre className="p-6 font-mono text-xs text-slate-100 overflow-x-auto leading-relaxed max-h-96">
          <code>{sqlCode}</code>
        </pre>
      </div>

      {/* SQL Pre-Flight Approval Modal */}
      <SqlApprovalModal
        isOpen={isApprovalOpen}
        onClose={() => setIsApprovalOpen(false)}
        title={`Duyệt Hotfix: ${hotfixList.find(h => h.id === template)?.label || template}`}
        sql={sqlCode}
        targetDb={template.includes('pop') || template === 'unlock' ? 'VINATECH_POP' : 'SmartFactoryV2'}
        targetTable={template === 'unlock' ? 'VINA_EQUIPMENT_MAPPING' : template === 'swap' ? 'STB_ProdRouteHist & MongoToMesPerformance' : ''}
      />
    </div>
  );
}
