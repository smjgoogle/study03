export type DataType = 'continuous' | 'categorical' | 'datetime' | 'boolean' | 'unknown';

export interface ColumnInfo {
  name: string;
  dtype: DataType;
  nonNullCount: number;
  nullCount: number;
  nullPercent: number;
  uniqueCount: number;
  sampleValues: (string | number | null)[];
  min?: number | string;
  max?: number | string;
  mean?: number;
}

export interface DataShape {
  rows: number;
  cols: number;
  totalCells: number;
  totalMissing: number;
  missingPercent: number;
}

export interface AnalysisResult {
  fileName: string;
  shape: DataShape;
  columns: ColumnInfo[];
  rawData: Record<string, unknown>[];
}

export type MenuKey = 'overview' | 'sales';

export interface SheetData {
  name: string;
  columns: string[];
  rows: Record<string, unknown>[];
}

export interface ParsedData {
  /** 첫 번째 시트 (분석용 기본값) */
  columns: string[];
  rows: Record<string, unknown>[];
  /** XLSX 전체 시트 목록 (CSV는 단일 시트) */
  sheets: SheetData[];
}
