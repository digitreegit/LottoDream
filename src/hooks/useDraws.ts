// ============================================
// Custom hook for loading and analyzing draws
// ============================================
import { useState, useEffect, useCallback } from 'react';
import { Draw, AnalysisResult, GameType } from '../types';
import { fetchDrawsFromAPI, getAllDraws, fetchAndSyncDraws } from '../services/drawService';
import { multiRangeAnalysis } from '../services/analysisEngine';
import { getGameConfig } from '../config/constants';

interface UseDrawsReturn {
  draws: Draw[];
  loading: boolean;
  error: string | null;
  analysis: Record<string, AnalysisResult> | null;
  refresh: () => Promise<void>;
  latestDraw: Draw | null;
}

export function useDraws(game: GameType = 'powerball'): UseDrawsReturn {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, AnalysisResult> | null>(null);

  const loadDraws = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const config = getGameConfig(game);
      // Try Supabase first, fall back to direct API
      let data: Draw[];
      try {
        await fetchAndSyncDraws(game);
        data = await getAllDraws(game);
      } catch {
        // Supabase not configured — use API directly
        data = await fetchDrawsFromAPI(2000, game);
      }
      setDraws(data);
      if (data.length > 0) {
        setAnalysis(multiRangeAnalysis(data, config));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load draws');
    } finally {
      setLoading(false);
    }
  }, [game]);

  useEffect(() => {
    loadDraws();
  }, [loadDraws]);

  return {
    draws,
    loading,
    error,
    analysis,
    refresh: loadDraws,
    latestDraw: draws.length > 0 ? draws[0] : null,
  };
}
