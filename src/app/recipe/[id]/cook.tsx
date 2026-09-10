import { useKeepAwake } from 'expo-keep-awake';
import { type Href, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useKomiStore } from '@/store/komi-store';
import type { Ingredient, Step } from '@/types/recipe';
import { formatScaledQuantity, scaleQuantity } from '@/utils/quantity';
import { formatCountdown } from '@/utils/timer';

type TimerMap = Record<string, number>;

const PREV_BARE_PEEK = 14;
const PREV_TIMER_PEEK = 52;
const NEXT_PEEK = 48;

export default function CookingModeScreen() {
  useKeepAwake();
  const { id, servings: servingsParam } = useLocalSearchParams<{ id: string; servings?: string }>();
  const insets = useSafeAreaInsets();
  const recipe = useKomiStore((state) => state.recipes.find((item) => item.id === id));

  const steps = useMemo(
    () => (recipe ? [...recipe.steps].sort((a, b) => a.sortOrder - b.sortOrder) : []),
    [recipe],
  );

  const servings = Math.max(1, Number(servingsParam) || recipe?.baseServings || 1);
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState<TimerMap>({});
  const [pausedIds, setPausedIds] = useState<Set<string>>(() => new Set());
  const indexRef = useRef(0);
  const pausedRef = useRef(pausedIds);
  indexRef.current = index;
  pausedRef.current = pausedIds;

  useEffect(() => {
    setIndex(0);
    setRemaining({});
    setPausedIds(new Set());
  }, [recipe?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((current) => {
        const paused = pausedRef.current;
        const activeKeys = Object.keys(current).filter(
          (key) => current[key] > 0 && !paused.has(key),
        );
        if (activeKeys.length === 0) return current;
        const next = { ...current };
        for (const key of activeKeys) {
          next[key] = next[key] - 1;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const goNext = useCallback(() => {
    if (!recipe) return;
    if (indexRef.current >= steps.length - 1) {
      router.replace(`/recipe/${recipe.id}/complete` as Href);
      return;
    }
    setIndex((value) => Math.min(steps.length - 1, value + 1));
  }, [recipe, steps.length]);

  const goPrev = useCallback(() => {
    setIndex((value) => Math.max(0, value - 1));
  }, []);

  const stackSwipe = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-24, 24])
        .failOffsetX([-24, 24])
        .onEnd((event) => {
          if (event.translationY < -48) {
            runOnJS(goNext)();
          } else if (event.translationY > 48) {
            runOnJS(goPrev)();
          }
        }),
    [goNext, goPrev],
  );

  if (!recipe || steps.length === 0) {
    return (
      <View style={[styles.missing, { paddingTop: insets.top }]}>
        <Text style={styles.missingTitle}>
          {!recipe ? 'Recette introuvable' : 'Aucune étape à cuisiner'}
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.missingLink}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const activeRecipe = recipe;
  const current = steps[index];
  const previous = index > 0 ? steps[index - 1] : null;
  const next = index < steps.length - 1 ? steps[index + 1] : null;
  const isLast = index === steps.length - 1;

  function hasTimerStarted(stepId: string) {
    return Object.prototype.hasOwnProperty.call(remaining, stepId);
  }

  function isTimerPaused(stepId: string) {
    return pausedIds.has(stepId);
  }

  /** Previous peek expands while a timer is in progress (running or paused). */
  function isTimerActive(stepId: string) {
    return hasTimerStarted(stepId) && (remaining[stepId] ?? 0) > 0;
  }

  /** Nearest previous step with an in-progress timer (Figma exception for peek height). */
  const timerPrevious =
    [...steps.slice(0, index)].reverse().find((step) => isTimerActive(step.id)) ?? null;

  const topPeekStep = timerPrevious ?? previous;
  const topPeekExpanded = Boolean(timerPrevious);
  const topInset = topPeekStep ? (topPeekExpanded ? PREV_TIMER_PEEK : PREV_BARE_PEEK) : 0;
  const bottomInset = next ? NEXT_PEEK : 0;

  function startTimer(step: Step) {
    if (!step.timerSeconds || step.timerSeconds <= 0 || hasTimerStarted(step.id)) return;
    setRemaining((current) => ({
      ...current,
      [step.id]: step.timerSeconds!,
    }));
    setPausedIds((current) => {
      const next = new Set(current);
      next.delete(step.id);
      return next;
    });
  }

  function togglePauseTimer(step: Step) {
    if (!hasTimerStarted(step.id)) return;
    if ((remaining[step.id] ?? 0) <= 0) {
      if (!step.timerSeconds) return;
      setRemaining((current) => ({
        ...current,
        [step.id]: step.timerSeconds!,
      }));
      setPausedIds((current) => {
        const next = new Set(current);
        next.delete(step.id);
        return next;
      });
      return;
    }
    setPausedIds((current) => {
      const next = new Set(current);
      if (next.has(step.id)) next.delete(step.id);
      else next.add(step.id);
      return next;
    });
  }

  function resetTimer(step: Step) {
    setRemaining((current) => {
      if (!Object.prototype.hasOwnProperty.call(current, step.id)) return current;
      const next = { ...current };
      delete next[step.id];
      return next;
    });
    setPausedIds((current) => {
      if (!current.has(step.id)) return current;
      const next = new Set(current);
      next.delete(step.id);
      return next;
    });
  }

  function quitCooking() {
    Alert.alert('Quitter le mode cuisiner ?', undefined, [
      { text: 'Continuer', style: 'cancel' },
      {
        text: 'Quitter',
        style: 'destructive',
        onPress: () => router.back(),
      },
    ]);
  }

  function linkedIngredients(step: Step): Ingredient[] {
    return step.ingredientIds
      .map((ingredientId) => activeRecipe.ingredients.find((item) => item.id === ingredientId))
      .filter((item): item is Ingredient => Boolean(item));
  }

  function stepHeading(step: Step) {
    return `${steps.indexOf(step) + 1} ${step.title.toUpperCase()}`;
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.two }]}>
      <View style={styles.topBar}>
        <Text style={styles.stepCounter}>
          Étape {index + 1}/{steps.length}
        </Text>
        <Pressable onPress={quitCooking} hitSlop={8} style={styles.quitButton}>
          <Text style={styles.quitLabel}>✕  Quitter</Text>
        </Pressable>
      </View>

      <View style={styles.progressRow}>
        {steps.map((step, stepIndex) => {
          const segmentStyle =
            stepIndex < index
              ? styles.progressDone
              : stepIndex === index
                ? styles.progressCurrent
                : styles.progressUpcoming;
          return <View key={step.id} style={[styles.progressSegment, segmentStyle]} />;
        })}
      </View>

      <GestureDetector gesture={stackSwipe}>
        <View style={styles.stage}>
          {next ? (
            <View style={[styles.stackCard, styles.nextCard]} pointerEvents="none">
              <Text style={styles.peekTitle} numberOfLines={1}>
                {stepHeading(next)}
              </Text>
            </View>
          ) : null}

          {topPeekStep ? (
            <Pressable
              style={[
                styles.stackCard,
                styles.prevCard,
                topPeekExpanded ? styles.prevCardExpanded : styles.prevCardBare,
              ]}
              onPress={goPrev}
              disabled={!topPeekExpanded}>
              {topPeekExpanded ? (
                <>
                  <Text style={styles.peekTitle} numberOfLines={1}>
                    {stepHeading(topPeekStep)}
                  </Text>
                  <View style={styles.peekTimer}>
                    <TimerGlyph />
                    <Text style={styles.peekTimerLabel}>
                      {formatCountdown(remaining[topPeekStep.id] ?? 0)}
                    </Text>
                  </View>
                </>
              ) : null}
            </Pressable>
          ) : null}

          <View
            style={[
              styles.stackCard,
              styles.activeCard,
              // Slight overlap keeps the stack look while leaving the next title strip open.
              { top: topInset - 6, bottom: Math.max(0, bottomInset - 8) },
            ]}>
            <Text style={styles.currentTitle}>{stepHeading(current)}</Text>

            {linkedIngredients(current).length > 0 ? (
              <View style={styles.pills}>
                {linkedIngredients(current).map((ingredient) => {
                  const qty = formatScaledQuantity(
                    scaleQuantity(ingredient.quantity, activeRecipe.baseServings, servings),
                  );
                  const unit = ingredient.unit?.trim() ?? '';
                  const prefix = [qty, unit].filter(Boolean).join(' ');
                  return (
                    <View key={ingredient.id} style={styles.pill}>
                      <Text style={styles.pillText}>
                        {prefix ? `${prefix} ` : ''}
                        <Text style={styles.pillName}>{ingredient.name}</Text>
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            <View style={styles.instructions}>
              {[...current.subSteps]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((sub, subIndex, list) => (
                  <View key={sub.id}>
                    <Text style={styles.instruction}>{sub.body}</Text>
                    {subIndex < list.length - 1 ? <View style={styles.instructionDivider} /> : null}
                  </View>
                ))}
              {current.subSteps.length === 0 ? (
                <Text style={styles.instruction}>Suivez cette étape, puis continuez.</Text>
              ) : null}
            </View>

            {current.timerSeconds && current.timerSeconds > 0 ? (
              <View style={styles.timerBlock}>
                {hasTimerStarted(current.id) ? (
                  <View style={styles.activeTimer}>
                    <TimerGlyph />
                    <Text style={styles.activeTimerLabel}>
                      {formatCountdown(remaining[current.id] ?? 0)}
                    </Text>
                    <View style={styles.timerControls}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          isTimerPaused(current.id) || (remaining[current.id] ?? 0) <= 0
                            ? 'Reprendre le minuteur'
                            : 'Mettre en pause'
                        }
                        hitSlop={8}
                        onPress={() => togglePauseTimer(current)}
                        style={styles.timerControlButton}>
                        {isTimerPaused(current.id) || (remaining[current.id] ?? 0) <= 0 ? (
                          <PlayGlyph />
                        ) : (
                          <PauseGlyph />
                        )}
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Réinitialiser le minuteur"
                        hitSlop={8}
                        onPress={() => resetTimer(current)}
                        style={styles.timerControlButton}>
                        <ResetGlyph />
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable style={styles.startTimerButton} onPress={() => startTimer(current)}>
                    <TimerGlyph />
                    <Text style={styles.startTimerLabel}>
                      Démarrer {formatCountdown(current.timerSeconds)}
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : null}
          </View>
        </View>
      </GestureDetector>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.three) }]}>
        <Pressable
          style={[styles.navButton, styles.prevButton, index === 0 && styles.navDisabled]}
          disabled={index === 0}
          onPress={goPrev}>
          <Text style={styles.prevIcon}>↑</Text>
          <Text style={styles.prevLabel}>Précédent</Text>
        </Pressable>
        <Pressable style={[styles.navButton, styles.nextButton]} onPress={goNext}>
          <Text style={styles.nextLabel}>{isLast ? 'Terminer' : 'Suivant'}</Text>
          <Text style={styles.nextIcon}>{isLast ? '✓' : '↓'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TimerGlyph() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 7V12.5L15.5 14.5"
        stroke={Colors.accent}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4Z"
        stroke={Colors.accent}
        strokeWidth={1.8}
      />
    </Svg>
  );
}

function PauseGlyph() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M8 6V18" stroke={Colors.accent} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M16 6V18" stroke={Colors.accent} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

function PlayGlyph() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 6.5V17.5L18 12L8 6.5Z"
        stroke={Colors.accent}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ResetGlyph() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 12A7.5 7.5 0 0 1 19 8.5"
        stroke={Colors.accent}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M19.5 12A7.5 7.5 0 0 1 5 15.5"
        stroke={Colors.accent}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M19 5.5V8.5H16"
        stroke={Colors.accent}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 18.5V15.5H8"
        stroke={Colors.accent}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    backgroundColor: Colors.primary,
  },
  missingTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 20,
    color: Colors.text,
  },
  missingLink: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.accent,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  stepCounter: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text,
  },
  quitButton: {
    paddingVertical: Spacing.one,
  },
  quitLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Colors.text,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.three,
  },
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 999,
  },
  progressDone: {
    backgroundColor: Colors.accent,
  },
  progressCurrent: {
    backgroundColor: '#F0C8C6',
  },
  progressUpcoming: {
    backgroundColor: Colors.line,
  },
  stage: {
    flex: 1,
    marginTop: Spacing.four,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
    overflow: 'visible',
  },
  stackCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    shadowColor: Colors.text,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  prevCard: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    overflow: 'hidden',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  prevCardBare: {
    height: PREV_BARE_PEEK + 8,
    opacity: 0.95,
    left: 22,
    right: 22,
  },
  prevCardExpanded: {
    height: PREV_TIMER_PEEK + 8,
    paddingTop: Spacing.two,
    alignItems: 'flex-start',
  },
  nextCard: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 0,
    height: NEXT_PEEK,
    zIndex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    overflow: 'hidden',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  activeCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 3,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  peekTitle: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 0.6,
    color: Colors.textMuted,
  },
  peekTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingTop: 2,
  },
  peekTimerLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: Colors.accent,
  },
  currentTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    letterSpacing: 0.8,
    color: Colors.textMuted,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  pill: {
    backgroundColor: Colors.inputFill,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  pillText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text,
  },
  pillName: {
    fontFamily: Fonts.bodyBold,
  },
  instructions: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
  },
  instruction: {
    fontFamily: Fonts.body,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    color: Colors.text,
  },
  instructionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.line,
    width: '40%',
    alignSelf: 'center',
    marginTop: Spacing.three,
  },
  timerBlock: {
    alignItems: 'center',
  },
  activeTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  activeTimerLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 28,
    color: Colors.accent,
    minWidth: 78,
    textAlign: 'center',
  },
  timerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginLeft: Spacing.one,
  },
  timerControlButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    backgroundColor: Colors.inputFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startTimerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.inputFill,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  startTimerLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.accent,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  navButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: Radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  prevButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.text,
  },
  nextButton: {
    backgroundColor: Colors.accent,
  },
  navDisabled: {
    opacity: 0.4,
  },
  prevLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    color: Colors.text,
  },
  prevIcon: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    color: Colors.text,
  },
  nextLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    color: Colors.white,
  },
  nextIcon: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    color: Colors.white,
  },
});
