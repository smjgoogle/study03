'use client';

import { ColumnInfo } from '@/types/analysis';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  columns: ColumnInfo[];
}

export default function MissingValues({ columns }: Props) {
  const sorted = [...columns].sort((a, b) => b.nullPercent - a.nullPercent);
  const hasAnyMissing = sorted.some((c) => c.nullCount > 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-800">결측치 분석</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {hasAnyMissing
            ? `${sorted.filter((c) => c.nullCount > 0).length}개 컬럼에 결측치 존재`
            : '결측치가 없습니다'}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-left">
              <th className="px-6 py-3 font-medium">컬럼명</th>
              <th className="px-6 py-3 font-medium">결측 수</th>
              <th className="px-6 py-3 font-medium">비율</th>
              <th className="px-6 py-3 font-medium w-48">시각화</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((col) => {
              const isClean = col.nullCount === 0;
              const isCritical = col.nullPercent > 50;

              return (
                <tr key={col.name} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-3 font-mono text-gray-800 font-medium">{col.name}</td>
                  <td className={`px-6 py-3 ${isCritical ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                    {isClean ? (
                      <span className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle2 size={14} />
                        0
                      </span>
                    ) : (
                      col.nullCount.toLocaleString()
                    )}
                  </td>
                  <td className={`px-6 py-3 font-medium ${isCritical ? 'text-red-600' : isClean ? 'text-green-600' : 'text-gray-600'}`}>
                    {col.nullPercent.toFixed(1)}%
                  </td>
                  <td className="px-6 py-3">
                    {isClean ? (
                      <div className="h-2 bg-green-100 rounded-full" />
                    ) : (
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCritical ? 'bg-red-500' : col.nullPercent > 20 ? 'bg-amber-400' : 'bg-blue-400'
                          }`}
                          style={{ width: `${Math.min(col.nullPercent, 100)}%` }}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
