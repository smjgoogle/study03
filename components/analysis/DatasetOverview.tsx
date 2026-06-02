'use client';

import { AnalysisResult, ColumnInfo, DataType } from '@/types/analysis';
import { AlertTriangle } from 'lucide-react';

// ── 타입 레이블 / 배지 ───────────────────────────────────────
const TYPE_LABEL: Record<DataType, string> = {
  continuous: '연속형',
  categorical: '범주형',
  datetime: '날짜형',
  boolean: '불리언',
  unknown: '알수없음',
};

const TYPE_BADGE: Record<DataType, string> = {
  continuous: 'bg-blue-100 text-blue-700',
  categorical: 'bg-green-100 text-green-700',
  datetime: 'bg-purple-100 text-purple-700',
  boolean: 'bg-orange-100 text-orange-700',
  unknown: 'bg-gray-100 text-gray-500',
};

// ── 데이터 범위/예시 렌더링 (타입별 분리) ────────────────────
function renderRange(col: ColumnInfo): string {
  if (col.dtype === 'continuous') {
    const min = typeof col.min === 'number' ? col.min.toLocaleString() : col.min ?? '-';
    const max = typeof col.max === 'number' ? col.max.toLocaleString() : col.max ?? '-';
    const mean = col.mean !== undefined ? col.mean.toLocaleString(undefined, { maximumFractionDigits: 2 }) : null;
    return mean ? `${min} ~ ${max}  (평균 ${mean})` : `${min} ~ ${max}`;
  }
  if (col.dtype === 'datetime') {
    return `${col.min ?? '-'} ~ ${col.max ?? '-'}`;
  }
  if (col.dtype === 'categorical' || col.dtype === 'boolean') {
    const preview = col.sampleValues
      .filter((v) => v !== null)
      .slice(0, 4)
      .join(', ');
    return col.uniqueCount > 4 ? `${preview} …` : preview;
  }
  return '-';
}

// ── 1. 요약 카드 ─────────────────────────────────────────────
function SummaryCards({ result }: { result: AnalysisResult }) {
  const { shape } = result;
  const cards = [
    { label: '전체 행', value: shape.rows.toLocaleString(), sub: 'rows' },
    { label: '전체 열', value: shape.cols.toLocaleString(), sub: 'columns' },
    {
      label: '결측치 수',
      value: shape.totalMissing.toLocaleString(),
      sub: `${shape.missingPercent.toFixed(1)}% 비율`,
      warn: shape.missingPercent > 5,
    },
  ];

  return (
    <section>
      <h2 className="text-base font-semibold text-gray-800 mb-3">데이터셋 요약</h2>
      <div className="grid grid-cols-3 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`bg-white rounded-xl border shadow-sm px-5 py-4 ${
              c.warn ? 'border-amber-200' : 'border-gray-100'
            }`}
          >
            <p className="text-xs text-gray-500 mb-1 font-medium">{c.label}</p>
            <p className={`text-2xl font-bold ${c.warn ? 'text-amber-600' : 'text-gray-800'}`}>
              {c.value}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 2. 컬럼 정보 표 ──────────────────────────────────────────
function ColumnInfoTable({ columns }: { columns: ColumnInfo[] }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-gray-800 mb-3">컬럼 정보</h2>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-left text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">컬럼명</th>
                <th className="px-4 py-3 font-medium">데이터 타입</th>
                <th className="px-4 py-3 font-medium text-right">고유값</th>
                <th className="px-4 py-3 font-medium text-right">결측치 수</th>
                <th className="px-4 py-3 font-medium text-right">결측치 비율</th>
                <th className="px-4 py-3 font-medium">데이터 범위 / 예시</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {columns.map((col, i) => {
                const hasMissing = col.nullCount > 0;
                const isCritical = col.nullPercent > 30;

                return (
                  <tr
                    key={col.name}
                    className="hover:bg-gray-50 transition-colors duration-100"
                  >
                    <td className="px-4 py-3 text-gray-400 tabular-nums">{i + 1}</td>

                    <td className="px-4 py-3 font-mono text-gray-800 font-medium whitespace-nowrap">
                      {col.name}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[col.dtype]}`}>
                        {TYPE_LABEL[col.dtype]}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                      {col.uniqueCount.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right tabular-nums">
                      {hasMissing ? (
                        <span className={isCritical ? 'text-red-600 font-semibold' : 'text-amber-600'}>
                          {col.nullCount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium tabular-nums ${
                          isCritical
                            ? 'bg-red-100 text-red-700'
                            : hasMissing
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {col.nullPercent.toFixed(1)}%
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-600 max-w-[280px]">
                      <span className="text-xs leading-relaxed">{renderRange(col)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ── 3. 데이터 미리보기 ────────────────────────────────────────
const PREVIEW_ROWS = 10;

function DataPreview({ result }: { result: AnalysisResult }) {
  const colNames = result.columns.map((c) => c.name);
  const rows = result.rawData.slice(0, PREVIEW_ROWS);

  return (
    <section>
      <h2 className="text-base font-semibold text-gray-800 mb-3">
        데이터 미리보기
        <span className="ml-2 text-xs font-normal text-gray-400">
          상위 {Math.min(PREVIEW_ROWS, result.rawData.length)}행
        </span>
      </h2>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-3 py-3 font-medium text-gray-400 border-r border-gray-100 sticky left-0 bg-gray-50">
                  행
                </th>
                {colNames.map((col) => (
                  <th key={col} className="px-4 py-3 font-medium text-left">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-gray-50 transition-colors duration-100">
                  <td className="px-3 py-2.5 text-gray-400 tabular-nums text-center border-r border-gray-100 sticky left-0 bg-white">
                    {ri + 1}
                  </td>
                  {colNames.map((col) => {
                    const val = row[col];
                    const isEmpty = val === null || val === undefined || val === '';
                    return (
                      <td
                        key={col}
                        className={`px-4 py-2.5 max-w-[200px] truncate ${
                          isEmpty ? 'text-gray-300 italic' : 'text-gray-700'
                        }`}
                        title={isEmpty ? '' : String(val)}
                      >
                        {isEmpty ? (
                          <span className="flex items-center gap-1">
                            <AlertTriangle size={11} className="text-amber-400 flex-shrink-0" />
                            null
                          </span>
                        ) : (
                          String(val)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ── 메인 ─────────────────────────────────────────────────────
interface Props {
  result: AnalysisResult;
}

export default function DatasetOverview({ result }: Props) {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl">
      <SummaryCards result={result} />
      <ColumnInfoTable columns={result.columns} />
      <DataPreview result={result} />
    </div>
  );
}
