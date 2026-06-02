'use client';

import { ColumnInfo, DataType } from '@/types/analysis';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TYPE_CONFIG: Record<DataType, { label: string; color: string }> = {
  continuous: { label: '연속형', color: '#3b82f6' },
  categorical: { label: '범주형', color: '#22c55e' },
  datetime: { label: '날짜형', color: '#a855f7' },
  boolean: { label: '불리언', color: '#f97316' },
  unknown: { label: '알수없음', color: '#9ca3af' },
};

interface Props {
  columns: ColumnInfo[];
}

export default function DataTypeChart({ columns }: Props) {
  const countMap: Partial<Record<DataType, number>> = {};
  for (const col of columns) {
    countMap[col.dtype] = (countMap[col.dtype] ?? 0) + 1;
  }

  const chartData = (Object.entries(countMap) as [DataType, number][]).map(([type, count]) => ({
    name: TYPE_CONFIG[type].label,
    value: count,
    color: TYPE_CONFIG[type].color,
    type,
  }));

  const grouped: Partial<Record<DataType, ColumnInfo[]>> = {};
  for (const col of columns) {
    if (!grouped[col.dtype]) grouped[col.dtype] = [];
    grouped[col.dtype]!.push(col);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-800">데이터 타입 분포</h2>
        <p className="text-sm text-gray-500 mt-0.5">컬럼 타입별 구성 비율</p>
      </div>
      <div className="p-6 flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value}개`]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-4">
          {(Object.entries(grouped) as [DataType, ColumnInfo[]][]).map(([type, cols]) => (
            <div key={type}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: TYPE_CONFIG[type].color }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {TYPE_CONFIG[type].label}
                </span>
                <span className="text-xs text-gray-400">{cols.length}개</span>
              </div>
              <div className="flex flex-wrap gap-1 ml-4">
                {cols.map((col) => (
                  <span
                    key={col.name}
                    className="text-xs font-mono bg-gray-100 text-gray-600 rounded px-2 py-0.5"
                  >
                    {col.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
