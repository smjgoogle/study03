'use client';

import { useMemo, useState } from 'react';
import { ParsedData, SheetData } from '@/types/analysis';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { AlertTriangle } from 'lucide-react';

// ── 상수 ───────────────────────────────────────────────────────────────────
const MONTH_KR = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const ALL_MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12];
const COLORS = ['#3b82f6','#22c55e','#f97316','#a855f7','#ef4444','#14b8a6','#f59e0b','#6366f1'];

// ── 유틸 함수 ──────────────────────────────────────────────────────────────

/** 값에서 연도(4자리) 추출 */
function extractYear(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (Number.isInteger(n) && n >= 1990 && n <= 2100) return n;
  const d = new Date(String(value));
  if (!isNaN(d.getTime()) && String(value).length > 4) return d.getFullYear();
  // "2023-01", "2023/01" 형태
  const m = String(value).match(/^(\d{4})[-/]\d{1,2}/);
  if (m) return parseInt(m[1]);
  return null;
}

/** 값에서 월(1-12) 추출 */
function extractMonth(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const d = new Date(String(value));
  if (!isNaN(d.getTime()) && String(value).length > 6) return d.getMonth() + 1;
  const m = String(value).match(/^\d{4}[-/](\d{1,2})/);
  if (m) return parseInt(m[1]);
  return null;
}

/** 날짜/연도 컬럼 자동 탐지 */
function detectDateColumn(columns: string[], rows: Record<string, unknown>[]): string | null {
  const keywords = ['date','year','날짜','년도','연도','일자','기간','month','년월','년','일','시기'];
  for (const col of columns) {
    if (keywords.some((k) => col.toLowerCase().includes(k))) return col;
  }
  const sample = rows.slice(0, 30);
  for (const col of columns) {
    const vals = sample.map((r) => r[col]).filter((v) => v !== null && v !== undefined);
    if (vals.length === 0) continue;
    const yearLike = vals.filter((v) => extractYear(v) !== null).length;
    if (yearLike / vals.length >= 0.7) return col;
  }
  return null;
}

/** 수치형 컬럼 탐지 */
function getNumericCols(columns: string[], rows: Record<string, unknown>[], dateCol: string | null): string[] {
  const sample = rows.slice(0, 50);
  return columns.filter((col) => {
    if (col === dateCol) return false;
    const vals = sample.map((r) => r[col]).filter((v) => v !== null && v !== undefined && v !== '');
    if (vals.length === 0) return false;
    return vals.filter((v) => typeof v === 'number' && !isNaN(v as number)).length / vals.length > 0.7;
  });
}

/** 범주형 컬럼 탐지 */
function getCategoricalCols(columns: string[], numericCols: string[], dateCol: string | null): string[] {
  return columns.filter((col) => col !== dateCol && !numericCols.includes(col));
}

/** 숫자 포맷 */
function fmt(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

// ── 하위 컴포넌트 ──────────────────────────────────────────────────────────

/** 월별 필터 버튼 */
function MonthFilter({ active, onChange }: {
  active: number | null;
  onChange: (m: number | null) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3">
      <p className="text-xs font-medium text-gray-500 mb-2">월별 필터</p>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => onChange(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-150 ${
            active === null
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          전체
        </button>
        {ALL_MONTHS.map((m) => (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-150 ${
              active === m
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {m}월
          </button>
        ))}
      </div>
    </div>
  );
}

/** 시트 탭 */
function SheetTabs({ sheets, active, onChange }: {
  sheets: SheetData[];
  active: string;
  onChange: (name: string) => void;
}) {
  if (sheets.length <= 1) return null;
  return (
    <div className="flex gap-1 flex-wrap mb-6">
      {sheets.map((s) => (
        <button
          key={s.name}
          onClick={() => onChange(s.name)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${
            active === s.name
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}


/** 요약 카드 */
function StatCards({ rows, numericCols }: {
  rows: Record<string, unknown>[];
  numericCols: string[];
}) {
  if (numericCols.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 text-sm text-gray-400">
        표시할 수치형 컬럼이 없습니다.
      </div>
    );
  }
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(numericCols.length, 4)}, 1fr)` }}>
      {numericCols.slice(0, 4).map((col, i) => {
        const vals = rows.map((r) => r[col]).filter((v) => typeof v === 'number' && !isNaN(v as number)) as number[];
        const total = vals.reduce((a, b) => a + b, 0);
        const avg = vals.length > 0 ? total / vals.length : 0;
        return (
          <div key={col} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-xs text-gray-500 mb-1 truncate font-medium">{col}</p>
            <p className="text-xl font-bold text-gray-800">{fmt(total)}</p>
            <p className="text-xs text-gray-400 mt-0.5">평균 {fmt(avg)} · {vals.length}건</p>
            <div className="mt-2 h-1 rounded-full" style={{ background: COLORS[i % COLORS.length], opacity: 0.4 }} />
          </div>
        );
      })}
    </div>
  );
}

/** 수치형 컬럼 — 월별 또는 전체 막대/선 차트 */
function NumericChart({ col, rows, dateCol, hasMonth, colorIdx }: {
  col: string;
  rows: Record<string, unknown>[];
  dateCol: string | null;
  hasMonth: boolean;
  colorIdx: number;
}) {
  const color = COLORS[colorIdx % COLORS.length];

  const data = useMemo(() => {
    if (dateCol && hasMonth) {
      // 월별 합계
      const map: Record<number, number> = {};
      for (const row of rows) {
        const mo = extractMonth(row[dateCol]);
        const val = row[col];
        if (mo && typeof val === 'number' && !isNaN(val)) {
          map[mo] = (map[mo] ?? 0) + val;
        }
      }
      return MONTH_KR.map((name, i) => ({ name, value: map[i + 1] ?? 0 }));
    }
    if (dateCol) {
      // 연도별 합계
      const map: Record<number, number> = {};
      for (const row of rows) {
        const yr = extractYear(row[dateCol]);
        const val = row[col];
        if (yr && typeof val === 'number' && !isNaN(val)) {
          map[yr] = (map[yr] ?? 0) + val;
        }
      }
      return Object.entries(map)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([yr, value]) => ({ name: `${yr}년`, value }));
    }
    // 날짜 없음 — 상위 10개 행
    return rows.slice(0, 10).map((r, i) => ({
      name: String(i + 1),
      value: typeof r[col] === 'number' ? (r[col] as number) : 0,
    }));
  }, [col, rows, dateCol, hasMonth]);

  const UseChart = hasMonth ? LineChart : BarChart;
  const DataEl = hasMonth
    ? <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3 }} name={col} />
    : <Bar dataKey="value" fill={color} name={col} radius={[4, 4, 0, 0]} />;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-sm font-semibold text-gray-700 mb-4">{col}</p>
      <ResponsiveContainer width="100%" height={200}>
        <UseChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={(v) => fmt(v)} />
          <Tooltip formatter={(v) => [fmt(Number(v)), col]} />
          {DataEl}
        </UseChart>
      </ResponsiveContainer>
    </div>
  );
}

/** 범주형 컬럼 — 파이차트 */
function CategoryChart({ col, rows, colorOffset }: {
  col: string;
  rows: Record<string, unknown>[];
  colorOffset: number;
}) {
  const data = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of rows) {
      const v = row[col];
      if (v === null || v === undefined || v === '') continue;
      const key = String(v);
      map[key] = (map[key] ?? 0) + 1;
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [col, rows]);

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-sm font-semibold text-gray-700 mb-4">{col} 분포</p>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="40%" cy="50%" outerRadius={75} paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[(i + colorOffset) % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [`${v}건`, '']} />
          <Legend iconSize={10} formatter={(val) => <span className="text-xs">{val}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/** 데이터 테이블 (상위 20행) */
function DataTable({ rows, columns }: { rows: Record<string, unknown>[]; columns: string[] }) {
  const preview = rows.slice(0, 20);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-700">데이터 테이블</span>
        <span className="ml-2 text-xs text-gray-400">상위 {preview.length}행 / 전체 {rows.length.toLocaleString()}행</span>
      </div>
      <div className="overflow-x-auto">
        <table className="text-xs whitespace-nowrap w-full">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-left">
              <th className="px-3 py-2.5 font-medium text-gray-400 border-r border-gray-100 sticky left-0 bg-gray-50">행</th>
              {columns.map((col) => (
                <th key={col} className="px-4 py-2.5 font-medium">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {preview.map((row, ri) => (
              <tr key={ri} className="hover:bg-gray-50 transition-colors duration-100">
                <td className="px-3 py-2 text-gray-400 text-center border-r border-gray-100 sticky left-0 bg-white">{ri + 1}</td>
                {columns.map((col) => {
                  const val = row[col];
                  const empty = val === null || val === undefined || val === '';
                  return (
                    <td key={col} className={`px-4 py-2 max-w-[160px] truncate ${empty ? 'text-gray-300 italic' : 'text-gray-700'}`}>
                      {empty ? (
                        <span className="flex items-center gap-1">
                          <AlertTriangle size={10} className="text-amber-400" />null
                        </span>
                      ) : String(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── 메인 ───────────────────────────────────────────────────────────────────

interface Props {
  parsedData: ParsedData;
}

export default function SalesView({ parsedData }: Props) {
  const [activeSheet, setActiveSheet] = useState(parsedData.sheets[0]?.name ?? '');
  const [activeMonth, setActiveMonth] = useState<number | null>(null);

  // 현재 시트 데이터
  const sheet = useMemo(
    () => parsedData.sheets.find((s) => s.name === activeSheet) ?? parsedData.sheets[0],
    [parsedData, activeSheet],
  );

  const { columns, rows } = sheet;

  // 날짜 컬럼 탐지
  const dateCol = useMemo(() => detectDateColumn(columns, rows), [columns, rows]);

  // 월 데이터 여부
  const hasMonth = useMemo(() => {
    if (!dateCol) return false;
    return rows.some((r) => extractMonth(r[dateCol]) !== null);
  }, [rows, dateCol]);

  // 월 필터 적용
  const filteredRows = useMemo(() => {
    if (!dateCol || activeMonth === null) return rows;
    return rows.filter((r) => extractMonth(r[dateCol]) === activeMonth);
  }, [rows, dateCol, activeMonth]);

  const numericCols = useMemo(() => getNumericCols(columns, rows, dateCol), [columns, rows, dateCol]);
  const categoricalCols = useMemo(() => getCategoricalCols(columns, numericCols, dateCol), [columns, numericCols, dateCol]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl">
      {/* 시트 탭 */}
      <SheetTabs
        sheets={parsedData.sheets}
        active={activeSheet}
        onChange={(n) => { setActiveSheet(n); setActiveMonth(null); }}
      />

      {/* 월별 필터 */}
      {hasMonth && (
        <MonthFilter active={activeMonth} onChange={setActiveMonth} />
      )}

      {/* 요약 카드 */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-3">
          {activeMonth ? `${activeMonth}월 요약` : '전체 요약'}
          <span className="ml-2 text-xs font-normal text-gray-400">{filteredRows.length.toLocaleString()}건</span>
        </h2>
        <StatCards rows={filteredRows} numericCols={numericCols} />
      </section>

      {/* 수치형 컬럼 차트 */}
      {numericCols.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            항목별 {activeMonth ? `${activeMonth}월` : hasMonth ? '월별' : dateCol ? '연도별' : ''} 추이
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {numericCols.map((col, i) => (
              <NumericChart
                key={col}
                col={col}
                rows={filteredRows}
                dateCol={dateCol}
                hasMonth={hasMonth && activeMonth === null}
                colorIdx={i}
              />
            ))}
          </div>
        </section>
      )}

      {/* 범주형 컬럼 차트 */}
      {categoricalCols.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3">항목별 분포</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {categoricalCols.slice(0, 4).map((col, i) => (
              <CategoryChart key={col} col={col} rows={filteredRows} colorOffset={i * 2} />
            ))}
          </div>
        </section>
      )}

      {/* 데이터 테이블 */}
      <section>
        <DataTable rows={filteredRows} columns={columns} />
      </section>
    </div>
  );
}
