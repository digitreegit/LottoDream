// ============================================
// Predict Screen - Number Generation
// ============================================
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LottoRow } from '../components/LottoBall';
import { useDraws } from '../hooks/useDraws';
import { useGame, GameSelector } from '../hooks/useGame';
import { useAuth } from '../hooks/useAuth';
import { generatePrediction, generateAllPredictions } from '../services/predictionEngine';
import { purchasePredictionSet, savePredictionSet } from '../services/ticketService';
import { PredictionSet, PredictionMode } from '../types';

const MODE_INFO: Record<PredictionMode, { icon: string; label: string; desc: string }> = {
  hot: {
    icon: '🔥',
    label: 'Hot Numbers',
    desc: '자주 출현한 번호 위주',
  },
  cold: {
    icon: '❄️',
    label: 'Cold Numbers',
    desc: '오래 안 나온 번호 위주',
  },
  balanced: {
    icon: '⚖️',
    label: 'Balanced Mix',
    desc: '핫+콜드+중간 혼합',
  },
  anticrowd: {
    icon: '🎯',
    label: 'Anti-Crowd',
    desc: '사람들이 잘 안 고르는 패턴',
  },
  random: {
    icon: '🎲',
    label: 'Pure Random',
    desc: '완전 랜덤 추첨',
  },
};

export function PredictScreen() {
  const { game, config } = useGame();
  const { user } = useAuth();
  const { draws, loading: dataLoading } = useDraws(game);
  const [predictions, setPredictions] = useState<PredictionSet[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedMode, setSelectedMode] = useState<PredictionMode | null>(null);

  const handleGenerateAll = useCallback(() => {
    if (draws.length === 0) {
      Alert.alert('No Data', 'Please wait for draw data to load');
      return;
    }
    setGenerating(true);
    // Run in next tick to allow UI update
    setTimeout(() => {
      const results = generateAllPredictions(draws, game);
      setPredictions(results);
      setSelectedMode(null);
      setGenerating(false);
    }, 100);
  }, [draws]);

  const handleGenerateSingle = useCallback(
    (mode: PredictionMode) => {
      if (draws.length === 0) return;
      setGenerating(true);
      setTimeout(() => {
        const result = generatePrediction(draws, mode, game);
        setPredictions((prev) => {
          const filtered = prev.filter((p) => p.mode !== mode);
          return [result, ...filtered];
        });
        setSelectedMode(mode);
        setGenerating(false);
      }, 100);
    },
    [draws]
  );

  const handleSave = useCallback(async (prediction: PredictionSet) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to save numbers.');
      return;
    }

    const { error } = await savePredictionSet(prediction);
    if (error) {
      Alert.alert('Save Failed', error);
      return;
    }

    Alert.alert('Saved', 'Your number set was saved to your account.');
  }, [user]);

  const handleBuy = useCallback(async (prediction: PredictionSet) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to purchase tickets.');
      return;
    }

    const { error } = await purchasePredictionSet(prediction);
    if (error) {
      Alert.alert('Purchase Failed', error);
      return;
    }

    Alert.alert('Ticket Purchased', `Ticket saved for the next ${config.name} draw.`);
  }, [config.name, user]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>🎯 Smart Picks</Text>
      <Text style={styles.subtitle}>
        AI-powered number recommendations based on{'\n'}
        {draws.length.toLocaleString()} historical {config.name} draws
      </Text>

      {/* Game Selector */}
      <GameSelector />

      {/* Mode Selector */}
      <View style={styles.modeGrid}>
        {(Object.keys(MODE_INFO) as PredictionMode[]).map((mode) => {
          const info = MODE_INFO[mode];
          const isActive = selectedMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              style={[styles.modeCard, isActive && styles.modeCardActive]}
              onPress={() => handleGenerateSingle(mode)}
              disabled={generating || dataLoading}
            >
              <Text style={styles.modeIcon}>{info.icon}</Text>
              <Text style={[styles.modeLabel, isActive && styles.modeLabelActive]}>
                {info.label}
              </Text>
              <Text style={styles.modeDesc}>{info.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Generate All Button */}
      <TouchableOpacity
        style={styles.generateButton}
        onPress={handleGenerateAll}
        disabled={generating || dataLoading}
      >
        {generating ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.generateText}>⚡ Generate All 5 Modes</Text>
        )}
      </TouchableOpacity>

      {/* Results */}
      {predictions.length > 0 && (
        <View style={styles.results}>
          <Text style={styles.resultsTitle}>Generated Numbers</Text>
          {predictions.map((pred) => {
            const info = MODE_INFO[pred.mode];
            return (
              <View key={pred.id} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultMode}>
                    {info.icon} {info.label}
                  </Text>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>Score: {pred.score}</Text>
                  </View>
                </View>

                <View style={styles.resultBalls}>
                  <LottoRow
                    whites={pred.whites}
                    powerball={pred.powerball}
                    game={game}
                    size={44}
                  />
                </View>

                <Text style={styles.resultExplain}>{pred.explanation}</Text>

                <View style={styles.resultActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleSave(pred)}>
                    <Text style={styles.actionText}>💾 Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleGenerateSingle(pred.mode)}
                  >
                    <Text style={styles.actionText}>🔄 Regenerate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.buyButton]}
                    onPress={() => handleBuy(pred)}
                  >
                    <Text style={[styles.actionText, styles.buyText]}>
                      🎫 Buy Ticket
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Info */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>ℹ️ How it works</Text>
        <Text style={styles.disclaimerText}>
          Our algorithm analyzes historical {config.name} data including frequency patterns,
          hot/cold trends, pair correlations, and distribution balance. While mathematical
          probability of winning remains the same for all combinations, our analysis helps
          you avoid common patterns and make statistically informed choices.
        </Text>
        <Text style={styles.disclaimerWarn}>
          Lottery is a game of chance. Past results do not guarantee future outcomes.
          Please play responsibly.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1426',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  subtitle: {
    fontSize: 13,
    color: '#A0AEC0',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  modeCard: {
    width: '47%',
    backgroundColor: '#1A2744',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  modeCardActive: {
    borderColor: '#3182CE',
    backgroundColor: '#1E3A5F',
  },
  modeIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  modeLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  modeLabelActive: {
    color: '#63B3ED',
  },
  modeDesc: {
    color: '#718096',
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  generateButton: {
    backgroundColor: '#38A169',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  generateText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  results: {
    gap: 12,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  resultCard: {
    backgroundColor: '#1A2744',
    borderRadius: 16,
    padding: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultMode: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  scoreBadge: {
    backgroundColor: '#2D3748',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scoreText: {
    color: '#F6AD55',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  resultBalls: {
    alignItems: 'center',
    marginVertical: 12,
  },
  resultExplain: {
    color: '#A0AEC0',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  resultActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2D3748',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  buyButton: {
    backgroundColor: '#3182CE',
  },
  buyText: {
    fontWeight: '700',
  },
  disclaimer: {
    marginTop: 24,
    backgroundColor: '#1A2744',
    borderRadius: 14,
    padding: 16,
  },
  disclaimerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  disclaimerText: {
    color: '#A0AEC0',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  disclaimerWarn: {
    color: '#F6AD55',
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});
