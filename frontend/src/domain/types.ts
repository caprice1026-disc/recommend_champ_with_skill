export const ABILITY_KEYS = [
  'reaction',
  'clickAccuracy',
  'inputControl',
  'prediction',
  'attentionDistribution',
  'taskSwitching',
  'decisionSpeed',
  'decisionQuality',
  'pressureStability',
  'recovery',
] as const;

export type AbilityKey = (typeof ABILITY_KEYS)[number];
export type Lane = 'TOP' | 'JUNGLE' | 'MID' | 'BOT' | 'SUPPORT';
export type ScoreMap = Partial<Record<string, number>>;
export type AbilityVector = Partial<Record<AbilityKey, number>>;

export interface NormalizationProfile {
  lowReference: number;
  highReference: number;
  direction: 'higher' | 'lower';
}

export interface InputControlSubscores {
  mouseSequenceControl: number;
  keyboardSequenceControl: number;
  mouseKeyboardCoordination: number;
  rhythmStability: number;
  misinputSuppression: number;
}

export interface ClickSubscores {
  hitRate: number;
  centerAccuracy: number;
  smallTargetAccuracy: number;
  longDistanceAccuracy: number;
  movingTargetAccuracy: number;
  continuousAccuracy: number;
}

export interface FeatureVector {
  reactionMedianScore: number;
  reactionStabilityScore: number;
  falseStartSuppression: number;
  clickHitRateScore: number;
  clickCenterAccuracyScore: number;
  clickSmallTargetScore: number;
  inputControl: InputControlSubscores;
  clickAccuracy?: ClickSubscores;
  predictionPositionAccuracy: number;
  predictionVelocityAdaptation: number;
  predictionPatternLearning: number;
  attentionPeripheralDetection: number;
  attentionCentralRetention: number;
  attentionPeripheralReaction: number;
  switchingPostAccuracy: number;
  switchingCostScore: number;
  switchingRuleRetention: number;
  decisionCorrectness: number;
  decisionInformationUtilization: number;
  decisionConsistency: number;
  correctDecisionSpeed: number;
  pressureDegradation: number;
  recoveryTrialCountScore: number;
  recoverySlopeScore: number;
  failureChainSuppression: number;
}

export interface AbilityResult {
  abilities: AbilityVector;
  subscores: {
    inputControl?: InputControlSubscores;
    clickAccuracy?: ClickSubscores;
  };
  confidence: Partial<Record<AbilityKey, number>>;
}

export interface QualityInput {
  validSampleScore: number;
  dispersionScore: number;
  frameStabilityScore: number;
  inputStabilityScore: number;
  completionScore: number;
}

export interface ConfidenceResult {
  value: number;
  label: string;
  effectiveWeight(baseWeight: number): number;
}

export interface ChampionLaneProfile {
  championId: string;
  championName: string;
  lane: Lane | string;
  profileMode?: 'derived' | 'explicit';
  styleProfile: ScoreMap;
  minimumRequirements: ScoreMap;
  requirementWeights: ScoreMap;
  preferenceProfile: ScoreMap;
  difficultyProfile: ScoreMap;
  strengthTags: string[];
  riskTags: string[];
  trainingTags: string[];
  reasonTags?: string[];
  iconUrl?: string;
  wikiUrl?: string;
  difficultyNote?: string;
}

export interface AptitudeTitle {
  id: string;
  name: string;
  description: string;
  signals: string[];
}

export interface RecommendationInput {
  abilities: AbilityVector;
  confidence: Partial<Record<string, number>>;
  preferences: ScoreMap;
  experience: { beginner: boolean };
  candidates: ChampionLaneProfile[];
}

export interface RecommendationCandidate extends ChampionLaneProfile {
  category: 'ready_now' | 'growth_candidate' | 'aspirational';
  score: number;
  label: string;
  reason: string;
  shortfall: number;
  readiness: number;
  styleMatch: number;
  preferenceMatch: number;
  difficultyFit: number;
  confidenceNote?: string;
  growthReachability: number;
  longTermPotential: number;
  challengeAppeal: number;
  deficitCount: number;
}

export interface RecommendationBucket {
  primary?: RecommendationCandidate;
  alternatives: RecommendationCandidate[];
  explanation: string;
}

export interface RecommendationSet {
  readyNow: RecommendationBucket;
  growthCandidate: RecommendationBucket;
  aspirational: RecommendationBucket;
}

export interface DiagnosticResult extends AbilityResult {
  sessionId?: string;
  mode?: 'quick' | 'detailed' | 'retest';
  recommendations?: RecommendationSet;
  aptitudeTitle: AptitudeTitle;
  createdAt?: string;
}
