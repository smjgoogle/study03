import Papa from 'papaparse';
import * as XLSX from 'xlsx';

async function parseCSV(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data as Record<string, unknown>[]);
      },
      error: (error) => {
        reject(new Error(`CSV 파싱 실패: ${error.message}`));
      },
    });
  });
}

async function parseXLSX(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: null,
  });
  return data;
}

export async function parseFile(file: File): Promise<Record<string, unknown>[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'csv') return parseCSV(file);
  if (ext === 'xlsx' || ext === 'xls') return parseXLSX(file);
  throw new Error(`지원하지 않는 파일 형식입니다: .${ext}`);
}
