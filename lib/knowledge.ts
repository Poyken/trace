export const VINATECH_SCREENS = [
  { id: 'B530', name: 'Chốt sản lượng công đoạn (Work Performance)', sp: 'usp_vn_saveproductionperformance', tables: ['STB_ProdRouteHist', 'STB_ProdRouteWorkerHist'], desc: 'Màn hình chốt sản lượng chính của MES WinForm. Thường gặp lỗi Already completed do sinh dòng trước.' },
  { id: 'B540', name: 'Ghi nhận lỗi công đoạn (Defect Registration)', sp: 'usp_vn_savedefectperformance', tables: ['STB_ProdRouteDefectHist'], desc: 'Màn hình ghi nhận sản phẩm lỗi/phế phẩm theo công đoạn.' },
  { id: 'B552', name: 'Nạp cuộn / Quản lý mẻ trộn điện cực', sp: 'usp_vn_saveslittingperformance', tables: ['STB_MaterialLotInfo', 'STB_MaterialDocLotInfo'], desc: 'Nạp cuộn điện cực Slitting/Mixing. Giới hạn tối đa 3 LOTNO cuộn BTP.' },
  { id: 'B781', name: 'Chuyển trạng thái Lot & Hold/Release', sp: 'usp_vn_updateholdlot', tables: ['STB_MaterialLotInfo'], desc: 'Màn hình khóa/mở Lot bị HOLD (PQC, quá hạn, nghi ngờ chất lượng).' },
  { id: 'B782', name: 'Điều chỉnh sản lượng & Chuyển ngày chốt', sp: 'usp_vn_updateproductionperformance', tables: ['STB_ProdRouteHist'], desc: 'Màn hình cắt ca chuyển ngày (mặc định mốc 10h00 AM). Author vanduc.' },
  { id: 'B523', name: 'Đóng gói thùng carton & In tem Sanmina', sp: 'usp_vn_savepackinglabel', tables: ['STB_SetInfo', 'STB_PackingLabelPrintHist'], desc: 'Màn hình đóng gói. PackingID rỗng sẽ không in được tem.' },
];

export const COMMON_ERROR_PATTERNS = [
  {
    pattern: /already completed/i,
    rootCause: 'Lỗi "Already completed in MES": Do WinForm sinh sẵn dòng kế tiếp (CompleteRoute = 1) trong STB_ProdRouteHist dẫn đến xung đột khi Kiosk chốt lại.',
    workaround: 'Báo OP dừng bấm chốt lại trên Kiosk; thông báo IT xóa dòng thừa tự sinh.',
    hotfixTemplate: (lot: string) => `-- Hotfix xoa dong thua STB_ProdRouteHist (Rule 20.2)
BEGIN TRAN
  DELETE FROM STB_ProdRouteWorkerHist WHERE LotID = '${lot}' AND RouteOrder = (SELECT MAX(RouteOrder) FROM STB_ProdRouteHist WHERE LotID = '${lot}' AND CompleteRoute = 1);
  DELETE FROM STB_ProdRouteHist WHERE LotID = '${lot}' AND CompleteRoute = 1 AND InQty = 0;
-- ROLLBACK TRAN -- Kiem tra truoc khi COMMIT
-- COMMIT TRAN`
  },
  {
    pattern: /active|kẹt máy|treo máy/i,
    rootCause: 'Thiết bị kẹt trạng thái ACTIVE trên Kiosk POP do công nhân tắt trình duyệt đột ngột hoặc đổi ca không bấm Kết Thúc.',
    workaround: 'Dùng lệnh Mở Khóa Nhanh trên Portal hoặc yêu cầu OP bấm "Đăng xuất thiết bị" trên màn hình Kiosk.',
    hotfixTemplate: (machine: string) => `-- Giai phong thiet bi bi ket ACTIVE tren Kiosk POP
BEGIN TRAN
  UPDATE VINATECH_POP.dbo.STB_MachineRunningStatus
  SET StatusCode = 'IDLE', EndTime = GETDATE(), ChangeUserID = 'vanduc'
  WHERE MachineCode = '${machine}' AND StatusCode = 'ACTIVE';
-- ROLLBACK TRAN
-- COMMIT TRAN`
  },
  {
    pattern: /packingid|in tem|print allow/i,
    rootCause: 'Lỗi in PackingID / Khóa in tem: IsPrintAllow = 0 hoặc PrintCount vượt quá giới hạn cấu hình trong STB_PackingLabelPrintHist.',
    workaround: 'OP kiểm tra xem tem đã in trước đó chưa. Nếu máy in kẹt giấy, yêu cầu IT mở quyền Reprint.',
    hotfixTemplate: (pk: string) => `-- Mo khoa cho phep in lai tem PackingID (Rule 20)
BEGIN TRAN
  UPDATE SmartFactoryV2.dbo.STB_PackingLabelPrintHist
  SET IsPrintAllow = 1, ChangeUserID = 'vanduc', ChangeDate = GETDATE()
  WHERE PackingID = '${pk}';
-- ROLLBACK TRAN
-- COMMIT TRAN`
  },
  {
    pattern: /độ dày|cắt điện cực|thickness/i,
    rootCause: 'Nút Cắt điện cực bị mờ: Do logic khóa hệ thống nếu MaterialThickness < 100 trong STB_MaterialMaster (Rule 20.3).',
    workaround: 'Kiểm tra thông số cuộn NVL đầu vào. Nếu đo thực tế đạt chuẩn, IT cập nhật MaterialThickness >= 100.',
    hotfixTemplate: (lot: string) => `-- Cap nhat do day dien cuc dat tieu chuan cat
BEGIN TRAN
  UPDATE SmartFactoryV2.dbo.STB_MaterialLotInfo
  SET MaterialThickness = 120, ChangeUserID = 'vanduc'
  WHERE LotID = '${lot}';
-- ROLLBACK TRAN
-- COMMIT TRAN`
  }
];

export const MOCK_HEALTH_DATA = {
  coreDbs: [
    { name: 'SmartFactoryV2 (MES Core)', status: 'ok' as const, latencyMs: 38 },
    { name: 'SmartFramework (Security & Users)', status: 'ok' as const, latencyMs: 24 },
    { name: 'VINATECH_POP (Kiosk Floor)', status: 'ok' as const, latencyMs: 42 },
    { name: 'NEOE (YoungLimWon ERP)', status: 'ok' as const, latencyMs: 56 },
    { name: 'VINATECH_GROUP (Bizbox Groupware)', status: 'ok' as const, latencyMs: 31 }
  ],
  wipOver24h: {
    count: 37798,
    oldestDate: '09/11/2018 14:04:58',
    sampleLots: ['VVQR232R710618', 'VVQR232R710619', 'VVQR241P820112']
  },
  popSyncPending: {
    count: 37,
    status: 'warning' as const
  },
  blockingLocks: {
    count: 0,
    details: 'Không phát hiện Blocking Lock hay Deadlock nào trên CSDL SmartFactoryV2.'
  },
  activeEquipmentLocks: {
    count: 31,
    machines: ['VVMHY130', 'VVMHY131', 'VVAS102', 'VVPK201', 'VVSL005']
  },
  timestamp: new Date().toISOString()
};
