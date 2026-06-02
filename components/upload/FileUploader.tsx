'use client';

import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { Upload, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onFile: (file: File) => void;
  loading: boolean;
}

const MAX_SIZE = 10 * 1024 * 1024;

export default function FileUploader({ onFile, loading }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [sizeWarning, setSizeWarning] = useState(false);

  function handleFile(file: File) {
    if (file.size > MAX_SIZE) {
      setSizeWarning(true);
    } else {
      setSizeWarning(false);
    }
    onFile(file);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="px-3 mt-4">
      {sizeWarning && (
        <div className="flex items-center gap-1.5 mb-2 text-amber-400 text-xs">
          <AlertCircle size={12} />
          <span>10MB 초과 파일입니다</span>
        </div>
      )}
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
          transition-colors duration-150 select-none
          ${dragging ? 'border-blue-400 bg-gray-700' : 'border-gray-600 hover:border-gray-400'}
          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <Upload size={20} className="mx-auto mb-2 text-gray-400" />
        <p className="text-xs text-gray-400">
          CSV / XLSX 파일<br />
          <span className="text-gray-500">클릭 또는 드래그</span>
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
