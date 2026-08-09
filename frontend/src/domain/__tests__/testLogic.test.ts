import { describe, expect, it } from 'vitest';
import {
  DECISION_SCENARIOS,
  KEY_SEQUENCE,
  buildCompoundSequences,
  interpolatePredictionPosition,
  isPreferenceSetComplete,
  nextReactionDelay,
  predictionTrailPoints,
  ruleForTaskSwitch,
  scoreDecisionAnswers,
} from '../testLogic';

describe('diagnostic interaction logic', () => {
  it('requires the complete QWER calibration sequence', () => {
    expect(KEY_SEQUENCE).toEqual(['q', 'w', 'e', 'r']);
  });

  it('only completes preference questions when every key is answered or skipped', () => {
    const keys = ['aggression', 'roam', 'farm'];
    expect(isPreferenceSetComplete(keys, new Set(['aggression', 'roam']))).toBe(false);
    expect(isPreferenceSetComplete(keys, new Set(keys))).toBe(true);
  });

  it('keeps reaction delays inside a broad range and avoids near-repeat timing', () => {
    const first = nextReactionDelay(0.1, null);
    const second = nextReactionDelay(0.1, first);
    expect(first).toBeGreaterThanOrEqual(650);
    expect(first).toBeLessThanOrEqual(2200);
    expect(second).toBeGreaterThanOrEqual(650);
    expect(second).toBeLessThanOrEqual(2200);
    expect(Math.abs(second - first)).toBeGreaterThanOrEqual(250);
  });

  it('generates varied compound-input sequences without adjacent duplicates', () => {
    const sequences = buildCompoundSequences(9, () => 0.37);
    const signatures = sequences.map((sequence) => sequence.join('>'));
    expect(sequences).toHaveLength(9);
    expect(new Set(signatures).size).toBe(9);
    expect(sequences.every((sequence) => sequence.length >= 3)).toBe(true);
  });

  it('exposes the actual task-switch rules before and after the switch', () => {
    expect(ruleForTaskSwitch(0, 16)).toMatchObject({
      phase: 'basic',
      labels: { teal: 'クリック', amber: 'Q', violet: '右クリック' },
    });
    expect(ruleForTaskSwitch(8, 16)).toMatchObject({
      phase: 'changed',
      labels: { teal: 'Q', amber: 'クリック', violet: 'E' },
    });
  });

  it('provides multiple distinct decision scenarios with one correct option each', () => {
    expect(DECISION_SCENARIOS.length).toBeGreaterThanOrEqual(6);
    expect(new Set(DECISION_SCENARIOS.map((scenario) => scenario.prompt)).size).toBe(DECISION_SCENARIOS.length);
    expect(DECISION_SCENARIOS.every((scenario) => scenario.options.length === 3)).toBe(true);
    expect(DECISION_SCENARIOS.every((scenario) => scenario.options.filter((option) => option.correct).length === 1)).toBe(true);
  });

  it('describes decision options without value-loaded correctness cues', () => {
    const leadingTerms = /安全|危険|確実|成功|失敗|損失|利益|孤立|主導権|有利|リターン|連携|勝ち筋|賭け|避ける|渡す|高める|分断|撃破|リスク/;
    expect(DECISION_SCENARIOS.flatMap((scenario) => scenario.options).every((option) => !leadingTerms.test(option.detail))).toBe(true);
  });

  it('interpolates the prediction orb and exposes its full trail', () => {
    const start = { x: 20, y: 30 };
    const end = { x: 80, y: 70 };
    expect(interpolatePredictionPosition(start, end, 0)).toEqual(start);
    expect(interpolatePredictionPosition(start, end, 0.5)).toEqual({ x: 50, y: 50 });
    expect(interpolatePredictionPosition(start, end, 1)).toEqual(end);
    expect(predictionTrailPoints(start, end, 4)).toEqual([
      { x: 20, y: 30 },
      { x: 40, y: 43.33333333333333 },
      { x: 60, y: 56.666666666666664 },
      { x: 80, y: 70 },
    ]);
  });

  it('scores the latest answer for each revisitable decision scenario', () => {
    const scenarios = DECISION_SCENARIOS.slice(0, 2);
    expect(scoreDecisionAnswers(scenarios, [0, 1])).toEqual({ answered: 2, correct: 2 });
    expect(scoreDecisionAnswers(scenarios, [2, null])).toEqual({ answered: 1, correct: 0 });
  });

  it('resolves a small viewport as a warning instead of an unfinished check', async () => {
    const logic = await import('../testLogic');
    expect(logic.viewportStatus).toBeTypeOf('function');
    expect(logic.viewportStatus(800, 600)).toBe('warning');
    expect(logic.viewportStatus(1024, 640)).toBe('ready');
  });

  it('counts only score-qualified trials as valid measurement samples', async () => {
    const logic = await import('../testLogic');
    expect(logic.countValidTrials).toBeTypeOf('function');
    expect(logic.countValidTrials([0.1, 0.2, 0.4, 0.9], 0.35)).toBe(2);
  });
});
