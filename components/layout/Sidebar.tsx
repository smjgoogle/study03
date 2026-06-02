'use client';

import { BarChart2, X, Menu, LayoutDashboard, TrendingUp } from 'lucide-react';
import { AnalysisResult, MenuKey } from '@/types/analysis';
import FileUploader from '@/components/upload/FileUploader';

const MENU_ITEMS: { key: MenuKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: '데이터 개요', icon: <LayoutDashboard size={16} /> },
  { key: 'sales',    label: '매출내역',   icon: <TrendingUp size={16} /> },
];

interface Props {
  result: AnalysisResult | null;
  activeMenu: MenuKey;
  onMenuChange: (key: MenuKey) => void;
  onFile: (file: File) => void;
  loading: boolean;
  mobileOpen: boolean;
  onMobileToggle: () => void;
}

export default function Sidebar({
  result, activeMenu, onMenuChange, onFile, loading, mobileOpen, onMobileToggle,
}: Props) {
  return (
    <>
      <button
        onClick={onMobileToggle}
        className="fixed top-4 left-4 z-50 md:hidden bg-gray-800 text-white p-2 rounded-lg shadow-lg"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onMobileToggle} />
      )}

      <aside className={`
        fixed md:static top-0 left-0 h-full z-40
        w-64 bg-gray-900 flex flex-col flex-shrink-0
        transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
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

        {/* Menu */}
        {result ? (
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <p className="px-2 pb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              메뉴
            </p>
            {MENU_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => { onMenuChange(item.key); onMobileToggle(); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                  transition-colors duration-150 text-left
                  ${activeMenu === item.key
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}
                `}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        ) : (
          <div className="flex-1 flex items-center justify-center px-5">
            <p className="text-xs text-gray-600 text-center leading-relaxed">
              파일을 업로드하면<br />분석 결과가 표시됩니다
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
