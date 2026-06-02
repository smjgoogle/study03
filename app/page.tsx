'use client';

import { useState } from 'react';
import { MenuKey } from '@/types/analysis';
import { useDataAnalysis } from '@/hooks/useDataAnalysis';
import Sidebar from '@/components/layout/Sidebar';
import MainPanel from '@/components/layout/MainPanel';

export default function Home() {
  const { result, parsedData, loading, error, processFile } = useDataAnalysis();
  const [activeMenu, setActiveMenu] = useState<MenuKey>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleFile(file: File) {
    processFile(file);
    setActiveMenu('overview');
    setMobileOpen(false);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        result={result}
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
        onFile={handleFile}
        loading={loading}
        mobileOpen={mobileOpen}
        onMobileToggle={() => setMobileOpen((v) => !v)}
      />
      <MainPanel
        result={result}
        parsedData={parsedData}
        activeMenu={activeMenu}
        loading={loading}
        error={error}
      />
    </div>
  );
}
