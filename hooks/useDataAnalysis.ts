'use client';

import { useState, useCallback } from 'react';
import { AnalysisResult } from '@/types/analysis';
import { parseFile } from '@/utils/parseFile';
import { analyzeData } from '@/utils/analyzeData';

interface UseDataAnalysisReturn {
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  processFile: (file: File) => Promise<void>;
  reset: () => void;
}

export function useDataAnalysis(): UseDataAnalysisReturn {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await parseFile(file);
      const analysis = analyzeData(data, file.name);
      setResult(analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : '파일 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return { result, loading, error, processFile, reset };
}
