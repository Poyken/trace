import fs from 'fs';
import path from 'path';

export interface ScreenItem {
  id: string;
  name: string;
  module: string;
  sp_get?: string;
  sp_iud?: string;
  tables: string[];
  common_bugs: Record<string, string>;
  fix_template?: string;
}

export interface PopErrorItem {
  code: string;
  title: string;
  root_cause: string;
  fast_fix: string;
}

export interface GwFormItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
  tables?: string[];
  approval_lines?: string[];
  erp_integration?: string;
}

export interface DatabaseItem {
  name: string;
  profile: string;
  server?: string;
  port?: number;
  tablesCount: number;
  viewsCount: number;
  spCount: number;
  role: string;
  description?: string;
}

export interface KsysModuleItem {
  seq: string;
  name: string;
  prefix?: string;
  description?: string;
  tables?: string[];
}

function readJsonFile<T>(filename: string): T | null {
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(content) as T;
  } catch (e) {
    console.error(`Error reading ${filename}:`, e);
    return null;
  }
}

export function getAllScreens(): ScreenItem[] {
  const data = readJsonFile<{ screens: Record<string, any> }>('QUICK_MATRIX.json');
  if (!data?.screens) return [];

  return Object.entries(data.screens).map(([id, s]) => ({
    id: id || '',
    name: s?.name || id || '',
    module: s?.module || 'Production',
    sp_get: s?.sp_get || '',
    sp_iud: s?.sp_iud || '',
    tables: Array.isArray(s?.tables) ? s.tables : [],
    common_bugs: s?.common_bugs || {},
    fix_template: s?.fix_template || ''
  }));
}

export function getAllPopErrors(): PopErrorItem[] {
  const data = readJsonFile<{ top_errors: Record<string, any> }>('POP_MATRIX.json');
  if (!data?.top_errors) return [];

  return Object.entries(data.top_errors).map(([code, err]) => ({
    code: code || '',
    title: err?.title || code || '',
    root_cause: err?.root_cause || '',
    fast_fix: err?.fast_fix || ''
  }));
}

export function getAllGwForms(): GwFormItem[] {
  const data = readJsonFile<{ forms: Record<string, any> }>('GW_FORM_MATRIX.json');
  if (!data?.forms) return [];

  return Object.entries(data.forms).map(([id, f]) => ({
    id: id || '',
    name: f?.name || f?.form_name || id,
    code: f?.form_code || f?.code || '',
    description: f?.description || '',
    tables: Array.isArray(f?.tables) ? f.tables : [],
    approval_lines: Array.isArray(f?.approval_lines) ? f.approval_lines : [],
    erp_integration: f?.erp_table || f?.erp_integration || ''
  }));
}

export function getAllDatabases(): DatabaseItem[] {
  const data = readJsonFile<{ Databases: any[] }>('DATABASE_MATRIX.json');
  if (!data?.Databases || !Array.isArray(data.Databases)) return [];

  return data.Databases.map((db) => ({
    name: db?.Database || db?.DatabaseName || db?.name || 'Unknown DB',
    profile: db?.Profile || db?.profile || '',
    server: db?.Server || 'dbserver.hycap.co.kr',
    port: db?.Port || 5398,
    tablesCount: db?.TableCount || db?.TablesCount || 0,
    viewsCount: db?.ViewCount || db?.ViewsCount || 0,
    spCount: db?.SPCount || 0,
    role: db?.Pillar || db?.Role || db?.role || 'Production Core',
    description: db?.Description || db?.description || ''
  }));
}

export function getAllKsysModules(): KsysModuleItem[] {
  const data = readJsonFile<{ modules: Record<string, any> }>('KSYSTEM_MATRIX.json');
  if (!data?.modules) return [];

  return Object.entries(data.modules).map(([seq, m]) => ({
    seq: seq || '',
    name: m?.name || m?.module_name || `Module ${seq}`,
    prefix: m?.prefix || m?.table_prefix || '',
    description: m?.description || '',
    tables: Array.isArray(m?.core_tables) ? m.core_tables : []
  }));
}

export function searchSystemKnowledge(query: string) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return null;

  const screens = getAllScreens().filter(s =>
    (s.id || '').toLowerCase().includes(q) ||
    (s.name || '').toLowerCase().includes(q) ||
    (s.tables || []).some(t => (t || '').toLowerCase().includes(q)) ||
    (s.sp_get && s.sp_get.toLowerCase().includes(q)) ||
    (s.sp_iud && s.sp_iud.toLowerCase().includes(q))
  );

  const popErrors = getAllPopErrors().filter(e =>
    (e.code || '').toLowerCase().includes(q) ||
    (e.title || '').toLowerCase().includes(q) ||
    (e.root_cause || '').toLowerCase().includes(q) ||
    (e.fast_fix || '').toLowerCase().includes(q)
  );

  const gwForms = getAllGwForms().filter(f =>
    (f.id || '').toLowerCase().includes(q) ||
    (f.name || '').toLowerCase().includes(q) ||
    (f.description || '').toLowerCase().includes(q)
  );

  const databases = getAllDatabases().filter(d =>
    (d.name || '').toLowerCase().includes(q) ||
    (d.profile || '').toLowerCase().includes(q) ||
    (d.role || '').toLowerCase().includes(q) ||
    (d.description || '').toLowerCase().includes(q)
  );

  return {
    screens: screens.slice(0, 10),
    popErrors: popErrors.slice(0, 10),
    gwForms: gwForms.slice(0, 5),
    databases: databases.slice(0, 5)
  };
}
