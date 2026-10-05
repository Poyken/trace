export interface ActiveMachineItem {
  mappingId?: number;
  equipmentId: string;
  equipmentName?: string;
  lineCode?: string;
  routeCode?: string;
  dayPlanNo?: string;
  mappedAt?: string;
  isOrphan?: boolean;
}

export interface HealthStatus {
  coreDbs: {
    name: string;
    status: 'ok' | 'warning' | 'error';
    latencyMs: number;
  }[];
  wipOver24h: {
    count: number;
    oldestDate: string;
    sampleLots: string[];
  };
  popSyncPending: {
    count: number;
    status: 'ok' | 'warning' | 'error';
  };
  blockingLocks: {
    count: number;
    details: string;
  };
  activeEquipmentLocks: {
    count: number;
    machines: (string | ActiveMachineItem)[];
    orphanCount?: number;
    todayCount?: number;
  };
  timestamp: string;
}

export interface TraceResult {
  target: string;
  type: 'LOT' | 'PO' | 'MACHINE' | 'BOX';
  modelCode?: string;
  modelName?: string;
  line?: string;
  currentRoute?: string;
  status?: string;
  routeHistory: {
    routeOrder: number;
    routeName: string;
    machineCode: string;
    workerId: string;
    inTime: string;
    outTime: string;
    goodQty: number;
    ngQty: number;
  }[];
  bomMaterials?: {
    itemCode: string;
    itemName: string;
    bomQty: number;
    consumedQty: number;
    stockRouteWh: number;
    stockMainWh: number;
    status: 'sufficient' | 'low' | 'critical';
  }[];
  pqcStatus?: string;
  packingInfo?: {
    packingId: string;
    boxId: string;
    standardQty: number;
    actualQty: number;
    isPrintAllow: boolean;
    printCount: number;
  };
  poCode?: string;
  basicRoutingCode?: string;
  basicRoutingName?: string;
  poRouting?: {
    routeIndex: number;
    routeCode: string;
    routeName: string;
    isInputRoute?: boolean;
    isOutputRoute?: boolean;
    changeUser?: string;
    changeDateTime?: string;
  }[];
  missingStandardRoutes?: {
    routeCode: string;
    routeName: string;
    routeIndex: number;
  }[];
  rawCliOutput?: string;
}

export interface UserInspectionResult {
  empNo: string;
  name: string;
  dept?: string;
  erpAuth: {
    status: 'active' | 'inactive' | 'not_found';
    loginAllowed: boolean;
    lastLogin?: string;
  };
  popKioskAuth: {
    status: 'active' | 'stopped' | 'not_found';
    isAdmin: boolean;
    isSystemAdmin: boolean;
    isStopped: boolean;
    mbti?: string;
  };
  mesWinFormAuth: {
    status: 'linked' | 'unlinked' | 'not_found';
    userId?: string;
    role?: string;
  };
  groupwareAuth: {
    status: 'active' | 'not_found';
    approvalRole?: string;
  };
  ssoAuth: {
    status: 'registered' | 'not_found';
    tokenStatus: string;
  };
}

export interface PackInspectionResult {
  target: string;
  lotId?: string;
  packingId: string;
  boxId?: string;
  itemCode?: string;
  itemName?: string;
  standardQty: number;
  actualQty: number;
  printCount: number;
  isPrintAllow: boolean;
  saveTime?: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PRINT_LOCKED' | 'EMPTY';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  structuredResponse?: {
    rootCause?: string;
    currentStatus?: string;
    workaround?: string;
    hotfixSql?: string;
  };
  quickActions?: {
    label: string;
    actionType: 'trace' | 'lineage' | 'locks' | 'bom' | 'user' | 'pack' | 'copy_sql';
    payload: string;
  }[];
}

export interface LineageResult {
  target: string;
  poCode?: string;
  modelCode?: string;
  modelName?: string;
  stages: {
    stageId: 'PO_GW' | 'WH_MATERIAL' | 'MES_PRODUCTION' | 'POP_KIOSK';
    title: string;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'WARNING';
    description: string;
    details: Record<string, any>;
    timestamp?: string;
  }[];
}

export interface DbLockItem {
  spid: number;
  blockedBySpid: number;
  waitTimeSeconds: number;
  waitType: string;
  dbName: string;
  hostName: string;
  programName: string;
  loginName: string;
  sqlText: string;
  status: 'BLOCKING' | 'WAITING' | 'NORMAL';
}

export interface DbLocksResult {
  profile: string;
  totalConnections: number;
  activeLocksCount: number;
  blockingChainsCount: number;
  locks: DbLockItem[];
  timestamp: string;
}

export interface WeeklyTaskItem {
  id: string;
  title: string;
  system: 'POP' | 'MES' | 'GW' | 'ECM' | 'HW';
  lotOrTarget?: string;
  rootCause: string;
  resolution: string;
  status: 'RESOLVED' | 'IN_PROGRESS' | 'MONITORING';
  date: string;
  author: string;
}

export interface HotfixActionHistoryItem {
  id: string;
  type: string;
  targetLot: string;
  targetMachine?: string;
  targetDate?: string;
  targetDb: string;
  mode: 'DRY_RUN' | 'COMMIT';
  timestamp: string;
  author: string;
  success: boolean;
  message: string;
}

