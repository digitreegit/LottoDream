// ============================================
// Predict Screen - Number Generation
// ============================================
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { AuthNoticeBanner, type AuthNoticeVariant } from '../components/AuthNoticeBanner';
import { LandingStyleFooter } from '../components/LandingStyleFooter';
import { LottoRow } from '../components/LottoBall';
import { NumberPad } from '../components/NumberPad';
import { OddsVisualizer } from '../components/OddsVisualizer';
import { useDraws } from '../hooks/useDraws';
import { useGame, GameSelector } from '../hooks/useGame';
import { useAuth } from '../hooks/useAuth';
import { useEntitlement } from '../hooks/useEntitlement';
import { isWebDashboard, webDash, nativeDash, webDashboardScrollContent } from '../theme/webDashboard';
import { landingCtaPrimaryButton, landingCtaPrimaryButtonText } from '../theme/landingCta';
import { PREMIUM_PRICE_DISPLAY, PREMIUM_PRICE_PERIOD, PREMIUM_TRIAL_DAYS } from '../config/constants';

const W = isWebDashboard;
const C = W ? webDash : nativeDash;
import { generatePrediction, generateAllPredictions, generateLuckyDatesPrediction, extractNumbersFromDate } from '../services/predictionEngine';
import { savePredictionSet, addNumberCollectionItem } from '../services/ticketService';
import { PredictionSet, PredictionMode, LuckyDate, isPremiumMode } from '../types';

type PredictNotice = {
  variant: AuthNoticeVariant;
  title: string;
  message: string;
  autoDismissMs?: number | null;
};

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

const SMART_PICK_MODE_ORDER = Object.keys(MODE_INFO) as PredictionMode[];

export function PredictScreen({ navigation }: any) {
  const { game, config } = useGame();
  const { user } = useAuth();
  const { isPremium } = useEntitlement();
  const { draws, loading: dataLoading } = useDraws(game);

  const goToPricing = useCallback(() => {
    try {
      navigation?.navigate?.('Pricing');
    } catch {
      // ignore navigation race; Pricing is available as a tab route
    }
  }, [navigation]);
  const [predictions, setPredictions] = useState<PredictionSet[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedMode, setSelectedMode] = useState<PredictionMode | null>(null);

  // Lucky Dates state
  const [luckyDates, setLuckyDates] = useState<LuckyDate[]>([]);
  const [showLuckyPanel, setShowLuckyPanel] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newWeight, setNewWeight] = useState<1 | 2 | 3>(2);
  const [notice, setNotice] = useState<PredictNotice | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Manual "pick your own" pad state
  const [showManual, setShowManual] = useState(false);
  const [manualMains, setManualMains] = useState<number[]>([]);
  const [manualBonus, setManualBonus] = useState<number | null>(null);
  const [savingManual, setSavingManual] = useState(false);

  // Reset manual selection whenever the game changes (counts/ranges differ).
  useEffect(() => {
    setManualMains([]);
    setManualBonus(null);
  }, [game]);

  const toggleManualMain = useCallback(
    (n: number) => {
      setManualMains((prev) => {
        if (prev.includes(n)) return prev.filter((x) => x !== n);
        if (prev.length >= config.mainCount) return prev;
        return [...prev, n];
      });
    },
    [config.mainCount]
  );

  const dismissNotice = useCallback(() => setNotice(null), []);
  const presentNotice = useCallback((p: PredictNotice) => setNotice(p), []);

  const scrollPredictToTop = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, []);

  const presentPremiumNotice = useCallback(() => {
    presentNotice({
      variant: 'info',
      title: 'Premium feature',
      message: `Start your ${PREMIUM_TRIAL_DAYS}-day free trial to unlock all AI modes — then ${PREMIUM_PRICE_DISPLAY}${PREMIUM_PRICE_PERIOD}. Tap “See Pricing” below.`,
    });
  }, [presentNotice]);

  const runLuckyGeneration = useCallback(() => {
    if (!isPremium) {
      presentPremiumNotice();
      return;
    }
    if (luckyDates.length === 0) {
      presentNotice({
        variant: 'warning',
        title: '날짜 없음',
        message: 'Lucky Dates에 날짜를 추가한 뒤 다시 시도해주세요.',
      });
      setShowLuckyPanel(true);
      return;
    }
    if (draws.length === 0) {
      presentNotice({
        variant: 'warning',
        title: '데이터 없음',
        message: '당첨 번호 데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.',
      });
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      try {
        const entropy = `:${Date.now()}:${Math.random()}`;
        const result = generateLuckyDatesPrediction(draws, luckyDates, game, entropy);
        setPredictions((prev) => {
          const filtered = prev.filter((p) => p.mode !== 'lucky');
          return [result, ...filtered];
        });
        setSelectedMode('lucky');
      } catch (e: any) {
        presentNotice({
          variant: 'error',
          title: '생성 실패',
          message: e?.message || '럭키 픽을 만들 수 없습니다.',
        });
      } finally {
        setGenerating(false);
      }
    }, 100);
  }, [luckyDates, draws, game, presentNotice, isPremium, presentPremiumNotice]);

  const handleGenerateAll = useCallback(() => {
    if (!isPremium) {
      presentPremiumNotice();
      return;
    }
    if (draws.length === 0) {
      presentNotice({
        variant: 'warning',
        title: '데이터 없음',
        message: '당첨 번호 데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.',
      });
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      try {
        const results = generateAllPredictions(draws, game);
        setPredictions(results);
        setSelectedMode(null);
      } catch (e: any) {
        presentNotice({
          variant: 'error',
          title: '생성 실패',
          message: e?.message || '번호 조합을 만들 수 없습니다.',
        });
      } finally {
        setGenerating(false);
      }
    }, 100);
  }, [draws, game, presentNotice, isPremium, presentPremiumNotice]);

  const handleGenerateSingle = useCallback(
    (mode: PredictionMode, isRegenerate = false) => {
      if (isPremiumMode(mode) && !isPremium) {
        presentPremiumNotice();
        return;
      }
      if (mode === 'lucky') {
        runLuckyGeneration();
        return;
      }
      if (draws.length === 0) {
        presentNotice({
          variant: 'warning',
          title: '데이터 없음',
          message: '당첨 번호 데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.',
        });
        return;
      }
      setGenerating(true);
      setTimeout(() => {
        try {
          const seedEntropy = isRegenerate ? `:${Date.now()}:${Math.random()}` : '';
          const result = generatePrediction(draws, mode, game, seedEntropy);
          setPredictions((prev) => {
            const filtered = prev.filter((p) => p.mode !== mode);
            return [result, ...filtered];
          });
          setSelectedMode(mode);
        } catch (e: any) {
          presentNotice({
            variant: 'error',
            title: '생성 실패',
            message: e?.message || '이 모드의 번호를 다시 만들 수 없습니다.',
          });
        } finally {
          setGenerating(false);
        }
      }, 100);
    },
    [draws, game, runLuckyGeneration, presentNotice, isPremium, presentPremiumNotice]
  );

  const handleSave = useCallback(
    async (prediction: PredictionSet) => {
      if (!user) {
        presentNotice({
          variant: 'warning',
          title: '로그인 필요',
          message: '번호를 저장하려면 로그인해주세요.',
        });
        scrollPredictToTop();
        return;
      }

      const { error } = await savePredictionSet(prediction);
      if (error) {
        const isAuth =
          /sign in|not authenticated|login|unauthorized|jwt|session|profile/i.test(error);
        presentNotice({
          variant: isAuth ? 'warning' : 'error',
          title: isAuth ? '로그인 필요' : '저장 실패',
          message: error,
        });
        scrollPredictToTop();
        return;
      }

      presentNotice({
        variant: 'success',
        title: '저장 완료',
        message: '선택한 번호 조합이 계정에 저장되었습니다.',
      });
      scrollPredictToTop();
    },
    [user, presentNotice, scrollPredictToTop]
  );

  const fillManualRandom = useCallback(() => {
    const mains = new Set<number>();
    while (mains.size < config.mainCount) {
      mains.add(Math.floor(Math.random() * config.mainMax) + 1);
    }
    setManualMains([...mains].sort((a, b) => a - b));
    setManualBonus(
      config.hasBonus ? Math.floor(Math.random() * config.bonusMax) + 1 : null
    );
  }, [config]);

  const handleSaveManual = useCallback(async () => {
    if (!user) {
      presentNotice({
        variant: 'warning',
        title: '로그인 필요',
        message: '번호를 저장하려면 로그인해주세요.',
      });
      scrollPredictToTop();
      return;
    }
    if (manualMains.length !== config.mainCount) {
      presentNotice({
        variant: 'warning',
        title: '번호 부족',
        message: `${config.mainCount}개의 번호를 모두 선택해주세요.`,
      });
      return;
    }
    if (config.hasBonus && !manualBonus) {
      presentNotice({
        variant: 'warning',
        title: `${config.bonusLabel || 'Bonus'} 필요`,
        message: `${config.bonusLabel || 'Bonus'} 번호를 선택해주세요.`,
      });
      return;
    }
    setSavingManual(true);
    const { error } = await addNumberCollectionItem({
      game,
      source: 'manual',
      whites: manualMains,
      powerball: config.hasBonus ? (manualBonus as number) : 0,
    });
    setSavingManual(false);
    if (error) {
      presentNotice({ variant: 'error', title: '저장 실패', message: error });
      scrollPredictToTop();
      return;
    }
    presentNotice({
      variant: 'success',
      title: '저장 완료',
      message: '내 번호에 저장되었습니다.',
    });
    setManualMains([]);
    setManualBonus(null);
    scrollPredictToTop();
  }, [user, manualMains, manualBonus, config, game, presentNotice, scrollPredictToTop]);

  const handleAddLuckyDate = useCallback(() => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!newLabel.trim()) {
      presentNotice({
        variant: 'warning',
        title: '이름 없음',
        message: '날짜 이름을 입력해주세요. (예: 생일, 기념일)',
      });
      return;
    }
    if (!dateRegex.test(newDate.trim())) {
      presentNotice({
        variant: 'warning',
        title: '날짜 형식 오류',
        message: 'YYYY-MM-DD 형식으로 입력해주세요. (예: 1990-03-15)',
      });
      return;
    }
    setLuckyDates((prev) => [
      ...prev,
      { id: `ld_${Date.now()}`, label: newLabel.trim(), date: newDate.trim(), weight: newWeight },
    ]);
    setNewLabel('');
    setNewDate('');
    setNewWeight(2);
  }, [newLabel, newDate, newWeight, presentNotice]);

  const handleRemoveLuckyDate = useCallback((id: string) => {
    setLuckyDates((prev) => prev.filter((ld) => ld.id !== id));
  }, []);

  return (
    <View style={styles.pageRoot}>
      {notice && (
        <View style={styles.noticeStrip}>
          <AuthNoticeBanner
            variant={notice.variant}
            title={notice.title}
            message={notice.message}
            onDismiss={dismissNotice}
            autoDismissMs={notice.autoDismissMs}
            containerStyle={styles.predictNoticeBanner}
          />
        </View>
      )}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, W && webDashboardScrollContent]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
      >
      <View style={styles.pageIntro}>
        <Text style={styles.eyebrow}>Generator</Text>
        <Text style={styles.title}>Smart picks</Text>
        <Text style={styles.subtitle}>
          Six strategies plus lucky dates — tuned to {draws.length.toLocaleString()} historical {config.name}{' '}
          draws. Tap a card to generate; use “all modes” for a full set.
        </Text>
      </View>

      {/* Game Selector */}
      <GameSelector light={isWebDashboard} />

      {/* ── Pick your own (manual) ── */}
      <View style={styles.luckyPanel}>
        <TouchableOpacity
          style={styles.luckyPanelHeader}
          onPress={() => setShowManual((s) => !s)}
        >
          <View>
            <Text style={styles.luckyPanelTitle}>🎯 Pick your own</Text>
            <Text style={styles.luckyPanelSubtitle}>
              번호판을 눌러 직접 고르고 내 번호로 저장하세요
            </Text>
          </View>
          <Text style={styles.luckyPanelChevron}>{showManual ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showManual && (
          <View style={styles.manualBody}>
            {manualMains.length > 0 && (
              <View style={styles.manualPreview}>
                <LottoRow
                  whites={[...manualMains].sort((a, b) => a - b)}
                  powerball={manualBonus ?? 0}
                  game={game}
                  size={36}
                  showBonus={config.hasBonus}
                />
              </View>
            )}

            <NumberPad
              config={config}
              selectedMains={manualMains}
              selectedBonus={manualBonus}
              onToggleMain={toggleManualMain}
              onSelectBonus={setManualBonus}
            />

            <View style={styles.manualActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.manualActionBtn]}
                onPress={fillManualRandom}
                activeOpacity={0.85}
              >
                <Text style={styles.actionText}>🎲 Quick Fill</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.manualActionBtn]}
                onPress={() => {
                  setManualMains([]);
                  setManualBonus(null);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.actionText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.luckyGenerateBtn, styles.manualSaveBtn]}
                onPress={() => void handleSaveManual()}
                disabled={savingManual}
                activeOpacity={0.85}
              >
                {savingManual ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.luckyGenerateBtnText}>💾 Save to My Numbers</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Premium upgrade banner — hidden for premium users */}
      {!isPremium && (
        <TouchableOpacity
          style={styles.premiumBanner}
          activeOpacity={0.88}
          onPress={goToPricing}
          accessibilityRole="button"
          accessibilityLabel="Unlock premium prediction modes"
        >
          <View style={styles.premiumBannerLeft}>
            <Text style={styles.premiumBannerEyebrow}>Free plan</Text>
            <Text style={styles.premiumBannerTitle}>
              Pure Random is free. Try all AI modes free for {PREMIUM_TRIAL_DAYS} days.
            </Text>
            <Text style={styles.premiumBannerSub}>
              Hot, Cold, Balanced, Anti-Crowd & Lucky Dates — then {PREMIUM_PRICE_DISPLAY}{PREMIUM_PRICE_PERIOD}. Cancel anytime.
            </Text>
          </View>
          <View style={styles.premiumBannerCta}>
            <Text style={styles.premiumBannerCtaText}>See Pricing →</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Mode Selector — 3 columns × 2 rows */}
      <View style={styles.modeGrid}>
        {[0, 1].map((row) => (
          <View key={row} style={styles.modeRow}>
            {SMART_PICK_MODE_ORDER.slice(row * 3, row * 3 + 3).map((mode) => {
              const info = MODE_INFO[mode];
              const isActive = selectedMode === mode;
              const modeIsPremium = isPremiumMode(mode);
              const locked = modeIsPremium && !isPremium;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeCard,
                    isActive && !locked && styles.modeCardActive,
                    locked && styles.modeCardLocked,
                  ]}
                  onPress={() => (locked ? goToPricing() : handleGenerateSingle(mode))}
                  disabled={generating || dataLoading}
                >
                  {modeIsPremium && (
                    <View style={locked ? styles.modeLockBadge : styles.modePremiumBadge}>
                      <Text
                        style={
                          locked ? styles.modeLockBadgeText : styles.modePremiumBadgeText
                        }
                      >
                        {locked ? `🔒 ${PREMIUM_PRICE_DISPLAY}` : 'PRO'}
                      </Text>
                    </View>
                  )}
                  <Text style={[styles.modeIcon, locked && styles.modeIconLocked]}>
                    {info.icon}
                  </Text>
                  <Text
                    style={[
                      styles.modeLabel,
                      isActive && !locked && styles.modeLabelActive,
                      locked && styles.modeLabelLocked,
                    ]}
                  >
                    {info.label}
                  </Text>
                  <Text style={[styles.modeDesc, locked && styles.modeDescLocked]}>
                    {info.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Generate All Button */}
      <TouchableOpacity
        style={[styles.generateButton, !isPremium && styles.generateButtonLocked]}
        onPress={isPremium ? handleGenerateAll : goToPricing}
        disabled={generating || dataLoading}
      >
        {generating ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.generateText}>
            {isPremium
              ? '⚡ Generate All 6 Modes'
              : `🔒 Start ${PREMIUM_TRIAL_DAYS}-day free trial`}
          </Text>
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
                onPress={runLuckyGeneration}
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

                <OddsVisualizer prediction={pred} draws={draws} />

                <View style={[styles.resultActions, { marginTop: 14 }]}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    activeOpacity={0.85}
                    onPress={() => void handleSave(pred)}
                    disabled={generating || dataLoading}
                  >
                    <Text style={styles.actionText}>💾 Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    activeOpacity={0.85}
                    onPress={() => handleGenerateSingle(pred.mode, true)}
                    disabled={generating || dataLoading}
                  >
                    <Text style={styles.actionText}>🔄 Regenerate</Text>
                  </TouchableOpacity>
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
      <LandingStyleFooter />
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageRoot: {
    flex: 1,
    backgroundColor: W ? webDash.screenBg : C.screenBg,
  },
  noticeStrip: {
    ...Platform.select({
      web: {},
      default: { paddingHorizontal: 16, paddingTop: 4 },
    }),
  },
  predictNoticeBanner: {
    marginBottom: 12,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
    ...Platform.select({
      web: { paddingHorizontal: 0, paddingTop: 8 },
      default: { padding: 16 },
    }),
  },
  pageIntro: {
    marginBottom: 12,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: W ? webDash.accent : '#63B3ED',
    textTransform: 'uppercase' as const,
    marginBottom: 8,
    textAlign: W ? ('left' as const) : ('center' as const),
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: C.textPrimary,
    textAlign: W ? ('left' as const) : ('center' as const),
    marginBottom: 10,
    letterSpacing: -0.4,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  subtitle: {
    fontSize: 14,
    color: W ? webDash.textSecondary : '#A0AEC0',
    textAlign: W ? ('left' as const) : ('center' as const),
    marginBottom: 16,
    lineHeight: 22,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 14,
    marginBottom: 18,
    padding: 18,
    borderRadius: W ? webDash.radiusLg : 16,
    borderWidth: 1,
    borderColor: W ? 'rgba(234, 179, 8, 0.45)' : '#7B61FF',
    backgroundColor: W ? 'rgba(254, 252, 232, 0.9)' : '#2D1B69',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' as const } as object) : null),
    ...(W
      ? ({
          boxShadow:
            '0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 24px -12px rgba(180, 83, 9, 0.18)',
        } as object)
      : {}),
  },
  premiumBannerLeft: {
    flex: 1,
    gap: 4,
  },
  premiumBannerEyebrow: {
    color: W ? '#B45309' : '#FDE68A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  premiumBannerTitle: {
    color: W ? '#92400E' : '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  premiumBannerSub: {
    color: W ? '#78350F' : '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  premiumBannerCta: {
    backgroundColor: W ? '#B45309' : '#7B61FF',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  premiumBannerCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  modeGrid: {
    gap: 8,
    marginBottom: 16,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: W ? webDash.cardBg : '#1A2744',
    borderRadius: W ? webDash.radiusMd : 14,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: W ? webDash.cardBorder : '#2D3748',
    ...(W
      ? ({
          boxShadow: webDash.shadowCard,
          minHeight: 118,
          cursor: 'pointer' as const,
        } as object)
      : {}),
  },
  modeCardActive: {
    borderColor: W ? webDash.accent : '#3182CE',
    backgroundColor: W ? webDash.accentSoft : '#1E3A5F',
    ...(W
      ? ({
          boxShadow: '0 0 0 2px rgba(0, 163, 131, 0.25), 0 10px 24px -10px rgba(15, 23, 42, 0.12)',
        } as object)
      : {}),
  },
  modeCardLocked: {
    backgroundColor: W ? '#FAFAFA' : '#0F1930',
    borderStyle: 'dashed' as const,
    borderColor: W ? '#D4D4D8' : '#3F3F7F',
  },
  modeLockBadge: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    backgroundColor: W ? '#FEF3C7' : '#7B61FF',
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: W ? '#FCD34D' : '#553C9A',
  },
  modeLockBadgeText: {
    color: W ? '#92400E' : '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  modePremiumBadge: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    backgroundColor: W ? webDash.accent : '#63B3ED',
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  modePremiumBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  modeIconLocked: {
    opacity: 0.55,
  },
  modeLabelLocked: {
    color: W ? webDash.textMuted : '#A0AEC0',
  },
  modeDescLocked: {
    color: W ? webDash.textSoft : '#718096',
  },
  generateButtonLocked: {
    backgroundColor: W ? '#B45309' : '#7B61FF',
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
    backgroundColor: W ? webDash.cardBg : C.cardBg,
    borderRadius: W ? webDash.radiusLg : 16,
    padding: 18,
    ...(W
      ? { borderWidth: 1, borderColor: webDash.cardBorder, boxShadow: webDash.shadowCard }
      : {}),
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
  actionText: {
    color: W ? webDash.textPrimary : '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  disclaimer: {
    marginTop: 16,
    backgroundColor: W ? webDash.cardBg : C.cardBg,
    borderRadius: W ? webDash.radiusMd : 14,
    padding: 16,
    ...(W ? { borderWidth: 1, borderColor: webDash.cardBorder, boxShadow: webDash.shadowCard } : {}),
  },

  /* Score Explanation Box */
  scoreExplainBox: {
    marginTop: 12,
    backgroundColor: W ? webDash.cardBg : '#0F1E38',
    borderRadius: W ? webDash.radiusLg : 14,
    borderWidth: 1,
    borderColor: W ? webDash.cardBorder : '#2D3748',
    padding: 16,
    ...(W ? ({ boxShadow: webDash.shadowCard } as object) : {}),
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

  /* Manual picker */
  manualBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  manualPreview: {
    alignItems: 'center',
    marginBottom: 8,
  },
  manualActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  manualActionBtn: {
    flex: 0,
    paddingHorizontal: 16,
  },
  manualSaveBtn: {
    flex: 1,
    marginHorizontal: 0,
    marginBottom: 0,
    minWidth: 180,
  },

  /* Lucky Dates Panel */
  luckyPanel: {
    backgroundColor: W ? webDash.cardBg : '#111C35',
    borderRadius: W ? webDash.radiusLg : 16,
    borderWidth: 1,
    borderColor: W ? webDash.cardBorder : '#7B61FF44',
    marginBottom: 20,
    overflow: 'hidden',
    ...(W ? ({ boxShadow: webDash.shadowCard } as object) : {}),
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
