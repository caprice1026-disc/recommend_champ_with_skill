import { calculateAbilityScores, calculateConfidence, calculateRecommendations } from './scoring';
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

export function featuresFromTestResults(results: TestResult[]): FeatureVector {
  const reaction = scoreFor(results, 'reaction');
  const click = scoreFor(results, 'clickAccuracy');
  const input = scoreFor(results, 'inputControl');
  const prediction = scoreFor(results, 'prediction');
  const attention = scoreFor(results, 'attentionDistribution');
  const switching = scoreFor(results, 'taskSwitching');
  const decision = scoreFor(results, 'decision');
  const mental = scoreFor(results, 'mentalStability');
  return {
    reactionMedianScore: reaction,
    reactionStabilityScore: clampScore(0.55 * reaction + 0.45 * meanQuality(results, 'reaction')),
    falseStartSuppression: clampScore(0.7 * reaction + 0.3 * meanQuality(results, 'reaction')),
    clickHitRateScore: click,
    clickCenterAccuracyScore: clampScore(0.65 * click + 0.35 * meanQuality(results, 'clickAccuracy')),
    clickSmallTargetScore: clampScore(0.55 * click + 0.45 * meanQuality(results, 'clickAccuracy')),
    inputControl: {
      mouseSequenceControl: input,
      keyboardSequenceControl: clampScore(input * 0.95),
      mouseKeyboardCoordination: clampScore(input * 0.9),
      rhythmStability: clampScore(input * 0.85),
      misinputSuppression: clampScore(input * 0.8 + 0.2 * meanQuality(results, 'inputControl')),
    },
    predictionPositionAccuracy: prediction,
    predictionVelocityAdaptation: clampScore(prediction * 0.9),
    predictionPatternLearning: clampScore(prediction * 0.85 + 0.15 * meanQuality(results, 'prediction')),
    attentionPeripheralDetection: attention,
    attentionCentralRetention: clampScore(attention * 0.9),
    attentionPeripheralReaction: clampScore(attention * 0.85),
    switchingPostAccuracy: switching,
    switchingCostScore: clampScore(switching * 0.9),
    switchingRuleRetention: clampScore(switching * 0.85),
    decisionCorrectness: decision,
    decisionInformationUtilization: clampScore(decision * 0.9),
    decisionConsistency: clampScore(decision * 0.85 + 0.15 * meanQuality(results, 'decision')),
    correctDecisionSpeed: clampScore(0.55 * decision + 0.45 * meanQuality(results, 'decision')),
    pressureDegradation: clampScore(1 - mental),
    recoveryTrialCountScore: mental,
    recoverySlopeScore: clampScore(mental * 0.9),
    failureChainSuppression: clampScore(mental * 0.85),
  };
}

function clampScore(value: number): number { return Math.min(1, Math.max(0, value)); }
function meanQuality(results: TestResult[], id: TestResult['testId']): number { return qualityFor(results, id); }

export function calculateDiagnosticResult(
  results: TestResult[],
  preferences: ScoreMap,
  candidates: ChampionLaneProfile[],
  mode: DiagnosticResult['mode'] = 'quick',
): DiagnosticResult {
  const abilityResult = calculateAbilityScores(featuresFromTestResults(results));
  const confidence: Partial<Record<keyof typeof abilityResult.abilities, number>> = {};
  const quality = results.length === 0 ? 0.35 : results.reduce((sum, result) => sum + effectiveQuality(result), 0) / results.length;
  for (const key of Object.keys(abilityResult.abilities)) {
    const confidenceResult = calculateConfidence({
      validSampleScore: quality,
      dispersionScore: quality,
      frameStabilityScore: 0.95,
      inputStabilityScore: quality,
      completionScore: results.length >= 8 ? 1 : 0.65,
    });
    confidence[key as keyof typeof confidence] = confidenceResult.value;
  }
  const result: DiagnosticResult = { ...abilityResult, confidence, mode, createdAt: new Date().toISOString() };
  result.recommendations = calculateRecommendations({
    abilities: result.abilities,
    confidence,
    preferences,
    experience: { beginner: false },
    candidates,
  });
  return result;
}

export function mergeTestResults(previous: TestResult[], retest: TestResult): TestResult[] {
  return [...previous.filter((result) => result.testId !== retest.testId), retest];
}
