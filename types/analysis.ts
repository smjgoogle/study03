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

export type MenuKey = 'columns' | 'shape' | 'types' | 'missing';

export interface ParsedData {
  columns: string[];
  rows: Record<string, unknown>[];
}
