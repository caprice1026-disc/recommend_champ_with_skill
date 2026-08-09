import { describe, expect, it } from 'vitest';
import { deriveAptitudeTitle } from '../aptitudeTitles';
import type { AbilityVector, ScoreMap } from '../types';

describe('deriveAptitudeTitle', () => {
  it('returns one descriptive title for the current profile', () => {
    const title = deriveAptitudeTitle(
      { reaction: 0.7, clickAccuracy: 0.8, inputControl: 0.8, prediction: 0.6 },
      { rangePreference: 0.7, complexityEnjoyment: 0.6 },
    );

    expect(title.id).toBeTruthy();
    expect(title.name).toBeTruthy();
    expect(title.description).toBeTruthy();
    expect(title.signals.length).toBeGreaterThan(0);
  });

  it('selects the precision title for high-accuracy input profiles', () => {
    const abilities: AbilityVector = {
      reaction: 0.9,
      clickAccuracy: 0.98,
      inputControl: 0.96,
      prediction: 0.88,
      attentionDistribution: 0.55,
      taskSwitching: 0.55,
      decisionSpeed: 0.7,
      decisionQuality: 0.6,
      pressureStability: 0.55,
      recovery: 0.55,
    };
    const preferences: ScoreMap = { rangePreference: 0.9, complexityEnjoyment: 0.8 };

    expect(deriveAptitudeTitle(abilities, preferences).id).toBe('precision-playmaker');
  });

  it('selects the team stability title for attentive supportive profiles', () => {
    const abilities: AbilityVector = {
      reaction: 0.55,
      clickAccuracy: 0.45,
      inputControl: 0.45,
      prediction: 0.65,
      attentionDistribution: 0.96,
      taskSwitching: 0.65,
      decisionSpeed: 0.55,
      decisionQuality: 0.96,
      pressureStability: 0.94,
      recovery: 0.96,
    };
    const preferences: ScoreMap = { teamSupport: 0.98, teamCoordination: 0.95, stabilityPreference: 0.9 };

    expect(deriveAptitudeTitle(abilities, preferences).id).toBe('team-anchor');
  });
});
