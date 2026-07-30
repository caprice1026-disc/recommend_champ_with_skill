import { describe, expect, it } from 'vitest';
import { DEFAULT_CHAMPION_LANES, DEFAULT_PREFERENCES } from '../../data/defaultData';
import { calculateDiagnosticResult, mergeTestResults } from '../resultEngine';
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
    expect(result.recommendations?.readyNow.primary).toBeDefined();
    expect(result.recommendations?.growthCandidate.primary).toBeDefined();
    expect(result.recommendations?.aspirational.primary).toBeDefined();
  });

  it('replaces a retested test with the latest valid result', () => {
    const previous = [resultFor('reaction', 0.9), resultFor('clickAccuracy', 0.4)];
    const merged = mergeTestResults(previous, resultFor('reaction', 0.55));
    expect(merged.find((item) => item.testId === 'reaction')?.score).toBe(0.55);
    expect(merged).toHaveLength(2);
  });
});
