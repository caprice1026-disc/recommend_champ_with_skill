import { describe, expect, it } from 'vitest';
import {
  calculateAbilityScores,
  calculateConfidence,
  calculateRecommendations,
  mergeRetestResults,
  normalizeFeature,
} from '../scoring';
import type {
  AbilityResult,
  ChampionLaneProfile,
  FeatureVector,
  QualityInput,
  RecommendationInput,
} from '../types';

describe('normalizeFeature', () => {
  it('clamps a high-is-better feature to the 0..1 range', () => {
    expect(normalizeFeature(125, { lowReference: 0, highReference: 100, direction: 'higher' })).toBe(1);
    expect(normalizeFeature(-10, { lowReference: 0, highReference: 100, direction: 'higher' })).toBe(0);
  });

  it('reverses a low-is-better feature', () => {
    expect(normalizeFeature(250, { lowReference: 100, highReference: 300, direction: 'lower' })).toBe(0.25);
  });
});

describe('calculateAbilityScores', () => {
  it('uses the specification weights and keeps input-control subscores', () => {
    const features: FeatureVector = {
      reactionMedianScore: 0.8,
      reactionStabilityScore: 0.6,
      falseStartSuppression: 0.9,
      clickHitRateScore: 0.8,
      clickCenterAccuracyScore: 0.7,
      clickSmallTargetScore: 0.5,
      inputControl: {
        mouseSequenceControl: 0.9,
        keyboardSequenceControl: 0.8,
        mouseKeyboardCoordination: 0.7,
        rhythmStability: 0.6,
        misinputSuppression: 0.5,
      },
      predictionPositionAccuracy: 0.8,
      predictionVelocityAdaptation: 0.7,
      predictionPatternLearning: 0.6,
      attentionPeripheralDetection: 0.8,
      attentionCentralRetention: 0.7,
      attentionPeripheralReaction: 0.6,
      switchingPostAccuracy: 0.8,
      switchingCostScore: 0.7,
      switchingRuleRetention: 0.6,
      decisionCorrectness: 0.8,
      decisionInformationUtilization: 0.7,
      decisionConsistency: 0.6,
      correctDecisionSpeed: 0.75,
      pressureDegradation: 0.2,
      recoveryTrialCountScore: 0.8,
      recoverySlopeScore: 0.7,
      failureChainSuppression: 0.6,
    };

    const result = calculateAbilityScores(features);

    expect(result.abilities.reaction).toBeCloseTo(0.77);
    expect(result.abilities.clickAccuracy).toBeCloseTo(0.705);
    expect(result.abilities.inputControl).toBeCloseTo(0.735);
    expect(result.abilities.decisionSpeed).toBeCloseTo(0.6525);
    expect(result.abilities.pressureStability).toBeCloseTo(0.8);
    expect(result.subscores.inputControl?.mouseSequenceControl).toBe(0.9);
  });
});

describe('calculateConfidence', () => {
  it('maps confidence to language and adjusts recommendation dimensions without changing ability', () => {
    const quality: QualityInput = {
      validSampleScore: 0.9,
      dispersionScore: 0.8,
      frameStabilityScore: 1,
      inputStabilityScore: 0.9,
      completionScore: 1,
    };
    const confidence = calculateConfidence(quality);

    expect(confidence.value).toBeCloseTo(0.905);
    expect(confidence.label).toBe('測定は安定しています');
    expect(confidence.effectiveWeight(1)).toBeCloseTo(0.943);
  });
});

describe('calculateRecommendations', () => {
  it('scores lanes and champions, never repeats a champion, and does not fill with ineligible candidates', () => {
    const candidates: ChampionLaneProfile[] = [
      {
        championId: 'a', championName: 'アルファ', lane: 'TOP',
        styleProfile: { reaction: 0.9 }, minimumRequirements: { reaction: 0.4 },
        requirementWeights: { reaction: 1 }, preferenceProfile: { aggression: 0.8 },
        difficultyProfile: { inputComplexity: 0.2 }, strengthTags: ['速い'], riskTags: [], trainingTags: [],
      },
      {
        championId: 'a', championName: 'アルファ', lane: 'JUNGLE',
        styleProfile: { reaction: 0.7 }, minimumRequirements: { reaction: 0.4 },
        requirementWeights: { reaction: 1 }, preferenceProfile: { aggression: 0.8 },
        difficultyProfile: { inputComplexity: 0.2 }, strengthTags: ['速い'], riskTags: [], trainingTags: [],
      },
    ];
    const input: RecommendationInput = {
      abilities: { reaction: 0.8 },
      confidence: { reaction: 0.9 },
      preferences: { aggression: 0.8 },
      experience: { beginner: false },
      candidates,
    };

    const result = calculateRecommendations(input);

    expect(result.readyNow.primary?.championId).toBe('a');
    expect(result.readyNow.alternatives).toHaveLength(0);
    expect(result.readyNow.primary?.lane).toBe('TOP');
  });
});

describe('mergeRetestResults', () => {
  it('uses the latest valid result rather than selecting the highest score', () => {
    const previous: AbilityResult = {
      abilities: { reaction: 0.9 },
      subscores: {},
      confidence: { reaction: 0.8 },
    };
    const retest: AbilityResult = {
      abilities: { reaction: 0.6 },
      subscores: {},
      confidence: { reaction: 0.9 },
    };

    expect(mergeRetestResults(previous, retest).abilities.reaction).toBe(0.6);
  });
});
