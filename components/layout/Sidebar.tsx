'use client';

import { BarChart2, X, Menu } from 'lucide-react';
import { AnalysisResult } from '@/types/analysis';
import FileUploader from '@/components/upload/FileUploader';

interface Props {
  result: AnalysisResult | null;
  onFile: (file: File) => void;
  loading: boolean;
  mobileOpen: boolean;
  onMobileToggle: () => void;
}

export default function Sidebar({ result, onFile, loading, mobileOpen, onMobileToggle }: Props) {
  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={onMobileToggle}
        className="fixed top-4 left-4 z-50 md:hidden bg-gray-800 text-white p-2 rounded-lg shadow-lg"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onMobileToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static top-0 left-0 h-full z-40
          w-64 bg-gray-900 flex flex-col flex-shrink-0
          transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <BarChart2 size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm leading-tight">Data Explorer</h1>
              <p className="text-gray-500 text-xs">CSV / XLSX 분석기</p>
            </div>
          </div>
        </div>

        {/* File uploader */}
        <div className="border-b border-gray-800 pb-4">
          <p className="px-5 pt-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
            파일 업로드
          </p>
          <FileUploader onFile={onFile} loading={loading} />
          {result && (
            <div className="px-5 mt-3">
              <p className="text-xs text-gray-400 truncate" title={result.fileName}>
                📄 {result.fileName}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {result.shape.rows.toLocaleString()}행 × {result.shape.cols}열
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center px-5">
          <p className="text-xs text-gray-600 text-center leading-relaxed">
            {result
              ? `${result.columns.length}개 컬럼 분석 완료`
              : '파일을 업로드하면\n분석 결과가 표시됩니다'}
          </p>
        </div>
      </aside>
    </>
  );
}
