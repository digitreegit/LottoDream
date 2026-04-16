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
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { LottoRow } from '../components/LottoBall';
import { useDraws } from '../hooks/useDraws';
import { useGame, GameSelector } from '../hooks/useGame';
import { useAuth } from '../hooks/useAuth';
import { isWebDashboard, webDash, nativeDash } from '../theme/webDashboard';
import { landingCtaPrimaryButton, landingCtaPrimaryButtonText } from '../theme/landingCta';

const W = isWebDashboard;
const C = W ? webDash : nativeDash;
import { generatePrediction, generateAllPredictions, generateLuckyDatesPrediction, extractNumbersFromDate } from '../services/predictionEngine';
import { savePredictionSet } from '../services/ticketService';
import { PredictionSet, PredictionMode, LuckyDate } from '../types';

function notify(title: string, message?: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  if (message) {
    Alert.alert(title, message);
  } else {
    Alert.alert(title);
  }
}

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
  lucky: {
    icon: '✨',
    label: 'Lucky Dates',
    desc: '특별한 날짜 기반 픽',
  },
};

export function PredictScreen() {
  const { game, config } = useGame();
  const { user } = useAuth();
  const { draws, loading: dataLoading } = useDraws(game);
  const [predictions, setPredictions] = useState<PredictionSet[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedMode, setSelectedMode] = useState<PredictionMode | null>(null);

  // Lucky Dates state
  const [luckyDates, setLuckyDates] = useState<LuckyDate[]>([]);
  const [showLuckyPanel, setShowLuckyPanel] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newWeight, setNewWeight] = useState<1 | 2 | 3>(2);

  const handleGenerateAll = useCallback(() => {
    if (draws.length === 0) {
      notify(
        '\uB370\uC774\uD130 \uC5C6\uC74C',
        '\uB2F9\uCCA8 \uBC88\uD638 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.'
      );
      return;
    }
    setGenerating(true);
    // Run in next tick to allow UI update
    setTimeout(() => {
      try {
        const results = generateAllPredictions(draws, game);
        setPredictions(results);
        setSelectedMode(null);
      } catch (e: any) {
        notify('생성 실패', e?.message || '번호 조합을 만들 수 없습니다.');
      } finally {
        setGenerating(false);
      }
    }, 100);
  }, [draws, game]);

  const handleGenerateSingle = useCallback(
    (mode: PredictionMode) => {
      if (draws.length === 0) {
        notify(
          '\uB370\uC774\uD130 \uC5C6\uC74C',
          '\uB2F9\uCCA8 \uBC88\uD638 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.'
        );
        return;
      }
      setGenerating(true);
      setTimeout(() => {
        try {
          const result = generatePrediction(draws, mode, game);
          setPredictions((prev) => {
            const filtered = prev.filter((p) => p.mode !== mode);
            return [result, ...filtered];
          });
          setSelectedMode(mode);
        } catch (e: any) {
          notify('생성 실패', e?.message || '이 모드의 번호를 다시 만들 수 없습니다.');
        } finally {
          setGenerating(false);
        }
      }, 100);
    },
    [draws, game]
  );

  const handleSave = useCallback(async (prediction: PredictionSet) => {
    if (!user) {
      notify('로그인 필요', '번호를 저장하려면 로그인해주세요.');
      return;
    }

    const { error } = await savePredictionSet(prediction);
    if (error) {
      notify('저장 실패', error);
      return;
    }

    notify('\uC800\uC7A5 \uC644\uB8CC', '\uC120\uD0DD\uD55C \uBC88\uD638 \uC870\uD569\uC774 \uACC4\uC815\uC5D0 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4.');
  }, [user]);

  const handleAddLuckyDate = useCallback(() => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!newLabel.trim()) {
      notify(
        '\uC774\uB984 \uC5C6\uC74C',
        '\uB0A0\uC9DC \uC774\uB984\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694. (\uC608: \uC0DD\uC77C, \uAE30\uB150\uC77C)'
      );
      return;
    }
    if (!dateRegex.test(newDate.trim())) {
      notify(
        '\uB0A0\uC9DC \uD615\uC2DD \uC624\uB958',
        'YYYY-MM-DD \uD615\uC2DD\uC73C\uB85C \uC785\uB825\uD574\uC8FC\uC138\uC694. (\uC608: 1990-03-15)'
      );
      return;
    }
    setLuckyDates((prev) => [
      ...prev,
      { id: `ld_${Date.now()}`, label: newLabel.trim(), date: newDate.trim(), weight: newWeight },
    ]);
    setNewLabel('');
    setNewDate('');
    setNewWeight(2);
  }, [newLabel, newDate, newWeight]);

  const handleRemoveLuckyDate = useCallback((id: string) => {
    setLuckyDates((prev) => prev.filter((ld) => ld.id !== id));
  }, []);

  const handleGenerateLucky = useCallback(() => {
    if (luckyDates.length === 0) return;
    if (draws.length === 0) {
      notify(
        '\uB370\uC774\uD130 \uC5C6\uC74C',
        '\uB2F9\uCCA8 \uBC88\uD638 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.'
      );
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      try {
        const result = generateLuckyDatesPrediction(draws, luckyDates, game);
        setPredictions((prev) => {
          const filtered = prev.filter((p) => p.mode !== 'lucky');
          return [result, ...filtered];
        });
        setSelectedMode('lucky');
      } catch (e: any) {
        notify(
          '\uC0DD\uC131 \uC2E4\uD328',
          e?.message || '\uB7EC\uD0A4 \uD53D\uC744 \uB9CC\uB4E4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.'
        );
      } finally {
        setGenerating(false);
      }
    }, 100);
  }, [luckyDates, draws, game]);


  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="on-drag"
    >
      <Text style={styles.title}>🎯 Smart Picks</Text>
      <Text style={styles.subtitle}>
        AI-powered number recommendations based on{'\n'}
        {draws.length.toLocaleString()} historical {config.name} draws
      </Text>

      {/* Game Selector */}
      <GameSelector light={isWebDashboard} />

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

      {/* ── Lucky Dates Panel ── */}
      <View style={styles.luckyPanel}>
        <TouchableOpacity
          style={styles.luckyPanelHeader}
          onPress={() => setShowLuckyPanel(!showLuckyPanel)}
        >
          <View>
            <Text style={styles.luckyPanelTitle}>✨ Lucky Dates</Text>
            <Text style={styles.luckyPanelSubtitle}>
              생일·기념일로 나만의 번호 조합 만들기
            </Text>
          </View>
          <Text style={styles.luckyPanelChevron}>{showLuckyPanel ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showLuckyPanel && (
          <>
            <Text style={styles.luckyPanelDesc}>
              특별한 날짜에서 숫자를 추출하고 가중치를 설정하면 해당 번호들이 우선적으로 반영된 픽을 생성해요.
            </Text>

            {/* Input Form */}
            <View style={styles.luckyForm}>
              <TextInput
                style={styles.luckyInput}
                placeholder="이름 (예: 생일, 결혼기념일)"
                placeholderTextColor={W ? '#94A3B8' : '#4A5568'}
                value={newLabel}
                onChangeText={setNewLabel}
              />
              <TextInput
                style={styles.luckyInput}
                placeholder="날짜: YYYY-MM-DD"
                placeholderTextColor={W ? '#94A3B8' : '#4A5568'}
                value={newDate}
                onChangeText={setNewDate}
                keyboardType="numbers-and-punctuation"
              />
              <View style={styles.luckyWeightRow}>
                <Text style={styles.luckyWeightLabel}>가중치</Text>
                {([1, 2, 3] as const).map((w) => (
                  <TouchableOpacity
                    key={w}
                    style={[styles.luckyWeightBtn, newWeight === w && styles.luckyWeightBtnActive]}
                    onPress={() => setNewWeight(w)}
                  >
                    <Text
                      style={[
                        styles.luckyWeightBtnText,
                        newWeight === w && styles.luckyWeightBtnTextActive,
                      ]}
                    >
                      {w === 1 ? '●○○' : w === 2 ? '●●○' : '●●●'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.luckyAddBtn} onPress={handleAddLuckyDate}>
                <Text style={styles.luckyAddBtnText}>+ 날짜 추가</Text>
              </TouchableOpacity>
            </View>

            {/* Saved dates list */}
            {luckyDates.length > 0 && (
              <View style={styles.luckyDatesList}>
                {luckyDates.map((ld) => {
                  const extracted = extractNumbersFromDate(ld.date, config.whiteMax);
                  return (
                    <View key={ld.id} style={styles.luckyDateRow}>
                      <View style={styles.luckyDateMain}>
                        <View style={styles.luckyDateTopRow}>
                          <Text style={styles.luckyDateLabel}>{ld.label}</Text>
                          <Text style={styles.luckyDateValue}>{ld.date}</Text>
                          <Text style={styles.luckyDateWeight}>
                            {ld.weight === 1 ? '●○○' : ld.weight === 2 ? '●●○' : '●●●'}
                          </Text>
                        </View>
                        {extracted.length > 0 && (
                          <View style={styles.luckyExtractedRow}>
                            <Text style={styles.luckyExtractedLabel}>추출: </Text>
                            {extracted.map((n) => (
                              <View key={n} style={styles.luckyExtractedChip}>
                                <Text style={styles.luckyExtractedNum}>{n}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.luckyRemoveBtn}
                        onPress={() => handleRemoveLuckyDate(ld.id)}
                      >
                        <Text style={styles.luckyRemoveBtnText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Generate button */}
            {luckyDates.length > 0 && (
              <TouchableOpacity
                style={styles.luckyGenerateBtn}
                onPress={handleGenerateLucky}
                disabled={generating || dataLoading}
              >
                {generating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.luckyGenerateBtnText}>✨ Lucky Pick 생성</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

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
                {pred.backtest && pred.backtest.sampleSize > 0 && (
                  <Text style={styles.backtestText}>
                    Backtest {pred.backtest.sampleSize}회: 평균 화이트 매치 {pred.backtest.avgWhiteMatches.toFixed(2)} /
                    보너스 적중률 {(pred.backtest.powerballHitRate * 100).toFixed(1)}% /
                    3등급+ 유사 매치율 {(pred.backtest.tier3PlusRate * 100).toFixed(1)}%
                  </Text>
                )}

                <View style={styles.resultActions}>
                  <Pressable
                    style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                    onPress={() => handleSave(pred)}
                    android_ripple={{ color: '#4A5568' }}
                  >
                    <Text style={styles.actionText}>💾 Save</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                    onPress={() => handleGenerateSingle(pred.mode)}
                    android_ripple={{ color: '#4A5568' }}
                  >
                    <Text style={styles.actionText}>🔄 Regenerate</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Score Explanation Box */}
      {predictions.length > 0 && (
        <View style={styles.scoreExplainBox}>
          <Text style={styles.scoreExplainTitle}>📊 Score란?</Text>
          <Text style={styles.scoreExplainBody}>
            Score는 실제 당첨 확률이 아니라, 생성된 번호 조합이{' '}
            <Text style={styles.scoreExplainHighlight}>역대 당첨 번호들의 패턴</Text>과
            얼마나 유사한지를 0~100으로 나타내는 통계적 품질 지표예요.
          </Text>
          <View style={styles.scoreExplainRows}>
            {[
              { label: '홀짝 비율', desc: '홀수 2~3개 / 짝수 2~3개', bonus: '+5' },
              { label: '저고 비율', desc: '저번호(1~34) 2~3개 / 고번호 2~3개', bonus: '+5' },
              { label: '합계 범위', desc: '5개 번호의 합이 100~200 사이', bonus: '+5' },
              { label: '평균 근접', desc: '역대 평균 합계와 30 이내 차이', bonus: '+3' },
              { label: '연속 번호', desc: '연속 번호 포함 (역대 출현율 20%+)', bonus: '+2' },
            ].map((row) => (
              <View key={row.label} style={styles.scoreExplainRow}>
                <View style={styles.scoreExplainRowLeft}>
                  <Text style={styles.scoreExplainRowLabel}>{row.label}</Text>
                  <Text style={styles.scoreExplainRowDesc}>{row.desc}</Text>
                </View>
                <Text style={styles.scoreExplainRowBonus}>{row.bonus}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.scoreExplainNote}>
            로또는 모든 조합의 실제 당첨 확률이 동일합니다. Score가 높을수록 통계적으로 자연스러운 조합일 뿐이에요.
          </Text>
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
    backgroundColor: C.screenBg,
  },
  content: {
    paddingBottom: 40,
    ...Platform.select({
      web: { paddingHorizontal: 0, paddingTop: 12 },
      default: { padding: 16 },
    }),
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: C.textPrimary,
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  subtitle: {
    fontSize: 13,
    color: W ? webDash.textSecondary : '#A0AEC0',
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
    backgroundColor: W ? webDash.cardBg : '#1A2744',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: W ? webDash.cardBorder : '#2D3748',
  },
  modeCardActive: {
    borderColor: W ? webDash.accent : '#3182CE',
    backgroundColor: W ? 'rgba(0, 163, 131, 0.12)' : '#1E3A5F',
  },
  modeIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  modeLabel: {
    color: C.textPrimary,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  modeLabelActive: {
    color: W ? webDash.accent : '#63B3ED',
  },
  modeDesc: {
    color: W ? webDash.textMuted : '#718096',
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  generateButton: {
    ...(W ? landingCtaPrimaryButton : {}),
    backgroundColor: W ? landingCtaPrimaryButton.backgroundColor : '#38A169',
    borderRadius: W ? landingCtaPrimaryButton.borderRadius : 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' as const } as object) : null),
  },
  generateText: {
    ...(W ? landingCtaPrimaryButtonText : {}),
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
    color: C.textPrimary,
    marginBottom: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  resultCard: {
    backgroundColor: C.cardBg,
    borderRadius: 16,
    padding: 16,
    ...(W ? { borderWidth: 1, borderColor: webDash.cardBorder } : {}),
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultMode: {
    color: C.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  scoreBadge: {
    backgroundColor: W ? '#E2E8F0' : '#2D3748',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scoreText: {
    color: W ? '#D97706' : '#F6AD55',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  resultBalls: {
    alignItems: 'center',
    marginVertical: 12,
  },
  resultExplain: {
    color: W ? webDash.textSecondary : '#A0AEC0',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  backtestText: {
    color: W ? webDash.linkBlue : '#90CDF4',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  resultActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: W ? webDash.cardBg : '#2D3748',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: W ? 1 : 0,
    borderColor: W ? webDash.cardBorder : 'transparent',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' as const } as object) : null),
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionText: {
    color: W ? webDash.textPrimary : '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  disclaimer: {
    marginTop: 16,
    backgroundColor: C.cardBg,
    borderRadius: 14,
    padding: 16,
    ...(W ? { borderWidth: 1, borderColor: webDash.cardBorder } : {}),
  },

  /* Score Explanation Box */
  scoreExplainBox: {
    marginTop: 12,
    backgroundColor: W ? webDash.cardBg : '#0F1E38',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: W ? webDash.cardBorder : '#2D3748',
    padding: 16,
  },
  scoreExplainTitle: {
    color: C.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  scoreExplainBody: {
    color: W ? webDash.textSecondary : '#A0AEC0',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  scoreExplainHighlight: {
    color: W ? webDash.accent : '#F6AD55',
    fontWeight: '600',
  },
  scoreExplainRows: {
    gap: 6,
    marginBottom: 12,
  },
  scoreExplainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: W ? '#FFFFFF' : '#1A2744',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...(W ? { borderWidth: 1, borderColor: webDash.cardBorder } : {}),
  },
  scoreExplainRowLeft: {
    flex: 1,
    gap: 2,
  },
  scoreExplainRowLabel: {
    color: W ? webDash.textPrimary : '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  scoreExplainRowDesc: {
    color: W ? webDash.textMuted : '#718096',
    fontSize: 11,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  scoreExplainRowBonus: {
    color: W ? webDash.accent : '#68D391',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 12,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  scoreExplainNote: {
    color: W ? webDash.textMuted : '#4A5568',
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  disclaimerTitle: {
    color: C.textPrimary,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  disclaimerText: {
    color: W ? webDash.textSecondary : '#A0AEC0',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  disclaimerWarn: {
    color: '#D97706',
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  /* Lucky Dates Panel */
  luckyPanel: {
    backgroundColor: W ? webDash.cardBg : '#111C35',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: W ? webDash.cardBorder : '#7B61FF44',
    marginBottom: 20,
    overflow: 'hidden',
  },
  luckyPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  luckyPanelTitle: {
    color: C.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  luckyPanelSubtitle: {
    color: W ? webDash.textMuted : '#718096',
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  luckyPanelChevron: {
    color: W ? webDash.accent : '#7B61FF',
    fontSize: 13,
    fontWeight: '700',
  },
  luckyPanelDesc: {
    color: W ? webDash.textSecondary : '#A0AEC0',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingBottom: 14,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  luckyForm: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  luckyInput: {
    backgroundColor: W ? '#FFFFFF' : '#1A2744',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: C.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: W ? webDash.inputBorder : '#2D3748',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  luckyWeightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  luckyWeightLabel: {
    color: W ? webDash.textSecondary : '#A0AEC0',
    fontSize: 12,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    marginRight: 4,
  },
  luckyWeightBtn: {
    backgroundColor: W ? '#FFFFFF' : '#1A2744',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: W ? webDash.cardBorder : '#2D3748',
  },
  luckyWeightBtnActive: {
    backgroundColor: W ? 'rgba(0, 163, 131, 0.15)' : '#2D1B69',
    borderColor: W ? webDash.accent : '#7B61FF',
  },
  luckyWeightBtnText: {
    color: W ? webDash.textMuted : '#718096',
    fontSize: 13,
    letterSpacing: 1,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  luckyWeightBtnTextActive: {
    color: W ? webDash.accent : '#B794F4',
  },
  luckyAddBtn: {
    backgroundColor: W ? 'rgba(0, 163, 131, 0.12)' : '#2D1B69',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: W ? webDash.accent : '#7B61FF',
  },
  luckyAddBtnText: {
    color: W ? webDash.accent : '#B794F4',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  luckyDatesList: {
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 12,
  },
  luckyDateRow: {
    backgroundColor: W ? '#FFFFFF' : '#1A2744',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: W ? webDash.cardBorder : '#2D3748',
  },
  luckyDateMain: {
    flex: 1,
    gap: 6,
  },
  luckyDateTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  luckyDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  luckyDateLabel: {
    color: C.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  luckyDateValue: {
    color: W ? webDash.textSecondary : '#A0AEC0',
    fontSize: 12,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  luckyDateWeight: {
    color: W ? webDash.accent : '#7B61FF',
    fontSize: 11,
    letterSpacing: 1,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  luckyExtractedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  luckyExtractedLabel: {
    color: W ? webDash.textMuted : '#4A5568',
    fontSize: 10,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  luckyExtractedChip: {
    backgroundColor: W ? 'rgba(0, 163, 131, 0.12)' : '#2D1B69',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: W ? webDash.accent : '#553C9A',
  },
  luckyExtractedNum: {
    color: W ? webDash.accent : '#B794F4',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  luckyRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: W ? '#E2E8F0' : '#2D3748',
    alignItems: 'center',
    justifyContent: 'center',
  },
  luckyRemoveBtnText: {
    color: '#DC2626',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '300',
  },
  luckyGenerateBtn: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: W ? webDash.accent : '#553C9A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: W ? webDash.accent : '#7B61FF',
  },
  luckyGenerateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});
