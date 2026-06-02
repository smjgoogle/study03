import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ParsedData } from '@/types/analysis';

async function parseCSV(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error(`CSV 파싱 실패: ${results.errors[0].message}`));
          return;
        }
        const rows = results.data as Record<string, unknown>[];
        const columns = results.meta.fields ?? (rows.length > 0 ? Object.keys(rows[0]) : []);
        resolve({ columns, rows });
      },
      error: (error) => {
        reject(new Error(`CSV 파싱 실패: ${error.message}`));
      },
    });
  });
}

async function parseXLSX(file: File): Promise<ParsedData> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('XLSX 파싱 실패: 시트가 존재하지 않습니다.');
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: null,
  });
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { columns, rows };
}

export async function parseFile(file: File): Promise<ParsedData> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'csv') return parseCSV(file);
  if (ext === 'xlsx' || ext === 'xls') return parseXLSX(file);
  throw new Error(`지원하지 않는 파일 형식입니다: .${ext}`);
}
