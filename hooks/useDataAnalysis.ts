'use client';

import { useState, useCallback } from 'react';
import { AnalysisResult, ParsedData } from '@/types/analysis';
import { parseFile } from '@/utils/parseFile';
import { analyzeData } from '@/utils/analyzeData';

interface UseDataAnalysisReturn {
  parsedData: ParsedData | null;
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  processFile: (file: File) => Promise<void>;
  reset: () => void;
}

export function useDataAnalysis(): UseDataAnalysisReturn {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setParsedData(null);
    setResult(null);

    try {
      const parsed = await parseFile(file);
      setParsedData(parsed);
      const analysis = analyzeData(parsed, file.name);
      setResult(analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : '파일 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setParsedData(null);
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return { parsedData, result, loading, error, processFile, reset };
}
