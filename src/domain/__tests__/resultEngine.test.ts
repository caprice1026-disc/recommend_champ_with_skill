import { describe, expect, it } from 'vitest';
import { DEFAULT_CHAMPION_LANES, DEFAULT_PREFERENCES } from '../../client/data/defaultData';
import { calculateDiagnosticResult, featuresFromTestResults, mergeTestResults } from '../resultEngine';
import type { TestResult } from '../testTypes';

const resultFor = (testId: TestResult['testId'], score: number): TestResult => ({
  testId,
  score,
  quality: 0.9,
  abilityKeys: ['reaction'],
  validTrials: 8,
  totalTrials: 8,
  completed: true,
  rawTrialCount: 8,
});

describe('diagnostic result engine', () => {
  it('creates all ten internal ability axes and three recommendation layers', () => {
    const result = calculateDiagnosticResult([
      resultFor('reaction', 0.8), resultFor('clickAccuracy', 0.7), resultFor('inputControl', 0.75), resultFor('prediction', 0.7),
      resultFor('attentionDistribution', 0.65), resultFor('taskSwitching', 0.75), resultFor('decision', 0.7), resultFor('mentalStability', 0.65),
    ], DEFAULT_PREFERENCES, DEFAULT_CHAMPION_LANES, 'detailed');

    expect(Object.keys(result.abilities)).toHaveLength(10);
    expect(result.mode).toBe('detailed');
    expect(result.recommendations?.readyNow).toBeDefined();
    expect(result.recommendations?.growthCandidate).toBeDefined();
    expect(result.recommendations?.aspirational).toBeDefined();
    expect(Object.values(result.recommendations ?? {}).some((bucket) => bucket.primary)).toBe(true);
    expect(result.aptitudeTitle).toBeDefined();
    expect(result.aptitudeTitle?.name).toBeTruthy();
  });

  it('replaces a retested test with the latest valid result', () => {
    const previous = [resultFor('reaction', 0.9), resultFor('clickAccuracy', 0.4)];
    const merged = mergeTestResults(previous, resultFor('reaction', 0.55));
    expect(merged.find((item) => item.testId === 'reaction')?.score).toBe(0.55);
    expect(merged).toHaveLength(2);
  });

  it('does not call a result stable when its valid-trial ratio is low', () => {
    const lowValidityResults = [
      'reaction', 'clickAccuracy', 'inputControl', 'prediction',
      'attentionDistribution', 'taskSwitching', 'decision', 'mentalStability',
    ].map((testId) => ({ ...resultFor(testId as TestResult['testId'], 0.9), validTrials: 0 })) as TestResult[];
    const result = calculateDiagnosticResult(lowValidityResults, DEFAULT_PREFERENCES, DEFAULT_CHAMPION_LANES);
    expect(Object.values(result.confidence).every((value) => (value ?? 1) < 0.8)).toBe(true);
  });

  it('passes beginner experience through to recommendation scoring', () => {
    const profileResults = [resultFor('reaction', 0.2), resultFor('clickAccuracy', 0.8), resultFor('inputControl', 0.8), resultFor('prediction', 0.8), resultFor('attentionDistribution', 0.8), resultFor('taskSwitching', 0.8), resultFor('decision', 0.8), resultFor('mentalStability', 0.8)];
    const experienced = calculateDiagnosticResult(profileResults, DEFAULT_PREFERENCES, DEFAULT_CHAMPION_LANES, 'quick', { beginner: false });
    const beginner = calculateDiagnosticResult(profileResults, DEFAULT_PREFERENCES, DEFAULT_CHAMPION_LANES, 'quick', { beginner: true });
    expect(beginner.abilities.reaction).toBe(experienced.abilities.reaction);
    expect(beginner.recommendations).not.toEqual(experienced.recommendations);
  });

  it('uses measured click and input metrics instead of fixed score multipliers', () => {
    const measured: TestResult[] = [
      { ...resultFor('clickAccuracy', 0.9), metrics: { click: { hitRate: 0.9, centerAccuracy: 0.2, smallTargetAccuracy: 0.1, longDistanceAccuracy: 0.8, movingTargetAccuracy: 0.7, continuousAccuracy: 0.6 } } },
      { ...resultFor('inputControl', 0.9), metrics: { input: { mouseSequenceControl: 0.1, keyboardSequenceControl: 0.9, mouseKeyboardCoordination: 0.3, rhythmStability: 0.8, misinputSuppression: 0.7 } } },
    ];
    const features = featuresFromTestResults(measured);
    expect(features.clickCenterAccuracyScore).toBe(0.2);
    expect(features.clickSmallTargetScore).toBe(0.1);
    expect(features.inputControl.mouseSequenceControl).toBe(0.1);
    expect(features.inputControl.keyboardSequenceControl).toBe(0.9);
  });

  it('computes confidence per measured test instead of copying one global quality', () => {
    const results = [
      { ...resultFor('reaction', 0.8), quality: 0.1, validTrials: 1 },
      { ...resultFor('clickAccuracy', 0.8), quality: 1, validTrials: 8 },
      ...(['inputControl', 'prediction', 'attentionDistribution', 'taskSwitching', 'decision', 'mentalStability'] as TestResult['testId'][]).map((testId) => resultFor(testId, 0.8)),
    ];
    const result = calculateDiagnosticResult(results, DEFAULT_PREFERENCES, DEFAULT_CHAMPION_LANES);
    expect(result.confidence.reaction).toBeLessThan(result.confidence.clickAccuracy ?? 0);
  });
});
