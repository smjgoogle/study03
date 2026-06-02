'use client';

import { DataShape } from '@/types/analysis';
import { Rows3, Columns3, Grid3X3, AlertCircle } from 'lucide-react';

interface Props {
  shape: DataShape;
  fileName: string;
}

interface CardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

function Card({ icon, label, value, sub, highlight }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 ${highlight ? 'border-red-200' : 'border-gray-100'}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${highlight ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
          {icon}
        </div>
        <span className="text-sm text-gray-500 font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${highlight ? 'text-red-600' : 'text-gray-800'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function ShapeInfo({ shape, fileName }: Props) {
  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4 mb-6">
        <h2 className="text-base font-semibold text-gray-800">데이터 형태</h2>
        <p className="text-sm text-gray-500 mt-0.5">{fileName}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card
          icon={<Rows3 size={18} />}
          label="총 행 수"
          value={shape.rows.toLocaleString()}
          sub="rows"
        />
        <Card
          icon={<Columns3 size={18} />}
          label="총 열 수"
          value={shape.cols.toLocaleString()}
          sub="columns"
        />
        <Card
          icon={<Grid3X3 size={18} />}
          label="전체 셀 수"
          value={shape.totalCells.toLocaleString()}
          sub={`${shape.rows} × ${shape.cols}`}
        />
        <Card
          icon={<AlertCircle size={18} />}
          label="총 결측치"
          value={shape.totalMissing.toLocaleString()}
          sub={`${shape.missingPercent.toFixed(1)}% 비율`}
          highlight={shape.missingPercent > 10}
        />
      </div>
    </div>
  );
}
