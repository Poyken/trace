'use client';

import React, { useState } from 'react';
import { Wrench, Copy, Check, ShieldAlert, FileCode2 } from 'lucide-react';

export default function HotfixTab() {
  const [template, setTemplate] = useState<string>('swap');
  const [targetLot, setTargetLot] = useState('VVQR232R710618');
  const [targetMachine, setTargetMachine] = useState('VVMHY130');
  const [targetDate, setTargetDate] = useState('2026-09-26');
  const [boxId, setBoxId] = useState('BX-2609-0091');
  const [copied, setCopied] = useState(false);

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

-- 1. Cap nhat bang thong tin tien do san xuat MES WinForm
UPDATE SmartFactoryV2.dbo.STB_ProdRouteHist
SET MachineCode = '${targetMachine}',
    ChangeUserID = 'vanduc',
    ChangeDate = GETDATE()
WHERE LotID = '${targetLot}'
  AND RouteOrder = (SELECT MAX(RouteOrder) FROM SmartFactoryV2.dbo.STB_ProdRouteHist WHERE LotID = '${targetLot}');

-- 2. Dong bo dong thoi sang bang pipeline dong bo Kiosk POP
UPDATE VINATECH_POP.dbo.MongoToMesPerformance
SET MachineCode = '${targetMachine}'
WHERE LotID = '${targetLot}';

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`;

      case 'b782':
        return `-- ======================================================================
-- HOTFIX: CHUYEN NGAY CHOT SAN LUONG B782 (CAT CA 10:00 AM)
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

UPDATE SmartFactoryV2.dbo.STB_ProdRouteHist
SET OutTime = CONVERT(DATETIME, '${targetDate} 10:00:00', 120),
    ChangeUserID = 'vanduc',
    ChangeDate = GETDATE()
WHERE LotID = '${targetLot}'
  AND RouteOrder = (SELECT MAX(RouteOrder) FROM SmartFactoryV2.dbo.STB_ProdRouteHist WHERE LotID = '${targetLot}');

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

DECLARE @MaxOrder INT;
SELECT @MaxOrder = MAX(RouteOrder) FROM SmartFactoryV2.dbo.STB_ProdRouteHist WHERE LotID = '${targetLot}';

DELETE FROM SmartFactoryV2.dbo.STB_ProdRouteWorkerHist WHERE LotID = '${targetLot}' AND RouteOrder = @MaxOrder;
DELETE FROM SmartFactoryV2.dbo.STB_ProdRouteHist WHERE LotID = '${targetLot}' AND RouteOrder = @MaxOrder;

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`;

      case 'pop-clone':
        return `-- ======================================================================
-- HOTFIX: XOA DONG TU SINH COMPLETAROUTE IS NULL DE MO CHOT POP KIOSK (RULE 20.2)
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

DELETE FROM SmartFactoryV2.dbo.STB_ProdRouteHist
WHERE LotID = '${targetLot}' AND CompleteRoute IS NULL;

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`;

      case 'cancel-pack':
        return `-- ======================================================================
-- HOTFIX: HUY LE TUNG BOX/PACK DONG GOI (B523 / HN523)
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

DELETE FROM SmartFactoryV2.dbo.STB_MaterialDocLotInfo WHERE BoxID = '${boxId}' AND LotID = '${targetLot}';
DELETE FROM SmartFactoryV2.dbo.STB_ProdRouteHist WHERE LotID = '${targetLot}' AND RouteCode LIKE '%PACK%';

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`;

      case 'defect-null':
        return `-- ======================================================================
-- HOTFIX: CHUAN HOA REPAIRQTY = 0 DE HIEN THI LAI COT NG BI TRANG TREN B782
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

UPDATE SmartFactoryV2.dbo.STB_ProdRouteHist
SET RepairQty = 0, ChangeUserID = 'vanduc', ChangeDate = GETDATE()
WHERE LotID = '${targetLot}' AND RepairQty IS NULL;

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`;

      case 'lineinput':
        return `-- ======================================================================
-- HOTFIX: KICH HOAT LAI ISLINEINPUT = 1 CHO LOT BI KET
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
-- HOTFIX: CAP CUU KHOI PHUC THUNG DUNG DICH DIEN GIAI 150KG VE NGUONG AN TOAN
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

UPDATE SmartFactoryV2.dbo.STB_MaterialLotInfo
SET MaterialQty = 150.0, IsExhausted = 0, ChangeUserID = 'vanduc', ChangeDate = GETDATE()
WHERE LotID = '${targetLot}';

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`;

      case 'unlock':
        return `-- ======================================================================
-- HOTFIX: GIAI PHONG THIET BI BI KET ACTIVE TREN KIOSK POP (RULE 20.5)
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

UPDATE VINATECH_POP.dbo.STB_MachineRunningStatus
SET StatusCode = 'IDLE', EndTime = GETDATE(), ChangeUserID = 'vanduc'
WHERE MachineCode = '${targetMachine}' AND StatusCode = 'ACTIVE';

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
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            Trung Tâm 12 Mẫu Hotfix Nghiệp Vụ Vinatech (Rule 1 & Rule 20)
          </h2>
          <p className="text-xs text-slate-400">
            Tất cả script sinh ra đều bọc khối Transaction (BEGIN TRAN...ROLLBACK) và gắn định danh ChangeUserID = &apos;vanduc&apos;
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-emerald-950/60 border border-emerald-800 text-emerald-300 px-3 py-1.5 rounded-lg">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <span>Strict Pre-Flight Check Active</span>
        </div>
      </div>

      {/* Template Selector Grid */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase">
            1. Chọn Mẫu Hotfix Nghiệp Vụ (12 Mẫu Sẵn Sàng)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
            {hotfixList.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`p-3 rounded-lg text-xs font-medium text-left border transition ${
                  template === t.id
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Parameter Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div>
            <label className="text-xs font-medium text-slate-400">Mã Lot / PackingID:</label>
            <input
              type="text"
              value={targetLot}
              onChange={(e) => setTargetLot(e.target.value)}
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Mã Thiết Bị (Machine):</label>
            <input
              type="text"
              value={targetMachine}
              onChange={(e) => setTargetMachine(e.target.value)}
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Ngày Chốt Mục Tiêu:</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Mã Box Carton (B523):</label>
            <input
              type="text"
              value={boxId}
              onChange={(e) => setBoxId(e.target.value)}
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300"
            />
          </div>
        </div>
      </div>

      {/* SQL Preview Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
            <FileCode2 className="w-4 h-4 text-cyan-400" />
            <span>hotfix_{template}_{targetLot}.sql</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Đã copy vào Clipboard!' : 'Copy Script SQL'}
          </button>
        </div>

        <pre className="p-5 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
          <code>{sqlCode}</code>
        </pre>
      </div>
    </div>
  );
}
