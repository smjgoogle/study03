'use client';

import { AnalysisResult, MenuKey, ParsedData } from '@/types/analysis';
import DatasetOverview from '@/components/analysis/DatasetOverview';
import SalesView from '@/components/analysis/SalesView';
import { Upload, Loader2 } from 'lucide-react';

interface Props {
  result: AnalysisResult | null;
  parsedData: ParsedData | null;
  activeMenu: MenuKey;
  loading: boolean;
  error: string | null;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
        <Upload size={36} className="text-blue-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">파일을 업로드해 주세요</h2>
      <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
        왼쪽 사이드바에서 CSV 또는 XLSX 파일을 업로드하면
        자동으로 데이터를 분석합니다.
      </p>
      <div className="mt-6 flex gap-3">
        {['.csv', '.xlsx', '.xls'].map((ext) => (
          <span key={ext} className="bg-gray-100 text-gray-500 rounded-full px-3 py-1 text-xs font-medium">
            {ext}
          </span>
        ))}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Loader2 size={36} className="text-blue-500 animate-spin mb-4" />
      <p className="text-gray-500 text-sm">파일 분석 중...</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-5 max-w-md text-center">
        <p className="text-red-600 font-medium mb-1">파일 처리 오류</p>
        <p className="text-red-500 text-sm">{message}</p>
      </div>
    </div>
  );
}

export default function MainPanel({ result, parsedData, activeMenu, loading, error }: Props) {
  return (
    <main className="flex-1 bg-gray-50 min-h-screen overflow-y-auto">
      <div className="h-full">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : !result || !parsedData ? (
          <EmptyState />
        ) : (
          <>
            {activeMenu === 'overview' && <DatasetOverview result={result} />}
            {activeMenu === 'sales'    && <SalesView parsedData={parsedData} />}
          </>
        )}
      </div>
    </main>
  );
}
