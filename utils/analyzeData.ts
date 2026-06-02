import { AnalysisResult, ColumnInfo, DataShape, DataType } from '@/types/analysis';

function isNull(v: unknown): boolean {
  return v === null || v === undefined || v === '';
}

function inferType(values: unknown[]): DataType {
  const nonNull = values.filter((v) => !isNull(v));
  if (nonNull.length === 0) return 'unknown';

  const boolStrings = new Set(['true', 'false', 'yes', 'no', '0', '1']);
  const boolCount = nonNull.filter(
    (v) => typeof v === 'boolean' || boolStrings.has(String(v).toLowerCase())
  ).length;
  if (boolCount / nonNull.length > 0.8) return 'boolean';

  const numCount = nonNull.filter((v) => typeof v === 'number' && !isNaN(v)).length;
  if (numCount / nonNull.length > 0.8) return 'continuous';

  const dateCount = nonNull.filter((v) => {
    if (typeof v === 'number') return false;
    const d = new Date(String(v));
    return !isNaN(d.getTime()) && String(v).length > 4;
  }).length;
  if (dateCount / nonNull.length > 0.8) return 'datetime';

  return 'categorical';
}

function analyzeColumn(name: string, values: unknown[]): ColumnInfo {
  const nullCount = values.filter((v) => isNull(v)).length;
  const nonNullCount = values.length - nullCount;
  const nullPercent = values.length > 0 ? (nullCount / values.length) * 100 : 0;

  const nonNullValues = values.filter((v) => !isNull(v));
  const uniqueSet = new Set(nonNullValues.map((v) => String(v)));
  const uniqueCount = uniqueSet.size;

  const dtype = inferType(values);

  const sampleValues = Array.from(uniqueSet)
    .slice(0, 5)
    .map((v) => (v === 'null' ? null : v));

  const info: ColumnInfo = {
    name,
    dtype,
    nonNullCount,
    nullCount,
    nullPercent,
    uniqueCount,
    sampleValues,
  };

  if (dtype === 'continuous') {
    const nums = nonNullValues.filter((v) => typeof v === 'number') as number[];
    if (nums.length > 0) {
      info.min = Math.min(...nums);
      info.max = Math.max(...nums);
      info.mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    }
  } else if (dtype === 'categorical' || dtype === 'datetime') {
    const strs = nonNullValues.map((v) => String(v)).sort();
    info.min = strs[0];
    info.max = strs[strs.length - 1];
  }

  return info;
}

export function analyzeData(
  data: Record<string, unknown>[],
  fileName: string
): AnalysisResult {
  if (data.length === 0) {
    return {
      fileName,
      shape: { rows: 0, cols: 0, totalCells: 0, totalMissing: 0, missingPercent: 0 },
      columns: [],
      rawData: [],
    };
  }

  const colNames = Object.keys(data[0]);
  const columns = colNames.map((name) =>
    analyzeColumn(name, data.map((row) => row[name]))
  );

  const rows = data.length;
  const cols = colNames.length;
  const totalCells = rows * cols;
  const totalMissing = columns.reduce((sum, c) => sum + c.nullCount, 0);
  const missingPercent = totalCells > 0 ? (totalMissing / totalCells) * 100 : 0;

  const shape: DataShape = { rows, cols, totalCells, totalMissing, missingPercent };

  return { fileName, shape, columns, rawData: data };
}
