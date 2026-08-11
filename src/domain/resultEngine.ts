import { calculateAbilityScores, calculateConfidence, calculateRecommendations } from './scoring';
import { deriveAptitudeTitle } from './aptitudeTitles';
import type { AbilityResult, ChampionLaneProfile, DiagnosticResult, FeatureVector, ScoreMap } from './types';
import type { TestResult } from './testTypes';

const scoreFor = (results: TestResult[], id: TestResult['testId'], fallback = 0.5): number => results.find((result) => result.testId === id)?.score ?? fallback;
const effectiveQuality = (result: TestResult): number => {
  const validRatio = result.totalTrials > 0 ? Math.min(1, Math.max(0, result.validTrials / result.totalTrials)) : 0;
  return Math.min(result.quality, validRatio);
};
const qualityFor = (results: TestResult[], id: TestResult['testId']): number => {
  const result = results.find((item) => item.testId === id);
  return result ? effectiveQuality(result) : 0.4;
};

const metricFor = <T,>(results: TestResult[], id: TestResult['testId'], read: (result: TestResult) => T | undefined, fallback: T): T => {
  const result = results.find((item) => item.testId === id);
  return result ? (read(result) ?? fallback) : fallback;
};

export function featuresFromTestResults(results: TestResult[]): FeatureVector {
  const reaction = scoreFor(results, 'reaction');
  const click = scoreFor(results, 'clickAccuracy');
  const input = scoreFor(results, 'inputControl');
  const prediction = scoreFor(results, 'prediction');
  const attention = scoreFor(results, 'attentionDistribution');
  const switching = scoreFor(results, 'taskSwitching');
  const decision = scoreFor(results, 'decision');
  const mental = scoreFor(results, 'mentalStability');
  const clickMetrics = metricFor(results, 'clickAccuracy', (result) => result.metrics?.click, undefined);
  const inputMetrics = metricFor(results, 'inputControl', (result) => result.metrics?.input, undefined);
  const attentionMetrics = metricFor(results, 'attentionDistribution', (result) => result.metrics?.attention, undefined);
  const decisionMetrics = metricFor(results, 'decision', (result) => result.metrics?.decision, undefined);
  const mentalMetrics = metricFor(results, 'mentalStability', (result) => result.metrics?.mental, undefined);
  return {
    reactionMedianScore: reaction,
    reactionStabilityScore: metricFor(results, 'reaction', (result) => result.metrics?.reaction ? clampScore(1 - (result.metrics.reaction.responseTimesMs.length > 1 ? standardDeviation(result.metrics.reaction.responseTimesMs) / 500 : 0)) : undefined, meanQuality(results, 'reaction')),
    falseStartSuppression: metricFor(results, 'reaction', (result) => result.metrics?.reaction ? clampScore(1 - result.metrics.reaction.falseStarts / Math.max(1, result.totalTrials)) : undefined, reaction),
    clickHitRateScore: clickMetrics?.hitRate ?? click,
    clickCenterAccuracyScore: clickMetrics?.centerAccuracy ?? click,
    clickSmallTargetScore: clickMetrics?.smallTargetAccuracy ?? click,
    inputControl: inputMetrics ?? {
      mouseSequenceControl: input,
      keyboardSequenceControl: input,
      mouseKeyboardCoordination: input,
      rhythmStability: input,
      misinputSuppression: input,
    },
    predictionPositionAccuracy: prediction,
    predictionVelocityAdaptation: prediction,
    predictionPatternLearning: prediction,
    attentionPeripheralDetection: attentionMetrics ? clampScore(attentionMetrics.peripheralHits / Math.max(1, attentionMetrics.peripheralEvents)) : attention,
    attentionCentralRetention: attentionMetrics?.trackingRetention ?? attention,
    attentionPeripheralReaction: attentionMetrics ? clampScore(attentionMetrics.peripheralHits / Math.max(1, attentionMetrics.peripheralEvents)) : attention,
    switchingPostAccuracy: switching,
    switchingCostScore: switching,
    switchingRuleRetention: switching,
    decisionCorrectness: decisionMetrics ? mean(decisionMetrics.correctAnswers.map((correct) => correct ? 1 : 0)) : decision,
    decisionInformationUtilization: decision,
    decisionConsistency: decisionMetrics ? consistencyScore(decisionMetrics.correctAnswers) : decision,
    correctDecisionSpeed: decisionMetrics?.speedScore ?? decision,
    pressureDegradation: mentalMetrics?.pressureDegradation ?? clampScore(1 - mental),
    recoveryTrialCountScore: mentalMetrics?.recoveryTrialCountScore ?? mental,
    recoverySlopeScore: mentalMetrics?.recoverySlopeScore ?? mental,
    failureChainSuppression: mentalMetrics?.failureChainSuppression ?? mental,
  };
}

function clampScore(value: number): number { return Math.min(1, Math.max(0, value)); }
function meanQuality(results: TestResult[], id: TestResult['testId']): number { return qualityFor(results, id); }
function mean(values: number[]): number { return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length; }
function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}
function consistencyScore(values: boolean[]): number {
  if (values.length < 2) return values.length === 1 ? 1 : 0;
  const ratio = mean(values.map((value) => value ? 1 : 0));
  return clampScore(1 - 4 * ratio * (1 - ratio));
}

const ABILITY_TESTS: Record<string, TestResult['testId'][]> = {
  reaction: ['reaction'], clickAccuracy: ['clickAccuracy'], inputControl: ['inputControl'], prediction: ['prediction'],
  attentionDistribution: ['attentionDistribution'], taskSwitching: ['taskSwitching'], decisionSpeed: ['decision'],
  decisionQuality: ['decision'], pressureStability: ['mentalStability'], recovery: ['mentalStability'],
};

function confidenceForAbility(results: TestResult[], ability: string): number {
  const relevant = results.filter((result) => ABILITY_TESTS[ability]?.includes(result.testId));
  if (relevant.length === 0) return 0.35;
  const inputs = relevant.map((result) => {
    const validRatio = result.totalTrials > 0 ? clampScore(result.validTrials / result.totalTrials) : 0;
    return {
      validSampleScore: validRatio,
      dispersionScore: result.metrics?.dispersionScore ?? Math.min(result.quality, validRatio),
      frameStabilityScore: result.metrics?.frameStabilityScore ?? 0.95,
      inputStabilityScore: result.metrics?.inputStabilityScore ?? result.quality,
      completionScore: result.completed ? 1 : 0,
    };
  });
  const average = (key: keyof typeof inputs[number]) => mean(inputs.map((input) => input[key]));
  return calculateConfidence({
    validSampleScore: average('validSampleScore'),
    dispersionScore: average('dispersionScore'),
    frameStabilityScore: average('frameStabilityScore'),
    inputStabilityScore: average('inputStabilityScore'),
    completionScore: average('completionScore'),
  }).value;
}

export function calculateDiagnosticResult(
  results: TestResult[],
  preferences: ScoreMap,
  candidates: ChampionLaneProfile[],
  mode: DiagnosticResult['mode'] = 'quick',
  experience: { beginner: boolean } = { beginner: false },
): DiagnosticResult {
  const abilityResult = calculateAbilityScores(featuresFromTestResults(results));
  const confidence: Partial<Record<keyof typeof abilityResult.abilities, number>> = {};
  for (const key of Object.keys(abilityResult.abilities)) {
    confidence[key as keyof typeof confidence] = confidenceForAbility(results, key);
  }
  const result: DiagnosticResult = {
    ...abilityResult,
    confidence,
    aptitudeTitle: deriveAptitudeTitle(abilityResult.abilities, preferences),
    mode,
    createdAt: new Date().toISOString(),
  };
  result.recommendations = calculateRecommendations({
    abilities: result.abilities,
    confidence,
    preferences,
    candidates,
    experience,
  });
  return result;
}

export function mergeTestResults(previous: TestResult[], retest: TestResult): TestResult[] {
  return [...previous.filter((result) => result.testId !== retest.testId), retest];
}
