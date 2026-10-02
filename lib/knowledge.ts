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
  DELETE W FROM SmartFactoryV2.dbo.STB_ProdRouteWorkerHist W
  INNER JOIN SmartFactoryV2.dbo.STB_ProdRouteHist H ON W.ProdRouteHistNo = H.ProdRouteHistNo
  INNER JOIN SmartFactoryV2.dbo.STB_SetInfo S ON H.ControlNo = S.ControlNo
  WHERE S.Barcode = '${lot}' AND H.CompleteRoute IS NULL;

  DELETE H FROM SmartFactoryV2.dbo.STB_ProdRouteHist H
  INNER JOIN SmartFactoryV2.dbo.STB_SetInfo S ON H.ControlNo = S.ControlNo
  WHERE S.Barcode = '${lot}' AND H.CompleteRoute IS NULL;
-- ROLLBACK TRAN -- Kiem tra truoc khi COMMIT
-- COMMIT TRAN`
  },
  {
    pattern: /active|kẹt máy|treo máy/i,
    rootCause: 'Thiết bị kẹt trạng thái ACTIVE trên Kiosk POP do công nhân tắt trình duyệt đột ngột hoặc đổi ca không bấm Kết Thúc.',
    workaround: 'Dùng lệnh Mở Khóa Nhanh trên Portal hoặc yêu cầu OP bấm "Đăng xuất thiết bị" trên màn hình Kiosk.',
    hotfixTemplate: (machine: string) => `-- Giai phong thiet bi bi ket ACTIVE tren Kiosk POP (Rule 20.5)
BEGIN TRAN
  UPDATE VINATECH_POP.dbo.VINA_EQUIPMENT_MAPPING
  SET MAPPING_STATUS = 'RELEASED', RELEASED_AT = GETDATE(),
      RELEASE_REASON = N'IT unlock machine by Web Portal (vanduc)',
      NO_EMP_MODIFYER = 'vanduc', CD_COMPANY_MODIFYER = 'VINA'
  WHERE (EQUIPMENT_NAME = '${machine}' OR EQUIPMENT_ID = '${machine}')
    AND MAPPING_STATUS IN ('ACTIVE', 'AUTO_MAPPED');
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
    count: 39,
    orphanCount: 39,
    todayCount: 0,
    machines: [
      { equipmentId: 'VVMHY69', equipmentName: 'Curling C#4', lineCode: 'VVHYC-03', routeCode: 'V-24_HY', dayPlanNo: '2026092800018', mappedAt: '2026-10-01 19:26:00', isOrphan: true },
      { equipmentId: 'VNEP11006', equipmentName: 'Mixer #3 (650L)', lineCode: 'F4_ELECTRODE_LINE', routeCode: 'W-01', dayPlanNo: '2026093000089', mappedAt: '2026-10-01 18:44:55', isOrphan: true },
      { equipmentId: 'VNEP11005', equipmentName: 'Mixer #2 (650L)', lineCode: 'F4_ELECTRODE_LINE', routeCode: 'W-01', dayPlanNo: '2026093000085', mappedAt: '2026-10-01 18:43:08', isOrphan: true },
      { equipmentId: 'VNEP11004', equipmentName: 'Mixer #1 (650L)', lineCode: 'F4_ELECTRODE_LINE', routeCode: 'W-01', dayPlanNo: '2026093000081', mappedAt: '2026-10-01 18:41:42', isOrphan: true },
      { equipmentId: 'VNEP11101', equipmentName: 'Coater #1 (음극)', lineCode: 'F4_ELECTRODE_LINE', routeCode: 'W-02', dayPlanNo: '2026093000079', mappedAt: '2026-10-01 17:52:42', isOrphan: true },
      { equipmentId: 'VNEP11003', equipmentName: 'Mixer #3 (300L)', lineCode: 'F4_ELECTRODE_LINE', routeCode: 'W-01', dayPlanNo: '2026093000077', mappedAt: '2026-10-01 17:20:43', isOrphan: true },
      { equipmentId: 'VNEP11102', equipmentName: 'Coater #2 (양극)', lineCode: 'F4_ELECTRODE_LINE', routeCode: 'W-02', dayPlanNo: '2026093000072', mappedAt: '2026-10-01 17:14:51', isOrphan: true },
      { equipmentId: 'VNEP11001', equipmentName: 'Mixer #1 (300L)', lineCode: 'F4_ELECTRODE_LINE', routeCode: 'W-01', dayPlanNo: '2026093000073', mappedAt: '2026-10-01 17:08:58', isOrphan: true },
      { equipmentId: 'VVMHY70', equipmentName: 'Sleeving C#4', lineCode: 'VVHYC-10', routeCode: 'V-25_HY', dayPlanNo: '2026092800037', mappedAt: '2026-10-01 17:04:47', isOrphan: true },
      { equipmentId: 'VVMHY52', equipmentName: 'Winding C#3-01', lineCode: 'VVHYC-03', routeCode: 'V-22_HY', dayPlanNo: '2026093000244', mappedAt: '2026-10-01 16:27:54', isOrphan: true },
      { equipmentId: 'VVMHY174', equipmentName: 'Winding C#17', lineCode: 'VVHYC-17', routeCode: 'V-22_HY', dayPlanNo: '2026093000317', mappedAt: '2026-10-01 16:25:06', isOrphan: true },
      { equipmentId: 'VNEP11104', equipmentName: 'Coater #4', lineCode: 'F4_ELECTRODE_LINE', routeCode: 'W-02', dayPlanNo: '2026092900066', mappedAt: '2026-10-01 16:00:33', isOrphan: true },
      { equipmentId: 'VVMHY135', equipmentName: 'Sleeving C#9', lineCode: 'VVHYC-01', routeCode: 'V-25_HY', dayPlanNo: '2026091200031', mappedAt: '2026-10-01 16:00:27', isOrphan: true },
      { equipmentId: 'VVMHY39', equipmentName: 'Winding C#2-01', lineCode: 'VVHYC-02', routeCode: 'V-22_HY', dayPlanNo: '2026093000239', mappedAt: '2026-10-01 15:01:52', isOrphan: true },
      { equipmentId: 'VVMHY22', equipmentName: 'Winding C#1-02', lineCode: 'VVHYC-01', routeCode: 'V-22_HY', dayPlanNo: '2026093000232', mappedAt: '2026-10-01 14:24:19', isOrphan: true },
      { equipmentId: 'VNEP11103', equipmentName: 'Coater #3', lineCode: 'F4_ELECTRODE_LINE', routeCode: 'W-02', dayPlanNo: '2026092900061', mappedAt: '2026-10-01 14:18:32', isOrphan: true },
      { equipmentId: 'VVMHY192', equipmentName: 'Winding C#13', lineCode: 'VVHYC-13', routeCode: 'V-22_HY', dayPlanNo: '2026093000305', mappedAt: '2026-10-01 12:45:24', isOrphan: true },
      { equipmentId: 'VVEP288', equipmentName: 'Coater #2', lineCode: 'ElectrodeBN', routeCode: 'V-02', dayPlanNo: '2026093000100', mappedAt: '2026-10-01 11:21:58', isOrphan: true },
      { equipmentId: 'VVEP287', equipmentName: 'Coater #1', lineCode: 'ElectrodeBN', routeCode: 'V-02', dayPlanNo: '2026093000104', mappedAt: '2026-10-01 11:20:34', isOrphan: true },
      { equipmentId: 'VVMHY57', equipmentName: 'Sleeving C#3', lineCode: 'VVHYC-02', routeCode: 'V-25_HY', dayPlanNo: '2026092800012', mappedAt: '2026-10-01 06:24:01', isOrphan: true },
      { equipmentId: 'VVMHY164', equipmentName: 'Winding C#16', lineCode: 'VVHYC-16', routeCode: 'V-22_HY', dayPlanNo: '2026092800056', mappedAt: '2026-09-30 16:41:39', isOrphan: true },
      { equipmentId: 'VVEP385', equipmentName: 'Coater #3', lineCode: 'ElectrodeBN', routeCode: 'V-02', dayPlanNo: '2026092900076', mappedAt: '2026-09-30 12:29:44', isOrphan: true },
      { equipmentId: 'VVEP424', equipmentName: 'Coater #4', lineCode: 'ElectrodeBN', routeCode: 'V-02', dayPlanNo: '2026092900074', mappedAt: '2026-09-30 10:42:21', isOrphan: true },
      { equipmentId: 'VVMM-06', equipmentName: 'CURLING THỦ CÔNG 1 BN', lineCode: 'TCX1', routeCode: 'V-24', dayPlanNo: '2026092100048', mappedAt: '2026-09-30 07:25:22', isOrphan: true },
      { equipmentId: 'VVMM-01', equipmentName: 'CURLING THỦ CÔNG 1', lineCode: 'TCX1', routeCode: 'V-24', dayPlanNo: '2026092100048', mappedAt: '2026-09-30 07:25:20', isOrphan: true },
      { equipmentId: 'VVEP427', equipmentName: 'Roll pressing # 1', lineCode: 'ElectrodeBN', routeCode: 'V-03', dayPlanNo: '2026092800202', mappedAt: '2026-09-30 01:08:18', isOrphan: true },
      { equipmentId: 'VVEP417', equipmentName: 'Roll pressing # 3', lineCode: 'ElectrodeBN', routeCode: 'V-03', dayPlanNo: '2026092900139', mappedAt: '2026-09-29 17:08:29', isOrphan: true },
      { equipmentId: 'VNEP01206', equipmentName: '롤프레스4호기', lineCode: 'ELECTRODE LINE', routeCode: 'E-03', dayPlanNo: '2026091100046', mappedAt: '2026-09-29 16:56:54', isOrphan: true },
      { equipmentId: 'VNEP11202', equipmentName: 'Press #2 (양극)', lineCode: 'F4_ELECTRODE_LINE', routeCode: 'W-03', dayPlanNo: '2026081400061', mappedAt: '2026-09-29 16:42:44', isOrphan: true },
      { equipmentId: 'VVMM-08', equipmentName: 'Bọc vỏ thủ công 2 BN', lineCode: 'TCX2', routeCode: 'V-25', dayPlanNo: '2026092000037', mappedAt: '2026-09-29 16:41:27', isOrphan: true },
      { equipmentId: 'VVEP174', equipmentName: 'Assembly C11', lineCode: 'VVC-11', routeCode: 'V-23', dayPlanNo: '2026092600024', mappedAt: '2026-09-28 23:11:12', isOrphan: true },
      { equipmentId: 'VNEP11002', equipmentName: 'Mixer #2 (300L)', lineCode: 'F4_ELECTRODE_LINE', routeCode: 'W-01', dayPlanNo: '2026092300176', mappedAt: '2026-09-28 18:28:32', isOrphan: true },
      { equipmentId: 'VVMM-02', equipmentName: 'Chèn cao su thủ công 1', lineCode: 'TCX1', routeCode: 'V-23', dayPlanNo: '2026091300116', mappedAt: '2026-09-28 13:26:39', isOrphan: true },
      { equipmentId: 'VVMHY183', equipmentName: 'Winding C#12', lineCode: 'VVHYC-12', routeCode: 'V-22_HY', dayPlanNo: '2026091900046', mappedAt: '2026-09-26 19:00:24', isOrphan: true },
      { equipmentId: 'VVMHY23', equipmentName: 'Assembly C#1', lineCode: 'VVHYC-01', routeCode: 'V-23_HY', dayPlanNo: '2026092100233', mappedAt: '2026-09-26 09:43:38', isOrphan: true },
      { equipmentId: 'VVMHY132', equipmentName: 'Assembly C#9', lineCode: 'VVHYC-09', routeCode: 'V-23_HY', dayPlanNo: '2026091200036', mappedAt: '2026-09-26 05:48:46', isOrphan: true },
      { equipmentId: 'VVEP329', equipmentName: 'Curling C17', lineCode: 'VVC-17', routeCode: 'V-24', dayPlanNo: '2026091500051', mappedAt: '2026-09-26 04:10:22', isOrphan: true },
      { equipmentId: 'VVEP343', equipmentName: 'Roll pressing # 2 (JYR-680)', lineCode: 'ElectrodeBN', routeCode: 'V-03', dayPlanNo: '2026092200113', mappedAt: '2026-09-23 12:30:44', isOrphan: true },
      { equipmentId: 'VVEP285', equipmentName: 'Mixer #4 (125L)', lineCode: 'ELECTRODE LINE', routeCode: 'E-01', dayPlanNo: '2026091100046', mappedAt: '2026-09-22 20:05:56', isOrphan: true }
    ]
  },
  timestamp: new Date().toISOString()
};
