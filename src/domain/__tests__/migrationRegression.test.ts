import { describe, expect, it } from 'vitest';
import { DEFAULT_CHAMPION_LANES, DEFAULT_PREFERENCES } from '../../client/data/defaultData';
import { calculateDiagnosticResult } from '../resultEngine';
import type { TestResult } from '../testTypes';

describe('migration recommendation regression', () => {
  it('keeps the representative recommendation baseline stable after the runtime migration', () => {
    const testIds: TestResult['testId'][] = [
      'reaction',
      'clickAccuracy',
      'inputControl',
      'prediction',
      'attentionDistribution',
      'taskSwitching',
      'decision',
      'mentalStability',
    ];
    const results: TestResult[] = testIds.map((testId) => ({
      testId,
      score: 0.8,
      quality: 0.9,
      abilityKeys: ['reaction'],
      validTrials: 8,
      totalTrials: 8,
      completed: true,
      rawTrialCount: 8,
    }));

    const result = calculateDiagnosticResult(
      results,
      DEFAULT_PREFERENCES,
      DEFAULT_CHAMPION_LANES,
      'detailed',
    );

    expect(result.aptitudeTitle.id).toBe('precision-playmaker');
    expect(result.recommendations?.readyNow.primary).toMatchObject({ championId: 'gragas', lane: 'TOP' });
    expect(result.recommendations?.aspirational.primary).toMatchObject({ championId: 'azir', lane: 'MID' });
  });
});
