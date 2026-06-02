'use client';

import { useMemo, useState, useRef, useCallback } from 'react';
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
function NumericChart({ col, rows, dateCol, hasMonth, colorIdx, onBarClick }: {
  col: string;
  rows: Record<string, unknown>[];
  dateCol: string | null;
  hasMonth: boolean;
  colorIdx: number;
  onBarClick: (label: string) => void;
}) {
  const color = COLORS[colorIdx % COLORS.length];

  const data = useMemo(() => {
    if (dateCol && hasMonth) {
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
    return rows.slice(0, 10).map((r, i) => ({
      name: String(i + 1),
      value: typeof r[col] === 'number' ? (r[col] as number) : 0,
    }));
  }, [col, rows, dateCol, hasMonth]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleClick(entry: any) {
    if (!entry?.activePayload?.[0]) return;
    onBarClick(entry.activePayload[0].payload.name);
  }

  const UseChart = hasMonth ? LineChart : BarChart;
  const DataEl = hasMonth
    ? <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3, cursor: 'pointer' }} activeDot={{ r: 5 }} name={col} />
    : <Bar dataKey="value" fill={color} name={col} radius={[4, 4, 0, 0]} cursor="pointer" />;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-sm font-semibold text-gray-700 mb-1">{col}</p>
      <p className="text-xs text-gray-400 mb-3">항목 클릭 시 테이블 검색 적용</p>
      <ResponsiveContainer width="100%" height={200}>
        <UseChart data={data} onClick={handleClick}>
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

/** 범주형 컬럼 — 건수 + 매출액 파이차트 */
function CategoryChart({ col, rows, colorOffset, numericCols, onSliceClick }: {
  col: string;
  rows: Record<string, unknown>[];
  colorOffset: number;
  numericCols: string[];
  onSliceClick: (col: string, value: string) => void;
}) {
  // 건수 집계
  const countData = useMemo(() => {
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

  // 매출액 집계 (첫 번째 수치형 컬럼 기준)
  const amountCol = numericCols[0] ?? null;
  const amountData = useMemo(() => {
    if (!amountCol) return [];
    const map: Record<string, number> = {};
    for (const row of rows) {
      const v = row[col];
      if (v === null || v === undefined || v === '') continue;
      const key = String(v);
      const amt = typeof row[amountCol] === 'number' ? (row[amountCol] as number) : 0;
      map[key] = (map[key] ?? 0) + amt;
    }
    // countData와 같은 카테고리 순서 유지
    const keys = countData.map((d) => d.name);
    return keys.map((name) => ({ name, value: map[name] ?? 0 }));
  }, [col, rows, amountCol, countData]);

  if (countData.length === 0) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleSlice(entry: any) {
    if (entry?.name) onSliceClick(col, String(entry.name));
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 col-span-1 lg:col-span-2">
      <p className="text-sm font-semibold text-gray-700 mb-1">{col} 분포</p>
      <p className="text-xs text-gray-400 mb-3">항목 클릭 시 테이블 검색 적용</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* 건수 차트 */}
        <div>
          <p className="text-xs text-gray-400 text-center mb-2">건수 기준</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={countData} dataKey="value" nameKey="name"
                cx="50%" cy="50%" outerRadius={75} paddingAngle={2}
                cursor="pointer" onClick={handleSlice}
              >
                {countData.map((_, i) => (
                  <Cell key={i} fill={COLORS[(i + colorOffset) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${name}: ${value}건`, '']} />
              <Legend iconSize={10} formatter={(val) => <span className="text-xs">{val}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 매출액 차트 */}
        {amountCol && amountData.some((d) => d.value > 0) ? (
          <div>
            <p className="text-xs text-gray-400 text-center mb-2">{amountCol} 기준</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={amountData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={75} paddingAngle={2}
                  cursor="pointer" onClick={handleSlice}
                >
                  {amountData.map((_, i) => (
                    <Cell key={i} fill={COLORS[(i + colorOffset) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${name}: ${fmt(Number(value))}`, '']} />
                <Legend iconSize={10} formatter={(val) => <span className="text-xs">{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center text-xs text-gray-300">
            수치형 컬럼 없음
          </div>
        )}
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

/** 데이터 테이블 — 컬럼별 검색 + 페이징 */
function DataTable({ rows, columns, filters, onFiltersChange }: {
  rows: Record<string, unknown>[];
  columns: string[];
  filters: Record<string, string>;
  onFiltersChange: (f: Record<string, string>) => void;
}) {
  const [page, setPage] = useState(1);

  // 검색어 변경 시 1페이지로 리셋
  function setFilter(col: string, value: string) {
    onFiltersChange({ ...filters, [col]: value });
    setPage(1);
  }

  // 컬럼별 검색 필터 적용
  const filtered = useMemo(() => {
    const activeFilters = Object.entries(filters).filter(([, v]) => v.trim() !== '');
    if (activeFilters.length === 0) return rows;
    return rows.filter((row) =>
      activeFilters.every(([col, keyword]) =>
        String(row[col] ?? '').toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }, [rows, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // 페이지 번호 목록 (최대 7개 표시)
  const pageNums = useMemo(() => {
    const delta = 3;
    const range: number[] = [];
    for (let i = Math.max(1, safePage - delta); i <= Math.min(totalPages, safePage + delta); i++) {
      range.push(i);
    }
    return range;
  }, [safePage, totalPages]);

  const hasActiveFilter = Object.values(filters).some((v) => v.trim() !== '');

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-sm font-semibold text-gray-700">데이터 테이블</span>
          <span className="ml-2 text-xs text-gray-400">
            {filtered.length.toLocaleString()}건
            {hasActiveFilter && <span className="text-blue-500"> (필터 적용 / 전체 {rows.length.toLocaleString()}건)</span>}
          </span>
        </div>
        {hasActiveFilter && (
          <button
            onClick={() => { onFiltersChange({}); setPage(1); }}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors duration-150"
          >
            필터 초기화
          </button>
        )}
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="text-xs whitespace-nowrap w-full">
          <thead>
            {/* 컬럼명 행 */}
            <tr className="bg-gray-50 text-gray-500 text-left">
              <th className="px-3 py-2.5 font-medium text-gray-400 border-r border-gray-100 sticky left-0 bg-gray-50">행</th>
              {columns.map((col) => (
                <th key={col} className="px-4 py-2.5 font-medium">{col}</th>
              ))}
            </tr>
            {/* 검색 입력 행 */}
            <tr className="bg-white border-b border-gray-100">
              <td className="px-2 py-1.5 border-r border-gray-100 sticky left-0 bg-white" />
              {columns.map((col) => (
                <td key={col} className="px-2 py-1.5">
                  <input
                    type="text"
                    placeholder="검색..."
                    value={filters[col] ?? ''}
                    onChange={(e) => setFilter(col, e.target.value)}
                    className={`w-full min-w-[80px] rounded border px-2 py-1 text-xs outline-none transition-colors duration-150
                      ${filters[col] ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}
                      focus:border-blue-400 focus:bg-blue-50`}
                  />
                </td>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-5 py-8 text-center text-gray-400">
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              pageRows.map((row, ri) => {
                const globalIdx = (safePage - 1) * PAGE_SIZE + ri + 1;
                return (
                  <tr key={ri} className="hover:bg-gray-50 transition-colors duration-100">
                    <td className="px-3 py-2 text-gray-400 text-center border-r border-gray-100 sticky left-0 bg-white">
                      {globalIdx}
                    </td>
                    {columns.map((col) => {
                      const val = row[col];
                      const empty = val === null || val === undefined || val === '';
                      const keyword = filters[col]?.toLowerCase() ?? '';
                      const text = empty ? '' : String(val);
                      const matchIdx = keyword ? text.toLowerCase().indexOf(keyword) : -1;

                      return (
                        <td key={col} className={`px-4 py-2 max-w-[160px] ${empty ? 'text-gray-300 italic' : 'text-gray-700'}`}>
                          {empty ? (
                            <span className="flex items-center gap-1">
                              <AlertTriangle size={10} className="text-amber-400" />null
                            </span>
                          ) : matchIdx >= 0 && keyword ? (
                            <span>
                              {text.slice(0, matchIdx)}
                              <mark className="bg-yellow-200 text-gray-800 rounded-sm">{text.slice(matchIdx, matchIdx + keyword.length)}</mark>
                              {text.slice(matchIdx + keyword.length)}
                            </span>
                          ) : (
                            <span className="truncate block">{text}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 페이징 */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-gray-400">
            {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} / {filtered.length.toLocaleString()}건
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              className="px-2 py-1 rounded text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              «
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-2 py-1 rounded text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ‹
            </button>
            {pageNums.map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors duration-150 ${
                  n === safePage
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-2 py-1 rounded text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ›
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              className="px-2 py-1 rounded text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              »
            </button>
          </div>
        </div>
      )}
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
  const [tableFilters, setTableFilters] = useState<Record<string, string>>({});
  const tableRef = useRef<HTMLDivElement>(null);

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

  // 차트 클릭 → 테이블 필터 설정 + 스크롤
  const applyFilter = useCallback((newFilters: Record<string, string>) => {
    setTableFilters(newFilters);
    setTimeout(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }, []);

  // CategoryChart 슬라이스 클릭
  const handleSliceClick = useCallback((col: string, value: string) => {
    applyFilter({ [col]: value });
  }, [applyFilter]);

  // NumericChart 바/점 클릭 — 날짜 컬럼에 레이블(연도/월 이름) 적용
  const handleBarClick = useCallback((label: string) => {
    if (!dateCol) return;
    // "2023년" → "2023", "1월" → 원본 dateCol 값과 매칭을 위해 숫자 추출
    const year = label.match(/^(\d{4})년$/)?.[1];
    const monthName = MONTH_KR.indexOf(label);  // 0-based, -1이면 월 아님
    if (year) {
      applyFilter({ [dateCol]: year });
    } else if (monthName >= 0) {
      applyFilter({ [dateCol]: String(monthName + 1).padStart(2, '0') });
    } else {
      applyFilter({ [dateCol]: label });
    }
  }, [dateCol, applyFilter]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl">
      {/* 시트 탭 */}
      <SheetTabs
        sheets={parsedData.sheets}
        active={activeSheet}
        onChange={(n) => { setActiveSheet(n); setActiveMonth(null); setTableFilters({}); }}
      />

      {/* 월별 필터 */}
      {hasMonth && (
        <MonthFilter active={activeMonth} onChange={(m) => { setActiveMonth(m); setTableFilters({}); }} />
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
                onBarClick={handleBarClick}
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
              <CategoryChart
                key={col} col={col} rows={filteredRows}
                colorOffset={i * 2} numericCols={numericCols}
                onSliceClick={handleSliceClick}
              />
            ))}
          </div>
        </section>
      )}

      {/* 데이터 테이블 */}
      <section ref={tableRef}>
        <DataTable
          key={`${activeSheet}-${activeMonth}`}
          rows={filteredRows}
          columns={columns}
          filters={tableFilters}
          onFiltersChange={setTableFilters}
        />
      </section>
    </div>
  );
}
