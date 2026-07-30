import {
  ABILITY_KEYS,
  type AbilityResult,
  type AbilityVector,
  type ChampionLaneProfile,
  type ConfidenceResult,
  type DiagnosticResult,
  type FeatureVector,
  type NormalizationProfile,
  type RecommendationCandidate,
  type RecommendationInput,
  type RecommendationSet,
  type QualityInput,
  type ScoreMap,
} from './types';

export const clamp = (value: number, min = 0, max = 1): number => Math.min(max, Math.max(min, value));

export function normalizeFeature(value: number, profile: NormalizationProfile): number {
  const denominator = profile.highReference - profile.lowReference;
  if (denominator === 0) return 0;
  const ratio = profile.direction === 'higher'
    ? (value - profile.lowReference) / denominator
    : (profile.highReference - value) / denominator;
  return clamp(ratio);
}

export function calculateAbilityScores(features: FeatureVector): AbilityResult {
  const decisionQuality =
    0.6 * features.decisionCorrectness
    + 0.2 * features.decisionInformationUtilization
    + 0.2 * features.decisionConsistency;

  const abilities: AbilityVector = {
    reaction: 0.7 * features.reactionMedianScore + 0.2 * features.reactionStabilityScore + 0.1 * features.falseStartSuppression,
    clickAccuracy: 0.45 * features.clickHitRateScore + 0.35 * features.clickCenterAccuracyScore + 0.2 * features.clickSmallTargetScore,
    inputControl:
      0.25 * features.inputControl.mouseSequenceControl
      + 0.25 * features.inputControl.keyboardSequenceControl
      + 0.2 * features.inputControl.mouseKeyboardCoordination
      + 0.2 * features.inputControl.rhythmStability
      + 0.1 * features.inputControl.misinputSuppression,
    prediction: 0.6 * features.predictionPositionAccuracy + 0.25 * features.predictionVelocityAdaptation + 0.15 * features.predictionPatternLearning,
    attentionDistribution: 0.5 * features.attentionPeripheralDetection + 0.3 * features.attentionCentralRetention + 0.2 * features.attentionPeripheralReaction,
    taskSwitching: 0.5 * features.switchingPostAccuracy + 0.3 * features.switchingCostScore + 0.2 * features.switchingRuleRetention,
    decisionQuality,
    decisionSpeed: features.correctDecisionSpeed * (0.5 + 0.5 * decisionQuality),
    pressureStability: clamp(1 - features.pressureDegradation),
    recovery: 0.45 * features.recoveryTrialCountScore + 0.3 * features.recoverySlopeScore + 0.25 * features.failureChainSuppression,
  };

  return {
    abilities: Object.fromEntries(ABILITY_KEYS.map((key) => [key, clamp(abilities[key] ?? 0)])) as AbilityVector,
    subscores: { inputControl: features.inputControl, clickAccuracy: features.clickAccuracy },
    confidence: {},
  };
}

export function calculateConfidence(input: QualityInput): ConfidenceResult {
  const value = clamp(
    0.3 * input.validSampleScore
      + 0.25 * input.dispersionScore
      + 0.2 * input.frameStabilityScore
      + 0.15 * input.inputStabilityScore
      + 0.1 * input.completionScore,
  );
  const label = value >= 0.8
    ? '測定は安定しています'
    : value >= 0.65
      ? 'おおむね安定しています'
      : value >= 0.45
        ? '結果にややばらつきがあります'
        : '再テストを推奨します';
  return { value, label, effectiveWeight: (baseWeight) => baseWeight * (0.4 + 0.6 * value) };
}

function weightedCosineSimilarity(left: ScoreMap, right: ScoreMap, weights: ScoreMap): number {
  const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])];
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (const key of keys) {
    const weight = weights[key] ?? 1;
    const a = left[key] ?? 0;
    const b = right[key] ?? 0;
    dot += weight * a * b;
    leftMagnitude += weight * a * a;
    rightMagnitude += weight * b * b;
  }
  if (leftMagnitude === 0 || rightMagnitude === 0) return 0;
  return clamp(dot / Math.sqrt(leftMagnitude * rightMagnitude));
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function scorePreferences(user: ScoreMap, candidate: ScoreMap): number {
  const keys = Object.keys(user).filter((key) => candidate[key] !== undefined);
  if (keys.length === 0) return 0.5;
  return clamp(1 - mean(keys.map((key) => Math.abs((user[key] ?? 0.5) - (candidate[key] ?? 0.5)))));
}

function scoreDifficultyFit(profile: ChampionLaneProfile, abilities: AbilityVector, beginner: boolean): number {
  const mapped: Record<string, string[]> = {
    inputComplexity: ['inputControl', 'taskSwitching'],
    aimDifficulty: ['clickAccuracy', 'prediction'],
    decisionComplexity: ['decisionQuality', 'decisionSpeed', 'taskSwitching'],
    macroRequirement: ['attentionDistribution', 'decisionQuality'],
    knowledgeRequirement: ['decisionQuality'],
    situationalDependence: ['prediction', 'attentionDistribution'],
  };
  const gaps: number[] = [];
  for (const [difficultyKey, abilityKeys] of Object.entries(mapped)) {
    const demand = profile.difficultyProfile[difficultyKey];
    if (demand === undefined) continue;
    const ability = mean(abilityKeys.map((key) => abilities[key as keyof AbilityVector] ?? 0.5));
    const tolerance = beginner && difficultyKey !== 'knowledgeRequirement' ? 0.05 : 0;
    gaps.push(Math.max(0, demand - ability - tolerance));
  }
  return clamp(1 - mean(gaps));
}

function scoreCandidate(input: RecommendationInput, profile: ChampionLaneProfile): Omit<RecommendationCandidate, 'category' | 'label' | 'reason'> & { eligibility: Record<string, boolean> } {
  const weights: ScoreMap = {};
  for (const key of ABILITY_KEYS) {
    const base = profile.requirementWeights[key] ?? 1;
    const confidence = input.confidence[key] ?? 0.5;
    weights[key] = base * (0.4 + 0.6 * confidence);
  }
  const styleMatch = weightedCosineSimilarity(input.abilities, profile.styleProfile, weights);
  let weightedShortfall = 0;
  let totalWeight = 0;
  let deficitCount = 0;
  let deficitAmount = 0;
  let criticalDeficit = false;
  for (const key of ABILITY_KEYS) {
    const requirement = profile.minimumRequirements[key] ?? 0;
    const weight = profile.requirementWeights[key] ?? 1;
    const userValue = input.abilities[key] ?? 0;
    const beginnerTolerance = input.experience.beginner && weight < 0.8 ? 0.05 : 0;
    const deficit = Math.max(0, requirement - beginnerTolerance - userValue);
    weightedShortfall += weight * deficit * deficit;
    totalWeight += weight;
    if (deficit >= 0.08) {
      deficitCount += 1;
      deficitAmount += deficit;
    }
    if (weight >= 0.8 && requirement - userValue >= 0.18) criticalDeficit = true;
  }
  const shortfall = totalWeight === 0 ? 0 : weightedShortfall / totalWeight;
  const readiness = Math.exp(-6 * shortfall);
  const preferenceMatch = scorePreferences(input.preferences, profile.preferenceProfile);
  const difficultyFit = scoreDifficultyFit(profile, input.abilities, input.experience.beginner);
  const foundationStrength = clamp(mean(ABILITY_KEYS.map((key) => {
    const requirement = profile.minimumRequirements[key] ?? 0;
    return (input.abilities[key] ?? 0) >= requirement ? 1 : 0;
  })));
  const deficitConcentration = deficitCount === 0 ? 1 : clamp(1 - Math.max(0, deficitCount - 1) / 4);
  const trainability = profile.trainingTags.length > 0 ? 1 : 0.35;
  const confidenceSupport = clamp(mean(ABILITY_KEYS.map((key) => input.confidence[key] ?? 0.5)));
  const growthReachability = 0.35 * deficitConcentration + 0.3 * trainability + 0.2 * foundationStrength + 0.15 * confidenceSupport;
  const longTermPotential = clamp(0.55 * styleMatch + 0.45 * preferenceMatch);
  const challengeAppeal = clamp(0.5 * preferenceMatch + 0.5 * (1 - difficultyFit));
  const futureDifficultyFit = clamp(0.7 * difficultyFit + 0.3 * trainability);
  const nowScore = 0.4 * styleMatch + 0.3 * readiness + 0.2 * preferenceMatch + 0.1 * difficultyFit;
  const growthScore = 0.4 * styleMatch + 0.3 * growthReachability + 0.15 * preferenceMatch + 0.15 * futureDifficultyFit;
  const aspirationScore = 0.4 * preferenceMatch + 0.3 * styleMatch + 0.2 * longTermPotential + 0.1 * challengeAppeal;
  const score = Math.max(nowScore, growthScore, aspirationScore);
  const hasTraining = profile.trainingTags.length > 0;
  const eligible = {
    ready_now: !criticalDeficit && Object.keys(input.confidence).every((key) => (input.confidence[key] ?? 0) >= 0.45) && preferenceMatch >= 0.25,
    growth_candidate: deficitCount >= 1 && deficitCount <= 3 && !criticalDeficit && hasTraining && foundationStrength >= 0.45 && styleMatch >= 0.3,
    aspirational: preferenceMatch >= 0.55 && styleMatch >= 0.25 && !criticalDeficit && hasTraining,
  };
  return {
    ...profile,
    score,
    shortfall,
    readiness,
    styleMatch,
    preferenceMatch,
    difficultyFit,
    growthReachability,
    longTermPotential,
    challengeAppeal,
    deficitCount,
    eligibility: { ...eligible, deficitCount: deficitCount <= 3, deficitAmount: deficitAmount <= 1 },
  };
}

function labelFor(category: RecommendationCandidate['category'], score: number): string {
  const level = score >= 0.78 ? 'veryHigh' : score >= 0.65 ? 'high' : 'moderate';
  const labels = {
    ready_now: { veryHigh: '非常に高い', high: '高い', moderate: '比較的高い' },
    growth_candidate: { veryHigh: '成長相性が非常に高い', high: '成長相性が高い', moderate: '挑戦する価値がある' },
    aspirational: { veryHigh: '長期的な相性が非常に高い', high: '長期的な相性が高い', moderate: '新しい可能性' },
  } as const;
  return labels[category][level];
}

function reasonFor(candidate: Pick<RecommendationCandidate, 'category' | 'championName' | 'lane'>): string {
  if (candidate.category === 'ready_now') return `${candidate.championName}の${candidate.lane}では、現在の強みをそのまま活かしやすい構成です。`;
  if (candidate.category === 'growth_candidate') return `${candidate.championName}の${candidate.lane}は、強みを土台に一部の操作や判断を練習すると伸ばしやすい候補です。`;
  return `プレイの好みと長期的な挑戦先としての相性があり、必要な難しさを練習で段階的に身につける候補です。`;
}

export function calculateRecommendations(input: RecommendationInput): RecommendationSet {
  const raw = input.candidates.flatMap((profile) => {
    const scored = scoreCandidate(input, profile);
    const scores = {
      ready_now: 0.4 * scored.styleMatch + 0.3 * scored.readiness + 0.2 * scored.preferenceMatch + 0.1 * scored.difficultyFit,
      growth_candidate: 0.4 * scored.styleMatch + 0.3 * scored.growthReachability + 0.15 * scored.preferenceMatch + 0.15 * (0.7 * scored.difficultyFit + 0.3 * (profile.trainingTags.length > 0 ? 1 : 0.35)),
      aspirational: 0.4 * scored.preferenceMatch + 0.3 * scored.styleMatch + 0.2 * scored.longTermPotential + 0.1 * scored.challengeAppeal,
    } as const;
    return (['ready_now', 'growth_candidate', 'aspirational'] as const)
      .filter((category) => scored.eligibility[category])
      .map((category) => ({ ...scored, category, score: scores[category] }));
  });
  const categoryOrder = { ready_now: 0, growth_candidate: 1, aspirational: 2 } as const;
  const championWinners = new Map<string, typeof raw[number]>();
  for (const candidate of raw.sort((a, b) => categoryOrder[a.category] - categoryOrder[b.category] || b.score - a.score)) {
    const current = championWinners.get(candidate.championId);
    if (!current || categoryOrder[candidate.category] < categoryOrder[current.category] || (candidate.category === current.category && candidate.score > current.score)) {
      championWinners.set(candidate.championId, candidate);
    }
  }
  const bucket = (category: RecommendationCandidate['category'], explanation: string): { items: RecommendationCandidate[]; explanation: string } => ({
    explanation,
    items: [...championWinners.values()]
      .filter((candidate) => candidate.category === category)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((candidate) => ({
        ...candidate,
        label: labelFor(category, candidate.score),
        reason: reasonFor({ ...candidate, category }),
        category,
      } as RecommendationCandidate)),
  });
  const toResult = (value: { items: RecommendationCandidate[]; explanation: string }) => ({
    primary: value.items[0],
    alternatives: value.items.slice(1),
    explanation: value.explanation,
  });
  return {
    readyNow: toResult(bucket('ready_now', '現在の能力を活かしやすい候補です。')),
    growthCandidate: toResult(bucket('growth_candidate', '強みを土台に練習で伸ばしやすい候補です。')),
    aspirational: toResult(bucket('aspirational', '好みと長期的な挑戦相性を重視した候補です。')),
  };
}

export function mergeRetestResults(previous: AbilityResult, retest: AbilityResult): AbilityResult {
  return {
    abilities: { ...previous.abilities, ...retest.abilities },
    subscores: { ...previous.subscores, ...retest.subscores },
    confidence: { ...previous.confidence, ...retest.confidence },
  };
}

export function mergeDiagnosticResults(previous: DiagnosticResult, retest: DiagnosticResult): DiagnosticResult {
  return { ...previous, ...mergeRetestResults(previous, retest), mode: previous.mode === 'detailed' ? 'detailed' : 'retest' };
}
