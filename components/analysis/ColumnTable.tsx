'use client';

import { ColumnInfo, DataType } from '@/types/analysis';

const BADGE: Record<DataType, string> = {
  continuous: 'bg-blue-100 text-blue-700',
  categorical: 'bg-green-100 text-green-700',
  datetime: 'bg-purple-100 text-purple-700',
  boolean: 'bg-orange-100 text-orange-700',
  unknown: 'bg-gray-100 text-gray-500',
};

const LABEL: Record<DataType, string> = {
  continuous: '연속형',
  categorical: '범주형',
  datetime: '날짜형',
  boolean: '불리언',
  unknown: '알수없음',
};

interface Props {
  columns: ColumnInfo[];
}

export default function ColumnTable({ columns }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-800">컬럼 정보</h2>
        <p className="text-sm text-gray-500 mt-0.5">총 {columns.length}개 컬럼</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-left">
              <th className="px-6 py-3 font-medium">#</th>
              <th className="px-6 py-3 font-medium">컬럼명</th>
              <th className="px-6 py-3 font-medium">타입</th>
              <th className="px-6 py-3 font-medium">고유값</th>
              <th className="px-6 py-3 font-medium">샘플 값</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {columns.map((col, i) => (
              <tr key={col.name} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-3 text-gray-400">{i + 1}</td>
                <td className="px-6 py-3 font-mono text-gray-800 font-medium">{col.name}</td>
                <td className="px-6 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE[col.dtype]}`}>
                    {LABEL[col.dtype]}
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-600">{col.uniqueCount.toLocaleString()}</td>
                <td className="px-6 py-3">
                  <div className="flex flex-wrap gap-1">
                    {col.sampleValues.slice(0, 3).map((v, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 text-xs font-mono max-w-[120px] truncate"
                      >
                        {v === null ? 'null' : String(v)}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
