'use client';

import { useState } from 'react';
import { useDataAnalysis } from '@/hooks/useDataAnalysis';
import Sidebar from '@/components/layout/Sidebar';
import MainPanel from '@/components/layout/MainPanel';

export default function Home() {
  const { result, loading, error, processFile } = useDataAnalysis();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleFile(file: File) {
    processFile(file);
    setMobileOpen(false);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        result={result}
        onFile={handleFile}
        loading={loading}
        mobileOpen={mobileOpen}
        onMobileToggle={() => setMobileOpen((v) => !v)}
      />
      <MainPanel result={result} loading={loading} error={error} />
    </div>
  );
}
